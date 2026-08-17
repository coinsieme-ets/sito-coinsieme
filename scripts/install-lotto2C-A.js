const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';
const rootDir = path.join(__dirname, '..');
const backupDir = path.join(__dirname, '..', '..', `backup-pre-lotto2C-A-${Date.now()}`);

// 1. Backup
function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        let stat = fs.lstatSync(path.join(from, element));
        if (stat.isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else if (stat.isDirectory() && element !== 'node_modules' && element !== '.git' && !element.startsWith('backup-')) {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}
console.log('Creazione backup in:', backupDir);
copyFolderSync(rootDir, backupDir);

const dataJsonPath = path.join(rootDir, 'data', 'articoli.json');
const htmlPath = path.join(rootDir, 'articoli.html');
const templatePath = path.join(rootDir, 'articolo.html');

let articoli = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8').replace(/^\uFEFF/,''));
let template = fs.readFileSync(templatePath, 'utf8');

// The 6 articles to install
const targetSlugs = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html' // senza -copy
];

// Copy PDF
const pdfSrc = 'C:\\Users\\Utente\\OneDrive\\Documenti\\COINSIEME\\Backup_completo_Site123_2026-08-13\\documenti\\normal_648b3bda939b2.pdf';
const docDir = path.join(rootDir, 'documenti');
if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
const pdfDestPath = path.join(docDir, 'pnrr-linee-guida-accessibilita.pdf');
if (fs.existsSync(pdfSrc)) {
    fs.copyFileSync(pdfSrc, pdfDestPath);
} else {
    console.error('PDF ORIGINALE NON TROVATO');
}
const pdfDestUrl = 'documenti/pnrr-linee-guida-accessibilita.pdf';

let installati = [];

targetSlugs.forEach(t => {
    let a = articoli.find(x => x.fileSorgente === t);
    let newHtml = a.corpoHtml;
    
    // Link sanitization (exact logic as preview, but installing)
    let linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let linkMap = {};
    while ((match = linkRegex.exec(newHtml)) !== null) {
        let href = match[1].trim();
        linkMap[href] = true;
    }
    
    for (let href of Object.keys(linkMap)) {
        let propHref = href;
        if (href.includes('chatgpt.com') && !href.includes('utm_source=chatgpt.com')) {
            propHref = '';
        } else if (href.includes('utm_source=chatgpt.com')) {
            let u = new URL(href);
            u.searchParams.delete('utm_source');
            propHref = u.toString();
        } else if (href.includes('musei.beniculturali.it')) {
            propHref = '';
        } else if (href.includes('#:~:text=')) {
            propHref = href.split('#')[0];
        } else if (href.includes('files.cdn-files-a.com/uploads/8161177/normal_648b3bda939b2.pdf') || href.includes('normal_648b3bda939b2.pdf')) {
            propHref = '/' + pdfDestUrl;
        }

        if (propHref === '') { 
            let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let rx = new RegExp(`<a\\s+[^>]*href="${escHref}"[^>]*>([\\s\\S]*?)<\\/a>`, 'gi');
            newHtml = newHtml.replace(rx, '<span>$1</span>');
        } else if (propHref !== href) { 
            let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let rx = new RegExp(`(<a\\s+[^>]*href=")(${escHref})("[^>]*>)`, 'gi');
            newHtml = newHtml.replace(rx, `$1${propHref}$3`);
        }
    }
    
    let outHtml = template.replace(
        /<div class="article-body">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
        '<div class="article-body">\n' + newHtml + '\n</div>\n</div>\n</section>'
    );
    outHtml = outHtml.replace(/<h1 id="articolo-titolo"[^>]*>[\s\S]*?<\/h1>/, `<h1 id="articolo-titolo" style="margin-bottom:20px;">${a.titolo}</h1>`);
    outHtml = outHtml.replace(/<title>.*?<\/title>/, `<title>${a.titolo} — Fondazione COINSIEME ETS</title>`);
    outHtml = outHtml.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${a.titolo}. Leggi l'articolo completo.">`);
    outHtml = outHtml.replace(/<span class="ph">\[CONTENUTO PROVVISORIO\]<\/span>/g, '');
    outHtml = outHtml.replace(/\[CONTENUTO PROVVISORIO\]/g, '');
    // Rimuovi immagini placeholder (variante editoriale testuale pulita)
    outHtml = outHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/, '');
    outHtml = outHtml.replace(/<div class="placeholder-banner"[^>]*>[\s\S]*?<\/div>/, '');

    // Resolve internal paths for deep nested pages if needed (but they are in root like previous articles)
    let outDir = path.join(rootDir, a.slug);
    if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf8');
    installati.push(a.slug);
});

