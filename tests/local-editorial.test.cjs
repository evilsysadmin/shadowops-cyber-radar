'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assistLocal}=require('../lib/local-editorial.cjs');
const {normalizeBatch,draftReport}=require('../lib/workbench.js');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
function fixture(){
 const rows=['one','two'].map(x=>({organization:'Example',title:'Alert',summary:'Untrusted evidence',sourceKind:'vendor',proposedType:'watch',publicationDate:'2026-11-27',incidentDate:null,url:'https://example.org/'+x}));
 const batch=normalizeBatch(reviewDisclosures(rows,[],'2026-11-21','2026-11-27'));
 return draftReport(batch,new Map(batch.candidates.map(c=>[c.id,'investigate'])));
}
function reply(id,type='watch'){
 return new Response(JSON.stringify({done:true,message:{content:JSON.stringify({schemaVersion:1,kind:'editorial-assistance-response',suggestions:[{id,name:'Example',type,publicationDate:'2026-11-27',incident:'Desconocido',vector:'Desconocido',impact:'En investigación',lesson:'Revisar aviso',tags:[]}]})}}));
}
test('uses fixed loopback endpoint, one candidate per request, and preserves verification gate',async()=>{
 const draft=fixture(),original=JSON.stringify(draft);let calls=0;
 const result=await assistLocal(draft,'qwen:7b',{fetcher:async(url,options)=>{
  calls++;assert.equal(url,'http://127.0.0.1:11434/api/chat');assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);assert.equal(body.model,'qwen:7b');assert.equal(body.stream,false);
  assert.equal(body.messages[0].role,'system');assert.doesNotMatch(body.messages[0].content,/Untrusted evidence/);
  const packet=JSON.parse(body.messages[1].content);assert.equal(packet.candidates.length,1);
  return reply(packet.candidates[0].id);
 }});
 assert.equal(calls,2);assert.equal(result.suggestions,2);assert.ok(result.draft.candidates.every(c=>c.review.name==='Example'&&!c.review.verified));
 assert.equal(JSON.stringify(draft),original);
});
test('rejects cross-candidate response, escalation, HTTP and incomplete response',async()=>{
 const draft=fixture(),first=draft.candidates[0].evidence.id,second=draft.candidates[1].evidence.id;
 for(const fetcher of [async()=>reply(second),async()=>reply(first,'breach'),async()=>new Response('',{status:503}),async()=>new Response('{"done":false}'),async()=>new Response('x'.repeat(513*1024))])await assert.rejects(assistLocal(draft,'local-model',{fetcher}));
});
test('verified candidates never go to model; invalid model fails before network',async()=>{
 const d=fixture();for(const c of d.candidates)c.review.verified=true;
 const fetcher=async()=>{throw Error('unexpected request');};
 const r=await assistLocal(d,'local-model',{fetcher});assert.equal(r.requests,0);
 await assert.rejects(assistLocal(d,'../model',{fetcher}),/Modelo/);
});
