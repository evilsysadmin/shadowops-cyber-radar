'use strict';
const {parseArchive}=require('./review.cjs');
const {validateEdition}=require('./validation.js');
const {isoDate}=require('./kev.cjs');
const {compileDraft}=require('./compile-draft.cjs');
function prepareArchive(existing,draft){
 const editions=parseArchive(existing);
 if(!editions.length)throw Error('Histórico vacío');
 for(const edition of editions){isoDate(edition.id);validateEdition(edition);}
 const next=compileDraft(draft);
 if(editions.some(e=>e.id===next.id))throw Error('La edición ya existe; no se sobrescribe');
 if(editions.some(e=>e.id>next.id))throw Error('Solo se permite añadir una edición posterior');
 const items=new Set();
 for(const item of next.items){
   const key=JSON.stringify([item.name,item.type,item.date,item.incident,item.vector,item.impact,item.lesson,[...item.tags].sort(),item.sources.map(s=>s[1]).sort()]);
   if(items.has(key))throw Error('Ficha duplicada');
   items.add(key);
 }
 return 'const RADAR_EDITIONS = '+JSON.stringify([next,...editions],null,2)+';\n';
}
module.exports={prepareArchive};