// Update data/articoli.json to mark `-copy` as non-indexed if needed, 
// or simply we rewrite `articoli.html` keeping out `-copy`.
// The user says: "Aggiorna gli archivi locali affinché comprendano i sei nuovi articoli... esclusione di tutti i record -copy."
// Let's remove -copy from data/articoli.json entirely or add a flag. The prompt says "non cancellare la copia" but "escludi la copia dagli archivi".
articoli = articoli.filter(a => !a.fileSorgente.includes('-copy'));
fs.writeFileSync(dataJsonPath, JSON.stringify(articoli, null, 2), 'utf8');

// Build the archive page (articoli.html)
// We need to inject the 6 articles into the `articoli.html` grid.
// Wait, `articoli.html` is dynamically rendering from JS or statically generated?
// Previous session: "Consultazione progressiva: Mantieni tutte le 74 card nel markup per il funzionamento senza JavaScript, ma con JavaScript attivo mostra inizialmente 12/18".
// This means the cards are statically in HTML! We must regenerate `articoli.html`.

let archiveHtml = fs.readFileSync(htmlPath, 'utf8');
// Sort by title alphabetically
articoli.sort((a,b) => a.titolo.localeCompare(b.titolo, 'it'));

let cardsHtml = articoli.map(a => {
    let imgHtml = '';
    // if no image, we just don't put the image or put a fallback, but the user said "Senza placeholder grafici" for the new 6.
    // In the archive, they might need a card background. 
    // I'll just omit the image for the new 6 if they have none, or use a neutral background.
    return `
            <a href="/${a.slug}/index.html" class="archivio-card archivio-card-link" data-title="${a.titolo.toLowerCase().replace(/"/g, '&quot;')}">
                <div class="archivio-card-text-only">
                    <div class="archivio-card-meta">Articolo</div>
                    <h2 class="archivio-card-title">${a.titolo}</h2>
                    <div class="archivio-card-action">Leggi l'articolo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                </div>
            </a>`;
}).join('\n');

// Replace grid content
let gridRegex = /<div class="archivio-grid">([\s\S]*?)<\/div>\s*(?:<div class="archivio-load-more-container"|<div id="archivio-load-more")/i;
let match = archiveHtml.match(gridRegex);
if (match) {
    archiveHtml = archiveHtml.substring(0, match.index) + `<div class="archivio-grid">\n${cardsHtml}\n        </div>\n        ` + archiveHtml.substring(match.index + match[0].length - (archiveHtml.substring(match.index).startsWith('<div class="archivio-load-more') ? 32 : 28));
} else {
    // fallback string replacement if we just find <div class="archivio-grid">
    let parts = archiveHtml.split('<div class="archivio-grid">');
    if (parts.length > 1) {
        let postGrid = parts[1].split('</div>');
        postGrid.shift(); // remove old grid content
        archiveHtml = parts[0] + '<div class="archivio-grid">\n' + cardsHtml + '\n</div>' + postGrid.join('</div>');
    }
}


fs.writeFileSync(htmlPath, archiveHtml, 'utf8');

// Update stats count in archiveHtml if we just did the string replace
let statsRegex = /<span id="archivio-stats-count">\d+<\/span>/;
archiveHtml = archiveHtml.replace(statsRegex, `<span id="archivio-stats-count">${articoli.length}</span>`);
fs.writeFileSync(htmlPath, archiveHtml, 'utf8');

// Redirects recording
let redirects = [
    {
        from: '/innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gia-tra-noi-copy',
        to: '/innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gia-tra-noi'
    }
];
fs.writeFileSync(path.join(brainDir, 'redirects_lotto2C-A.json'), JSON.stringify(redirects, null, 2), 'utf8');

console.log('Installazione e aggiornamento indici completati.');
