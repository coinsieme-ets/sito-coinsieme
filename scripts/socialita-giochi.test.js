const {test}=require('node:test');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const model=require('../anteprima-sportello/app/socialita');
test('Giochi: le 22 aggiunte precedentemente pubblicate rimangono identiche',()=>{
 const previous=model.additions.filter(r=>r.journey!=='giochi');
 assert.equal(previous.length,22);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(previous)).digest('hex'),'481f925b3de6ac3d6c558839c95409fdfd637c473262a9d5babaf87335e1b0ba');
});
test('Giochi: quattro risorse uniche e tre modalita distinte',()=>{
 const all=model.filter(model.additions,{journey:'giochi'});
 assert.equal(all.length,4);assert.equal(new Set(all.map(r=>r.id)).size,4);
 for(const [mode,total] of [['presenza',2],['ludoteche',1],['online',1]])assert.equal(model.filter(all,{journey:'giochi',mode}).length,total);
 for(const r of all){assert.ok(r.sources.every(s=>s.checkedAt==='2026-11-08'&&s.url.startsWith('https://')));assert.match(r.caution,/nessuna partnership/);}
 assert.equal(model.filter(all,{journey:'giochi',municipio:'V'})[0].id,'social-giochi-cemea');
 assert.match(all.find(r=>r.mode==='ludoteche').description,/4 a 11 anni/);
});
test('Giochi online: quattro collegamenti, ricerca alternativa e cautele sui costi',()=>{
 const [r]=model.filter(model.additions,{journey:'giochi',mode:'online'});
 assert.equal(r.links.length,4);assert.equal(r.municipalities.length,0);
 for(const name of ['burraco','scopa','tressette','tresette','briscola'])assert.equal(model.filter([r],{name}).length,1);
 const text=r.details.join(' ');for(const pattern of [/16 anni/,/pubblicità/,/rinnovarsi automaticamente/,/account/,/non è convertibile/,/non propone scommesse/])assert.match(text,pattern);
});
