'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../anteprima-sportello/app/servizi'),engine=require('../anteprima-sportello/app/orientamento');
const item=require('../anteprima-sportello/app/accessibilita-spazi')[0];
test('Connessioni servizi: scheda unica privata, categorie esistenti e reperibilita trasversale',()=>{
 assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,58);
 assert.equal(catalog.sharedResources.length,1);assert.equal(catalog.isVerifiedResource(item),true);
 for(const ids of [['digitale'],['mobilita'],['digitale','mobilita'],['digitale','mobilita','domicilio']]){
  const found=engine.chooseHomeResources(ids,catalog).filter(r=>r.id===item.id);assert.equal(found.length,1);
  const groups=engine.groupServiceResources(found,ids,catalog);assert.equal(groups.length,1);
  assert.equal(groups[0].label,ids.includes('digitale')?'Barriere architettoniche e percorsi accessibili':'Accessibilità degli spazi e dei servizi');
 }
 assert.equal(engine.chooseHomeResources(['diritti'],catalog).some(r=>r.id===item.id),false);
 assert.equal(item.privatePaid,true);assert.match(item.providerType,/privato a pagamento/);
});
test('Connessioni servizi: dati confermati e limiti territoriali, economici e di disponibilita',()=>{
 assert.match(item.zone,/Sede a Roma, Piazza Carlo Magno 21/);assert.match(item.zone,/singolo territorio/);
 assert.equal(item.address,'Piazza Carlo Magno 21, 00162 Roma');assert.equal(item.phones[0].number,'0692915394');assert.equal(item.emails[0].address,'info@connessionisociali.it');
 assert.equal(item.costs,'Le condizioni economiche sono concordate direttamente con Connessioni Sociali in relazione al servizio di consulenza, al progetto o al percorso formativo richiesto.');
 assert.match(item.notes.join(' '),/confermate direttamente dall’organizzazione/);assert.match(item.notes.join(' '),/online in diretta/);
 assert.match(item.notes.join(' '),/non certifica/);assert.match(item.notes.join(' '),/Casi progettuali, distinti dai servizi/);
 assert.match(item.availability,/non verificati/);assert.equal(item.verifiedAt,'2026-11-13');
 assert.doesNotMatch(JSON.stringify(item),/tel:|Andrea Venuto/);
 for(const source of item.sources){assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.checkedAt,source.url==='https://www.connessionisociali.it/'?'2026-11-13':'2026-11-12');}
});
test('Connessioni servizi: rilascio separato senza link al futuro articolo',()=>{
 assert.equal(item.links.some(l=>l.url.startsWith('/articoli/')||l.url.startsWith('/preview/')),false);
 assert.ok(item.links.some(l=>l.url==='/casa-che-si-prende-cura/'));
 const entries=require('./search-catalog').build();
 assert.equal(entries.filter(r=>r.title===item.name).length,1);
 assert.equal(entries.some(r=>r.url.includes('/articoli/roma-est-accessibilita-percorso-quotidiano/')),false);
});
