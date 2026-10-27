'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../anteprima-sportello/app/diagnostica-data'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
test('Diagnostica: cinque operatori, un percorso senza categoria o introduzione duplicata',()=>{
 assert.equal(data.records.length,5);assert.equal(new Set(data.records.map(r=>r.id)).size,5);assert.equal(catalog.areas.length,9);
 const r=catalog.resources.find(r=>r.id==='info-salute-diagnostica-domicilio');assert.ok(r);
 assert.equal(engine.servicePresentation(r,{label:r.name},catalog).inline,true);
 assert.equal(catalog.subcategories.filter(s=>s.id==='diagnostica-domicilio').length,1);
});
test('Diagnostica: filtri soltanto su prestazioni domiciliari documentate e ripristino dati',()=>{
 for(const [type,n] of [['prelievi',3],['radiografie',4],['ecografie',4],['ecg-holter',3],['visite',3]])assert.equal(data.choose({type}).length,n);
 assert.equal(data.choose({name:'D’AMBROSIO'})[0].id,'dambrosio');assert.equal(data.choose({name:'inesistente'}).length,0);
 assert.equal(data.choose({type:'prelievi',name:'EOSMED'}).length,1);assert.equal(data.choose().length,5);
 assert.match(data.records[0].caution,/servizio dichiarato dal gestore, da confermare telefonicamente prima della prenotazione/);
 assert.deepEqual(data.records[0].uncertainTypes,['prelievi']);
});
test('Diagnostica: prezzi, territori e titoli non trasformati in garanzie',()=>{
 assert.match(data.records.find(r=>r.id==='ematolab').costs,/15 €.*Non è il totale/);
 assert.match(data.records[0].caution,/26 settembre 2026/);
 assert.match(data.records.find(r=>r.id==='rxteam').authorization,/G01280.*Non verifica da sola/);
 assert.match(data.records.find(r=>r.id==='rxteam').authorization,/radiologia diagnostica \(cod\. 69\)/);
 assert.match(data.records.find(r=>r.id==='dambrosio').coverage,/entro.*Raccordo.*Non significa copertura integrale/);
 for(const r of data.records){assert.ok(r.authorization&&r.timing&&r.booking&&r.coverage);assert.ok(!r.phone||/^\d+$/.test(r.phone));for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.equal(s.checkedAt,'2026-10-27');}}
});
test('Diagnostica: schede native, contatti e nessuna raccolta clinica',()=>{
 const nodes=[],document={createElement(tag){const el={tag,value:'',children:[],append(...c){this.children.push(...c);if(tag==='select'&&!this.value)this.value=c[0].value;},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[];}};nodes.push(el);return el;}};
 const context={document,window:{SportelloDiagnosticaData:data}};const source=fs.readFileSync('anteprima-sportello/app/diagnostica.js','utf8');vm.runInNewContext(source,context);
 context.window.SportelloDiagnostica.decorate({id:'info-salute-diagnostica-domicilio'},document.createElement('div'));
 assert.equal(nodes.filter(n=>n.tag==='details').length,5);assert.equal(nodes.filter(n=>n.tag==='select').length,1);
 assert.ok(nodes.some(n=>n.href==='tel:0624304591'));assert.match(source,/non raccoglie informazioni cliniche/);
 assert.doesNotMatch(source,/fetch\(|localStorage|innerHTML|setInterval/);
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');for(const f of ['diagnostica-data.js','diagnostica.js'])assert.ok(html.includes('/app/'+f));
});
