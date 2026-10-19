const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const casaRoot = path.join(root, 'casa-che-si-prende-cura');
const html = fs.readFileSync(path.join(casaRoot, 'index.html'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(casaRoot, 'house-data.js'), 'utf8'), context);
const data = context.window.CASA_PREVIEW_DATA;

test('la pagina pubblica conserva struttura e navigazione accessibile', () => {
  assert.equal((html.match(/class="solution(?: featured)?"/g) || []).length, 33);
  assert.equal((html.match(/class="room-section(?: alt)?"/g) || []).length, 7);
  assert.equal((html.match(/class="path-action"/g) || []).length, 6);
  assert.equal((html.match(/class="hotspot /g) || []).length, 12);
  assert.match(html, /Scopri come funziona/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /noindex|Anteprima riservata|\.\.\/\.\.\//);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.coinsieme\.it\/casa-che-si-prende-cura\/">/);
});

test('le dodici immagini hanno file, dimensioni e testi alternativi', () => {
  const images = Object.values(data.assets.cardImages);
  assert.equal(images.length, 12);
  for (const image of images) {
    assert.ok(image.alt.trim(), `Alt mancante per ${image.src}`);
    assert.ok(image.width > 0 && image.height > 0, `Dimensioni mancanti per ${image.src}`);
    assert.ok(fs.existsSync(path.join(casaRoot, image.src)), `File mancante: ${image.src}`);
  }
  assert.match(data.assets.solutionImageNote, /non raffigura un prodotto verificato da COINSIEME/);
});

test('l’immagine introduttiva della Casa è distinta da quella della homepage', () => {
  const hero = html.match(/<figure class="casa-hero-media">[\s\S]*?<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/);
  assert.ok(hero, 'Immagine introduttiva non trovata');
  assert.equal(hero[1], 'assets/casa-domotica-tablet.webp');
  assert.match(hero[2], /tablet/i);
  assert.ok(fs.existsSync(path.join(casaRoot, hero[1])), `File mancante: ${hero[1]}`);
  assert.doesNotMatch(hero[0], /domotica_hero_autonomia/);
});

test('la Casa e collegata senza creare sezioni duplicate', () => {
  for (const file of ['index.html', 'domotica.html', 'persone-famiglie.html']) {
    const page = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(page, /href="\/casa-che-si-prende-cura\/"/, `Collegamento mancante in ${file}`);
  }
  assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /https:\/\/www\.coinsieme\.it\/casa-che-si-prende-cura\//);
});

test('tutti i workflow Pages includono la cartella pubblica', () => {
  for (const file of ['build-articoli.yml', 'sync-rassegna.yml']) {
    const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', file), 'utf8');
    assert.match(workflow, /sportello casa-che-si-prende-cura;/, `Cartella non distribuita da ${file}`);
  }
});
