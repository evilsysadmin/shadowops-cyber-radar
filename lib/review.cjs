'use strict';
const { isoDate } = require('./kev.cjs');
const CVE = /^CVE-\d{4}-\d{4,}$/;
function parseArchive(text) {
  const match = text.match(/^const RADAR_EDITIONS = ([\s\S]*);\s*$/);
  if (!match) throw Error('Archivo editorial inválido');
  const editions = JSON.parse(match[1]);
  if (!Array.isArray(editions)) throw Error('Archivo editorial inválido');
  const ids = new Set();
  for (const edition of editions) {
    if (!edition || !Array.isArray(edition.items)) throw Error('Edición inválida');
    isoDate(edition.id);
    if (ids.has(edition.id)) throw Error('Edición duplicada');
    ids.add(edition.id);
    for (const item of edition.items) {
      if (!item || typeof item.name !== 'string' || !Array.isArray(item.tags) || !item.tags.every(t=>typeof t==='string')) throw Error('Ficha inválida');
    }
  }
  return editions;
}
function cveIndex(editions) {
  const index = new Map();
  for (const edition of editions) {
    for (const item of edition.items) {
      for (const cve of new Set(item.tags.map(t=>t.trim().toUpperCase()).filter(t=>CVE.test(t)))) {
        if (!index.has(cve)) index.set(cve, []);
        index.get(cve).push({edition:edition.id,name:item.name,type:item.type});
      }
    }
  }
  return index;
}
function buildReviewQueue(batch, editions) {
  if (!batch || batch.schemaVersion !== 1 || batch.source !== 'CISA KEV' || !Array.isArray(batch.candidates) || batch.candidates.length>20000) throw Error('Lote de candidatos inválido');
  const {from,through} = batch;
  isoDate(from); isoDate(through);
  if (from>through) throw Error('Intervalo invertido');
  const index = cveIndex(editions), seen = new Map();
  for (const candidate of batch.candidates) {
    if (!candidate || !CVE.test(candidate.cve) || candidate.id !== 'kev:'+candidate.cve ||
        candidate.type!=='exploit' || candidate.status!=='pending' || candidate.incidentDate!==null ||
        !Array.isArray(candidate.sources) || !candidate.sources.length ||
        !candidate.sources.every(s=>Array.isArray(s)&&s.length===2&&typeof s[0]==='string'&&typeof s[1]==='string'&&s[1]==='https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext='+candidate.cve))
      throw Error('Candidato inválido');
    isoDate(candidate.dateAdded);
    if (candidate.dateAdded<from || candidate.dateAdded>through) throw Error('Candidato fuera de intervalo');
    if (seen.has(candidate.id)) {
      if (JSON.stringify(seen.get(candidate.id))!==JSON.stringify(candidate)) throw Error('Candidatos en conflicto: '+candidate.id);
      continue;
    }
    seen.set(candidate.id,candidate);
  }
  const candidates = [...seen.values()].sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)||a.cve.localeCompare(b.cve)).map(candidate=>{
    const references = (index.get(candidate.cve)||[]).slice().sort((a,b)=>b.edition.localeCompare(a.edition)||a.name.localeCompare(b.name));
    const reviewReason = references.some(r=>r.edition>=from&&r.edition<=through) ? 'covered_in_window' : references.length ? 'historical_match' : 'new_cve';
    return {...candidate,reviewReason,references};
  });
  const counts = {new_cve:0,historical_match:0,covered_in_window:0};
  for (const candidate of candidates) counts[candidate.reviewReason]++;
  return {schemaVersion:1,from,through,source:batch.source,counts,candidates};
}
module.exports={parseArchive,buildReviewQueue};
