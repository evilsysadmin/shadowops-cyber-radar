'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {isoDate,fetchKev,candidatesFromKev}=require('../lib/kev.cjs');
const {parseArchive,buildReviewQueue}=require('../lib/review.cjs');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const {normalizeBatch}=require('../lib/workbench.js');
const root=path.join(__dirname,'..');
async function main(){
  const [from,through,localKev,disclosureFile=path.join(root,'data/disclosures.json'),archiveFile=path.join(root,'data/editions.js'),...extra]=process.argv.slice(2);
  if(!from||!through||extra.length)throw Error('Uso: node scripts/weekly-review.cjs FROM THROUGH [kev.json|-] [disclosures.json] [editions.js]');
  isoDate(from);isoDate(through);
  if(from>through)throw Error('Intervalo invertido');
  const archive=parseArchive(await fs.readFile(archiveFile,'utf8'));
  const records=JSON.parse(await fs.readFile(disclosureFile,'utf8'));
  const disclosures=reviewDisclosures(records,archive,from,through);
  const catalog=localKev&&localKev!=='-'?JSON.parse(await fs.readFile(localKev,'utf8')):await fetchKev();
  const kev=buildReviewQueue({schemaVersion:1,source:'CISA KEV',from,through,candidates:candidatesFromKev(catalog,from,through)},archive);
  const report={schemaVersion:1,source:'weekly review',from,through,batches:[kev,disclosures]};
  normalizeBatch(report);
  const output=JSON.stringify(report,null,2)+'\n';
  if(Buffer.byteLength(output)>4*1024*1024)throw Error('Cola demasiado grande para la mesa editorial');
  process.stdout.write(output);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
