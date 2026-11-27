'use strict';
const {sourceHealth}=require('../lib/source-health.cjs');
try{
 const [from,through,...extra]=process.argv.slice(2);
 if(!from||!through||extra.length)throw Error('Uso: node scripts/source-health.cjs FROM THROUGH');
 const result=sourceHealth(from,through);
 console.log(JSON.stringify(result,null,2));
 if(!result.healthy)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
