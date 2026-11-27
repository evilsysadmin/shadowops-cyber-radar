'use strict';
const fs=require('node:fs');
const {makePacket,applySuggestions}=require('../lib/editorial-assistance.cjs');
function read(file){const raw=fs.readFileSync(file,'utf8');if(Buffer.byteLength(raw)>8*1024*1024)throw Error('Archivo demasiado grande');return JSON.parse(raw);}
try{
 const [mode,draft,response,...extra]=process.argv.slice(2);
 if(!draft||extra.length||!((mode==='request'&&!response)||(mode==='apply'&&response)))throw Error('Uso: node scripts/editorial-assistance.cjs request borrador.json | apply borrador.json respuesta.json');
 const input=read(draft);
 const result=mode==='request'?makePacket(input):applySuggestions(input,read(response));
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}catch(e){console.error(e.message);process.exitCode=1;}
