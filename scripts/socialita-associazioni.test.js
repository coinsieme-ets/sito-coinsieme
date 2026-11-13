'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const model=require('../anteprima-sportello/app/socialita');
const ids=['social-auser-prenestino','social-ecomuseo-casilino','social-angeli-noonan'];
const records=ids.map(id=>model.additions.find(r=>r.id===id));

test('Associazioni sociali: tre schede uniche, ricercabili e presenti in Socialità',()=>{
 assert.ok(records.every(Boolean));
 const context={window:{}};
 for(const file of ['socialita-data','samaritans','tirrenia-todaro'])vm.runInNewContext(fs.readFileSync(require.resolve('../anteprima-sportello/app/'+file),'utf8'),context);
 const all=[...context.window.SportelloSocialitaData.records,...model.additions];
 for(const r of records){
  assert.equal(all.filter(x=>x.id===r.id).length,1);
  assert.equal(model.forCategories([r],['socialita']).length,1);
  assert.equal(model.filter(all,{name:r.name.split(' — ')[0]}).filter(x=>x.id===r.id).length,1);
  assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-13'&&s.url.startsWith('https://')));
  assert.ok(!/\bConsulta\b/i.test(JSON.stringify(r)));
  assert.equal(r.hours,undefined);assert.equal(r.costs,undefined);
 }
 assert.equal(require('../anteprima-sportello/app/servizi').areas.length,9);
});

test('Associazioni sociali: recapiti pubblici distinti dalla conferma diretta',()=>{
 const [a,e,n]=records;
 assert.equal(a.email,'auserprenestino@gmail.com');assert.match(a.operationalAddress,/Irpinia 70/);
 assert.equal(e.email,'info@ecomuseocasilino.it');assert.match(e.operationalAddress,/Serbelloni 57\/b/);
 for(const r of [a,e])assert.match(r.details.join(' '),/non.*conferma|Non sono dati confermati/i);
 for(const key of ['website','email','phone','operationalAddress'])assert.equal(n[key],null);
 assert.match(n.details.join(' '),/2022/);assert.match(n.details.join(' '),/HTTP 500/);
 assert.match(n.details.join(' '),/non offre diagnosi/);
});

test('Associazioni sociali: indice di ricerca include esattamente una scheda per soggetto',()=>{
 const entries=require('./search-catalog').catalog();
 for(const r of records){const found=entries.filter(e=>e.url.endsWith('/sociale/'+r.id));assert.equal(found.length,1);assert.equal(found[0].title,r.name);}
});

test('Associazioni sociali: aggiunte storiche invariate',()=>{
 const legacy=model.additions.filter(r=>!ids.includes(r.id)&&!['social-scuola-popolare-scacchi','social-universita-popolare-torpignattara','social-ballo-flabart'].includes(r.id));
 assert.equal(legacy.length,31);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),'ecb3fe21b3b3615563c5b450290847ad60a7eca00057ac81464c4e284122cb2d');
});
