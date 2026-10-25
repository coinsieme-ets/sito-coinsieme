'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const safety=require('./deploy-safety');
const tables=['tbldu5S3r7ZppEF1y','tblonsfQ2mnaelCAn','tblStce99L9z4YXAf'];
const record=(id='rec1',fields={})=>({id,fields:{stato:'pubblica',titolo:'Titolo',...fields}});
const state=async(rows=[record()])=>safety.readState(async()=>({records:rows}));
const receipt=async()=>({sha:'sha-A',tables:await state(),day:require('./home-feature').todayRome(),changedDuringBuild:false});
test('safety: commit obsoleto e codice aggiornato durante attesa sono bloccati',async()=>{
 const r=await receipt();assert(!safety.isFresh(r,{...r,sha:'sha-B'}));
 assert(safety.isFresh(r,{...r}));
});
test('safety: modifica solo Airtable, nuovo articolo e nuova notizia sono rilevati',async()=>{
 const r=await receipt();
 assert(!safety.isFresh(r,{...r,tables:await state([record('rec1',{titolo:'Nuovo'})])}));
 for(const table of tables.slice(0,2)){
  const updated=structuredClone(r.tables);updated[table].rec2=safety.fingerprint(record('rec2'));
  assert(!safety.isFresh(r,{...r,tables:updated}));
 }
});
test('safety: riordino dei campi e note interne non invalidano la build',()=>{
 assert.deepEqual(safety.fingerprint(record()),safety.fingerprint({id:'rec1',fields:{titolo:'Titolo',stato:'pubblica',note_interne:'Privato'}}));
});
test('safety: letture con fields[] non causano falsi blocchi, ma rilevano campi cambiati o rimossi',async()=>{
 const r=await receipt();
 safety.observe(r,tables[1],[{id:'rec1',fields:{stato:'pubblica'}}],['stato']);
 assert.equal(r.changedDuringBuild,false);
 safety.observe(r,tables[1],[{id:'rec1',fields:{}}],['stato']);
 assert.equal(r.changedDuringBuild,true);
});
test('safety: lettura effettiva diversa durante build resta bloccata anche dopo ripristino Airtable',async()=>{
 const r=await receipt();safety.observe(r,tables[0],[record('rec1',{titolo:'Temporaneo'})]);
 assert(!safety.isFresh(r,{...r}));
});
test('safety: scadenza a mezzanotte e ritiro articolo non passano come versione stabile',async()=>{
 const r=await receipt();assert(!safety.isFresh(r,{...r,day:'2099-01-01'}));
 assert(!safety.isFresh(r,{...r,tables:await state([record('rec1',{stato:'bozza'})])}));
});
test('safety: accorpamento solo di periodici superati, mai manuali o push',()=>{
 const newer=[{id:12,status:'queued',event:'schedule'}];
 assert(safety.supersededPeriodic('schedule',newer,11));
 for(const event of ['push','workflow_dispatch','workflow_call','repository_dispatch'])assert(!safety.supersededPeriodic(event,newer,11));
 assert(!safety.supersededPeriodic('schedule',[{id:12,status:'queued',event:'workflow_dispatch'}],11));
 assert(!safety.supersededPeriodic('schedule',[],11));
});
test('safety: ricostruzione conserva origine e record manuale, con limite esplicito ai tentativi',()=>{
 const env={SAFETY_WORKFLOW:'sync-rassegna.yml',SAFETY_RETRY:'0',GITHUB_RUN_ID:'11',SEGNALAZIONE_RECORD_ID:'recManuale'};
 assert.deepEqual(safety.retryInputs(env),{safety_retry:'1',origin_request:'11',record_id:'recManuale'});
 assert.equal(safety.retryInputs({...env,ORIGIN_REQUEST:'9',SAFETY_RETRY:'1'}).origin_request,'9');
 assert.throws(()=>safety.retryInputs({...env,SAFETY_RETRY:'2'}),/intervento manuale/);
});
test('safety: verifica usa solo GET Airtable e ricostruisce sul workflow esistente solo se obsoleto',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-safety-')),file=path.join(dir,'receipt.json');
 try{
  const r=await receipt();fs.writeFileSync(file,JSON.stringify(r));
  for(const sha of ['sha-A','sha-B']){
   const calls=[],out=path.join(dir,'output-'+sha);
   await safety.main('verify',{file,env:{GITHUB_REPOSITORY:'example/site',GH_TOKEN:'fake',AIRTABLE_PERSONAL_ACCESS_TOKEN:'fake',GITHUB_OUTPUT:out,SAFETY_WORKFLOW:'build-articoli.yml',GITHUB_RUN_ID:'11'},fetcher:async(url,options)=>{
    calls.push({url,options});
    if(url.startsWith('https://api.airtable.com/')){assert.equal(options.method,'GET');return {ok:true,json:async()=>({records:[record()]})};}
    if(url.endsWith('/git/ref/heads/main'))return {ok:true,json:async()=>({object:{sha}})};
    assert(url.endsWith('/actions/workflows/build-articoli.yml/dispatches'));
    assert.deepEqual(JSON.parse(options.body),{ref:'main',inputs:{safety_retry:'1',origin_request:'11'}});
    return {ok:true,status:204};
   }});
   assert.equal(calls.filter(c=>c.options.method==='POST').length,sha==='sha-A'?0:1);
   assert.match(fs.readFileSync(out,'utf8'),sha==='sha-A'?/fresh=true/:/fresh=false/);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('safety: errore GitHub o Airtable non autorizza il deploy',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-safety-')),file=path.join(dir,'receipt.json'),out=path.join(dir,'output');
 try{
  fs.writeFileSync(file,JSON.stringify(await receipt()));
  await assert.rejects(safety.main('verify',{file,env:{GITHUB_OUTPUT:out},fetcher:async()=>{throw Error('offline simulato');}}),/offline simulato/);
  assert(!fs.existsSync(out));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('safety: workflow mantengono gruppo pages, main attuale, gate e isolamento Sportello',()=>{
 const caller=fs.readFileSync(path.join(__dirname,'../.github/workflows/publish-single-segnalazione.yml'),'utf8');
 assert.match(caller,/publish:\r?\n    permissions:\r?\n      contents: write\r?\n      actions: write\r?\n      pages: write\r?\n      id-token: write/);
 for(const name of ['build-articoli','sync-rassegna']){
  const source=fs.readFileSync(path.join(__dirname,'../.github/workflows/'+name+'.yml'),'utf8');
  assert.match(source,/group: pages\r?\n  queue: max\r?\n  cancel-in-progress: false/);
  assert.match(source,/ref: main/);assert.match(source,/actions: write/);
  assert.match(source.split('jobs:')[0],/actions: read/);
  assert.doesNotMatch(source.split('jobs:')[0],/actions: write/);
  assert.match(source,/node scripts\/deploy-safety.js capture/);assert.match(source,/node scripts\/deploy-safety.js verify/);
  assert.match(source,/if: .*steps.freshness.outputs.fresh == 'true'/);
  assert.match(source,/node scripts\/check-pages-sportello.js _site/);
 }
});
