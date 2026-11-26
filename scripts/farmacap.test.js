'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const network=require('../anteprima-sportello/app/farmacap-data'),data=require('../anteprima-sportello/app/farmacie-data');
const deliveries={records:[]};
const rows=data.records.filter(r=>r.network==='FARMACAP');
test('FARMACAP: 20 sedi documentate, un solo Torraccio e nessun recapito ricostruito',()=>{
 assert.equal(rows.length,20);assert.equal(network.records.length,20);assert.equal(new Set(rows.map(r=>r.sources.find(s=>s.url.includes('/farmacap-farmacia-comunale-')).url)).size,20);
 assert.equal(data.records.filter(r=>r.name?.includes('Torraccio')).length,1);assert.equal(data.records.find(r=>r.id==='farmacia-torraccio').phone,'0657088710');
 const spring=rows.find(r=>r.slug==='primavera');assert.equal(spring.phone,'0657088650');assert.match(spring.socialNote,/incongruente/);assert.equal(spring.socialPhone,undefined);
 assert.ok(rows.every(r=>r.verification.includes('non conferma diretta')));assert.ok(rows.every(r=>r.checkedAt==='2026-11-25'));
});
test('FARMACAP: tre sedi continuative e cinque periodiche per ECG e Holter',()=>{
 for(const id of ['ecg','holter-cardiaco','holter-pressorio']){
  const list=rows.flatMap(r=>r.services.filter(s=>s.id===id));assert.equal(list.length,8);assert.equal(list.filter(s=>s.availability.includes('Soltanto giornate periodiche')).length,5);
 }
 assert.match(rows.find(r=>r.slug==='primavera').services.find(s=>s.id==='ecg').availability,/non è disponibilità continuativa/);
 assert.ok(!rows.find(r=>r.slug==='tor-bella-monaca').services.some(s=>s.id==='ecg'));
 assert.ok(rows.every(r=>r.services.some(s=>s.id==='autoanalisi')));
 assert.equal(rows.filter(r=>r.services.some(s=>s.id==='tamponi')).length,9);
});
test('FARMACAP: il filtro non trasforma farmacie ordinarie in H24, festive o consegna',()=>{
 const resolved={records:[{id:'consegne-castelforte',address:'Via Castelforte',phones:[{number:'062000000'}],coverage:'Da verificare'}]};
 assert.equal(data.choose(resolved,{mode:'comunali'}).length,20);assert.equal(data.choose(resolved,{mode:'ecg'}).length,8);
 assert.equal(data.choose(resolved,{mode:'holter-pressorio'}).length,8);assert.equal(data.choose(resolved,{mode:'autoanalisi'}).length,20);
 assert.equal(data.choose(resolved,{mode:'tamponi'}).length,9);
 for(const r of rows.filter(r=>r.id!=='farmacia-torraccio'))assert.deepEqual(r.modes,['comunali']);
 assert.equal(rows.filter(r=>r.modes.includes('festive')).length,1);
});
test('FARMACAP: loader prima dei dati e nessun nuovo campo di ricerca inerte',()=>{
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');assert.ok(html.indexOf('/app/farmacap-data.js')<html.indexOf('/app/farmacie-data.js'));
 const js=fs.readFileSync('anteprima-sportello/app/farmacie.js','utf8');assert.match(js,/non è documentata una gratuità o una tariffa calmierata generale/);assert.doesNotMatch(js,/type\s*=\s*['"]search|fetch\(|localStorage/);
});
test('FARMACAP: ricerca globale per denominazione, prestazione e indirizzo senza duplicati',()=>{
 const entries=require('./search-catalog').catalog();
 const pharmacies=entries.filter(e=>e.url.includes('/farmacia/'));assert.equal(pharmacies.length,25);
 const spring=pharmacies.find(e=>e.title==='Farmacia comunale Primavera');assert.ok(spring);assert.match(spring.text,/FARMACAP/);assert.match(spring.text,/Holter pressorio/);assert.match(spring.text,/Soltanto giornate periodiche/);
 assert.equal(new Set(pharmacies.map(e=>e.url)).size,pharmacies.length);
});
