'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {build}=require('../scripts/build-static.cjs');
function inventory(dir,prefix=''){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const rel=prefix+entry.name,absolute=path.join(dir,entry.name);
  if(entry.isDirectory())return inventory(absolute,rel+'/');
  if(!entry.isFile())throw Error('Unexpected non-regular asset: '+rel);
  const bytes=fs.readFileSync(absolute);
  return [{path:rel,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}];
 }).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
function manifest(dir,sha){
 if(typeof sha!=='string'||! /^[a-f0-9]{40}$/.test(sha))throw Error('Exact Git commit SHA required');
 const files=inventory(dir);
 if(files.some(f=>f.path==='release.json'))throw Error('Release manifest already exists');
 return {schemaVersion:1,repository:'evilsysadmin/shadowops-cyber-radar',sourceSha:sha,files,contentSha256:crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex')};
}
function candidate(destination,sha){
 if(typeof sha!=='string'||! /^[a-f0-9]{40}$/.test(sha))throw Error('Exact Git commit SHA required');
 const output=build(destination);
 try{
  const release=manifest(output,sha);
  fs.writeFileSync(path.join(output,'release.json'),JSON.stringify(release,null,2)+'\n',{flag:'wx'});
  return release;
 }catch(error){fs.rmSync(output,{recursive:true,force:true});throw error;}
}
function verify(dir,sha){
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'release.json'),'utf8'));
 const files=inventory(dir).filter(f=>f.path!=='release.json');
 if(!/^[a-f0-9]{40}$/.test(sha)||saved.schemaVersion!==1||saved.repository!=='evilsysadmin/shadowops-cyber-radar'||saved.sourceSha!==sha||JSON.stringify(saved.files)!==JSON.stringify(files)||saved.contentSha256!==crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex'))throw Error('Release integrity or source SHA mismatch');
 return saved;
}
module.exports={candidate,verify};
