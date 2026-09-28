'use strict';
// Independent publication inputs; publication confirmation always follows public verification.
const fs=require('node:fs'), crypto=require('node:crypto');
const seg=require('./publish-segnalazioni');
const {sourceUrl,fetchPublicPages}=require('./verify-publication');
const {selectHomeNews,renderHomeNews}=require('./home-news');
const NEWS='tblonsfQ2mnaelCAn', DATA='content/rassegna/notizie-esterne.json';
async function all(api){const records=[];let offset;do{const r=await api(NEWS+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));records.push(...r.records);offset=r.offset;}while(offset);return records;}
const signature=n=>crypto.createHash('sha256').update(JSON.stringify(seg.publicItem(n))).digest('hex');
const section=html=>(html.match(/<section id="cosa-si-muove"[\s\S]*?<\/section>/)||[])[0]||'';
async function prepare(api,{recordId,pages,prepareSegments=seg.prepare,read=()=>JSON.parse(fs.readFileSync(DATA,'utf8')),write=items=>fs.writeFileSync(DATA,JSON.stringify(items,null,2)+'\n')}={}){
 pages=pages||await fetchPublicPages();
 const submissions=await prepareSegments(api,{recordId,pages});
 const records=await all(api), dataset=read();
 const manifest={...submissions,news:[],newsErrors:[]};
 for(const record of records.filter(r=>r.fields.stato==='pubblica')){
  try{
   if(String(record.fields.data_pubblicazione||'').slice(0,10)>require('./home-feature').todayRome())continue;
   const item=seg.publicItem(record),source=sourceUrl(item.url_fonte);
   if(records.filter(r=>sourceUrl(r.fields.url_fonte)===source).length!==1)throw Error('URL fonte duplicato in Airtable: verifica editoriale richiesta');
   const previous=dataset.find(n=>sourceUrl(n.url_fonte)===source);
   const merged={...item,id:previous?.id||item.id,data_pubblicazione:previous?.data_pubblicazione||item.data_pubblicazione,
     ...(previous?.segnalazioni?{segnalazioni:previous.segnalazioni}:{}),
     notizie:[...new Set([...(previous?.notizie||[]),record.id])]};
   if(previous)dataset[dataset.indexOf(previous)]=merged;else dataset.push(merged);
   manifest.news.push({recordId:record.id,source,title:merged.titolo_editoriale,publicUrl:seg.publicUrl(record.id),signature:signature(record)});
  }catch(e){manifest.newsErrors.push({recordId:record.id,error:e.message});}
 }
 // Read-only editorial overlay also enables expiry/rotation without a new submission.
 const home=dataset.map(item=>{
  const matches=records.filter(r=>sourceUrl(r.fields.url_fonte)===sourceUrl(item.url_fonte));
  if(matches.length!==1)return item;
  const f=matches[0].fields;
  return {...item,stato:f.stato||'da_valutare',posizione_sito:f.posizione_sito||'home_normale',
   priorita:f.priorita||'media',ordine_editoriale:f.ordine_editoriale??999,
   mantieni_in_evidenza_fino_al:f.mantieni_in_evidenza_fino_al||'',data_pubblicazione:f.data_pubblicazione||item.data_pubblicazione};
 });
 manifest.homeTitles=selectHomeNews(home).map(n=>n.titolo_editoriale||n.titolo_originale);
 manifest.homeHtml=renderHomeNews(selectHomeNews(home));
 manifest.homeChanged=section(pages.find(p=>p.url==='https://www.coinsieme.it/')?.html||'')!==manifest.homeHtml;
 manifest.count=manifest.items.length+manifest.news.length+(manifest.homeChanged?1:0);
 if(manifest.news.length)write(dataset);
 return manifest;
}
async function confirmNews(api,manifest,{fetcher=fetch,retries=12,delay=10000}={}){
 const results=[];
 for(const item of manifest.news||[]){
  const currentMatches=n=>n.fields.stato==='pubblica' && signature(n)===item.signature;
  const before=await api(NEWS+'/'+item.recordId);
  if(!currentMatches(before)){results.push({recordId:item.recordId,status:'skipped_changed_or_published'});continue;}
  let verified=false;
  for(let i=0;i<retries;i++){
   try{const r=await fetcher(item.publicUrl,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
    if(r.ok && seg.verifyPage(await r.text(),item)){verified=true;break;}
   }catch{}
   if(i+1<retries)await new Promise(resolve=>setTimeout(resolve,delay));
  }
  if(!verified){results.push({recordId:item.recordId,status:'not_verified_pending'});continue;}
  if(!currentMatches(await api(NEWS+'/'+item.recordId))){results.push({recordId:item.recordId,status:'skipped_changed_or_published'});continue;}
  await api(NEWS+'/'+item.recordId,'PATCH',{fields:{stato:'pubblicata'}});
  const final=await api(NEWS+'/'+item.recordId);
  if(final.fields.stato!=='pubblicata')throw Error('Rilettura Airtable fallita '+item.recordId);
  results.push({recordId:item.recordId,title:item.title,publicUrl:item.publicUrl,status:'verified',stato:final.fields.stato});
 }
 return results;
}
async function main(mode){
 const api=seg.createApi(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN||'');
 if(!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN)throw Error('PAT mancante');
 fs.mkdirSync('scratch',{recursive:true});
 const file='scratch/publication-manifest.json';
 if(mode==='prepare'){
  const manifest=await prepare(api,{recordId:process.env.SEGNALAZIONE_RECORD_ID||''});
  fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'count='+manifest.count+'\n');
  seg.reportPreparationErrors(manifest);
  for(const error of manifest.newsErrors)console.warn('::warning::Notizia '+error.recordId+': '+error.error);
  console.log(JSON.stringify({segnalazioni:manifest.items.length,notizie:manifest.news.length,homeChanged:manifest.homeChanged,errors:manifest.newsErrors}));
 }else if(mode==='confirm'){
  const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
  const results=await seg.confirm(api,manifest), newsResults=await confirmNews(api,manifest);
  const pages=await fetchPublicPages(), homeVerified=section(pages[0].html)===manifest.homeHtml;
  fs.writeFileSync('scratch/publication-result.json',JSON.stringify({results,newsResults,homeVerified,homeTitles:manifest.homeTitles,preparationErrors:[...manifest.errors,...(manifest.newsErrors||[])]},null,2)+'\n');
  console.log(JSON.stringify({results,newsResults,homeVerified}));
  if(!homeVerified||[...results,...newsResults].some(r=>r.status==='not_verified_pending'))throw Error('Verifica pubblica incompleta; consultare artifact');
 }else throw Error('Modalita non valida');
}
if(require.main===module)main(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepare,confirmNews,signature};
