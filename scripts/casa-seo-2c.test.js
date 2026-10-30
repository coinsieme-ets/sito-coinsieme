const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'casa-che-si-prende-cura/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'casa-che-si-prende-cura/casa.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'casa-che-si-prende-cura/house-data.js'), 'utf8'), context);
const data = context.window.CASA_PREVIEW_DATA;

test('2C: titoli editoriali invariati e spiegazioni iniziali senza nuovi campi SEO', () => {
  const sources = [
    ['aprire-senza-chiavi-rispondere-al-citofono-da-lontano', 'Aprire senza chiavi, rispondere al citofono da lontano', 'Una serratura smart, o serratura intelligente'],
    ['dal-pulsante-sul-polso-al-telesoccorso', 'Dal pulsante sul polso al telesoccorso: modi diversi per chiedere aiuto da casa', '«Salvavita anziani» è un’espressione generica']
  ];
  for (const [slug, title, introduction] of sources) {
    const item = JSON.parse(fs.readFileSync(path.join(root, 'content/articoli', slug + '.json'), 'utf8'));
    assert.equal(item.title, title);
    assert.equal(item.slug, slug);
    assert.ok(item.body.split('\n\n')[1].startsWith(introduction));
    assert.ok(!Object.hasOwn(item, 'seo_title') && !Object.hasOwn(item, 'meta_title'));
    assert.ok(item.body.includes('https://www.coinsieme.it/casa-che-si-prende-cura/#'));
  }
});

test('2C: denominazioni coerenti con simulazione e percorso guidato', () => {
  assert.match(html, /<h3>Tapparelle elettriche e tende motorizzate<\/h3>/);
  assert.match(html, /<h3>Comandi vocali e pulsanti semplificati<\/h3>/);
  assert.equal(data.solutions.tapparelle.title, 'Tapparelle elettriche e tende motorizzate');
  assert.ok(js.includes("title: '" + data.solutions.tapparelle.title + "', kind: 'blind'"));
  assert.ok(data.paths.fatica.terms.includes('Comandi vocali'));
  assert.ok(data.paths.condivisione.terms.includes('Comandi vocali'));
  for (const title of Object.keys(data.assets.cardImages)) assert.ok(html.includes('<h3>' + title + '</h3>'), title);
  assert.equal((html.match(/class="solution(?: featured)?"/g) || []).length, 33);
  assert.equal((js.match(/kind: '(?:light|blind|help)'/g) || []).length, 3);
});

test('2C: sbloccare e muovere la porta restano distinti, nessun servizio garantito', () => {
  assert.match(html, /<h3>Motorizzazione della porta<\/h3>/);
  assert.doesNotMatch(html, /<h3>Serratura smart<\/h3>/);
  assert.match(html, /la motorizzazione del battente è una funzione distinta/);
  assert.match(html, /<h3>Chiamata di aiuto e telesoccorso<\/h3>/);
  assert.match(html, /«Salvavita anziani» è un’espressione generica/);
  assert.match(html, /servono tasti fisici, privacy chiara e continuità operativa/);
  assert.match(html, /apertura manuale di emergenza e installazione qualificata/);
  assert.match(js, /nessun soccorso confermato/);
});
