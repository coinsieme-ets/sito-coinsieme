'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const shared=require('../anteprima-sportello/app/cure-domiciliari-data');
const physio=require('../anteprima-sportello/app/fisioterapia-data').providers;
const nurses=require('../anteprima-sportello/app/infermieri-data');

test('Cure domiciliari: ogni ente ADI e centro privato resta distinto e riutilizzato',()=>{
  assert.equal(shared.adi.length,9);assert.equal(shared.privateCenters.length,3);
  const entities=shared.privateCenters.map(r=>r.entity.match(/IVA (\d+)/)[1]);assert.equal(new Set(entities).size,3);
  assert.equal(shared.adi.some(r=>r.id==='adi-salus'),false);
  assert.equal(physio.filter(r=>r.id==='vivisol').length,1);
  assert.equal(physio.filter(r=>r.id==='vivisol-fisioterapia').length,0);
  assert.equal(physio.length,25);assert.equal(nurses.length,25);
  for(const r of shared.privateCenters){
    assert.equal(physio.filter(x=>x.id===r.id+'-fisioterapia').length,1);
    assert.equal(nurses.filter(x=>x.id==='infermieri-'+r.id).length,1);
  }
});

test('Cure domiciliari: ADI non diventa prenotazione privata o disponibilità garantita',()=>{
  for(const r of nurses.filter(r=>r.regime==='adi')){
    assert.equal(r.privatePaid,false);assert.equal(r.allRomeDeclared,false);
    assert.match(r.costs,/autorizzato dalla ASL/);assert.match(r.requirements,/PAI/);
    assert.equal(r.sources.at(-1).documentDate,'2025-05-15');
    assert.notEqual(r.sources.at(-1).documentDate,r.sources.at(-1).checkedAt);
    assert.deepEqual(r.coverageMunicipi,['V','VI','VII']);
  }
  for(const r of physio.filter(r=>r.id.endsWith('-fisioterapia')&&r.regime==='adi')){
    assert.deepEqual(r.asls,['roma2']);assert.match(r.caution,/contratto corrente|Contratto corrente/);
  }
  assert.ok(shared.adi.find(r=>r.id==='life-cure').sourceNote.includes('403'));
});
