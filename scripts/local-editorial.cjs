'use strict';
const fs=require('node:fs');
const {assistLocal}=require('../lib/local-editorial.cjs');
async function main(){
 const [input,model,...extra]=process.argv.slice(2);
 if(!input||!model||extra.length)throw Error('Uso: node scripts/local-editorial.cjs borrador.json MODELO');
 const raw=fs.readFileSync(input,'utf8');if(Buffer.byteLength(raw)>8*1024*1024)throw Error('Borrador demasiado grande');
 const result=await assistLocal(JSON.parse(raw),model);
 console.error('Solicitudes: '+result.requests+' · propuestas: '+result.suggestions+' · revisión humana obligatoria');
 process.stdout.write(JSON.stringify(result.draft,null,2)+'\n');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
