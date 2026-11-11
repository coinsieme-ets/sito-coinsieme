'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const model=require('../js/site-search'),catalog=require('./search-catalog');
const root=path.resolve(__dirname,'..');
test('Ricerca: accenti, punteggiatura e prefissi senza corrispondenze artificiali CupMedico/CUP',()=>{
 const entries=catalog.build();
 assert.ok(model.search(entries,'SOCIALITÀ').length);
 assert.match(model.search(entries,'fisioterap')[0].title,/Fisioterapia/);
 assert.match(model.search(entries,'CupMedico')[0].title,/CupMedico/);
 assert.equal(model.search(entries,'CupMedico').some(e=>e.title.startsWith('ReCUP')),false);
 assert.deepEqual(model.search(entries,'di per la'),[]);assert.deepEqual(model.search(entries,'x'),[]);
});
test('Ricerca: bisogni comuni, nessuna ricerca vuota e nessun duplicato di destinazione',()=>{
 const entries=catalog.build();assert.equal(new Set(entries.map(e=>e.url)).size,entries.length);
 for(const q of ['aiuto a casa','giochi di carte','aprire senza chiavi','salvavita','fisioterapista','burraco','farmacie','CupMedico'])assert.ok(model.search(entries,q).length,q);
 assert.equal(model.search(entries,'zzzzzzinesistente').length,0);
 assert.ok(model.search(entries,'aiuto a casa').slice(0,5).some(e=>/Assistenza domiciliare|Badant/.test(e.title)));
 assert.ok(entries.some(e=>e.title==='Policlinico Tor Vergata'&&e.url.endsWith('/risorsa/territorio-tor-vergata')));
 assert.equal(entries.filter(e=>e.url.includes('/farmacia/')).length,6);
});
test('Ricerca: tutte le schede Casa e le 77 risorse Socialita sono indicizzate una volta',()=>{
 const entries=catalog.build(),html=fs.readFileSync(path.join(root,'casa-che-si-prende-cura/index.html'),'utf8');
 assert.equal(entries.filter(e=>e.type==='Casa').length,(html.match(/class="solution(?: [^"]*)?"/g)||[]).length);
 assert.equal(entries.filter(e=>e.url.includes('/sociale/')).length,77);
 assert.ok(entries.every(e=>e.url.startsWith('/')&&!e.url.startsWith('//')&&!e.url.includes('?')));
});
test('Ricerca: bozze, date future e fonti esterne non diventano risultati',()=>{
 const article={title:'Articolo ammesso',summary:'Testo',url:'/articoli/ammesso/',published:true,date:'2026-11-01'};
 const entries=catalog.build({today:'2026-11-08',articles:[article,{...article,published:false,url:'/articoli/bozza/'},{...article,date:'2027-01-01',url:'/articoli/futuro/'}],news:[{...article,url:'https://example.org/notizia'}]});
 assert.deepEqual(entries.filter(e=>e.type==='Articolo').map(e=>e.url),['/articoli/ammesso/']);
});
test('Ricerca: partenze trascorse non vengono riproposte come attuali',()=>{
 const entries=catalog.build();assert.equal(model.search(entries,'Arezzo','2027-01-01').some(e=>e.until),false);
});
test('Ricerca: HTML e indice rigenerati insieme senza cambiare la selezione editoriale',async()=>{
 const fixture=await require('./test-support/homepage-fixture').productionFixture();
 try{
  assert.match(fixture.html,/<h2 id="site-search-title">Che cosa cerchi\?<\/h2>/);
  assert.ok(fixture.html.indexOf('id="site-search"')<fixture.html.indexOf('<section class="container opening"'));
  const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(fixture.dir,'search-index.js'),'utf8'),c);
  assert.ok(c.window.CoinsiemeSearchIndex.length>200);
  assert.match(fixture.html,/src="\/assets\/home-dinamica\/search-index.js"/);
  for(const workflow of ['build-articoli','sync-rassegna']){const yaml=fs.readFileSync(path.join(root,'.github/workflows',workflow+'.yml'),'utf8');assert.match(yaml,/build-cms\.js/);assert.match(yaml,/assets css js/);assert.match(yaml,/anteprima-sportello casa-che-si-prende-cura/);}
 }finally{fixture.cleanup();}
});
test('Ricerca: niente invio, storage, telemetry o modifiche al noindex',()=>{
 const client=fs.readFileSync(path.join(root,'js/site-search.js'),'utf8');
 assert.doesNotMatch(client,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|gtag\(|history\.|location\./);
 assert.match(client,/e.preventDefault\(\)/);assert.match(client,/pagehide/);
 assert.match(fs.readFileSync(path.join(root,'anteprima-sportello/index.html'),'utf8'),/noindex,nofollow/);
});
test('Ricerca: due rigenerazioni e pacchetti Pages conservano indice e dipendenze',async()=>{
 const {productionFixture,snapshot,temporary,cleanup}=require('./test-support/homepage-fixture');
 const first=await productionFixture(),second=temporary('search-repeat'),site=temporary('search-pages');
 try{
  await require('./build-homepage').build({snapshot:snapshot(),outputDir:second,sourceHtml:first.html,writeIndex:false});
  assert.equal(fs.readFileSync(path.join(first.dir,'search-index.js'),'utf8'),fs.readFileSync(path.join(second,'search-index.js'),'utf8'));
  for(const name of ['build-articoli','sync-rassegna']){
   const yaml=fs.readFileSync(path.join(root,'.github/workflows',name+'.yml'),'utf8');
   const dirs=yaml.match(/for dir in ([^;]+); do/)[1].split(' ');
   for(const dir of ['css','js','anteprima-sportello','casa-che-si-prende-cura']){assert.ok(dirs.includes(dir));fs.cpSync(path.join(root,dir),path.join(site,dir),{recursive:true});}
   fs.cpSync(second,path.join(site,'assets/home-dinamica'),{recursive:true});
   const sportello=fs.readFileSync(path.join(root,'anteprima-sportello/index.html'),'utf8');
   assert.ok(dirs.includes('assets'));
   for(const m of sportello.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)){const file=m[1];fs.mkdirSync(path.dirname(path.join(site,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(site,file));}
   for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.html')))fs.copyFileSync(path.join(root,file),path.join(site,file));
   require('./check-pages-sportello').check(root,site);
   for(const file of ['assets/home-dinamica/search-index.js','css/site-search.css','js/site-search.js','js/search-target.js'])assert.ok(fs.existsSync(path.join(site,file)),name+': '+file);
  }
 }finally{first.cleanup();cleanup(second);cleanup(site);}
});
