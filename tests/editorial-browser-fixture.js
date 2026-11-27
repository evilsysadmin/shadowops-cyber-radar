'use strict';
(function(){
 const errors=[];window.addEventListener('error',e=>errors.push(e.message));
 const byId=id=>document.getElementById(id);
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const cards=()=>[...document.querySelectorAll('#cards article')];
 const queue={schemaVersion:1,source:'editor-curated disclosures',from:'2026-11-21',through:'2026-11-27',candidates:['Alpha','Beta'].map((name,i)=>({id:'disclosure:https://example.org/'+name,status:'pending',sourceKind:'vendor',organization:name,title:'Aviso de seguridad',summary:'Fixture <img src=x onerror=alert(1)>',proposedType:'watch',publicationDate:'2026-11-27',incidentDate:null,sources:[[name,'https://example.org/'+name]],references:[],reviewReason:i?'historical_match':'unseen_source'}))};
 function finish(error){document.documentElement.dataset.smoke=error||errors.length?'failed':'passed';document.documentElement.dataset.smokeDetail=error?.message||errors.join('; ');}
 function change(id,value){const e=byId(id);e.value=value;e.dispatchEvent(new Event('change'));}
 function importQueue(data){const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(data)],'queue.json',{type:'application/json'}));byId('queue').files=dt.files;byId('queue').dispatchEvent(new Event('change'));}
 async function until(predicate){for(let i=0;i<50;i++){if(predicate())return;await new Promise(r=>setTimeout(r,20));}throw Error('Timed out waiting for import');}
 window.addEventListener('DOMContentLoaded',async()=>{
  try{
   if(location.search==='?restore'){
    check(cards().length===2,'restored candidates');
    check(cards()[0].querySelector('select').value==='investigate','restored decision');
    check(byId('persistence').textContent.includes('recuperada'),'restore notice');
    window.confirm=()=>true;byId('clear').click();
    check(cards().length===0&&byId('export').disabled,'clear session');
    check(RadarSession.restore(localStorage).status==='empty','clear storage');
    finish();return;
   }
   check(byId('export').disabled,'initial empty state');
   importQueue(queue);await until(()=>cards().length===2);
   check(!document.querySelector('#cards img'),'untrusted markup remains text');
   change('reason','unseen_source');check(cards().length===1,'reason filter');
   change('reason','all');
   byId('search').value='beta';byId('search').dispatchEvent(new Event('input'));check(cards().length===1&&cards()[0].textContent.includes('Beta'),'search');
   byId('search').value='';byId('search').dispatchEvent(new Event('input'));
   const choice=cards()[0].querySelector('select');choice.value='investigate';choice.dispatchEvent(new Event('change'));
   change('filter','investigate');check(cards().length===1,'decision filter');
   change('filter','all');check(cards().length===2,'reset filter');
   const saved=RadarSession.restore(localStorage);check(saved.status==='restored'&&saved.decisions.get(queue.candidates[0].id)==='investigate','persist decision');
   importQueue({invalid:true});await until(()=>byId('notice').textContent.includes('No se ha cargado'));
   check(cards().length===2,'invalid import preserves queue');
   check(document.documentElement.scrollWidth<=innerWidth,'editorial horizontal overflow');
   finish();
  }catch(e){finish(e);}
 });
})();
