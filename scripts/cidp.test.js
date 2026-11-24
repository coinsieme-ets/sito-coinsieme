'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {additions,filter}=require('../anteprima-sportello/app/socialita');
test('CIDP: risorsa nazionale unica, dati non confermati e nessuna sede presunta',()=>{
 const matches=additions.filter(x=>x.id==='social-cidp-italia');assert.equal(matches.length,1);
 const r=matches[0];assert.equal(r.email,'info@cidp.it');assert.equal(r.operationalAddress,null);assert.equal(r.phone,null);assert.deepEqual(r.municipalities,[]);
 assert.match(r.details.join(' '),/In attesa di conferma dati/);
 assert.match(r.links[1].label,/Fai Luce sulla CIDP/);
 assert.equal(filter(additions,{journey:'solidarieta',term:'CIDP'}).filter(x=>x.id===r.id).length,1);
});
