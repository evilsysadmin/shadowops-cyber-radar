'use strict';
const {isoDate}=require('./kev.cjs');
const {parseArchive}=require('./review.cjs');
const {validateEdition}=require('./validation.js');
const types=new Set(['breach','watch','exploit']);
const sourceKinds=new Set(['affected-organization','vendor','cert']);
function str(v,max=5000){return typeof v==='string'&&v.trim().length>0&&v.length<=max;}
const {canonical}=require('./editorial-contract.js');
function reviewDisclosures(records, editions, from, through){
  isoDate(from);isoDate(through);
  if(from>through||!Array.isArray(records)||records.length>2000)throw Error('Lote inválido');
  const index=new Map();
  for(const edition of editions){
    validateEdition(edition);
    for(const item of edition.items)for(const [,url] of item.sources){
      const key=canonical(url);
      if(!index.has(key))index.set(key,[]);
      const refs=index.get(key);
      if(!refs.some(r=>r.edition===edition.id&&r.name===item.name))refs.push({edition:edition.id,name:item.name});
    }
  }
  const seen=new Map();
  for(const row of records){
    if(!row||!str(row.organization,200)||!str(row.title,500)||!str(row.summary)||
       !sourceKinds.has(row.sourceKind)||!types.has(row.proposedType))throw Error('Comunicado inválido');
    const url=canonical(row.url);
    const date=isoDate(row.publicationDate);
    if(row.incidentDate!==null)isoDate(row.incidentDate);
    if(row.incidentDate!==null&&row.incidentDate>date)throw Error('Fecha del incidente posterior al comunicado');
    if(date<from||date>through)continue;
    const candidate={id:'disclosure:'+url,status:'pending',sourceKind:row.sourceKind,organization:row.organization,title:row.title,summary:row.summary,proposedType:row.proposedType,publicationDate:date,incidentDate:row.incidentDate,sources:[[row.organization,url]],references:index.get(url)||[]};
    candidate.reviewReason=candidate.references.some(r=>r.edition>=from&&r.edition<=through)?'covered_in_window':candidate.references.length?'historical_match':'unseen_source';
    if(seen.has(url)&&JSON.stringify(seen.get(url))!==JSON.stringify(candidate))throw Error('Comunicados en conflicto');
    seen.set(url,candidate);
  }
  const candidates=[...seen.values()].sort((a,b)=>b.publicationDate.localeCompare(a.publicationDate)||a.id.localeCompare(b.id));
  return {schemaVersion:1,source:'editor-curated disclosures',from,through,candidates};
}
module.exports={canonical,reviewDisclosures,parseArchive};
