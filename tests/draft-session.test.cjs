'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {save,restore,clear}=require('../lib/draft-session.js');
function fixture(){return {schemaVersion:1,kind:'editorial-draft',publicationReady:false,from:'2026-11-21',through:'2026-11-27',editorial:{pattern:null,action:null},candidates:[{evidence:{id:'disclosure:https://example.org/report',name:'Example',title:'Report',summary:'Evidence',source:'editor-curated disclosures',day:'2026-11-27',decision:'investigate',sources:[['Example','https://example.org/report']]},review:{verified:false,name:null,type:null,publicationDate:null,incident:null,vector:null,impact:null,lesson:null,tags:[],additionalSources:[]}}]};}
function storage(){const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('unverified incomplete draft and selection survive reload; clear removes only draft',()=>{
 const s=storage(),d=fixture();s.map.set('unrelated','keep');assert.equal(save(s,d,0),true);
 assert.deepEqual(restore(s),{status:'restored',draft:d,selected:0});
 assert.equal(clear(s),true);assert.equal(restore(s).status,'empty');assert.equal(s.map.get('unrelated'),'keep');
});
test('invalid data, quota and blocked storage are not reported as saved',()=>{
 const s=storage(),d=fixture();assert.equal(save(s,d,0),true);assert.equal(save(s,d,9),false);assert.equal(restore(s).status,'empty');
 assert.equal(save(s,d,0),true);s.setItem=()=>{throw Error('quota');};assert.equal(save(s,d,0),false);assert.equal(restore(s).status,'empty');
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 assert.equal(restore(blocked).status,'unavailable');assert.equal(save(blocked,d,0),false);assert.equal(clear(blocked),false);
});
