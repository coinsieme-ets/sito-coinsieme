const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../casa-che-si-prende-cura/index.html'),'utf8');
function card(id){return html.split(`<article id="${id}"`)[1].split('</article>')[0];}
test('voce: benefici concreti, IA distinta e comando alternativo',()=>{
 const text=card('comandi-vocali');
 for(const term of ['voce al posto delle mani','senza digitare','Amazon Echo','smart speaker Google','Alexa+','intelligenza artificiale generativa','un comando fisico accessibile','possono essere inesatte'])assert.ok(text.includes(term),term);
});
test('contatto: Drop In autorizzato, non telesoccorso o IA necessaria',()=>{
 const text=card('videocomunicazione');
 for(const term of ['configurati e autorizzati','videocamera abilitata','revocarle','conviventi e visitatori','non sostituisce un servizio di telesoccorso','non richiede di per sé l’IA generativa','Verifica del 9 novembre 2026'])assert.ok(text.includes(term),term);
 assert.ok(!text.includes('<iframe'));
});
test('integrazione: nessuna scheda duplicata, titoli e simulazioni preservati',()=>{
 assert.equal((html.match(/class="solution(?: featured)?"/g)||[]).length,37);
 for(const id of ['comandi-vocali','videocomunicazione'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
 for(const title of ['Comandi vocali e pulsanti semplificati','Videocomunicazione semplificata'])assert.ok(html.includes(`<h3>${title}</h3>`));
 assert.ok(html.includes('href="#prova-aiuto"'));
});
test('pianta: nuovi punti collegati alle schede e SOS esistente senza duplicazione',()=>{
 const vm=require('node:vm'),context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../casa-che-si-prende-cura/house-data.js'),'utf8'),context);
 const data=context.window.CASA_PREVIEW_DATA;
 assert.equal((html.match(/class="hotspot /g)||[]).length,15);
 for(const id of ['voce','videocamera','telesoccorso']){
  assert.equal((html.match(new RegExp(`data-solution="${id}"`,'g'))||[]).length,1);
  const s=data.solutions[id];assert.ok(s);assert.ok(html.includes('id="'+s.room.slice(1)+'"'));
 }
 assert.equal(data.solutions.voce.secondaryLink,'#videocomunicazione');
 assert.ok(data.solutions.telesoccorso.how.includes('Verisure'));
 assert.ok(data.solutions.videocamera.limits.includes('non garantisce'));
 for(const id of ['voce','videocamera'])assert.ok(fs.existsSync(path.join(__dirname,'../casa-che-si-prende-cura',data.solutions[id].image)));
 assert.ok(card('prova-aiuto').includes('dispositivo specifico da portare al collo non è qui confermato'));
 assert.ok(html.includes('id="videocamere"'));
});
test('bagno: WC bidet distinto dal rialzo, dotazioni non universali',()=>{
 const text=card('wc-bidet');
 for(const term of ['senza trasferirsi al bidet','non presenti su tutti','non è compatibile con qualunque WC','non garantisce da solo','Può restare necessario un aiuto personale'])assert.ok(text.includes(term),term);
 assert.ok(html.includes('<h3>Rialzo WC o telaio</h3>'));
 assert.ok(html.includes('<h3>Vasca con sportello</h3>'));
 assert.equal((html.match(/id="wc-bidet"/g)||[]).length,1);
});
