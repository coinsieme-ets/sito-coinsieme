'use strict';
// Explicit workflow_dispatch only: exercise the production writer, never send mail.
const fs=require('node:fs');
const {saveSelected}=require('./daily-briefing');
const {createApi}=require('./publish-segnalazioni');
const {todayRome}=require('./home-feature');
async function main(){
 const api=createApi(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN),date=todayRome(),created=[];
 const tracked=async(path,method='GET',body)=>{const r=await api(path,method,body);if(method==='POST')created.push(...r.records.map(x=>x.id));return r;};
 const report={date,productionWriter:true,emailSent:false};
 try{
  const records=await saveSelected({api:tracked,date,selected:[{titolo_editoriale:'TEST TECNICO - verifica automatica data_briefing',fonte:'COINSIEME test tecnico',url_fonte:'https://example.invalid/briefing-test/'+process.env.GITHUB_RUN_ID,data_fonte:'2026-09-10',sintesi_editoriale:'Record tecnico autorizzato, non destinato a pubblicazione o invio.',reason:'Verifica scrittura e rilettura del campo data_briefing.'}]});
  report.readback=records.map(r=>({id:r.id,stato:r.fields.stato,data_briefing:r.fields.data_briefing,data_fonte:r.fields.data_fonte}));
 }finally{
  // Archive only records created by this test; keep the written date as evidence.
  for(const id of created){await api('tblonsfQ2mnaelCAn/'+id,'PATCH',{fields:{stato:'archiviata',id:'rss-test-'+id}});}
  report.finalRecords=[];for(const id of created)report.finalRecords.push(await api('tblonsfQ2mnaelCAn/'+id));
  fs.mkdirSync('scratch',{recursive:true});fs.writeFileSync('scratch/briefing-date-live.json',JSON.stringify(report,null,2));
 }
 console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
