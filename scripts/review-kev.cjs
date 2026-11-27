'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArchive,buildReviewQueue}=require('../lib/review.cjs');
async function main(){
  const [input,archive=path.join(__dirname,'../data/editions.js'),...extra]=process.argv.slice(2);
  if(!input||extra.length)throw Error('Uso: node scripts/review-kev.cjs candidatos.json [editions.js]');
  const batch=JSON.parse(await fs.readFile(input,'utf8'));
  const editions=parseArchive(await fs.readFile(archive,'utf8'));
  process.stdout.write(JSON.stringify(buildReviewQueue(batch,editions),null,2)+'\n');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
