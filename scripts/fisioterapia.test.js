'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const id='info-fisioterapia-domicilio',find=opts=>engine.chooseHomeResources(['domicilio'],catalog,opts).filter(r=>r.id===id);
const data=require('../anteprima-sportello/app/fisioterapia-data');
test('Fisioterapia rifinitura: conteggi espliciti e derivati dal catalogo, senza alterare gli altri ambiti',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),context={window:{SportelloFisioterapiaData:data}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/fisioterapia.js'),'utf8'),context);
 const api=context.window.SportelloFisioterapia;
 assert.equal(api.groupCaption({id:'domicilio:fisioterapia'}),'11 enti nei percorsi ASL · 14 operatori privati');
 assert.match(api.selectionCaption([data.intro]),/non professionisti disponibili nella tua zona/);
 assert.equal(api.selectionCaption([]),null);assert.equal(api.selectionCaption([data.intro,{id:'altro'}]),null);
 assert.equal(api.groupCaption({id:'salute:farmacie'}),null);
 const smaller={...data,providers:data.providers.slice(0,2)};context.window.SportelloFisioterapiaData=smaller;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/fisioterapia.js'),'utf8'),context);
 assert.equal(context.window.SportelloFisioterapia.groupCaption({id:'domicilio:fisioterapia'}),'2 enti nei percorsi ASL · 0 operatori privati');
});
test('Fisioterapia rifinitura: erogatori, guide ASL, fonti e date integralmente conservati',()=>{
 const hash=require('node:crypto').createHash('sha256').update(JSON.stringify({providers:data.providers.slice(0,4),guides:data.guides,sources:data.sources})).digest('hex');
 assert.equal(hash,'970af5d39440c59e6fd13976162d99487050264b748bdabef6fa244a7bdbb8b7');
 assert.match(data.paths[0].label,/ASL/);assert.match(data.paths[0].description,/valutazione/);
});
test('Fisioterapia: voce autonoma a domicilio, singolo record orientativo senza nuove macroaree',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,59);
 const records=catalog.resources.filter(r=>r.id===id);assert.equal(records.length,1);const r=records[0];
 assert.equal(r.homeKind,'fisioterapia');assert.equal(r.category,'domicilio');assert.equal(r.status,'informazione_orientativa');assert.equal(catalog.isVerifiedResource(r),false);
 for(const field of ['entity','zone','source','verifiedAt'])assert.equal(r[field],null);
 assert.match(r.description,/professionisti sanitari abilitati/);assert.match(r.access,/non eroga/);assert.match(r.access,/non gestisce prenotazioni/);assert.match(r.access,/non dichiara convenzioni/);
 assert.equal(r.links[0].url,'https://fisionet.fnofi.it/albo-professionale');
});
test('Fisioterapia: tre percorsi e venticinque riferimenti distinti, senza duplicare gli enti',()=>{
 assert.deepEqual(data.paths.map(p=>p.id),['pubblico','privato','orientamento']);
 assert.deepEqual(data.providers.slice(0,6).map(p=>p.id),['adi-salus','vivisol','unisan-majorana','fisiosalaria','alessandro-faiella','fisio-home-marco-russo']);
 assert.equal(data.providers.length,25);assert.equal(new Set(data.providers.map(p=>p.id)).size,25);
 assert.equal(data.providers.filter(p=>/Domus Salus/.test(p.name)).length,1);
 assert.equal(data.providers.filter(p=>/San Luca/.test(p.name)).length,0);
 assert.equal(catalog.resources.filter(r=>r.id===data.intro.id).length,1);
});
test('Fisioterapia fase 2: regime e riscontri ASL non dedotti dalla sede o dal marchio',()=>{
 assert.deepEqual(data.chooseProviders({path:'pubblico',asl:'roma2'}).map(p=>p.id),['vivisol',...require('../anteprima-sportello/app/cure-domiciliari-data').adi.filter(r=>!r.existingPhysioId).map(r=>r.id+'-fisioterapia')]);
 assert.deepEqual(data.chooseProviders({path:'pubblico',asl:'roma3',regime:'ex26'}).map(p=>p.id),['unisan-majorana']);
 assert.deepEqual(data.chooseProviders({path:'pubblico',asl:'roma1',regime:'ex26'}),[]);
 assert.equal(data.chooseProviders({path:'pubblico',asl:'tutte'}).length,11);
 assert.deepEqual(data.providers.find(p=>p.id==='fisiosalaria').asls,[]);
});

test('Fisioterapia privata: nuove schede ricercabili senza copertura o conferme presunte',()=>{
 assert.equal(data.chooseProviders({path:'privato'}).length,14);
 for(const query of ['Faiella','Marco Russo'])assert.equal(data.chooseProviders({path:'privato',query}).length,1);
 const faiella=data.providers.find(r=>r.id==='alessandro-faiella');
 assert.match(faiella.seats,/confermata dal Presidente/);
 assert.match(faiella.access,/non un numero confermato direttamente/);
 assert.deepEqual(faiella.asls,[]);assert.equal(faiella.verification,'parziale');
 const russo=data.providers.find(r=>r.id==='fisio-home-marco-russo');
 assert.match(russo.seats,/Laparelli 124/);assert.equal(russo.phone,'0621128892');
 assert.match(russo.coverage,/Roma Est e Sud-Est/);
 assert.match(russo.caution,/non confermati direttamente/);
 assert.ok(!data.providers.some(r=>/Piracci/.test(r.name)));
});

