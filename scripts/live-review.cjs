'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {isoDate}=require('../lib/kev.cjs');
const {normalizeBatch}=require('../lib/workbench.js');
const root=path.join(__dirname,'..');
function run(command,args,source){
 const r=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024});
 if(r.error||r.status!==0)throw Error(source+' failed: '+(r.error?.message||r.stderr.trim()||'exit '+r.status));
 return r.stdout;
}
function main(){
 const [from,through,...args]=process.argv.slice(2);
 if(!from||!through||!(args.length===0||(args.length===4&&args[0]==='--offline')))throw Error('Usage: node scripts/live-review.cjs FROM THROUGH [--offline kev.json cisa.xml cloudflare.xml]');
 isoDate(from);isoDate(through);if(from>through)throw Error('Inverted interval');
 const offline=args.length>0;
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-live-'));
 try{
   const inputs=[];
   for(const [index,feed] of ['cisa','cloudflare'].entries()){
     const target=path.join(temp,feed+'.json');
     const flags=offline?['--local',path.resolve(args[index+2])]:[];
     const result=run('python3',[path.join(root,'scripts/discover-rss.py'),from,through,'--feed',feed,...flags],feed);
     fs.writeFileSync(target,result,{flag:'wx'});
     inputs.push('--rss',target);
     console.error(feed+': '+JSON.parse(result).length+' discovery entries');
   }
   const kev=offline?[path.resolve(args[1])]:[];
   const result=run(process.execPath,[path.join(root,'scripts/weekly-review.cjs'),from,through,...kev,...inputs],'weekly review / KEV');
   const batch=normalizeBatch(JSON.parse(result));
   console.error('Validated weekly queue: '+batch.candidates.length+' candidates');
   process.stdout.write(result);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
try{main();}catch(e){console.error(e.message);process.exitCode=1;}
