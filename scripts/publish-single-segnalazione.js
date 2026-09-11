'use strict';
const fs = require('node:fs');
const {sourceUrl, fetchPublicPages, verifyPublication, inspectPage} = require('./verify-publication');
const {processSegnalazioniMaurizio} = require('./process-segnalazioni-maurizio');
const {validateAndNormalizeRecord} = require('./sync-rassegna');
const BASE = 'appPqa952bdRrQJNI';
const TABLE = 'tblStce99L9z4YXAf';
const recordId = process.env.SEGNALAZIONE_RECORD_ID;
const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const file = 'content/rassegna/notizie-esterne.json';
async function api(endpoint, method='GET', body) {
  const r = await fetch('https://api.airtable.com/v0/'+BASE+'/'+endpoint,{
    method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    ...(body ? {body:JSON.stringify(body)} : {}),signal:AbortSignal.timeout(30000)});
  if (!r.ok) throw new Error('Airtable HTTP '+r.status);
  return r.json();
}
async function newsFor(source) {
  let offset, matches=[];
  do {
    const data = await api('tblonsfQ2mnaelCAn?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));
    matches.push(...data.records.filter(r=>sourceUrl(r.fields.url_fonte)===sourceUrl(source)));
    offset=data.offset;
  } while(offset);
  if(matches.length!==1) throw new Error('Notizia non univoca: '+matches.length);
  return matches[0];
}
async function run(mode) {
  if(!/^rec[a-zA-Z0-9]{14}$/.test(recordId||'') || !token) throw new Error('Record o PAT mancante');
  const seg = await api(TABLE+'/'+recordId);
  const source = sourceUrl(seg.fields.url_articolo);
  if(!source) throw new Error('URL fonte assente');
  if(mode==='prepare') {
    if(!['da_pubblicare','pubblicato'].includes(seg.fields.stato)) throw new Error('Stato segnalazione non ammesso');
    const pages = await fetchPublicPages();
    const existing = JSON.parse(fs.readFileSync(file,'utf8'));
    // Publish only the target plus news already visible on the public site.
    const baseline = existing.filter(n=>verifyPublication(pages,n).online && sourceUrl(n.url_fonte)!==source);
    const result = await processSegnalazioniMaurizio({recordId,deferPublicationConfirmation:true});
    if(result.auditLog.segnalazioni.length!==1 || result.auditLog.segnalazioni[0].recordId!==recordId) throw new Error('Elaborazione non circoscritta');
    const news = await newsFor(source);
    const item = normalizeTarget(news);
    if(!item || !item.titolo_editoriale || /^Aggiornamento da /i.test(item.titolo_editoriale)) throw new Error('Titolo o contenuto non valido: revisione necessaria');
    item.posizione_sito='home_evidenza';
    item.ordine_editoriale=0;
    fs.writeFileSync(file,JSON.stringify([...baseline,item],null,2)+'\n');
    console.log('TARGET '+recordId+' -> '+news.id+' | '+item.titolo_editoriale);
    console.log('Contenuti gia online mantenuti: '+baseline.length+'; nuova notizia: 1');
  } else if(mode==='anchor') {
    const news=await newsFor(source);
    let html=fs.readFileSync('index.html','utf8'), found=0;
    html=html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi,card=>{
      if(!inspectPage(card,source,news.fields.titolo_editoriale)) return card;
      found++;
      return card.replace('<article ','<article id="segnalazione-'+recordId+'" ');
    });
    if(found!==1) throw new Error('Scheda pubblica non univoca nella build: '+found);
    fs.writeFileSync('index.html',html);
  } else if(mode==='confirm') {
    const news=await newsFor(source);
    const anchor='segnalazione-'+recordId;
    // CDN propagation is not evidence of failure: wait for the exact visible card.
    let verified=false;
    for(let i=0;i<12;i++) {
      const pages=await fetchPublicPages();
      const home=pages.find(p=>p.url==='https://www.coinsieme.it/');
      const card=home.html.match(new RegExp('<article id="'+anchor+'"[^>]*>[\\s\\S]*?<\\/article>','i'));
      if(card && inspectPage(card[0],source,news.fields.titolo_editoriale)) {verified=true;break;}
      console.log('In attesa della scheda pubblica, tentativo '+(i+1));
      await new Promise(resolve=>setTimeout(resolve,10000));
    }
    if(!verified) throw new Error('Notizia non verificata online: stato non aggiornato');
    const current=await api(TABLE+'/'+recordId);
    if(sourceUrl(current.fields.url_articolo)!==source) throw new Error('URL segnalazione cambiato durante il deploy');
    const date = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const fields={stato:'pubblicato',data_pubblicazione:date,url_pubblicato:'https://www.coinsieme.it/#'+anchor};
    await api(TABLE+'/'+recordId,'PATCH',{fields});
    const final=await api(TABLE+'/'+recordId);
    if(Object.entries(fields).some(([k,v])=>final.fields[k]!==v)) throw new Error('Verifica finale Airtable fallita');
    console.log('ONLINE verificato: '+fields.url_pubblicato);
    console.log('Airtable verificato: '+recordId+' pubblicato '+date);
  } else throw new Error('Modalita sconosciuta');
}
function normalizeTarget(news) { return validateAndNormalizeRecord(news.fields, news.id, news); }
if (require.main === module) run(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports = {normalizeTarget};

