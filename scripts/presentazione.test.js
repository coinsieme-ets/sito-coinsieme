const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../anteprima-sportello/app/presentazione');
test('Mappa facoltativa soltanto per poche sedi localizzabili',()=>{
 assert.equal(model.mapAvailable(0),false);
 assert.equal(model.mapAvailable(1),true);
 assert.equal(model.mapAvailable(8),true);
 assert.equal(model.mapAvailable(9),false);
});
test('Presentazione: coordinate ammesse solo con indirizzo corrispondente',()=>{
 assert.equal(model.addressMatches('Via Roma 4, Roma','via roma 4 roma'),true);
 assert.equal(model.addressMatches('Via Roma 4, Roma','Via Roma 8, Roma'),false);
 assert.equal(model.addressMatches(null,'Via Roma'),false);
});
test('Presentazione: non deduce quartiere dalla sede e distingue ADI',()=>{
 assert.equal(model.zoneFor({address:'Via Centocelle 4'}),'Zona puntuale da confermare');
 assert.equal(model.zoneFor({coverage:'Centocelle da confermare'}),'Zona puntuale da confermare');
 assert.equal(model.zoneFor({coverage:'Centocelle e Pigneto'}),'Centocelle, Pigneto');
 assert.match(model.zoneFor({regime:'adi'}),/Percorsi ASL/);
});
