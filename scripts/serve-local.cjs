'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const routes=new Map([
 ['/', 'index.html'],['/index.html','index.html'],['/review.html','review.html'],
 ['/draft.html','draft.html'],['/editor.css','editor.css'],['/radar.css','radar.css'],['/data/editions.js','data/editions.js'],
 ...['validation','domains','trends','radar-ui','workbench','review-session','workbench-ui','draft-editor','draft-editor-ui'].map(n=>['/lib/'+n+'.js','lib/'+n+'.js'])
]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};
function createLocalServer(){
 return http.createServer((req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
  // No cross-origin API, directory listing, or arbitrary filesystem mapping.
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{...headers,Allow:'GET, HEAD'});return res.end();}
  if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||'')){res.writeHead(403,headers);return res.end();}
  const route=String(req.url||'').split('?')[0],file=routes.get(route);
  if(!file){res.writeHead(404,headers);return res.end();}
  try{
   const full=path.join(root,file);
   if(!fs.lstatSync(full).isFile())throw Error('Not a regular file');
   const bytes=fs.readFileSync(full);
   const editorial=file==='review.html';
   const csp="default-src 'none'; script-src 'self'; style-src 'self'"+(editorial?" 'unsafe-inline'":"")+"; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
   res.writeHead(200,{...headers,'Content-Security-Policy':csp,'Content-Type':mime[path.extname(file)],'Content-Length':bytes.length});
   res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(500,headers);res.end();}
 });
}
function parsePort(value='8080'){
 if(!/^\d{1,5}$/.test(value)||Number(value)<1||Number(value)>65535)throw Error('Puerto inválido');
 return Number(value);
}
if(require.main===module){
 try{
  const [port,...extra]=process.argv.slice(2);
  if(extra.length)throw Error('Uso: node scripts/serve-local.cjs [PUERTO]');
  const server=createLocalServer();
  server.on('error',e=>{console.error(e.message);process.exitCode=1;});
  server.listen(parsePort(port),'127.0.0.1',()=>{
   const base='http://127.0.0.1:'+server.address().port;
   console.log('Cyber Radar: '+base+'/\nMesa editorial: '+base+'/review.html');
  });
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={createLocalServer,parsePort};
