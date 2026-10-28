const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {canonicalUrl,recordUrl}=require('./rassegna-urls'),{page}=require('./build-segnalazioni-pages'),{verifyPage}=require('./publish-segnalazioni');
const {root,temporary,cleanup,productionFixture}=require('./test-support/homepage-fixture');
const seg='rec12345678901234',news='rec23456789012345';
const item={titolo_editoriale:'Titolo approvato',url_fonte:'https://example.org/fonte',fonte:'Fonte',sintesi_editoriale:'Sintesi invariata',data_fonte:'2026-10-26',data_pubblicazione:'2026-10-28',segnalazioni:[seg],notizie:[news]};
test('canonical unico e URL storici distinti: nessuna cancellazione di contenuto',()=>{
 assert.equal(canonicalUrl(item),recordUrl(seg));assert.equal(canonicalUrl({...item,segnalazioni:[]}),recordUrl(news));
 for(const id of [seg,news]){
  const html=page(item,id),expected={recordId:id,title:item.titolo_editoriale,source:item.url_fonte,publicUrl:recordUrl(id),canonicalUrl:recordUrl(seg)};
  assert.equal(verifyPage(html,expected),true);assert.ok(html.includes('data-segnalazione="'+id+'"'));assert.match(html,/Sintesi invariata/);assert.match(html,/datetime="2026-10-26"/);assert.doesNotMatch(html,/noindex|http-equiv="refresh"/);
  assert.equal(verifyPage(html.replace('<article ','<article hidden '),expected),false);
  assert.equal(verifyPage(html,{...expected,canonicalUrl:'https://example.org/altro'}),false);
  assert.equal(verifyPage(html.replace(recordUrl(seg),recordUrl(news)),expected),false);
 }
});
test('coppie del catalogo: canonical corrisponde al collegamento già usato in archivio',()=>{
 const items=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8'));
 const pairs=items.filter(x=>new Set([...(x.segnalazioni||[]),...(x.notizie||[])]).size>1);
 assert.ok(pairs.length>0);
 for(const x of pairs)assert.equal(canonicalUrl(x),recordUrl(x.segnalazioni?.[0]||x.notizie[0]));
});
test('preparazione e conferma simulate conservano URL del record, canonical e controlli editoriali',async()=>{
 const {prepare,confirmNews}=require('./publish-rassegna');
 let fields={...item,stato:'pubblica'},saved=[item];
 const manifest=await prepare(async(p,method)=>{assert.ok(!method);return {records:[{id:news,fields}]};},{pages:[{url:'https://www.coinsieme.it/',html:require('./home-news').renderHomeNews([])}],prepareSegments:async()=>({items:[],errors:[]}),read:()=>saved,write:x=>{saved=x;}});
 assert.equal(saved.length,1);assert.deepEqual(saved[0].segnalazioni,[seg]);assert.deepEqual(saved[0].notizie,[news]);
 const pending=manifest.news[0];assert.equal(pending.publicUrl,recordUrl(news));assert.equal(pending.canonicalUrl,recordUrl(seg));
 let writes=0;
 const api=async(p,method='GET',body)=>{if(method==='PATCH'){writes++;fields={...fields,...body.fields};}return {id:news,fields:{...fields}};};
 const fetcher=async url=>{assert.equal(url,recordUrl(news));return {ok:true,text:async()=>page(saved[0],news)};};
 const result=await confirmNews(api,manifest,{retries:1,fetcher});assert.equal(result[0].status,'verified');assert.equal(writes,1);
 await confirmNews(api,manifest,{retries:1,fetcher:()=>{throw Error('Nessun reinvio');}});assert.equal(writes,1);
});
test('articolo.html generato diventa compatibilità; sorgente storico e contenuti reali protetti',()=>{
 const dir=temporary('seo-compat');try{
  const file=path.join(dir,'articolo.html'),{buildArticleCompatibility}=require('./build-seo');
  fs.writeFileSync(file,fs.readFileSync(path.join(root,'articolo.html')));buildArticleCompatibility(dir);
  const html=fs.readFileSync(file,'utf8');assert.match(html,/noindex,follow/);assert.match(html,/0;url=\/articoli.html/);assert.match(html,/href="\/articoli.html"/);assert.doesNotMatch(html,/CONTENUTO PROVVISORIO|ld\+json|Autore da definire/);
  buildArticleCompatibility(dir);assert.equal(fs.readFileSync(file,'utf8'),html);
  fs.writeFileSync(file,'<h1>Contenuto reale non provvisorio</h1>');assert.throws(()=>buildArticleCompatibility(dir),/refusing to overwrite/);assert.match(fs.readFileSync(file,'utf8'),/Contenuto reale/);
 }finally{cleanup(dir);}
});
test('Organization usa soltanto dati istituzionali documentati e non altera il corpo homepage',async()=>{
 const result=await productionFixture();try{
  const matches=[...result.html.matchAll(/<script type="application\/ld\+json" id="coinsieme-organization">([\s\S]*?)<\/script>/g)];assert.equal(matches.length,1);
  const org=JSON.parse(matches[0][1]),source=JSON.parse(fs.readFileSync(path.join(root,'content/organization.json'),'utf8'));
  assert.deepEqual(org,source.organization);assert.equal(org['@type'],'Organization');assert.equal(org.address.streetAddress,'Via Enrico Giglioli 54A');assert.equal(org.email,'segreteria@coinsieme.it');assert.equal(org.logo,'https://www.coinsieme.it/assets/logo-symbol.png');assert.ok(!('telephone' in org));assert.ok(!('sameAs' in org));assert.ok(!('sources' in org));
  const contacts=fs.readFileSync(path.join(root,'contatti.html'),'utf8');for(const value of [org.address.streetAddress,org.address.postalCode,org.email])assert.ok(contacts.includes(value));
  assert.equal((result.html.match(/class="project-entry"/g)||[]).length,4);assert.match(result.html,/candidata e ancora in valutazione/);
 }finally{result.cleanup();}
});
