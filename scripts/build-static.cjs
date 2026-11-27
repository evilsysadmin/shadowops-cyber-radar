'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=Object.freeze(['index.html','data/editions.js','lib/validation.js','lib/domains.js','lib/trends.js']);
function build(destination){
 const output=path.resolve(destination);
 // Never remove or overwrite an existing directory.
 fs.mkdirSync(output);
 try{
   for(const relative of files){
     const source=path.join(root,relative),target=path.join(output,relative);
     if(!fs.lstatSync(source).isFile())throw Error('Static asset must be a regular file: '+relative);
     fs.mkdirSync(path.dirname(target),{recursive:true});
     fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
   }
   fs.writeFileSync(path.join(output,'.nojekyll'),'');
 }catch(error){fs.rmSync(output,{recursive:true,force:true});throw error;}
 return output;
}
if(require.main===module){
 try{
   const [dest='dist',...extra]=process.argv.slice(2);
   if(extra.length)throw Error('Usage: node scripts/build-static.cjs [new-directory]');
   console.log('Static radar built: '+build(dest));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={build};
