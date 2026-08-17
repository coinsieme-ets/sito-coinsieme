const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const hashFile = path.join(rootDir, 'scratch', 'diagnostica-lotto2B', 'hashes_pre_lotto4.json');
const mapBefore = JSON.parse(fs.readFileSync(hashFile, 'utf8'));

const filesToHash = [
    'index.html',
    'articoli.html',
    'articolo.html',
    'css/style.css',
    'js/main.js'
];

function getHash(filePath) {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) return null;
    const content = fs.readFileSync(fullPath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

let errors = 0;
console.log("=== VERIFICA HASH FILE CONSOLIDATI ===");
filesToHash.forEach(f => {
    const h = getHash(f);
    const expected = mapBefore[f];
    if (h !== expected) {
        console.error(`ERRORE: Il file ${f} è stato modificato!`);
        console.error(`Prima: ${expected}`);
        console.error(`Dopo:  ${h}`);
        errors++;
    } else {
        console.log(`OK: ${f}`);
    }
});

if (errors > 0) {
    console.error("Verifica fallita!");
    process.exit(1);
} else {
    console.log("Verifica superata!");
    process.exit(0);
}
