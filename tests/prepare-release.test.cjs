'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {prepareArchive}=require('../lib/prepare-archive.cjs');
const {parseArchive}=require('../lib/review.cjs');
const {normalizeBatch,draftReport}=require('../lib/workbench.js');
const {reviewDisclosures}=require('../lib/disclosures.cjs');
const archive=fs.readFileSync(path.join(__dirname,'../data/editions.js'),'utf8');
function filled(){
 const from='2030-12-01',through='2030-12-07';
 const batch=normalizeBatch(reviewDisclosures([{organization:'Example',title:'Fixture',summary:'Synthetic',sourceKind:'vendor',proposedType:'watch',publicationDate:through,incidentDate:null,url:'https://example.org/report'}],[],from,through));
 const d=draftReport(batch,new Map([[batch.candidates[0].id,'investigate']]));
 d.editorial={pattern:'Synthetic test',action:'Review'};
 Object.assign(d.candidates[0].review,{verified:true,name:'Example',type:'watch',publicationDate:through,incident:'Desconocido',vector:'Desconocido',impact:'Desconocido',lesson:'Consultar aviso',tags:[],additionalSources:[]});
 return d;
}
test('release candidate preserves existing archive exactly as data and adds newest first',()=>{
 const result=prepareArchive(archive,filled());new vm.Script(result);
 const editions=parseArchive(result);
 assert.equal(editions[0].id,'2030-12-07');assert.deepEqual(editions.slice(1),parseArchive(archive));
 assert.throws(()=>prepareArchive(result,filled()),/ya existe/);
});
test('rejects backfill, incomplete draft and corrupt archive',()=>{
 const newer=prepareArchive(archive,filled());const d=filled();
 d.through='2030-12-06';d.candidates[0].evidence.day=d.through;d.candidates[0].review.publicationDate=d.through;
 assert.throws(()=>prepareArchive(newer,d),/posterior/);
 const invalid=filled();invalid.candidates[0].review.verified=false;
 assert.throws(()=>prepareArchive(archive,invalid));
 assert.throws(()=>prepareArchive('const RADAR_EDITIONS = []; alert(1);',filled()));
});
test('CLI never overwrites existing output',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-release-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const draft=path.join(dir,'draft.json'),out=path.join(dir,'editions.js');fs.writeFileSync(draft,JSON.stringify(filled()));
 const run=()=>spawnSync(process.execPath,[path.join(__dirname,'../scripts/prepare-release.cjs'),draft,out],{encoding:'utf8',timeout:5000});
 assert.equal(run().status,0);const first=fs.readFileSync(out,'utf8');
 assert.notEqual(run().status,0);assert.equal(fs.readFileSync(out,'utf8'),first);
});
