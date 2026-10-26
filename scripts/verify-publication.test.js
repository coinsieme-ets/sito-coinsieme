const {test} = require('node:test');
const assert = require('node:assert/strict');
const {inspectPage,sourceUrl,verifyPublication,correctionFields,fetchPublicPages} = require('./verify-publication');
const card = '<article><h3><a href="https://example.org/story?a=1&amp;b=2">Titolo &amp; testo</a></h3></article>';
test('requires actual heading, exact source and title', () => {
  assert.ok(inspectPage(card,'https://example.org/story?a=1&b=2','Titolo & testo'));
  assert.equal(inspectPage(card,'https://example.org/other','Titolo & testo'),false);
  assert.equal(inspectPage(card,'https://example.org/story?a=1&b=2','Altro titolo'),false);
});
test('ignores hidden sections, comments and scripts', () => {
  for (const html of ['<!--'+card+'-->','<script>'+card+'</script>','<section style="display: none;">'+card+'</section>']) {
    assert.equal(inspectPage(html,'https://example.org/story?a=1&b=2','Titolo & testo'),false);
  }
});
test('Notizie status or a fake hash is not proof of publication', () => {
  assert.deepEqual(verifyPublication([{url:'https://www.coinsieme.it/',html:'<html></html>'}],
    {stato:'pubblicata',url_fonte:'https://example.org/story',titolo_editoriale:'Titolo'}),{online:false,publicUrl:null});
});
test('offline correction clears both publication metadata fields', () => {
  assert.deepEqual(correctionFields({stato:'pubblicato',data_pubblicazione:'2026-09-08',url_pubblicato:'https://www.coinsieme.it/#fake'},{online:false}),
    {stato:'da_pubblicare',data_pubblicazione:null,url_pubblicato:null});
});
test('failed or unexpected public response must not trigger offline corrections', async () => {
  await assert.rejects(fetchPublicPages(async()=>({ok:false,status:503})),/inconclusiva/);
  await assert.rejects(fetchPublicPages(async()=>({ok:true,status:200,text:async()=>'<html>error</html>'})),/inattesa/);
});

test('public page validation retains legacy homepage and archive checks', async () => {
  const pages=await fetchPublicPages(async url=>({ok:true,status:200,text:async()=>url.endsWith('articoli.html')?
    '<html>COINSIEME archivio</html>':'<html>COINSIEME<!-- CMS_RASSEGNA_SECTION_END --></html>'}));
  assert.equal(pages.length,2);
});

test('public page validation accepts the production renderer but rejects incomplete or commented layouts', async () => {
  const fixture=await require('./test-support/homepage-fixture').productionFixture();
  const respond=home=>async url=>({ok:true,status:200,text:async()=>url.endsWith('articoli.html')?'<html>COINSIEME archivio</html>':home});
  try {
    assert.ok(!fixture.html.includes('CMS_RASSEGNA_SECTION_END'));
    assert.equal((await fetchPublicPages(respond(fixture.html))).length,2);
    for(const broken of [
      fixture.html.replace('name="coinsieme-public-state"','name="other-state"'),
      fixture.html.replace('id="updates-title"','id="missing-updates"'),
      fixture.html.replace('id="projects-title"','id="missing-projects"'),
      fixture.html.replaceAll('href="/anteprima-sportello/#esplora-servizi"','href="/sportello/"'),
      '<html>COINSIEME<!--'+fixture.html+'--></html>'
    ])await assert.rejects(fetchPublicPages(respond(broken)),/Struttura sito inattesa/);
    await assert.rejects(fetchPublicPages(async url=>({ok:true,status:200,text:async()=>url.endsWith('articoli.html')?
      '<html>COINSIEME pagina senza archivio valido</html>'.replace('archivio','catalogo'):fixture.html})),/Struttura sito inattesa/);
  } finally {fixture.cleanup();}
});

