'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const data=require('../anteprima-sportello/app/televisite-data');
test('Riscontri: il messaggio AI non e una conferma definitiva di un responsabile',()=>{
 assert.match(data.records.find(r=>r.id==='miodottore').verificationNote,/Non rappresenta una conferma definitiva da parte di un responsabile/);
});
test('Riscontri: solo MioDottore cambia nel catalogo televisite',()=>{
 // Snapshot strutturato degli operatori non coinvolti, base pubblicata 48d8358.
 assert.equal(hash(data.records.filter(r=>r.id!=='miodottore')),'e824f7de050cb3c7c24cf2bc764042745d0503db609b9d9aeadbbd925b2dbfc7');
 const m=data.records.find(r=>r.id==='miodottore');assert.match(m.verificationNote,/intelligenza artificiale/);assert.match(m.costs,/pagamento abilitato/);assert.match(m.connection,/canali diversi/);assert.match(m.connection,/non garantiscono/);assert.equal(m.contactEmail,'contatto@miodottore.it');assert.equal(data.checkedAt,'2026-10-27');
});
test('Riscontri: Santagostino distingue autorisposta da conferma e conserva le tariffe storiche',()=>{
 const js=fs.readFileSync('anteprima-sportello/app/psicologia.js','utf8');
 assert.match(js,/Non è una conferma dei servizi/);assert.match(js,/Tariffe pubblicate e verificate al 28 ottobre 2026/);assert.doesNotMatch(js,/mailto:informazioni@cmsantagostino/);
 assert.match(js,/url:'https:\/\/www.santagostino.it\/it\/contatti',checkedAt:'2026-11-13'/);
});
test('Riscontri: tutti gli altri operatori psicologia e le condizioni Santagostino restano invariati',()=>{
 const current=require('../anteprima-sportello/app/psicologia');
 const unchanged=current.records.map(r=>{const value={...r};if(value.id==='santagostino-psiche'){delete value.sources;delete value.notes;}return value;});
 assert.equal(hash(unchanged),'3b1ecd0aede08b44c897c8864f0ddc0b9ea2521e39856c4d3f35077894edad43');
 const sources=current.records.find(r=>r.id==='santagostino-psiche').sources;
 assert.deepEqual(sources.slice(0,2).map(s=>[s.url,s.checkedAt]),[['https://www.santagostino.it/it/psiche','2026-10-28'],['https://www.santagostino.it/it/prestazioni/colloquio-psicologico-online','2026-10-28']]);
});
