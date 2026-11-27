'use strict';
(function(root){
 const api=typeof module==='object'&&module.exports?require('./workbench.js'):root.RadarWorkbench;
 const key='shadowops.radar.review.v1',limit=4*1024*1024;
 const allowed=new Set(['pending','investigate','covered','dismiss']);
 function decode(raw){
   if(typeof raw!=='string'||raw.length>limit)throw Error('Sesión demasiado grande');
   const saved=JSON.parse(raw);
   if(!saved||saved.version!==1||!Array.isArray(saved.decisions))throw Error('Sesión inválida');
   const batch=api.normalizeBatch(saved.queue),ids=new Set(batch.candidates.map(c=>c.id)),decisions=new Map();
   for(const pair of saved.decisions){
     if(!Array.isArray(pair)||pair.length!==2||!ids.has(pair[0])||!allowed.has(pair[1])||decisions.has(pair[0]))throw Error('Decisión inválida');
     decisions.set(pair[0],pair[1]);
   }
   return {queue:saved.queue,batch,decisions};
 }
 function save(storage,queue,decisions){
   try{
     const raw=JSON.stringify({version:1,queue,decisions:[...decisions]});
     decode(raw);storage.setItem(key,raw);return true;
   }catch{
     // A stale snapshot must not silently masquerade as the latest one.
     try{storage.removeItem(key);}catch{}
     return false;
   }
 }
 function restore(storage){
   try{const raw=storage.getItem(key);return raw===null?{status:'empty'}:{status:'restored',...decode(raw)};}
   catch{return {status:'unavailable'};}
 }
 function clear(storage){try{storage.removeItem(key);return true;}catch{return false;}}
 const result={save,restore,clear};
 if(typeof module==='object'&&module.exports)module.exports=result;else root.RadarSession=result;
})(globalThis);
