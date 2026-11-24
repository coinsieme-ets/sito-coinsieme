const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {root,productionFixture}=require('./test-support/homepage-fixture');
let fixture,html;
before(async()=>{fixture=await productionFixture();html=fixture.html;});
after(()=>fixture?.cleanup());
test('Homepage: quattro bisogni e strumenti prima dei contenuti editoriali',()=>{
 assert.match(html,/<h1\b[^>]*>Vivere meglio, insieme<\/h1>/);
 assert.match(html,/A partire dai Municipi V e VI/);
 assert.match(html,/Informazioni e risorse per vivere con maggiore autonomia a Roma Est/);
 let previous=-1;
 for(const marker of ['class="community-needs"','class="container community-tools"','class="container community-search"','id="community-editorial-title"','id="contribute-home-title"','id="community-contact-title"','id="community-foundation-title"']){
  const index=html.indexOf(marker);assert.ok(index>previous,marker);previous=index;
 }
 assert.equal((html.match(/data-cover=/g)||[]).length,1);
 assert.equal((html.match(/class="news-list"/g)||[]).length,1);
 assert.equal((html.match(/class="articles-column"/g)||[]).length,1);
 assert.doesNotMatch(html,/class="project-entry"|novita-popup|show-platform/);
});
test('Homepage: orientamento libero, limiti chiari e nessun servizio umano presunto',()=>{
 assert.match(html,/Puoi consultare il catalogo senza raccontare la tua situazione/);
 assert.match(html,/requisiti, costi e disponibilità/);
 assert.match(html,/non gestisce le prenotazioni/);
 assert.match(html,/mailto:segreteria@coinsieme.it/);
 assert.doesNotMatch(html,/Sportello COINSIEME · Collaudo|Catalogo in verifica|href="\/sportello\//);
 for(const file of ['domotica.html','persone-famiglie.html']){
  const page=fs.readFileSync(path.join(root,file),'utf8'),main=page.split('<main id="main-content"')[1].split('</main>')[0];
  assert.ok(main.indexOf('href="/casa-che-si-prende-cura/"')<main.indexOf('href="/sportello/"'));
  assert.match(main,/facoltativo/);
 }
});
test('Homepage: stato editoriale, canonical, privacy e dipendenze restano verificati',()=>{
 assert.equal(require('./homepage-state').verify(html,fixture.state),true);
 assert.equal((html.match(/name="coinsieme-public-state"/g)||[]).length,1);
 assert.equal((html.match(/HOME_PRIVACY_START/g)||[]).length,1);
 assert.match(html,/data-iub-purposes="4"/);
 assert.match(html,/rel="canonical" href="https:\/\/www.coinsieme.it\/"/);
 assert.doesNotMatch(html,/noindex,nofollow/);
 for(const m of html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^" ]*)?"/g)){
  const asset=m[1];if(asset.startsWith('//')||!/\.(css|js|webp|png|jpg|svg)$/.test(asset))continue;
  const target=asset.startsWith('/assets/home-dinamica/')?path.join(fixture.dir,asset.slice('/assets/home-dinamica/'.length)):path.join(root,asset);
  assert.ok(fs.existsSync(target),asset);
 }
});
test('Homepage: nessun orologio tecnico, ma date editoriali e ricerca preservate',()=>{
 assert.doesNotMatch(html,/CMS_TOP_STATUS_START|top-news-live-clock|Ora italiana|src="[^"]*clock.js"/);
 assert.match(html,/datetime="\d{4}-\d{2}-\d{2}"/);
 assert.match(html,/src="\/assets\/home-dinamica\/search-index.js"/);
 assert.match(html,/href="\/assets\/home-dinamica\/community.css\?v=[a-f0-9]+"/);
});
