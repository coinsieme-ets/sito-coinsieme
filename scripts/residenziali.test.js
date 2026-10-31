'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../anteprima-sportello/app/residenziali-data'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
test('Residenziali: un percorso salute, nove categorie e quattordici strutture canoniche',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,51);
 assert.equal(catalog.subcategories.filter(s=>s.id==='residenziali').length,1);
 assert.equal(data.records.length,14);assert.equal(new Set(data.records.map(r=>r.id)).size,14);
 for(const id of ['castello-quiete','villa-lucia','alessandrino','longoni','magnolia','medica-group','divino-amore'])assert.ok(data.records.some(r=>r.id==='res-'+id));
 const resource=catalog.resources.find(r=>r.id==='info-salute-residenziali');assert.equal(engine.servicePresentation(resource,{label:resource.name},catalog).inline,true);
});
test('Residenziali: accesso riferito alla prestazione, non dedotto dalla gestione privata',()=>{
 assert.equal(data.choose({type:'rsa'}).length,8);assert.equal(data.choose({type:'casa-famiglia'}).length,3);
 assert.equal(data.choose({access:'privato'}).length,1);assert.equal(data.choose({type:'rsa',access:'privato'}).length,0);
 assert.equal(data.choose({type:'casa-riposo',access:'privato'})[0].id,'res-magnolia');assert.equal(data.records.filter(r=>r.id==='res-magnolia').length,1);
 assert.equal(data.choose({type:'comunita-alloggio'}).length,0);assert.equal(data.choose({type:'riabilitativa'}).length,0);
});
test('Residenziali: ricerca e territorio non attribuiscono Municipi incerti',()=>{
 assert.equal(data.choose({municipio:'V'}).length,7);assert.equal(data.choose({municipio:'IV'}).length,1);assert.equal(data.choose({municipio:'VI'}).length,4);
 assert.equal(data.choose({name:'LÓNGONI'})[0].id,'res-longoni');assert.equal(data.choose({municipio:'V',name:'Magnolia'}).length,0);
 assert.equal(data.records.filter(r=>r.address==='Via dei Colombi 190, Roma').length,2);
 assert.ok(!data.choose({municipio:'VI'}).some(r=>r.id==='res-tulipano'));
 assert.equal(data.choose({municipio:'da-verificare'}).length,2);
});
test('Residenziali: fonti datate, nessun posto o preventivo presunto e mappe esatte',()=>{
 for(const record of data.records){assert.equal(record.availability,null);assert.ok(record.accreditation);assert.ok(record.costs);assert.ok(record.physical);assert.ok(record.management);
  assert.equal(new URL(data.mapUrl(record.address)).searchParams.get('query'),record.address);
  assert.ok(!record.phone||/^\d+$/.test(record.phone));
  for(const source of record.sources){assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.checkedAt,'2026-10-27');}
 }
 assert.match(data.pending[0].reason,/sede legale/);assert.match(data.pending[1].reason,/2021/);
 assert.doesNotMatch(JSON.stringify({records:data.records,pending:data.pending}),/Casa Arcobaleno|Casa Sole|Casa Luna|La Marea|Il Castelletto/);
});
function render(id='info-salute-residenziali'){
 const nodes=[];const document={createElement(tag){const el={tag,children:[],value:'',append(...children){this.children.push(...children);if(tag==='select'&&!this.value)this.value=children[0].value;},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[];}};nodes.push(el);return el;}};
 const context={document,window:{SportelloResidenzialiData:data}};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/residenziali.js','utf8'),context);
 context.window.SportelloResidenziali.decorate({id},document.createElement('div'));return nodes;
}
test('Residenziali: schede native, filtri e contatti senza nuova introduzione duplicata',()=>{
 const nodes=render();assert.equal(nodes.filter(n=>n.tag==='details').length,16);assert.equal(nodes.filter(n=>n.tag==='select').length,3);
 assert.equal(nodes.filter(n=>n.type==='search').length,1);assert.ok(nodes.some(n=>n.href==='tel:0651005058'));
 assert.equal(nodes.filter(n=>n.id==='res-magnolia').length,1);assert.equal(nodes.filter(n=>n.tag==='input'&&n.type!=='search').length,0);
 assert.equal(render('info-salute-farmacie').length,1);
});
test('Residenziali: due case di riposo religiose, contatti e cautele senza duplicati',()=>{
 const ancelle=data.choose({type:'casa-riposo',municipio:'V',name:'Grano'})[0];
 const pio=data.choose({type:'casa-riposo',municipio:'V',name:'San Pio'})[0];
 assert.equal(ancelle.phone,'062300300');assert.equal(ancelle.email,'ancelle.roma@virgilio.it');
 for(const r of [ancelle,pio]){assert.deepEqual(r.services[0].access,['da-verificare']);assert.equal(r.availability,null);assert.match(r.accreditation,/Nessun accreditamento sanitario SSR/);}
 assert.match(pio.services[0].description,/Donne anziane/);
 assert.equal(data.records.filter(r=>r.id==='res-taylor').length,1);
 assert.ok(render().some(n=>n.href==='mailto:ancelle.roma@virgilio.it'));
 assert.ok(render().some(n=>n.href==='tel:062300300'));
 assert.match(data.pending[2].name,/San Vincenzo.*Villa Tilde/);
});
test('Residenziali: dipendenze locali, fallback senza JavaScript e nessuna raccolta sanitaria',()=>{
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');for(const file of ['residenziali-data.js','residenziali.js'])assert.ok(html.includes('/anteprima-sportello/app/'+file));
 assert.match(html,/<noscript><h3>Strutture residenziali/);
 const source=fs.readFileSync('anteprima-sportello/app/residenziali.js','utf8');assert.doesNotMatch(source,/fetch\(|localStorage|innerHTML|setInterval/);
 assert.match(source,/Non inviare dati sanitari/);assert.match(source,/Disponibilità di posti non verificata/);
});
