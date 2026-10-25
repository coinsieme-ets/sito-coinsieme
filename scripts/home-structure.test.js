const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {root,productionFixture}=require('./test-support/homepage-fixture');
let fixture,html;
before(async()=>{fixture=await productionFixture();html=fixture.html;});
after(()=>fixture?.cleanup());
test('Casa precede il catalogo e il percorso di ascolto resta facoltativo',()=>{
 const opening=html.match(/<section class="container opening"[\s\S]*?<\/section>/)[0];
 assert.match(opening,/<h2>La Casa che si prende cura<\/h2>/);
 assert.match(opening,/<a class="tool-link" href="\/casa-che-si-prende-cura\/">Entra nella Casa/);
 assert.equal((opening.match(/href="\/casa-che-si-prende-cura\/"/g)||[]).length,1);
 assert.equal((opening.match(/href="\/anteprima-sportello\/#esplora-servizi"/g)||[]).length,1);
 assert(opening.indexOf('href="/casa-che-si-prende-cura/"')<opening.indexOf('href="/anteprima-sportello/#esplora-servizi"'));
 assert.match(opening,/ascolto è facoltativo/);assert.doesNotMatch(opening,/href="\/sportello\//);
 for(const file of ['domotica.html','persone-famiglie.html']){
  const page=fs.readFileSync(path.join(root,file),'utf8'),main=page.split('<main id="main-content"')[1].split('</main>')[0];
  assert(main.indexOf('href="/casa-che-si-prende-cura/"')>=0,file);
  assert(main.indexOf('href="/casa-che-si-prende-cura/"')<main.indexOf('href="/sportello/"'),file);
  assert.equal((main.match(/href="\/casa-che-si-prende-cura\/"/g)||[]).length,1,file);
  assert.match(main,/facoltativo/,file);assert.doesNotMatch(page,/quartiere-che-si-prende-cura/);
 }
 assert.doesNotMatch(html,/quartiere-che-si-prende-cura/);
});
test('copertina, strumenti e notizie precedono Progetti e collaborazioni',()=>{
 assert.match(html,/<h1>Vivere meglio, insieme<\/h1>/);
 assert.match(html,/Informazioni, tecnologie e servizi per l’autonomia e la vita quotidiana/);
 let last=-1;
 for(const marker of ['class="cover"','class="tools"','id="updates-title"','id="projects-title"','id="progetto"']){
  const index=html.indexOf(marker);assert(index>last,marker);last=index;
 }
 assert.equal((html.match(/data-cover=/g)||[]).length,1);
 assert.equal((html.match(/class="news-list"/g)||[]).length,1);
 assert.equal((html.match(/class="articles-column"/g)||[]).length,1);
 assert.match(html,/<h3 id="progetto-titolo">Trilogia di Vita<\/h3>/);
 assert.doesNotMatch(html,/id="focus-news"|show-platform|novita-popup/);
});
test('contratto del renderer: stato pubblico unico, date reali, privacy e risorse',()=>{
 const {verify}=require('./homepage-state');
 assert.equal(verify(html,fixture.state),true);
 assert.equal((html.match(/name="coinsieme-public-state"/g)||[]).length,1);
 assert.match(html,new RegExp('datetime="'+fixture.report.cover.date+'"'));
 assert.equal((html.match(/HOME_PRIVACY_START/g)||[]).length,1);
 assert.match(html,/data-iub-purposes="4"/);assert.doesNotMatch(html,/noindex,nofollow/);
 assert.match(html,/rel="canonical" href="https:\/\/www.coinsieme.it\/"/);
 const localAssets=[...html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]).filter(x=>!x.startsWith('//')&&/\.(css|js|webp|png|jpg|svg)$/.test(x));
 for(const asset of localAssets){
  const target=asset.startsWith('/assets/home-dinamica/')?path.join(fixture.dir,asset.slice('/assets/home-dinamica/'.length)):path.join(root,asset);
  assert.ok(fs.existsSync(target),asset);
 }
});
test('banner corrente unico sotto header, separato dalle date editoriali',()=>{
 for(const key of ['CMS_TOP_STATUS_START','CMS_TOP_STATUS_END'])assert.equal(html.split(key).length,2);
 for(const id of ['top-news-bar','top-news-live-date','top-news-live-clock'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 assert(html.indexOf('id="top-news-bar"')>html.indexOf('</header>'));
 assert(html.indexOf('id="top-news-bar"')<html.indexOf('<main id="main-content"'));
 const banner=html.match(/<div id="top-news-bar"[\s\S]*?<!-- CMS_TOP_STATUS_END -->/)[0];
 assert.match(banner,/Ora italiana · Europe\/Rome/);
 assert.match(html,/src="\/assets\/home-dinamica\/clock.js"/);
 assert.doesNotMatch(banner,/<span>Fonte:/);
});
