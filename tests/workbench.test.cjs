'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeBatch,decisionReport}=require('../lib/workbench.js');
const {candidatesFromKev}=require('../lib/kev.cjs');
const {buildReviewQueue}=require('../lib/review.cjs');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const from='2026-11-21',through='2026-11-27';
const row={cveID:'CVE-2026-1001',dateAdded:from,vendorProject:'Vendor',product:'Router',vulnerabilityName:'Flaw',shortDescription:'Description',requiredAction:'Patch',dueDate:'2026-12-10'};
const kev=()=>buildReviewQueue({schemaVersion:1,source:'CISA KEV',from,through,candidates:candidatesFromKev({vulnerabilities:[row]},from,through)},[]);
const disclosures=()=>reviewDisclosures([{organization:'Example',title:'Incident',summary:'Report',sourceKind:'cert',proposedType:'watch',publicationDate:from,incidentDate:null,url:'https://example.org/report'}],[],from,through);
test('workbench accepts both generated queue formats',()=>{
 const a=normalizeBatch(kev()),b=normalizeBatch(disclosures());
 assert.equal(a.candidates[0].name,'Vendor / Router');assert.equal(b.candidates[0].name,'Example');
 assert.equal(a.candidates[0].incidentDate,null);assert.equal(b.candidates[0].proposedType,'watch');
});
test('unsafe links, duplicate IDs, bogus dates and statuses fail closed',()=>{
 for(const mutate of [b=>b.candidates.push(b.candidates[0]),b=>b.candidates[0].sources=[['fake','javascript:alert(1)']],b=>b.candidates[0].sources=[['fake','https://example.org']],b=>b.candidates[0].status='published',b=>b.candidates[0].dateAdded='2026-02-30']){
  const b=kev();mutate(b);assert.throws(()=>normalizeBatch(b));
 }
});
test('decision reports keep provenance, pending defaults and never create published items',()=>{
 const batch=normalizeBatch(kev()),c=batch.candidates[0];
 const report=decisionReport(batch,new Map([[c.id,'investigate']]));
 assert.equal(report.decisions[0].decision,'investigate');assert.deepEqual(report.decisions[0].sources,c.sources);
 assert.equal(decisionReport(batch,new Map()).decisions[0].decision,'pending');
 assert.throws(()=>decisionReport(batch,new Map([[c.id,'published']])));
 assert.ok(!Object.hasOwn(report,'items'));
});
test('review UI script parses',()=>new vm.Script(readFileSync(join(__dirname,'../lib/workbench-ui.js'),'utf8')));
