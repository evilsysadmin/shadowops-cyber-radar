'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {matchesSearch}=require('../lib/trends.js');
test('search combines words independent of accents, order and case',()=>{
 const item={name:'Empresa Áurea',vector:'Explotación remota',impact:'Datos',tags:['CVE-2026-1234'],sources:[['CERT-FR','https://example.org/report']]};
 assert.equal(matchesSearch(item,'remota AUREA'),true);
 assert.equal(matchesSearch(item,'cve-2026-1234 cert-fr'),true);
 assert.equal(matchesSearch(item,'  '),true);
 assert.equal(matchesSearch(item,'aurea ransomware'),false);
});
