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
function browser(url){
 return new Promise((resolve,reject)=>{
   const child=spawn(chrome,['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(tmp,'profile'),'--window-size=390,900','--virtual-time-budget=3000','--dump-dom',url],{stdio:['ignore','pipe','pipe']});
   let stdout='',stderr='';
   const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Browser smoke timed out'));},30000);
   child.stdout.on('data',d=>{stdout+=d;if(stdout.length>4*1024*1024)child.kill('SIGKILL');});
   child.stderr.on('data',d=>{stderr=(stderr+d).slice(-4000);});
   child.on('error',e=>{clearTimeout(timer);reject(e);});
   child.on('close',code=>{clearTimeout(timer);if(code!==0||!/<html[^>]*data-smoke="passed"/.test(stdout)){const detail=stdout.match(/data-smoke-detail="([^"]*)"/)?.[1];reject(Error('Browser smoke failed: '+(detail||stderr||'missing success marker')));}else resolve();});
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
 const headers=Object.fromEntries(fs.readFileSync(path.join(dist,'_headers'),'utf8').split('\n').filter(l=>/^  [\w-]+: /.test(l)).map(l=>{const i=l.indexOf(':');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
 if(!headers['Content-Security-Policy'])throw Error('Missing CSP');
 server=http.createServer((req,res)=>{
   const url=req.url;
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
 await browser('http://127.0.0.1:'+server.address().port+'/');
 console.log('Browser smoke passed with deployment CSP');
 await browser('http://127.0.0.1:'+server.address().port+'/review.html');
 await browser('http://127.0.0.1:'+server.address().port+'/review.html?restore');
 console.log('Editorial browser smoke passed, including reload recovery');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>{if(server)server.close();fs.rmSync(tmp,{recursive:true,force:true});});
