'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {canonical,reviewDisclosures,parseArchive}=require('../lib/disclosures.cjs');
const root=path.join(__dirname,'..');
const records=JSON.parse(fs.readFileSync(path.join(root,'data/disclosures.json'),'utf8'));
const archive=parseArchive(fs.readFileSync(path.join(root,'data/editions.js'),'utf8'));
const run=(rows=records,editions=archive)=>reviewDisclosures(rows,editions,'2026-11-21','2026-11-27');
test('curated disclosures are pending, sourced, and matched to the archive',()=>{
 const result=run();
 assert.equal(result.candidates.length,2);
 assert.ok(result.candidates.every(c=>c.status==='pending'&&c.reviewReason==='covered_in_window'&&c.references.length));
 assert.ok(result.candidates.every(c=>!Object.hasOwn(c,'type')));
});
test('canonicalizes tracking and fragments, preserves meaningful query parameters',()=>{
 assert.equal(canonical('https://example.org/news/?utm_source=x&b=2&a=1#top'),'https://example.org/news?a=1&b=2');
 for(const v of ['http://example.org','https://trusted.org@other.org','javascript:alert(1)'])assert.throws(()=>canonical(v));
});
test('deduplicates exact records and rejects contradictory duplicates',()=>{
 const r=records[0];
 assert.equal(run([r,{...r,url:r.url+'?utm_source=x'}]).candidates.length,1);
 assert.throws(()=>run([r,{...r,summary:'changed'}]),/conflicto/);
});
test('date and source checks fail closed; unknown date remains unknown',()=>{
 const r=records[0];
 for(const patch of [{sourceKind:'rumor'},{publicationDate:'2026-02-30'},{incidentDate:'2026-12-01'},{proposedType:'unknown'}])assert.throws(()=>run([{...r,...patch}]));
 assert.equal(run([{...r,publicationDate:'2026-11-20'}]).candidates.length,0);
 assert.equal(run([r],[]).candidates[0].incidentDate,null);
 assert.equal(run([r],[]).candidates[0].reviewReason,'unseen_source');
});
