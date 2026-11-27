'use strict';
(function(root){
 const types=['breach','exploit','watch'];
 function weeklySeries(editions,limit=8){
   if(!Number.isInteger(limit)||limit<1||limit>52)throw Error('Invalid history limit');
   return editions.slice().sort((a,b)=>a.id.localeCompare(b.id)).slice(-limit).map(edition=>{
     const counts={breach:0,exploit:0,watch:0};
     for(const item of edition.items)if(Object.hasOwn(counts,item.type))counts[item.type]++;
     return {id:edition.id,period:edition.period,total:edition.items.length,...counts};
   });
 }
 const domains=typeof module==='object'&&module.exports?require('./domains.js'):root.RadarDomains;
 function technicalPatterns(editions,limit=8){
   const selected=editions.slice().sort((a,b)=>a.id.localeCompare(b.id)).slice(-limit);
   if(!Number.isInteger(limit)||limit<1||limit>52)throw Error('Invalid history limit');
   const rows=Object.entries(domains.groups).map(([key,g])=>({key,label:g.label,entries:0,editions:0,latest:0}));
   let total=0;
   for(const edition of selected){
     total+=edition.items.length;
     const counts=domains.domainCounts(edition.items);
     for(const row of rows){row.entries+=counts[row.key];if(counts[row.key]>0)row.editions++;if(edition===selected.at(-1))row.latest=counts[row.key];}
   }
   return {total,editionCount:selected.length,rows:rows.filter(r=>r.entries>0).sort((a,b)=>b.editions-a.editions||b.entries-a.entries||a.key.localeCompare(b.key))};
 }
 const api={weeklySeries,technicalPatterns,types};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarTrends=api;
})(globalThis);
