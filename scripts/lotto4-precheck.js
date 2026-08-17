const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const manifestPath = path.join(rootDir, 'batch_manifest_lotto2B.csv');
const articoliDir = path.join(rootDir, 'articoli');

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

const manifestLines = fs.readFileSync(manifestPath, 'utf8').split('\n');
const lotto4 = [];

for (let i = 1; i < manifestLines.length; i++) {
    const line = manifestLines[i].trim();
    if (!line) continue;
    const parts = line.split(';');
    if (parts[0] === 'Lotto 4') {
        lotto4.push({
            batch: parts[0],
            ordine: parts[1],
            titolo: parts[2],
            slug: parts[3],
            statoComplessivo: parts[4]
        });
    }
}

console.log("=== ELENCO LOTTO 4 ===");
let hasErrors = false;
lotto4.forEach(item => {
    console.log(`- [${item.slug}] ${item.titolo}`);
    const itemDir = path.join(articoliDir, item.slug);
    if (fs.existsSync(itemDir)) {
        console.error(`ERRORE: La directory ${item.slug} esiste già in articoli/!`);
        hasErrors = true;
    }
    if (!item.statoComplessivo.startsWith('migrabile-')) {
        console.error(`ERRORE: Il record ${item.slug} non è autorizzato (${item.statoComplessivo})`);
        hasErrors = true;
    }
});

if (lotto4.length !== 16) {
    console.error(`ERRORE: Trovati ${lotto4.length} record per il Lotto 4 invece di 16.`);
    hasErrors = true;
}

console.log("\n=== HASH FILE CONSOLIDATI ===");
const hashes = {};
filesToHash.forEach(f => {
    const h = getHash(f);
    hashes[f] = h;
    console.log(`${f}: ${h}`);
    if (!h) {
        console.error(`ERRORE: File ${f} non trovato!`);
        hasErrors = true;
    }
});

fs.writeFileSync(path.join(rootDir, 'scratch', 'diagnostica-lotto2B', 'hashes_pre_lotto4.json'), JSON.stringify(hashes, null, 2));

if (hasErrors) {
    console.log("\nVerifiche fallite. Interruzione.");
    process.exit(1);
} else {
    console.log("\nVerifiche superate con successo.");
    process.exit(0);
}
