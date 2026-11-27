'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {candidatesFromKev}=require('../lib/kev.cjs');
const {parseArchive,buildReviewQueue}=require('../lib/review.cjs');
const row=(n)=>({cveID:'CVE-2026-'+n,dateAdded:'2026-11-25',vendorProject:'Vendor',product:'Router',vulnerabilityName:'Flaw',shortDescription:'Description',requiredAction:'Patch',dueDate:'2026-12-10'});
const batch={schemaVersion:1,source:'CISA KEV',from:'2026-11-21',through:'2026-11-27',candidates:candidatesFromKev({vulnerabilities:[row(1001),row(1002),row(1003)]},'2026-11-21','2026-11-27')};
const editions=[{id:'2026-11-27',items:[{name:'Vendor',type:'exploit',tags:['cve-2026-1001','CVE-2026-1001']}]},{id:'2026-11-20',items:[{name:'Vendor',type:'watch',tags:['CVE-2026-1002']}]}];
test('distinguishes new CVEs, historical updates and current coverage without hiding candidates',()=>{
  const result=buildReviewQueue(batch,editions);
  assert.deepEqual(result.counts,{new_cve:1,historical_match:1,covered_in_window:1});
  assert.deepEqual(result.candidates.map(c=>c.reviewReason),['covered_in_window','historical_match','new_cve']);
  assert.equal(result.candidates[0].references.length,1);
  assert.ok(result.candidates.every(c=>c.status==='pending'));
  assert.equal(batch.candidates[0].reviewReason,undefined);
});
test('deduplicates identical candidates but fails on conflicting duplicates',()=>{
  const c=batch.candidates[0];
  assert.equal(buildReviewQueue({...batch,candidates:[c,c]},editions).candidates.length,1);
  assert.throws(()=>buildReviewQueue({...batch,candidates:[c,{...c,title:'Different'}]},editions),/conflicto/);
});
test('rejects invalid candidate identity, evidence, date and publication state',()=>{
  const c=batch.candidates[0];
  for(const change of [{status:'published'},{id:'other'},{dateAdded:'2026-11-28'},{sources:[['Fake','https://example.org/']]}]){
    assert.throws(()=>buildReviewQueue({...batch,candidates:[{...c,...change}]},editions));
  }
});
test('archive parser reads JSON without executing JavaScript',()=>{
  assert.deepEqual(parseArchive('const RADAR_EDITIONS = '+JSON.stringify(editions)+';\n'),editions);
  assert.throws(()=>parseArchive('const RADAR_EDITIONS = []; console.log(1);'));
  assert.throws(()=>parseArchive('const RADAR_EDITIONS = '+JSON.stringify([editions[0],editions[0]])+';'));
});
