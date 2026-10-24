const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),base=path.join(root,'anteprima-sportello');
test('collaudo: percorso autonomo, privato e senza riferimenti al Quartiere',()=>{
  const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
  assert.match(html,/noindex,nofollow/);assert.match(html,/connect-src 'none'/);
  assert.match(html,/https:\/\/www.coinsieme.it\/anteprima-sportello\//);
  assert.match(html,/Versione di collaudo/);
  assert.doesNotMatch(html,/quartiere-che-si-prende-cura|\/sportello\//);
  for(const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)){
    const file=match[1].split(/[?#]/)[0];
    assert.ok(fs.existsSync(path.join(root,file)),file);
  }
  for(const file of ['index.html','domotica.html','persone-famiglie.html','casa-che-si-prende-cura/index.html','sportello/index.html']){
    assert.doesNotMatch(fs.readFileSync(path.join(root,file),'utf8'),/\/anteprima-sportello\//);
  }
});
test('collaudo: cataloghi completi, correzioni territoriali e nessuna richiesta remota',()=>{
  const context={window:{}};vm.createContext(context);
  for(const name of ['consegne-data.js','mobilita-data.js','socialita-data.js']){
    vm.runInContext(fs.readFileSync(path.join(base,'app',name),'utf8'),context);
  }
  const data=context.window.SportelloConsegneData;
  assert.equal(data.records.length,17);
  const pending=data.pending.filter(r=>/Peppe|Cotto e Mangiato/.test(r.name));
  assert.equal(pending.length,2);
  for(const r of pending){assert.equal(r.statusLabel,'Servizio di consegna da riconfermare');assert.equal(r.deliveryCoverageVerified,false);assert.equal(r.deliveryAreas.length,0);}
  for(const name of fs.readdirSync(path.join(base,'app'))){
    const js=fs.readFileSync(path.join(base,'app',name),'utf8');
    assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  }
  const catalog=require('../anteprima-sportello/app/servizi');
  assert.equal(catalog.areas.length,9);assert.equal(catalog.resources.length,40);
  const {choose}=require('../anteprima-sportello/app/consegne');
  assert.equal(choose(data,{channel:'telefono'}).length,2);
  assert.equal(choose(data,{query:'Peppe'}).length,0);
});
