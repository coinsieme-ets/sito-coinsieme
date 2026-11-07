const {test}=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../anteprima-sportello/app/servizi'),orientation=require('../anteprima-sportello/app/orientamento');
test('ReCUP: unica scheda pubblica, numero e orari documentati',()=>{
 const matches=catalog.resources.filter(r=>r.id==='recup-lazio');assert.equal(matches.length,1);const r=matches[0];
 assert.equal(r.phones[0].number,'069939');assert.equal(r.verifiedAt,'2026-11-07');assert.equal(r.providerType,'Pubblico');assert.ok(catalog.isVerifiedResource(r));assert.match(r.hours,/7:30–19:30/);assert.match(r.hours,/sabato 7:30–13:00/);assert.match(r.requirements,/richiesta medica e codice fiscale/);assert.equal(r.sources.length,2);assert.match(r.notes.join(' '),/distinto da CupMedico/);
});
test('ReCUP: selezione Salute, gruppo e ricerca senza nuova categoria principale',()=>{
 assert.equal(catalog.areas.length,9);const selected=orientation.chooseServiceResources(['salute'],catalog);assert.equal(selected.filter(r=>r.id==='recup-lazio').length,1);
 const groups=orientation.groupServiceResources(selected,['salute'],catalog);assert.equal(groups.find(g=>g.id==='salute:prenotazioni').resources.filter(r=>r.id==='recup-lazio').length,1);
 assert.equal(orientation.chooseServiceResources(['socialita'],catalog).some(r=>r.id==='recup-lazio'),false);
});
