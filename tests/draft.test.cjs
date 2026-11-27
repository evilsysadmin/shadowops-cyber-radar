'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeBatch,draftReport}=require('../lib/workbench.js');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const {validateEdition}=require('../lib/validation.js');
const records=['A','B','C','D'].map(organization=>({organization,title:'Incident',summary:'Source report',sourceKind:'cert',proposedType:'breach',publicationDate:'2026-11-25',incidentDate:null,url:'https://example.org/'+organization}));
const batch=normalizeBatch(reviewDisclosures(records,[],'2026-11-21','2026-11-27'));
test('draft includes only explicitly selected investigation candidates, with evidence and no invented facts',()=>{
 const [a,b,c]=batch.candidates;
 const draft=draftReport(batch,new Map([[a.id,'investigate'],[b.id,'covered'],[c.id,'dismiss']]));
 assert.deepEqual(draft.counts,{pending:1,investigate:1,covered:1,dismiss:1});
 assert.equal(draft.candidates.length,1);
 assert.equal(draft.candidates[0].evidence.id,a.id);
 assert.deepEqual(draft.candidates[0].evidence.sources,a.sources);
 assert.equal(draft.candidates[0].review.type,null);
 assert.equal(draft.candidates[0].review.impact,null);
 assert.equal(draft.candidates[0].review.verified,false);
 assert.equal(draft.publicationReady,false);
 assert.throws(()=>validateEdition(draft));
});
test('empty selections stay empty and invalid decisions fail',()=>{
 assert.deepEqual(draftReport(batch,new Map()).candidates,[]);
 assert.throws(()=>draftReport(batch,new Map([[batch.candidates[0].id,'published']])));
});
