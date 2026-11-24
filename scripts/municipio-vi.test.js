const {test}=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../anteprima-sportello/app/servizi');
const engine=require('../anteprima-sportello/app/orientamento');
const ids=['vi-pua-torrenova','vi-disabili-adulti','vi-adi-distretto-6'];
test('Municipio VI: schede uniche, fonti pubbliche e competenza distinta',()=>{
  for(const id of ids){
    const rows=catalog.resources.filter(r=>r.id===id);
    assert.equal(rows.length,1);
    const r=rows[0];assert.equal(r.seatMunicipio,'VI');
    assert.match(r.zone,/VI/);assert.equal(r.verifiedAt,'2026-11-24');
    assert.ok(r.sources.every(s=>s.url.startsWith('https://www.aslroma2.it/')));
    assert.ok(r.notes.some(n=>n.includes('attesa di conferma')));
    assert.equal(engine.homeTerritoryMatches(r,'v'),false);
    assert.equal(engine.homeTerritoryMatches(r,'vi'),true);
  }
});
test('Municipio VI: percorsi pubblici domiciliari e categorie senza duplicati',()=>{
  for(const category of ['salute','diritti','domicilio']){
    const rows=engine.chooseHomeResources([category],catalog,{kind:'tutti',territory:'tutti'});
    assert.equal(rows.length,new Set(rows.map(r=>r.id)).size);
    if(category==='domicilio')for(const id of ['vi-pua-torrenova','vi-adi-distretto-6'])assert.ok(rows.some(r=>r.id===id));
  }
  const rows=engine.chooseHomeResources(['domicilio'],catalog,{kind:'pubblico',territory:'vi'});
  assert.ok(rows.some(r=>r.id==='vi-adi-distretto-6'));
  assert.ok(!rows.some(r=>r.id==='territorio-adi-d5'));
});
