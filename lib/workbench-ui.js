'use strict';
(function(){
  const $=id=>document.getElementById(id);
  const labels={pending:'Pendiente',investigate:'Investigar',covered:'Ya cubierto',dismiss:'Descartar'};
  const reasons={new_cve:'CVE nuevo',historical_match:'Coincidencia histórica',covered_in_window:'Cubierto en el intervalo',unseen_source:'Fuente no vista'};
  let batch=null,rawQueue=null,decisions=new Map(),version=0,dirty=false;
  const storage={getItem:k=>window.localStorage.getItem(k),setItem:(k,v)=>window.localStorage.setItem(k,v),removeItem:k=>window.localStorage.removeItem(k)};
  function persist(){const ok=RadarSession.save(storage,rawQueue,decisions);dirty=!ok;$('persistence').textContent=ok?'Sesión guardada en este navegador.':'No se pudo guardar; exporta las decisiones antes de salir.';}
  function activate(queue,next,choices){rawQueue=queue;batch=next;decisions=choices;$('export').disabled=false;$('draft').disabled=false;$('clear').disabled=false;$('filter').value='all';render();}
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
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
      card.append(node('h2',c.name),node('p',c.title),node('p',c.summary),node('p',c.source+' · Fecha de fuente: '+c.day+' · Incidente: '+(c.incidentDate||'desconocido')),node('p','Propuesta: '+c.proposedType+' · '+reasons[c.reviewReason]));
      const refs=node('p',c.references.length?'Referencias: '+c.references.map(r=>r.name+' ('+r.edition+')').join(', '):'Sin coincidencias editoriales');
      refs.className='meta';card.append(refs);
      for(const [label,url] of c.sources){const link=node('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';card.append(link,node('div'));}
      const label=node('label','Decisión · '+c.name+' ');
      const select=node('select');
      for(const [key,value] of Object.entries(labels)){const option=node('option',value);option.value=key;select.append(option);}
      select.value=decisions.get(c.id)||'pending';
      select.addEventListener('change',()=>{decisions.set(c.id,select.value);persist();if($('filter').value==='all')updateCounts();else render();});
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
      const queue=JSON.parse(await f.text());const next=RadarWorkbench.normalizeBatch(queue);
      if(token!==version)return;
      if(decisions.size&&!window.confirm('¿Sustituir la cola y sus decisiones? Exporta primero si necesitas conservarlas.'))return;
      activate(queue,next,new Map());persist();$('notice').textContent='Cola cargada.';
    }catch(e){if(token===version)$('notice').textContent='No se ha cargado: '+e.message;}
    finally{if(token===version)$('queue').value='';}
  });
  $('clear').addEventListener('click',()=>{
    if(!window.confirm('¿Borrar esta sesión local y sus decisiones?'))return;
    ++version;rawQueue=null;batch=null;decisions=new Map();dirty=false;
    $('cards').replaceChildren();$('counts').textContent='Sin cola cargada.';$('export').disabled=true;$('draft').disabled=true;$('clear').disabled=true;
    $('persistence').textContent=RadarSession.clear(storage)?'Sesión local borrada.':'No se pudo borrar el almacenamiento; revisa los datos del navegador.';
  });
  const restored=RadarSession.restore(storage);
  if(restored.status==='restored'){activate(restored.queue,restored.batch,restored.decisions);$('persistence').textContent='Sesión local recuperada.';}
  else if(restored.status==='unavailable')$('persistence').textContent='No se pudo recuperar la sesión local; puedes importar una cola.';
  function download(report,prefix){
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));
    const link=node('a');link.href=url;link.download=prefix+batch.through+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('export').addEventListener('click',()=>{if(batch)download(RadarWorkbench.decisionReport(batch,decisions),'radar-decisiones-');});
  $('draft').addEventListener('click',()=>{if(batch){const draft=RadarWorkbench.draftReport(batch,decisions);if(!draft.candidates.length){$('notice').textContent='Marca algún candidato como Investigar para preparar un borrador.';return;}download(draft,'radar-borrador-');$('notice').textContent='Borrador exportado; requiere verificación y redacción antes de publicar.';}});
})();
