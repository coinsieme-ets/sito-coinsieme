const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {isUsefulNews,usefulBadge}=require('./news-kind');
const root=path.resolve(__dirname,'..'),url='https://www.coinsieme.it/rassegna/notizie-utili/incentivi-lavoro-disabilita-ets-2026.html';
const item=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'))).find(x=>x.url_fonte===url);
test('notizia utile riconosciuta da fonte e percorso, senza nuovi campi Airtable',()=>{
 assert.ok(item);assert.ok(isUsefulNews(item));
 for(const change of [{fonte:'Fonte esterna'},{url_fonte:'https://example.org/rassegna/notizie-utili/test.html'},{url_fonte:'https://www.coinsieme.it/articoli/test/'},{url_fonte:'javascript:alert(1)'}])assert.equal(isUsefulNews({...item,...change}),false);
});
test('news legacy: badge e link interno; fonti esterne invariate',()=>{
 const {renderHomeNews}=require('./home-news');
 const internal=renderHomeNews([item]);assert.ok(internal.includes(usefulBadge));assert.match(internal,/Leggi la scheda COINSIEME/);assert.doesNotMatch(internal,/target="_blank"|fonte esterna/);
 const external=renderHomeNews([{...item,fonte:'Fonte esterna',url_fonte:'https://example.org/notizia'}]);assert.match(external,/target="_blank"/);assert.match(external,/fonte esterna/);assert.ok(!external.includes(usefulBadge));
});
test('archivio conserva pagina completa e canonical unico, senza seconda pagina breve',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-useful-'));
 try{
  fs.mkdirSync(path.join(dir,'content/rassegna'),{recursive:true});fs.mkdirSync(path.join(dir,'rassegna/notizie-utili'),{recursive:true});
  fs.writeFileSync(path.join(dir,'content/rassegna/notizie-esterne.json'),JSON.stringify([item]));fs.copyFileSync(path.join(root,new URL(url).pathname),path.join(dir,new URL(url).pathname));
  fs.writeFileSync(path.join(dir,'index.html'),'<!-- CMS_RASSEGNA_SECTION_END -->');
  require('./build-segnalazioni-pages').build(dir);
  const html=fs.readFileSync(path.join(dir,'rassegna.html'),'utf8');assert.match(html,/NOTIZIA UTILE · COINSIEME/);assert.match(html,/A cura di Fondazione COINSIEME ETS/);assert.ok(html.includes(url));assert.doesNotMatch(html,/Fonte: COINSIEME/);
  assert.ok(!fs.existsSync(path.join(dir,'rassegna',item.notizie[0]+'.html')));
  const full=fs.readFileSync(path.join(dir,new URL(url).pathname),'utf8');assert.ok(require('./publish-segnalazioni').verifyPage(full,{recordId:item.notizie[0],publicUrl:url,source:url,title:item.titolo_editoriale}));
  fs.mkdirSync(path.join(dir,'scratch'));fs.writeFileSync(path.join(dir,'scratch/publication-manifest.json'),JSON.stringify({items:[],news:[{recordId:item.notizie[0],publicUrl:url,source:url,title:item.titolo_editoriale}]}));
  require('node:child_process').execFileSync(process.execPath,[path.join(root,'scripts/check-publication-build.js')],{cwd:dir});
  assert.ok(!require('./publish-segnalazioni').verifyPage(full.replace('<article ','<article hidden '),{recordId:item.notizie[0],publicUrl:url,source:url,title:item.titolo_editoriale}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('sync riutilizza il record e la pagina completa, preservando identificativo e priorita',async()=>{
 let dataset=[item];const record={id:item.notizie[0],fields:{...item}};
 const manifest=await require('./publish-rassegna').prepare(async()=>({records:[record]}),{pages:[],prepareSegments:async()=>({items:[],errors:[]}),read:()=>dataset,write:x=>{dataset=x;},today:'2026-10-28'});
 assert.equal(manifest.newsErrors.length,0);assert.equal(manifest.news[0].publicUrl,url);assert.equal(dataset.length,1);assert.deepEqual(dataset[0].notizie,item.notizie);assert.equal(dataset[0].ordine_editoriale,1);
});
test('renderer dinamico: badge nelle news e in copertina, date reali e link interni',async()=>{
 const articles=require('./homepage-state').snapshotArticles(require('./test-support/homepage-fixture').snapshot());
 for(const cover of [false,true]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-useful-home-'));
  try{
   const result=await require('../preview/home-dinamica/build').build({articlesInput:cover?[]:articles,newsInput:[item],outputDir:dir,production:true,today:'2026-10-28'});
   assert.match(result.html,/NOTIZIA UTILE · COINSIEME/);assert.match(result.html,/Leggi la scheda COINSIEME/);assert.match(result.html,/datetime="2026-10-28"/);
   const links=[...result.html.matchAll(/<a\b[^>]*>/g)].map(m=>m[0]).filter(x=>x.includes(url));assert.ok(links.length);assert.ok(links.every(x=>!x.includes('target=')));
   assert.match(result.html,/Notizie e informazioni utili/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
 }
});
