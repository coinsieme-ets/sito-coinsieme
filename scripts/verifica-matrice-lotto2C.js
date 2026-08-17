const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';
const csvFile = path.join(brainDir, 'matrice_contenuti_residui_lotto2C.csv');

function parseCsv(content) {
    let rows = [];
    let row = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < content.length; i++) {
        let c = content[i];
        if (c === '"' && content[i+1] === '"' && inQuote) {
            cur += '"';
            i++;
        } else if (c === '"') {
            inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
            row.push(cur);
            cur = '';
        } else if ((c === '\n' || c === '\r') && !inQuote) {
            if (c === '\r' && content[i+1] === '\n') i++;
            row.push(cur);
            rows.push(row);
            row = [];
            cur = '';
        } else {
            cur += c;
        }
    }
    if (cur || row.length > 0) {
        row.push(cur);
        if (row.length > 0 && row[0] !== '') {
            rows.push(row);
        }
    }
    return rows;
}

if (!fs.existsSync(csvFile)) {
    console.error("ERRORE: File non trovato.");
    process.exit(1);
}

const content = fs.readFileSync(csvFile, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(content).filter(r => r.length > 1);

if (rows.length !== 22) { // 1 header + 21 data
    console.error(`ERRORE: Record totali: ${rows.length - 1} invece di 21.`);
    process.exit(1);
}
console.log("OK: 21 record totali.");

const headers = rows[0];
if (headers.length !== 21) {
    console.error(`ERRORE: Colonne totali: ${headers.length} invece di 21.`);
    process.exit(1);
}
console.log("OK: 21 colonne esatte.");

for(let i=1; i<rows.length; i++){
    if(rows[i].length !== 21) {
        console.error(`ERRORE: Record riga ${i+1} ha ${rows[i].length} colonne.`);
        process.exit(1);
    }
}
console.log("OK: Tutte le righe hanno 21 colonne.");

const data = rows.slice(1);
const articoli = data.filter(r => r[0] === 'Articolo');
const pubblicazioni = data.filter(r => r[0] === 'Pubblicazione');
const audio = data.filter(r => r[0] === 'Audio' || r[0] === 'Audiolibro Drive');

if (articoli.length !== 12) {
    console.error(`ERRORE: Articoli totali: ${articoli.length} invece di 12.`);
    process.exit(1);
}
if (pubblicazioni.length !== 6) {
    console.error(`ERRORE: Pubblicazioni totali: ${pubblicazioni.length} invece di 6.`);
    process.exit(1);
}
if (audio.length !== 3) {
    console.error(`ERRORE: Audio totali: ${audio.length} invece di 3.`);
    process.exit(1);
}
console.log("OK: 12 articoli, 6 pubblicazioni, 3 audio.");

const targetFiles = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'finanziamenti-per-start-up-innovative.html',
    'gli-occhiali-innovativi-che-ti-fanno-sentire-meglio.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi-copy.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html',
    'la-tua-scuola-in-fattoria.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'nuovo-appuntamento.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    'ultimi-dati-istat-su-terzo-settore.html'
];
for(let fl of targetFiles){
    if(!articoli.find(a => a[3] === fl)) {
        console.error(`ERRORE: FileLocale mancante: ${fl}`);
        process.exit(1);
    }
}
console.log("OK: I 12 FileLocale esatti sono presenti.");

let imageCount = 0;
let imgSet = new Set();
for(let a of articoli){
    if (a[1].trim() === '') {
        console.error(`ERRORE: Titolo articolo vuoto riga ${a}`);
        process.exit(1);
    }
    if(a[8] && a[8].trim() !== '') {
        imageCount++;
        imgSet.add(a[8].trim());
    }
    if (a[7] !== 'NO') {
        console.error(`ERRORE: Migrazione immediata non è NO: ${a[7]}`);
        process.exit(1);
    }
}
if (imageCount !== 12) {
    console.error(`ERRORE: Articoli con ID immagine: ${imageCount} invece di 12.`);
    process.exit(1);
}
if (imgSet.size !== 11) {
    console.error(`ERRORE: ID immagine unici: ${imgSet.size} invece di 11.`);
    process.exit(1);
}
console.log("OK: 12 articoli con ID immagine, 11 ID unici, zero migrazioni immediate negli articoli.");

for(let p of pubblicazioni){
    if (p[1].trim() === '') {
        console.error(`ERRORE: Titolo pubblicazione vuoto`);
        process.exit(1);
    }
    if (p[7] !== 'NO') {
        console.error(`ERRORE: Migrazione immediata non è NO per pubblicazione: ${p[7]}`);
        process.exit(1);
    }
}
console.log("OK: 6 titoli pubblicazione non vuoti.");

for(let au of audio){
    if (au[1].trim() === '') {
        console.error(`ERRORE: Titolo audio vuoto`);
        process.exit(1);
    }
    if (au[7] !== 'NO') {
        console.error(`ERRORE: Migrazione immediata non è NO per audio: ${au[7]}`);
        process.exit(1);
    }
}
console.log("OK: 3 titoli audio non vuoti.");

console.log("OK: zero migrazioni immediate totali.");
process.exit(0);
