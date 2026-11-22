const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../anteprima-sportello/app/presentazione');
test('Filtri nativi: conserva i gruppi aperti mentre ricostruisce i risultati',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/esplora.js'),'utf8');
 assert.match(source,/querySelectorAll\('\.sp-result-group\[open\]'\)/);
 assert.match(source,/section\.open=openGroups\.has\(group\.id\)/);
});
test('Presentazione: non aggiunge filtri, conteggi o nascondimenti ai percorsi',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/presentazione.js'),'utf8');
 assert.doesNotMatch(source,/q-view-controls|q-subcategories|q-count|group\.hidden|card\.hidden|drawMap/);
});
test('Presentazione: non deduce quartiere dalla sede e distingue ADI',()=>{
 assert.equal(model.zoneFor({address:'Via Centocelle 4'}),'Zona puntuale da confermare');
 assert.equal(model.zoneFor({coverage:'Centocelle da confermare'}),'Zona puntuale da confermare');
 assert.equal(model.zoneFor({coverage:'Centocelle e Pigneto'}),'Centocelle, Pigneto');
 assert.match(model.zoneFor({regime:'adi'}),/Percorsi ASL/);
});
