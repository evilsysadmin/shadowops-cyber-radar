'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {parseArchive}=require('../lib/review.cjs');
const {weeklyBriefing}=require('../lib/weekly-briefing.cjs');
const {isoDate}=require('../lib/kev.cjs');
try{
 const [id,archive=path.join(__dirname,'../data/editions.js'),...extra]=process.argv.slice(2);
 if(extra.length)throw Error('Uso: node scripts/weekly-briefing.cjs [YYYY-MM-DD] [editions.js]');
 if(id)isoDate(id);
 const editions=parseArchive(fs.readFileSync(archive,'utf8'));
 const selected=id?editions.find(e=>e.id===id):editions.slice().sort((a,b)=>b.id.localeCompare(a.id))[0];
 if(!selected)throw Error('Edición no encontrada');
 process.stdout.write(weeklyBriefing(selected));
}catch(e){console.error(e.message);process.exitCode=1;}
