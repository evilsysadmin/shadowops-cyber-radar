'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createLocalServer,parsePort}=require('../scripts/serve-local.cjs');
async function start(t){
 const server=createLocalServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 return 'http://127.0.0.1:'+server.address().port;
}
test('local server exposes both UIs and their scripts with no-store and security headers',async t=>{
 const base=await start(t);
 for(const route of ['/','/review.html','/lib/workbench.js','/data/editions.js','/radar.css']){
  const r=await fetch(base+route);assert.equal(r.status,200,route);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-content-type-options'),'nosniff');await r.text();
 }
 const r=await fetch(base+'/');assert.doesNotMatch(r.headers.get('content-security-policy'),/unsafe-inline/);
 assert.equal((await fetch(base+'/',{method:'HEAD'})).status,200);
});
test('local server denies repository metadata, raw candidate files and write requests',async t=>{
 const base=await start(t);
 for(const route of ['/.git/config','/README.md','/data/disclosures.json','/work/revision.json','/scripts/live-review.cjs','/lib/','/%2e%2e%2fREADME.md']){
  const r=await fetch(base+route);assert.equal(r.status,404,route);
 }
 assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
 const http=require('node:http');const status=await new Promise((resolve,reject)=>{http.get(base+'/',{headers:{host:'foreign.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});assert.equal(status,403);
});
test('port validation rejects ambiguous and out-of-range input',()=>{
 assert.equal(parsePort(),8080);assert.equal(parsePort('9000'),9000);
 for(const port of ['0','65536','-1','abc','1.5'])assert.throws(()=>parsePort(port));
});
