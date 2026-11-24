const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {productionFixture,temporary,cleanup,snapshot,root}=require('./test-support/homepage-fixture');
test('Progetti: richiamo sintetico in homepage e dettagli nel percorso istituzionale',async()=>{
 const result=await productionFixture();try{
  assert.equal((result.html.match(/id="progetto"/g)||[]).length,1);
  assert.equal((result.html.match(/class="project-entry"/g)||[]).length,0);
  assert.match(result.html,/href="\/cosa-facciamo.html"/);
  const hub=fs.readFileSync(path.join(root,'cosa-facciamo.html'),'utf8');
  for(const href of ['domotica.html','trilogia-di-vita.html','formazione.html','pubblicazioni.html#pub-storico-titolo'])assert.ok(hub.includes('href="'+href+'"'),href);
  assert.match(hub,/finanziamento e avvio non sono confermati/);
  assert.match(hub,/corsi non sono attivi e le iscrizioni non sono aperte/);
  assert.match(hub,/guida del 2003/);assert.match(hub,/manuale del 1998/);
 }finally{result.cleanup();}
});
test('Progetti: materiali e immagini originali non vengono eliminati',async()=>{
 const sharp=require('sharp');
 for(const name of ['domotica','turismo','formazione','trilogia'])for(const width of [400,800]){
  const file=path.join(root,'assets/home-progetti',name+'-'+width+'.webp'),metadata=await sharp(file).metadata();
  assert.equal(metadata.width,width);assert.equal(metadata.height,width*9/16);assert.ok(fs.statSync(file).size<60000);
 }
});
test('Progetti: rigenerazione mantiene struttura, privacy e selezione editoriale',async()=>{
 const first=await productionFixture(),dir=temporary('projects-repeat');try{
  const next=await require('./build-homepage').build({snapshot:snapshot(),outputDir:dir,sourceHtml:first.html,writeIndex:false});
  assert.equal(next.state.signature,first.state.signature);
  assert.deepEqual(next.report.cover,first.report.cover);assert.deepEqual(next.report.news,first.report.news);assert.deepEqual(next.report.articles,first.report.articles);
  assert.equal(require('./homepage-state').verify(next.html,next.state),true);
  assert.equal((next.html.match(/id="community-foundation-title"/g)||[]).length,1);
  assert.equal((next.html.match(/HOME_PRIVACY_START/g)||[]).length,1);
 }finally{first.cleanup();cleanup(dir);}
});
