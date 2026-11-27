'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {candidate,verify}=require('../lib/release-candidate.cjs');
const sha='a'.repeat(40);
function temp(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-release-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
test('release records exact SHA and reproducible inventory excluding itself',t=>{
 const root=temp(t),a=path.join(root,'a'),b=path.join(root,'b');
 const one=candidate(a,sha),two=candidate(b,sha);
 assert.deepEqual(one,two);assert.deepEqual(verify(a,sha),one);
 assert.ok(one.files.some(f=>f.path==='_headers'));assert.ok(!one.files.some(f=>f.path==='review.html'||f.path==='release.json'));
 assert.throws(()=>verify(a,'b'.repeat(40)));
});
test('verification rejects altered, extra, missing and symlinked assets',t=>{
 const root=temp(t);
 for(const [i,edit] of [d=>fs.appendFileSync(path.join(d,'index.html'),'tampered'),d=>fs.writeFileSync(path.join(d,'extra'),'x'),d=>fs.unlinkSync(path.join(d,'radar.css')),d=>{fs.unlinkSync(path.join(d,'radar.css'));fs.symlinkSync('index.html',path.join(d,'radar.css'));}].entries()){
  const dir=path.join(root,String(i));candidate(dir,sha);edit(dir);assert.throws(()=>verify(dir,sha));
 }
});
test('invalid SHA and preexisting directory never overwritten',t=>{
 const root=temp(t),dest=path.join(root,'new');assert.throws(()=>candidate(dest,'main'));assert.ok(!fs.existsSync(dest));
 fs.mkdirSync(dest);fs.writeFileSync(path.join(dest,'keep'),'x');assert.throws(()=>candidate(dest,sha));assert.equal(fs.readFileSync(path.join(dest,'keep'),'utf8'),'x');
});
