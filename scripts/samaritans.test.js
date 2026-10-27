'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const resource=require('../anteprima-sportello/app/samaritans');
const {filter,forCategories}=require('../anteprima-sportello/app/socialita');
test('Samaritans: unico record condiviso dai due percorsi',()=>{
 const data=[{id:'other',name:'Altro',groups:['enti'],municipalities:['V'],fields:[]},resource];
 for(const ids of [['socialita'],['vicinato'],['vicinato','socialita']])assert.equal(forCategories(data,ids).filter(r=>r.id===resource.id).length,1);
 assert.equal(forCategories(data,['vicinato']).length,1);
 assert.equal(forCategories(data,['salute']).length,0);
});
test('Samaritans: ricerca, ambito e Municipi telefonici, nessuna sede inventata',()=>{
 for(const municipio of ['IV','V','VI','VII'])assert.equal(filter([resource],{name:'samaritans',group:'volontariato',municipio}).length,1);
 assert.equal(filter([resource],{name:'ascolto',field:'Ascolto e sostegno emotivo'}).length,1);
 assert.equal(resource.seatMunicipio,null);assert.equal(resource.phone,'0677208977');
 assert.match(resource.details.join(' '),/13:00.*22:00/);assert.match(resource.caution,/Nessuna partnership/);
});
test('Samaritans: caricamento ripetuto non duplica il catalogo',()=>{
 const context={window:{SportelloSocialitaData:{records:[]}}};vm.createContext(context);
 const js=fs.readFileSync('anteprima-sportello/app/samaritans.js','utf8');vm.runInContext(js,context);vm.runInContext(js,context);
 assert.equal(context.window.SportelloSocialitaData.records.length,1);
});
