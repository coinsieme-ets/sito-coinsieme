'use strict';
// Read-only overlay for PRIMO PIANO. No new sources or content imports.
const fs=require('node:fs');
const {sourceUrl}=require('./verify-publication');
const {createApi}=require('./publish-segnalazioni');
async function main() {
 const token=process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
 if(!token)throw new Error('Credenziale Airtable mancante');
 const api=createApi(token),records=[];let offset;
 do {const r=await api('tblonsfQ2mnaelCAn?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));records.push(...r.records);offset=r.offset;}while(offset);
 const data=JSON.parse(fs.readFileSync('content/rassegna/notizie-esterne.json','utf8')),overlay={};
 for(const item of data) {
  const matches=records.filter(r=>sourceUrl(r.fields.url_fonte)===sourceUrl(item.url_fonte));
  if(matches.length!==1)throw new Error('Corrispondenza editoriale assente o ambigua: '+item.id);
  const f=matches[0].fields;
  overlay[item.id]={posizione_sito:f.posizione_sito||'home_normale',priorita:f.priorita||'media',ordine_editoriale:f.ordine_editoriale??999,mantieni_in_evidenza_fino_al:f.mantieni_in_evidenza_fino_al||'',stato:f.stato||'da_valutare',data_pubblicazione:f.data_pubblicazione||item.data_pubblicazione};
 }
 fs.mkdirSync('scratch',{recursive:true});fs.writeFileSync('scratch/home-editorial.json',JSON.stringify(overlay,null,2));
 console.log('Metadati homepage aggiornati via GET Airtable: '+data.length+' notizie gia nel dataset pubblico');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
