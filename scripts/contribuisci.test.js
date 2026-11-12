const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const {root,productionFixture,temporary,cleanup}=require('./test-support/homepage-fixture');
const page=fs.readFileSync(path.join(root,'contribuisci.html'),'utf8');
test('Partecipa: invito non economico e URL esistente conservato',()=>{
 assert.match(page,/<title>Partecipa a COINSIEME/);
 assert.match(page,/<h1 id="contribute-title">Partecipa a COINSIEME<\/h1>/);
 assert.match(page,/aria-label="Tre modi per partecipare"/);
 assert.doesNotMatch(page,/Contribuisci a COINSIEME|Scopri come contribuire/);
 const source=fs.readFileSync(path.join(root,'preview/home-dinamica/build.js'),'utf8');
 assert.match(source,/Partecipa a COINSIEME/);assert.match(source,/Scopri come partecipare/);
 assert.match(source,/Condividi un parere sul sito, segnala un servizio utile o proponi un articolo/);
 assert.match(source,/href="\/contribuisci.html"/);
});
test('Contribuisci: tre email esplicite al contatto istituzionale senza invio simulato',()=>{
 const links=[...page.matchAll(/href="(mailto:[^"]+)"/g)].map(m=>new URL(m[1]));assert.equal(links.length,3);
 assert.deepEqual(links.map(u=>u.searchParams.get('subject')),['Parere sul sito COINSIEME','Segnalazione di servizio o soluzione','Proposta di articolo per COINSIEME']);
 for(const u of links){assert.equal(u.pathname,'segreteria@coinsieme.it');assert.equal([...u.searchParams].length,1);assert.equal(u.searchParams.has('body'),false);}
 assert.match(fs.readFileSync(path.join(root,'contatti.html'),'utf8'),/mailto:segreteria@coinsieme\.it/);
 assert.match(page,/non può confermarne l’invio o la ricezione/);assert.doesNotMatch(page,/<(?:form|input|textarea|script|iframe)\b|on(?:click|submit)=|localStorage|sessionStorage|fetch\(/i);
});
test('Contribuisci: privacy, revisione editoriale e metadati coerenti',()=>{
 assert.equal((page.match(/<h1\b/g)||[]).length,1);assert.equal((page.match(/class="contribute-card"/g)||[]).length,3);
 assert.match(page,/rel="canonical" href="https:\/\/www.coinsieme.it\/contribuisci.html"/);assert.match(page,/name="description"/);
 for(const text of ['Non inviare dati sanitari','non ne garantisce la pubblicazione','non implica una partnership','non comporta adesione automatica','form-action \'none\'','connect-src \'none\''])assert.ok(page.includes(text),text);
 assert.match(page,/https:\/\/www.iubenda.com\/privacy-policy\/40825462/);assert.match(page,/href="#main-content"/);
 for(const text of ['id="privacy-contributi"','art. 6, par. 1, lett. f, GDPR','legittimo interesse della Fondazione','12 mesi dalla ricezione','quando non più necessarie','opporti al trattamento','Register.it','reclamo al Garante','finalità promozionali'])assert.ok(page.includes(text),text);
 assert.ok(page.indexOf('id="privacy-contributi"')<page.indexOf('class="contribute-options"'));
 const css=fs.readFileSync(path.join(root,'css/contribuisci.css'),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/min-height:48px/);
});
test('Contribuisci: rigenerazioni homepage mantengono un solo richiamo dopo Casa e Sportello',async()=>{
 const first=await productionFixture(),dir=temporary('contribute-repeat');try{
  const {snapshot}=require('./test-support/homepage-fixture');const next=await require('./build-homepage').build({snapshot:snapshot(),outputDir:dir,sourceHtml:first.html,writeIndex:false});
  for(const html of [first.html,next.html]){assert.equal((html.match(/id="contribute-home-title"/g)||[]).length,1);assert.ok(html.indexOf('class="container opening"')<html.indexOf('class="contribute-callout"'));assert.ok(html.indexOf('class="contribute-callout"')<html.indexOf('class="updates"'));assert.match(html,/href="\/contribuisci.html"/);assert.equal(require('./homepage-state').verify(html,next.state),true);}
 }finally{first.cleanup();cleanup(dir);}
});
test('Contribuisci: contenuti preesistenti identici e pacchetti Pages compatibili',async()=>{
 const now=await productionFixture(),dir=temporary('contribute-baseline');try{
  const filename=path.join(root,'preview/home-dinamica/build.js'),old=new Module(filename,module);old.filename=filename;old.paths=module.paths;
  const withoutCallout=fs.readFileSync(filename,'utf8').replace(/^  <section class="contribute-callout"[^\n]*<\/section>\r?\n/m,'');
  assert.doesNotMatch(withoutCallout,/class="contribute-callout"/);old._compile(withoutCallout,filename);
  const {snapshot}=require('./test-support/homepage-fixture');const articles=require('./homepage-state').snapshotArticles(snapshot()),news=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8'));
  const before=await old.exports.build({articlesInput:articles,newsInput:news,outputDir:dir,production:true,state:now.state});
  for(const marker of ['<section class="container opening"','<section class="updates"','<section class="projects"','<section class="about-band"']){
   const section=html=>html.slice(html.indexOf(marker)).split('</section>')[0];assert.equal(section(now.html),section(before.html),marker);
  }
  for(const file of ['build-articoli.yml','sync-rassegna.yml']){const yaml=fs.readFileSync(path.join(root,'.github/workflows',file),'utf8');assert.match(yaml,/cp \*\.html(?: CNAME)? _site/);assert.match(yaml,/for dir .* css /);}
 }finally{now.cleanup();cleanup(dir);}
});
