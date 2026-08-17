const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const dataDir = path.join(dir, 'data');

let errors = [];
let stats = {
    corpiEstratti: 0,
    senzaCorpo: 0,
    generabili: 0,
    conCorpoMaBloccati: 0,
    totaleBloccati: 0,
    pubblicazioniComplete: 0,
    pubblicazioniBloccate: 0,
    pagineGenerate: 0,
    risorseVerificate: 0,
    risorseLotto1: 0,
    risorseLotto2: 0,
    risorseLotto3: 0,
    risorseLotto4: 0,
    risorseTotali: 0
};

function checkUtf8AndControls(file) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('\u00C3') || content.includes('\u00E2') || content.includes('\uFFFD') || content.includes('??')) {
        errors.push(`File ${file} contiene mojibake o caratteri non ammessi.`);
    }
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(content)) {
        errors.push(`File ${file} contiene caratteri di controllo non ammessi.`);
    }
}

try {
    ['articoli.json', 'pubblicazioni.json', 'audio.json'].forEach(f => checkUtf8AndControls(path.join(dataDir, f)));

    const articoli = JSON.parse(fs.readFileSync(path.join(dataDir, 'articoli.json'), 'utf8').replace(/^\uFEFF/, ''));
    const pubblicazioni = JSON.parse(fs.readFileSync(path.join(dataDir, 'pubblicazioni.json'), 'utf8').replace(/^\uFEFF/, ''));
    const audio = JSON.parse(fs.readFileSync(path.join(dataDir, 'audio.json'), 'utf8').replace(/^\uFEFF/, ''));

    if (articoli.length !== 88) errors.push(`Numero articoli: attesi 88, trovati ${articoli.length}`);
    if (pubblicazioni.length !== 8) errors.push(`Numero pubblicazioni: attese 8, trovate ${pubblicazioni.length}`);
    if (audio.length !== 3) errors.push(`Numero audio: attesi 3, trovati ${audio.length}`);

    let slugs = new Set();
    let oldUrls = new Set();
    let redirectMatrix = new Map();

    const redirectCsv = path.join(dir, 'redirect_vecchio_nuovo_lotto2.csv');
    if (fs.existsSync(redirectCsv)) {
        const lines = fs.readFileSync(redirectCsv, 'utf8').split('\n');
        for (let line of lines) {
            const [oldUrl, newUrl] = line.trim().split(',');
            if (oldUrl && newUrl) redirectMatrix.set(oldUrl, newUrl);
        }
    }

    articoli.forEach(a => {
        if (!a.titolo || !a.slug || !a.statoComplessivo) errors.push(`Campi mancanti in articolo: ${a.titolo || 'Sconosciuto'}`);
        if (slugs.has(a.slug)) errors.push(`Slug duplicato: ${a.slug}`);
        if (a.slug.includes('%')) errors.push(`Slug contiene %: ${a.slug}`);
        if (/[^a-z0-9-]/.test(a.slug)) errors.push(`Slug contiene caratteri non ammessi: ${a.slug}`);
        
        if (a.urlOriginale && !redirectMatrix.has(a.urlOriginale) && a.redirectPrevisto) {
            errors.push(`URL originale non presente in redirect_vecchio_nuovo_lotto2.csv: ${a.urlOriginale}`);
        }
        
        if (a.canonicalFuturo && !a.canonicalFuturo.includes(a.slug)) {
            errors.push(`Canonical non corrisponde allo slug: ${a.canonicalFuturo} vs ${a.slug}`);
        }

        if (a.destinazioneLocale && !a.destinazioneLocale.includes(a.slug)) {
            errors.push(`Destinazione locale non corrisponde allo slug: ${a.destinazioneLocale} vs ${a.slug}`);
        }

        slugs.add(a.slug);
        
        const ammessi = ['usare-immagine-originale', 'omettere-immagine', 'attendere-verifica-fondazione', 'sostituire-in-futuro', 'non-pubblicare-duplicato', 'memoria-storica-da-verificare'];
        if (!ammessi.includes(a.azioneImmagine)) errors.push(`Azione immagine non ammessa: ${a.azioneImmagine}`);
        
        const bloccato = a.statoComplessivo.startsWith('richiede-') || a.statoComplessivo === 'possibile-duplicato' || a.statoComplessivo === 'non-migrare-per-ora';
        if (a.corpoHtml) {
            stats.corpiEstratti++;
        } else {
            stats.senzaCorpo++;
        }

        if (bloccato) {
            stats.totaleBloccati++;
            if (a.corpoHtml) stats.conCorpoMaBloccati++;
        } else {
            stats.generabili++;
            if (!a.corpoHtml) errors.push(`Articolo dichiarato completo ma privo di corpoHtml: ${a.slug}`);
        }
        
        if (bloccato && a.corpoHtml) {
            // "uno dei 5 articoli incompleti possiede un corpo inventato" (ma se c'è, deve essere reale. Controlliamo se è inventato)
            if (a.corpoHtml.includes('[CONTENUTO PROVVISORIO]')) errors.push(`Articolo incompleto possiede corpo fittizio: ${a.slug}`);
        }
    });

    pubblicazioni.forEach(p => {
        if (!p.titolo || !p.slug || !p.statoMigrazione) errors.push(`Campi mancanti in pubblicazione: ${p.titolo}`);
        if (p.statoMigrazione === 'non-migrare-per-ora') {
            stats.pubblicazioniBloccate++;
        } else {
            stats.pubblicazioniComplete++;
            if (!p.corpoHtml) errors.push(`Pubblicazione generabile priva di corpoHtml: ${p.slug}`);
        }
    });

    // Verifica file generati
    const previewDir = path.join(dir, 'build-preview');
    const isDefinitive = process.argv.includes('--definitive');

    const scanDir = (directory, isPreview) => {
        if (!fs.existsSync(directory)) return;
        const files = fs.readdirSync(directory);
            for (const file of files) {
                const fullPath = path.join(directory, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    scanDir(fullPath, isPreview);
                } else if (fullPath.endsWith('.html')) {
                    stats.pagineGenerate++;
                    const content = fs.readFileSync(fullPath, 'utf8');
                    
                    if (!fullPath.includes('index-lotto2B')) {
                        if (content.includes('[CONTENUTO PROVVISORIO]')) errors.push(`Placeholder trovato in: ${fullPath}`);
                        if (content.toLowerCase().includes('chatgpt')) errors.push(`Link ChatGPT trovato in: ${fullPath}`);
                        if (!content.includes('<div class="article-body">') || content.includes('corpoHtml assente')) errors.push(`Corpo mancante in: ${fullPath}`);
                        if (content.includes('Redazione COINSIEME')) errors.push(`Autore fallback (Redazione COINSIEME) trovato in: ${fullPath}`);
                        if (content.includes('2024-01-01') || content.includes('1 gennaio 2024')) errors.push(`Data fallback (2024-01-01) trovata in: ${fullPath}`);
                        if (content.includes('Sintesi non disponibile')) errors.push(`Sintesi non disponibile trovata in: ${fullPath}`);
                        if (/\{\{.*?\}\}/.test(content)) errors.push(`Token template inrisolto trovato in: ${fullPath}`);
                        if (/Condividi[A-Z]/.test(content) || />Condividi</.test(content)) errors.push(`Residuo editoriale Site123 trovato in: ${fullPath}`);
                    }
                    
                    // Simple check for mapped image existence if img tag is present
                    const imgMatch = content.match(/<img[^>]*src="\.\.\/\.\.\/assets\/([^"]+)"[^>]*>/i);
                    if (imgMatch) {
                        const imgPath = path.join(previewDir, 'assets', imgMatch[1]);
                        if (!fs.existsSync(imgPath)) {
                            if (!imgMatch[1].startsWith('official_logo')) {
                                errors.push(`Immagine mappata non trovata fisicamente in build-preview/assets: ${imgMatch[1]} (${fullPath})`);
                            }
                        } else {
                            stats.risorseVerificate++;
                        }
                    }
                    
                    // Controlla CSS e JS
                    const cssPath = isPreview ? path.join(previewDir, 'css', 'style.css') : path.join(dir, 'css', 'style.css');
                    const jsPath = isPreview ? path.join(previewDir, 'js', 'main.js') : path.join(dir, 'js', 'main.js');
                    if (!fs.existsSync(cssPath)) errors.push(`CSS non raggiungibile per l'anteprima: ${cssPath}`);
                    if (!fs.existsSync(jsPath)) errors.push(`JS non raggiungibile per l'anteprima: ${jsPath}`);
                    
                    // Verifica risorse non verificate in pubblicazioni
                    if (fullPath.includes('pubblicazioni') && fullPath.includes('70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook')) {
                        if (content.includes('drive.google.com') || content.includes('href="https://drive.google.com')) {
                            errors.push(`Collegamento Drive attivo trovato in pubblicazione non verificata: ${fullPath}`);
                        }
                    }
                }
            }
        };

        if (isDefinitive) {
            scanDir(path.join(dir, 'articoli'), false);
            scanDir(path.join(dir, 'pubblicazioni'), false);
            scanDir(previewDir, true);

            // Verifica che in articoli e pubblicazioni ci siano solo gli 8 record scelti (le uniche cartelle presenti)
            const countSubfolders = (p) => fs.existsSync(p) ? fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory()).length : 0;
            const articoliFolders = countSubfolders(path.join(dir, 'articoli'));
            const pubblicazioniFolders = countSubfolders(path.join(dir, 'pubblicazioni'));
            if (articoliFolders !== 76) errors.push(`Previsti 76 articoli generati definitivamente, trovati: ${articoliFolders}`);
            if (pubblicazioniFolders !== 2) errors.push(`Previsti 2 pubblicazioni generate definitivamente, trovate: ${pubblicazioniFolders}`);
            
            // Check indici
            const artIndexFile = path.join(previewDir, 'articoli-index-lotto2B.html');
            const pubIndexFile = path.join(previewDir, 'pubblicazioni-index-lotto2B.html');
            if (!fs.existsSync(artIndexFile)) errors.push("Indice articoli mancante");
            if (!fs.existsSync(pubIndexFile)) errors.push("Indice pubblicazioni mancante");
            
            [artIndexFile, pubIndexFile].forEach(idxFile => {
                if (fs.existsSync(idxFile)) {
                    const content = fs.readFileSync(idxFile, 'utf8');
                    if (content.includes('CONTENUTO PROVVISORIO')) errors.push(`[CONTENUTO PROVVISORIO] trovato in ${idxFile}`);
                    if (content.includes('class="ph"')) errors.push(`class="ph" trovato in ${idxFile}`);
                    if (content.toLowerCase().includes('placeholder')) errors.push(`parola placeholder trovata in ${idxFile}`);
                    if (content.includes('href="#"')) errors.push(`href="#" trovato in ${idxFile}`);
                    if (content.includes('Se hai un contributo da offrire')) errors.push(`CTA trovata in ${idxFile}`);
                    if (content.includes('nav aria-label="Paginazione articoli"')) errors.push(`Paginazione trovata in ${idxFile}`);
                    
                    if (idxFile.includes('articoli')) {
                        const count = (content.match(/data-lotto2b-card="articolo"/g) || []).length;
                        if (count !== 6) errors.push(`Indice articoli ha ${count} card invece di 6`);
                    } else {
                        const count = (content.match(/data-lotto2b-card="pubblicazione"/g) || []).length;
                        if (count !== 2) errors.push(`Indice pubblicazioni ha ${count} card invece di 2`);
                    }
                }
            });
            
            // Verifica log collaudo
            const log1Path = path.join(dir, 'scratch', 'diagnostica-lotto2B', 'lotto1-http-validation.jsonl');
            const log2Path = path.join(dir, 'scratch', 'diagnostica-lotto2B', 'lotto2-http-validation.jsonl');
            const log3Path = path.join(dir, 'scratch', 'diagnostica-lotto2B', 'lotto3-http-validation.jsonl');
            const log4Path = path.join(dir, 'scratch', 'diagnostica-lotto2B', 'lotto4-http-validation.jsonl');
            
            const processLog = (logPath, expectedCount, statKey) => {
                if (!fs.existsSync(logPath)) {
                    errors.push(`Log mancante: ${logPath}`);
                    return;
                }
                const content = fs.readFileSync(logPath, 'utf8').trim();
                if (!content) {
                    errors.push(`Log vuoto: ${logPath}`);
                    return;
                }
                const lines = content.split('\n');
                if (lines.length !== expectedCount) {
                    errors.push(`Previsti ${expectedCount} record in ${logPath}, trovati: ${lines.length}`);
                }
                let count = 0;
                lines.forEach(line => {
                    try {
                        const l = JSON.parse(line);
                        count++;
                        if (l.httpStatus !== 200) errors.push(`HTTP diverso da 200: ${l.url}`);
                        if (l.presenzaPh) errors.push(`presenzaPh=true in: ${l.url}`);
                        if (l.linkLocaliRotti > 0) errors.push(`linkLocaliRotti > 0 in: ${l.url}`);
                        if (l.placeholder > 0) errors.push(`placeholder > 0 in: ${l.url}`);
                        if (l.immaginiRotte > 0) errors.push(`immaginiRotte > 0 in: ${l.url}`);
                        if (l.cssCaricato === false) errors.push(`CSS non caricato in: ${l.url}`);
                        if (l.jsCaricato === false) errors.push(`JavaScript non caricato in: ${l.url}`);
                        if (l.linkChatGPT > 0) errors.push(`link ChatGPT trovati in: ${l.url}`);
                        if (l.utmChatGPT > 0) errors.push(`UTM ChatGPT trovati in: ${l.url}`);
                        if (l.tokenTemplateIrrisolti > 0) errors.push(`Token irrisolti in: ${l.url}`);
                    } catch (e) {
                        errors.push(`JSON non valido in ${logPath}: ${line}`);
                    }
                });
                stats[statKey] = count;
                stats.risorseTotali += count;
            };

            processLog(log1Path, 22, 'risorseLotto1');
            processLog(log2Path, 20, 'risorseLotto2');
            processLog(log3Path, 20, 'risorseLotto3');
            processLog(log4Path, 16, 'risorseLotto4');

        } else {
            scanDir(previewDir, true);
        }

} catch (e) {
    errors.push(e.message);
}

