'use strict';
const FEED = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const EVIDENCE = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';
const MAX_BYTES = 10 * 1024 * 1024;
const {isoDate}=require('./editorial-contract.js');
function required(value, name, max = 5000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Campo KEV inválido: ' + name);
  return value.trim();
}
function candidatesFromKev(catalog, from, through) {
  isoDate(from); isoDate(through);
  if (from > through) throw Error('Intervalo invertido');
  if (!catalog || !Array.isArray(catalog.vulnerabilities) || catalog.vulnerabilities.length > 20000) throw Error('Catálogo KEV inválido');
  const seen = new Set(), candidates = [];
  for (const row of catalog.vulnerabilities) {
    if (!row || typeof row !== 'object') throw Error('Registro KEV inválido');
    const cve = required(row.cveID, 'cveID', 40);
    if (!/^CVE-\d{4}-\d{4,}$/.test(cve) || seen.has(cve)) throw Error('CVE inválido o duplicado: ' + cve);
    seen.add(cve);
    const date = isoDate(row.dateAdded);
    if (date < from || date > through) continue;
    const vendor = required(row.vendorProject, 'vendorProject', 200);
    const product = required(row.product, 'product', 200);
    candidates.push({
      id: 'kev:' + cve, status: 'pending', type: 'exploit', cve, vendor, product,
      dateAdded: date, incidentDate: null,
      title: required(row.vulnerabilityName, 'vulnerabilityName', 500),
      description: required(row.shortDescription, 'shortDescription'),
      requiredAction: required(row.requiredAction, 'requiredAction'),
      dueDate: isoDate(row.dueDate),
      ransomware: ['Known', 'Unknown'].includes(row.knownRansomwareCampaignUse) ? row.knownRansomwareCampaignUse : 'Unknown',
      sources: [['CISA KEV · ' + cve, EVIDENCE + '?search_api_fulltext=' + cve]]
    });
  }
  return candidates.sort((a,b) => b.dateAdded.localeCompare(a.dateAdded) || a.cve.localeCompare(b.cve));
}
async function fetchKev(fetcher = fetch) {
  const response = await fetcher(FEED, { signal: AbortSignal.timeout(20000), redirect: 'error', headers: { accept: 'application/json' } });
  if (!response.ok || !response.body) throw Error('CISA KEV HTTP ' + response.status);
  const reader = response.body.getReader();
  let bytes = 0; const chunks = [];
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw Error('Catálogo KEV demasiado grande');
      chunks.push(Buffer.from(value));
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
module.exports = { FEED, candidatesFromKev, fetchKev, isoDate };
