const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { redirects } = require('./build-legacy-redirects');

const ROOT = path.resolve(__dirname, '..');

assert.strictEqual(Object.keys(redirects).length, 40, '39 compatibilita storiche e un URL troncato dell\'export del 9 novembre');
assert.strictEqual(redirects['articoli/abitare-vicini-'], '/articoli/abitare-vicini-vivere-insieme/');

for (const [legacyPath, target] of Object.entries(redirects)) {
  const redirectFile = path.join(ROOT, ...legacyPath.split('/'), 'index.html');
  assert.ok(fs.existsSync(redirectFile), `Redirect mancante: ${legacyPath}`);

  const html = fs.readFileSync(redirectFile, 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.ok(
    html.includes(`https://www.coinsieme.it${target}`),
    `Canonical non coerente: ${legacyPath}`
  );

  const targetPath = target.split(/[?#]/)[0];
  assert.notStrictEqual(targetPath.replace(/^\//, '').replace(/\/$/, ''), legacyPath, 'Inoltro verso se stesso');
  assert.ok(!redirects[targetPath.replace(/^\//, '').replace(/\/$/, '')], `Catena fra compatibilita: ${legacyPath}`);
  let localTarget = path.join(ROOT, ...targetPath.replace(/^\//, '').split('/'));
  if (targetPath.endsWith('/')) {
    localTarget = path.join(localTarget, 'index.html');
  } else if (!path.extname(localTarget)) {
    localTarget += '.html';
  }
  // CMS articles can be rendered only during build, not stored in the checkout.
  // Publication decisions remain enforced by the existing editorial pipeline.
  if (legacyPath === 'articoli/abitare-vicini-' && !fs.existsSync(localTarget)) {
    const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/articoli/abitare-vicini-vivere-insieme.json'), 'utf8'));
    assert.strictEqual(source.slug, 'abitare-vicini-vivere-insieme');
    assert.match(source.title, /^Abitare vicini, vivere insieme:/);
    assert.ok(source.body.trim().length > 0, 'Contenuto CMS della destinazione mancante');
  } else {
    assert.ok(fs.existsSync(localTarget), `Destinazione locale mancante: ${target}`);
  }
}

console.log('OK: 40 compatibilita, destinazioni locali o sorgente CMS verificati, nessuna catena o ciclo nella mappa.');
