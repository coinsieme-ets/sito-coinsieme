'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const cal=require('./editorial-calendar'),{decision}=require('./articles-editorial');
const fields={stato:'pubblica',data_pubblicazione:'2026-11-28',programmato_il:'2026-11-28T08:00:00.000Z',autorizza_social:true};
test('embargo al secondo: 08:59:59 e 09:00 italiane; stessa regola su ogni build',()=>{
 assert.equal(decision(fields,'2026-11-28',new Date('2026-11-28T07:59:59Z')).visible,false);
 assert.equal(decision(fields,'2026-11-28',new Date('2026-11-28T08:00:00Z')).visible,true);
 assert.equal(decision({...fields,stato:'bozza'},'2026-11-28',new Date('2026-11-28T09:00:00Z')).visible,false);
 assert.throws(()=>decision({...fields,programmato_il:'2026-11-29T08:00:00Z'}),/incoerenti/);
 assert.throws(()=>decision({...fields,programmato_il:'2026-11-28 09:00'}),/non valido/);
 assert.equal(decision({...fields,data_pubblicazione:'2027-07-01',programmato_il:'2027-07-01T07:00:00Z'},'2027-07-01',new Date('2027-07-01T06:59:59Z')).visible,false);
});
test('registro pubblico esclude bozze, futuro e consenso assente; identificatore stabile',()=>{
 const a={slug:'esempio',date:'2026-11-28',item:{title:'Esempio',summary:'Sintesi',image:'/assets/official_logo.png'}};
 const at=new Date('2026-11-28T08:00:00Z');
 assert.equal(cal.publicItem(a,fields,new Date('2026-11-28T07:59:59Z')),null);
 assert.equal(cal.publicItem(a,{...fields,autorizza_social:false},at),null);
 assert.equal(cal.publicItem(a,{...fields,stato:'bozza'},at),null);
 const p=cal.publicItem(a,fields,at);assert.equal(p.promotion_key,'article:esempio');
 assert.equal(p.social_image_url,'https://www.coinsieme.it/assets/editoriale/generated/esempio.jpg');
 assert(!JSON.stringify(p).includes('recordId'));assert(!('body' in p));
});
test('build produce solo pagine autorizzate, JPEG reale e calendario completo separato',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-calendar-'));
 const make=(slug)=>({name:slug+'.json',slug,hash:slug,date:'2026-11-28',item:{title:slug,summary:'Sintesi',body:'Testo',category:'Comunità',image:'/assets/official_logo.png'}});
 const articles=['visibile','riservato','non-autorizzato'].map(make),snapshot={articles:{}};
 try{
  fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.copyFileSync(path.join(__dirname,'../assets/official_logo.png'),path.join(root,'assets/official_logo.png'));
  fs.mkdirSync(path.join(root,'articoli/visibile'),{recursive:true});fs.writeFileSync(path.join(root,'articoli/visibile/index.html'),'Pagina');
  for(const a of articles)snapshot.articles[a.name]={hash:a.hash,...fields,date:a.date,visible:true};
  snapshot.articles['riservato.json'].visible=false;snapshot.articles['non-autorizzato.json'].autorizza_social=false;
  const feed=await cal.build({root,articles,snapshot,now:new Date('2026-11-28T08:00:00Z')});
  assert.deepEqual(feed.articles.map(a=>a.id),['visibile']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'scratch/registro-editoriale-riservato.json'))).articles.length,3);
  assert.equal((await require('sharp')(path.join(root,'assets/editoriale/generated/visibile.jpg')).metadata()).format,'jpeg');
  assert.equal(fs.existsSync(path.join(root,'assets/editoriale/generated/riservato.jpg')),false);
  const again=await cal.build({root,articles,snapshot,now:new Date('2026-11-28T08:00:01Z')});assert.deepEqual(again,feed);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('contenuti privati validati senza renderizzare o scrivere nel sorgente pubblico',()=>{
 const item={slug:'riservato',title:'Privato',body:'Testo privato',summary:'Sintesi'};
 const records=[{fields:{id_cms:'riservato.json',contenuto_riservato_json:JSON.stringify(item)}}];
 assert.equal(cal.privateArticles(records)[0].item.body,'Testo privato');
 assert.throws(()=>cal.privateArticles([{fields:{id_cms:'../a.json',contenuto_riservato_json:JSON.stringify(item)}}]),/non valido/);
});
