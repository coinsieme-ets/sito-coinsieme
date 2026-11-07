const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('../anteprima-sportello/app/coabitazione-data'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
test('Coabitazione: cinque riferimenti unici senza nuove categorie o record introduttivi',()=>{
 assert.equal(data.records.length,5);assert.equal(new Set(data.records.map(r=>r.id)).size,5);assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,52);
 assert.equal(catalog.resources.filter(r=>r.id==='info-abitare').length,1);
 for(let mask=1;mask<512;mask++){const ids=catalog.areas.filter((a,i)=>mask&(1<<i)).map(a=>a.id);const result=engine.chooseHomeResources(ids,catalog);assert.equal(result.filter(r=>r.id==='info-abitare').length,ids.includes('abitare')?1:0);}
});
test('Coabitazione: territori non estesi dalla sede o da una mappa nazionale',()=>{
 assert.deepEqual(data.choose({territory:'roma'}).map(r=>r.id),['tor-vergata','coab']);
 assert.equal(data.choose({territory:'roma',type:'rete'}).length,0);assert.deepEqual(data.choose({territory:'nazionale'}).map(r=>r.id),['housinglab']);
 assert.equal(data.choose({territory:'milano',type:'convivenza'}).length,1);assert.equal(data.choose({territory:'potenza'}).length,1);
});
test('Coabitazione rifinitura: riferimenti incerti non qualificati come accessi operativi',()=>{
 const coab=data.records.find(r=>r.id==='coab');assert.equal(coab.siteAccess,'non_confermato');assert.match(coab.status,/Operatività e disponibilità attuali da verificare/);
 assert.match(data.records.find(r=>r.id==='casa-nonni').status,/da riconfermare/);
 assert.match(data.records.find(r=>r.id==='housinglab').status,/non portale di stanze/);
 const ui=fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/coabitazione.js'),'utf8');
 assert.match(ui,/Riferimento ufficiale · Raggiungibilità non confermata/);assert.doesNotMatch(ui,/Informazioni e partecipazione sul sito del gestore/);
 assert.match(ui,/assistenza professionale o sanitaria/);assert.match(ui,/data\.choose\(\{territory:'roma'\}\)\.length/);
});
test('Coabitazione: ricerca per iniziativa e responsabile, senza dati di partecipanti',()=>{
 assert.deepEqual(data.choose({query:'UNIVERSOSUD'}).map(r=>r.id),['casa-nonni']);assert.equal(data.choose({query:'inesistente'}).length,0);
 for(const r of data.records){assert.ok(r.host&&r.seeker&&r.access&&r.costs&&r.eligibility&&r.status);assert.match(r.availability,/Nessun|non certifica/i);}
});
test('Coabitazione: fonti e date, esperienze storiche distinte dalle recensioni indipendenti',()=>{
 for(const r of data.records)for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.equal(s.checkedAt,'2026-11-01');}
 assert.equal(data.experiences.length,1);assert.equal(data.experiences[0].source.date,'2019-09-26');assert.match(data.experiences[0].kind,/gestore/);
 assert.match(data.note,/Non pubblica annunci abitativi privati/);assert.match(data.note,/non gestisce contatti o abbinamenti/);assert.doesNotMatch(data.note,/esente|nessuna responsabilità/);
});
test('Coabitazione: riepilogo coerente, senza alterare il conteggio delle altre selezioni',()=>{
 const context={window:{SportelloCoabitazioneData:data}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../anteprima-sportello/app/coabitazione.js'),'utf8'),context);
 assert.match(context.window.SportelloCoabitazione.selectionCaption([{id:'info-abitare'}]),/5 iniziative documentate/);
 assert.equal(context.window.SportelloCoabitazione.selectionCaption([{id:'altro'}]),null);assert.equal(context.window.SportelloCoabitazione.selectionCaption([{id:'info-abitare'},{id:'altro'}]),null);
});
test('Coabitazione: nessun invio, storage, modulo di iscrizione o dipendenza remota',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'anteprima-sportello/index.html'),'utf8');
 for(const file of ['coabitazione-data.js','coabitazione.js']){assert.ok(html.includes('/anteprima-sportello/app/'+file));assert.ok(html.indexOf(file)<html.indexOf('app/esplora.js'));assert.doesNotMatch(fs.readFileSync(path.join(root,'anteprima-sportello/app',file),'utf8'),/fetch\(|XMLHttpRequest|localStorage|sessionStorage|make\('form'|make\('textarea'/);}
 assert.match(html,/noindex,nofollow/);assert.match(html,/connect-src 'none'/);
});
