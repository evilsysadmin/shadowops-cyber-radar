'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {domainsFor,matchesDomain,domainCounts}=require('../lib/domains.js');
const {parseArchive}=require('../lib/review.cjs');
test('only explicit exact tags count, case and accents are normalized',()=>{
 assert.deepEqual(domainsFor({tags:['CI/CD',' GitHub ','IDENTIDAD','refrigeracion']}),['identity','delivery','industrial']);
 assert.deepEqual(domainsFor({tags:['cloudy','webhook','CVE-2026-1001'],lesson:'Enable MFA in Kubernetes'}),[]);
});
test('overlap does not double count items in a domain or inflate total',()=>{
 const items=[{tags:['CI/CD','GitHub','cloud']},{tags:['K8S']},{tags:[]}];
 const counts=domainCounts(items);
 assert.equal(counts.all,3);assert.equal(counts.delivery,1);assert.equal(counts.cloud,2);assert.equal(counts.unclassified,1);
 assert.equal(matchesDomain(items[2],'unclassified'),true);assert.equal(matchesDomain(items[0],'unclassified'),false);
 assert.equal(matchesDomain(items[0],'all'),true);assert.equal(matchesDomain(items[1],'delivery'),false);
});
test('published baseline is classified without inventing Kubernetes incidents',()=>{
 const archive=parseArchive(fs.readFileSync(path.join(__dirname,'../data/editions.js'),'utf8'));
 const baseline=archive.find(e=>e.id==='2026-11-27');
 const item=name=>baseline.items.find(i=>i.name===name);
 assert.ok(domainsFor(item('1Password')).includes('delivery'));
 assert.ok(domainsFor(item('Todoist')).includes('cloud'));
 assert.ok(domainsFor(item('Danfoss')).includes('industrial'));
 assert.ok(!domainsFor(item('Renfe')).includes('cloud'));
});
