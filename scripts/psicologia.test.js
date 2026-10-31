'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const data=require('../anteprima-sportello/app/psicologia'),catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const ids=data.resources.map(r=>r.id),newRecord=r=>ids.includes(r.id);
test('Psicologia: sei servizi condivisi, nove categorie, nessun record precedente alterato',()=>{
 assert.equal(data.records.length,6);assert.equal(data.resources.length,7);assert.equal(catalog.resources.length,51);assert.equal(catalog.areas.length,9);
 // Baseline digests from published fde4ac7; fixtures need no .git directory.
 const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
 assert.equal(digest(catalog.resources.filter(r=>!newRecord(r)&&r.id!=='info-fisioterapia-domicilio')),'6cd601eef35c7969d10fc8133f447258f18deddd699de5e3058a41f36b1ac403');
 assert.equal(digest(catalog.areas),'b95d9bf1711d601388462442782fbe0b14e3fd3924c10f282adc9faadcee3af5');assert.equal(digest(catalog.subcategories),'7c365be6372c4eb90192914abff961aa2a83072c6b54f5417c6f104e52b1adb1');
 for(const selected of [['salute'],['domicilio'],['salute','domicilio']]){const found=engine.chooseHomeResources(selected,catalog).filter(newRecord);assert.equal(found.length,7);assert.equal(new Set(found.map(r=>r.id)).size,7);}
});
test('Psicologia: ricerca, territori remoti e filtro dedicato senza alterare le altre tipologie',()=>{
 const find=opts=>engine.chooseHomeResources(['domicilio'],catalog,opts);
 assert.equal(find({kind:'psicologia'}).length,7);
 assert.deepEqual(find({name:'Serenis'}).filter(newRecord).map(r=>r.id),['info-sostegno-psicologico-online','psicologia-serenis']);
 assert.equal(find({kind:'badante'}).filter(newRecord).length,0);
 for(const territory of ['v','est'])assert.equal(find({kind:'psicologia',territory}).filter(newRecord).length,7);
 assert.equal(find({kind:'psicologia',territory:'nazionale'}).some(r=>r.id==='psicologia-bonus-psiconcologia-lazio'),false);
 for(const r of data.resources.filter(r=>r.remoteItaly))assert.equal(r.seatMunicipio,undefined);
});
test('Psicologia: prezzi, gratuità limitata, durata e qualifiche dichiarate non certificate',()=>{
 const by=id=>data.records.find(r=>r.id===id);
 for(const id of ['unobravo','serenis','psicologo4u'])assert.match(by(id).costs,/49 euro individuale, 59 euro coppia/);
 assert.match(by('psicodigitale').costs,/45 euro individuale, 55 euro coppia/);assert.match(by('santagostino-psiche').costs,/50 euro/);
 assert.match(by('serenis').duration,/45 minuti.*55 minuti/);assert.match(by('psicologo4u').duration,/50 minuti.*15 minuti/);
 assert.match(by('bonus-psiconcologia-lazio').costs,/1.200.*16 colloqui/);assert.match(by('bonus-psiconcologia-lazio').requirements,/40.000/);
 for(const r of data.records){assert.ok(r.credentials&&r.duration&&r.audienceEvidence);assert.ok(r.sources.length>=2);for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.equal(s.checkedAt,data.checkedAt);}}
 assert.match(by('psicologo4u').notes.join(' '),/giurisdizione inglesi/);
});
test('Psicologia: misura pubblica distinta, domande non garantite e tariffe private datate',()=>{
 const services=data.resources.filter(r=>r.verificationScope==='psicologia-online');
 assert.equal(services.filter(r=>r.funding==='public').length,1);assert.equal(services.filter(r=>r.funding==='private').length,5);
 for(const resource of services.filter(r=>r.funding==='private'))assert.match(resource.costs,/verificate al 28 ottobre 2026, soggette ad aggiornamento/);
 assert.match(services.find(r=>r.funding==='public').notes.join(' '),/Accettazione di nuove richieste.*non garantisce fondi disponibili/);
 const js=fs.readFileSync('anteprima-sportello/app/esplora.js','utf8'),css=fs.readFileSync('anteprima-sportello/styles/esplora.css','utf8');
 assert.match(js,/Opportunità finanziata pubblicamente/);assert.match(js,/Servizio privato a pagamento/);assert.match(css,/sp-psychology-public/);assert.match(css,/sp-psychology-private/);
});
function introNodes(id='info-sostegno-psicologico-online'){
 const nodes=[],document={createElement(tag){const node={tag,children:[],append(...items){this.children.push(...items);}};nodes.push(node);return node;}};
 const ctx={window:{},document};vm.runInNewContext(fs.readFileSync('anteprima-sportello/app/psicologia.js','utf8'),ctx);
 ctx.window.SportelloPsicologia.decorate({id},document.createElement('div'));return nodes;
}
test('Psicologia: introduzione diretta, consenso e caregiver senza moduli o duplicazioni',()=>{
 const found=engine.chooseServiceResources(['salute'],catalog),group=engine.groupServiceResources(found,['salute'],catalog).find(g=>g.id==='salute:sostegno-psicologico-online');assert.equal(group.resources.length,7);
 assert.deepEqual(engine.servicePresentation(group.resources.find(r=>r.id==='info-sostegno-psicologico-online'),group,catalog),{inline:true,showHeading:false});
 const nodes=introNodes(),text=nodes.map(n=>n.textContent||'').join(' ');for(const pattern of [/Psichiatria/,/Emergenze/,/112/,/consenso informato/,/presenza durante il colloquio non è automatica/,/non raccoglie dati clinici/,/non in graduatoria/])assert.match(text,pattern);
 assert.equal(nodes.filter(n=>n.tag==='details').length,0);assert.equal(introNodes('info-salute-continuita-assistenziale').length,1);
 const js=fs.readFileSync('anteprima-sportello/app/psicologia.js','utf8');assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|<form/);
});
test('Psicologia: script locale preservato con noindex e prima del catalogo',()=>{
 const html=fs.readFileSync('anteprima-sportello/index.html','utf8');assert.match(html,/<meta name="robots" content="[^"]*\bnoindex\b[^"]*">/);
 assert.ok(html.indexOf('/app/psicologia.js')<html.indexOf('/app/servizi.js'));assert.ok(html.indexOf('/app/psicologia.js')<html.indexOf('/app/esplora.js'));
 const engineSource=fs.readFileSync('anteprima-sportello/app/esplora.js','utf8');assert.match(engineSource,/SportelloPsicologia.decorate/);assert.match(engineSource,/\['psicologia','Sostegno psicologico online'\]/);
});
