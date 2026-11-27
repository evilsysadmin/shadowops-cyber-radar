'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {visibleCandidates,draftReport,normalizeBatch}=require('../lib/workbench.js');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const from='2026-11-21',through='2026-11-27';
const batch=normalizeBatch(reviewDisclosures(['Éxample','Other'].map(organization=>({organization,title:'Aviso de seguridad',summary:'Revisión técnica',sourceKind:'vendor',proposedType:'watch',publicationDate:through,incidentDate:null,url:'https://example.org/'+encodeURIComponent(organization)})),[],from,through));
const example=batch.candidates.find(c=>c.name==='Éxample');
const other=batch.candidates.find(c=>c.name==='Other');
test('search normalizes accents and combines all tokens, states and reasons',()=>{
 const decisions=new Map([[example.id,'investigate']]);
 assert.deepEqual(visibleCandidates(batch,decisions,{query:'EXAMPLE tecnica',state:'investigate',reason:'unseen_source'}).map(c=>c.id),[example.id]);
 assert.deepEqual(visibleCandidates(batch,decisions,{state:'pending'}).map(c=>c.id),[other.id]);
 assert.equal(visibleCandidates(batch,decisions,{reason:'historical_match'}).length,0);
 assert.equal(visibleCandidates(batch,decisions,{query:'example impossible'}).length,0);
});
test('filtering leaves batch and full-queue export unchanged',()=>{
 const choices=new Map(batch.candidates.map(c=>[c.id,'investigate']));
 const before=JSON.stringify(batch);
 assert.equal(visibleCandidates(batch,choices,{query:'no result'}).length,0);
 assert.equal(draftReport(batch,choices).candidates.length,2);
 assert.equal(JSON.stringify(batch),before);
});
