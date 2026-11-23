'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const article=require('../content/articoli/partecipare-alle-scelte-anche-quando-serve-aiuto.json');
test('Il contributo di Silvia conserva firma, sei paragrafi e autonomia editoriale',()=>{
 assert.equal(article.author,'Silvia Cattaneo');
 assert.equal(article.rilevanza_home,'normale');
 assert.equal(article.body.split('\n\n**Silvia Cattaneo**')[0].split('\n\n').length,6);
 assert.match(article.body,/purché entrambe siano davvero disponibili/);
 assert.match(article.body,/è meglio non attribuire una preferenza per comodità/);
 assert.match(article.body,/rispettare queste possibilità richiede attenzione e tempo/);
 assert.match(article.body,/non costituisce una valutazione dei libri/);
 assert.doesNotMatch(article.body,/@gmail\.com|Disponibilità a concordare/);
 assert.equal(article.image,'');
});
