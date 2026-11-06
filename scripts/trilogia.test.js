const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {root,productionFixture}=require('./test-support/homepage-fixture');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('Trilogia: pagina autonoma, stato prudente e partenariato distinto',()=>{
 const html=read('trilogia-di-vita.html');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.match(html,/canonical" href="https:\/\/www.coinsieme.it\/trilogia-di-vita.html/);
 for(const text of ['Fondazione Make4Work ETS','Fondazione COINSIEME ETS','Cooperativa Sociale Alteya ETS','Ohana Cooperativa Sociale Onlus','Roma, Latina e Frosinone','Progetto di vita','enti promotori della rete territoriale'])assert.ok(html.includes(text),text);
 assert.match(html,/finanziamento e l’avvio non risultano confermati/);
 const section=id=>html.split('<section aria-labelledby="'+id+'">')[1].split('</section>')[0];
 assert.match(section('capofila'),/Fondazione Make4Work ETS/);
 assert.match(section('capofila'),/soggetto proponente e capofila/);
 assert.doesNotMatch(section('soggetti'),/Make4Work|<dt>.*Promotore/);
 assert.match(section('soggetti'),/Soggetti coinvolti e competenze previste/);
 assert.match(section('soggetti'),/presa in carico socioassistenziale/);
 assert.match(section('soggetti'),/psico-socio-educativi/);
 assert.match(section('promotori'),/non sono presentati qui come partner operativi/);
 assert.doesNotMatch(html,/Titolarità e partenariato/);
 assert.doesNotMatch(html,/VIVERE AUTONOMI|\d+[\s.]*euro|€|attività già avviate/);
 assert.match(html,/Illustrazione generata con IA/);
 for(const m of html.matchAll(/(?:href|src)="(\/[^"#]+)(?:#[^"]*)?"/g))assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);
});
test('Domotica: richiamo breve, senza trasferire il contenuto tecnico',()=>{
 const html=read('domotica.html'),main=html.split('<main')[1].split('</main>')[0];
 assert.match(main,/href="\/trilogia-di-vita.html"/);
 assert.doesNotMatch(main,/Alteya|Ohana|provinc[eia] di|primavera 2026/);
 assert.match(main,/href="\/casa-che-si-prende-cura\/"/);
 assert.match(main,/domotica-assistiva-coinsieme.mp4/);
});
test('Homepage: Domotica e Trilogia restano distinte dopo la rigenerazione',async()=>{
 const result=await productionFixture();try{
  const cards=[...result.html.matchAll(/<article class="project-entry"[\s\S]*?<\/article>/g)].map(m=>m[0]);
  assert.equal(cards.length,4);assert.match(cards[0],/href="\/domotica.html"/);assert.match(cards[3],/href="\/trilogia-di-vita.html"/);
  assert.match(read('index.html'),/href="\/trilogia-di-vita.html"/);
 }finally{result.cleanup();}
});
test('Trilogia: contenuti senza JS e inclusione nei due pacchetti Pages esistenti',()=>{
 const html=read('trilogia-di-vita.html');assert.doesNotMatch(html,/<script|<form|<iframe/);
 assert.match(html,/href="#main-content"/);assert.match(html,/<main id="main-content"/);
 for(const workflow of ['build-articoli.yml','sync-rassegna.yml']){const yml=read('.github/workflows/'+workflow);assert.match(yml,/cp \*\.html/);assert.match(yml,/\bcss\b/);assert.match(yml,/anteprima-sportello/);assert.match(yml,/casa-che-si-prende-cura/);}
 assert.match(read('css/trilogia.css'),/:focus-visible/);
});
