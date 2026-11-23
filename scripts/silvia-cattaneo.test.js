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
test('Il richiamo News usa il record autorevole e rimanda al contributo firmato',()=>{
 const items=require('../content/rassegna/notizie-esterne.json');
 const matches=items.filter(x=>x.notizie?.includes('recishR8d0NuvlnDj'));
 assert.equal(matches.length,1);
 const item=matches[0];
 assert.equal(item.url_fonte,'https://www.coinsieme.it/articoli/'+article.slug+'/');
 assert.equal(item.titolo_editoriale,article.title);
 assert.match(item.fonte,/Silvia Cattaneo/);
 assert.equal(require('./publish-segnalazioni').publicItem({id:'recishR8d0NuvlnDj',fields:item}).url_fonte,item.url_fonte);
});
