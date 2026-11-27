'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {technicalPatterns}=require('../lib/trends.js');
const edition=(id,tags)=>({id,items:tags.map(t=>({tags:t}))});
test('technical patterns count entries and edition presence separately, not unique incidents',()=>{
 const a=edition('2026-11-20',[['CI/CD','GitHub'],['CI/CD','cloud']]);
 const b=edition('2026-11-27',[['CI/CD'],['OT'],['unmapped']]);
 const result=technicalPatterns([b,a]);
 assert.equal(result.total,5);assert.equal(result.editionCount,2);
 assert.deepEqual(result.rows[0],{key:'delivery',label:'CI/CD y supply chain',entries:3,editions:2,latest:1});
 assert.equal(result.rows.find(r=>r.key==='cloud').latest,0);
 assert.equal(result.rows.find(r=>r.key==='industrial').editions,1);
});
test('no missing data is invented, limits apply, one edition stays one',()=>{
 assert.deepEqual(technicalPatterns([]),{total:0,editionCount:0,rows:[]});
 const rows=[edition('2026-11-06',[['cloud']]),edition('2026-11-27',[['IAM']])];
 const result=technicalPatterns(rows,1);
 assert.equal(result.editionCount,1);assert.equal(result.rows.length,1);assert.equal(result.rows[0].key,'identity');
 assert.throws(()=>technicalPatterns(rows,0));
});
