const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prepare,confirmNews,signature}=require('./publish-rassegna');
const {renderHomeNews,selectHomeNews}=require('./home-news');
const {page}=require('./build-segnalazioni-pages');
const id='rec12345678901234';
const fields={stato:'pubblica',titolo_editoriale:'Notizia valida per autonomia',url_fonte:'https://example.org/news',fonte:'Fonte',data_fonte:'2026-09-01',posizione_sito:'home_normale'};
const record={id,fields};
async function scenario(records,{items=[],dataset=[],homeHtml='',homeChanged=false}={}){
 let saved=dataset;const manifest=await prepare(async()=>({records}),{pages:[{url:'https://www.coinsieme.it/',html:homeHtml||renderHomeNews([])}],
 prepareSegments:async()=>({items,errors:[]}),read:()=>saved,write:x=>{saved=x;}});
 return {manifest,saved};
}
test('pubblica with zero submissions triggers build/deploy; no pre-verification Airtable writes',async()=>{
 const {manifest,saved}=await scenario([record]);
 assert.equal(manifest.news.length,1);assert.ok(manifest.count>0);assert.equal(saved.length,1);
 assert.deepEqual(saved[0].notizie,[id]);
 assert.match(fs.readFileSync('.github/workflows/sync-rassegna.yml','utf8'),/node scripts\/publish-rassegna.js prepare/);
});
test('approvata alone is never imported or authorized',async()=>{
 const {manifest,saved}=await scenario([{...record,fields:{...fields,stato:'approvata'}}]);
 assert.equal(manifest.count,0);assert.equal(saved.length,0);assert.equal(manifest.news.length,0);
});
test('submission input keeps deploy active independently',async()=>{
 const {manifest}=await scenario([],{items:[{recordId:'recSubmission'}]});assert.equal(manifest.items.length,1);assert.ok(manifest.count>0);
});
test('repeated prepare does not duplicate source/pages; after confirmation unchanged run skips deploy',async()=>{
 const first=await scenario([record]);const repeated=await scenario([record],{dataset:first.saved,homeHtml:first.manifest.homeHtml});
 assert.equal(repeated.saved.length,1);assert.deepEqual(repeated.saved[0].notizie,[id]);
 const after=await scenario([{...record,fields:{...fields,stato:'pubblicata'}}],{dataset:repeated.saved,homeHtml:repeated.manifest.homeHtml});
 assert.equal(after.manifest.count,0);assert.equal(after.saved.length,1);
});
test('invalid record isolated, future publication not imported',async()=>{
 const {manifest}=await scenario([{...record,fields:{...fields,titolo_editoriale:''}},
 {id:'recFuture',fields:{...fields,data_pubblicazione:'2099-01-01'}}]);
 assert.equal(manifest.news.length,0);assert.equal(manifest.newsErrors.length,1);
});
test('Notizie confirmation requires public page then PATCH and reread; rerun never patches published',async()=>{
 let f={...fields};const events=[],item={recordId:id,source:fields.url_fonte,title:fields.titolo_editoriale,publicUrl:'https://www.coinsieme.it/rassegna/'+id+'.html',signature:signature(record)};
 const api=async(p,m='GET',body)=>{events.push(m);if(m==='PATCH')f={...f,...body.fields};return {id,fields:{...f}}};
 const result=await confirmNews(api,{news:[item]},{retries:1,fetcher:async()=>{events.push('HTTP');return {ok:true,text:async()=>page(fields,id)}}});
 assert.equal(result[0].status,'verified');assert.deepEqual(events,['GET','HTTP','GET','PATCH','GET']);
 events.length=0;await confirmNews(api,{news:[item]},{fetcher:()=>{throw Error('No retry')}});assert.deepEqual(events,['GET']);
});
test('failed/incorrect page or changed record never confirmed',async()=>{
 for(const html of ['<html>Missing</html>',page({...fields,titolo_editoriale:'Wrong'},id)]){
 let writes=0;
 const r=await confirmNews(async(p,m)=>{if(m==='PATCH')writes++;return record},{news:[{recordId:id,title:fields.titolo_editoriale,source:fields.url_fonte,publicUrl:'https://www.coinsieme.it/rassegna/'+id+'.html',signature:signature(record)}]},
 {retries:1,fetcher:async()=>({ok:true,text:async()=>html})});
 assert.equal(writes,0);assert.equal(r[0].status,'not_verified_pending');
 }
});
test('rullo: 6+ recent items, stale editorial priorities do not override recency; active/expired pins',()=>{
 const items=Array.from({length:8},(_,i)=>({...fields,id:String(i),stato:'pubblicata',url_fonte:'https://example.org/'+i,data_pubblicazione:'2026-09-'+String(i+1).padStart(2,'0')}));
 items[0]={...items[0],posizione_sito:'home_principale',priorita:'alta',ordine_editoriale:1};
 assert.deepEqual(selectHomeNews(items,'2026-09-28').map(x=>x.id),['7','6','5','4','3']);
 items[0].mantieni_in_evidenza_fino_al='2026-09-28';assert.equal(selectHomeNews(items,'2026-09-28')[0].id,'0');
 assert.equal(selectHomeNews(items,'2026-09-29')[0].id,'7');
 items[0].mantieni_in_evidenza_fino_al='2026-09-28T09:00:00Z';
 assert.equal(selectHomeNews(items,new Date('2026-09-28T10:00:00Z'))[0].id,'7');
 assert.equal(selectHomeNews(items,new Date('2026-09-28T08:00:00Z'))[0].id,'0');
});
test('rullo excludes approved/archive-only/future and deduplicates sources',()=>{
 const base={...fields,stato:'pubblicata',data_pubblicazione:'2026-09-20'};
 const output=selectHomeNews([base,{...base,id:'duplicate'},{...base,url_fonte:'https://example.org/a',stato:'approvata'},
 {...base,url_fonte:'https://example.org/b',posizione_sito:'solo_rassegna'},{...base,data_pubblicazione:'2099-01-01'}],'2026-09-28');
 assert.equal(output.length,1);
});
