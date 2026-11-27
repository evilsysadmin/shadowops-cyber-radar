'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {prepareArchive}=require('../lib/prepare-archive.cjs');
try{
 const [draft,output,archive=path.join(__dirname,'../data/editions.js'),...extra]=process.argv.slice(2);
 if(!draft||!output||extra.length)throw Error('Uso: node scripts/prepare-release.cjs borrador.json nuevo-editions.js [histórico.js]');
 // Exclusive creation protects both the existing archive and any prior output.
 const text=prepareArchive(fs.readFileSync(archive,'utf8'),JSON.parse(fs.readFileSync(draft,'utf8')));
 fs.writeFileSync(output,text,{flag:'wx'});
 console.log('Histórico candidato preparado: '+output+'; revisar diff y abrir PR explícitamente.');
}catch(e){console.error(e.message);process.exitCode=1;}
