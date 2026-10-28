'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../anteprima-sportello/app/farmacie-data'),catalog=require('../anteprima-sportello/app/servizi');
const deliveryContext={window:{}};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/consegne-data.js','utf8'),deliveryContext);const deliveries=deliveryContext.window.SportelloConsegneData;
test('Farmacie: sei schede, cinque nuovi record e un riferimento canonico a Castelforte',()=>{
 assert.equal(data.records.length,6);assert.equal(new Set(data.records.map(r=>r.id)).size,6);
 assert.equal(data.records.filter(r=>!r.deliveryRef).length,5);const ref=data.records.find(r=>r.deliveryRef);assert.equal(ref.id,'consegne-castelforte');assert.equal(ref.address,undefined);assert.equal(ref.phone,undefined);
 const base=deliveries.records.find(r=>r.id===ref.id),record=data.resolve(ref,deliveries);assert.equal(record.address,base.address);assert.equal(record.phone,base.phones[0].number);assert.equal(record.original,base);
 assert.equal(catalog.resources.length,50);assert.equal(catalog.areas.length,9);assert.throws(()=>data.resolve(ref,{records:[]}),/non trovata/);
});
test('Farmacie: tre modalita e ricerca combinata senza presunzioni sui turni odierni',()=>{
 assert.equal(data.choose(deliveries,{mode:'notturne'}).length,4);assert.equal(data.choose(deliveries,{mode:'festive'}).length,5);assert.equal(data.choose(deliveries,{mode:'consegna'}).length,4);
 assert.equal(data.choose(deliveries,{mode:'consegna',name:'ROBINIE'}).length,1);assert.equal(data.choose(deliveries,{mode:'notturne',name:'Castelforte'}).length,0);assert.equal(data.choose(deliveries,{name:'Settecamini'}).length,1);
 assert.equal(data.dutyVerifiedDate,null);assert.ok(data.records.every(r=>r.openNow===undefined&&r.onDutyToday===undefined));
});
test('Farmacie: recapito Torraccio distinto dallo sportello sociale e trasparenza delle fonti',()=>{
 const record=data.records.find(r=>r.id==='farmacia-torraccio');assert.equal(record.phone,'0657088710');assert.match(record.note,/Recapito principale/);assert.match(record.note,/discordanza/);assert.match(record.note,/non è confermato come attivo/);assert.notEqual(record.phone,'0657088712');
 for(const r of data.records)for(const source of r.sources){assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.checkedAt,data.checkedAt);}
 for(const r of data.choose(deliveries)){const url=new URL(data.mapUrl(r.address));assert.equal(url.searchParams.get('query'),r.address);assert.match(r.phone,/^0\d+$/);}
});
function render(resources=[]){
 const nodes=[];const document={createElement(tag){const el={tag,children:[],value:'',append(...items){this.children.push(...items);if(tag==='select'&&!this.value&&items[0]?.tag==='option')this.value=items[0].value;},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[];}};nodes.push(el);return el;}};
 const context={window:{SportelloFarmacieData:data,SportelloConsegneData:deliveries},document};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/farmacie.js','utf8'),context);
 context.window.SportelloFarmacie.decorate({id:'info-salute-farmacie'},document.createElement('div'),catalog,resources);return nodes;
}
test('Farmacie: nessun doppio introduttivo, consegna distinta da corriere e vendita online',()=>{
 const nodes=render();assert.equal(nodes.filter(n=>n.tag==='details').length,6);assert.equal(nodes.filter(n=>n.tag==='a'&&n.href?.startsWith('tel:')).length,6);
 assert.equal(nodes.filter(n=>n.href==='tel:0657088710').length,1);assert.equal(nodes.filter(n=>n.href==='tel:0620686868').length,0);
 assert.ok(nodes.some(n=>n.textContent==='Consegna locale o spedizione tramite corriere'));
 assert.ok(nodes.some(n=>/non acquisisce i turni giornalieri/.test(n.textContent||'')));assert.ok(nodes.some(n=>/vendita online di medicinali con ricetta non è consentita/.test(n.textContent||'')));
 assert.match(data.records.find(r=>r.id==='farmacia-robinie').delivery,/2–4 giorni/);assert.match(data.records.find(r=>r.id==='farmacia-romaest').opening,/Altri festivi da confermare/);
 const js=fs.readFileSync('anteprima-sportello/app/farmacie.js','utf8');assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|<form/);
});
test('Farmacie: selezione con Consegne mostra un solo dettaglio completo per Castelforte',()=>{
 const nodes=render([deliveries.records.find(r=>r.id==='consegne-castelforte')]);assert.equal(nodes.filter(n=>n.tag==='details').length,5);assert.equal(nodes.filter(n=>n.href==='#risorsa-consegne-castelforte').length,1);
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');assert.ok(html.indexOf('/app/farmacie-data.js')<html.indexOf('/app/farmacie.js'));assert.ok(html.indexOf('/app/farmacie.js')<html.indexOf('/app/esplora.js'));
});
