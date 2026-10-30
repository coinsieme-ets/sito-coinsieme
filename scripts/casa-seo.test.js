const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'casa-che-si-prende-cura/index.html'), 'utf8');

test('Casa: metadati coerenti, canonical stabile e nessun blocco di indicizzazione', () => {
  assert.match(html, /<title>Casa intelligente e domotica assistiva \| COINSIEME<\/title>/);
  assert.match(html, /<h1 id="casa-title">La casa che si prende cura<\/h1>/);
  assert.match(html, /name="description" content="[^"]*33 schede e tre simulazioni/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.coinsieme\.it\/casa-che-si-prende-cura\/"/);
  assert.doesNotMatch(html, /noindex/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'], 'WebPage');
  assert.equal(schema.publisher['@type'], 'Organization');
  assert.equal(schema.url, 'https://www.coinsieme.it/casa-che-si-prende-cura/');
  assert.equal(schema.inLanguage, 'it-IT');
  assert.ok(!schema.datePublished && !schema.dateModified);
});

test('Casa: accessi nativi alle schede e alle tre prove, senza contenuti duplicati', () => {
  for (const id of ['prova-luci', 'prova-tapparelle', 'prova-aiuto']) {
    assert.match(html, new RegExp('href="#' + id + '"'));
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1);
  }
  assert.match(html, /href="#tutta-la-casa">Leggi le 33 schede/);
  assert.match(html, /non controllano dispositivi e non inviano richieste/);
  assert.equal((html.match(/class="solution(?: featured)?"/g) || []).length, 33);
  assert.equal((html.match(/class="hotspot /g) || []).length, 12);
  assert.equal((html.match(/class="room-section(?: alt)?"/g) || []).length, 7);
});

test('Casa: approfondimenti contestuali esistenti e workflow preservano la cartella', () => {
  for (const slug of ['aprire-senza-chiavi-rispondere-al-citofono-da-lontano', 'dal-pulsante-sul-polso-al-telesoccorso']) {
    assert.ok(html.includes('../articoli/' + slug + '/'));
    assert.ok(fs.existsSync(path.join(root, 'content/articoli', slug + '.json')));
  }
  for (const name of ['build-articoli.yml', 'sync-rassegna.yml']) {
    const yaml = fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8');
    assert.match(yaml, /node scripts\/build-cms.js/);
    assert.match(yaml, /sportello casa-che-si-prende-cura;/);
    assert.match(yaml, /node scripts\/check-pages-sportello.js _site/);
  }
});

test('i rimandi dagli articoli sono nei sorgenti, non soltanto negli HTML generati', () => {
  const sources = [
    ['aprire-senza-chiavi-rispondere-al-citofono-da-lontano', 'ingresso'],
    ['dal-pulsante-sul-polso-al-telesoccorso', 'prova-aiuto']
  ];
  for (const [slug, anchor] of sources) {
    const item = JSON.parse(fs.readFileSync(path.join(root, 'content/articoli', slug + '.json'), 'utf8'));
    const target = 'https://www.coinsieme.it/casa-che-si-prende-cura/#' + anchor;
    assert.equal(item.body.split(target).length - 1, 1);
    assert.ok(html.includes('id="' + anchor + '"'));
    assert.equal(item.slug, slug);
  }
});
