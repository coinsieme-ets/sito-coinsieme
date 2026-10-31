'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const id='info-fisioterapia-domicilio',find=opts=>engine.chooseHomeResources(['domicilio'],catalog,opts).filter(r=>r.id===id);
const data=require('../anteprima-sportello/app/fisioterapia-data');
test('Fisioterapia rifinitura: conteggi espliciti e derivati dal catalogo, senza alterare gli altri ambiti',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),context={window:{SportelloFisioterapiaData:data}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/fisioterapia.js'),'utf8'),context);
 const api=context.window.SportelloFisioterapia;
 assert.equal(api.groupCaption({id:'domicilio:fisioterapia'}),'3 percorsi · 4 erogatori documentati');
 assert.match(api.selectionCaption([data.intro]),/3 percorsi di orientamento e 4 erogatori documentati/);
 assert.equal(api.selectionCaption([]),null);assert.equal(api.selectionCaption([data.intro,{id:'altro'}]),null);
 assert.equal(api.groupCaption({id:'salute:farmacie'}),null);
 const smaller={...data,providers:data.providers.slice(0,2)};context.window.SportelloFisioterapiaData=smaller;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/fisioterapia.js'),'utf8'),context);
 assert.match(context.window.SportelloFisioterapia.groupCaption({id:'domicilio:fisioterapia'}),/2 erogatori documentati/);
});
test('Fisioterapia rifinitura: erogatori, guide ASL, fonti e date integralmente conservati',()=>{
 const hash=require('node:crypto').createHash('sha256').update(JSON.stringify({providers:data.providers,guides:data.guides,sources:data.sources})).digest('hex');
 assert.equal(hash,'970af5d39440c59e6fd13976162d99487050264b748bdabef6fa244a7bdbb8b7');
 assert.match(data.paths[0].label,/ASL/);assert.match(data.paths[0].description,/valutazione/);
});
test('Fisioterapia: voce autonoma a domicilio, singolo record orientativo senza nuove macroaree',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,51);
 const records=catalog.resources.filter(r=>r.id===id);assert.equal(records.length,1);const r=records[0];
 assert.equal(r.homeKind,'fisioterapia');assert.equal(r.category,'domicilio');assert.equal(r.status,'informazione_orientativa');assert.equal(catalog.isVerifiedResource(r),false);
 for(const field of ['entity','zone','source','verifiedAt'])assert.equal(r[field],null);
 assert.match(r.description,/professionisti sanitari abilitati/);assert.match(r.access,/non eroga/);assert.match(r.access,/non gestisce prenotazioni/);assert.match(r.access,/non dichiara convenzioni/);
 assert.equal(r.links[0].url,'https://fisionet.fnofi.it/albo-professionale');
});
test('Fisioterapia fase 2: tre percorsi e quattro erogatori unici, candidati incompleti esclusi',()=>{
 assert.deepEqual(data.paths.map(p=>p.id),['pubblico','privato','orientamento']);
 assert.deepEqual(data.providers.map(p=>p.id),['adi-salus','vivisol','unisan-majorana','fisiosalaria']);
 assert.equal(new Set(data.providers.map(p=>p.id)).size,4);
 assert.equal(data.providers.filter(p=>/San Luca|Domus Salus/.test(p.name)).length,0);
 assert.equal(catalog.resources.filter(r=>r.id===data.intro.id).length,1);
});
test('Fisioterapia fase 2: regime e riscontri ASL non dedotti dalla sede o dal marchio',()=>{
 assert.deepEqual(data.chooseProviders({path:'pubblico',asl:'roma2'}).map(p=>p.id),['vivisol']);
 assert.deepEqual(data.chooseProviders({path:'pubblico',asl:'roma3',regime:'ex26'}).map(p=>p.id),['unisan-majorana']);
 assert.deepEqual(data.chooseProviders({path:'pubblico',asl:'roma1',regime:'ex26'}),[]);
 assert.equal(data.chooseProviders({path:'pubblico',asl:'tutte'}).length,3);
 assert.deepEqual(data.providers.find(p=>p.id==='fisiosalaria').asls,[]);
});
test('Fisioterapia fase 2: fonti HTTPS e verifica datata per ogni guida e scheda',()=>{
 for(const item of [...data.guides,...data.providers]){
  assert.ok(item.sources.length);for(const source of item.sources){assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.checkedAt,'2026-10-30');assert.ok(source.label);}
 }
 assert.equal(data.sources.roma2list.documentDate,'2025-05-15');assert.notEqual(data.sources.roma2list.documentDate,data.sources.roma2list.checkedAt);
 assert.equal(data.guides.find(g=>g.id==='roma2').resourceId,'territorio-adi-d5');
 assert.equal(catalog.resources.filter(r=>r.id==='territorio-adi-d5').length,1);
});
test('Fisioterapia fase 2: ricerca e tipo del privato senza tariffe promozionali o copertura municipale presunta',()=>{
 for(const query of ['fisiosalaria','FISIOSALARIA','mobilita'])assert.equal(data.chooseProviders({path:'privato',query}).length,1);
 assert.equal(data.chooseProviders({path:'privato',query:'inesistente'}).length,0);
 for(const type of ['motoria','postoperatoria','mobilita'])assert.equal(data.chooseProviders({path:'privato',type}).length,1);
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
