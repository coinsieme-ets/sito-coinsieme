const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const territory=require('../anteprima-sportello/app/territorio'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
test('Fabia Mater: una sola scheda, sedi e regimi distinti',()=>{
 const found=catalog.resources.filter(r=>r.id==='territorio-fabia-mater');assert.equal(found.length,1);const r=found[0];
 assert.equal(r.subcategory,'ospedali');assert.equal(r.address,'Via Olevano Romano 25, 00171 Roma');assert.match(r.description,/piazza Sabaudia 25/);
 assert.deepEqual(r.phones.map(p=>p.number),['06215921','06215924002','06215924714']);
 assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-08'));assert.match(r.costs,/Nessuna gratuità generalizzata/);assert.match(r.notes.join(' '),/accessibilità fisica non verificati/);
});
test('Fabia Mater: tutte le schede territoriali precedenti restano identiche',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(territory.filter(r=>r.id!=='territorio-fabia-mater'))).digest('hex'),'6d08d029d46ec4ac92210b3dde13b6bf51966fd84796316cfdd8648b3e3de607');
});
test('Fabia Mater: nel gruppo ospedali e nella ricerca unica, senza duplicati',()=>{
 const groups=engine.organizeServiceGroups(engine.groupServiceResources(engine.chooseServiceResources(['salute'],catalog),['salute'],catalog));
 assert.equal(groups.find(g=>g.id==='salute:ospedali').resources.filter(r=>r.id==='territorio-fabia-mater').length,1);
 const results=require('../js/site-search').search(require('./search-catalog').catalog(),'Fabia Mater');assert.equal(results.length,1);assert.ok(results[0].url.endsWith('/risorsa/territorio-fabia-mater'));
});
