'use strict';
(function(){
 const errors=[],violations=[];
 window.addEventListener('error',e=>errors.push(e.message||'resource error'));
 document.addEventListener('securitypolicyviolation',e=>violations.push(e.violatedDirective));
 const $=id=>document.getElementById(id);
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 function finish(error){document.documentElement.dataset.smoke=error||errors.length||violations.length?'failed':'passed';document.documentElement.dataset.smokeDetail=error?.message||[...errors,...violations].join('; ');}
 const candidate={evidence:{id:'disclosure:https://example.org/report',name:'Example',title:'Report',summary:'Evidence <img src=x onerror=alert(1)>',source:'editor-curated disclosures',day:'2026-11-27',decision:'investigate',sources:[['Example','https://example.org/report']]},review:{verified:false,name:'Example',type:'watch',publicationDate:'2026-11-27',incident:'Desconocido',vector:'Desconocido',impact:null,lesson:'Revisar',tags:[],additionalSources:[]}};
 const draft={schemaVersion:1,kind:'editorial-draft',publicationReady:false,from:'2026-11-21',through:'2026-11-27',editorial:{pattern:'Patrón',action:'Acción'},candidates:[candidate]};
 function upload(value){const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(value)],'draft.json',{type:'application/json'}));$('draft-file').files=dt.files;$('draft-file').dispatchEvent(new Event('change'));}
 async function until(predicate){for(let i=0;i<50;i++){if(predicate())return;await new Promise(r=>setTimeout(r,20));}throw Error('Timed out waiting for editor');}
 window.addEventListener('DOMContentLoaded',async()=>{
  try{
   if(location.search==='?restore'){
    check(!$('editor').hidden,'restored editor');
    check($('progress').textContent.startsWith('1 de 1'),'restored verification');
    check($('persistence').textContent.includes('recuperado'),'restore notice');
    window.confirm=()=>true;$('clear-draft').click();
    check($('editor').hidden&&RadarDraftSession.restore(localStorage).status==='empty','clear draft');
    finish();return;
   }
   check($('editor').hidden,'initial hidden editor');
   upload(draft);await until(()=>$('notice').textContent==='Borrador cargado.');
   check(!$('editor').hidden,'editor visible');check(!$('card').querySelector('img'),'evidence rendered as text');
   const checkbox=$('card').querySelector('input[type=checkbox]');
   const impact=[...$('card').querySelectorAll('label')].find(l=>l.firstChild.textContent==='Impacto').querySelector('textarea');
   $('preview-button').click();check($('preview').hidden,'incomplete preview rejected');
   checkbox.click();check(!checkbox.checked,'incomplete review rejected');
   impact.value='En investigación';impact.dispatchEvent(new Event('input'));
   checkbox.click();check(checkbox.checked&&$('progress').textContent.startsWith('1 de 1'),'explicit verification');
   $('preview-button').click();check(!$('preview').hidden&&$('preview-content').textContent.includes('En investigación'),'valid edition preview');
   impact.value='Actualización';impact.dispatchEvent(new Event('input'));
   check(!checkbox.checked&&$('progress').textContent.startsWith('0 de 1'),'editing invalidates verification');check($('preview').hidden,'stale preview hidden');
   checkbox.click();check(checkbox.checked,'reverification');
   let exported=null;
   const create=URL.createObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click;
   URL.createObjectURL=blob=>{exported=blob;return create(blob);};
   HTMLAnchorElement.prototype.click=function(){if(!this.download)return click.call(this);};
   $('download').click();check(exported instanceof Blob,'download JSON generated');
   const saved=JSON.parse(await exported.text());
   check(saved.publicationReady===false&&saved.candidates[0].review.verified===true,'export remains draft');
   check(saved.candidates[0].review.impact==='Actualización','edited field exported');
   check(JSON.stringify(saved.candidates[0].evidence)===JSON.stringify(candidate.evidence),'evidence preserved');
   upload({invalid:true});await until(()=>$('notice').textContent==='Borrador inválido');
   check(checkbox.checked&&!$('editor').hidden,'invalid import preserves editor');
   check(document.documentElement.scrollWidth<=innerWidth,'editor horizontal overflow');
   finish();
  }catch(e){finish(e);}
 });
})();
