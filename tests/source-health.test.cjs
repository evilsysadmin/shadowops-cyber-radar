'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sourceHealth}=require('../lib/source-health.cjs');
test('checks all sources independently and reports zero as success',()=>{
 let calls=0;
 const report=sourceHealth('2026-11-21','2026-11-27',()=>{
  calls++;
  if(calls===1)return {status:1,stderr:'untrusted text'};
  if(calls===2)return {status:0,stdout:'[]'};
  return {status:0,stdout:'[{}]'};
 });
 assert.equal(calls,4);assert.equal(report.healthy,false);
 assert.deepEqual(report.results,[{source:'cisa-kev',status:'failed',reason:'fetch_or_parse_failed'},{source:'cisa-rss',status:'ok',candidates:0},{source:'cloudflare-rss',status:'ok',candidates:1},{source:'cert-fr-rss',status:'ok',candidates:1}]);
 assert.doesNotMatch(JSON.stringify(report),/untrusted text/);
});
test('invalid output and timeout are visible without aborting other probes',()=>{
 let calls=0;
 const report=sourceHealth('2026-11-21','2026-11-27',()=>{calls++;return calls===1?{status:0,stdout:'{"candidates":[]}'}:calls===2?{status:0,stdout:'{}'}:{error:{code:'ETIMEDOUT'}};});
 assert.deepEqual(report.results.map(r=>r.reason||r.status),['ok','invalid_output','timeout','timeout']);
 assert.throws(()=>sourceHealth('2026-02-30','2026-11-27',()=>{}));
});
