'use strict';
const {makePacket,applySuggestions}=require('./editorial-assistance.cjs');
const endpoint='http://127.0.0.1:11434/api/chat';
const maxBytes=512*1024;
async function readBounded(response){
 if(!response.ok||!response.body)throw Error('Ollama HTTP '+response.status);
 const reader=response.body.getReader();const chunks=[];let size=0;
 try{
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw Error('Respuesta de modelo demasiado grande');chunks.push(Buffer.from(value));}
 }catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function assistLocal(draft,model,{fetcher=fetch,timeout=120000}={}){
 if(typeof model!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,127}$/.test(model)||model.includes('..'))throw Error('Modelo inválido');
 if(!Number.isInteger(timeout)||timeout<1||timeout>300000)throw Error('Timeout inválido');
 const packet=makePacket(draft);
 if(!packet.candidates.length)return {draft,suggestions:0,requests:0};
 if(packet.candidates.length>20)throw Error('Selecciona como máximo 20 candidatos por ejecución');
 let output=draft,suggestions=0,requests=0;
 for(const candidate of packet.candidates){
  const body={model,stream:false,format:'json',options:{temperature:0,num_predict:2048},messages:[
   {role:'system',content:packet.instructions.join('\n')+'\nFormato JSON: '+JSON.stringify(packet.responseFormat)},
   {role:'user',content:JSON.stringify({kind:packet.kind,from:packet.from,through:packet.through,candidates:[candidate]})}
  ]};
  if(Buffer.byteLength(JSON.stringify(body))>64*1024)throw Error('Evidencia demasiado grande');
  const response=await fetcher(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(timeout)});
  requests++;
  const envelope=await readBounded(response);
  if(envelope.done!==true||typeof envelope.message?.content!=='string')throw Error('Respuesta incompleta de Ollama');
  const parsed=JSON.parse(envelope.message.content);
  if(!Array.isArray(parsed.suggestions)||parsed.suggestions.length>1||parsed.suggestions.some(s=>s?.id!==candidate.id))throw Error('Respuesta fuera del candidato solicitado');
  output=applySuggestions(output,parsed);
  suggestions+=parsed.suggestions.length;
 }
 return {draft:output,suggestions,requests};
}
module.exports={assistLocal};
