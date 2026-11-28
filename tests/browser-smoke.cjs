'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawn}=require('node:child_process');
const {build}=require('../scripts/build-static.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-browser-'));
const dist=path.join(tmp,'dist');
const chrome=process.env.CHROME_BIN||'google-chrome';
let server;
function browser(url,label){
 console.log('Browser smoke starting: '+label);
 return new Promise((resolve,reject)=>{
   const child=spawn(chrome,['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-sync','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(tmp,'profile'),'--window-size=390,900','--virtual-time-budget=3000','--dump-dom',url],{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
   function stop(){try{if(process.platform!=='win32'&&child.pid)process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch(e){if(e.code!=='ESRCH')console.error('Chrome cleanup: '+e.message);}}
   let stdout='',stderr='';
   const timer=setTimeout(()=>{stop();reject(Error('Browser smoke timed out: '+label+'; '+stderr));},45000);
   child.stdout.on('data',d=>{stdout+=d;if(stdout.length>4*1024*1024){stop();reject(Error('Browser smoke output exceeded limit: '+label));}});
   child.stderr.on('data',d=>{stderr=(stderr+d).slice(-4000);});
   child.on('error',e=>{clearTimeout(timer);reject(e);});
   child.on('close',code=>{clearTimeout(timer);if(code!==0||!/<html[^>]*data-smoke="passed"/.test(stdout)){const detail=stdout.match(/data-smoke-detail="([^"]*)"/)?.[1];reject(Error('Browser smoke failed: '+label+'; '+(detail||stderr||'missing success marker')));}else resolve();});
 });
}
async function main(){
 build(dist);
 const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 const modified=html.replace('</head>','<script src="smoke.js"></script></head>');
 if(modified===html)throw Error('Cannot attach test harness');
 const assets=new Map([['/','index.html'],['/radar.css','radar.css'],...Array.from(html.matchAll(/<script src="([^"]+)"/g),m=>['/'+m[1],m[1]])]);
 const review=fs.readFileSync(path.join(__dirname,'../review.html'),'utf8').replace('</head>','<script src="editorial-smoke.js"></script></head>');
 const editorialAssets=new Set([...review.matchAll(/<script src="(lib\/[^" ]+)"/g)].map(m=>'/'+m[1]));
 const draft=fs.readFileSync(path.join(__dirname,'../draft.html'),'utf8').replace('</head>','<script src="draft-smoke.js"></script></head>');
 const draftAssets=new Set(['/editor.css','/lib/validation.js','/lib/editorial-contract.js','/lib/compile-draft.js','/lib/draft-editor.js','/lib/draft-session.js','/lib/draft-editor-ui.js']);
 const headers=Object.fromEntries(fs.readFileSync(path.join(dist,'_headers'),'utf8').split('\n').filter(l=>/^  [\w-]+: /.test(l)).map(l=>{const i=l.indexOf(':');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
 if(!headers['Content-Security-Policy'])throw Error('Missing CSP');
 server=http.createServer((req,res)=>{
   const url=req.url;
   if(url==='/draft.html'||url==='/draft.html?restore'){res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8'});return res.end(draft);}
   if(url==='/draft-smoke.js'){res.writeHead(200,{...headers,'Content-Type':'application/javascript; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'draft-browser-fixture.js')));}
   if(draftAssets.has(url)){res.writeHead(200,{...headers,'Content-Type':url.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'..',url.slice(1))));}
   if(url==='/review.html'||url==='/review.html?restore'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(review);}
   if(url==='/editorial-smoke.js'){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'editorial-browser-fixture.js')));}
   if(editorialAssets.has(url)){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'..',url.slice(1))));}
   if(url==='/smoke.js'){res.writeHead(200,{...headers,'Content-Type':'application/javascript; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'browser-smoke-fixture.js')));}
   if(!assets.has(url)){res.writeHead(404);return res.end();}
   const file=assets.get(url);
   const mime=file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript';
   res.writeHead(200,{...headers,'Content-Type':mime+'; charset=utf-8'});
   res.end(url==='/'?modified:fs.readFileSync(path.join(dist,file)));
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const {parseArchive}=require('../lib/review.cjs');
 const {caseHash}=require('../lib/trends.js');
 const latest=parseArchive(fs.readFileSync(path.join(dist,'data/editions.js'),'utf8')).slice().sort((a,b)=>b.id.localeCompare(a.id))[0];
 const direct=caseHash(latest,Math.min(1,latest.items.length-1));
 await browser('http://127.0.0.1:'+server.address().port+'/'+direct,'public dashboard direct case link');
 console.log('Browser smoke passed with deployment CSP');
 await browser('http://127.0.0.1:'+server.address().port+'/review.html','editorial import and decisions');
 await browser('http://127.0.0.1:'+server.address().port+'/review.html?restore','editorial session recovery');
 console.log('Editorial browser smoke passed, including reload recovery');
 await browser('http://127.0.0.1:'+server.address().port+'/draft.html','draft editor verification and export');
 await browser('http://127.0.0.1:'+server.address().port+'/draft.html?restore','draft session recovery');
 console.log('Draft editor browser smoke passed');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>{if(server)server.close();fs.rmSync(tmp,{recursive:true,force:true});});
