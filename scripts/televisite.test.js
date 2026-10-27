'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../anteprima-sportello/app/televisite-data'),catalog=require('../anteprima-sportello/app/servizi');
test('Televisite: tre piattaforme uniche, una sola nuova sottocategoria e nove categorie',()=>{
 assert.equal(data.records.length,3);assert.equal(new Set(data.records.map(r=>r.id)).size,3);
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,41);
 assert.equal(catalog.resources.filter(r=>r.id==='info-salute-visite-private-televisite').length,1);
 assert.equal(catalog.resources.filter(r=>r.id==='info-salute-continuita-assistenziale').length,1);
 assert.equal(catalog.resources.filter(r=>r.id==='info-salute-medici-pediatri').length,1);
});
test('Televisite: limiti iDoctors distinti dalle possibilita Doctolib e dalle condizioni individuali MioDottore',()=>{
 const [i,d,m]=data.records;
 assert.match(i.documents,/non rilascia referti/);assert.match(i.documents,/non è utilizzabile per prescrivere farmaci/);
 assert.match(d.documents,/possibili rinnovi/);assert.match(d.documents,/non sono garantiti/);
 assert.match(m.documents,/non è stata verificata una garanzia generale/);
 assert.match(i.costs,/pagamento online/);assert.match(d.costs,/preautorizzazione/);assert.match(m.costs,/condizioni dello specialista/);
});
test('Televisite: recensioni non uniformate e tutte le condizioni riferite a fonti ufficiali HTTPS',()=>{
 assert.match(data.records[1].reviews,/Google/);
 for(const record of data.records){
  assert.ok(record.costs&&record.connection&&record.documents&&record.reviews);
  const allowed=record.id==='idoctors'?['www.idoctors.it']:record.id==='doctolib'?['www.doctolib.it','doctolibpatient.zendesk.com','doctolib.zendesk.com']:['www.miodottore.it'];
  for(const url of [record.url,...record.sources.map(s=>s.url)]){assert.equal(new URL(url).protocol,'https:');assert.ok(allowed.includes(new URL(url).hostname));}
 }
 assert.match(data.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
});
function render(id){
 const nodes=[];const document={createElement(tag){const el={tag,children:[],append(...items){this.children.push(...items);}};nodes.push(el);return el;}};
 const context={window:{SportelloTelevisiteData:data},document};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/televisite.js','utf8'),context);
 context.window.SportelloTelevisite.decorate({id},document.createElement('div'));return nodes;
}
test('Televisite: percorso semplice, tre dettagli nativi, collegamenti esterni e cautele',()=>{
 const nodes=render('info-salute-visite-private-televisite');assert.equal(nodes.filter(n=>n.tag==='details').length,3);
 assert.equal(nodes.filter(n=>n.tag==='li').length,4);
 for(const record of data.records)assert.equal(nodes.filter(n=>n.id==='televisite-'+record.id).length,1);
 assert.ok(nodes.some(n=>/non certificano la qualità clinica/.test(n.textContent||'')));
 assert.ok(nodes.some(n=>/non raccoglie dati sanitari/.test(n.textContent||'')));
 assert.ok(nodes.some(n=>/familiare.*caregiver \(chi ti assiste\)/.test(n.textContent||'')));
 assert.ok(nodes.some(n=>/Nessuna convenzione commerciale o partnership/.test(n.textContent||'')));
 assert.ok(nodes.some(n=>n.href==='tel:112'));
});
test('Televisite: non interviene nella continuita assistenziale e non gestisce prenotazioni o dati',()=>{
 assert.equal(render('info-salute-continuita-assistenziale').filter(n=>n.tag==='details').length,0);
 const js=fs.readFileSync('anteprima-sportello/app/televisite.js','utf8');assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|<form/);
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');assert.ok(html.indexOf('/app/televisite-data.js')<html.indexOf('/app/televisite.js'));assert.ok(html.indexOf('/app/televisite.js')<html.indexOf('/app/esplora.js'));
 assert.match(html,/<noscript><h3>Visite specialistiche e televisite/);
});
