const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),data=require('../anteprima-sportello/app/medici-data');
const url='https://www.coinsieme.it/rassegna/notizie-utili/influenza-2026-2027-prenotare.html',recordId='recKtSxFzXRghhNiX',title='Influenza 2026-2027: vaccinarsi è importante, sapere come prenotare lo è altrettanto';
test('CupMedico: piattaforma distinta da CUP regionale, nessun medico o categoria inventati',()=>{
 assert.equal(data.bookingPlatform.url,'https://www.cupmedico.it/');assert.match(data.bookingPlatform.description,/Non è il CUP regionale/);assert.match(data.bookingPlatform.access,/modalità alternativa/);assert.match(data.bookingPlatform.caution,/non attesta disponibilità/);assert.deepEqual(data.doctors,[]);assert.equal(data.offices.length,4);
 const script=fs.readFileSync(path.join(root,'anteprima-sportello/app/medici.js'),'utf8');assert.equal((script.match(/id='cupmedico-medico-famiglia'/g)||[]).length,1);assert.match(script,/make\('summary',platform.name\)/);assert.doesNotMatch(script,/fetch\(|localStorage/);
});
test('Vaccini: associazione reale al record e compatibilità con il verificatore esistente',()=>{
 const html=fs.readFileSync(path.join(root,new URL(url).pathname),'utf8');assert.ok(require('./publish-segnalazioni').verifyPage(html,{recordId,publicUrl:url,source:url,title}));assert.ok(!require('./publish-segnalazioni').verifyPage(html,{recordId:'recXXXXXXXXXXXXXX',publicUrl:url,source:url,title}));
 assert.ok(require('./news-kind').isUsefulNews({fonte:'COINSIEME · Notizia utile',url_fonte:url}));assert.match(html,/tel:800118800/);assert.match(html,/non va considerato automaticamente/);assert.match(html,/specifico studio/);assert.match(html,/Care Home/);assert.doesNotMatch(html,/<form|<input|<iframe|<img/);assert.match(html,/indicazioni d’uso e valutazioni cliniche/);
});
