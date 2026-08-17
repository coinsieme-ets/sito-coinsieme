const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';

// Helper to safely parse CSV with quotes
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

function readCsvAsObjects(filename) {
    if (!fs.existsSync(filename)) return [];
    let content = fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, '');
    let rows = parseCsv(content);
    if (rows.length < 2) return [];
    let headers = rows[0].map(h => h.trim());
    return rows.slice(1).filter(r => r.length === headers.length).map(r => {
        let obj = {};
        for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = r[i];
        }
        return obj;
    });
}

function csvEscape(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${str}"`;
}

// Read Sources
const invArticoli = readCsvAsObjects(path.join(brainDir, 'inventario_articoli_lotto2.csv'));
const invPubb = readCsvAsObjects(path.join(brainDir, 'inventario_pubblicazioni_lotto2.csv'));
const imgFinale = readCsvAsObjects(path.join(brainDir, 'revisione_visiva_immagini_lotto2_finale.csv'));

// 1. Array of exactly 12 FileLocale
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

// Mapping Info
const mapInfo = {
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html': { img: 'IMG_73', p: 'contiene link diretto a una sessione ChatGPT', a: 'rimuovere il collegamento privato e sottoporre il testo a revisione editoriale', testo: 'SI' },
    'bonus-assunzione-disabili-per-gli-ets.html': { img: 'IMG_51', p: 'URL malformato e stato editoriale Da verificare editorialmente', a: 'correggere URL e verificare editorialmente', testo: 'SI' },
    'finanziamenti-per-start-up-innovative.html': { img: 'IMG_11', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso', testo: 'NO' },
    'gli-occhiali-innovativi-che-ti-fanno-sentire-meglio.html': { img: 'IMG_70', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso', testo: 'NO' },
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html': { img: 'IMG_82', p: 'contiene parametri UTM ChatGPT', a: 'ripulire i collegamenti e verificare le fonti', testo: 'SI' },
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi-copy.html': { img: 'IMG_75', p: 'possibile coppia duplicata', a: 'confrontare hash e differenze complete prima di sceglierne uno', testo: 'SI' },
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html': { img: 'IMG_75', p: 'possibile coppia duplicata', a: 'confrontare hash e differenze complete prima di sceglierne uno', testo: 'SI' },
    'la-tua-scuola-in-fattoria.html': { img: 'IMG_23', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso', testo: 'NO' },
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html': { img: 'IMG_84', p: 'contiene parametri UTM ChatGPT', a: 'ripulire i collegamenti e verificare le fonti', testo: 'SI' },
    'nuovo-appuntamento.html': { img: 'IMG_14', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso', testo: 'NO' },
    'pnrr-e-accessibilita-luoghi-di-cultura.html': { img: 'IMG_19', p: 'URL malformato', a: 'verificare anche il PDF collegato', testo: 'SI' },
    'ultimi-dati-istat-su-terzo-settore.html': { img: 'IMG_67', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso', testo: 'NO' }
};

let csvLines = [];
let headers = [
    'Tipo Record', 'Titolo', 'URL Originale', 'File Sorgente', 'Testo Disponibile', 'Problema da Risolvere',
    'Azione Richiesta', 'Migrazione Immediata', 'ID Immagine Collegata', 'Nome File Immagine', 'Descrizione Visiva',
    'Rischio Privacy', 'Rischio Diritti', 'Verifica Fondazione Necessaria', 'Stato di Duplicazione',
    'Destinazione Proposta Immagine', 'Motivazione Immagine', 'Scheda Descrittiva Migrabile', 'Collegamento Drive',
    'Risorsa Audio Collegata', 'Download Locale'
];
csvLines.push(headers.map(csvEscape).join(','));

// Articles
for (let fl of targetFiles) {
    let art = invArticoli.find(a => a.FileLocale === fl);
    if (!art) {
        console.error("ERRORE: Articolo non trovato in inventario_articoli_lotto2.csv:", fl);
        process.exit(1);
    }
    
    let info = mapInfo[fl];
    let imgData = imgFinale.find(i => i.ID === info.img);
    if (!imgData) {
        console.error("ERRORE: Immagine non trovata in revisione_visiva_immagini_lotto2_finale.csv:", info.img);
        process.exit(1);
    }
    
    let row = [
        'Articolo', art.Titolo, art.URLOriginale, art.FileLocale, info.testo, info.p, info.a, 'NO',
        info.img, imgData.NomeFile, imgData.DescrizioneVisiva, imgData.RischioPrivacy, imgData.RischioDiritti,
        imgData.VerificaFondazioneNecessaria, imgData.StatoDuplicazione, imgData.DestinazioneProposta, imgData.Motivazione,
        '', '', '', ''
    ];
    csvLines.push(row.map(csvEscape).join(','));
}

// Publications
const pubbExcl = invPubb.filter(p => !['70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook.html', 'guida-allacitta-di-roma-anno-1990.html'].includes(p.FileLocale));
if (pubbExcl.length !== 6) {
    console.error("ERRORE: Le pubblicazioni residue non sono esattamente 6. Sono", pubbExcl.length);
    process.exit(1);
}

for (let p of pubbExcl) {
    let hasDrive = p.URLOriginale && p.URLOriginale.includes('drive.google.com') ? 'SI' : 'NO';
    let audioCol = (p.Titolo && (p.Titolo.includes('70 e +') || p.Titolo.includes('Un profeta tra terra e cielo'))) ? 'SI' : 'NO';
    let row = [
        'Pubblicazione', p.Titolo, p.URLOriginale, p.FileLocale, 'SI', 'metadati bibliografici mancanti',
        'decisione editoriale richiesta', 'NO',
        '', '', '', '', '', '', '', '', '',
        'SI', hasDrive, audioCol, 'NO'
    ];
    csvLines.push(row.map(csvEscape).join(','));
}

// Audio (exactly 3 defined explicitly)
const audios = [
    {
        titolo: 'Contenuto del file locale non identificato',
        tipo: 'Audio',
        fileSorgente: 'dal-7-novembre-associazione-coin-onlus-diventa-fondazione-coinsieme-un-nuovo-inizio-per-obiettivi-sociali-rinnovati.html',
        problema: 'identificazione, titolarità e pertinenza da verificare',
        azione: 'non pubblicare'
    },
    {
        titolo: '70 e + – Percorsi di vita e sguardi al futuro',
        tipo: 'Audiolibro Drive',
        fileSorgente: '70-e.html',
        problema: 'accessibilità del link e diritti da verificare',
        azione: 'risorsa collegata alla relativa scheda'
    },
    {
        titolo: 'Un profeta tra terra e cielo',
        tipo: 'Audiolibro Drive',
        fileSorgente: 'audiolibro-di-un-profeta-tra-terra-e-cielo.html',
        problema: 'accessibilità del link e diritti da verificare',
        azione: 'risorsa collegata alla relativa scheda'
    }
];

for (let a of audios) {
    let row = [
        a.tipo, a.titolo, '', a.fileSorgente, '', a.problema, a.azione, 'NO',
        '', '', '', '', '', '', '', '', '',
        '', '', '', ''
    ];
    csvLines.push(row.map(csvEscape).join(','));
}

fs.writeFileSync(path.join(brainDir, 'matrice_contenuti_residui_lotto2C.csv'), csvLines.join('\n') + '\n', 'utf8');
console.log("matrice_contenuti_residui_lotto2C.csv generated successfully with 21 records.");
