'use strict';
(function(root){
 const validate=typeof module==='object'&&module.exports?require('./validation.js').validateEdition:root.RadarValidation.validateEdition;
 const text=(s,max=5000)=>typeof s==='string'&&s.trim()&&s.length<=max;
 const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 const fields=['name','type','publicationDate','incident','vector','impact','lesson','tags','additionalSources'];
 function source(s){if(!Array.isArray(s)||s.length!==2||!text(s[0],200)||!text(s[1],2048))throw Error('Fuente inválida');const u=new URL(s[1]);if(u.protocol!=='https:'||u.username||u.password)throw Error('Fuente HTTPS requerida');}
 function loadDraft(d){
  if(!d||d.schemaVersion!==1||d.kind!=='editorial-draft'||d.publicationReady!==false||!date(d.from)||!date(d.through)||d.from>d.through||!d.editorial||!Array.isArray(d.candidates)||!d.candidates.length||d.candidates.length>500)throw Error('Borrador inválido');
  for(const key of ['pattern','action'])if(d.editorial[key]!==null&&typeof d.editorial[key]!=='string')throw Error('Campo editorial inválido');
  const ids=new Set();
  for(const c of d.candidates){
   const e=c?.evidence,r=c?.review;
   if(!e||!r||!text(e.id,2200)||ids.has(e.id)||!text(e.name,401)||!text(e.title,500)||!text(e.summary)||!date(e.day)||e.day<d.from||e.day>d.through||e.decision!=='investigate'||!['CISA KEV','editor-curated disclosures'].includes(e.source)||!Array.isArray(e.sources)||!e.sources.length||e.sources.length>20||typeof r.verified!=='boolean')throw Error('Candidato inválido');
   ids.add(e.id);e.sources.forEach(source);
   for(const key of fields.filter(k=>!['tags','additionalSources'].includes(k)))if(r[key]!==null&&typeof r[key]!=='string')throw Error('Campo de revisión inválido');
   if(!Array.isArray(r.tags)||r.tags.length>40||!r.tags.every(t=>text(t,120))||!Array.isArray(r.additionalSources)||r.additionalSources.length>20)throw Error('Etiquetas o fuentes inválidas');
   r.additionalSources.forEach(source);
   if(r.verified)checkReview(d,c);
  }
  return JSON.parse(JSON.stringify(d));
 }
 function checkReview(d,c){
  const e=c.evidence,r=c.review;
  if(!date(r.publicationDate)||r.publicationDate<d.from||r.publicationDate>d.through)throw Error('Fecha de publicación fuera del intervalo');
  if(e.source==='CISA KEV'&&(!/^kev:CVE-\d{4}-\d{4,}$/.test(e.id)||!['watch','exploit'].includes(r.type)||r.publicationDate!==e.day||!r.tags.includes(e.id.slice(4))||!e.sources.every(s=>s[1]==='https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext='+e.id.slice(4))))throw Error('Revisión KEV incompatible');
  validate({period:'Borrador',pattern:'Borrador',action:'Borrador',items:[{name:r.name,type:r.type,date:r.publicationDate,incident:r.incident,vector:r.vector,impact:r.impact,lesson:r.lesson,tags:r.tags,sources:[...e.sources,...r.additionalSources]}]});
 }
 function updateReview(d,id,key,value){
  if(!fields.includes(key))throw Error('Campo no editable');
  const c=d.candidates.find(c=>c.evidence.id===id);if(!c)throw Error('Candidato inexistente');
  c.review[key]=value;c.review.verified=false;
 }
 function markVerified(d,id,checked){
  const c=d.candidates.find(c=>c.evidence.id===id);if(!c)throw Error('Candidato inexistente');
  if(checked)checkReview(d,c);c.review.verified=Boolean(checked);
 }
 const api={loadDraft,updateReview,markVerified,checkReview};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarDraftEditor=api;
})(globalThis);
