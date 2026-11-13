'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const model=require('../anteprima-sportello/app/socialita');
const ids=['social-scuola-popolare-scacchi','social-universita-popolare-torpignattara'];
const [chess,uptp]=ids.map(id=>model.additions.find(r=>r.id===id));
test('Scacchi e UPTP: schede uniche, fonti e dati non presunti',()=>{
 for(const r of [chess,uptp]){
  assert.ok(r);assert.equal(model.additions.filter(x=>x.id===r.id).length,1);
  assert.equal(model.forCategories([r],['socialita']).length,1);
  assert.equal(r.phone,null);assert.equal(r.hours,undefined);assert.equal(r.costs,undefined);
  assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-13'&&s.url.startsWith('https://')));
  assert.match(r.details.join(' '),/non.*conferma|Non sono dati confermati/i);
  assert.ok(!/\bConsulta\b/i.test(JSON.stringify(r)));
 }
 assert.equal(chess.email,'info@scuolapopolarediscacchi.it');assert.match(chess.operationalAddress,/Irpinia 34/);
 assert.equal(uptp.email,'info@uptp.it');assert.equal(uptp.operationalAddress,null);
 assert.match(chess.details.join(' '),/2025-2026/);assert.match(chess.details.join(' '),/quote/);
 assert.match(uptp.details.join(' '),/calendario aggiornato/);
});
test('Scacchi e UPTP: giochi e cultura coerenti, ricerca nelle attività',()=>{
 assert.ok(model.filter(model.additions,{journey:'giochi',mode:'presenza',name:'scacchi'}).includes(chess));
 assert.ok(model.filter(model.additions,{journey:'cultura',name:'formazione permanente'}).includes(uptp));
 assert.ok(model.filter(model.additions,{journey:'cultura',neighborhood:'Tor Pignattara'}).includes(uptp));
 assert.equal(model.filter(model.additions,{journey:'giochi'}).length,5);
 assert.equal(require('../anteprima-sportello/app/servizi').areas.length,9);
});
test('Scacchi e UPTP: indicizzazione senza duplicazioni',()=>{
 const entries=require('./search-catalog').catalog();
 for(const id of ids)assert.equal(entries.filter(e=>e.url.endsWith('/sociale/'+id)).length,1);
});
test('Scacchi e UPTP: le 34 aggiunte non interessate dalla verifica FlaBArt conservate integralmente',()=>{
 const legacy=model.additions.filter(r=>!ids.includes(r.id)&&r.id!=='social-ballo-flabart');assert.equal(legacy.length,34);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),'b18d81f4a3bdb2f411be3cfabeb9efdc72263d09d5d81a7d9d0039dd92938b9f');
});
