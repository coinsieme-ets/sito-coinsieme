const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let type = null;
let slug = null;
let limit = Infinity;
let isDryRun = false;
let outputDir = null;
let confirmLotto2B = false;
let batchLotto = null;
let skipExisting = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type') type = args[++i];
    if (args[i] === '--slug') slug = args[++i];
    if (args[i] === '--limit') limit = parseInt(args[++i], 10);
    if (args[i] === '--dry-run') isDryRun = true;
    if (args[i] === '--output') outputDir = args[++i];
    if (args[i] === '--confirm-lotto2b-sample') confirmLotto2B = true;
    if (args[i] === '--batch') batchLotto = args[++i];
    if (args[i] === '--skip-existing') skipExisting = true;
}

if (outputDir === 'definitive' && !confirmLotto2B) {
    console.error("Errore: per la destinazione definitiva è richiesto il flag --confirm-lotto2b-sample.");
    process.exit(1);
}
if (outputDir !== 'build-preview' && outputDir !== 'definitive') {
    console.error("Errore: output consentiti: build-preview o definitive.");
    process.exit(1);
}

const manifestPath = path.join(__dirname, '..', 'batch_manifest_lotto2B.csv');
let allowedSlugs = [];
if (batchLotto) {
    const manifestLines = fs.readFileSync(manifestPath, 'utf8').split('\n');
    let batchName = '';
    if (batchLotto === 'lotto1') batchName = 'Lotto 1';
    else if (batchLotto === 'lotto2') batchName = 'Lotto 2';
    else if (batchLotto === 'lotto3') batchName = 'Lotto 3';
    else if (batchLotto === 'lotto4') batchName = 'Lotto 4';

    for (const line of manifestLines) {
        if (line.startsWith(batchName + ';')) {
            allowedSlugs.push(line.split(';')[3]);
        }
    }
} else {
    // If no batch is specified, we might not have a filter, or we can just fail.
    // For now we assume no filter if allowedSlugs is empty
}

const dir = path.join(__dirname, '..');
const dataDir = path.join(dir, 'data');
const templatesDir = path.join(dir, 'templates');
const buildDir = outputDir === 'definitive' ? dir : path.join(dir, outputDir);

if (!isDryRun && outputDir !== 'definitive' && !fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

if (!isDryRun && outputDir === 'build-preview') {
    ['css', 'js', 'assets', 'loghi'].forEach(folder => {
        const src = path.join(dir, folder);
        const dest = path.join(buildDir, folder);
        if (fs.existsSync(src)) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.cpSync(src, dest, { recursive: true });
        }
    });
}

const articoli = JSON.parse(fs.readFileSync(path.join(dataDir, 'articoli.json'), 'utf8').replace(/^\uFEFF/, ''));
const pubblicazioni = JSON.parse(fs.readFileSync(path.join(dataDir, 'pubblicazioni.json'), 'utf8').replace(/^\uFEFF/, ''));

const imageMapFile = path.join('C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393', 'revisione_visiva_immagini_lotto2_finale.csv');
const imageMap = {};
if (fs.existsSync(imageMapFile)) {
    const lines = fs.readFileSync(imageMapFile, 'utf8').split('\n');
    lines.shift(); 
    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
        const id = parts[0];
        const percorsoLocale = parts[2];
        const altText = parts[5];
        const destinazioneProposta = parts[21] || parts[parts.length - 2];
        imageMap[id] = { percorsoLocale, altText, destinazioneProposta };
    });
}

const artTemplate = fs.readFileSync(path.join(templatesDir, 'articolo-template.html'), 'utf8');
const pubTemplate = fs.readFileSync(path.join(templatesDir, 'pubblicazione-template.html'), 'utf8');

