'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const item=require('../anteprima-sportello/app/ortopedia24ore'),catalog=require('../anteprima-sportello/app/servizi'),home=require('../anteprima-sportello/app/orientamento'),mobility=require('../anteprima-sportello/app/mobilita');
const context={window:{}};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/mobilita-data.js','utf8'),context);const data=context.window.SportelloMobilitaData;
test('Ortopedia24ore: un record condiviso, categorie invariate e nessun servizio diagnostico',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,51);
 assert.equal(catalog.technicalResources.filter(r=>r.id===item.id).length,1);
 assert.deepEqual(item.categories,['mobilita','domicilio']);assert.equal(catalog.isVerifiedResource(item),true);
 assert.equal(catalog.resources.filter(r=>/ortopedia24|ortopedia centocelle/i.test(r.name)).length,0);
 assert.equal(mobility.normalize(item,data,'ausili'),item);
});
test('Ortopedia24ore: ricerca e territorio nei due percorsi senza accorpamenti commerciali',()=>{
 for(const name of ['Ortopedia24ore','Ortopedia Centocelle','noleggio','sollevatori','letti ospedalieri','deambulatori']){
  for(const territory of ['tutti','v','est','roma']){
   assert.equal(mobility.choose(data,{name,territory,kind:'ausili'},catalog.technicalResources).filter(r=>r.id===item.id).length,1);
   assert.equal(home.chooseHomeResources(['domicilio'],catalog,{name,territory,kind:'ausili'}).filter(r=>r.id===item.id).length,1);
  }
 }
 assert.equal(home.hasDocumentedRomeCoverage(catalog),true);
 assert.equal(mobility.choose(data,{name:'Ortopedia24ore',territory:'nazionale'},catalog.technicalResources).length,0);
 const grouped=home.groupServiceResources(home.chooseHomeResources(['domicilio','mobilita'],catalog,{name:'Ortopedia24ore'}),['domicilio','mobilita'],catalog);
 assert.equal(grouped.flatMap(g=>g.resources).filter(r=>r.id===item.id).length,1);
 assert.match(item.notes.join(' '),/Peretti Medical Group srl, distinta/);
});
test('Ortopedia24ore: contatti, H24 non confuso con apertura o consegna garantita',()=>{
 assert.deepEqual(item.phones.map(p=>p.number),['3335015465','3333966527']);
 assert.equal(item.emails[0].address,'info@ortopedia24ore.it');
 assert.match(item.hours,/9:00–20:00/);assert.match(item.hours,/non significa apertura fisica H24 o consegna notturna garantita/);
 assert.match(item.costs,/pagamento.*consegna e ritiro gratuiti nel Comune di Roma/);
 assert.match(item.notes.join(' '),/Nessuna convenzione o partnership/);
 assert.doesNotMatch(JSON.stringify(item),/Via degli Olmi|166901/);
 for(const s of item.sources){assert.equal(new URL(s.url).protocol,'https:');assert.equal(s.checkedAt,'2026-10-27');}
 assert.equal(new URL(item.links.find(l=>l.url.includes('wa.me')).url).pathname,'/393335015465');
 assert.match(fs.readFileSync('anteprima-sportello/index.html','utf8'),/app\/ortopedia24ore.js/);
});
