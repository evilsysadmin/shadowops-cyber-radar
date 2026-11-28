'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {evidenceMatches}=require('../lib/trends.js');
const item=(name,tags=[],sources=[])=>({name,type:'watch',tags,sources});
const week=(id,items)=>({id,items});
test('groups explicit CVE and canonical source across distinct editions, not provider names',()=>{
 const a=week('2026-11-20',[item('Same vendor',['cve-2026-1234','CVE-2026-1234'],[['Report','https://example.org/report/?utm_source=x#top']]),item('Other',[],[['Home','https://example.org/']])]);
 const b=week('2026-11-27',[item('Different name',['CVE-2026-1234'],[['Report','https://example.org/report']]),item('Same vendor',[],[['Home','https://example.org/']])]);
 const before=JSON.stringify([a,b]);const result=evidenceMatches([b,a]);
 assert.equal(result.length,2);
 assert.ok(result.every(g=>g.editionCount===2&&g.refs.length===2));
 assert.equal(result.find(g=>g.kind==='cve').refs[1].name,'Different name');
 assert.equal(result.find(g=>g.kind==='url').value,'https://example.org/report');
 assert.equal(JSON.stringify([a,b]),before);assert.deepEqual(evidenceMatches([a,b],1),[]);
});
test('ignores same-week repetition, generic KEV catalog and unsafe sources; keeps meaningful parameters',()=>{
 const a=week('2026-11-20',[item('A',['CVE-2026-9999'],[['a','https://example.org/report?id=1'],['KEV','https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=CVE-2026-9999']]),item('B',['CVE-2026-9999'])]);
 const b=week('2026-11-27',[item('A',[],[['a','https://example.org/report?id=2'],['KEV','https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=CVE-2026-9999'],['bad','javascript:alert(1)']])]);
 assert.deepEqual(evidenceMatches([a,b]),[]);assert.throws(()=>evidenceMatches([a],0));
});
