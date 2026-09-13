'use strict';
const fs=require('node:fs');const crypto=require('node:crypto');
const {createApi}=require('./publish-segnalazioni');
const {normalizeUrl}=require('./ingest-rassegna-candidates');
const {MAX,selectCandidates}=require('./briefing-selection');
const {todayRome}=require('./home-feature');
const NEWS='tblonsfQ2mnaelCAn',SEG='tblStce99L9z4YXAf';
const prefix=date=>'rssbrief-'+date+'-';
async function all(api,table){let offset,records=[];do{const r=await api(table+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));records.push(...r.records);offset=r.offset;}while(offset);return records;}
function assertBatch(records,date){
 if(!Array.isArray(records)||records.length>MAX)throw Error('BLOCCO: briefing oltre il limite di 5');
 const ids=new Set(),urls=new Set();
 for(const r of records){const f=r.fields||{},url=normalizeUrl(f.url_fonte);
  if(!/^rec[a-zA-Z0-9]+$/.test(r.id||'')||!String(f.id||'').startsWith(prefix(date))||f.stato!=='da_valutare'||todayRomeDate(r.createdTime)!==date||!url||ids.has(r.id)||urls.has(url))throw Error('BLOCCO: batch non odierno, non verificato o duplicato');
  ids.add(r.id);urls.add(url);
 }
 return records;
}
function todayRomeDate(value){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
async function readBatch(api,ids,date){if(ids.length>MAX||new Set(ids).size!==ids.length)throw Error('BLOCCO: ID briefing oltre limite o duplicati');const records=[];for(const id of ids)records.push(await api(NEWS+'/'+id));return assertBatch(records,date);}
async function prepareBatch({api=createApi(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN),candidates,date=todayRome()}={}){
 const existing=await all(api,NEWS),segs=await all(api,SEG);
 const old=existing.filter(r=>String(r.fields.id||'').startsWith(prefix(date)));
 if(old.length){const records=await readBatch(api,old.map(r=>r.id),date);return {date,reused:true,records};}
 if(!candidates)candidates=await require('./fetch-rassegna-rss').fetchCandidatesFromRss();
 const result=selectCandidates(candidates,existing.map(r=>r.fields),segs.map(r=>r.fields),date);
 const fields=result.selected.map(item=>({id:prefix(date)+crypto.createHash('sha256').update(normalizeUrl(item.url_fonte)).digest('hex').slice(0,16),
  titolo_originale:item.titolo_originale||item.titolo_editoriale,titolo_editoriale:item.titolo_editoriale,fonte:item.fonte,url_fonte:item.url_fonte,
  data_fonte:item.data_fonte,sintesi_editoriale:item.sintesi_editoriale,stato:'da_valutare',fld6PleXUSkuOcHsF:item.reason}));
 if(fields.length>MAX)throw Error('BLOCCO: inserimento oltre limite');
 let records=[];
 if(fields.length){const response=await api(NEWS,'POST',{records:fields.map(fields=>({fields}))});if(response.records?.length!==fields.length)throw Error('Inserimento Airtable incompleto');records=await readBatch(api,response.records.map(r=>r.id),date);
  for(const r of records){const expected=fields.find(f=>f.id===r.fields.id);if(!expected||expected.url_fonte!==r.fields.url_fonte||expected.titolo_editoriale!==r.fields.titolo_editoriale)throw Error('Verifica Airtable non corrispondente');}
 }
 return {date,reused:false,total:candidates.stats?.rawCount??candidates.length,validCandidates:candidates.length,excluded:result.excluded.length+(candidates.stats?.rawCount??candidates.length)-candidates.length,exclusionReasons:result.excluded,records};
}
function outcome(values){
 const result={date:todayRome(),recipient:'segreteria@coinsieme.it',sender:process.env.BRIEFING_SENDER_EMAIL||'onboarding@resend.dev',resendCalled:false,httpStatus:null,messageId:null,...values};
 fs.mkdirSync('scratch',{recursive:true});fs.writeFileSync('scratch/briefing-outcome.json',JSON.stringify(result,null,2));console.log('BRIEFING_OUTCOME',JSON.stringify(result));return result;
}
async function main(){
 const preview=process.argv.includes('--preview');
 if(!preview && process.env.GITHUB_EVENT_NAME==='schedule' && !require('./send-briefing-mail').isRomeTimeWindow()){outcome({skipped:true,reason:'outside_rome_time_window'});return;}
 if(!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN)throw Error('Credenziale Airtable mancante');
 const api=createApi(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN),date=todayRome();
 fs.mkdirSync('scratch',{recursive:true});
 if(process.env.AUDIT_PREVIOUS_BRIEFING==='true'){
  const records=await all(api,NEWS),cutoff='2026-09-12T04:38:26.129Z';
  const pending=records.filter(r=>r.createdTime<cutoff&&['da_valutare','segnalata','proposta','da_verificare'].includes(r.fields.stato));
  const audit={reconstruction:true,cutoff,total:pending.length,uniqueUrls:new Set(pending.map(r=>normalizeUrl(r.fields.url_fonte))).size,priorDays:pending.filter(r=>todayRomeDate(r.createdTime)<'2026-09-12').length,createdToday:pending.filter(r=>todayRomeDate(r.createdTime)==='2026-09-12').length,sourceBeforeToday:pending.filter(r=>(r.fields.data_fonte||'')<'2026-09-12').length};
  fs.writeFileSync('scratch/briefing-audit.json',JSON.stringify(audit,null,2));console.log('AUDIT',JSON.stringify(audit));
 }
 // Do not create another daily batch after a successful real dispatch.
 const mail=require('./send-briefing-mail');
 if(!preview&&mail.loadDispatchLog().some(e=>e.status==='sent'&&e.dateIso===date)){outcome({skipped:true,reason:'already_sent_today'});return;}
 const batch=await prepareBatch({api,date});
 fs.writeFileSync('scratch/briefing-batch.json',JSON.stringify(batch,null,2));
 const exclusionCounts=(batch.exclusionReasons||[]).reduce((a,x)=>(a[x.reason]=(a[x.reason]||0)+1,a),{});
 const result=await mail.main({preview,api,batch});
 outcome({candidates:batch.total??null,selected:batch.records.length,inserted:batch.reused?0:batch.records.length,exclusionCounts,...result});
 console.log('BATCH',JSON.stringify({date:batch.date,total:batch.total,excluded:batch.excluded,reused:batch.reused,records:batch.records.map(r=>({id:r.id,title:r.fields.titolo_editoriale,source:r.fields.fonte,reason:r.fields.rilevanza||r.fields.rilevanza_coinsieme}))}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepareBatch,readBatch,assertBatch,prefix,todayRomeDate};
