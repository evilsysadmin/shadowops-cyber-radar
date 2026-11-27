'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mergeDisclosures}=require('../lib/merge-disclosures.cjs');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const {normalizeBatch}=require('../lib/workbench.js');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const from='2026-11-21',through='2026-11-27';
const row={organization:'Example',title:'Advisory',summary:'Pending source',sourceKind:'vendor',proposedType:'watch',publicationDate:through,incidentDate:null,url:'https://example.org/report'};
test('curated evidence wins exact canonical URL; new discoveries remain watch',()=>{
 const curated={...row,proposedType:'breach',summary:'Verified by editor'};
 const other={...row,url:'https://example.org/other'};
 const result=mergeDisclosures([curated],[[{...row,url:row.url+'?utm_source=rss'},other,other]],from,through);
 assert.equal(result.length,2);assert.equal(result[0].summary,'Verified by editor');
 const queue=normalizeBatch(reviewDisclosures(result,[],from,through));
 assert.equal(queue.candidates.find(c=>c.id.endsWith('/other')).proposedType,'watch');
});
test('rejects conflicting discoveries and invalid proposed breach even when URL is curated',()=>{
 assert.throws(()=>mergeDisclosures([],[[row,{...row,title:'Different'}]],from,through),/conflicto/);
 assert.throws(()=>mergeDisclosures([row],[[{...row,proposedType:'breach'}]],from,through));
 assert.throws(()=>mergeDisclosures([],[[{...row,url:'javascript:alert(1)'}]],from,through));
});
test('weekly CLI imports RSS JSON and fails closed on malformed input',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-rss-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const kev=path.join(dir,'kev.json'),rss=path.join(dir,'rss.json');
 fs.writeFileSync(kev,JSON.stringify({vulnerabilities:[]}));fs.writeFileSync(rss,JSON.stringify([row]));
 const args=[path.join(__dirname,'../scripts/weekly-review.cjs'),from,through,kev,'--rss',rss];
 const run=()=>spawnSync(process.execPath,args,{encoding:'utf8',timeout:10000});
 let result=run();assert.equal(result.status,0,result.stderr);
 const batch=normalizeBatch(JSON.parse(result.stdout));
 assert.ok(batch.candidates.some(c=>c.id==='disclosure:'+row.url&&c.proposedType==='watch'));
 fs.writeFileSync(rss,'{');result=run();assert.notEqual(result.status,0);assert.equal(result.stdout,'');
});
