const {test}=require('node:test'),assert=require('node:assert/strict');
const {prepare}=require('./publish-rassegna'),state=require('./homepage-state'),{decision}=require('./articles-editorial'),{page}=require('./build-segnalazioni-pages');
const today='2026-10-25',raw={slug:'prova',title:'Prova',summary:'Sintesi',date:'2026-10-24',visible:true,stato:'pubblica',rilevanza_home:'normale'};
const inventory=[{name:'prova.json',slug:'prova',item:raw}],fields={id_cms:'prova.json',stato:'pubblica',data_pubblicazione:raw.date,rilevanza_home:'normale'},article={...raw,...decision(fields,today)};
const news={id:'news',categoria:'Welfare e autonomia',stato:'pubblicata',data_fonte:'2026-10-24',data_pubblicazione:'2026-10-24',titolo_editoriale:'Notizia valida per autonomia',titolo_originale:'Notizia valida per autonomia',url_fonte:'https://example.org/news',fonte:'Fonte',posizione_sito:'home_normale',sintesi_editoriale:'Una sintesi.'};
function publicHtml(articles,rows,date=today){
 const s=state.publicState(articles,rows,date);
 return '<h1>Vivere meglio, insieme</h1><meta name="coinsieme-public-state" content="'+s.signature+'"><a href="/anteprima-sportello/#esplora-servizi">Servizi</a>'+[s.selection.cover,...s.selection.articles,...s.selection.news].filter(Boolean).map(x=>'<a href="'+(x.url.startsWith('/')?'https://www.coinsieme.it'+x.url:x.url)+'">'+x.title+'</a><time datetime="'+x.date+'"></time>').join('');
}
async function scenario({articleFields=fields,dataset=[],records=[],html=publicHtml([article],[]),date=today,fetcher=async()=>{throw Error('HTTP reale vietato');},items=[]}={}){
 const api=async(endpoint,method)=>{assert.equal(method,undefined,'Il controllo non deve scrivere su Airtable');return {records:endpoint.startsWith('tbldu5S3r7ZppEF1y')?[{id:'recArticle',fields:articleFields}]:records};};
 return prepare(api,{dynamicHome:true,articleInventory:inventory,today:date,fetcher,pages:[{url:'https://www.coinsieme.it/',html}],prepareSegments:async()=>({items,errors:[]}),read:()=>structuredClone(dataset),write:()=>{}});
}
test('polling dinamico: nessuna variazione non richiede deploy',async()=>assert.equal((await scenario()).count,0));
test('polling dinamico: ordine modificato senza effetto visibile non richiede deploy',async()=>assert.equal((await scenario({articleFields:{...fields,ordine_home:1}})).count,0));
test('polling dinamico: pubblicazione di un articolo nuovo',async()=>assert.ok((await scenario({html:publicHtml([],[])})).count>0));
test('polling dinamico: cambio di stato e modifica della priorita',async()=>{
 assert.ok((await scenario({articleFields:{...fields,stato:'bozza'}})).count>0);
 assert.ok((await scenario({articleFields:{...fields,rilevanza_home:'principale'}})).count>0);
});
test('polling dinamico: scadenza modifica la copertina senza cambiare la data',async()=>{
 const pin={...fields,mantieni_in_evidenza_fino_al:'2026-10-24'},previous={...raw,...decision(pin,'2026-10-24')};
 assert.ok((await scenario({articleFields:pin,html:publicHtml([previous],[],'2026-10-24')})).count>0);
});
test('polling dinamico: nuovo contenuto programmato diventa pubblico solo alla data prevista',async()=>{
 const future={...fields,data_pubblicazione:'2026-10-26'};
 assert.equal((await scenario({articleFields:future,html:publicHtml([],[])})).count,0);
 assert.ok((await scenario({articleFields:future,html:publicHtml([],[]),date:'2026-10-26'})).count>0);
});
test('polling dinamico: aggiornamento rassegna e rassegna invariata',async()=>{
 const record={id:'rec12345678901234',fields:{...news,stato:'pubblica'}};
 assert.ok((await scenario({records:[record]})).count>0);
 assert.equal((await scenario({dataset:[news],records:[{...record,fields:news}],html:publicHtml([article],[news])})).count,0);
});
test('polling dinamico: conferma notizia pendente senza deploy, pagina mancante con deploy',async()=>{
 const record={id:'rec12345678901234',fields:{...news,stato:'pubblica'}};
 const options={dataset:[news],records:[record],html:publicHtml([article],[news])};
 assert.equal((await scenario({...options,fetcher:async()=>({ok:true,text:async()=>page(record.fields,record.id)})})).count,0);
 assert.ok((await scenario({...options,fetcher:async()=>({ok:false})})).count>0);
});
test('polling dinamico: segnalazione gia online non richiede deploy, pagina mancante lo richiede',async()=>{
 const item={recordId:'rec12345678901234',publicUrl:'https://www.coinsieme.it/rassegna/rec12345678901234.html',title:news.titolo_editoriale,source:news.url_fonte};
 assert.equal((await scenario({items:[item],fetcher:async()=>({ok:true,text:async()=>page(news,item.recordId)})})).count,0);
 assert.ok((await scenario({items:[item],fetcher:async()=>({ok:false})})).count>0);
});
test('polling dinamico: errore di rete non genera un count che autorizza il deploy',async()=>{
 const record={id:'rec12345678901234',fields:{...news,stato:'pubblica'}};
 await assert.rejects(scenario({dataset:[news],records:[record],html:publicHtml([article],[news]),fetcher:async()=>{throw Error('rete indisponibile');}}),/rete indisponibile/);
});
