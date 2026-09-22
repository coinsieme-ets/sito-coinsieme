const {test}=require('node:test');
const assert=require('node:assert/strict');
const {displayDate,schemaDates}=require('./article-date');
test('existing publication dates unchanged',()=>{assert.deepEqual(displayDate({date:'2024-01-01'}),{date:'2024-01-01',label:'1 gennaio 2024'});assert.equal(schemaDates({date:'2024-01-01'}),'"datePublished": "2024-01-01",');});
test('unverified old date hidden; explicit revision shown and described as modified',()=>{const item={date:'2024-01-01',date_verified:false,updated_at:'2026-09-22'};assert.deepEqual(displayDate(item),{date:'2026-09-22',label:'Aggiornato il 22 settembre 2026'});assert.equal(schemaDates(item),'"dateModified": "2026-09-22",');assert.equal(item.date,'2024-01-01');});
test('unverified date without revision stays hidden',()=>{assert.equal(displayDate({date:'2024-01-01',date_verified:false}).date,'');assert.equal(schemaDates({date:'2024-01-01',date_verified:false}),'');});
test('invalid revision is rejected',()=>{for(const value of ['2026-02-30','today','<script>'])assert.throws(()=>displayDate({updated_at:value}),/non valida/);});
