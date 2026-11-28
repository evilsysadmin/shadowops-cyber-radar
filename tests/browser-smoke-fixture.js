'use strict';
(function(){
 const violations=[],errors=[];
 document.addEventListener('securitypolicyviolation',e=>violations.push(e.violatedDirective));
 window.addEventListener('error',e=>errors.push(e.message||'resource error'));
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 const byId=id=>document.getElementById(id);
 const cards=()=>[...document.querySelectorAll('#grid article')];
 window.addEventListener('DOMContentLoaded',()=>{
   try{
     const latest=RADAR_EDITIONS.slice().sort((a,b)=>b.id.localeCompare(a.id))[0];
     check(cards().length===latest.items.length,'initial cards');
     const direct=RadarTrends.resolveCaseHash(RADAR_EDITIONS,location.hash);
     check(direct&&direct.edition.id===latest.id,'initial direct link');
     check(document.activeElement===cards()[direct.index]&&cards()[direct.index].querySelector('details').open,'direct link focuses and opens case');
     check(cards()[direct.index].querySelector('.case-link').hash===location.hash,'shareable case anchor');
     check(byId('period').textContent===latest.period,'period');
     check(getComputedStyle(document.querySelector('main')).maxWidth==='1120px','stylesheet loaded');
     document.querySelector('[data-filter="breach"]').click();
     check(cards().length===latest.items.filter(i=>i.type==='breach').length,'breach filter');
     check(!location.hash,'manual filtering clears case link');
     document.querySelector('[data-filter="all"]').click();
     const initialHistory=byId('history-series').firstElementChild;
     byId('search').value='__no_case_expected__';byId('search').dispatchEvent(new Event('input'));
     check(cards().length===0,'search empty state');
     check(byId('history-series').firstElementChild===initialHistory,'search preserves history DOM');
     byId('search').value='';byId('search').dispatchEvent(new Event('input'));
     byId('domain').value='delivery';byId('domain').dispatchEvent(new Event('change'));
     check(cards().length===latest.items.filter(i=>RadarDomains.matchesDomain(i,'delivery')).length,'domain filter');
     byId('domain').value='all';byId('domain').dispatchEvent(new Event('change'));
     document.querySelector('.history').open=true;
     check(document.querySelectorAll('#history-series .history-row').length===Math.min(8,RADAR_EDITIONS.length),'history rows');
     check(document.querySelector('#history-series .history-segment').style.width!=='','dynamic chart width');
     check(byId('evidence-matches').textContent.trim().length>0,'historical evidence state');
     document.querySelector('.archive-search').open=true;
     const archiveQuery=byId('archive-query');
     archiveQuery.value=latest.items[0].name;archiveQuery.dispatchEvent(new Event('input'));
     const archiveExpected=RadarTrends.searchArchive(RADAR_EDITIONS,archiveQuery.value);
     check(archiveExpected.total>0&&byId('archive-results').querySelectorAll('a').length===archiveExpected.results.length,'archive search results');
     check(byId('archive-results').querySelector('a').hash===archiveExpected.results[0].hash,'archive links use published reference');
     check(cards().length===latest.items.length,'archive search preserves weekly view');
     archiveQuery.value='__no_case_expected__';archiveQuery.dispatchEvent(new Event('input'));
     check(byId('archive-results').children.length===0&&byId('archive-count').textContent.includes('No hay coincidencias'),'archive empty state');
     archiveQuery.value='';archiveQuery.dispatchEvent(new Event('input'));
     const historyButton=document.querySelector('#history-series button');
     historyButton.click();check(byId('week').value!== 'local','history navigation');
     byId('reset').click();check(byId('week').value===latest.id,'reset latest');
     check(document.documentElement.scrollWidth<=window.innerWidth,'horizontal overflow');
     setTimeout(()=>{
       document.documentElement.dataset.smoke=violations.length||errors.length?'failed':'passed';
       document.documentElement.dataset.smokeDetail=[...violations,...errors].join('; ');
     },100);
   }catch(error){document.documentElement.dataset.smoke='failed';document.documentElement.dataset.smokeDetail=error.message;}
 });
})();
