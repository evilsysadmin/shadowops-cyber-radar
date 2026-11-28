'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {build}=require('../scripts/build-static.cjs');
function temp(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-build-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function list(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);}
test('static build includes only dashboard runtime and published editions',t=>{
 const dest=path.join(temp(t),'dist');build(dest);
 assert.deepEqual(list(dest).sort(),['.nojekyll','_headers','data/editions.js','index.html','lib/domains.js','lib/editorial-contract.js','lib/radar-ui.js','lib/trends.js','lib/validation.js','radar.css']);
 const html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
 for(const m of html.matchAll(/<script[^>]*src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(dest,m[1])),m[1]);
 const repo=path.join(__dirname,'..');
 for(const file of list(dest).filter(f=>f!=='.nojekyll'))assert.deepEqual(fs.readFileSync(path.join(dest,file)),fs.readFileSync(path.join(repo,file)));
});
test('refuses existing output directory and preserves existing files',t=>{
 const dest=temp(t);fs.writeFileSync(path.join(dest,'keep'),'important');
 assert.throws(()=>build(dest));assert.equal(fs.readFileSync(path.join(dest,'keep'),'utf8'),'important');
});
test('CLI produces a portable package in a new directory',t=>{
 const dir=temp(t);const dest=path.join(dir,'site');
 const result=spawnSync(process.execPath,[path.join(__dirname,'../scripts/build-static.cjs'),dest],{encoding:'utf8',timeout:5000});
 assert.equal(result.status,0,result.stderr);assert.ok(fs.existsSync(path.join(dest,'index.html')));
});
