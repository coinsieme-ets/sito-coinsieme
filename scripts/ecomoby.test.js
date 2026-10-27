'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const item=require('../anteprima-sportello/app/ecomoby'),catalog=require('../anteprima-sportello/app/servizi');
const home=require('../anteprima-sportello/app/orientamento'),mobility=require('../anteprima-sportello/app/mobilita');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('anteprima-sportello/app/mobilita-data.js','utf8'),context);
const data=context.window.SportelloMobilitaData;
test('EcoMoby: nove categorie, un record tecnico, gli altri cataloghi invariati',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,42);assert.equal(catalog.homeOperators.length,7);
 assert.equal(catalog.technicalResources.length,1);assert.equal(catalog.technicalResources[0],item);
 assert.equal(item.category,'mobilita');assert.equal(catalog.isVerifiedResource(item),true);
});
test('EcoMoby: tutti i termini ricercabili nei due percorsi',()=>{
 for(const name of ['EcoMobyProject',...item.keywords]){
  assert.equal(mobility.choose(data,{name,kind:'ausili'},catalog.technicalResources).length,1);
  const selected=home.chooseHomeResources(['domicilio'],catalog,{name,kind:'ausili'});
  assert.equal(selected.length,1);assert.equal(selected[0].id,item.id);
 }
});
test('EcoMoby: dichiarazione nazionale distinta dalla disponibilita locale',()=>{
 for(const territory of ['tutti','nazionale']){
  assert.equal(mobility.choose(data,{name:'EcoMoby',territory},[item]).length,1);
  assert.equal(home.chooseHomeResources(['domicilio'],catalog,{name:'EcoMoby',territory}).length,1);
 }
 for(const territory of ['v','est','roma']){
  assert.equal(mobility.choose(data,{name:'EcoMoby',territory},[item]).length,0);
  assert.equal(home.chooseHomeResources(['domicilio'],catalog,{name:'EcoMoby',territory}).length,0);
 }
 assert.equal(item.allRomeDeclared,false);assert.equal(item.seatMunicipio,null);
});
test('EcoMoby: contatti e avvertenze, nessuna ricezione richieste da COINSIEME',()=>{
 assert.equal(item.phones[0].number,'3394040759');assert.equal(item.emails[0].address,'info@ecomobyproject.com');
 assert.match(item.costs,/pagamento/);assert.match(item.notes.join(' '),/non riceve richieste.*né gestisce pagamenti/);
 assert.match(item.notes.join(' '),/Nessuna partnership/);
 for(const link of [...item.sources,...item.links])assert.equal(new URL(link.url).hostname,'www.ecomobyproject.com');
 assert.match(fs.readFileSync('anteprima-sportello/app/esplora.js','utf8'),/!resources.some\(r=>r.id===item.id\)/);
});
