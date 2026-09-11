const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {selectPending,confirm,prepare,publicUrl,verifyPage}=require('./publish-segnalazioni');
const {page}=require('./build-segnalazioni-pages');
const ID='rec12345678901234';
const news={titolo_editoriale:'Titolo verificato',url_fonte:'https://example.org/source',fonte:'Fonte',
  sintesi_editoriale:'Sintesi editoriale.',data_fonte:'2026-09-01',data_pubblicazione:'2026-09-11'};
const expected={recordId:ID,title:news.titolo_editoriale,source:news.url_fonte,publicUrl:publicUrl(ID)};
test('only exact da_pubblicare is selected; published, empty and old states excluded',()=>{
 const states=['da_pubblicare','pubblicato','','inserito','scartato','da_valutare'];
 assert.deepEqual(selectPending(states.map((stato,i)=>({id:String(i),fields:{stato}}))).map(r=>r.id),['0']);
});
test('published records are never fetched from the site or patched on rerun',async()=>{
 const writes=[];
 const result=await confirm(async(p,m)=>{if(m)writes.push(m);return {fields:{stato:'pubblicato',url_articolo:news.url_fonte,url_pubblicato:'unchanged'}};},
   {items:[expected]},{fetcher:()=>{throw new Error('Must not check published record');},retries:1});
 assert.deepEqual(writes,[]);assert.equal(result[0].status,'skipped_changed_or_published');
});
test('HTTP 200 with missing/wrong/hidden card never changes pending',async()=>{
 for(const html of ['<html>Error page</html>',page({...news,titolo_editoriale:'Wrong'},ID),
   page(news,ID).replace('<article ','<article style="display:none" ')]){
  const writes=[];
  const result=await confirm(async(p,m,b)=>{if(m)writes.push(b);return {fields:{stato:'da_pubblicare',url_articolo:news.url_fonte}};},
    {items:[expected]},{fetcher:async()=>({ok:true,text:async()=>html}),retries:1});
  assert.equal(writes.length,0);assert.equal(result[0].status,'not_verified_pending');
 }
});
test('network failure leaves pending',async()=>{
 let writes=0;
 await confirm(async(p,m)=>{if(m)writes++;return {fields:{stato:'da_pubblicare',url_articolo:news.url_fonte}};},
   {items:[expected]},{fetcher:async()=>{throw new Error('offline');},retries:1});
 assert.equal(writes,0);
});
test('positive site verification precedes PATCH and final API reread',async()=>{
 const events=[];let fields={stato:'da_pubblicare',url_articolo:news.url_fonte};
 const result=await confirm(async(p,m='GET',body)=>{
   events.push(m);if(m==='PATCH')fields={...fields,...body.fields};return {fields:{...fields}};
 },{items:[expected]},{fetcher:async()=>{events.push('PUBLIC_HTTP_200');return {ok:true,text:async()=>page(news,ID)};},retries:1});
 assert.deepEqual(events,['GET','PUBLIC_HTTP_200','GET','PATCH','GET']);
 assert.equal(result[0].status,'verified');
 assert.equal(fields.stato,'pubblicato');assert.equal(fields.url_pubblicato,expected.publicUrl);
 assert.match(fields.data_pubblicazione,/^\d{4}-\d{2}-\d{2}$/);
});
test('a source changed during deployment is not confirmed',async()=>{
 let gets=0,writes=0;
 await confirm(async(p,m)=>{if(m)writes++;return {fields:{stato:'da_pubblicare',url_articolo:++gets===1?news.url_fonte:'https://example.org/changed'}};},
   {items:[expected]},{fetcher:async()=>({ok:true,text:async()=>page(news,ID)}),retries:1});
 assert.equal(writes,0);
});
test('every record has a stable standalone page, independent of homepage limit',()=>{
 for(let i=0;i<20;i++){
  const id='rec'+String(i).padStart(14,'0');
  assert.ok(verifyPage(page(news,id),{...expected,recordId:id,publicUrl:publicUrl(id)}));
 }
});
test('RSS cannot auto-approve even if input asks for pubblica',()=>{
 const {validateAndEnrichCandidate}=require('./ingest-rassegna-candidates');
 const result=validateAndEnrichCandidate({...news,stato:'pubblica',rilevanza_coinsieme:'Interesse sociale.'});
 assert.equal(result.record.stato,'da_valutare');
});
test('prepare excludes unrelated RSS and makes no submission writes',async()=>{
 const originalRead=fs.readFileSync,originalWrite=fs.writeFileSync;
 let saved=[],writes=[];
 try{
  fs.readFileSync=(file,...args)=>file==='content/rassegna/notizie-esterne.json'?'[]':originalRead(file,...args);
  fs.writeFileSync=(file,text)=>{if(file==='content/rassegna/notizie-esterne.json')saved=JSON.parse(text);else throw new Error('Unexpected output');};
  const manifest=await prepare(async(p,m,b)=>{
    if(m){writes.push({p,m,b});throw new Error('Unexpected write');}
    if(p.startsWith('tblStce'))return {records:[{id:ID,fields:{stato:'da_pubblicare',url_articolo:news.url_fonte}},
      {id:'recAlreadyPublished',fields:{stato:'pubblicato',url_articolo:'https://example.org/old'}}]};
    return {records:[{id:'recNews',fields:{...news,stato:'pubblicata'}},
      {id:'recRss',fields:{...news,url_fonte:'https://example.org/rss',stato:'da_valutare'}}]};
  },{pages:[],processRecord:()=>{throw new Error('No duplicate creation');}});
  assert.equal(manifest.items.length,1);assert.equal(saved.length,1);
  assert.equal(saved[0].url_fonte,news.url_fonte);assert.deepEqual(writes,[]);
 }finally{fs.readFileSync=originalRead;fs.writeFileSync=originalWrite;}
});
