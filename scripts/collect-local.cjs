'use strict';
const {rollingWindow,collect}=require('../lib/local-collection.cjs');
try{
 const args=process.argv.slice(2);
 if(args.length!==0&&args.length!==2)throw Error('Uso: node scripts/collect-local.cjs [FROM THROUGH]');
 const interval=args.length?{from:args[0],through:args[1]}:rollingWindow();
 const result=collect(interval);
 console.log('Cola validada: '+result.file+' ('+result.candidates+' candidatos)');
 console.log('Importa el archivo en la mesa editorial local.');
}catch(e){console.error(e.message);process.exitCode=1;}
