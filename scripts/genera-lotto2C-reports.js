const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';

// Le 12 risorse note:
const articoliMap = {
    'finanziamenti-per-start-up-innovative': { a: 'Recuperare il testo da altra fonte verificabile oppure lasciare escluso', p: 'Corpo editoriale non disponibile' },
    'gli-occhiali-innovativi-che-ti-fanno-sentire-meglio': { a: 'Recuperare il testo da altra fonte verificabile oppure lasciare escluso', p: 'Corpo editoriale non disponibile' },
    'la-tua-scuola-in-fattoria': { a: 'Recuperare il testo da altra fonte verificabile oppure lasciare escluso', p: 'Corpo editoriale non disponibile' },
    'nuovo-appuntamento': { a: 'Recuperare il testo da altra fonte verificabile oppure lasciare escluso', p: 'Corpo editoriale non disponibile' },
    'ultimi-dati-istat-su-terzo-settore': { a: 'Recuperare il testo da altra fonte verificabile oppure lasciare escluso', p: 'Corpo editoriale non disponibile' },
    'accessibilita-digitale-nuove-regole-per-la-pa-e-i-privati': { a: 'Rimuovere il collegamento privato e sottoporre a revisione editoriale', p: 'Contiene link diretto a una sessione ChatGPT' },
    'il-lazio-dimezza-l-irap-per-il-terzo-settore-un-sostegno-concreto-alle-realta-sociali': { a: 'Ripulire i collegamenti e verificare le fonti', p: 'Contiene parametri UTM ChatGPT' },
    'nuove-regole-di-vigilanza-sulle-cooperative-piu-trasparenza-piu-responsabilita-piu-qualita-sociale': { a: 'Ripulire i collegamenti e verificare le fonti', p: 'Contiene parametri UTM ChatGPT' },
    'bonus-assunzione-disabili-giovani-e-donne-le-novita': { a: 'Correggere URL e completare verifica', p: 'URL malformato e stato editoriale Da verificare editorialmente' },
    'pnrr-e-accessibilita-luoghi-di-cultura': { a: 'Correggere URL e verificare PDF collegato', p: 'URL malformato' },
    '5-invenzioni-del-futuro': { a: 'Confrontare hash e differenze complete prima di sceglierne uno', p: 'Possibile copia duplicata' },
    '5-invenzioni-del-futuro-copy': { a: 'Confrontare hash e differenze complete prima di sceglierne uno', p: 'Possibile copia duplicata' }
};

let csv = 'Tipo Record,Titolo,URL Originale,File Sorgente,Motivo Esclusione,Testo Disponibile,Risorse Collegate,Problema da Risolvere,Decisione / Azione Richiesta,Risultato Possibile,Immagine Collegata,Valutazione Immagine,Migrazione Immediata,Destinazione Proposta\n';

