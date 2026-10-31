'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../anteprima-sportello/app/continuita-data'),catalog=require('../anteprima-sportello/app/servizi');
test('Continuita: cinque prestazioni distinte, riuso dei due presidi, catalogo precedente conservato',()=>{
 assert.equal(data.sites.length,5);assert.equal(new Set(data.sites.map(r=>r.id)).size,5);
 assert.equal(data.sites.filter(r=>r.resourceId).length,2);
 assert.equal(catalog.resources.length,51);assert.equal(catalog.areas.length,9);
 for(const site of data.sites.filter(r=>r.resourceId))assert.equal(catalog.resources.filter(r=>r.id===site.resourceId).length,1);
 const forte=data.resolve(data.sites[0],catalog);assert.equal(forte.address,catalog.resources.find(r=>r.id===forte.resourceId).address);
 assert.equal(data.choose(catalog,{name:'eucalipti'})[0].address,'Via degli Eucalipti 14, Roma');
 assert.throws(()=>data.resolve(data.sites[0],{resources:[]}),/non trovato/);
});
test('Continuita: filtri per adulti, pediatrico, zona e ricerca senza duplicati',()=>{
 assert.equal(data.choose(catalog,{profile:'adulti'}).length,5);
 assert.equal(data.choose(catalog,{profile:'pediatrico'}).length,3);
 assert.equal(data.choose(catalog,{profile:'pediatrico',name:'Rubellia'}).length,0);
 assert.equal(data.choose(catalog,{zone:'Settecamini',name:'RUBELLIA'}).length,1);
 assert.equal(data.choose(catalog,{name:'Santa Caterina'}).length,1);
 assert.equal(data.choose(catalog,{name:'nessuna sede'}).length,0);
});
test('Continuita: mappe per indirizzo documentato senza coordinate inventate',()=>{
 for(const site of data.choose(catalog)){const url=new URL(data.mapUrl(site.address));assert.equal(url.protocol,'https:');assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('query'),site.address);assert.equal(url.searchParams.get('api'),'1');}
 for(const url of Object.values(data.sources))assert.match(url,/^https:\/\/(?:www\.)?(?:aslroma2|salutelazio)\.it\//);
});
test('Continuita: orari distinti e avvertenza sulla divergenza pediatrica',()=>{
 assert.match(data.hours.guardia,/20:00–08:00/);assert.match(data.hours.guardia,/10:00–20:00/);assert.match(data.hours.guardia,/08:00–20:00/);
 assert.match(data.hours.ambufest,/10:00–19:00/);assert.match(data.hours.ambufest,/14:00–19:00/);
 assert.match(data.sites.find(s=>s.id==='casal-pazzi').note,/non riporta questa sede/);
});
test('Continuita: numero unico, sei schede, sicurezza e nessuna raccolta sanitaria',()=>{
 const nodes=[];const document={createElement(tag){const el={tag,children:[],value:'',append(...items){this.children.push(...items);if(this.tag==='select'&&!this.value&&items[0]?.tag==='option')this.value=items[0].value;},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[];}};nodes.push(el);return el;}};
 const context={window:{SportelloContinuitaData:data},document};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/continuita.js','utf8'),context);
 context.window.SportelloContinuita.decorate({id:'info-salute-continuita-assistenziale'},document.createElement('div'),catalog);
 assert.equal(nodes.filter(n=>n.tag==='details').length,6);
 assert.equal(nodes.filter(n=>n.href==='tel:116117').length,1);assert.equal(nodes.filter(n=>n.href==='tel:112').length,1);
 assert.ok(nodes.some(n=>/48\/72/.test(n.textContent||'')));assert.ok(nodes.some(n=>/3 giorni/.test(n.textContent||'')));
 assert.ok(nodes.some(n=>/Non prescrive esami/.test(n.textContent||'')));assert.ok(nodes.some(n=>/non sono presentate come ambulatori ad accesso diretto/.test(n.textContent||'')));
 assert.ok(nodes.some(n=>/sabato\/prefestivo/.test(n.textContent||'')));
 const js=fs.readFileSync('anteprima-sportello/app/continuita.js','utf8');assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|XMLHttpRequest|<form/);
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');assert.ok(html.indexOf('/app/continuita-data.js')<html.indexOf('/app/continuita.js'));assert.ok(html.indexOf('/app/continuita.js')<html.indexOf('/app/esplora.js'));
});
