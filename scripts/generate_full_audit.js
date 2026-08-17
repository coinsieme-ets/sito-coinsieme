const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const articoliDir = path.join(rootDir, 'articoli');
const articoliJsonPath = path.join(rootDir, 'data', 'articoli.json');
const csvPath = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393\\audit_editoriale_pre_indici_lotto2B.csv';

const articoliData = JSON.parse(fs.readFileSync(articoliJsonPath, 'utf8').replace(/^\uFEFF/, ''));
const folders = fs.readdirSync(articoliDir).filter(f => fs.statSync(path.join(articoliDir, f)).isDirectory());
const migrated = articoliData.filter(a => folders.includes(a.slug));

function escapeCsv(str) {
    if (str === null || str === undefined) return '""';
    const stringified = String(str);
    return '"' + stringified.replace(/"/g, '""') + '"';
}

const rows = [];
rows.push(["titolo", "slug", "canonical", "corpo presente", "hash del corpo normalizzato", "stato editoriale", "indicizzabile", "motivo dell'eventuale esclusione", "redirect pianificato", "destinazione del redirect"].map(escapeCsv).join(';'));

for (const a of migrated) {
    const htmlPath = path.join(articoliDir, a.slug, 'index.html');
    let corpoPresente = 'NO';
    let hash = '';
    let canonical = '';
    
    if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const bodyMatch = htmlContent.match(/<div class="article-body">([\s\S]*?)<\/div>/);
        if (bodyMatch && bodyMatch[1].trim()) {
            corpoPresente = 'SI';
            hash = crypto.createHash('sha256').update(bodyMatch[1].trim().replace(/\s+/g, ' ')).digest('hex');
        }
        
        const canonMatch = htmlContent.match(/<link rel="canonical" href="([^"]+)"/);
        if (canonMatch) {
            canonical = canonMatch[1];
        }
    }
    
    let indicizzabile = 'SI';
    let motivo = '';
    let redirect = 'NO';
    let destinazione = '';
    
    if (a.slug === 'dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104-copy') {
        indicizzabile = 'NO';
        motivo = 'Corpo editoriale identico; titolo e slug differiscono per il suffisso Copy';
        redirect = 'SI';
        destinazione = '/articoli/dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104/';
    } else if (a.slug === 'raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali-copy') {
        indicizzabile = 'NO';
        motivo = 'Versione aggiornata presente; corpo originale meno completo';
        redirect = 'SI';
        destinazione = '/articoli/raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali/';
    }
    
    const row = [
        a.titolo,
        a.slug,
        canonical,
        corpoPresente,
        hash,
        a.statoComplessivo,
        indicizzabile,
        motivo,
        redirect,
        destinazione
    ];
    
    rows.push(row.map(escapeCsv).join(';'));
}

fs.writeFileSync(csvPath, rows.join('\n'));
console.log("CSV scritto con successo.");
