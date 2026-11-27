'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {reviewDisclosures,parseArchive}=require('../lib/disclosures.cjs');
async function main(){
  const [from,through,input,archive=path.join(__dirname,'../data/editions.js'),...extra]=process.argv.slice(2);
  if(!from||!through||!input||extra.length)throw Error('Uso: node scripts/review-disclosures.cjs FROM THROUGH disclosures.json [editions.js]');
  const records=JSON.parse(await fs.readFile(input,'utf8'));
  const editions=parseArchive(await fs.readFile(archive,'utf8'));
  process.stdout.write(JSON.stringify(reviewDisclosures(records,editions,from,through),null,2)+'\n');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
