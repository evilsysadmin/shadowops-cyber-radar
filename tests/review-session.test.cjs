'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {save,restore,clear}=require('../lib/review-session.js');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const queue=reviewDisclosures([{organization:'Example',title:'Incident',summary:'Report',sourceKind:'cert',proposedType:'watch',publicationDate:'2026-11-25',incidentDate:null,url:'https://example.org/report'}],[],'2026-11-21','2026-11-27');
const id=queue.candidates[0].id;
function storage(){const map=new Map();return {map,setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)??null,removeItem:k=>map.delete(k)};}
test('session roundtrip revalidates original queue and decisions',()=>{
 const s=storage();assert.equal(restore(s).status,'empty');
 assert.equal(save(s,queue,new Map([[id,'investigate']])),true);
 const result=restore(s);assert.equal(result.status,'restored');assert.equal(result.decisions.get(id),'investigate');assert.equal(result.batch.candidates[0].id,id);
 assert.equal(clear(s),true);assert.equal(restore(s).status,'empty');
});
test('corrupt or tampered snapshots fail closed',()=>{
 const s=storage();save(s,queue,new Map());const key=[...s.map.keys()][0];
 for(const bad of ['{',JSON.stringify({version:2}),JSON.stringify({version:1,queue,decisions:[['unknown','covered']]}),JSON.stringify({version:1,queue,decisions:[[id,'published']]})]){
   s.map.set(key,bad);assert.equal(restore(s).status,'unavailable');
 }
});
test('failed write invalidates stale snapshot if storage allows deletion',()=>{
 const s=storage();save(s,queue,new Map());s.setItem=()=>{throw Error('quota')};
 assert.equal(save(s,queue,new Map([[id,'covered']])),false);assert.equal(restore(s).status,'empty');
});
test('blocked storage degrades without throwing',()=>{
 const fail=()=>{throw Error('blocked')};const s={getItem:fail,setItem:fail,removeItem:fail};
 assert.equal(save(s,queue,new Map()),false);assert.equal(restore(s).status,'unavailable');assert.equal(clear(s),false);
});
