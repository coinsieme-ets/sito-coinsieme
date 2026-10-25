'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const FILE='scratch/deploy-safety.json';
const BASE='appPqa952bdRrQJNI';
const TABLES=['tbldu5S3r7ZppEF1y','tblonsfQ2mnaelCAn','tblStce99L9z4YXAf'];
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
function fingerprint(record){
 const fields={...record.fields};
 // Internal notes are not publication inputs. Preserve all other fields conservatively,
 // including aliases accepted by the existing importers, without storing their values.
 for(const key of ['rilevanza_coinsieme','note_interne'])delete fields[key];
 return Object.fromEntries(Object.keys(fields).sort().map(key=>[key,hash(fields[key])]));
}
async function readState(api){
 const tables={};
 for(const table of TABLES){
  const records={};let offset;
  do{
   const page=await api(table+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));
   if(!Array.isArray(page.records))throw Error('Risposta editoriale incompleta');
   for(const record of page.records){if(records[record.id])throw Error('Record duplicato');records[record.id]=fingerprint(record);}
   offset=page.offset;
  }while(offset);
  tables[table]=records;
 }
 return tables;
}
function observe(receipt,table,records,selectedFields=[]){
 if(!receipt.tables[table])throw Error('Tabella non prevista');
 for(const record of records){
  const expected=receipt.tables[table][record.id],actual=fingerprint(record);
  const keys=selectedFields.filter(key=>!['rilevanza_coinsieme','note_interne'].includes(key));
  if(!expected||(selectedFields.length?keys.some(key=>expected[key]!==actual[key]):hash(expected)!==hash(actual)))receipt.changedDuringBuild=true;
 }
 return receipt;
}
function isFresh(receipt,{sha,tables,day}){
 return !receipt.changedDuringBuild&&receipt.sha===sha&&receipt.day===day&&hash(receipt.tables)===hash(tables);
}
function supersededPeriodic(event,runs,current){
 return event==='schedule'&&runs.some(r=>r.event==='schedule'&&r.status==='queued'&&Number(r.id)>Number(current));
}
function retryInputs(env){
 const attempt=Number(env.SAFETY_RETRY||0);
 if(!Number.isInteger(attempt)||attempt<0||attempt>=2)throw Error('Versione instabile dopo tre tentativi: richiesta conservata nei log; intervento manuale necessario');
 return {safety_retry:String(attempt+1),origin_request:env.ORIGIN_REQUEST||env.GITHUB_RUN_ID,
  ...(env.SAFETY_WORKFLOW==='sync-rassegna.yml'?{record_id:env.SEGNALAZIONE_RECORD_ID||''}:{})};
}
function installObserver(){
 if(process.env.DEPLOY_SAFETY_OBSERVE!=='1')return;
 const original=global.fetch;
 global.fetch=async(input,options)=>{
  const response=await original(input,options),url=new URL(typeof input==='string'?input:input.url);
  if(url.origin==='https://api.airtable.com'&&url.pathname.startsWith('/v0/'+BASE+'/')){
   const table=url.pathname.split('/')[3];
   if(TABLES.includes(table)&&response.ok&&(options?.method||'GET')==='GET'){
    const data=await response.clone().json(),receipt=JSON.parse(fs.readFileSync(FILE,'utf8'));
    observe(receipt,table,data.records||[data],url.searchParams.getAll('fields[]'));fs.writeFileSync(FILE,JSON.stringify(receipt));
   }
  }
  return response;
 };
}
async function main(mode,{env=process.env,fetcher=fetch,file=FILE}={}){
 const output=(key,value)=>{if(env.GITHUB_OUTPUT)fs.appendFileSync(env.GITHUB_OUTPUT,key+'='+value+'\n');};
 const github=async(endpoint,body)=>{
  const response=await fetcher('https://api.github.com/repos/'+env.GITHUB_REPOSITORY+'/'+endpoint,{
   method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.GH_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'},
   ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('GitHub safety HTTP '+response.status);
  return response.status===204?null:response.json();
 };
 const day=()=>require('./home-feature').todayRome();
 if(mode==='entry'){
  let skip=false;
  if(env.GITHUB_EVENT_NAME==='schedule'){
   const runs=await github('actions/workflows/sync-rassegna.yml/runs?event=schedule&status=queued&per_page=100');
   skip=supersededPeriodic(env.GITHUB_EVENT_NAME,runs.workflow_runs,env.GITHUB_RUN_ID);
  }
  output('run',!skip);return;
 }
 const api=require('./publish-segnalazioni').createApi(env.AIRTABLE_PERSONAL_ACCESS_TOKEN,fetcher);
 if(mode==='capture'){
  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const receipt={sha,day:day(),origin:env.ORIGIN_REQUEST||env.GITHUB_RUN_ID,tables:await readState(api),changedDuringBuild:false};
  fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(receipt));output('sha',sha);return;
 }
 if(mode!=='verify')throw Error('Modalita safety non valida');
 const receipt=JSON.parse(fs.readFileSync(file,'utf8'));
 const tables=await readState(api),head=await github('git/ref/heads/main');
 const fresh=isFresh(receipt,{tables,sha:head.object.sha,day:day()});
 if(!fresh){
  const inputs=retryInputs(env);
  await github('actions/workflows/'+env.SAFETY_WORKFLOW+'/dispatches',{ref:'main',inputs});
  console.log('::warning::Artefatto obsoleto escluso; ricostruzione richiesta. Origine: '+inputs.origin_request);
 }
 output('fresh',fresh);
}
installObserver();
module.exports={fingerprint,readState,observe,isFresh,supersededPeriodic,retryInputs,main};
if(require.main===module)main(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
