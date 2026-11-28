'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {searchArchive,resolveCaseHash}=require('../lib/trends.js');
const item=(name,vector='Explotación remota')=>({name,type:'watch',date:'2026-11-27',incident:'Unknown',vector,impact:'Unknown',lesson:'Check',tags:['CVE-2026-1234'],sources:[['CERT-FR','https://example.org/report']]});
test('searches every supplied published edition, newest first, without merging same-name cases',()=>{
 const old={id:'2026-10-01',items:[item('Áurea')]},latest={id:'2026-11-27',items:[item('Áurea'),item('Other','Local')]};
 const editions=[old,latest],before=JSON.stringify(editions);
 const found=searchArchive(editions,'remota AUREA cert-fr');
 assert.equal(found.total,2);assert.deepEqual(found.results.map(r=>r.edition),[latest.id,old.id]);
 assert.deepEqual(resolveCaseHash(editions,found.results[1].hash),{edition:old,index:0});
 assert.equal(JSON.stringify(editions),before);
});
test('caps displayed results without truncating total and handles blank or unmatched queries',()=>{
 const editions=[{id:'2026-11-27',items:Array.from({length:5},(_,i)=>item('Vendor '+i))}];
 const r=searchArchive(editions,'vendor',2);assert.equal(r.total,5);assert.equal(r.results.length,2);
 assert.deepEqual(searchArchive(editions,'  '),{total:0,results:[]});
 assert.deepEqual(searchArchive(editions,'unmatched'),{total:0,results:[]});
 assert.throws(()=>searchArchive(editions,'vendor',0));
});
