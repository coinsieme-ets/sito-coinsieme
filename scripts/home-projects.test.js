const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {productionFixture,temporary,cleanup,snapshot,root}=require('./test-support/homepage-fixture');
test('immagini uniformi ottimizzate, un solo link per scheda e attribuzioni visibili',async()=>{
 const result=await productionFixture();try{
  const cards=[...result.html.matchAll(/<article class="project-entry"[\s\S]*?<\/article>/g)].map(m=>m[0]);assert.equal(cards.length,4);
  for(const card of cards){assert.equal((card.match(/<a\b/g)||[]).length,1);assert.equal((card.match(/<img\b/g)||[]).length,1);assert.match(card,/<a class="project-destination"[\s\S]*?<img[\s\S]*?<h3[\s\S]*?<\/a>/);assert.match(card,/width="800" height="450" loading="lazy"/);assert.match(card,/alt="[^"]+"/);for(const match of card.matchAll(/\/assets\/home-progetti\/[a-z]+-\d+\.webp/g))assert.ok(fs.existsSync(path.join(root,match[0])));}
  assert.match(cards[3],/Illustrazione IA: non documenta attività avviate/);assert.match(result.html,/Attività di oggi, patrimonio di esperienze/);
  assert.match(cards[0],/supporto personalizzato va concordato/);assert.match(cards[0],/verificandone disponibilità e modalità/);assert.doesNotMatch(cards[0],/Consulenza per l’abitare autonomo e progettazione/);
 }finally{result.cleanup();}
});
test('risorse responsive leggere e movimento solo al passaggio del mouse',async()=>{
 const sharp=require('sharp');for(const name of ['domotica','turismo','formazione','trilogia'])for(const width of [400,800]){const file=path.join(root,'assets/home-progetti',name+'-'+width+'.webp');const metadata=await sharp(file).metadata();assert.equal(metadata.width,width);assert.equal(metadata.height,width*9/16);assert.ok(fs.statSync(file).size<60000);}
 const css=fs.readFileSync(path.join(root,'preview/home-dinamica/style.css'),'utf8');assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.project-media img\{transition:none/);
});
test('quattro ambiti equilibrati, attribuzioni e stato delle iniziative espliciti',async()=>{
 const result=await productionFixture();try{
  const section=result.html.split('<section class="projects"')[1].split('<section class="about-band"')[0];
  assert.equal((section.match(/class="project-entry"/g)||[]).length,4);
  for(const title of ['Domotica assistiva e autonomia','Turismo per tutti','Formazione e nuove competenze','Trilogia di Vita'])assert.equal(section.split('>'+title+'<').length,2);
  assert.match(section,/realizzati da CO.IN. e dai soggetti della sua rete/);
  assert.match(section,/corsi non attivi e iscrizioni non aperte/);
  assert.match(section,/Fondazione Make4Work ETS capofila e COINSIEME partner/);
  assert.match(section,/Non è un progetto finanziato o avviato/);
  assert.doesNotMatch(section,/project-photo|project-steps/);
  for(const href of ['/cosa-facciamo.html','/domotica.html','/pubblicazioni.html#pub-storico-titolo','/formazione.html']){
   assert.ok(section.includes('href="'+href+'"'));assert.ok(fs.existsSync(path.join(root,href.split('#')[0])));
  }
  const publications=fs.readFileSync(path.join(root,'pubblicazioni.html'),'utf8');assert.match(publications,/id="pub-storico-titolo"/);
 }finally{result.cleanup();}
});
test('rigenerazione ripetuta non richiede il vecchio blocco esclusivo Trilogia',async()=>{
 const first=await productionFixture(),dir=temporary('projects-repeat');try{
  const next=await require('./build-homepage').build({snapshot:snapshot(),outputDir:dir,sourceHtml:first.html,writeIndex:false});
  for(const marker of ['<section class="container opening"','<section class="updates"']){
   const section=html=>html.slice(html.indexOf(marker)).split('</section>')[0];assert.equal(section(next.html),section(first.html));
  }
  assert.equal(require('./homepage-state').verify(next.html,next.state),true);
  assert.equal((next.html.match(/id="progetto"/g)||[]).length,1);
 }finally{first.cleanup();cleanup(dir);}
});
