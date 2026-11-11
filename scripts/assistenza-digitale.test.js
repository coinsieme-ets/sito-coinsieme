'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const catalog=require('../anteprima-sportello/app/servizi');
test('digital: one shared record per service, existing category and documented sources',()=>{
 const rows=catalog.resources.filter(x=>x.id==='coinsieme-barriere-digitali'||x.id.startsWith('facilitazione-roma-'));
 assert.equal(rows.length,4);assert.equal(new Set(catalog.resources.map(x=>x.id)).size,catalog.resources.length);
 for(const row of rows){assert.equal(row.category,'digitale');assert.match(row.source,/^https:\/\//);assert.equal(row.verifiedAt,'2026-11-11');}
 assert.equal(rows[0].source,'https://servizi.coinsieme.it/');
 assert.match(rows[0].access,/Non sono confermati/);
 assert(catalog.resources.find(x=>x.id==='info-digitale').links.some(x=>x.url==='/casa-che-si-prende-cura/'));
});
test('digital: municipal days and hours match 2026 official calendar',()=>{
 const rows=catalog.resources.filter(x=>x.id.startsWith('facilitazione-roma-'));
 assert.deepEqual(rows.map(x=>x.municipio),['IV','V','VI']);
 assert.match(rows[0].hours,/Lunedì e mercoledì/);assert.match(rows[1].hours,/Lunedì e mercoledì/);assert.match(rows[2].hours,/Martedì e giovedì/);
 for(const row of rows){assert.match(row.hours,/8:30–13:00/);assert.match(row.access,/Nessuna disponibilità in tempo reale/);assert(row.notes.some(x=>x.includes('non documentate')));}
});
test('digital: static noindex preview is rendered from catalog without collecting data',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-digital-'));
 try{
  const html=require('./build-assistenza-digitale').build(path.join(dir,'index.html'));
  for(const row of catalog.resources.filter(x=>x.id.startsWith('facilitazione-roma-')))assert(html.includes(row.address));
  assert.match(html,/noindex,follow/);assert.match(html,/id="contenuto" tabindex="-1"/);assert.match(html,/href="#contenuto"/);
  assert.equal((html.match(/data-municipio=/g)||[]).length,3);assert(!html.includes('{{'));
  assert.doesNotMatch(html,/<form\b|<input\b|<iframe\b/);
  assert.match(html,/richieste e iscrizioni non attive/);assert.match(html,/non attiva nuovi servizi/);
  const js=fs.readFileSync(path.join(__dirname,'../js/assistenza-digitale.js'),'utf8');
  assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|sendBeacon/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('digital: both existing Pages builds regenerate the page and retain its dependencies',()=>{
 const cms=fs.readFileSync(path.join(__dirname,'build-cms.js'),'utf8');
 assert(cms.includes("require('./build-assistenza-digitale').build()"));
 for(const name of ['build-articoli.yml','sync-rassegna.yml']){
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows',name),'utf8');
  assert(workflow.includes('scripts/build-cms.js'));assert(workflow.includes('cp *.html'));
  assert.match(workflow,/for dir in [^\n]*\bcss\b[^\n]*\bjs\b/);
 }
});
