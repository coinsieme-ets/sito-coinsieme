const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const state=require('./homepage-state');
const today='2026-10-25';
const article=(slug,fields={})=>({slug,title:slug,date:'2026-10-24',visible:true,stato:'pubblica',rilevanza_home:'normale',...fields});
test('stato pubblico: nuovo articolo, bozza e priorita modificano solo lo stato pertinente',()=>{
 const original=[article('uno')],before=state.publicState(original,[],today).signature;
 assert.notEqual(state.publicState([...original,article('due')],[],today).signature,before);
 assert.notEqual(state.publicState([article('uno',{visible:false,stato:'bozza'})],[],today).signature,before);
 assert.notEqual(state.publicState([article('uno',{rilevanza_home:'principale'})],[],today).signature,before);
 assert.equal(state.publicState([...original,article('bozza',{visible:false,stato:'bozza'})],[],today).signature,before);
});
test('controllo invariato e riordinamento tecnico non richiedono deploy',()=>{
 const a=[article('uno'),article('due')];
 assert.equal(state.publicState(a,[],today).signature,state.publicState([...a].reverse(),[],today).signature);
 assert.equal(state.publicState(a,[],today).signature,state.publicState(a,[],'2026-10-26').signature);
});

test('metadati di ordinamento o durata senza effetti visibili non richiedono deploy',()=>{
 const selected=article('uno',{rilevanza_home:'principale',ordine_home:1,mantieni_in_evidenza_fino_al:'2026-10-30'});
 const before=state.publicState([selected],[],today).signature;
 assert.equal(state.publicState([{...selected,ordine_home:2}],[],today).signature,before);
 assert.equal(state.publicState([{...selected,mantieni_in_evidenza_fino_al:'2026-11-01'}],[],today).signature,before);
 const many=[selected,...['a','b','c','d'].map((slug,i)=>article(slug,{date:'2026-10-'+String(20-i).padStart(2,'0')}))];
 const changed=many.map(x=>x.slug==='d'?{...x,home_summary:'Testo non mostrato in homepage'}:x);
 assert.equal(state.publicState(many,[],today).signature,state.publicState(changed,[],today).signature);
 assert.notEqual(state.publicState(many,[],today).signature,state.publicState(many.map(x=>x.slug==='d'?{...x,body:'Testo articolo modificato'}:x),[],today).signature);
 const unrelatedPin=article('non-selezionato',{date:'2026-10-20',mantieni_in_evidenza_fino_al:today});
 assert.equal(state.publicState([selected,unrelatedPin],[],today).signature,state.publicState([selected,unrelatedPin],[],'2026-10-26').signature);
});
test('scadenza esplicita e limite 30 giorni cambiano la selezione senza cambiare date',()=>{
 const a=[article('pin',{date:'2026-10-01',mantieni_in_evidenza_fino_al:today}),article('nuovo')];
 const before=state.publicState(a,[],today),after=state.publicState(a,[],'2026-10-26');
 assert.equal(before.selection.cover.id,'pin');assert.equal(after.selection.cover.id,'nuovo');
 assert.notEqual(before.signature,after.signature);assert.equal(before.selection.cover.date,'2026-10-01');
 const old=[article('editoriale',{date:'2026-09-25',rilevanza_home:'principale'}),article('nuovo')];
 assert.notEqual(state.publicState(old,[],today).signature,state.publicState(old,[],'2026-10-26').signature);
});
test('rassegna: nuova notizia cambia stato, conferma pubblicata non lo cambia',()=>{
 const n={id:'news',stato:'pubblica',data_fonte:'2026-10-24',data_pubblicazione:'2026-10-24',titolo_editoriale:'Notizia',url_fonte:'https://example.org/notizia',fonte:'Fonte',posizione_sito:'home_normale'};
 assert.notEqual(state.publicState([],[],today).signature,state.publicState([],[n],today).signature);
 assert.equal(state.publicState([],[n],today).signature,state.publicState([],[{...n,stato:'pubblicata'}],today).signature);
});
test('lettura Airtable usa solo GET; duplicati bloccano e nuovi record restano bozza',async()=>{
 const inventory=[{name:'uno.json',slug:'uno',item:article('uno')}];
 let calls=0;
 const api=async(endpoint,method)=>{calls++;assert.equal(method,undefined);assert.match(endpoint,/pageSize=100/);return {records:[{fields:{id_cms:'uno.json',stato:'pubblica',data_pubblicazione:'2026-10-24'}}]};};
 const rows=await state.readArticles(api,inventory,today);assert.equal(rows[0].visible,true);assert.equal(calls,1);
 const draft=await state.readArticles(async()=>({records:[]}),inventory,today);assert.equal(draft[0].visible,false);
 await assert.rejects(state.readArticles(async()=>({records:[{fields:{id_cms:'uno.json'}},{fields:{id_cms:'uno.json'}}]}),inventory,today),/duplicato/);
});
test('orologio italiano: mezzanotte, ora legale e solare senza dipendere dal fuso del dispositivo',()=>{
 const {format}=require('../preview/home-dinamica/clock');
 assert.equal(format(new Date('2026-07-01T22:30:00Z')).clock,'00:30');
 assert.match(format(new Date('2026-07-01T22:30:00Z')).date,/2 luglio 2026/);
 assert.equal(format(new Date('2026-10-25T00:30:00Z')).clock,'02:30');
 assert.equal(format(new Date('2026-10-25T01:30:00Z')).clock,'02:30');
 assert.equal(format(new Date('2026-12-01T12:00:00Z')).clock,'13:00');
});
test('renderer produzione isolato: snapshot, privacy, dipendenze, copertina e ripetibilita',async()=>{
 const editorial=require('./articles-editorial'),snapshot={generatedAt:new Date().toISOString(),articles:{}};
 for(const a of editorial.inventory())snapshot.articles[a.name]={hash:a.hash,...editorial.decision(editorial.initialFields(a,true))};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-home-build-'));
 const root=path.resolve(__dirname,'..'),before=fs.readFileSync(path.join(root,'index.html'),'utf8');
 try{
  const result=await require('./build-homepage').build({snapshot,news:[],outputDir:dir,writeIndex:false});
  assert.match(result.html,/<h1>Vivere meglio, insieme<\/h1>/);
  assert.match(result.html,/HOME_PRIVACY_START/);assert.match(result.html,/data-iub-purposes="4"/);
  assert.match(result.html,/id="top-news-live-clock"/);assert.doesNotMatch(result.html,/noindex,nofollow/);
  assert.match(result.html,/src="\/assets\/home-dinamica\/clock.js"/);
  assert.equal(state.verify(result.html,result.state),true);
  assert.equal(state.verify(result.html.replace(result.state.signature,'0'.repeat(64)),result.state),false);
  for(const file of ['clock.js','navigation.js','style.css'])assert.ok(fs.existsSync(path.join(dir,file)));
  const second=await require('./build-homepage').build({snapshot,news:[],outputDir:dir,sourceHtml:result.html,writeIndex:false});
  assert.equal(second.state.signature,result.state.signature);
  assert.equal((second.html.match(/HOME_PRIVACY_START/g)||[]).length,1);
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
