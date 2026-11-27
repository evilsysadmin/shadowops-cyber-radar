'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {rollingWindow,collect}=require('../lib/local-collection.cjs');
const from='2026-11-21',through='2026-11-27';
const queue={schemaVersion:1,source:'weekly review',from,through,batches:['CISA KEV','editor-curated disclosures'].map(source=>({schemaVersion:1,source,from,through,candidates:[]}))};
function dir(t){const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-collect-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;}
test('rolling window is seven inclusive UTC days across months and years',()=>{
 assert.deepEqual(rollingWindow(new Date('2027-01-02T01:00:00Z')),{from:'2026-12-27',through:'2027-01-02'});
});
test('collection validates, saves atomically and never overwrites prior queue',t=>{
 const directory=dir(t);let calls=0;
 const options={from,through,directory,spawn:(exe,args)=>{calls++;assert.equal(exe,process.execPath);assert.deepEqual(args.slice(-2),[from,through]);return {status:0,stdout:JSON.stringify(queue)};}};
 const result=collect(options);assert.equal(result.candidates,0);assert.deepEqual(JSON.parse(fs.readFileSync(result.file,'utf8')),queue);
 assert.equal(fs.statSync(result.file).mode&0o777,0o600);
 assert.throws(()=>collect(options),/ya existe/);assert.equal(calls,1);
 assert.deepEqual(fs.readdirSync(directory),[path.basename(result.file)]);
});
test('failed fetch, invalid JSON and mismatched interval leave no queue',t=>{
 const directory=dir(t);
 for(const response of [{status:1,stderr:'failed'},{status:0,stdout:'{'},{status:0,stdout:JSON.stringify({...queue,from:'2026-11-20'})}]){
  assert.throws(()=>collect({from,through,directory,spawn:()=>response}));assert.deepEqual(fs.readdirSync(directory),[]);
 }
});
