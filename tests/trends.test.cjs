'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {weeklySeries}=require('../lib/trends.js');
const row=(id,types)=>({id,period:id,items:types.map(type=>({type}))});
test('history sorts actual editions only, counts editorial categories, and preserves input',()=>{
 const editions=[row('2026-11-27',['breach','watch']),row('2026-11-06',['exploit']),row('2026-11-20',[])];
 const original=JSON.stringify(editions);
 assert.deepEqual(weeklySeries(editions),[
 {id:'2026-11-06',period:'2026-11-06',total:1,breach:0,exploit:1,watch:0},
 {id:'2026-11-20',period:'2026-11-20',total:0,breach:0,exploit:0,watch:0},
 {id:'2026-11-27',period:'2026-11-27',total:2,breach:1,exploit:0,watch:1}]);
 assert.equal(JSON.stringify(editions),original);
});
test('limits history to most recent actual editions without fabricating comparison',()=>{
 const editions=[row('2026-11-06',[]),row('2026-11-27',['watch'])];
 assert.deepEqual(weeklySeries([]),[]);assert.equal(weeklySeries([editions[0]]).length,1);
 assert.equal(weeklySeries(editions,1)[0].id,'2026-11-27');
 assert.throws(()=>weeklySeries(editions,0));assert.throws(()=>weeklySeries(editions,53));
});
