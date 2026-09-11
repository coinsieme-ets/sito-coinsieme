'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {sourceUrl, title, inspectPage, fetchPublicPages, verifyPublication} = require('./verify-publication');
const {validateAndNormalizeRecord} = require('./sync-rassegna');
const {processSegnalazioniMaurizio} = require('./process-segnalazioni-maurizio');
const BASE='appPqa952bdRrQJNI', SEG='tblStce99L9z4YXAf', NEWS='tblonsfQ2mnaelCAn';
const DATA='content/rassegna/notizie-esterne.json', MANIFEST='scratch/publication-manifest.json';
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const publicUrl=id=>'https://www.coinsieme.it/rassegna/'+id+'.html';
function selectPending(records,id) {
  return records.filter(r=>r.fields.stato==='da_pubblicare' && (!id || r.id===id));
}
function canConfirm(current,expected) {
  return current.fields.stato==='da_pubblicare' && sourceUrl(current.fields.url_articolo)===expected.source;
}
function verifyPage(html,item) {
  return html.includes('data-segnalazione="'+item.recordId+'"') &&
    html.includes('rel="canonical" href="'+item.publicUrl+'"') &&
    inspectPage(html,item.source,item.title);
}
function publicItem(news) {
  const item=validateAndNormalizeRecord(news.fields,news.id,news);
  if(!item || /^Aggiornamento da /i.test(title(item.titolo_editoriale))) throw new Error('Titolo o metadati non pubblicabili');
  // This is the public editorial dataset, never the Airtable response or audit payload.
  const {createdTime,airtableRecordId,originalStato,rilevanza_coinsieme,...clean}=item;
  return {...clean,titolo_editoriale:title(clean.titolo_editoriale),titolo_originale:title(clean.titolo_originale),
    url_fonte:sourceUrl(clean.url_fonte)};
}
function createApi(token,fetcher=fetch) {
  return async (endpoint,method='GET',body)=>{
    for(let attempt=0;attempt<4;attempt++){
      const r=await fetcher('https://api.airtable.com/v0/'+BASE+'/'+endpoint,{
        method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
      if(r.status===429 && attempt<3){await new Promise(resolve=>setTimeout(resolve,30000));continue;}
      if(!r.ok) throw new Error('Airtable '+method+' HTTP '+r.status);
      return r.json();
    }
  };
}
async function all(api,table) {
  const records=[];let offset;
  do {const data=await api(table+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));
    records.push(...data.records);offset=data.offset;
  } while(offset);
  return records;
}
async function prepare(api,{recordId,processRecord=processSegnalazioniMaurizio,pages}={}) {
  const segs=await all(api,SEG), pending=selectPending(segs,recordId);
  const manifest={version:1,createdAt:new Date().toISOString(),items:[],errors:[]};
  // No pending records means no writes, build or deploy.
  if(!pending.length) return manifest;
  pages=pages||await fetchPublicPages();
  let news=await all(api,NEWS);
  const existing=JSON.parse(fs.readFileSync(DATA,'utf8'));
  const publishedSources=new Set(segs.filter(s=>s.fields.stato==='pubblicato').map(s=>sourceUrl(s.fields.url_articolo)));
  const dataset=new Map(existing.filter(n=>n.segnalazioni?.length || publishedSources.has(sourceUrl(n.url_fonte)) ||
    verifyPublication(pages,n).online).map(n=>[sourceUrl(n.url_fonte),n]));
  for(const seg of pending) {
    try {
      const source=sourceUrl(seg.fields.url_articolo);
      if(!source) throw new Error('URL fonte non valido');
      let matches=news.filter(n=>sourceUrl(n.fields.url_fonte)===source);
      if(matches.length>1) throw new Error('Record Notizie duplicati: richiesta verifica editoriale');
      if(!matches.length) {
        await processRecord({recordId:seg.id,deferPublicationConfirmation:true});
        news=await all(api,NEWS);matches=news.filter(n=>sourceUrl(n.fields.url_fonte)===source);
      }
      if(matches.length!==1) throw new Error('Record Notizie non disponibile');
      let n=matches[0];
      // A submission marked da_pubblicare is explicit editorial approval of that source.
      // Never promote unrelated RSS candidates.
      if(!['pubblica','pubblicata'].includes(n.fields.stato)) {
        n=await api(NEWS+'/'+n.id,'PATCH',{fields:{stato:'pubblica'}});
      }
      const item=publicItem(n), previous=dataset.get(source);
      item.data_pubblicazione=today();
      item.segnalazioni=[...new Set([...(previous?.segnalazioni||[]),seg.id])];
      dataset.set(source,item);
      manifest.items.push({recordId:seg.id,newsId:n.id,source,title:item.titolo_editoriale,publicUrl:publicUrl(seg.id)});
    } catch(e) {manifest.errors.push({recordId:seg.id,error:e.message});console.error(seg.id+': '+e.message);}
  }
  // Keep stable pages for already published records without changing those Airtable records.
  for(const seg of segs.filter(s=>s.fields.stato==='pubblicato')) {
    const item=dataset.get(sourceUrl(seg.fields.url_articolo));
    if(item) item.segnalazioni=[...new Set([...(item.segnalazioni||[]),seg.id])];
  }
  if(manifest.items.length) fs.writeFileSync(DATA,JSON.stringify([...dataset.values()],null,2)+'\n');
  return manifest;
}
async function confirm(api,manifest,{fetcher=fetch,retries=12,delay=10000}={}) {
  const results=[];
  for(const item of manifest.items) {
    const before=await api(SEG+'/'+item.recordId);
    if(!canConfirm(before,item)){results.push({recordId:item.recordId,status:'skipped_changed_or_published'});continue;}
    let verified=false;
    for(let i=0;i<retries;i++){
      try {
        const response=await fetcher(item.publicUrl,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
        if(response.ok && verifyPage(await response.text(),item)){verified=true;break;}
      } catch {}
      if(i+1<retries) await new Promise(resolve=>setTimeout(resolve,delay));
    }
    if(!verified){results.push({recordId:item.recordId,status:'not_verified_pending'});continue;}
    const current=await api(SEG+'/'+item.recordId);
    if(!canConfirm(current,item)){results.push({recordId:item.recordId,status:'skipped_changed_or_published'});continue;}
    const fields={stato:'pubblicato',data_pubblicazione:today(),url_pubblicato:item.publicUrl};
    await api(SEG+'/'+item.recordId,'PATCH',{fields});
    const final=await api(SEG+'/'+item.recordId);
    if(Object.entries(fields).some(([k,v])=>final.fields[k]!==v)) throw new Error('Rilettura Airtable fallita '+item.recordId);
    results.push({recordId:item.recordId,title:item.title,...fields,status:'verified'});
    console.log('VERIFIED '+item.recordId+' '+item.publicUrl);
  }
  return results;
}
async function main(mode) {
  const token=process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  if(!token)throw new Error('PAT mancante');
  const recordId=process.env.SEGNALAZIONE_RECORD_ID||'';
  if(recordId && !/^rec[a-zA-Z0-9]{14}$/.test(recordId)) throw new Error('ID non valido');
  const api=createApi(token);
  fs.mkdirSync('scratch',{recursive:true});
  if(mode==='prepare'){
    const manifest=await prepare(api,{recordId});
    fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n');
    if(process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,'count='+manifest.items.length+'\n');
    console.log('Segnalazioni preparate: '+manifest.items.length+'; errori: '+manifest.errors.length);
    if(!manifest.items.length && manifest.errors.length) throw new Error('Nessuna segnalazione pubblicabile: consultare artifact');
  } else if(mode==='confirm'){
    const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
    const results=await confirm(api,manifest);
    fs.writeFileSync('scratch/publication-result.json',JSON.stringify({results,preparationErrors:manifest.errors},null,2)+'\n');
    if(results.some(r=>r.status==='not_verified_pending') || manifest.errors.length) throw new Error('Alcune segnalazioni restano in attesa; consultare artifact');
  } else throw new Error('Modalita non valida');
}
if(require.main===module)main(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={selectPending,canConfirm,verifyPage,publicItem,createApi,prepare,confirm,publicUrl};
