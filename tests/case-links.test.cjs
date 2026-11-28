'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {caseHash,resolveCaseHash}=require('../lib/trends.js');
const item=(name,impact='Unknown')=>({name,type:'watch',date:'2026-11-27',incident:'Unknown',vector:'Unknown',impact,lesson:'Check',tags:[],sources:[['Report','https://example.org/report']]});
test('published references resolve exact cases, including repeated organization names',()=>{
 const edition={id:'2026-11-27',items:[item('Vendor'),item('Vendor','Different')]};
 const hash=caseHash(edition,1);assert.match(hash,/^#case=2026-11-27\/2\/[a-f0-9]{8}$/);
 assert.deepEqual(resolveCaseHash([edition],hash),{edition,index:1});
 const reordered={...edition,items:edition.items.slice().reverse()};
 assert.deepEqual(resolveCaseHash([reordered],hash),{edition:reordered,index:0});
 const changed={...edition,items:[item('Vendor'),item('Vendor','Corrected')]};
 assert.equal(resolveCaseHash([changed],hash),null);
});
test('unknown editions, malformed hashes and local imports fail closed',()=>{
 const edition={id:'2026-11-27',items:[item('Vendor')]};
 for(const hash of ['#case=2026-11-27/0/12345678','#case=2026-11-27/501/12345678','#case=2026-11-27/1/invalid','#case=2026-11-27/1/12345678','#other'])assert.equal(resolveCaseHash([edition],hash),null);
 assert.equal(resolveCaseHash([],caseHash(edition,0)),null);
 assert.throws(()=>caseHash({items:edition.items},0));assert.throws(()=>caseHash(edition,1));
});
