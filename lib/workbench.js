'use strict';
(function(root){
  const text=(v,max=5000)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
  const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  const reasons=new Set(['new_cve','historical_match','covered_in_window','unseen_source']);
  const states=new Set(['pending','investigate','covered','dismiss']);
  function source(s){
    if(!Array.isArray(s)||s.length!==2||!text(s[0],500)||!text(s[1],2048))throw Error('Fuente inválida');
    const u=new URL(s[1]);
    if(u.protocol!=='https:'||u.username||u.password)throw Error('Fuente HTTPS requerida');
    return [s[0],u.href];
  }
  function normalizeBatch(batch){
    if(batch?.source==='weekly review'){
      if(batch.schemaVersion!==1||!date(batch.from)||!date(batch.through)||batch.from>batch.through||!Array.isArray(batch.batches)||batch.batches.length!==2)throw Error('Cola semanal inválida');
      const sources=new Set(), ids=new Set(), candidates=[];
      for(const child of batch.batches){
        if(!child||!['CISA KEV','editor-curated disclosures'].includes(child.source)||sources.has(child.source)||child.from!==batch.from||child.through!==batch.through)throw Error('Fuentes o intervalos incompatibles');
        sources.add(child.source);
        for(const candidate of normalizeBatch(child).candidates){
          if(ids.has(candidate.id))throw Error('Candidato duplicado');
          ids.add(candidate.id);candidates.push(candidate);
          if(candidates.length>2000)throw Error('Demasiados candidatos');
        }
      }
      candidates.sort((a,b)=>b.day.localeCompare(a.day)||a.id.localeCompare(b.id));
      return {source:batch.source,from:batch.from,through:batch.through,candidates};
    }
    if(!batch||batch.schemaVersion!==1||!['CISA KEV','editor-curated disclosures'].includes(batch.source)||!date(batch.from)||!date(batch.through)||batch.from>batch.through||!Array.isArray(batch.candidates)||batch.candidates.length>2000)throw Error('Cola de revisión inválida');
    const seen=new Set();
    const candidates=batch.candidates.map(c=>{
      if(!c||c.status!=='pending'||!text(c.id,2200)||seen.has(c.id)||!text(c.title,500)||!reasons.has(c.reviewReason)||!Array.isArray(c.references)||c.references.length>500||!Array.isArray(c.sources)||!c.sources.length||c.sources.length>20)throw Error('Candidato inválido o duplicado');
      seen.add(c.id);
      const kev=batch.source==='CISA KEV';
      const day=kev?c.dateAdded:c.publicationDate;
      const name=kev?c.vendor+' / '+c.product:c.organization;
      const summary=kev?c.description:c.summary;
      const proposedType=kev?c.type:c.proposedType;
      if(!date(day)||day<batch.from||day>batch.through||!text(name,401)||!text(summary)||!['breach','watch','exploit'].includes(proposedType)||!(c.incidentDate===null||(date(c.incidentDate)&&c.incidentDate<=day)))throw Error('Datos del candidato inválidos');
      const sources=c.sources.map(source);
      if(kev&&(!text(c.vendor,200)||!text(c.product,200)||!/^CVE-\d{4}-\d{4,}$/.test(c.cve)||c.id!=='kev:'+c.cve||proposedType!=='exploit'||c.incidentDate!==null||sources.some(s=>s[1]!=='https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext='+c.cve)))throw Error('Identidad KEV inválida');
      if(!kev&&(!['affected-organization','vendor','cert'].includes(c.sourceKind)||!text(c.organization,200)||!c.id.startsWith('disclosure:')||c.id!=='disclosure:'+sources[0][1]))throw Error('Comunicado inválido');
      const references=c.references.map(r=>{if(!r||!date(r.edition)||!text(r.name,500))throw Error('Referencia inválida');return {edition:r.edition,name:r.name};});
      return {id:c.id,source:batch.source,name,title:c.title,summary,day,incidentDate:c.incidentDate,proposedType,reviewReason:c.reviewReason,sources,references};
    });
    return {source:batch.source,from:batch.from,through:batch.through,candidates};
  }
  function decisionReport(batch,decisions){
    return {schemaVersion:1,source:batch.source,from:batch.from,through:batch.through,decisions:batch.candidates.map(c=>{
      const decision=decisions.get(c.id)||'pending';
      if(!states.has(decision))throw Error('Decisión inválida');
      return {...c,decision};
    })};
  }
  const api={normalizeBatch,decisionReport};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarWorkbench=api;
})(globalThis);
