'use strict';
const {canonical,reviewDisclosures}=require('./disclosures.cjs');
// Curated records take precedence over discovery-only records of the same URL.
// Preserve conflicting discoveries as an error rather than guessing a winner.
function mergeDisclosures(curated, discovered, from, through){
  const checked=reviewDisclosures(curated,[],from,through);
  const curatedUrls=new Set(checked.candidates.map(c=>c.sources[0][1]));
  const seen=new Map();
  for(const rows of discovered){
    if(!Array.isArray(rows)||rows.length>2000)throw Error('RSS input inválido');
    for(const row of rows){
      if(!row||row.proposedType!=='watch'||row.incidentDate!==null||!['cert','vendor'].includes(row.sourceKind))throw Error('RSS debe contener propuestas no verificadas');
      // Validate every discovery before precedence or filtering.
      const validated=reviewDisclosures([row],[],from,through);
      if(!validated.candidates.length)continue;
      const url=canonical(row.url);
      if(curatedUrls.has(url))continue;
      const normalized={...row,url};
      if(seen.has(url)&&JSON.stringify(seen.get(url))!==JSON.stringify(normalized))throw Error('Descubrimientos en conflicto: '+url);
      seen.set(url,normalized);
    }
  }
  const result=[...curated,...seen.values()];
  if(result.length>2000)throw Error('Demasiados comunicados');
  return result;
}
module.exports={mergeDisclosures};