let generatedCount = 0;
let errorsCount = 0;
const generatedArticoli = [];
const generatedPubblicazioni = [];

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function processItem(item, isPub) {
    try {
        if (batchLotto === 'lotto1') {
            if (lotto1Slugs.includes(item.slug)) {
                console.log(`Processing lotto1 slug: ${item.slug}`);
            } else {
                return;
            }
        } else if (outputDir === 'definitive') {
            if (batchLotto && !allowedSlugs.includes(item.slug)) return;
        }

        if (item.statoComplessivo && (item.statoComplessivo.startsWith('richiede-') || item.statoComplessivo === 'possibile-duplicato' || item.statoComplessivo === 'non-migrare-per-ora')) return;
        if (item.statoMigrazione === 'non-migrare-per-ora') return;
        
        if (!item.corpoHtml) {
            throw new Error(`corpoHtml assente in ${item.slug}`);
        }

        let html = isPub ? pubTemplate : artTemplate;
        html = html.replace(/\{\{TITOLO\}\}/g, escapeHtml(item.titolo));
        
        // Fallback descrizione
        let desc = isPub ? (item.sintesiTesto || `Pubblicazione: ${item.titolo}`) : (item.sintesiTesto || `Articolo: ${item.titolo}`);
        desc = desc.replace(/Condividi[A-Z]/g, match => match.substring(9));
        desc = desc.replace(/Condividi/g, '');
        html = html.replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(desc));
        
        const typeUrl = isPub ? 'pubblicazioni' : 'articoli';
        html = html.replace(/\{\{CANONICAL_URL\}\}/g, escapeHtml(`https://www.coinsieme.it/${typeUrl}/${item.slug}/`));
        
        if (item.autore) {
            html = html.replace(/\{\{AUTORE_HTML\}\}/g, `<span>di <strong style="color:var(--marrone);">${escapeHtml(item.autore)}</strong></span><span aria-hidden="true">·</span>`);
            html = html.replace(/\{\{SCHEMA_AUTORE\}\}/g, `"author": { "@type": "Person", "name": "${escapeHtml(item.autore)}" },`);
        } else {
            html = html.replace(/\{\{AUTORE_HTML\}\}/g, '');
            html = html.replace(/\{\{SCHEMA_AUTORE\}\}/g, '');
        }
        
        if (item.data) {
            const strDate = new Date(item.data).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
            html = html.replace(/\{\{DATA_HTML\}\}/g, `<time datetime="${item.data}">${strDate}</time><span aria-hidden="true">·</span>`);
            html = html.replace(/\{\{SCHEMA_DATA\}\}/g, `"datePublished": "${item.data}",`);
        } else {
            html = html.replace(/\{\{DATA_HTML\}\}/g, '');
            html = html.replace(/\{\{SCHEMA_DATA\}\}/g, '');
        }
        
        const tempo = Math.max(1, Math.ceil((item.corpoHtml.replace(/<[^>]*>?/gm, '').length) / 1000));
        html = html.replace(/\{\{TEMPO_LETTURA\}\}/g, tempo);
        
        let imgHtml = '';
        if (item.azioneImmagine === 'usare-immagine-originale' && item.idImmagine && imageMap[item.idImmagine]) {
            const mappedImg = imageMap[item.idImmagine];
            if (mappedImg.destinazioneProposta === 'riutilizzabile-articolo-originale') {
                if (fs.existsSync(mappedImg.percorsoLocale)) {
                    const ext = path.extname(mappedImg.percorsoLocale).toLowerCase();
                    const webName = `${item.idImmagine}${ext}`;
                    const destPath = path.join(buildDir, 'assets', webName);
                    
                    if (!isDryRun) {
                        if (fs.existsSync(destPath)) {
                            const srcHash = require('crypto').createHash('sha256').update(fs.readFileSync(mappedImg.percorsoLocale)).digest('hex');
                            const dstHash = require('crypto').createHash('sha256').update(fs.readFileSync(destPath)).digest('hex');
                            if (srcHash !== dstHash) {
                                throw new Error(`Conflitto immagine: file esistente diverso da sorgente per ${webName}`);
                            }
                        } else {
                            fs.copyFileSync(mappedImg.percorsoLocale, destPath);
                        }
                    }
                    item.percorsoWebReale = `assets/${webName}`;
                    imgHtml = `
        <figure style="margin:0 0 40px;">
          <img src="../../assets/${webName}" alt="${escapeHtml(mappedImg.altText)}" style="width:100%; height:320px; object-fit:cover; border-radius:var(--radius-lg);">
        </figure>`;
                } else {
                    throw new Error(`Immagine mappata non trovata fisicamente: ${mappedImg.percorsoLocale}`);
                }
            }
        }
        html = html.replace(/\{\{IMMAGINE_HTML\}\}/g, imgHtml);
        
        if (isPub) {
            let pulsanteHtml = '';
            if (item.statoRisorsa === 'risorsa-locale-verificata') {
                pulsanteHtml = `<a href="../../assets/${escapeHtml(item.allegatiPDF || '#')}" class="btn btn-primary" download>Scarica PDF</a><br><br>`;
            } else {
                pulsanteHtml = `<span class="note" style="color:var(--grigio-testo); font-style:italic;">Risorsa digitale disponibile previa verifica della Fondazione</span><br><br>`;
                // Neutralizza i link a drive.google.com nel corpo
                if (item.corpoHtml) {
                    item.corpoHtml = item.corpoHtml.replace(/<a\s+[^>]*href="[^"]*drive\.google\.com[^"]*"[^>]*>(.*?)<\/a>/gi, '$1');
                    item.corpoHtml = item.corpoHtml.replace(/https:\/\/drive\.google\.com[^\s<]*/gi, '');
                }
            }
            html = html.replace(/\{\{PULSANTE_DOWNLOAD\}\}/g, pulsanteHtml);
        }

        let cleanCorpo = item.corpoHtml || '';
        cleanCorpo = cleanCorpo.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanCorpo = cleanCorpo.replace(/<a[^>]*href="[^"]*chatgpt[^"]*"[^>]*>.*?<\/a>/gi, '');
        cleanCorpo = cleanCorpo.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        cleanCorpo = cleanCorpo.replace(/<a[^>]*>Condividi<\/a>/gi, '');
        cleanCorpo = cleanCorpo.replace(/<a[^>]*title="Printer Friendly[^"]*"[^>]*><\/a>/gi, '');
        
        // Previeni overflow orizzontale
        cleanCorpo = `<div style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${cleanCorpo}</div>`;

        html = html.replace(/\{\{CORPO_HTML\}\}/g, cleanCorpo);
        
        html = html.replace(/\[CONTENUTO PROVVISORIO\]/gi, '');
        
        const outPath = path.join(buildDir, typeUrl, item.slug);
        const outFile = path.join(outPath, 'index.html');
        
        if (skipExisting && fs.existsSync(outFile)) {
            const existingHtml = fs.readFileSync(outFile, 'utf8');
            if (existingHtml !== html) {
                fs.writeFileSync(path.join(dir, 'debug_old.html'), existingHtml, 'utf8');
                fs.writeFileSync(path.join(dir, 'debug_new.html'), html, 'utf8');
                console.error(`CONFLITTO: La pagina esistente differisce dal nuovo output generato: ${outFile}`);
                console.error(`Trovati file debug_old.html e debug_new.html in root`);
                process.exit(1);
            } else {
                console.log(`SKIP: Pagina già presente e conforme: ${item.slug}`);
                return;
            }
        }
        
        if (!isDryRun) {
            fs.mkdirSync(outPath, { recursive: true });
            fs.writeFileSync(outFile, html, 'utf8');
        }
        if (isPub) {
            generatedPubblicazioni.push(item);
        } else {
            generatedArticoli.push(item);
        }
        generatedCount++;
    } catch (e) {
        errorsCount++;
        console.error(`Errore generazione ${item.slug}:`, e.message);
    }
}

