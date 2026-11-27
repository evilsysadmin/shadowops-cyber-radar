'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {normalizeBatch,decisionReport}=require('../lib/workbench.js');
const root=path.join(__dirname,'..');
const from='2026-11-21',through='2026-11-27';
const row={cveID:'CVE-2026-1001',dateAdded:through,vendorProject:'Vendor',product:'Router',vulnerabilityName:'Flaw',shortDescription:'Description',requiredAction:'Patch',dueDate:'2026-12-10'};
function run(t, extra=[]){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-weekly-'));
 t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const kev=path.join(tmp,'kev.json');
 fs.writeFileSync(kev,JSON.stringify({vulnerabilities:[row]}));
 return spawnSync(process.execPath,[path.join(root,'scripts/weekly-review.cjs'),from,through,kev,...extra],{encoding:'utf8',timeout:10000});
}
test('weekly CLI produces one offline importable batch with both sources',t=>{
 const result=run(t);
 assert.equal(result.status,0,result.stderr);
 const raw=JSON.parse(result.stdout);
 const batch=normalizeBatch(raw);
 assert.equal(batch.candidates.length,3);
 assert.equal(batch.candidates[0].id,'kev:CVE-2026-1001');
 assert.deepEqual(new Set(batch.candidates.map(c=>c.source)),new Set(['CISA KEV','editor-curated disclosures']));
 assert.ok(decisionReport(batch,new Map()).decisions.every(c=>c.decision==='pending'));
});
test('weekly input rejects duplicate sources, mismatched intervals and nested queues',t=>{
 const result=run(t);assert.equal(result.status,0,result.stderr);
 const raw=JSON.parse(result.stdout);
 for(const batches of [[raw.batches[0],raw.batches[0]],[raw.batches[0],{...raw.batches[1],through:'2026-11-26'}],[raw.batches[0],raw]]){
  assert.throws(()=>normalizeBatch({...raw,batches}));
 }
});
test('CLI failure emits no partial JSON',t=>{
 const result=run(t,['/nonexistent/disclosures.json']);
 assert.notEqual(result.status,0);assert.equal(result.stdout,'');
});
