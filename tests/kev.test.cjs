'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const { FEED, candidatesFromKev, fetchKev } = require('../lib/kev.cjs');
const row = (cveID, dateAdded) => ({cveID,dateAdded,vendorProject:'Example',product:'Router',vulnerabilityName:'Example flaw',shortDescription:'Example description',requiredAction:'Apply mitigations',dueDate:'2026-12-10',knownRansomwareCampaignUse:'Unknown'});
const feed = {vulnerabilities:[row('CVE-2026-1000','2026-11-20'),row('CVE-2026-1001','2026-11-21'),row('CVE-2026-1002','2026-11-27'),row('CVE-2026-1003','2026-11-28')]};
test('inclusive dateAdded window, deterministic order, pending exploitation not breach', () => {
  const items = candidatesFromKev(feed,'2026-11-21','2026-11-27');
  assert.deepEqual(items.map(i=>i.cve), ['CVE-2026-1002','CVE-2026-1001']);
  assert.ok(items.every(i=>i.type==='exploit' && i.status==='pending' && i.incidentDate===null && i.sources[0][1].startsWith('https://www.cisa.gov/')));
});
test('empty windows remain empty; malformed catalog, duplicates and dates fail closed', () => {
  assert.deepEqual(candidatesFromKev(feed,'2026-12-01','2026-12-02'), []);
  for (const bad of [{}, {vulnerabilities:[null]}, {vulnerabilities:[feed.vulnerabilities[0],feed.vulnerabilities[0]]}, {vulnerabilities:[row('invalid','2026-11-23')]}]) assert.throws(()=>candidatesFromKev(bad,'2026-11-21','2026-11-27'));
  assert.throws(()=>candidatesFromKev(feed,'2026-02-30','2026-11-27'));
  assert.throws(()=>candidatesFromKev(feed,'2026-11-28','2026-11-27'));
});
test('fetch uses only fixed official feed, rejects redirects and bad HTTP', async () => {
  const data = await fetchKev(async (url,options)=>{assert.equal(url,FEED);assert.equal(options.redirect,'error');assert.ok(options.signal);return new Response(JSON.stringify(feed));});
  assert.deepEqual(data,feed);
  await assert.rejects(fetchKev(async()=>new Response('',{status:503})), /503/);
  await assert.rejects(fetchKev(async()=>new Response('invalid json')));
});
test('oversized response is rejected', async () => {
  await assert.rejects(fetchKev(async()=>new Response(new Uint8Array(10*1024*1024+1))), /grande/);
});
