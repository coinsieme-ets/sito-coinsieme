const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {root,temporary,cleanup,snapshot}=require('./test-support/homepage-fixture');
const {check}=require('./check-pages-sportello');
let workspace,initialProtected,initialArticles,buildLog;
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function inventory(dir,base=dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const file=path.join(dir,entry.name);
  return entry.isDirectory()?inventory(file,base):[[path.relative(base,file).replace(/\\/g,'/'),digest(file)]];
 }).sort((a,b)=>a[0].localeCompare(b[0]));
}
function protectedFiles(base){return ['casa-che-si-prende-cura','sportello','anteprima-sportello'].map(name=>[name,inventory(path.join(base,name))]);}
function child(args){
 const env={...process.env,GITHUB_ACTIONS:'true',AIRTABLE_PERSONAL_ACCESS_TOKEN:''};
 // Temporary fixtures live outside the checkout; reuse its locked dependencies.
 env.NODE_PATH=[path.join(root,'node_modules'),process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
 delete env.NODE_TEST_CONTEXT;
 try{return execFileSync(process.execPath,['-r',path.join(workspace,'scripts/test-support/offline.js'),...args],{cwd:workspace,env,encoding:'utf8',maxBuffer:12*1024*1024,stdio:['ignore','pipe','pipe']});}
 catch(error){error.message+='\n'+String(error.stdout||'');throw error;}
}
before(()=>{
 workspace=temporary('release-workspace');
 fs.cpSync(root,workspace,{recursive:true,filter:source=>{
  // Node 20 may pass extended-length Windows paths to the copy filter.
  const relative=path.relative(path.toNamespacedPath(root),path.toNamespacedPath(source)),parts=relative.split(path.sep);
  if(['.git','node_modules','scratch','_site'].includes(parts[0]))return false;
  if(parts[0]!=='preview')return true;
  return parts.length===1||(parts[1]==='home-dinamica'&&!['index.html','build-report.json','media'].includes(parts[2]));
 }});
 initialProtected=protectedFiles(workspace);
 fs.mkdirSync(path.join(workspace,'scratch'),{recursive:true});
 fs.writeFileSync(path.join(workspace,'scratch/articles-editorial.json'),JSON.stringify(snapshot()));
 buildLog=child(['scripts/build-cms.js']);
 const firstSitemap=fs.readFileSync(path.join(workspace,'sitemap.xml'),'utf8');
 initialArticles=[...firstSitemap.matchAll(/<loc>https:\/\/www.coinsieme.it(\/articoli\/[^<]+\/)<\/loc>/g)].map(match=>[match[1],digest(path.join(workspace,match[1],'index.html'))]);
 // A second real local build simulates the news update that previously lost the catalog.
 const file=path.join(workspace,'content/rassegna/notizie-esterne.json'),news=JSON.parse(fs.readFileSync(file,'utf8'));
 const today=require('./home-feature').todayRome();
 news.push({id:'fixture-rassegna',stato:'pubblicata',posizione_sito:'home_principale',mantieni_in_evidenza_fino_al:today,data_fonte:today,data_pubblicazione:today,titolo_editoriale:'Aggiornamento locale di collaudo',titolo_originale:'Aggiornamento locale di collaudo',fonte:'Fonte simulata',url_fonte:'https://example.org/collaudo',sintesi_editoriale:'Dato esclusivamente simulato nel workspace temporaneo.',categoria:'Welfare e autonomia',notizie:['rec12345678901234']});
 fs.writeFileSync(file,JSON.stringify(news));
 buildLog+=child(['scripts/build-cms.js']);
 buildLog+=child(['scripts/build-hybrid-index.js']);
 buildLog+=child(['scripts/build-legacy-redirects.js']);
 fs.writeFileSync(path.join(workspace,'scratch/publication-manifest.json'),JSON.stringify({items:[],news:[{recordId:'rec12345678901234',title:'Aggiornamento locale di collaudo',source:'https://example.org/collaudo',publicUrl:'https://www.coinsieme.it/rassegna/rec12345678901234.html'}]}));
 buildLog+=child(['scripts/check-publication-build.js']);
});
after(()=>{if(workspace)cleanup(workspace);});
test('build reale offline ripetuta: layout, rassegna, privacy, orologio e pagine protette',()=>{
 assert.ok(!fs.existsSync(path.join(workspace,'scratch/home-preview-publication.json')));
 const html=fs.readFileSync(path.join(workspace,'index.html'),'utf8');
 assert.match(buildLog,/Build CMS completata/);assert.match(html,/<h1>Vivere meglio, insieme<\/h1>/);
 assert.match(buildLog,/VERIFICHE RIGOROSE SUPERATE CON 0 ERRORI/);
 assert.match(buildLog,/Schede verificate prima del deploy/);
 assert.match(html,/Aggiornamento locale di collaudo/);assert.match(html,/id="top-news-live-clock"/);
 assert.match(html,/id="updates-title"/);assert.match(html,/id="projects-title"/);
 assert.equal((html.match(/HOME_PRIVACY_START/g)||[]).length,1);
 assert.equal((html.match(/iubenda-cs-preferences-link/g)||[]).length,1);
 assert.deepEqual(protectedFiles(workspace),initialProtected);
 assert.ok(fs.existsSync(path.join(workspace,'articoli.html')));
 assert.ok(fs.existsSync(path.join(workspace,'rassegna/rec12345678901234.html')));
 for(const [url,hash]of initialArticles)assert.equal(digest(path.join(workspace,url,'index.html')),hash,'Articolo alterato: '+url);
 assert.match(html,/id="coinsieme-organization"/);
 assert.match(fs.readFileSync(path.join(workspace,'articolo.html'),'utf8'),/data-coinsieme-article-compat/);
 const news=JSON.parse(fs.readFileSync(path.join(workspace,'content/rassegna/notizie-esterne.json'),'utf8'));
 for(const item of news){
  if(require('./news-kind').isUsefulNews(item))continue;
  const canonical=require('./rassegna-urls').canonicalUrl(item);
  for(const id of [...(item.segnalazioni||[]),...(item.notizie||[])])assert.ok(fs.readFileSync(path.join(workspace,'rassegna',id+'.html'),'utf8').includes('rel="canonical" href="'+canonical+'"'));
 }
});
test('intera suite pertinente sul sito realmente generato, non soltanto sul renderer',()=>{
 const tests=fs.readdirSync(path.join(workspace,'scripts')).filter(name=>name.endsWith('.test.js')&&name!=='pre-release.test.js').map(name=>'scripts/'+name);
 const output=child(['--test','--test-reporter=tap',...tests,'preview/home-dinamica/selection.test.js']);
 assert.match(output,/^# fail 0$/m);
 const totals=[...output.matchAll(/^# tests (\d+)$/gm)];assert.ok(totals.length);
 console.log('Suite sul sito generato: '+totals.at(-1)[1]+' test superati');
});
for(const workflow of ['build-articoli.yml','sync-rassegna.yml'])test('artefatto locale da '+workflow+': catalogo completo e Quartiere escluso',()=>{
 const text=fs.readFileSync(path.join(workspace,'.github/workflows',workflow),'utf8');
 const loops=[...text.matchAll(/for dir in ([a-z0-9 -]+); do/g)];assert.equal(loops.length,1);
 const dirs=loops[0][1].trim().split(/\s+/);assert.ok(dirs.includes('anteprima-sportello'));
 assert.match(text,/node scripts\/check-pages-sportello.js _site/);
 assert.match(text,/group: pages/);assert.match(text,/cancel-in-progress: false/);
 if(workflow==='sync-rassegna.yml'){
  assert.match(text,/cron: '\*\/15 \* \* \* \*'/);
  const steps=text.split(/\r?\n(?=      - )/);
  for(const action of ['actions/upload-pages-artifact','actions/deploy-pages']){
   const step=steps.find(block=>block.includes('uses: '+action+'@'));assert.ok(step,action);
   assert.match(step,/if: steps.prepare.outputs.count != '0'/);
  }
 }
 const site=path.join(workspace,'package-'+workflow);fs.mkdirSync(site);
 for(const name of fs.readdirSync(workspace))if(/\.html$/.test(name)||['CNAME','robots.txt','sitemap.xml'].includes(name)||name.startsWith('favicon')){
  if(fs.statSync(path.join(workspace,name)).isFile())fs.copyFileSync(path.join(workspace,name),path.join(site,name));
 }
 for(const dir of dirs)if(fs.existsSync(path.join(workspace,dir)))fs.cpSync(path.join(workspace,dir),path.join(site,dir),{recursive:true});
 check(workspace,site);
 assert.deepEqual(inventory(path.join(site,'anteprima-sportello')),inventory(path.join(workspace,'anteprima-sportello')));
 assert.deepEqual(protectedFiles(site),initialProtected);
 assert.ok(fs.existsSync(path.join(site,'assets/home-dinamica/clock.js')));
 assert.match(fs.readFileSync(path.join(site,'index.html'),'utf8'),/Aggiornamento locale di collaudo/);
 assert.ok(!fs.existsSync(path.join(site,'preview')));
 for(const [url,hash]of initialArticles)assert.equal(digest(path.join(site,url,'index.html')),hash,'Articolo mancante/alterato nel pacchetto: '+url);
 assert.match(fs.readFileSync(path.join(site,'articolo.html'),'utf8'),/noindex,follow/);
 const xml=fs.readFileSync(path.join(site,'sitemap.xml'),'utf8'),locations=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(locations).size,locations.length);
 const damaged=path.join(site,'anteprima-sportello/app/servizi.js');
 fs.appendFileSync(damaged,'\n/* damaged fixture */');
 assert.throws(()=>check(workspace,site),/alterato/);
 console.log(workflow+': '+inventory(path.join(workspace,'anteprima-sportello')).length+' file Sportello identici prima della prova negativa');
});
test('ritiro di articolo pubblicato: blocco conservato prima di ogni scrittura',()=>{
 const file=path.join(workspace,'scratch/articles-editorial.json'),original=fs.readFileSync(file,'utf8'),data=JSON.parse(original);
 const first=Object.keys(data.articles)[0];data.articles[first].stato='bozza';data.articles[first].visible=false;
 const before=digest(path.join(workspace,'index.html'));
 fs.writeFileSync(file,JSON.stringify(data));
 try{
  assert.throws(()=>child(['scripts/build-cms.js']),error=>/Ritiro articolo gia pubblicato non supportato/.test(String(error.stderr)));
  assert.equal(digest(path.join(workspace,'index.html')),before);
  assert.deepEqual(protectedFiles(workspace),initialProtected);
 }finally{fs.writeFileSync(file,original);}
});
