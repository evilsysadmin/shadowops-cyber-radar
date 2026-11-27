'use strict';
(function(){
 const $=id=>document.getElementById(id),api=RadarDraftEditor;
 let draft=null,dirty=false,version=0,unsaved=false;
 const storage={getItem:k=>window.localStorage.getItem(k),setItem:(k,v)=>window.localStorage.setItem(k,v),removeItem:k=>window.localStorage.removeItem(k)};
 function persist(){const ok=RadarDraftSession.save(storage,draft,Number($('candidate').value));unsaved=!ok;$('persistence').textContent=ok?'Borrador guardado en este navegador.':'No se pudo guardar el borrador actual. Corrige los campos inválidos o exporta cuando sea posible; no cierres la pantalla.';}
 function activate(next,selected=0){draft=next;dirty=false;unsaved=false;$('editor').hidden=false;$('pattern').value=draft.editorial.pattern??'';$('action').value=draft.editorial.action??'';$('candidate').replaceChildren(...draft.candidates.map((c,i)=>{const o=node('option',c.evidence.name+' · '+c.evidence.day);o.value=String(i);return o;}));$('candidate').value=String(selected);render();}
 function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
 function hidePreview(){$('preview').hidden=true;$('preview-content').replaceChildren();}
 function progress(){hidePreview();$('progress').textContent=draft?draft.candidates.filter(c=>c.review.verified).length+' de '+draft.candidates.length+' fichas verificadas · '+draft.from+' — '+draft.through:'';}
 function render(){
  const c=draft.candidates[Number($('candidate').value)],e=c.evidence,r=c.review;
  const article=node('article');article.append(node('h2',e.name),node('p',e.title),node('p',e.summary),node('p','Fecha de fuente: '+e.day+' · '+e.source));
  const d=e.details||{};
  if(typeof d.requiredAction==='string')article.append(node('p','Acción requerida por CISA: '+d.requiredAction));
  if(typeof d.dueDate==='string')article.append(node('p','Fecha límite CISA (organismos federales de EE. UU.): '+d.dueDate));
  if(['Known','Unknown'].includes(d.ransomware))article.append(node('p','Uso en ransomware según KEV: '+(d.ransomware==='Known'?'Conocido':'Desconocido')));
  if(['affected-organization','vendor','cert'].includes(d.sourceKind))article.append(node('p','Tipo de fuente: '+({'affected-organization':'Organización afectada',vendor:'Fabricante',cert:'CERT / CSIRT'}[d.sourceKind])));
  for(const [label,url] of e.sources){const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';article.append(a,node('div'));}
  const verified=node('input');verified.type='checkbox';verified.checked=r.verified;
  function changed(key,value){api.updateReview(draft,e.id,key,value);verified.checked=false;dirty=true;progress();persist();}
  const labels={name:'Nombre',type:'Clasificación',publicationDate:'Fecha de divulgación',incident:'Fecha del incidente / desconocida',vector:'Vector',impact:'Impacto',lesson:'Lección técnica',tags:'Etiquetas (una por línea)',additionalSources:'Fuentes adicionales (etiqueta | URL por línea)'};
  for(const [key,label] of Object.entries(labels)){
   const wrapper=node('label',label);
   let input;
   if(key==='type'){input=node('select');for(const [value,title] of [['','Seleccionar'],['watch','Seguimiento'],['exploit','Explotación activa'],['breach','Brecha confirmada']]){if(value==='breach'&&e.source==='CISA KEV')continue;const o=node('option',title);o.value=value;input.append(o);}}
   else{input=node(['name','publicationDate'].includes(key)?'input':'textarea');if(key==='publicationDate')input.type='date';input.maxLength=5000;}
   input.value=key==='tags'?r.tags.join('\n'):key==='additionalSources'?r.additionalSources.map(s=>s.join(' | ')).join('\n'):r[key]??'';
   input.addEventListener('input',()=>changed(key,key==='tags'?input.value.split('\n').map(s=>s.trim()).filter(Boolean):key==='additionalSources'?input.value.split('\n').filter(s=>s.trim()).map(s=>{const i=s.indexOf('|');return i<0?[s.trim(),'']:[s.slice(0,i).trim(),s.slice(i+1).trim()];}):input.value||null));
   wrapper.append(input);article.append(wrapper);
  }
  const label=node('label');label.append(verified,document.createTextNode(' He comprobado las fuentes y los datos de esta ficha'));
  verified.addEventListener('change',()=>{try{api.markVerified(draft,e.id,verified.checked);dirty=true;persist();$('notice').textContent='';}catch(err){verified.checked=false;$('notice').textContent=err.message;}progress();});
  article.append(label);$('card').replaceChildren(article);progress();
 }
 $('draft-file').addEventListener('change',async()=>{
  const file=$('draft-file').files[0],token=++version;if(!file)return;
  try{
   if(file.size>8*1024*1024)throw Error('Archivo demasiado grande');
   const next=api.loadDraft(JSON.parse(await file.text()));if(token!==version)return;
   if(draft&&!confirm('¿Sustituir el borrador local? Exporta primero si quieres conservarlo.'))return;
   activate(next);persist();$('notice').textContent='Borrador cargado.';
  }catch(e){if(token===version)$('notice').textContent=e.message;}finally{if(token===version)$('draft-file').value='';}
 });
 $('candidate').addEventListener('change',()=>{render();persist();});
 for(const key of ['pattern','action'])$(key).addEventListener('input',()=>{draft.editorial[key]=$(key).value||null;dirty=true;hidePreview();persist();});
 $('download').addEventListener('click',()=>{
  if(!draft)return;
  try{api.loadDraft(draft);const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'}));const a=node('a');a.href=url;a.download='radar-borrador-'+draft.through+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;unsaved=false;$('notice').textContent='Borrador exportado; no publicado.';}catch(e){$('notice').textContent=e.message;}
 });
 $('preview-button').addEventListener('click',()=>{
  hidePreview();
  if(!draft)return;
  try{
   const edition=RadarDraftCompiler.compileDraft(draft);
   const content=$('preview-content');
   content.append(node('h3',edition.period),node('p',edition.pattern),node('p','Acción: '+edition.action));
   for(const item of edition.items){
    const card=node('article');card.append(node('h3',item.name),node('p',item.type+' · '+item.date),node('p','Incidente: '+item.incident),node('p','Vector: '+item.vector),node('p','Impacto: '+item.impact),node('p','Lección: '+item.lesson),node('p',item.tags.join(' · ')));
    for(const [label,url] of item.sources){const link=node('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';card.append(link,node('div'));}
    content.append(card);
   }
   const button=node('button','Exportar edición candidata JSON');button.type='button';
   button.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(edition,null,2)+'\n'],{type:'application/json'}));const a=node('a');a.href=url;a.download='radar-edicion-candidata-'+edition.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
   content.append(button);$('preview').hidden=false;$('notice').textContent='Edición candidata válida. No publicada.';
  }catch(e){$('notice').textContent='Previsualización no disponible: '+e.message;}
 });
 $('clear-draft').addEventListener('click',()=>{
  if(!confirm('¿Borrar el borrador guardado en este navegador?'))return;
  if(!RadarDraftSession.clear(storage)){$('persistence').textContent='No se pudo borrar la sesión local.';return;}
  ++version;hidePreview();draft=null;dirty=false;unsaved=false;$('editor').hidden=true;$('card').replaceChildren();$('progress').textContent='';$('notice').textContent='Borrador borrado.';$('persistence').textContent='';
 });
 const restored=RadarDraftSession.restore(storage);
 if(restored.status==='restored'){activate(restored.draft,restored.selected);$('persistence').textContent='Borrador local recuperado.';}
 else if(restored.status==='unavailable')$('persistence').textContent='No se pudo recuperar el borrador local.';
 window.addEventListener('beforeunload',e=>{if(dirty&&unsaved){e.preventDefault();e.returnValue='';}});
})();
