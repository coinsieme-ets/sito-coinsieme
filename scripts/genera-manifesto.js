const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const articoliPath = path.join(dataDir, 'articoli.json');
const revisioneCsvPath = 'C:\\\\Users\\\\Utente\\\\.gemini\\\\antigravity\\\\brain\\\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393\\\\revisione_visiva_immagini_lotto2_finale.csv';

const articoli = JSON.parse(fs.readFileSync(articoliPath, 'utf8').replace(/^\uFEFF/, ''));
const revCsv = fs.readFileSync(revisioneCsvPath, 'utf8').split('\n').slice(1);
const imageMap = {};
for (const line of revCsv) {
    if (!line.trim()) continue;
    const parts = line.split(';');
    const slug = parts[0].trim();
    const act = parts[2] ? parts[2].trim() : '';
    imageMap[slug] = act;
}

// 1. Filtrare i record
const validArticoli = articoli.filter(a => {
    const isBlocked = a.statoComplessivo && (a.statoComplessivo.startsWith('richiede-') || a.statoComplessivo === 'possibile-duplicato' || a.statoComplessivo === 'non-migrare-per-ora');
    const isNonMigrare = a.statoMigrazione === 'non-migrare-per-ora';
    return !isBlocked && !isNonMigrare;
});

// 2. Ordinare in modo deterministico (slug crescente)
validArticoli.sort((a, b) => a.slug.localeCompare(b.slug, 'en', { sensitivity: 'base' }));

// 3. Generare il CSV
const outCsvPath = path.join(__dirname, '..', 'batch_manifest_lotto2B.csv');
let csvContent = 'batch;ordine;titolo;slug;statoComplessivo;corpoPresente;azioneImmagine;idImmagine;giaPresentePrimaDelLotto1;directoryAttualePresente;note\n';

const prevLottoSample = [
    "15-milioni-di-euro-per-la-digitalizzazione-del-terzo-settore",
    "50-anni-da-basaglia-e-dalla-prima-cooperative-di-integrazione-sociale",
    "agricoltura-capodarco-vince-la-sua-battaglia-per-la-sede",
    "anac-nelle-gare-non-ci-possono-essere-discriminazioni-fra-regioni-per-la-selezione-di-coop-sociali",
    "appalti-nuove-regole-per-individuare-i-ccnl",
    "assegno-ordinario-di-invalidita-e-lavoro-dipendente-decurtazioni-e-adempimenti"
];

let discrepancies = [];
let lotto1Slugs = [];

for (let i = 0; i < validArticoli.length; i++) {
    const a = validArticoli[i];
    let batch = '';
    if (i < 20) { batch = 'Lotto 1'; lotto1Slugs.push(a.slug); }
    else if (i < 40) batch = 'Lotto 2';
    else if (i < 60) batch = 'Lotto 3';
    else batch = 'Lotto 4';

    const actImg = imageMap[a.slug] || '';
    let hasBody = a.corpoHtml ? 'SI' : 'NO';
    if (!a.corpoHtml) discrepancies.push(`Corpo mancante in: ${a.slug}`);
    if (a.slug.includes('%')) discrepancies.push(`Percentuale in slug: ${a.slug}`);
    if (!/^[a-z0-9-]+$/.test(a.slug)) discrepancies.push(`Caratteri invalidi in slug: ${a.slug}`);
    
    let giaPresente = prevLottoSample.includes(a.slug) ? 'SI' : 'NO';
    let dirPresente = fs.existsSync(path.join(__dirname, '..', 'articoli', a.slug)) ? 'SI' : 'NO';
    
    csvContent += `${batch};${i + 1};"${a.titolo.replace(/"/g, '""')}";${a.slug};${a.statoComplessivo || ''};${hasBody};${actImg};${a.immagineCopertinaId || ''};${giaPresente};${dirPresente};\n`;
}

fs.writeFileSync(outCsvPath, csvContent, 'utf8');

console.log(`Record validi estratti: ${validArticoli.length}`);
console.log(`Discrepanze base: ${discrepancies.length > 0 ? discrepancies.join(', ') : 'Nessuna'}`);

// 4. Verificare le 20 directory attuali
const articoliDir = path.join(__dirname, '..', 'articoli');
let existingDirs = [];
if (fs.existsSync(articoliDir)) {
    existingDirs = fs.readdirSync(articoliDir).filter(f => fs.statSync(path.join(articoliDir, f)).isDirectory());
}

console.log(`\n--- VERIFICA RETROATTIVA ---`);
console.log(`Directory in articoli/: ${existingDirs.length}`);
let nonCoincidenti = [];
for (const d of existingDirs) {
    if (!lotto1Slugs.includes(d)) {
        nonCoincidenti.push(`Trovata cartella ma NON è nel nuovo Lotto 1: ${d}`);
    }
}
for (const s of lotto1Slugs) {
    if (!existingDirs.includes(s)) {
        nonCoincidenti.push(`Manca cartella per slug del nuovo Lotto 1: ${s}`);
    }
}

if (nonCoincidenti.length === 0) {
    console.log("MATCH PERFETTO tra directory presenti e nuovo Lotto 1.");
} else {
    console.log("DIFFERENZE RILEVATE:");
    nonCoincidenti.forEach(c => console.log("- " + c));
}
