'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=require('../anteprima-sportello/app/medici-data'),catalog=require('../anteprima-sportello/app/servizi');
const vm=require('node:vm');
const doctor={id:'fixture-mmg',name:'Professionista simulato per test',type:'MMG',address:'Indirizzo simulato',quarter:'Quartiere di test',municipio:'V',asl:'ASL Roma 2',source:data.asl,checkedAt:data.checkedAt};
test('Medici: nessun nominativo o disponibilita inventati, nove categorie e cataloghi conservati',()=>{
  assert.deepEqual(data.doctors,[]);assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,41);
  assert.equal(catalog.homeOperators.length,7);assert.equal(data.choose(data.doctors).length,0);
});
test('Medici: quattro riferimenti a presidi esistenti, senza nuove schede territoriali',()=>{
  assert.equal(data.offices.length,4);assert.equal(new Set(data.offices.map(r=>r.resourceId)).size,4);
  for(const office of data.offices){assert.equal(catalog.resources.filter(r=>r.id===office.resourceId).length,1);assert.ok(office.address);assert.ok(office.endOfShift);}
  assert.equal(data.offices.find(r=>r.resourceId==='territorio-san-felice').address,'Via degli Eucalipti 14');
});
test('Medici: presenza in elenco non equivale a disponibilita',()=>{
  assert.equal(data.availability(doctor),'da_verificare');
  for(const status of ['disponibile','massimale_raggiunto']){
    assert.equal(data.availability({...doctor,availability:{status}}),'da_verificare');
    assert.equal(data.availability({...doctor,availability:{status,source:'https://example.org',checkedAt:data.checkedAt}}),'da_verificare');
    assert.equal(data.availability({...doctor,availability:{status,source:data.asl,checkedAt:'2026-02-30'}}),'da_verificare');
    assert.equal(data.availability({...doctor,availability:{status,source:data.asl,checkedAt:data.checkedAt}}),status);
  }
});
test('Medici: filtri combinati MMG/PLS, municipio, quartiere, nome e disponibilita',()=>{
  const records=[doctor,{...doctor,id:'fixture-pls',type:'PLS',municipio:'IV',availability:{status:'disponibile',source:data.asl,checkedAt:data.checkedAt}}];
  assert.equal(data.choose(records,{type:'MMG',municipio:'V',quarter:doctor.quarter,name:'SIMULATO',availability:'da_verificare'}).length,1);
  assert.equal(data.choose(records,{type:'PLS',availability:'disponibile'}).length,1);
  assert.equal(data.choose(records,{municipio:'VI'}).length,0);
  assert.equal(data.choose(records,{name:'assente'}).length,0);
  assert.equal(data.choose(records,{availability:'massimale_raggiunto'}).length,0);
});
test('Medici: solo fonti ufficiali e dati minimi documentati, deduplicazione per ID',()=>{
  assert.equal(data.choose([doctor,doctor,{...doctor,id:'bad',source:'https://example.org'},{...doctor,id:'bad2',address:''}]).length,1);
  assert.equal(data.documented({...doctor,source:'https://aslroma2.it.evil.test'}),false);
});
test('Medici: integrazione locale progressiva, orari distinti e nessuna richiesta o persistenza',()=>{
  const html=fs.readFileSync('anteprima-sportello/index.html','utf8'),ui=fs.readFileSync('anteprima-sportello/app/medici.js','utf8');
  assert.ok(html.indexOf('/app/medici-data.js')<html.indexOf('/app/medici.js'));
  assert.ok(html.indexOf('/app/medici.js')<html.indexOf('/app/esplora.js'));
  assert.match(ui,/11:00/);assert.match(ui,/contatti infermieristici/);assert.match(ui,/Non inserire dati sanitari/);
  assert.doesNotMatch(ui,/fetch\(|localStorage|sessionStorage|XMLHttpRequest|<form/);
});

function orientation(records){
  const nodes=[];
  function createElement(tag){const el={tag,children:[],value:'tutti',append(...items){this.children.push(...items);},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[];}};nodes.push(el);return el;}
  const context={window:{SportelloMediciData:{...data,doctors:records}},document:{createElement}};
  vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/medici.js','utf8'),context);
  const container=createElement('details');context.window.SportelloMedici.decorate({id:'info-salute-medici-pediatri'},container,catalog);
  return nodes;
}
test('Medici: senza nominativi i filtri non sono visibili, orientamento e quattro rimandi restano disponibili',()=>{
  const nodes=orientation([]);
  assert.equal(nodes.find(n=>n.tag==='section').hidden,true);
  assert.ok(nodes.some(n=>n.textContent==='Non riesci a trovare un medico disponibile?'));
  for(const text of ['Orientamento alla scelta del medico: già disponibile.','Elenco nominativo dei medici: in preparazione.','Disponibilità di nuovi assistiti: non ancora verificabile attraverso i dati acquisiti.'])assert.ok(nodes.some(n=>n.textContent===text));
  assert.equal(nodes.filter(n=>n.tag==='a'&&n.href.startsWith('#risorsa-')).length,4);
});
test('Medici: attivazione progressiva solo con nominativi e riscontri documentati',()=>{
  const unknown=orientation([doctor]);
  assert.equal(unknown.find(n=>n.tag==='section').hidden,false);
  assert.equal(unknown.find(n=>n.id==='medici-availability').disabled,true);
  const verified=orientation([{...doctor,availability:{status:'disponibile',source:data.asl,checkedAt:data.checkedAt}}]);
  assert.equal(verified.find(n=>n.id==='medici-availability').disabled,false);
  assert.equal(verified.find(n=>n.id==='medici-quarter').disabled,false);
  assert.equal(orientation([{...doctor,quarter:null}]).find(n=>n.id==='medici-quarter').disabled,true);
});
