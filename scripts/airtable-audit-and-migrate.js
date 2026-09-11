'use strict';
const fs=require('node:fs');
async function runAuditAndMigration(){
 const token=process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN||process.env.AIRTABLE_API_KEY;
 if(!token)throw new Error('PAT mancante');
 const base='appPqa952bdRrQJNI', requests=[];
 async function read(path){
  const r=await fetch('https://api.airtable.com/v0/'+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
  requests.push({method:'GET',path,status:r.status});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();
 }
 const tables=await read('meta/bases/'+base+'/tables');
 const table=tables.tables.find(t=>t.name==='Segnalazioni Maurizio');
 const records=[];let offset;
 do{const d=await read(base+'/'+table.id+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));records.push(...d.records);offset=d.offset;}while(offset);
 fs.writeFileSync('content/rassegna/airtable-full-audit.json',JSON.stringify({timestamp:new Date().toISOString(),mode:'read_only',requests,table,records},null,2));
}
if(require.main===module)runAuditAndMigration().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={runAuditAndMigration};
