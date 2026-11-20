'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const records=require('../anteprima-sportello/app/infermieri-data');
const select=options=>engine.chooseHomeResources(['domicilio'],catalog,{kind:'infermieristica',...options});

test('Infermieri: venticinque servizi distinti, fonti pubbliche e campi non inventati',()=>{
  assert.equal(records.length,25);assert.equal(new Set(records.map(r=>r.id)).size,25);
  assert.equal(new Set(records.map(r=>r.source)).size,25);assert.equal(catalog.areas.length,9);
  for(const r of records){
    assert.ok(catalog.isVerifiedResource(r),r.id);assert.equal(r.verifiedAt,'2026-11-20');
    assert.equal(r.homeKind,'infermieristica');assert.ok(r.services.length);
    assert.equal(r.privatePaid,r.regime!=='adi');assert.match(r.availability,/non conferma diretta/);
    assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-20'&&s.url.startsWith('https://')));
    assert.equal(r.seatMunicipio,null);assert.equal(r.hours,undefined);
    assert.ok(r.notes.some(n=>n.includes('non verificate individualmente')));
  }
  assert.equal(records.filter(r=>/domus|ital-salus/.test(r.id)).length,1);
  assert.equal(records.some(r=>/fnopi/i.test(r.name)),false);
});

test('Infermieri: entrambi i percorsi, conteggio reale e nessuna duplicazione',()=>{
  assert.equal(select().length,25);
  const groups=engine.groupServiceResources(select(),['domicilio'],catalog);
  assert.equal(groups.length,1);assert.equal(groups[0].id,'domicilio:infermieristica');
  for(const ids of [['salute'],['domicilio'],['salute','domicilio'],['domicilio','salute']]){
    const chosen=engine.chooseHomeResources(ids,catalog);
    assert.equal(chosen.filter(r=>r.homeKind==='infermieristica').length,25);
    assert.equal(new Set(chosen.map(r=>r.id)).size,chosen.length);
    const grouped=engine.groupServiceResources(chosen,ids,catalog);
    assert.equal(grouped.flatMap(g=>g.resources).length,chosen.length);
  }
});

test('Infermieri: filtri territoriali non trasformano una sede in copertura',()=>{
  const east=select({territory:'est'});
  assert.equal(east.length,20);
  assert.ok(east.every(r=>r.coverageBasis==='roma-est'||r.coverageBasis==='asl-roma2'||r.allRomeDeclared));
  assert.equal(east.some(r=>r.id==='infermieri-roma-medical'),false);
  assert.equal(east.some(r=>r.id==='infermieri-medelit'),false);
  assert.equal(select({territory:'roma'}).length,4);
  assert.equal(select({territory:'nazionale'}).length,0);
});

test('Infermieri: ricerca di nome e prestazione, senza attribuzioni generalizzate',()=>{
  for(const name of ['PIC','Castelforte','For Life','Sanigest'])assert.equal(select({name}).length,1,name);
  for(const name of ['prelievo','catetere','clistere','endovena','medicazione'])assert.ok(select({name}).length,name);
  const clister=select({name:'clistere'}).map(r=>r.id);
  assert.deepEqual(clister.sort(),['infermieri-farmacia-castelforte','infermieri-for-life','infermieri-pic-siam5','infermieri-privatassistenza-tuscolana','infermieri-victoria-life','infermieri-privatassistenza-montesacro','infermieri-sanit-form'].sort());
  assert.equal(select({name:'inesistente-zzzz'}).length,0);
  assert.equal(records.find(r=>r.id==='infermieri-aeva-xenior').services.length,1);
});

test('Infermieri: indice generale, link diretti e dipendenza browser',()=>{
  const entries=require('./search-catalog').build();
  for(const r of records){
    const matched=entries.filter(e=>e.url.endsWith('/risorsa/'+r.id));
    assert.equal(matched.length,1,r.id);
    assert.match(matched[0].url,/^\/anteprima-sportello\/#cerca=domicilio/);
  }
  const html=fs.readFileSync(path.join(__dirname,'../anteprima-sportello/index.html'),'utf8');
  assert.ok(html.indexOf('/app/infermieri-data.js')<html.indexOf('/app/servizi.js'));
  assert.match(html,/noindex,nofollow/);assert.match(html,/connect-src 'none'/);
  const ui=fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/esplora.js'),'utf8');
  assert.match(ui,/L’Albo non è un erogatore domiciliare e non è incluso nel conteggio/);
  assert.equal(records.find(r=>r.id==='infermieri-roma-medical').phones[0].number,'062009270');
  assert.ok(records.every(r=>r.phones.every(p=>p.number!=='112')));
});
