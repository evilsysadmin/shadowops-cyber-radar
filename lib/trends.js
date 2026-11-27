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
 const api={weeklySeries,types};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarTrends=api;
})(globalThis);