test('Fisioterapia privata: quattordici offerte domiciliari, nessun albo o duplicato contato',()=>{
 const rows=data.chooseProviders({path:'privato'});
 assert.equal(rows.length,14);assert.equal(new Set(rows.map(r=>r.url)).size,14);
 for(const r of rows){
  assert.ok(r.sources.length);assert.equal(r.verification,'parziale');assert.deepEqual(r.asls,[]);
  assert.ok(r.access&&r.coverage&&r.costs&&r.qualifications&&r.caution);
  assert.doesNotMatch(r.name,/FNOFI|Albo professionale/);
  assert.ok(r.phone||r.email||r.contacts?.length||r.url);
  assert.equal(data.chooseProviders({path:'privato',query:r.name}).length,1);
 }
 const teresa=rows.find(r=>r.id==='teresa-delle-fave');assert.match(teresa.description,/solo in ambulatorio/);
 const litta=rows.find(r=>r.id==='luigi-litta-domicilio');assert.match(litta.coverage,/Provincia sud-est/);
 const top=rows.find(r=>r.id==='fisionoleggio-top-physio-domicilio');assert.match(top.description,/una sola scheda/);
});
test('Fisioterapia fase 2: fonti HTTPS e verifica datata per ogni guida e scheda',()=>{
 for(const item of [...data.guides,...data.providers]){
  const historical=!item.regime||data.providers.slice(0,4).includes(item);
  assert.ok(item.sources.length);for(const source of item.sources){assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.checkedAt,historical?'2026-10-30':'2026-11-20');assert.ok(source.label);}
 }
 assert.equal(data.sources.roma2list.documentDate,'2025-05-15');assert.notEqual(data.sources.roma2list.documentDate,data.sources.roma2list.checkedAt);
 assert.equal(data.guides.find(g=>g.id==='roma2').resourceId,'territorio-adi-d5');
 assert.equal(catalog.resources.filter(r=>r.id==='territorio-adi-d5').length,1);
});
test('Fisioterapia fase 2: ricerca e tipo del privato senza tariffe promozionali o copertura municipale presunta',()=>{
 for(const query of ['fisiosalaria','FISIOSALARIA'])assert.equal(data.chooseProviders({path:'privato',query}).length,1);
 assert.ok(data.chooseProviders({path:'privato',query:'mobilita'}).some(r=>r.id==='fisiosalaria'));
 assert.equal(data.chooseProviders({path:'privato',query:'inesistente'}).length,0);
 for(const type of ['motoria','postoperatoria','mobilita'])assert.ok(data.chooseProviders({path:'privato',type}).some(r=>r.id==='fisiosalaria'));
 const r=data.providers.find(p=>p.regime==='privato');assert.match(r.costs,/40 euro/);assert.match(r.costs,/30\/10\/2026/);assert.doesNotMatch(r.costs,/19[,.]90/);assert.match(r.coverage,/dichiarazione/);assert.match(r.qualifications,/non verificati/);
});
test('Fisioterapia fase 2: componenti locali caricati e preservati, noindex e privacy invariati',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'anteprima-sportello/index.html'),'utf8');
 for(const file of ['fisioterapia-data.js','fisioterapia.js']){assert.ok(html.includes('/anteprima-sportello/app/'+file));assert.ok(html.indexOf(file)<html.indexOf('app/servizi.js'));}
 assert.match(html,/noindex,nofollow/);assert.match(html,/connect-src 'none'/);
 for(const file of ['fisioterapia-data.js','fisioterapia.js'])assert.doesNotMatch(fs.readFileSync(path.join(root,'anteprima-sportello/app',file),'utf8'),/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
 for(const file of ['build-articoli.yml','sync-rassegna.yml'])assert.match(fs.readFileSync(path.join(root,'.github/workflows',file),'utf8'),/sportello anteprima-sportello casa-che-si-prende-cura/);
});
test('Fisioterapia: ricerca per nome, funzione e accenti senza duplicati',()=>{
 for(const name of ['fisioterapia','fisioterapista','riabilitazione','recupero funzionale','mobilita','esercizi personalizzati'])assert.equal(find({name,kind:'fisioterapia'}).length,1,name);
 assert.equal(find({name:'inesistente'}).length,0);
 for(const kind of ['badante','cooperativa','pubblico','ausili','psicologia'])assert.equal(find({kind}).length,0,kind);
});
test('Fisioterapia: orientamento generale visibile nei filtri senza attestare copertura',()=>{
 for(const territory of ['tutti','v','est','roma','nazionale']){
  const found=find({territory,kind:'fisioterapia'});assert.equal(found.length,1);assert.equal(found[0].zone,null);assert.match(found[0].access,/non attesta la copertura/);
 }
 const fake={...catalog.resources.find(r=>r.id===id),status:'presenza_documentata'};assert.equal(engine.homeTerritoryMatches(fake,'v'),false);
});
test('Fisioterapia: gruppo dedicato e introduzione diretta senza ulteriore Approfondisci',()=>{
 const records=engine.chooseHomeResources(['domicilio'],catalog,{kind:'fisioterapia'}),groups=engine.groupServiceResources(records,['domicilio'],catalog);
 assert.equal(records.length,1);assert.equal(groups.length,1);assert.equal(groups[0].id,'domicilio:fisioterapia');assert.equal(groups[0].resources.length,1);
 assert.deepEqual(engine.servicePresentation(records[0],groups[0],catalog),{inline:true,showHeading:false});
 const both=engine.chooseHomeResources(['domicilio','salute'],catalog);assert.equal(both.filter(r=>r.id===id).length,1);
 assert.equal(engine.chooseHomeResources(['salute'],catalog).filter(r=>r.id===id).length,0);
});