test('production homepage validation allows pending news preparation without duplicates or premature confirmation', async () => {
  const fixture=await require('./test-support/homepage-fixture').productionFixture();
  const {prepare,confirmNews}=require('./publish-rassegna');
  const {page}=require('./build-segnalazioni-pages');
  const today=require('./home-feature').todayRome();
  let dataset=[],writes=0;
  const record={id:'rec12345678901234',fields:{id:'fixture-pending',stato:'pubblica',data_fonte:today,data_pubblicazione:today,
    titolo_editoriale:'Notizia in attesa di pubblicazione',titolo_originale:'Notizia in attesa di pubblicazione',
    url_fonte:'https://example.org/pending',fonte:'Fonte simulata',categoria:'Welfare e autonomia',sintesi_editoriale:'Solo test locale.'}};
  const api=async(endpoint,method,body)=>{
    if(method==='PATCH'){writes++;record.fields={...record.fields,...body.fields};return structuredClone(record);}
    assert.ok(!method||method==='GET');
    if(endpoint==='tblonsfQ2mnaelCAn/'+record.id)return structuredClone(record);
    return {records:endpoint.startsWith('tblonsfQ2mnaelCAn')?[structuredClone(record)]:[]};
  };
  try {
    const pages=await fetchPublicPages(async url=>({ok:true,status:200,text:async()=>url.endsWith('articoli.html')?'<html>COINSIEME archivio</html>':fixture.html}));
    const options={pages,dynamicHome:true,articleInventory:[],today,prepareSegments:async()=>({items:[],errors:[]}),
      read:()=>structuredClone(dataset),write:items=>{dataset=structuredClone(items);}};
    const manifest=await prepare(api,options);
    assert.equal(manifest.count,1);assert.equal(manifest.news.length,1);assert.equal(writes,0);
    await prepare(api,options);assert.equal(dataset.length,1);assert.equal(writes,0);
    const failed=await confirmNews(api,manifest,{fetcher:async()=>({ok:false}),retries:1});
    assert.equal(failed[0].status,'not_verified_pending');assert.equal(writes,0);
    const fetcher=async()=>({ok:true,text:async()=>page(record.fields,record.id)});
    assert.equal((await confirmNews(api,manifest,{fetcher,retries:1}))[0].status,'verified');
    assert.equal(writes,1);
    assert.equal((await confirmNews(api,manifest,{fetcher,retries:1}))[0].status,'skipped_changed_or_published');
    assert.equal(writes,1);
  } finally {fixture.cleanup();}
});
test('extracts source without changing stored url_articolo', () => {
  assert.equal(sourceUrl('La notizia https://www.example.org/a'),'https://www.example.org/a');
});
test('Notizie lookup requests source, id, title and state together', async () => {
  const {fetchAllNotizieUrls} = require('./process-segnalazioni-maurizio');
  const original = global.fetch;
  try {
    global.fetch = async url => {
      assert.deepEqual(new URL(url).searchParams.getAll('fields[]'), ['url_fonte','id','titolo_editoriale','stato']);
      return {ok:true,json:async()=>({records:[{id:'recExample',fields:{id:'article',url_fonte:'https://example.org/a',titolo_editoriale:'A',stato:'pubblicata'}}]})};
    };
    const records = await fetchAllNotizieUrls('test','appTest');
    assert.equal(records[0].url_fonte,'https://example.org/a');
  } finally { global.fetch = original; }
});
test('single-record mode excludes other submissions and defers every state write', async () => {
  const {processSegnalazioniMaurizio, normalizeUrl} = require('./process-segnalazioni-maurizio');
  const fs = require('node:fs');
  const originalWrite = fs.writeFileSync, originalFetch = global.fetch;
  try {
    fs.writeFileSync = () => {};
    global.fetch = async () => {throw new Error('Unexpected network/write before deployment');};
    const source='https://example.org/selected';
    const result=await processSegnalazioniMaurizio({
      token:'test',recordId:'recSelected',deferPublicationConfirmation:true,
      mockSegnalazioni:[{id:'recOther',fields:{url_articolo:'https://example.org/other',stato:'da_pubblicare'}},
        {id:'recSelected',fields:{url_articolo:source,stato:'da_pubblicare'}}],
      mockNotizie:[{id:'newsSelected',normalizedUrl:normalizeUrl(source),url_fonte:source,titolo_editoriale:'Selected',stato:'pubblica'}]
    });
    assert.equal(result.auditLog.segnalazioni.length,1);
    assert.equal(result.auditLog.segnalazioni[0].recordId,'recSelected');
    assert.equal(result.auditLog.segnalazioni[0].statoVerificato,undefined);
  } finally {fs.writeFileSync=originalWrite;global.fetch=originalFetch;}
});
test('single publication normalizes the Airtable fields envelope correctly', () => {
  const {normalizeTarget}=require('./publish-single-segnalazione');
  const item=normalizeTarget({id:'recTarget',fields:{stato:'pubblica',data_fonte:'2026-09-10',
    titolo_editoriale:'Sport e inclusione',url_fonte:'https://example.org/sport',fonte:'Fondazione'}});
  assert.equal(item.titolo_editoriale,'Sport e inclusione');
  assert.equal(item.airtableRecordId,'recTarget');
});
