const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393\\slug_normalization_lotto2.csv';
const jsonPath = path.join(__dirname, '..', 'data', 'articoli.json');
const redirectCsvPath = path.join(__dirname, '..', 'redirect_vecchio_nuovo_lotto2.csv');

const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
const header = csvLines[0].split(';');

if (header.length !== 7) throw new Error(`Attese 7 colonne, trovate ${header.length}`);
if (csvLines.length !== 20) throw new Error(`Attese 19 righe di dati + header, trovate ${csvLines.length}`);

let newSlugs = new Set();
let mapping = {};
let originalUrlsCount = 0;

for (let i = 1; i < csvLines.length; i++) {
    const parts = csvLines[i].split(';');
    if (parts.length !== 7) throw new Error(`Riga ${i} non ha 7 colonne`);
    
    const [titolo, urlOriginale, slugOriginale, slugNuovo, motivo, collisione, redirect] = parts;
    
    if (slugNuovo.includes('%')) throw new Error(`Trovato % nello slug nuovo: ${slugNuovo}`);
    if (/[^a-z0-9-]/.test(slugNuovo)) throw new Error(`Trovati caratteri non validi nello slug nuovo: ${slugNuovo}`);
    if (newSlugs.has(slugNuovo)) throw new Error(`Collisione individuata per lo slug nuovo: ${slugNuovo}`);
    
    newSlugs.add(slugNuovo);
    if (urlOriginale) originalUrlsCount++;
    
    mapping[slugOriginale] = slugNuovo;
}

if (originalUrlsCount !== 19) throw new Error(`URL originali conservati attesi 19, trovati ${originalUrlsCount}`);

console.log("Validazione CSV superata:");
console.log("- 19 righe");
console.log("- 7 colonne");
console.log("- 19 nuovi slug distinti");
console.log("- zero % nei nuovi slug");
console.log("- zero caratteri fuori da [a-z0-9-]");
console.log("- zero collisioni");
console.log("- 19 URL originali conservati");

// Aggiorna JSON
let articoli = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let updatedCount = 0;

let redirectMatrix = "urlOriginale,redirectPrevisto\n";

for (let a of articoli) {
    if (mapping[a.slug]) {
        let slugNuovo = mapping[a.slug];
        a.slug = slugNuovo;
        a.destinazioneLocale = `/articoli/${slugNuovo}/index.html`;
        a.canonicalFuturo = `https://www.coinsieme.it/articoli/${slugNuovo}/index.html`;
        a.redirectPrevisto = `/articoli/${slugNuovo}/index.html`;
        updatedCount++;
    }
    
    // Add all to redirect matrix if they have urlOriginale
    if (a.urlOriginale && a.redirectPrevisto) {
        redirectMatrix += `${a.urlOriginale},${a.redirectPrevisto}\n`;
    }
}

fs.writeFileSync(jsonPath, JSON.stringify(articoli, null, 4), 'utf8');
console.log(`JSON aggiornato: ${updatedCount} record modificati.`);

fs.writeFileSync(redirectCsvPath, redirectMatrix, 'utf8');
console.log("redirect_vecchio_nuovo_lotto2.csv creato/aggiornato.");
