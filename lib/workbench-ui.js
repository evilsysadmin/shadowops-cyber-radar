'use strict';
(function(){
  const $=id=>document.getElementById(id);
  const labels={pending:'Pendiente',investigate:'Investigar',covered:'Ya cubierto',dismiss:'Descartar'};
  const reasons={new_cve:'CVE nuevo',historical_match:'Coincidencia histórica',covered_in_window:'Cubierto en el intervalo',unseen_source:'Fuente no vista'};
  let batch=null,decisions=new Map(),version=0;
  function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
  function updateCounts(){
    const counts={pending:0,investigate:0,covered:0,dismiss:0};
    for(const c of batch.candidates)counts[decisions.get(c.id)||'pending']++;
    $('counts').textContent=batch.source+' · '+batch.from+' – '+batch.through+' · '+Object.entries(counts).map(([key,n])=>labels[key]+': '+n).join(' · ');
  }
  function render(){
    if(!batch)return;
    updateCounts();
    const filter=$('filter').value;
    const cards=batch.candidates.filter(c=>filter==='all'||(decisions.get(c.id)||'pending')===filter).map(c=>{
      const card=node('article');
      card.append(node('h2',c.name),node('p',c.title),node('p',c.summary),node('p','Fecha de fuente: '+c.day+' · Incidente: '+(c.incidentDate||'desconocido')),node('p','Propuesta: '+c.proposedType+' · '+reasons[c.reviewReason]));
      const refs=node('p',c.references.length?'Referencias: '+c.references.map(r=>r.name+' ('+r.edition+')').join(', '):'Sin coincidencias editoriales');
      refs.className='meta';card.append(refs);
      for(const [label,url] of c.sources){const link=node('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';card.append(link,node('div'));}
      const label=node('label','Decisión · '+c.name+' ');
      const select=node('select');
      for(const [key,value] of Object.entries(labels)){const option=node('option',value);option.value=key;select.append(option);}
      select.value=decisions.get(c.id)||'pending';
      select.addEventListener('change',()=>{decisions.set(c.id,select.value);if($('filter').value==='all')updateCounts();else render();});
      label.append(select);card.append(label);return card;
    });
    $('cards').replaceChildren(...(cards.length?cards:[node('p','No hay candidatos para este filtro.')]));
  }
  $('filter').addEventListener('change',render);
  $('queue').addEventListener('change',async()=>{
    const f=$('queue').files[0],token=++version;
    if(!f)return;
    try{
      if(f.size>4*1024*1024)throw Error('Archivo demasiado grande');
      const next=RadarWorkbench.normalizeBatch(JSON.parse(await f.text()));
      if(token!==version)return;
      if(decisions.size&&!window.confirm('¿Sustituir la cola y sus decisiones sin guardar? Exporta primero si necesitas conservarlas.'))return;
      batch=next;decisions=new Map();$('export').disabled=false;$('filter').value='all';$('notice').textContent='Cola cargada.';render();
    }catch(e){if(token===version)$('notice').textContent='No se ha cargado: '+e.message;}
    finally{if(token===version)$('queue').value='';}
  });
  $('export').addEventListener('click',()=>{
    if(!batch)return;
    const report=RadarWorkbench.decisionReport(batch,decisions);
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));
    const link=node('a');link.href=url;link.download='radar-decisiones-'+batch.through+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
