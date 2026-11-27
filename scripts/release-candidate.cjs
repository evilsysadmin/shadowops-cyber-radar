'use strict';
const {candidate,verify}=require('../lib/release-candidate.cjs');
try{
 const [mode,dir,sha,...extra]=process.argv.slice(2);
 if(!dir||!sha||extra.length||!['build','verify'].includes(mode))throw Error('Usage: node scripts/release-candidate.cjs build|verify DIRECTORY SHA');
 const result=mode==='build'?candidate(dir,sha):verify(dir,sha);
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
