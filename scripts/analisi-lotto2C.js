const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

// Clean BOM from JSON
function readJson(filename) {
    const raw = fs.readFileSync(path.join(dataDir, filename), 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
}

const articoliAll = readJson('articoli.json');
const pubbAll = readJson('pubblicazioni.json');
const audioAll = readJson('audio.json');

// Find generated
const generatedArticoli = new Set(fs.readdirSync(path.join(rootDir, 'articoli')).filter(d => fs.statSync(path.join(rootDir, 'articoli', d)).isDirectory()));
const generatedPubb = new Set(fs.readdirSync(path.join(rootDir, 'pubblicazioni')).filter(d => fs.statSync(path.join(rootDir, 'pubblicazioni', d)).isDirectory()));

// 12 articoli non generati
const excludedArticoli = articoliAll.filter(a => !generatedArticoli.has(a.slug));

// 6 pubblicazioni non generate
const excludedPubb = pubbAll.filter(p => !generatedPubb.has(p.slug));

// Immagini - We can scan data/articoli.json and data/pubblicazioni.json for all images.
// Actually, the user asked for:
// - le immagini approvate ma non ancora utilizzate
// - le immagini bloccate per diritti, privacy o liberatorie
// Let's check `imgLocalPath` or `immagine` properties in the JSONs.
// In the data, articles have `idImmagine`, `azioneImmagine`, `statoComplessivo`.
const unusedImages = [];
const blockedImages = [];

articoliAll.forEach(a => {
    if (a.azioneImmagine === 'rimuovere' || a.statoComplessivo === 'migrabile-senza-immagine') {
        if (a.immagine) {
            blockedImages.push({
                titolo: `Immagine bloccata in: ${a.titolo}`,
                urlOriginale: a.immagine,
                fileSorgente: a.fileSorgente,
                motivo: 'Diritti, privacy o liberatoria mancante',
                testo: a.sintesi ? 'Sintesi presente' : 'Nessun testo',
                risorse: a.slug,
                problema: 'Immagine bloccata per policy',
                decisione: 'Richiesta autorizzazione o fornitura immagine alternativa',
                migrazione: 'NO',
                destinazione: `/articoli/${a.slug}`
            });
        }
    }
});

// Create CSV
let csv = 'Titolo,URL Originale,File Sorgente,Motivo Esclusione,Testo Disponibile,Risorse Collegate,Problema da Risolvere,Decisione Richiesta,Migrazione Immediata,Destinazione Proposta\n';

function escapeCsv(str) {
    if (!str) return '""';
    return '"' + String(str).replace(/"/g, '""').replace(/\n/g, ' ') + '"';
}

excludedArticoli.forEach(a => {
    csv += `${escapeCsv(a.titolo)},${escapeCsv(a.urlOriginale)},${escapeCsv(a.fileSorgente)},${escapeCsv('Escluso dal manifest Lotto 2B')},${escapeCsv(a.testoCompletoDisponibile?'SI':'NO')},${escapeCsv(a.collegamentiEsterni)},${escapeCsv('Contenuto non assegnato al Lotto 2B')},${escapeCsv('Valutare inclusione nel Lotto 3 o 4')},${escapeCsv('SI')},${escapeCsv(`/articoli/${a.slug}`)}\n`;
});

excludedPubb.forEach(p => {
    csv += `${escapeCsv(p.titolo)},${escapeCsv('')},${escapeCsv(p.paginaSorgente)},${escapeCsv('Dati bibliografici o risorse mancanti')},${escapeCsv('SI')},${escapeCsv(p.risorsa)},${escapeCsv('Reperire dati ISBN, autori e risorse PDF/epub')},${escapeCsv('Fornire i metadati bibliografici mancanti')},${escapeCsv('NO')},${escapeCsv(`/pubblicazioni/${p.slug}`)}\n`;
});

audioAll.forEach(aud => {
    csv += `${escapeCsv(aud.contenuto)},${escapeCsv(aud.disponibilita)},${escapeCsv(aud.paginaSorgente)},${escapeCsv('Audio non supportato automaticamente')},${escapeCsv(aud.trascrizione)},${escapeCsv('')},${escapeCsv(aud.azioneProposta)},${escapeCsv(aud.titolarita)},${escapeCsv('NO')},${escapeCsv('Da definire')}\n`;
});

blockedImages.forEach(img => {
    csv += `${escapeCsv(img.titolo)},${escapeCsv(img.urlOriginale)},${escapeCsv(img.fileSorgente)},${escapeCsv(img.motivo)},${escapeCsv(img.testo)},${escapeCsv(img.risorse)},${escapeCsv(img.problema)},${escapeCsv(img.decisione)},${escapeCsv(img.migrazione)},${escapeCsv(img.destinazione)}\n`;
});

fs.writeFileSync(path.join(__dirname, 'matrice.csv'), csv, 'utf8');
console.log("Written matrice.csv");
