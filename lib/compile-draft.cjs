'use strict';
const {isoDate}=require('./kev.cjs');
const {canonical}=require('./disclosures.cjs');
const {validateEdition}=require('./validation.js');
function compileDraft(draft){
  if(!draft||draft.schemaVersion!==1||draft.kind!=='editorial-draft'||draft.publicationReady!==false||
    !Array.isArray(draft.candidates)||!draft.candidates.length||draft.candidates.length>500||
    !draft.editorial)throw Error('Borrador inválido');
  const {from,through}=draft;
  isoDate(from);isoDate(through);if(from>through)throw Error('Intervalo invertido');
  const seen=new Set();
  const items=draft.candidates.map(({evidence:e,review:r})=>{
    if(!e||!r||r.verified!==true||e.decision!=='investigate'||typeof e.id!=='string'||seen.has(e.id)||
      !['CISA KEV','editor-curated disclosures'].includes(e.source)||!Array.isArray(e.sources)||!e.sources.length||
      !Array.isArray(r.additionalSources))throw Error('Candidato no verificado o duplicado');
    seen.add(e.id);
    isoDate(e.day);isoDate(r.publicationDate);
    if(e.day<from||e.day>through||r.publicationDate<from||r.publicationDate>through)throw Error('Fecha fuera de intervalo');
    if(e.source==='CISA KEV'){
      const cve=e.id.slice(4);
      if(!/^kev:CVE-\d{4}-\d{4,}$/.test(e.id)||!['exploit','watch'].includes(r.type)||
        r.publicationDate!==e.day||!e.sources.every(s=>Array.isArray(s)&&s[1]==='https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext='+cve))throw Error('Evidencia KEV incompatible');
      if(!Array.isArray(r.tags)||!r.tags.includes(cve))throw Error('Falta etiqueta CVE');
    }else if(!Array.isArray(e.sources[0])||e.id!=='disclosure:'+canonical(e.sources[0][1]))throw Error('Identidad del comunicado inválida');
    const sources=new Map();
    for(const s of [...e.sources,...r.additionalSources]){
      if(!Array.isArray(s)||s.length!==2||typeof s[0]!=='string'||!s[0].trim()||s[0].length>200)throw Error('Fuente inválida');
      const url=canonical(s[1]);if(!sources.has(url))sources.set(url,[s[0],url]);
    }
    return {name:r.name,type:r.type,date:r.publicationDate+(e.source==='CISA KEV'?' · incorporación a KEV':' · fecha de divulgación revisada'),incident:r.incident,vector:r.vector,impact:r.impact,lesson:r.lesson,tags:r.tags,sources:[...sources.values()]};
  });
  return validateEdition({id:through,period:from+' — '+through,pattern:draft.editorial.pattern,action:draft.editorial.action,items});
}
module.exports={compileDraft};
