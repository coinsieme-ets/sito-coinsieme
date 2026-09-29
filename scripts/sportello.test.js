
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.join(__dirname,'..');
test('private local demonstrator has no submission or tracking integrations',()=>{
 const html=fs.readFileSync(path.join(root,'sportello/index.html'),'utf8');
 const js=['app.js','orientamento.js','risorse.js','navigazione.js'].map(name=>fs.readFileSync(path.join(root,'sportello/app',name),'utf8')).join('\n');
 assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/<script[^>]+src=["'][^"']*(?:https:|gtag|analytics|iubenda)/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|innerHTML/);
 assert.match(js,/pagehide/);assert.match(js,/pageshow/);assert.match(js,/textContent/);
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/build-articoli.yml'),'utf8');
 assert.match(workflow,/sportello/);
});
test('sportello sitemap follows publication visibility',t=>{
 const {build,TARGET}=require('./build-seo');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sportello-test-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const write=(name,body)=>{let f=path.join(dir,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,body)};
 write('articoli/'+TARGET+'/index.html','<link rel="canonical" href="https://www.coinsieme.it/articoli/'+TARGET+'/">');
 const sportello='<link rel="canonical" href="https://www.coinsieme.it/sportello/">';
 write('sportello/index.html',sportello+'<meta name="robots" content="noindex,nofollow">');
 build(dir,[{slug:TARGET,visible:true}]);
 assert.doesNotMatch(fs.readFileSync(path.join(dir,'sitemap.xml'),'utf8'),/sportello/);
 write('sportello/index.html',sportello);
 build(dir,[{slug:TARGET,visible:true}]);
 assert.match(fs.readFileSync(path.join(dir,'sitemap.xml'),'utf8'),/sportello/);
});

const orientation=require('../sportello/app/orientamento');
test('orientamento: every 0–3 area combination yields 2–4 unique canonical local resources, max 2 per area',()=>{
 const {areas,resources,selectAreas,chooseResources}=orientation;
 assert.equal(areas.length,6);
 assert.ok(areas.some(a=>a.id==='relazioni-solitudine'));
 for(const [url] of Object.entries(resources)){
   if(url.startsWith('/articoli/')) {
     const slug=url.split('/')[2];
     const article=JSON.parse(fs.readFileSync(path.join(root,'content/articoli',slug+'.json'),'utf8'));
     assert.equal(article.slug,slug);
     continue;
   }
   const html=fs.readFileSync(path.join(root,url.slice(1)),'utf8');
   assert.ok(html.includes('href="https://www.coinsieme.it'+url+'"'));
   assert.doesNotMatch(html,/<meta[^>]+http-equiv=["']refresh/i);
 }
 for(let mask=0;mask<64;mask++){
   const ids=areas.filter((a,i)=>mask&(1<<i)).map(a=>a.id);
   if(ids.length>3)continue;
   const output=chooseResources(ids);
   assert.ok(output.length>=2 && output.length<=4);
   assert.equal(new Set(output.map(r=>r.url)).size,output.length);
   for(const area of selectAreas(ids)){
     const matches=output.filter(r=>r.areas.includes(area.title));
     assert.ok(matches.length>=1 && matches.length<=2);
     assert.ok(output.some(r=>r.url===area.link));
   }
 }
});
test('orientamento: deterministic order, duplicate choices, safe limit and no text inference',()=>{
 const {chooseResources,areas,selectAreas}=orientation;
 const ids=areas.map(a=>a.id);
 assert.deepEqual(selectAreas([...ids].reverse()).map(a=>a.id),ids.slice(0,3));
 assert.deepEqual(chooseResources(['casa-autonomia','casa-autonomia']),chooseResources(['casa-autonomia']));
 assert.deepEqual(chooseResources(['diagnosi inventata']),chooseResources([]));
 assert.deepEqual(chooseResources(['tecnologie-aiuto','casa-autonomia']).map(r=>r.url),
 ['/domotica.html','/articoli/una-casa-che-si-accorge-di-una-caduta-senza-guardarci/','/persone-famiglie.html','/articoli.html']);
});
test('orientamento: fallback for unavailable primary and no dead resource when both unavailable',()=>{
 const {chooseResources}=orientation;
 assert.deepEqual(chooseResources(['casa-autonomia'],url=>url!=='/domotica.html').map(r=>r.url),['/persone-famiglie.html']);
 assert.deepEqual(chooseResources(['casa-autonomia'],()=>false),[]);
});

test('both deploy packages preserve the complete sportello directory',()=>{
 for(const name of ['build-articoli.yml','sync-rassegna.yml']){
  const workflow=fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');
  assert.match(workflow,/for dir in [^\n]*\bsportello; do/);
  assert.match(workflow,/cp -R "\$dir" _site\//);
 }
});
