'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {weeklyBriefing}=require('../lib/weekly-briefing.cjs');
const {parseArchive}=require('../lib/review.cjs');
const root=path.join(__dirname,'..');
const edition=parseArchive(fs.readFileSync(path.join(root,'data/editions.js'),'utf8')).find(e=>e.id==='2026-11-27');
test('briefing includes published cases, source dates, incident dates and evidence',()=>{
 const text=weeklyBriefing(edition);
 assert.match(text,/6 fichas/);
 assert.match(text,/Brechas confirmadas: 2/);
 assert.match(text,/Explotación activa: 2/);
 assert.match(text,/Seguimiento \/ alertas: 2/);
 for(const item of edition.items){
  assert.ok(text.includes(item.name));
  for(const [,url] of item.sources)assert.ok(text.includes(new URL(url).href));
 }
 assert.match(text,/Lectura SRE \/ DevSecOps/);
});
test('source content cannot insert markdown headings or raw HTML; unsafe URLs rejected',()=>{
 const e=structuredClone(edition);
 e.items[0].name='Name\n# fake <script>alert(1)</script>';
 e.items[0].sources=[['bad ](https://evil.example)', 'https://example.org/path(a)']];
 const text=weeklyBriefing(e);
 assert.doesNotMatch(text,/\n# fake|<script>/);
 assert.ok(text.includes('https://example.org/path(a)'));
 e.items[0].sources=[['bad','javascript:alert(1)']];
 assert.throws(()=>weeklyBriefing(e));
});
test('CLI selects published edition and fails without output for missing date',()=>{
 const script=path.join(root,'scripts/weekly-briefing.cjs');
 const ok=spawnSync(process.execPath,[script,'2026-11-27'],{encoding:'utf8',timeout:5000});
 assert.equal(ok.status,0,ok.stderr);assert.equal(ok.stdout,weeklyBriefing(edition));
 const missing=spawnSync(process.execPath,[script,'2000-01-01'],{encoding:'utf8',timeout:5000});
 assert.notEqual(missing.status,0);assert.equal(missing.stdout,'');
});
