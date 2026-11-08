const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const territory=require('../anteprima-sportello/app/territorio'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const id='territorio-tor-vergata';
test('Tor Vergata: un solo ospedale pubblico di Roma sud-est, fonti e recapiti distinti',()=>{
 const matches=catalog.resources.filter(r=>r.id===id);assert.equal(matches.length,1);const r=matches[0];
 assert.equal(r.category,'salute');assert.equal(r.subcategory,'ospedali');assert.equal(r.providerType,'Pubblico');assert.equal(r.zone,'Roma sud-est · Tor Vergata');assert.equal(r.address,'Viale Oxford 81, 00133 Roma');
 assert.equal(r.verifiedAt,'2026-11-07');assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-07'&&s.url.startsWith('https://')));
 assert.deepEqual(r.phones.map(p=>p.number),['0620901','0620902020','069939','0620903333']);
 assert.match(r.access,/priorità “Altro”/);assert.match(r.access,/privat/);assert.match(r.notes.join(' '),/non verificati/);
 assert.ok(r.links.some(l=>l.url.includes('maps/search/')&&l.url.includes('Oxford%2081')));
});
test('Tor Vergata: tutte le precedenti schede territoriali restano identiche',()=>{
 const previous=territory.filter(r=>r.id!==id&&r.id!=='territorio-fabia-mater');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(previous)).digest('hex'),'bf627f28f337e77bae63723486be6c85455fe6a06468da4308952873609378c2');
});
test('Tor Vergata: raggiungibile nel percorso ospedali senza duplicazioni',()=>{
 const resources=engine.chooseServiceResources(['salute'],catalog),groups=engine.organizeServiceGroups(engine.groupServiceResources(resources,['salute'],catalog));
 const group=groups.find(g=>g.id==='salute:ospedali');assert.equal(group.healthSection.id,'territorio');assert.equal(group.resources.filter(r=>r.id===id).length,1);
 for(const previous of ['territorio-guarnieri','territorio-casilino','territorio-vannini'])assert.ok(group.resources.some(r=>r.id===previous));
});
