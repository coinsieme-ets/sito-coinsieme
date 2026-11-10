'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const guard=require('./news-editorial-guard');
const bad={id:'error-fixture',stato:'pubblicata',titolo_editoriale:'Page Expired',titolo_originale:'Page Expired',fonte:'IPSOA',url_fonte:'https://example.org/news',data_fonte:'2026-11-07',data_pubblicazione:'2026-11-07',sintesi_editoriale:'Test',segnalazioni:['rec12345678901234']};
test('whole error titles, narrow matches and authentic headlines',()=>{
 for(const s of ['Page Expired','  PAGE   EXPIRED ','419 Page Expired','Pagina non trovata','Page Expired | IPSOA','Access Denied'])assert(guard.isErrorTitle(s),s);
 for(const s of ['Come risolvere Page Expired','Page Expired: cosa significa per gli utenti','Accesso ai servizi negato: le barriere da superare','Il welfare non puo restare in attesa','La pagina scaduta e il diritto all’informazione'])assert(!guard.isErrorTitle(s),s);
});
test('HTTP 200 error metadata is retained and routed to review on acquisition',async()=>{
 const original=global.fetch;
 try{
  global.fetch=async()=>({ok:true,status:200,text:async()=>'<html><title>Page Expired</title></html>'});
  const meta=await require('./process-segnalazioni-maurizio').fetchMetadataFromUrl(bad.url_fonte);
  assert.equal(meta.title,'Page Expired');assert.equal(meta.needsReview,true);
  const candidate=require('./ingest-rassegna-candidates').validateAndEnrichCandidate(bad);
  assert.equal(candidate.record.stato,'da_verificare');assert(candidate.issues.some(x=>x.includes('errore')));
 }finally{global.fetch=original;}
});
test('publication guard rejects both original and editorial error titles',()=>{
 const {publicItem}=require('./publish-segnalazioni');
 for(const fields of [bad,{...bad,titolo_editoriale:'Titolo apparentemente valido'}]){
  assert.throws(()=>publicItem({id:'rec12345678901234',fields}),/errore/);
  assert.equal(require('./sync-rassegna').validateAndNormalizeRecord(fields),null);
 }
});
test('suspension survives repeated preparation without content reconstruction or writes',async()=>{
 const {prepare}=require('./publish-rassegna');let dataset=[bad];
 const record={id:'rec12345678901234',fields:{...bad,stato:'da_verificare'}};
 const api=async(p,m='GET')=>{assert.equal(m,'GET');return {records:[record]};};
 for(let i=0;i<2;i++){
  const manifest=await prepare(api,{pages:[],read:()=>dataset,write:x=>dataset=x,prepareSegments:async()=>({items:[],errors:[]})});
  assert.equal(manifest.news.length,0);assert(!manifest.homeHtml.includes('Page Expired'));
  assert.equal(dataset[0].stato,'da_verificare');assert.equal(dataset[0].url_fonte,bad.url_fonte);
  assert.equal(dataset[0].titolo_editoriale,bad.titolo_editoriale);
 }
});
test('an approved submission cannot override a suspended Notizie record',async()=>{
 let writes=0;const {prepare}=require('./publish-segnalazioni');
 const seg={id:'rec12345678901234',fields:{stato:'da_pubblicare',url_articolo:bad.url_fonte}};
 const news={id:'rec12345678901235',fields:{...bad,stato:'da_verificare'}};
 const result=await prepare(async(p,m='GET')=>{if(m!=='GET')writes++;return {records:p.startsWith('tblStce')?[seg]:[news]};},{pages:[]});
 assert.equal(writes,0);assert.equal(result.items.length,0);assert.equal(result.errors.length,1);
});
test('new error-title publication is quarantined with an audit note',async()=>{
 const writes=[];const record={id:'rec12345678901234',fields:{...bad,stato:'pubblica',rilevanza_coinsieme:'Provenienza originale'}};
 const result=await require('./publish-rassegna').prepare(async(p,m='GET',body)=>{if(m==='PATCH'){writes.push(body);return {...record,fields:{...record.fields,...body.fields}};}return {records:[record]};},{pages:[],read:()=>[],write:()=>assert.fail('No import'),prepareSegments:async()=>({items:[],errors:[]})});
 assert.equal(result.news.length,0);assert.equal(writes.length,1);assert.equal(writes[0].fields.stato,'da_verificare');assert.match(writes[0].fields.rilevanza_coinsieme,/Provenienza originale/);
});
test('archive replaces suspended aliases with noindex notices, preserves other cards on rebuild',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'news-guard-'));
 try{
  fs.mkdirSync(path.join(root,'content/rassegna'),{recursive:true});fs.mkdirSync(path.join(root,'scratch'));
  fs.writeFileSync(path.join(root,'index.html'),'<!-- CMS_RASSEGNA_SECTION_END -->');
  const good={...bad,id:'good-fixture',titolo_originale:'Notizia autentica',titolo_editoriale:'Notizia autentica',url_fonte:'https://example.org/good',segnalazioni:['rec12345678901235']};
  fs.writeFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),JSON.stringify([bad,good]));
  fs.writeFileSync(path.join(root,'scratch/home-editorial.json'),JSON.stringify({[bad.id]:{stato:'da_verificare'}}));
  for(let i=0;i<2;i++){
   require('./build-segnalazioni-pages').build(root);
   const archive=fs.readFileSync(path.join(root,'rassegna.html'),'utf8');
   assert(!archive.includes('Page Expired'));assert(archive.includes('Notizia autentica'));
   const notice=fs.readFileSync(path.join(root,'rassegna',bad.segnalazioni[0]+'.html'),'utf8');
   assert(notice.includes('noindex,follow'));assert(!notice.includes('Page Expired'));
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('all home selection paths exclude error titles even with stale published state',()=>{
 assert.equal(require('./home-feature').selectHomeFeature([{...bad,posizione_sito:'home_principale'}],'2026-11-10'),null);
 assert.deepEqual(require('./home-news').selectHomeNews([bad],'2026-11-10'),[]);
 assert.deepEqual(require('./homepage-state').normalize([],[bad],'2026-11-10').news,[]);
});
