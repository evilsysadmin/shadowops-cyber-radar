'use strict';
const fs=require('node:fs');
const {compileDraft}=require('../lib/compile-draft.cjs');
try{
 const [input,...extra]=process.argv.slice(2);
 if(!input||extra.length)throw Error('Uso: node scripts/compile-draft.cjs borrador.json');
 const raw=fs.readFileSync(input,'utf8');
 if(Buffer.byteLength(raw)>8*1024*1024)throw Error('Borrador demasiado grande');
 const edition=compileDraft(JSON.parse(raw));
 process.stdout.write(JSON.stringify(edition,null,2)+'\n');
}catch(e){console.error(e.message);process.exitCode=1;}
