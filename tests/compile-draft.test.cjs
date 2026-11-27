'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compileDraft}=require('../lib/compile-draft.cjs');
const {normalizeBatch,draftReport}=require('../lib/workbench.js');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const {candidatesFromKev}=require('../lib/kev.cjs');
const {buildReviewQueue}=require('../lib/review.cjs');
const from='2026-11-21',through='2026-11-27';
const disclosure=()=>normalizeBatch(reviewDisclosures([{organization:'Example',title:'Report',summary:'Source summary',sourceKind:'vendor',proposedType:'watch',publicationDate:through,incidentDate:null,url:'https://example.org/report'}],[],from,through));
const kev=()=>normalizeBatch(buildReviewQueue({schemaVersion:1,source:'CISA KEV',from,through,candidates:candidatesFromKev({vulnerabilities:[{cveID:'CVE-2026-1001',dateAdded:through,vendorProject:'Example',product:'Router',vulnerabilityName:'Flaw',shortDescription:'Description',requiredAction:'Patch',dueDate:'2026-12-10'}]},from,through)},[]));
function draft(batch=disclosure()){
 return draftReport(batch,new Map([[batch.candidates[0].id,'investigate']]));
}
function filled(batch=disclosure()){
 const d=draft(batch);d.editorial={pattern:'Selected cases',action:'Review controls'};
 Object.assign(d.candidates[0].review,{verified:true,name:'Example',type:batch.source==='CISA KEV'?'exploit':'watch',publicationDate:through,incident:'Desconocida',vector:'No determinado',impact:'En investigación',lesson:'Revisar aviso',tags:batch.source==='CISA KEV'?['CVE-2026-1001']:['web'],additionalSources:[]});
 return d;
}
test('complete reviewed draft compiles without mutating original or inventing facts',()=>{
 const d=filled();const copy=JSON.stringify(d);const e=compileDraft(d);
 assert.equal(e.id,through);assert.equal(e.items[0].incident,'Desconocida');assert.equal(e.items[0].type,'watch');
 assert.deepEqual(e.items[0].sources,[['Example','https://example.org/report']]);assert.equal(JSON.stringify(d),copy);
});
test('incomplete, unverified, unsafe, duplicate and out-of-window drafts fail closed',()=>{
 assert.throws(()=>compileDraft(draft()));
 for(const edit of [d=>d.candidates[0].review.verified=false,d=>d.candidates[0].review.impact='',d=>d.candidates[0].review.publicationDate='2026-11-28',d=>d.candidates.push(d.candidates[0]),d=>d.candidates[0].review.additionalSources=[['bad','http://example.org/']],d=>d.candidates[0].evidence.id='forged',d=>d.editorial.pattern=null]){
  const d=filled();edit(d);assert.throws(()=>compileDraft(d));
 }
});
test('KEV retains listing date and CVE, cannot become a confirmed breach',()=>{
 const d=filled(kev());const e=compileDraft(d);
 assert.match(e.items[0].date,/incorporación a KEV/);
 assert.equal(e.items[0].type,'exploit');
 d.candidates[0].review.type='breach';assert.throws(()=>compileDraft(d));
});
test('additional evidence is canonicalized without replacing original provenance',()=>{
 const d=filled();d.candidates[0].review.additionalSources=[['Duplicate','https://example.org/report?utm_source=x'],['Second','https://example.org/second']];
 assert.deepEqual(compileDraft(d).items[0].sources,[['Example','https://example.org/report'],['Second','https://example.org/second']]);
});
