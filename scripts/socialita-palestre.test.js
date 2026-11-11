const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../anteprima-sportello/app/socialita');
test('Palestre: sei schede uniche, fonti datate e nessuna copertura sanitaria presunta',()=>{
 const rows=model.filter(model.additions,{journey:'sport',mode:'palestre'});
 assert.equal(rows.length,6);assert.equal(new Set(rows.map(r=>r.id)).size,6);
 for(const r of rows){
  assert.ok(r.operationalAddress);assert.ok(r.neighborhood);assert.match(r.phone,/^\d+$/);
  assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-11'&&s.url.startsWith('https://')));
  assert.match(r.details.join(' '),/Accessibilità.*non verificati/);assert.match(r.details.join(' '),/non sono presentate come riabilitazione/);
  assert.ok(!model.forCategories([r],['vicinato']).length);
 }
 assert.equal(model.filter(rows,{journey:'cultura',mode:'ballo'}).length,0);
 assert.equal(model.filter(rows,{journey:'cultura',mode:'altre'}).length,0);
 assert.equal(model.filter(rows,{name:'acquagym'}).length,1);
 assert.equal(model.filter(rows,{neighborhood:'Centocelle'}).length,4);
 assert.match(rows.find(r=>r.id==='social-palestra-fusolab').details.join(' '),/2025–2026/);
 assert.match(rows.find(r=>r.id==='social-palestra-yoga-pause').description,/non una palestra tradizionale/);
});
test('Sport libero: due parchi condivisi, testimonianza distinta e nessuna duplicazione',()=>{
 const parks=model.filter(model.additions,{journey:'sport',mode:'libero'});
 assert.deepEqual(parks.map(r=>r.id).sort(),['social-parco-centocelle','social-villa-de-sanctis']);
 for(const r of parks){assert.ok(model.filter(model.additions,{journey:'parchi'}).includes(r));assert.match(r.details.join(' '),/testimonianza diretta del Presidente/);assert.match(r.details.join(' '),/11 novembre 2026/);assert.ok(r.sources.some(s=>s.checkedAt==='2026-11-11'));}
 assert.ok(parks[0].fields.includes('Ping pong'));assert.ok(parks[1].fields.includes('Ping pong'));
 assert.equal(model.filter(model.additions,{journey:'sport',mode:'libero',name:'pickleball'}).length,1);
 assert.ok(model.filter(model.additions,{journey:'cultura'}).every(r=>!['parchi','palestre','ballo'].includes(r.mode)));
 assert.equal(model.filter(model.additions,{journey:'ballo'}).length,2);
});
