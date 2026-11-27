'use strict';
(function(){
 const $=id=>document.getElementById(id),api=RadarDraftEditor;
 let draft=null,dirty=false,version=0;
 function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
 function progress(){$('progress').textContent=draft?draft.candidates.filter(c=>c.review.verified).length+' de '+draft.candidates.length+' fichas verificadas · '+draft.from+' — '+draft.through:'';}
 function render(){
  const c=draft.candidates[Number($('candidate').value)],e=c.evidence,r=c.review;
  const article=node('article');article.append(node('h2',e.name),node('p',e.title),node('p',e.summary),node('p','Fecha de fuente: '+e.day+' · '+e.source));
  for(const [label,url] of e.sources){const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';article.append(a,node('div'));}
  const verified=node('input');verified.type='checkbox';verified.checked=r.verified;
  function changed(key,value){api.updateReview(draft,e.id,key,value);verified.checked=false;dirty=true;progress();}
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
  verified.addEventListener('change',()=>{try{api.markVerified(draft,e.id,verified.checked);dirty=true;$('notice').textContent='';}catch(err){verified.checked=false;$('notice').textContent=err.message;}progress();});
  article.append(label);$('card').replaceChildren(article);progress();
 }
 $('draft-file').addEventListener('change',async()=>{
  const file=$('draft-file').files[0],token=++version;if(!file)return;
  try{
   if(file.size>8*1024*1024)throw Error('Archivo demasiado grande');
   const next=api.loadDraft(JSON.parse(await file.text()));if(token!==version)return;
   if(dirty&&!confirm('¿Sustituir el borrador sin exportar?'))return;
   draft=next;dirty=false;$('editor').hidden=false;
   $('pattern').value=draft.editorial.pattern??'';$('action').value=draft.editorial.action??'';
   $('candidate').replaceChildren(...draft.candidates.map((c,i)=>{const o=node('option',c.evidence.name+' · '+c.evidence.day);o.value=String(i);return o;}));render();$('notice').textContent='Borrador cargado.';
  }catch(e){if(token===version)$('notice').textContent=e.message;}finally{if(token===version)$('draft-file').value='';}
 });
 $('candidate').addEventListener('change',render);
 for(const key of ['pattern','action'])$(key).addEventListener('input',()=>{draft.editorial[key]=$(key).value||null;dirty=true;});
 $('download').addEventListener('click',()=>{
  if(!draft)return;
  try{api.loadDraft(draft);const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'}));const a=node('a');a.href=url;a.download='radar-borrador-'+draft.through+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;$('notice').textContent='Borrador exportado; no publicado.';}catch(e){$('notice').textContent=e.message;}
 });
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
})();
