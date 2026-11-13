'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function data(name){const c={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../anteprima-sportello/app/'+name),'utf8'),c);return Object.values(c.window)[0];}
const social=data('socialita-data'),mobility=data('mobilita-data'),model=require('../anteprima-sportello/app/socialita');
test('Conferme: Connessioni aggiorna solo recapiti e tracciabilita, non i servizi',()=>{
 const r=require('../anteprima-sportello/app/accessibilita-spazi')[0];
 assert.equal(r.address,'Piazza Carlo Magno 21, 00162 Roma');assert.equal(r.phones[0].number,'0692915394');
 assert.equal(r.verifiedAt,'2026-11-13');assert.match(r.notes.join(' '),/Tutto confermato/);
 assert.equal(r.services.length,3);assert.ok(r.privatePaid);assert.match(r.costs,/concordate direttamente/);
 assert.equal(r.links.filter(l=>l.url==='https://www.connessionisociali.it/').length,1);
});
test('Conferme: Speranza Viva mantiene circa 10.000 euro solo per il canale convenzionato',()=>{
 const r=social.records.find(r=>r.id==='albo-119');assert.equal(social.records.filter(r=>r.id==='albo-119').length,1);
 assert.equal(r.operationalAddress,'Via Melissano 48, Roma');assert.equal(r.verifiedAt,'2026-11-13');
 assert.match(r.details[0],/Canale convenzionato/);assert.match(r.details[1],/Raccolte autonome/);
 assert.match(r.details[1],/senza applicare il limite ISEE/);assert.match(r.details[0],/riconfermati direttamente/);
 assert.match(r.details[0],/circa 10\.000 euro/);assert.doesNotMatch(r.details[1],/10\.000/);
 assert.match(r.editorialSource,/Risposte dirette/);assert.match(r.details.join(' '),/Gratteri 43/);
});
test('Conferme: ASL sostituisce il recapito senza presentarlo come prenotazione',()=>{
 const r=mobility.records.find(r=>r.id==='mobilita-asl-dialisi');
 assert.equal(r.emails[0].address,'amministrativa.dipartimenti@aslroma2.it');
 assert.match(r.emails[0].label,/generale, non prenotazioni/);
 assert.doesNotMatch(JSON.stringify(r),/amministrativa\.territoriale@/);
 assert.match(r.notes.join(' '),/non una centrale operativa/);assert.match(r.notes.join(' '),/13 novembre 2026/);
 const rendered=require('../anteprima-sportello/app/mobilita').normalize(r,mobility,'asl');
 assert.equal(rendered.sources[2].checkedAt,'2026-11-13');assert.equal(rendered.sources[0].checkedAt,mobility.checkedAt);
 assert.equal(hash(mobility.records.filter(r=>r.id!=='mobilita-asl-dialisi')),'85f8068ba08b75a970d7804d1c0a8d2032050ab07cfd3d2cfbc78aca189b3dd1');
});
test('Conferme: FlaBArt non propone la casella respinta e conserva il telefono pubblico',()=>{
 const r=model.additions.find(r=>r.id==='social-ballo-flabart');assert.equal(r.email,null);
 assert.equal(r.phone,'3481158797');assert.match(r.details[0],/utente sconosciuto/);
 assert.ok(r.links.some(l=>l.url==='https://www.facebook.com/flabartartechedanzaacsdroma/'));
 assert.equal(hash(model.additions.filter(r=>r.id!=='social-ballo-flabart')),'0833acf61fa2984db4ec06e94c0e99fabae8364fc58e3afea744dd9edb0519db');
});
test('Conferme: ricerca e identificativi unici, senza nuova scheda Cuore Digitale',()=>{
 const entries=require('./search-catalog').catalog();
 for(const id of ['connessioni-sociali-accessibilita','albo-119','mobilita-asl-dialisi','social-ballo-flabart'])assert.equal(entries.filter(e=>e.url.endsWith('/'+id)).length,1);
 assert.ok(!entries.some(e=>/Cuore Digitale/i.test(e.title)));assert.equal(require('../anteprima-sportello/app/servizi').areas.length,9);
});