function escapeCsv(str) {
    if (!str) return '""';
    return '"' + String(str).replace(/"/g, '""').replace(/\n/g, ' ') + '"';
}

const articoliJson = JSON.parse(fs.readFileSync('C:/Users/Utente/.gemini/antigravity/scratch/coinsieme-proto/data/articoli.json', 'utf8').replace(/^\uFEFF/, ''));

// Read Mappa Immagini
let mappaImmagini = {};
if (fs.existsSync(path.join(brainDir, 'mappa_immagini_pagine_lotto2.csv'))) {
    const lines = fs.readFileSync(path.join(brainDir, 'mappa_immagini_pagine_lotto2.csv'), 'utf8').split('\n');
    lines.forEach(l => {
        const parts = l.split(',');
        if (parts.length >= 2) {
            mappaImmagini[parts[0].replace(/"/g, '').trim()] = parts[1].replace(/"/g, '').trim();
        }
    });
}

// Read Immagini Finale
let imgValutazione = {};
if (fs.existsSync(path.join(brainDir, 'revisione_visiva_immagini_lotto2_finale.csv'))) {
    const lines = fs.readFileSync(path.join(brainDir, 'revisione_visiva_immagini_lotto2_finale.csv'), 'utf8').split('\n');
    lines.forEach(l => {
        // ID, Categoria
        const parts = l.split(',');
        if (parts.length >= 2) {
            imgValutazione[parts[0].replace(/"/g, '').trim()] = parts[1].replace(/"/g, '').trim();
        }
    });
}

// Articoli
for (let slug of Object.keys(articoliMap)) {
    let a = articoliJson.find(x => x.slug === slug) || {};
    let info = articoliMap[slug];
    let isTestoNo = (info.p === 'Corpo editoriale non disponibile');
    
    let urlO = a.urlOriginale || '';
    let fsorg = a.fileSorgente || '';
    let imgCol = mappaImmagini[fsorg] || '';
    let imgVal = imgValutazione[imgCol] || '';
    
    csv += `${escapeCsv('Articolo')},${escapeCsv(a.titolo || slug)},${escapeCsv(urlO)},${escapeCsv(fsorg)},${escapeCsv('Anomalia bloccante')},${escapeCsv(isTestoNo ? 'NO' : 'SI')},${escapeCsv(a.collegamentiEsterni||'')},${escapeCsv(info.p)},${escapeCsv(info.a)},${escapeCsv('Articolo migrabile post-correzione')},${escapeCsv(imgCol)},${escapeCsv(imgVal)},${escapeCsv('NO')},${escapeCsv('/articoli/'+slug)}\n`;
}

// Pubblicazioni
const pubbJson = JSON.parse(fs.readFileSync('C:/Users/Utente/.gemini/antigravity/scratch/coinsieme-proto/data/pubblicazioni.json', 'utf8').replace(/^\uFEFF/, ''));
const pubbGens = ['un-impegno-che-si-rinnova', 'il-welfare-e-i-suoi-attori'];
const pubbExcl = pubbJson.filter(p => !pubbGens.includes(p.slug));

for (let p of pubbExcl) {
    let problema = 'Metadati bibliografici mancanti / verifica download';
    let azione = 'Pubblicabile come scheda descrittiva con i soli dati verificati';
    csv += `${escapeCsv('Pubblicazione')},${escapeCsv(p.titolo)},${escapeCsv('')},${escapeCsv(p.paginaSorgente)},${escapeCsv('Dati incompleti')},${escapeCsv('SI')},${escapeCsv(p.risorsa||'')},${escapeCsv(problema)},${escapeCsv(azione)},${escapeCsv('Scheda senza download')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('NO')},${escapeCsv('/pubblicazioni/'+p.slug)}\n`;
}

// Audio
const audioJson = JSON.parse(fs.readFileSync('C:/Users/Utente/.gemini/antigravity/scratch/coinsieme-proto/data/audio.json', 'utf8').replace(/^\uFEFF/, ''));
for (let aud of audioJson) {
    let problema = '';
    let azione = '';
    if (aud.paginaSorgente.includes('dal-7-novembre')) {
        problema = 'MP3 locale non identificato';
        azione = 'Non pubblicare';
    } else if (aud.paginaSorgente.includes('70-e')) {
        problema = 'Link Drive da verificare';
        azione = 'Risorsa collegata alla relativa scheda';
    } else {
        problema = 'Link Drive e diritti da verificare';
        azione = 'Risorsa collegata alla relativa scheda';
    }
    csv += `${escapeCsv('Audio')},${escapeCsv(aud.contenuto)},${escapeCsv(aud.disponibilita)},${escapeCsv(aud.paginaSorgente)},${escapeCsv('Audio non supportato automaticamente')},${escapeCsv(aud.trascrizione)},${escapeCsv('')},${escapeCsv(problema)},${escapeCsv(azione)},${escapeCsv('Risorsa allegata')},${escapeCsv('')},${escapeCsv('')},${escapeCsv('NO')},${escapeCsv('N/D')}\n`;
}

// Immagini collegate
for (let slug of Object.keys(articoliMap)) {
    let a = articoliJson.find(x => x.slug === slug) || {};
    let fsorg = a.fileSorgente || '';
    let imgCol = mappaImmagini[fsorg];
    if (imgCol) {
        let val = imgValutazione[imgCol] || '';
        let rischioPrivacy = val.includes('liberatoria') ? 'SI' : 'NO';
        let rischioDiritti = val.includes('sostituire') || val.includes('verificare') ? 'SI' : 'NO';
        csv += `${escapeCsv('Immagine')},${escapeCsv(imgCol)},${escapeCsv('')},${escapeCsv(fsorg)},${escapeCsv('In attesa del Lotto 3')},${escapeCsv('')},${escapeCsv(slug)},${escapeCsv('Verifica policy')},${escapeCsv('Verifica Fondazione necessaria')},${escapeCsv(val)},${escapeCsv(imgCol)},${escapeCsv(val)},${escapeCsv('NO')},${escapeCsv('Media folder')}\n`;
    }
}

fs.writeFileSync(path.join(brainDir, 'matrice_contenuti_residui_lotto2C.csv'), csv, 'utf8');

// Generare Markdown Report
const mdReport = `# Rapporto Ricognizione Lotto 2C (Contenuti Residui)

La presente ricognizione analizza i contenuti inventariati ma esclusi dalla generazione (installati e collaudati esclusivamente nel prototipo locale, non online in root), incrociando i dati degli inventari editoriali, audio e fotografici già validati.

Tutte le informazioni di dettaglio sono raccolte in \`matrice_contenuti_residui_lotto2C.csv\`. Nessun HTML, JSON o redirect è stato alterato.

## 1. Riclassificazione Esatta dei 12 Articoli
Sono stati classificati in dettaglio i 12 articoli non generati. Nessuno di questi è stato marcato come immediatamente migrabile, essendo subordinati a correzioni tecniche o integrazioni editoriali.
- **Corpo editoriale non disponibile** (5 articoli):
  - \`finanziamenti-per-start-up-innovative\`, \`gli-occhiali-innovativi-che-ti-fanno-sentire-meglio\`, \`la-tua-scuola-in-fattoria\`, \`nuovo-appuntamento\`, \`ultimi-dati-istat-su-terzo-settore\`. Azione: recuperare il testo verificabile o lasciare escluso.
- **Link / Parametri ChatGPT** (3 articoli):
  - \`accessibilita-digitale-nuove-regole-per-la-pa-e-i-privati\`: link diretto a sessione ChatGPT (rimuovere collegamento e revisionare).
  - \`il-lazio-dimezza-l-irap...\` e \`nuove-regole-di-vigilanza...\`: parametri UTM ChatGPT (ripulire e verificare fonti).
- **URL malformato** (2 articoli):
  - \`bonus-assunzione-disabili-giovani-e-donne-le-novita\`: Da verificare editorialmente.
  - \`pnrr-e-accessibilita-luoghi-di-cultura\`: verificare PDF collegato.
- **Possibile Duplicato** (2 articoli):
  - \`5-invenzioni-del-futuro\` e \`5-invenzioni-del-futuro-copy\`: confrontare hash e differenze prima della scelta.

## 2. Pubblicazioni (6 Risorse)
Le 6 pubblicazioni non richiedono necessariamente ISBN o PDF per essere migrate.
Una scheda può essere pubblicata **senza download e senza inventare metadati bibliografici**, semplicemente come **scheda descrittiva migrabile con i soli dati verificati**. I relativi audiolibri sono da intendersi come "risorsa collegata" alla pubblicazione, evitando pagine duplicate.

## 3. Audio (3 Risorse)
- **MP3 locale non identificato**: Non pubblicare.
- **Audiolibro "70 e +"**: Risorsa collegata alla relativa scheda. Link Drive da verificare.
- **Audiolibro "Un profeta tra terra e cielo"**: Risorsa collegata alla relativa scheda. Link Drive e diritti da verificare.

*Alternative di migrazione audio*: Mantenimento del collegamento Drive (rischio decadenza link, ma costo nullo), hosting locale (controllo totale, se autorizzato), o piattaforma esterna accessibile.

## 4. Analisi Fotografica (Totale: 164 immagini)
Basata esclusivamente su \`revisione_visiva_immagini_lotto2_finale.csv\`:
- **60** da sostituire con immagine contemporanea
- **32** utilizzabili previa verifica della liberatoria
- **53** riutilizzabili nell'articolo originale
- **10** riutilizzabili nel sito istituzionale
- **6** da non pubblicare
- **2** da conservare come memoria storica
- **1** da verificare
In totale, **66 immagini** richiedono esplicitamente una verifica da parte della Fondazione. (Le categorie derivano dal CSV consolidato).

## Proposta Lotti Successivi (Per Priorità)
Non viene dichiarato alcun lotto come "eseguibile immediatamente" finché le anomalie specifiche non saranno risolte.

- **Lotto 2C-A**: Correzione dei collegamenti (inclusi ChatGPT UTM) e confronto duplicati (5 Invenzioni).
- **Lotto 2C-B**: Eventuale recupero dei cinque testi mancanti da fonte certa.
- **Lotto 2C-C**: Creazione schede pubblicazioni descrittive e integrazione audiolibri verificati.
- **Lotto 2C-D**: Integrazione fotografica autorizzata (previa decisione sui diritti/liberatorie).
`;
fs.writeFileSync(path.join(brainDir, 'rapporto_contenuti_residui_lotto2C.md'), mdReport, 'utf8');

const mdDec = `# Decisioni Richieste alla Fondazione (Lotto 2C)

La ricognizione del Lotto 2C ha identificato vari blocchi editoriali o normativi. Le pagine in oggetto sono installate e collaudate esclusivamente nel prototipo locale. Non si procederà finché non verrà risolta ciascuna di queste anomalie.

## 1. Recupero dei Testi Mancanti
I seguenti 5 articoli risultano privi di corpo testuale disponibile nel dump CMS:
- Finanziamenti per start up innovative
- Gli occhiali innovativi che ti fanno sentire meglio
- La tua scuola in fattoria
- Nuovo appuntamento
- Ultimi dati Istat su Terzo settore

> [!IMPORTANT]
> **Decisione**: Fornire i testi originali da una fonte verificabile, oppure autorizzare l'esclusione permanente di questi articoli.

## 2. Pagine con Anomalie (ChatGPT e URL Malformati)
Tre articoli contengono link privati o parametri di tracciamento UTM afferenti a ChatGPT. Due articoli presentano URL malformati e rinvii a PDF non validati. 
> [!WARNING]
> **Decisione**: Autorizzare la correzione tecnica (rimozione UTM e link corrotti) accoppiata ad una revisione editoriale dei contenuti per assicurarne l'attendibilità e la congruità. 

## 3. Schede Pubblicazioni Descrittive
Delle 8 pubblicazioni, 6 non possiedono dati bibliografici standard o il download. Possono comunque essere migrate come **schede descrittive** con i soli dati verificati.
> [!NOTE]
> **Decisione**: Confermate di voler procedere pubblicando semplici schede di presentazione testuale (senza inventare metadati assenti), oppure preferite attendere l'integrazione manuale di PDF, ePub, ISBN e Autori?

## 4. Gestione Audiolibri e Diritti Audio
Vi sono due audiolibri (per "70 e +" e "Un profeta tra terra e cielo") e un MP3 non identificato. L'MP3 non identificato non verrà pubblicato. I due audiolibri si configurano come "risorse collegate" alla propria scheda di pubblicazione.
> [!CAUTION]
> **Decisione**: Occorre verificare i diritti per la pubblicazione di tali opere audio. Inoltre, dovete confermare la strategia tecnologica:
> A) Mantenimento dei collegamenti a Google Drive (zero costi server, rischio link interrotti).
> B) Hosting locale diretto sul nuovo sito (maggiore stabilità, richiede accertamento legale sui diritti).
> C) Hosting su piattaforme podcast esterne.

## 5. Autorizzazioni Fotografiche
Dall'inventario visivo emergono 66 immagini subordinate a verifica (tra liberatorie necessarie, immagini da sostituire, ecc).
> [!CAUTION]
> **Decisione**: Si richiede formale verifica dei diritti e delle liberatorie (privacy) secondo l'inventario \`revisione_visiva_immagini_lotto2_finale.csv\` prima di associare tali immagini ai lotti finali.
`;
fs.writeFileSync(path.join(brainDir, 'decisioni_fondazione_lotto2C.md'), mdDec, 'utf8');

console.log('Artifacts generated successfully.');
