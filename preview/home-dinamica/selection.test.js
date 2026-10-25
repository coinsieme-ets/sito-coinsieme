const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const support=require('../../scripts/test-support/homepage-fixture');
let fixture;
before(async()=>{fixture=await support.previewFixture();});
after(()=>fixture?.cleanup());
const {selectCover,eligible,validDate}=require('./selection');
const today='2026-10-24';
const item=(id,overrides={})=>({id,title:id,url:'/articoli/'+id+'/',published:true,date:'2026-10-23',prominence:'normale',order:999,image:'/assets/test.jpg',...overrides});
test('build completo senza immagini editoriali mantiene copertina testuale',async()=>{
 const dir=support.temporary('home-no-images');
 try{
  const articlesInput=require('../../scripts/homepage-state').snapshotArticles(support.snapshot());
  await require('./build').build({withoutImages:true,outputDir:dir,articlesInput,newsInput:[]});
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert.match(html,/data-cover=/);assert.match(html,/<time datetime=/);
  assert.doesNotMatch(html,/src="media\//);
 }finally{support.cleanup(dir);}
});
test('priorita senza immagini e durata configurabile senza date inventate',()=>{
 const {tier}=require('./selection');
 const chosen=item('scelto',{kind:'article',image:'',prominence:'principale',order:1});
 assert.equal(selectCover([item('illustrato'),chosen],today).id,'scelto');
 const old={...chosen,date:'2026-01-01'};
 assert.equal(tier(old,today),3);
 assert.equal(tier(old,today,{unboundedDays:30,permanentIds:['article:scelto']}),1);
 assert.equal(selectCover([chosen],today).date,'2026-10-23');
});
test('copertina: scelta editoriale prevale sulla sola recenza',()=>{
 assert.equal(selectCover([item('nuovo'),item('scelto',{date:'2026-10-01',prominence:'principale',order:1})],today).id,'scelto');
});
test('copertina: ordine editoriale e spareggio cronologico deterministico',()=>{
 assert.equal(selectCover([item('b',{prominence:'principale',order:2}),item('a',{prominence:'principale',order:1,date:'2026-10-21'})],today).id,'a');
 assert.equal(selectCover([item('b',{prominence:'principale',order:1,date:'2026-10-21'}),item('a',{prominence:'principale',order:1})],today).id,'a');
});
test('copertina: pin inclusivo, scadenza e data invalida',()=>{
 assert.equal(selectCover([item('pin',{date:'2026-09-01',until:today}),item('nuovo')],today).id,'pin');
 assert.equal(selectCover([item('scaduto',{date:'2026-09-01',until:'2026-10-23',prominence:'principale'}),item('nuovo')],today).id,'nuovo');
 assert.equal(selectCover([item('invalido',{date:'2026-09-01',until:'errore'}),item('nuovo')],today).id,'nuovo');
});
test('copertina: nessuna data inventata, bozza o contenuto futuro',()=>{
 assert.equal(eligible([item('bozza',{published:false}),item('futuro',{date:'2026-10-25'}),item('senza',{date:''}),item('archivio',{prominence:'solo_archivio'})],today).length,0);
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2026-02-28'),true);
});
test('copertina: recente senza etichetta quotidiana, archivio esplicito, nessuna immagine estranea',()=>{
 assert.equal(selectCover([item('recente')],today).reason,'Da leggere');
 assert.equal(selectCover([item('vecchio',{date:'2025-01-01'})],today).reason,'Dal nostro archivio');
 assert.equal(selectCover([item('senza-immagine',{image:''})],today).id,'senza-immagine');
});
test('copertina: niente duplicazioni e nessuna mutazione dei dati editoriali',()=>{
 const list=[item('a'),item('a')],before=JSON.stringify(list);assert.equal(eligible(list,today).length,1);selectCover(list,today);assert.equal(JSON.stringify(list),before);
});
test('anteprima: strumenti disponibili, date effettive e progetto subordinato',()=>{
 const {html,report}=fixture;
 assert.match(html,/href="\/casa-che-si-prende-cura\/"/);assert.match(html,/href="\/anteprima-sportello\/#esplora-servizi"/);
 assert.match(html,/noindex,nofollow/);assert.match(html,new RegExp('datetime="'+report.cover.date+'"'));
 assert.ok(html.indexOf('id="updates-title"')<html.indexOf('id="projects-title"'));
 assert.match(html,/<h3 id="progetto-titolo">Trilogia di Vita<\/h3>/);
 assert.doesNotMatch(html,/quartiere-che-si-prende-cura|setInterval|novita-popup|Aggiornato in tempo reale|gtag/);
 assert.equal((html.match(/data-cover=/g)||[]).length,1);
});
test('anteprima: risorse locali, immagini e ancoraggi risolvibili',()=>{
 const {html}=fixture,root=path.resolve(__dirname,'../..');
 for(const m of html.matchAll(/(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g)){
  if(m[1].startsWith('#')){if(m[1]!=='#')assert.match(html,new RegExp('id="'+m[1].slice(1)+'"'));continue;}
  if(/^(?:https?:|mailto:|tel:)/.test(m[1]))continue;
  const clean=m[1].split('#')[0];
  const target=path.resolve(clean.startsWith('/')?root:fixture.dir,'.'+(clean.startsWith('/')?clean:'/'+clean));
  assert.ok(fs.existsSync(target),m[1]);
 }
});
