'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const taxonomy=require('../anteprima-sportello/app/accessibilita'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const raw=engine.chooseHomeResources(['digitale'],catalog);
test('Accessibilita: quattro filtri reali, cinque schede e nessuna competenza inventata',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.areas.find(a=>a.id==='digitale').title,'Accessibilità e barriere');
 assert.deepEqual(taxonomy.groups.map(g=>g.id),['barriere-architettoniche','comunicazione-accessibile','accessibilita-digitale','facilitazione-digitale']);
 assert.deepEqual(taxonomy.counts(raw),{'barriere-architettoniche':1,'comunicazione-accessibile':1,'accessibilita-digitale':0,'facilitazione-digitale':4});
 for(const [kind,expected]of [['tutte',5],['barriere-architettoniche',1],['comunicazione-accessibile',1],['accessibilita-digitale',0],['facilitazione-digitale',4]]){
  const selected=taxonomy.select(raw,['digitale'],kind).filter(r=>r.id!=='info-digitale');assert.equal(selected.length,expected);assert.equal(new Set(selected.map(r=>r.id)).size,expected);
  if(kind!=='tutte')assert.ok(selected.every(r=>r.groupByCategory.digitale===kind));
 }
});
test('Accessibilita: filtri non alterano sorgenti o risorse di altre categorie',()=>{
 const baseline=JSON.stringify(raw);taxonomy.select(raw,['digitale'],'comunicazione-accessibile');assert.equal(JSON.stringify(raw),baseline);
 const both=engine.chooseHomeResources(['digitale','mobilita'],catalog);
 const selected=taxonomy.select(both,['digitale','mobilita'],'facilitazione-digitale');
 const shared=selected.filter(r=>r.id==='connessioni-sociali-accessibilita');assert.equal(shared.length,1);assert.deepEqual(shared[0].categories,['mobilita']);
 const other=engine.chooseHomeResources(['diritti'],catalog);assert.equal(taxonomy.select(other,['diritti'],'facilitazione-digitale'),other);
 for(const id of ['coinsieme-barriere-digitali','facilitazione-roma-iv','facilitazione-roma-v','facilitazione-roma-vi'])assert.ok(raw.some(r=>r.id===id));
});
test('Accessibilita: ricerca conserva i vecchi ID e aggiunge i quattro ambiti',()=>{
 const rows=require('./search-catalog').catalog();
 for(const group of taxonomy.groups)assert.ok(rows.some(r=>r.url==='/anteprima-sportello/#cerca=digitale/ambito/'+group.id));
 assert.ok(rows.some(r=>r.url==='/anteprima-sportello/#cerca=digitale/risorsa/coinsieme-barriere-digitali'));
 assert.ok(rows.some(r=>r.url==='/anteprima-sportello/#cerca=digitale/risorsa/info-digitale'));
});
