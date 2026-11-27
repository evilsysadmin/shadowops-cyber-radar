'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {compileDraft}=require('../lib/compile-draft.cjs');
test('browser compiler and CLI produce identical results from the same source',()=>{
 const context=vm.createContext({URL});
 for(const file of ['validation.js','editorial-contract.js','compile-draft.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../lib',file),'utf8'),context);
 const d={schemaVersion:1,kind:'editorial-draft',publicationReady:false,from:'2026-11-21',through:'2026-11-27',editorial:{pattern:'Pattern',action:'Action'},candidates:[{evidence:{id:'disclosure:https://example.org/report',source:'editor-curated disclosures',decision:'investigate',day:'2026-11-27',sources:[['Source','https://example.org/report']]},review:{verified:true,name:'Example',type:'watch',publicationDate:'2026-11-27',incident:'Unknown',vector:'Unknown',impact:'Unknown',lesson:'Check',tags:[],additionalSources:[['Other','https://example.org/report?utm_source=test']]}}]};
 assert.equal(JSON.stringify(context.RadarDraftCompiler.compileDraft(d)),JSON.stringify(compileDraft(d)));
 d.candidates[0].review.verified=false;
 assert.throws(()=>context.RadarDraftCompiler.compileDraft(d));assert.throws(()=>compileDraft(d));
});
