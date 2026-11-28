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
 const {canonical}=typeof module==='object'&&module.exports?require('./editorial-contract.js'):root.RadarEditorialContract;
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
 // Evidence matches are not incident identities. No matching on organization names.
 function evidenceMatches(editions,limit=8){
   if(!Number.isInteger(limit)||limit<1||limit>52)throw Error('Invalid history limit');
   const selected=editions.slice().sort((a,b)=>a.id.localeCompare(b.id)).slice(-limit);
   const groups=new Map();
   for(const edition of selected){
     for(const [index,item] of edition.items.entries()){
       const keys=new Map();
       for(const tag of item.tags||[]){
         const cve=tag.trim().toUpperCase();
         if(/^CVE-\d{4}-\d{4,}$/.test(cve))keys.set('cve:'+cve,{kind:'cve',value:cve});
       }
       for(const [label,url] of item.sources||[]){
         try{
           const u=new URL(canonical(url));
           // Catalog homepages and search results aren't incident-specific links.
           if(u.pathname==='/'||/\/known-exploited-vulnerabilities-catalog\/?$/.test(u.pathname))continue;
           keys.set('url:'+u.href,{kind:'url',value:u.href,label});
         }catch{}
       }
       for(const [key,meta] of keys){
         if(!groups.has(key))groups.set(key,{...meta,refs:[]});
         groups.get(key).refs.push({edition:edition.id,index,name:item.name,type:item.type});
       }
     }
   }
   return [...groups.values()].map(g=>({...g,editionCount:new Set(g.refs.map(r=>r.edition)).size})).filter(g=>g.editionCount>=2).sort((a,b)=>b.editionCount-a.editionCount||b.refs.length-a.refs.length||a.value.localeCompare(b.value));
 }
 function matchesSearch(item,query){
   const normalize=v=>String(v??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
   const tokens=normalize(query).trim().split(/\s+/).filter(Boolean);
   if(!tokens.length)return true;
   const haystack=normalize([item.name,item.date,item.incident,item.vector,item.impact,item.lesson,...(item.tags||[]),...(item.sources||[]).flat()].join(' '));
   return tokens.every(t=>haystack.includes(t));
 }
 // A content fingerprint is a navigation guard, not a cryptographic signature.
 function caseFingerprint(item){
   const raw=JSON.stringify([item.name,item.type,item.date,item.incident,item.vector,item.impact,item.lesson,item.tags,item.sources]);
   let hash=2166136261;
   for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619);
   return (hash>>>0).toString(16).padStart(8,'0');
 }
 function caseHash(edition,index){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(edition.id)||!Number.isInteger(index)||index<0||index>=edition.items.length||index>=500)throw Error('Invalid case reference');
   return '#case='+edition.id+'/'+(index+1)+'/'+caseFingerprint(edition.items[index]);
 }
 function resolveCaseHash(editions,hash){
   const m=typeof hash==='string'&&hash.match(/^#case=(\d{4}-\d{2}-\d{2})\/([1-9]\d{0,2})\/([a-f0-9]{8})$/);
   if(!m||Number(m[2])>500)return null;
   const edition=editions.find(e=>e.id===m[1]);
   if(!edition)return null;
   const index=Number(m[2])-1;
   if(edition.items[index]&&caseFingerprint(edition.items[index])===m[3])return {edition,index};
   const matches=edition.items.map((item,i)=>caseFingerprint(item)===m[3]?i:-1).filter(i=>i>=0);
   return matches.length===1?{edition,index:matches[0]}:null;
 }
 function searchArchive(editions,query,limit=50){
   if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Invalid search limit');
   if(typeof query!=='string'||!query.trim())return {total:0,results:[]};
   const results=[];let total=0;
   for(const edition of editions.slice().sort((a,b)=>b.id.localeCompare(a.id))){
     for(const [index,item] of edition.items.entries()){
       if(!matchesSearch(item,query))continue;
       total++;
       if(results.length<limit)results.push({edition:edition.id,index,name:item.name,type:item.type,date:item.date,hash:caseHash(edition,index)});
     }
   }
   return {total,results};
 }
 const api={weeklySeries,technicalPatterns,evidenceMatches,matchesSearch,caseHash,resolveCaseHash,searchArchive,types};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarTrends=api;
})(globalThis);