if (errors.length > 0) {
    console.error("Validazione fallita con i seguenti errori:");
    errors.forEach(e => console.error("- " + e));
    process.exit(1);
} else {
    console.log("Validazione superata.");
    console.log(`Articoli con corpo estratto: ${stats.corpiEstratti}`);
    console.log(`Articoli senza corpo: ${stats.senzaCorpo}`);
    console.log(`Articoli immediatamente generabili secondo gli stati editoriali: ${stats.generabili}`);
    console.log(`Articoli con corpo ma bloccati per altre verifiche: ${stats.conCorpoMaBloccati}`);
    console.log(`Totale bloccato dalla generazione: ${stats.totaleBloccati}`);
    console.log(`Pubblicazioni con corpo: ${stats.pubblicazioniComplete}`);
    console.log(`Pubblicazioni bloccate: ${stats.pubblicazioniBloccate}`);
    console.log(`Pagine generate: ${stats.pagineGenerate}`);
    console.log(`Risorse Lotto 1 verificate: ${stats.risorseLotto1}`);
    console.log(`Risorse Lotto 2 verificate: ${stats.risorseLotto2}`);
    console.log(`Risorse Lotto 3 verificate: ${stats.risorseLotto3}`);
    console.log(`Risorse Lotto 4 verificate: ${stats.risorseLotto4}`);
    console.log(`Risorse complessive verificate dai log: ${stats.risorseTotali}`);
}
