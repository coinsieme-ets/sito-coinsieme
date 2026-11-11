const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('../anteprima-sportello/app/orientamento'),catalog=require('../anteprima-sportello/app/servizi');
test('Salute: sei raggruppamenti visivi senza nuove categorie o record',()=>{
 assert.equal(engine.healthSections.length,6);assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,58);
 const items=engine.chooseServiceResources(['salute'],catalog),groups=engine.organizeServiceGroups(engine.groupServiceResources(items,['salute'],catalog));
 assert.deepEqual([...new Set(groups.map(g=>g.healthSection.id))],engine.healthSections.map(s=>s.id));
 assert.equal(groups[0].id,'salute:medici-pediatri');assert.equal(groups[1].id,'salute:prenotazioni');
 assert.deepEqual(groups.flatMap(g=>g.resources.map(r=>r.id)).sort(),items.map(r=>r.id).sort());
});
test('Salute: tutte le 511 selezioni conservano ogni risorsa una sola volta',()=>{
 for(let mask=1;mask<512;mask++){
  const ids=catalog.areas.filter((_,i)=>mask&(1<<i)).map(a=>a.id),items=engine.chooseHomeResources(ids,catalog),before=engine.groupServiceResources(items,ids,catalog),after=engine.organizeServiceGroups(before);
  assert.deepEqual(after.flatMap(g=>g.resources.map(r=>r.id)).sort(),items.map(r=>r.id).sort());
  assert.equal(new Set(after.flatMap(g=>g.resources.map(r=>r.id))).size,items.length);
  assert.deepEqual(after.filter(g=>!g.id.startsWith('salute:')),before.filter(g=>!g.id.startsWith('salute:')));
 }
});
test('Salute: orientamento prima delle schede e ordine alfabetico entro la stessa tipologia',()=>{
 const resources=[{id:'b',name:'Beta',providerType:'Privato'},{id:'z',name:'Zeta',providerType:'Pubblico'},{id:'a',name:'Alfa',providerType:'Privato'},{id:'info-test',name:'Orientamento'}];
 assert.deepEqual(engine.organizeServiceGroups([{id:'salute:case-ambulatori',resources}])[0].resources.map(r=>r.id),['info-test','z','a','b']);
});