function buildIndex(type, items) {
    let cardsHTML = '';
    items.forEach(item => {
        let snippet = item.sintesi ? `<p class="article-summary">${item.sintesi.substring(0, 100)}...</p>` : `<p class="article-summary">Sintesi non disponibile</p>`;
        let linkPath = type === 'articoli' ? `../articoli/${item.slug}/index.html` : `../pubblicazioni/${item.slug}/index.html`;
        const cardAttr = type === 'articoli' ? 'data-lotto2b-card="articolo"' : 'data-lotto2b-card="pubblicazione"';
        cardsHTML += `
            <article class="article-card" ${cardAttr}>
                <a href="${linkPath}">
                    <h3 class="article-title">${item.titolo}</h3>
                    ${snippet}
                </a>
            </article>`;
    });

    let mainHtml = fs.readFileSync(path.join(dir, 'articoli.html'), 'utf8');
    
    // Remove Banner Contribuire completely
    mainHtml = mainHtml.replace(/<!-- ========== BANNER CONTRIBUIRE ========== -->[\s\S]*?<\/section>/gi, '');
    
    // Remove Paginazione completely
    mainHtml = mainHtml.replace(/<!-- Paginazione.*?-->[\s\S]*?<\/nav>/gi, '');
    
    // Fallback if pagination didn't match perfectly
    mainHtml = mainHtml.replace(/<nav aria-label="Paginazione articoli"[\s\S]*?<\/nav>/gi, '');
    
    // Remove any remaining .ph or [CONTENUTO PROVVISORIO]
    mainHtml = mainHtml.replace(/<span class="ph">.*?<\/span>/gi, '');
    mainHtml = mainHtml.replace(/\[CONTENUTO PROVVISORIO\]/gi, '');
    mainHtml = mainHtml.replace(/class="ph"/gi, '');
    mainHtml = mainHtml.replace(/placeholder/gi, ''); // remove the word placeholder

    // Neutralize href="#"
    // Some href="#" have aria-label, some don't. We should replace `href="#"` with `aria-disabled="true" style="cursor:default; opacity:0.5; text-decoration:none;"`
    // Actually the prompt says "usa elemento non cliccabile con aria-disabled="true""
    mainHtml = mainHtml.replace(/href="#"/gi, 'aria-disabled="true" style="cursor:default; text-decoration:none;"');

    // Remove the skip link's href="#" if any (it might be href="#main-content" which is fine)
    
    // Replace the inner content of the grid/list with our cards
    let updatedHtml = mainHtml.replace(/<div class="articles-grid">[\s\S]*?<\/div>/, `<div class="articles-grid">\n${cardsHTML}\n</div>`);
    // Se non trova articles-grid, cerca div list
    if (updatedHtml === mainHtml) {
        updatedHtml = mainHtml.replace(/<div\s+id="archivio-grid"[^>]*>[\s\S]*?<\/div>/, `<div id="archivio-grid" class="grid-3" style="margin-top: 8px;">\n${cardsHTML}\n</div>`);
    }

    // Aggiusta titolo e intestazione
    const tipoMaiusc = type.charAt(0).toUpperCase() + type.slice(1);
    updatedHtml = updatedHtml.replace(/<title>.*?<\/title>/, `<title>Anteprima ${tipoMaiusc} Lotto 2B</title>`);
    updatedHtml = updatedHtml.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>Indice temporaneo ${tipoMaiusc} Lotto 2B</h1>`);

    return updatedHtml;
}

if (type === 'articolo' || !type) {
    const list = slug ? articoli.filter(a => a.slug === slug) : articoli;
    let counted = 0;
    for (let i = 0; i < list.length; i++) {
        if (counted >= limit) break;
        processItem(list[i], false);
        counted++;
    }
}

if (type === 'pubblicazione' || !type) {
    const list = slug ? pubblicazioni.filter(p => p.slug === slug) : pubblicazioni;
    let counted = 0;
    for (let i = 0; i < list.length; i++) {
        if (counted >= limit) break;
        processItem(list[i], true);
        counted++;
    }
}

console.log(`Pagine generate: ${generatedCount}, Errori: ${errorsCount}`);

fs.writeFileSync(path.join(dataDir, 'articoli.json'), JSON.stringify(articoli, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'pubblicazioni.json'), JSON.stringify(pubblicazioni, null, 2), 'utf8');

if (outputDir === 'definitive') {
    if (batchLotto !== 'lotto1') {
        // Generazione indici
        const previewDir = path.join(dir, 'build-preview');
        if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

        // We need all authorized sample items (the 8 original items).
        const allowedSlugs = [
            "agricoltura-capodarco-vince-la-sua-battaglia-per-la-sede",
            "anac-nelle-gare-non-ci-possono-essere-discriminazioni-fra-regioni-per-la-selezione-di-coop-sociali",
            "appalti-nuove-regole-per-individuare-i-ccnl",
            "15-milioni-di-euro-per-la-digitalizzazione-del-terzo-settore",
            "50-anni-da-basaglia-e-dalla-prima-cooperative-di-integrazione-sociale",
            "assegno-ordinario-di-invalidita-e-lavoro-dipendente-decurtazioni-e-adempimenti",
            "70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook",
            "guida-allacitta-di-roma-anno-1990"
        ];

        const validArticoli = articoli.filter(a => allowedSlugs.includes(a.slug));
        const validPubblicazioni = pubblicazioni.filter(p => allowedSlugs.includes(p.slug));

        const artIndexHtml = buildIndex('articoli', validArticoli);
        const pubIndexHtml = buildIndex('pubblicazioni', validPubblicazioni);

        fs.writeFileSync(path.join(previewDir, 'articoli-index-lotto2B.html'), artIndexHtml, 'utf8');
        fs.writeFileSync(path.join(previewDir, 'pubblicazioni-index-lotto2B.html'), pubIndexHtml, 'utf8');
        console.log("Indici Lotto 2B generati in build-preview.");
    }
}
