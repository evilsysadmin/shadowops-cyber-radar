'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {isoDate}=require('./kev.cjs');
const {normalizeBatch}=require('./workbench.js');
const root=path.join(__dirname,'..');
function rollingWindow(now=new Date()){
 const through=now.toISOString().slice(0,10);
 const start=new Date(through+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-6);
 return {from:start.toISOString().slice(0,10),through};
}
function collect({from,through,directory=path.join(root,'work'),spawn=spawnSync}){
 isoDate(from);isoDate(through);if(from>through)throw Error('Intervalo invertido');
 fs.mkdirSync(directory,{recursive:true,mode:0o700});
 if(!fs.lstatSync(directory).isDirectory())throw Error('Directorio de trabajo inválido');
 const target=path.join(directory,'revision-'+from+'--'+through+'.json');
 if(fs.existsSync(target))throw Error('La cola ya existe: '+target);
 const result=spawn(process.execPath,[path.join(root,'scripts/live-review.cjs'),from,through],{cwd:root,encoding:'utf8',timeout:210000,maxBuffer:8*1024*1024});
 if(result.error||result.status!==0)throw Error('Ingesta fallida: '+(result.error?.message||result.stderr?.trim()||'exit '+result.status));
 const raw=result.stdout;
 if(typeof raw!=='string'||Buffer.byteLength(raw)>4*1024*1024)throw Error('Cola demasiado grande');
 const queue=JSON.parse(raw),batch=normalizeBatch(queue);
 if(batch.source!=='weekly review'||batch.from!==from||batch.through!==through)throw Error('Cola o intervalo inesperado');
 const temporary=fs.mkdtempSync(path.join(directory,'.collect-'));
 try{
  const file=path.join(temporary,'queue.json');
  fs.writeFileSync(file,raw,{flag:'wx',mode:0o600});
  // Atomic publication without replacing a previous queue, even on concurrent runs.
  fs.linkSync(file,target);
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 return {file:target,candidates:batch.candidates.length};
}
module.exports={rollingWindow,collect};
