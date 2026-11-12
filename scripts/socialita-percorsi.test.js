const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const path=require('node:path'),base=path.join(__dirname,'../anteprima-sportello/app'),model=require('../anteprima-sportello/app/socialita');
test('Mistica: tenuta, parco ricreativo e Capodarco sono risorse distinte, senza noleggi garantiti',()=>{
 const at=id=>model.additions.find(r=>r.id===id),park=at('social-mistica-tutti-insieme'),cap=at('social-mistica-capodarco');
 assert.ok(at('social-parco-centocelle'));assert.match(at('social-mistica-territorio').details.join(' '),/non costituisce ancora un parco pubblico unitario/);
 assert.equal(park.phone,'3669574004');assert.match(park.details.join(' '),/prenotazione o noleggio dei gazebo/);assert.match(park.details.join(' '),/gestione attuale/);assert.match(park.details.join(' '),/Non sono confermati fontane/);
 assert.ok(park.sources.some(s=>s.label.includes('2017')));assert.equal(cap.phone,'3282612548');assert.ok(cap.links.some(l=>l.url==='tel:062252489'));
 assert.equal(model.filter(model.additions,{journey:'cultura',mode:'ristoro'}).length,1);assert.ok(!model.filter(model.additions,{journey:'cultura',mode:'parchi'}).includes(cap));
});
test('Cultura: ballo, musei e parchi distinti senza trasformare i luoghi in incontri organizzati',()=>{
 const all=model.additions;
 for(const mode of ['ballo','musei','parchi']){const selected=model.filter(all,{journey:'cultura',mode});assert.equal(selected.length,mode==='parchi'?5:2);for(const r of selected){assert.ok(r.operationalAddress);assert.equal(r.sources[0].checkedAt,'2026-11-07');assert.ok(r.website.startsWith('https://'));}}
 const dance=model.filter(all,{journey:'cultura',mode:'ballo',neighborhood:'Centocelle'});assert.equal(dance.length,2);assert.equal(dance.find(r=>r.id==='social-ballo-flabart').phone,'3481158797');
 assert.ok(model.filter(all,{journey:'amicizie',mode:'territorio'}).every(r=>!['musei','parchi'].includes(r.mode)));
 assert.ok(model.filter(all,{journey:'cultura',mode:'altre'}).every(r=>!['ballo','musei','parchi'].includes(r.mode)));
 assert.match(all.find(r=>r.id==='social-villa-de-sanctis').details.join(' '),/scheda riguarda il parco/);
 assert.match(all.find(r=>r.id==='social-mausoleo-elena').details.join(' '),/condizioni e percorsi possono essere diversi/);
});
function original(){const c={window:{}};for(const file of ['socialita-data','samaritans','tirrenia-todaro'])vm.runInNewContext(fs.readFileSync(path.join(base,file+'.js'),'utf8'),c);return JSON.parse(JSON.stringify(c.window.SportelloSocialitaData.records));}
test('Socialità: 45 risorse conservate, salvo correzione Itinera QC-051',()=>{
 const r=original();assert.equal(r.length,45);
 const itinera=r.find(x=>x.id==='albo-118');assert.equal(itinera.operationalAddress,null);assert.equal(itinera.verifiedAt,'2026-11-12');assert.match(itinera.caution,/QC-051/);
 const baseline=r.map(x=>{if(x.id!=='albo-118')return x;const {verifiedAt,...old}=x;return {...old,legalAddress:null,operationalAddress:'via augusto dulceri 25',municipalities:['IV','V','VI','VII'],territoryBasis:'Ambiti di attività dichiarati nell’Albo, non Municipio della sede né copertura garantita',description:'Attività dichiarate nell’Albo civico: Attività culturali e artistiche.',caution:'Sede operativa riportata dall’export, non geocodificata. Apertura, calendario e disponibilità da confermare. Nessun rapporto di partnership COINSIEME attestato.'};});
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(baseline)).digest('hex'),'ef2089c45b7e2d4b5934ca90d28b78d773bffb275af20b269caa70f7adbb2a37');
 const before=JSON.stringify(r),all=[...r,...model.additions];assert.equal(all.length,77);assert.equal(new Set(all.map(x=>x.id)).size,77);
 assert.equal(model.filter(all,{journey:'tutte'}).length,77);assert.equal(JSON.stringify(r),before);
});
test('Socialità: percorsi distinti per attività e repertorio alfabetico',()=>{
 assert.deepEqual(model.journeys.map(j=>j.id),['amicizie','centri','sport','cultura','parchi','ballo','giochi','turismo','solidarieta','quartiere']);
 const r=original(),all=[...r,...model.additions];assert.equal(model.filter(all,{journey:'centri'}).length,16);
 for(const j of model.journeys){const selected=model.filter(all,{journey:j.id});assert.equal(new Set(selected.map(x=>x.id)).size,selected.length);assert.ok(selected.length>0);}
 const sorted=model.filter(all);assert.deepEqual(sorted.map(x=>x.name),all.map(x=>x.name).sort((a,b)=>a.localeCompare(b,'it')));
 assert.equal(model.filter(all,{journey:'sport',name:'Tirrenia'}).length,1);
});
test('Socialità: amicizie digitali distinte dalle attività locali e da gruppi non verificati',()=>{
 const all=[...original(),...model.additions];assert.equal(model.filter(all,{journey:'amicizie',mode:'app'}).length,3);
 assert.ok(model.filter(all,{journey:'amicizie',mode:'territorio'}).every(r=>r.mode!=='app'));
 assert.equal(model.filter(all,{journey:'amicizie',mode:'social'}).length,0);
 assert.equal(model.filter(all,{journey:'amicizie',mode:'app',municipio:'V'}).length,0);
 assert.equal(model.forCategories(model.additions,['vicinato']).length,4);
});
test('Socialita e vicinato: percorsi distinti, repertorio unico e nessuna risorsa persa',()=>{
 const social=model.visibleJourneys(['socialita']).map(j=>j.id),vicino=model.visibleJourneys(['vicinato']).map(j=>j.id);
 assert.deepEqual(social,['amicizie','centri','sport','cultura','parchi','ballo','giochi','turismo','solidarieta']);
 assert.deepEqual(vicino,['quartiere','spazi','reti','ascolto']);
 assert.ok(social.every(id=>!vicino.includes(id)));
 const all=[...original(),...model.additions],before=JSON.stringify(all),selected=model.forCategories(all,['vicinato']);
 assert.ok(selected.length>1);assert.ok(selected.some(r=>r.id==='samaritans-ascolto'));
 assert.ok(selected.every(r=>!r.trip&&r.mode!=='app'&&r.journey!=='giochi'&&r.mode!=='parchi'));
 for(const journey of vicino)assert.ok(model.filter(selected,{journey}).length>0,journey);
 const union=model.forCategories(all,['socialita','vicinato']);assert.equal(union.length,77);assert.equal(new Set(union.map(r=>r.id)).size,77);
 assert.equal(new Set([...model.forCategories(all,['socialita']),...selected].map(r=>r.id)).size,77);
 assert.equal(JSON.stringify(all),before);
});
test('Socialità: turismo senza barriere distinto dalle offerte non documentate',()=>{
 const all=[...original(),...model.additions],travel=model.filter(all,{journey:'turismo',mode:'senza-barriere'});
 assert.equal(travel.length,1);assert.equal(travel[0].id,'social-turismo-accessibile');assert.match(travel[0].description,/Non è un’offerta di viaggio/);
 assert.equal(model.filter(all,{journey:'turismo',mode:'gite',today:'2026-11-07'}).length,2);
 assert.match(travel[0].details.join(' '),/non garantisce/);
});
test('Turismo: quattro programmi specifici da Roma, senza posti o accessibilità presunti',()=>{
 const trips=model.additions.filter(r=>r.trip);assert.equal(trips.length,4);
 assert.equal(model.filter(trips,{journey:'turismo',mode:'soggiorni',today:'2026-11-07'}).length,2);
 for(const r of trips){assert.match(r.trip.departure,/Roma/);assert.ok(r.trip.start<=r.trip.end);assert.ok(r.trip.organizer);assert.ok(r.trip.price);assert.ok(r.trip.included);assert.ok(r.trip.accessibility);assert.equal(r.sources[0].checkedAt,'2026-11-07');assert.match(model.tripStatus(r,'2026-11-07'),/disponibilità.*da chiedere/);assert.notEqual(r.mode,'senza-barriere');}
 assert.match(trips.find(r=>r.id==='viaggio-gubbio-arezzo-20261212').trip.accessibility,/non adatto/);
});
test('Turismo: partenze trascorse o già iniziate non sono proposte come prenotabili',()=>{
 const trips=model.additions.filter(r=>r.trip),salerno=trips.find(r=>r.id==='viaggio-salerno-20261212');
 assert.equal(model.filter(trips,{journey:'turismo',today:'2027-01-01'}).length,0);
 assert.equal(model.filter(trips,{journey:'turismo',today:'2027-01-01',past:true}).length,4);
 assert.match(model.tripStatus(salerno,'2026-12-13'),/già iniziato/);assert.match(model.tripStatus(salerno,'2026-12-14'),/Data trascorsa/);
 assert.ok(model.filter(trips,{journey:'turismo',today:'2026-12-12'}).some(r=>r.id===salerno.id));
 assert.ok(!model.filter(trips,{journey:'turismo',today:'2026-12-13'}).some(r=>r.id===salerno.id));
});
test('Socialità: volontariato CRI, Protezione civile, Caritas e Sant’Egidio con fonti e limiti',()=>{
 const selected=model.filter(model.additions,{journey:'solidarieta'});assert.equal(selected.length,4);
 for(const r of selected){assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-07'&&s.url.startsWith('https://')));assert.equal(r.municipalities.length,0);assert.ok(r.details.length>=2);}
 assert.equal(selected.find(r=>r.id==='social-volontariato-caritas').phone,'0688815150');
 assert.match(selected.find(r=>r.id==='social-volontariato-protezione-civile').details.join(' '),/non intervenire autonomamente/);
 assert.match(selected.find(r=>r.id==='social-volontariato-santegidio').details.join(' '),/non è risultata consultabile/);
});
test('Socialità: filtri combinabili, ricerca nelle attività, nessun cambiamento delle categorie principali',()=>{
 const all=[...original(),...model.additions];assert.equal(model.filter(all,{journey:'solidarieta',name:'Caritas'}).length,1);
 assert.equal(model.filter(all,{journey:'amicizie',mode:'app',name:'tavoli'}).length,1);
 assert.equal(require('../anteprima-sportello/app/servizi').areas.length,9);
 assert.equal(model.filter(all,{journey:'quartiere',group:'csaq'}).every(r=>r.groups.includes('csaq')),true);
});
