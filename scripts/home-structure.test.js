const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');const html=fs.readFileSync('index.html','utf8');
test('Casa is the first interactive invitation and Sportello remains optional',()=>{
  const section=html.match(/<section id="oggi"[\s\S]*?<\/section>/)[0];
  assert.match(section,/<h3>Esplora la Casa che si prende cura<\/h3>/);
  assert.match(section,/<a class="btn btn-primary" href="\/casa-che-si-prende-cura\/">Entra nella Casa<\/a>/);
  assert.equal((section.match(/href="\/casa-che-si-prende-cura\/"/g)||[]).length,1);
  assert(section.indexOf('href="/casa-che-si-prende-cura/"')<section.indexOf('href="/sportello/"'));
  assert.doesNotMatch(section,/<a[^>]*class="[^"]*btn-primary[^"]*"[^>]*href="\/sportello\/"/);
  assert.match(section,/facoltativo/);
  for(const file of ['domotica.html','persone-famiglie.html']){
    const page=fs.readFileSync(file,'utf8'),main=page.split('<main id="main-content"')[1].split('</main>')[0];
    assert(main.indexOf('href="/casa-che-si-prende-cura/"')>=0,file);
    assert(main.indexOf('href="/casa-che-si-prende-cura/"')<main.indexOf('href="/sportello/"'),file);
    assert.equal((main.match(/href="\/casa-che-si-prende-cura\/"/g)||[]).length,1,file);
    assert.match(main,/facoltativo/,file);
  }
  for(const file of ['index.html','domotica.html','persone-famiglie.html'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/quartiere-che-si-prende-cura/);
});
test('identity precedes editorial, news and activities, with one editorial section',()=>{const ids=['identita','conoscenza','cosa-si-muove','oggi','progetto','visione','radici','relazione'];let last=-1;for(const id of ids){const index=html.indexOf('id="'+id+'"');assert(index>last,id);last=index;}assert(!html.includes('id="focus-news"'));assert(!html.includes('show-platform'));assert.equal((html.match(/id="home-articles"/g)||[]).length,1);});
test('CMS insertion points remain unique',()=>{for(const key of ['CMS_ULTIMI_ARTICOLI_START','CMS_ULTIMI_ARTICOLI_END','CMS_RASSEGNA_SECTION_START','CMS_RASSEGNA_SECTION_END'])assert.equal(html.split(key).length,2);});
test('live date and time banner remains unique below the header',()=>{for(const key of ['CMS_TOP_STATUS_START','CMS_TOP_STATUS_END'])assert.equal(html.split(key).length,2);assert.equal((html.match(/id="top-news-bar"/g)||[]).length,1);assert.match(html,/id="top-news-live-date"/);assert.match(html,/id="top-news-live-clock"/);assert(html.indexOf('id="top-news-bar"')>html.indexOf('</header>'));assert(html.indexOf('id="top-news-bar"')<html.indexOf('<main id="main-content"'));});
