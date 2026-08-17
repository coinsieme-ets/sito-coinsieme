const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';

// Simple CSV parser
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
        rows.push(row);
    }
    return rows;
}

function escapeCsv(str) {
    if (str === null || str === undefined) return '""';
    return '"' + String(str).replace(/"/g, '""').replace(/\n/g, ' ') + '"';
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

// 1. Read inventories for titles and URLs
const invArticoli = readCsvAsObjects(path.join(brainDir, 'inventario_articoli_lotto2.csv'));
const invPubb = readCsvAsObjects(path.join(brainDir, 'inventario_pubblicazioni_lotto2.csv'));
const invAudio = readCsvAsObjects(path.join(brainDir, 'inventario_audio_lotto2.csv'));

// 12 specific articles
const mapArticoliInfo = {
    'finanziamenti-per-start-up-innovative': { img: 'IMG_11', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso' },
    'gli-occhiali-innovativi-che-ti-fanno-sentire-meglio': { img: 'IMG_70', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso' },
    'la-tua-scuola-in-fattoria': { img: 'IMG_23', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso' },
    'nuovo-appuntamento': { img: 'IMG_14', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso' },
    'ultimi-dati-istat-su-terzo-settore': { img: 'IMG_67', p: 'Corpo editoriale non disponibile', a: 'recuperare il testo da altra fonte verificabile oppure lasciare escluso' },
    'accessibilita-digitale-nuove-regole-per-la-pa-e-i-privati': { img: 'IMG_73', p: 'contiene link diretto a una sessione ChatGPT', a: 'rimuovere il collegamento privato e sottoporre il testo a revisione editoriale' },
    'il-lazio-dimezza-l-irap-per-il-terzo-settore-un-sostegno-concreto-alle-realta-sociali': { img: 'IMG_82', p: 'contiene parametri UTM ChatGPT', a: 'ripulire i collegamenti e verificare le fonti' },
    'nuove-regole-di-vigilanza-sulle-cooperative-piu-trasparenza-piu-responsabilita-piu-qualita-sociale': { img: 'IMG_84', p: 'contiene parametri UTM ChatGPT', a: 'ripulire i collegamenti e verificare le fonti' },
    'bonus-assunzione-disabili-giovani-e-donne-le-novita': { img: 'IMG_51', p: 'URL malformato e stato editoriale Da verificare editorialmente', a: 'correggere URL e verificare editorialmente' },
    'pnrr-e-accessibilita-luoghi-di-cultura': { img: 'IMG_19', p: 'URL malformato', a: 'verificare anche il PDF collegato' },
    '5-invenzioni-del-futuro': { img: 'IMG_75', p: 'possibile coppia duplicata', a: 'confrontare hash e differenze complete prima di sceglierne uno' },
    '5-invenzioni-del-futuro-copy': { img: 'IMG_75', p: 'possibile coppia duplicata', a: 'confrontare hash e differenze complete prima di sceglierne uno' }
};

const fileToSlug = (file) => file.replace('.html', '').replace('-copy', '');

const artDataMap = {};
invArticoli.forEach(a => {
    let basename = a.FileLocale.replace('.html', '');
    artDataMap[basename] = a;
});
// Need to find exactly the 12 articles
let missingArtFiles = [
    'finanziamenti-per-start-up-innovative.html',
    'gli-occhiali-innovativi-che-ti-fanno-sentire-meglio.html',
    'la-tua-scuola-in-fattoria.html',
    'nuovo-appuntamento.html',
    'ultimi-dati-istat-su-terzo-settore.html',
    'accessibilita-digitale-nuove-regole-per-la-pa-e-i-privati.html',
    'il-lazio-dimezza-l-irap-per-il-terzo-settore-un-sostegno-concreto-alle-realta-sociali.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-piu-trasparenza-piu-responsabilita-piu-qualita-sociale.html',
    'bonus-assunzione-disabili-giovani-e-donne-le-novita.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    '5-invenzioni-del-futuro.html',
    '5-invenzioni-del-futuro-copy.html'
];
let articlesToProcess = invArticoli.filter(a => missingArtFiles.includes(a.FileLocale));

// 6 pubblicazioni
let pubbToProcess = invPubb.filter(p => !['70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook.html', 'guida-allacitta-di-roma-anno-1990.html'].includes(p.FileLocale));

// 3 Audio
let audioToProcess = invAudio;

// Mappa Immagini 
const mappaImg = readCsvAsObjects(path.join(brainDir, 'mappa_immagini_pagine_lotto2.csv'));
const imgFinale = readCsvAsObjects(path.join(brainDir, 'revisione_visiva_immagini_lotto2_finale.csv'));

let csvOut = 'Tipo Record,Titolo,URL Originale,File Sorgente,Testo Disponibile,Problema da Risolvere,Azione Richiesta,Migrazione Immediata,Immagine Collegata,Nome File Immagine,Descrizione Visiva,Rischio Privacy,Rischio Diritti,Verifica Fondazione Necessaria,Stato di Duplicazione,Destinazione Proposta Immagine,Motivazione Immagine,Scheda Descrittiva Migrabile,Collegamento Drive,Risorsa Audio Collegata,Download Locale\n';

// 12 Articles
articlesToProcess.forEach(a => {
    let slug = a.FileLocale.replace('.html', '');
    let info = mapArticoliInfo[slug];
    
    let testoDisponibile = (slug === 'finanziamenti-per-start-up-innovative' || slug === 'gli-occhiali-innovativi-che-ti-fanno-sentire-meglio' || slug === 'la-tua-scuola-in-fattoria' || slug === 'nuovo-appuntamento' || slug === 'ultimi-dati-istat-su-terzo-settore') ? 'NO' : 'SI';
    
    let imgID = info.img;
    let imgData = imgFinale.find(i => i.ID === imgID) || {};
    
    csvOut += `${escapeCsv('Articolo')},${escapeCsv(a.Titolo)},${escapeCsv(a.URLOriginale)},${escapeCsv(a.FileLocale)},${escapeCsv(testoDisponibile)},${escapeCsv(info.p)},${escapeCsv(info.a)},${escapeCsv('NO')},${escapeCsv(imgID)},${escapeCsv(imgData.NomeFile)},${escapeCsv(imgData.DescrizioneVisiva)},${escapeCsv(imgData.RischioPrivacy)},${escapeCsv(imgData.RischioDiritti)},${escapeCsv(imgData.VerificaFondazioneNecessaria)},${escapeCsv(imgData.StatoDuplicazione)},${escapeCsv(imgData.DestinazioneProposta)},${escapeCsv(imgData.Motivazione)},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')}\n`;
});

// 6 Publications
pubbToProcess.forEach(p => {
    let hasDrive = p.URLOriginale && p.URLOriginale.includes('drive.google.com') ? 'SI' : 'NO';
    let localDown = 'NO'; // Nessun download disponibile per queste residue
    let audioCol = 'NO';
    if (p.Titolo && (p.Titolo.includes('70 e +') || p.Titolo.includes('Un profeta tra terra e cielo'))) audioCol = 'SI';
    
    csvOut += `${escapeCsv('Pubblicazione')},${escapeCsv(p.Titolo)},${escapeCsv(p.URLOriginale)},${escapeCsv(p.FileLocale)},${escapeCsv('SI')},${escapeCsv('metadati bibliografici mancanti / nessun download disponibile')},${escapeCsv('decisione editoriale richiesta')},${escapeCsv('NO')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('SI')},${escapeCsv(hasDrive)},${escapeCsv(audioCol)},${escapeCsv(localDown)}\n`;
});

// 3 Audio
audioToProcess.forEach(a => {
    let prob = '';
    let act = '';
    if (a.TitoloOriginale && a.TitoloOriginale.includes('70 e +')) {
        prob = 'link Drive da verificare';
        act = 'risorsa collegata alla relativa scheda';
    } else if (a.TitoloOriginale && a.TitoloOriginale.includes('profeta')) {
        prob = 'link Drive e diritti da verificare';
        act = 'risorsa collegata alla relativa scheda';
    } else {
        prob = 'MP3 locale non identificato';
        act = 'non pubblicare';
    }
    
    csvOut += `${escapeCsv('Audio')},${escapeCsv(a.TitoloOriginale || a.ContenutoApparente)},${escapeCsv(a.URLOriginale)},${escapeCsv(a.FileLocale)},${escapeCsv('N/A')},${escapeCsv(prob)},${escapeCsv(act)},${escapeCsv('NO')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('')}\n`;
});

fs.writeFileSync(path.join(brainDir, 'matrice_contenuti_residui_lotto2C.csv'), csvOut, 'utf8');

// Rapporto
const mdRapporto = `# Rapporto Ricognizione Lotto 2C (Contenuti Residui)

La presente ricognizione analizza e quantifica i contenuti inventariati ma esclusi dalla generazione dei Lotti 1 e 2. 
I contenuti attuali sono installati e collaudati esclusivamente nel prototipo locale. I 21 record residui non sono ancora autorizzati alla generazione.

## 1. Articoli Non Generati (12 record)
La totalità dei 12 articoli residui non è immediatamente migrabile. Nello specifico:
- **5 articoli restano bloccati perché privi del corpo** (Finanziamenti per start-up innovative, Gli occhiali innovativi, La tua scuola in fattoria, Nuovo appuntamento, Ultimi dati ISTAT sul Terzo settore). Azione: recuperare il testo da altra fonte verificabile oppure lasciare escluso.
- **3 articoli richiedono rimozione di link ChatGPT/UTM e revisione delle fonti** (Accessibilità digitale, Il Lazio dimezza l'IRAP, Nuove regole di vigilanza).
- **2 articoli richiedono correzione di URL malformati** (Bonus assunzione disabili, PNRR e accessibilità ai luoghi di cultura).
- **2 articoli costituiscono una coppia duplicata da confrontare** (le due versioni di "5 Invenzioni del Futuro").

Ciascuno dei 12 articoli è stato esattamente abbinato all'immagine principale desunta dalla mappa verificata. Conseguenze editoriali delle immagini:
- \`IMG_14\` e \`IMG_23\` risultano *riutilizzabili nell'articolo originale*.
- \`IMG_11\`, \`IMG_19\`, \`IMG_51\`, \`IMG_67\`, \`IMG_70\`, \`IMG_73\`, \`IMG_75\`, \`IMG_82\`, \`IMG_84\` sono classificate come *da sostituire con immagine contemporanea*. Questo non impedisce la futura migrazione testuale: gli articoli potranno essere pubblicati inizialmente come schede testuali prive di immagine.

## 2. Pubblicazioni (6 record)
Dall'inventario delle 8 pubblicazioni totali, le due già installate (Guida a Roma 1990 e 70 e + ebook) non rientrano fra i residui.
Le restanti 6 pubblicazioni non possiedono download locale o metadati bibliografici completi (ISBN, PDF, ePub). Tuttavia, la loro **scheda descrittiva è migrabile con i dati verificati** disponibili, senza inventare metadati fittizi.

## 3. Audio (3 record)
Tre record tecnici. Gli audiolibri non verranno duplicati come nuove opere, bensì trattati come risorse collegate alla pubblicazione madre.
- MP3 locale non identificato (non pubblicare).
- "70 e +" (risorsa collegata alla relativa scheda, link Drive da verificare).
- "Un profeta tra terra e cielo" (risorsa collegata alla relativa scheda, link Drive e diritti da verificare).

## 4. Statistiche Archivio Fotografico
Sull'intero archivio di 164 immagini estratte e validate nel CSV consolidato, si riportano i raggruppamenti esatti:
- 60 da sostituire con immagine contemporanea
- 32 utilizzabili previa verifica della liberatoria
- 53 riutilizzabili nell'articolo originale
- 10 riutilizzabili nel sito istituzionale
- 6 da non pubblicare
- 2 da conservare come memoria storica
- 1 da verificare
In totale, **66 immagini** per le quali è richiesta una verifica della Fondazione (le categorie derivano esclusivamente dal CSV consolidato).

## Stati del Lotto 2C e Proposta Esecutiva
Al momento **nessuno dei 21 contenuti residui è autorizzato alla generazione**. La lavorazione seguirà queste priorità:
- **Lotto 2C-A**: Correzione dei collegamenti (inclusi UTM), correzione degli URL malformati e confronto duplicati (nessun articolo ancora autorizzato).
- **Lotto 2C-B**: Eventuale recupero dei cinque testi mancanti (corpo assente).
- **Lotto 2C-C**: Pubblicazioni descrittive e audiolibri verificati (senza duplicazione di entità).
- **Lotto 2C-D**: Integrazione fotografica autorizzata in conformità al rischio diritti/privacy.
`;
fs.writeFileSync(path.join(brainDir, 'rapporto_contenuti_residui_lotto2C.md'), mdRapporto, 'utf8');

const mdDec = `# Decisioni Richieste alla Fondazione (Lotto 2C)

La ricognizione del Lotto 2C ha bloccato 21 contenuti editoriali (12 articoli, 6 pubblicazioni, 3 audio) per anomalie bloccanti. Attualmente i contenuti approvati sono installati e collaudati esclusivamente nel prototipo locale. Non verranno operate generazioni di questi residui finché non verrà assunta una decisione formale sui seguenti blocchi.

## 1. Corpo Editoriale Mancante (Articoli)
5 articoli ("Finanziamenti per start-up innovative", "Gli occhiali innovativi", "La tua scuola in fattoria", "Nuovo appuntamento", "Ultimi dati ISTAT sul Terzo settore") risultano privi di testo.
> [!IMPORTANT]
> **Decisione**: Fornire il testo corretto da altra fonte verificabile oppure autorizzare l'esclusione definitiva.

## 2. Pagine con Anomalie (ChatGPT e URL Malformati)
- 3 articoli contengono testi con link espliciti o parametri UTM che rinviano a ChatGPT.
- 2 articoli presentano URL malformati con target non verificati.
- 2 articoli sono un duplicato da confrontare.
> [!WARNING]
> **Decisione**: Autorizzare la rimozione dei link, la ripulitura dei parametri e la revisione editoriale delle fonti per validarne la correttezza prima della migrazione.

## 3. Schede Pubblicazioni Descrittive
Le 6 pubblicazioni residue sono deficitarie dei dati bibliografici (ISBN) e dei file scaricabili (PDF/ePub locale). 
> [!NOTE]
> **Decisione**: Confermate la migrazione come "schede descrittive migrabili con i soli dati verificati", evitando di inventare metadati assenti e omettendo il link al download locale?

## 4. Gestione Audiolibri e Diritti Audio
Vi sono due audiolibri ("70 e +" e "Un profeta tra terra e cielo") attualmente residenti su Google Drive. 
Non pubblicheremo l'MP3 non identificato. I restanti due non verranno duplicati, bensì proposti come risorsa collegata alla scheda pubblicazione.
> [!CAUTION]
> **Decisione**: Dovete indicare il canale di ospitalità definitivo per l'audio, considerando i vantaggi e i rischi:
> A) Mantenimento del collegamento Drive (nessun costo, ma si rischia la perdita futura del link e limitata accessibilità UI).
> B) Hosting locale diretto (esperienza utente ottimale, ma richiede verifica esplicita e autorizzazione legale dei diritti).
> C) Piattaforma audio esterna accessibile (es. Spotify/Soundcloud, garantisce sostenibilità e streaming ottimizzato).

## 5. Autorizzazioni Fotografiche
Per gli articoli in transizione (le 12 immagini abbinate) e per il resto dell'inventario, permangono immagini classificate come "da sostituire con immagine contemporanea" o soggette a rischio privacy. La sostituzione non blocca il testo (che può andare online senza foto).
> [!CAUTION]
> **Decisione**: Si richiede la formale presa in carico del CSV consolidato (\`revisione_visiva_immagini_lotto2_finale.csv\`) per operare le verifiche di privacy/diritti e fornire eventualmente le immagini contemporanee sostitutive (Lotto 2C-D).
`;
fs.writeFileSync(path.join(brainDir, 'decisioni_fondazione_lotto2C.md'), mdDec, 'utf8');

console.log('Artifacts precisely rewritten with required exact specs.');
