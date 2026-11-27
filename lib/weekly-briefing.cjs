'use strict';
const {validateEdition}=require('./validation.js');
const {isoDate}=require('./kev.cjs');
const labels={breach:'Brechas confirmadas',exploit:'Explotación activa',watch:'Seguimiento / alertas'};
function plain(value){
 return String(value).replace(/[\r\n\t]+/g,' ').replace(/[\u0000-\u001f\u007f]/g,'').replace(/[\\\x60*_{}\[\]()<>#+!|~&]/g,c=>'\\'+c);
}
function safeLink(value){
 const u=new URL(value);
 return '<'+u.href.replace(/[<>\s]/g,c=>encodeURIComponent(c))+'>';
}
function weeklyBriefing(edition){
 validateEdition(edition);isoDate(edition.id);
 const lines=['# HMMMM · Cyber Radar — '+plain(edition.period),'','Selección editorial de fichas publicadas. No es un inventario exhaustivo ni una medida de ataques mundiales.','','**'+edition.items.length+' fichas** · '+Object.entries(labels).map(([type,label])=>label+': '+edition.items.filter(i=>i.type===type).length).join(' · '),''];
 for(const [type,label] of Object.entries(labels)){
  const items=edition.items.filter(i=>i.type===type);
  if(!items.length)continue;
  lines.push('## '+label,'');
  for(const item of items){
   lines.push('### '+plain(item.name),'','- **Fecha de fuente:** '+plain(item.date),'- **Incidente:** '+plain(item.incident),'- **Vector:** '+plain(item.vector),'- **Impacto:** '+plain(item.impact),'- **Lección:** '+plain(item.lesson),'- **Fuentes:** '+item.sources.map(([name,url])=>'['+plain(name)+']('+safeLink(url)+')').join(' · '),'');
  }
 }
 lines.push('## Lectura SRE / DevSecOps','',plain(edition.pattern),'','**Acción:** '+plain(edition.action),'');
 return lines.join('\n');
}
module.exports={weeklyBriefing};
