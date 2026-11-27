'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadDraft,updateReview,markVerified}=require('../lib/draft-editor.js');
const {compileDraft}=require('../lib/compile-draft.cjs');
function fixture(){return {schemaVersion:1,kind:'editorial-draft',publicationReady:false,from:'2026-11-21',through:'2026-11-27',editorial:{pattern:'Patrón',action:'Acción'},candidates:[{evidence:{id:'disclosure:https://example.org/report',name:'Example',title:'Report',summary:'Evidence',source:'editor-curated disclosures',day:'2026-11-27',decision:'investigate',sources:[['Example','https://example.org/report']]},review:{verified:false,name:'Example',type:'watch',publicationDate:'2026-11-27',incident:'Desconocido',vector:'Desconocido',impact:'En investigación',lesson:'Revisar',tags:[],additionalSources:[]}}]};}
test('editor verifies complete fichas and invalidates verification after edits',()=>{
 const original=fixture(),d=loadDraft(original),id=d.candidates[0].evidence.id;
 markVerified(d,id,true);assert.equal(compileDraft(d).items.length,1);
 updateReview(d,id,'impact','New information');assert.equal(d.candidates[0].review.verified,false);assert.throws(()=>compileDraft(d));
 assert.equal(original.candidates[0].review.impact,'En investigación');assert.throws(()=>updateReview(d,id,'verified',true));
});
test('rejects unsafe sources, incomplete verification, and duplicate candidates',()=>{
 const d=fixture(),id=d.candidates[0].evidence.id;
 updateReview(d,id,'additionalSources',[['bad','javascript:alert(1)']]);assert.throws(()=>markVerified(d,id,true));assert.throws(()=>loadDraft(d));
 const x=fixture();x.candidates.push(x.candidates[0]);assert.throws(()=>loadDraft(x));
 const y=fixture();y.candidates[0].review.impact=null;assert.throws(()=>markVerified(y,id,true));
});
