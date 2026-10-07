const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { redirects } = require('./build-legacy-redirects');

const ROOT = path.resolve(__dirname, '..');

assert.strictEqual(Object.keys(redirects).length, 39, 'Il rapporto Google contiene 39 URL legacy');

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
  let localTarget = path.join(ROOT, ...targetPath.replace(/^\//, '').split('/'));
  if (targetPath.endsWith('/')) {
    localTarget = path.join(localTarget, 'index.html');
  } else if (!path.extname(localTarget)) {
    localTarget += '.html';
  }
  assert.ok(fs.existsSync(localTarget), `Destinazione locale mancante: ${target}`);
}

console.log('OK: 39 URL legacy collegati a destinazioni esistenti.');
