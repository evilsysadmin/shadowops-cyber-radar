'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {isoDate}=require('./kev.cjs');
const root=path.join(__dirname,'..');
function sourceHealth(from,through,spawn=spawnSync){
 isoDate(from);isoDate(through);if(from>through)throw Error('Intervalo invertido');
 const probes=[
  {id:'cisa-kev',command:process.execPath,args:['scripts/ingest-kev.cjs',from,through],extract:v=>v.candidates},
  ...['cisa','cloudflare','cert-fr'].map(id=>({id:id+'-rss',command:'python3',args:['scripts/discover-rss.py',from,through,'--feed',id],extract:v=>v}))
 ];
 const results=probes.map(p=>{
  try{
   const r=spawn(p.command,p.args,{cwd:root,encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024});
   if(r.error||r.status!==0)return {source:p.id,status:'failed',reason:r.error?.code==='ETIMEDOUT'?'timeout':'fetch_or_parse_failed'};
   const rows=p.extract(JSON.parse(r.stdout));
   if(!Array.isArray(rows))throw Error('Invalid output');
   return {source:p.id,status:'ok',candidates:rows.length};
  }catch{return {source:p.id,status:'failed',reason:'invalid_output'};}
 });
 return {from,through,healthy:results.every(r=>r.status==='ok'),results};
}
module.exports={sourceHealth};
