const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {temporary,cleanup,snapshot}=require('./test-support/homepage-fixture');
test('Revisione privata: stessi contenuti editoriali, accessi per bisogni e nessun progetto duplicato',async()=>{
 const dir=temporary('community-test');
 try{
  const articles=require('./homepage-state').snapshotArticles(snapshot());
  const news=JSON.parse(fs.readFileSync('content/rassegna/notizie-esterne.json','utf8'));
  const {html,report}=await require('../preview/home-dinamica/build').build({community:true,articlesInput:articles,newsInput:news,outputDir:dir,withoutImages:true});
  assert.match(html,/class="community-home"/);
  assert.equal((html.match(/<h1 /g)||[]).length,1);
  assert.equal((html.match(/class="community-needs"/g)||[]).length,1);
  assert.ok(html.indexOf('class="container community-tools"')>0);
  assert.ok(html.indexOf('class="container community-tools"')<html.indexOf('data-cover='));
  assert.ok(html.indexOf('community-editorial-title')<html.indexOf('id="contribute-home-title"'));
  assert.doesNotMatch(html,/class="project-entry"|top-news-live-clock|Ora italiana|Collaudo|Le date sono quelle/);
  assert.match(html,/A partire dai Municipi V e VI/);
  assert.match(html,/requisiti, costi e disponibilità/);
  assert.match(html,/mailto:segreteria@coinsieme.it/);
  assert.match(html,/href="\/cosa-facciamo.html"/);
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/Cerca nel sito COINSIEME/);
  assert.equal(report.news.length,4);
  assert.ok(fs.existsSync(dir+'/community.css'));
 }finally{cleanup(dir);}
});
test('Homepage: accessi generali aprono i filtri pertinenti, non una scheda casuale',()=>{
 const client=fs.readFileSync('js/search-target.js','utf8');
 assert.ok(client.includes("category==='mobilita'&&id==='mobilita'"));
 assert.ok(client.includes("category==='domicilio'&&id==='domicilio'"));
 for(const id of ['mobilita-tipo','mobilita-territorio','mobilita-nome'])assert.ok(client.includes("['"+id+"'"));
});
