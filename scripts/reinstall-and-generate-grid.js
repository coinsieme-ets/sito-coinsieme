const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataJsonPath = path.join(rootDir, 'data', 'articoli.json');
const htmlPath = path.join(rootDir, 'articoli.html');
const templatePath = path.join(rootDir, 'articolo.html');

let articoli = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
let template = fs.readFileSync(templatePath, 'utf8');

const targetFileSorgenti = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html'
];

// 1. Install the 6 articles under /articoli/<slug>/index.html
targetFileSorgenti.forEach(t => {
    let a = articoli.find(x => x.fileSorgente === t);
    if (!a) {
        console.error("Articolo non trovato per:", t);
        return;
    }

    let newHtml = a.corpoHtml;
    
    // Link sanitization
    let linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let linkMap = {};
    while ((match = linkRegex.exec(newHtml)) !== null) {
        linkMap[match[1].trim()] = true;
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
            propHref = '/documenti/pnrr-linee-guida-accessibilita.pdf';
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
    outHtml = outHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/g, '');
    outHtml = outHtml.replace(/<div class="placeholder-banner"[^>]*>[\s\S]*?<\/div>/g, '');

    // Canonical link tag exact match replacement
    let canonicalTag = `<link rel="canonical" href="https://www.coinsieme.it/articoli/${a.slug}/index.html">`;
    outHtml = outHtml.replace(/<link rel="canonical" href="[^"]*">/, canonicalTag);
    
    let outDir = path.join(rootDir, 'articoli', a.slug);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf8');
    console.log("Installato sotto /articoli/:", a.slug);
});

// 2. Rebuild articoli.html grid from scratch
let indicizzabili = articoli.filter(x => x.indicizzabile !== false);
indicizzabili.sort((a,b) => a.titolo.localeCompare(b.titolo, 'it'));

console.log("Totale carte da generare nell'indice:", indicizzabili.length);

let cardsHtml = indicizzabili.map(a => {
    let cardTitle = a.titolo.replace(/"/g, '&quot;');
    let cardTitleLower = a.titolo.toLowerCase().replace(/"/g, '&quot;');
    return `            <a href="/articoli/${a.slug}/index.html" class="archivio-card archivio-card-link" data-title="${cardTitleLower}">
                <div class="archivio-card-text-only">
                    <div class="archivio-card-meta">Articolo</div>
                    <h2 class="archivio-card-title">${cardTitle}</h2>
                    <div class="archivio-card-action">Leggi l'articolo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                </div>
            </a>`;
}).join('\n\n');

let archiveHtml = fs.readFileSync(htmlPath, 'utf8');

// Replace the contents inside <div class="archivio-grid"> ... </div>
const startMarker = '<div class="archivio-grid">';
const endMarker = '</div>';

let startIndex = archiveHtml.indexOf(startMarker);
if (startIndex === -1) {
    console.error("ERRORE: <div class=\"archivio-grid\"> non trovato in articoli.html");
    process.exit(1);
}

// Find <div style="text-align: center; margin-top: 3rem;"> or <div class="archivio-load-more-container"> that follows the grid
let loadMoreIndex = archiveHtml.indexOf('id="archivio-load-more"', startIndex);
if (loadMoreIndex === -1) {
    loadMoreIndex = archiveHtml.indexOf('class="archivio-load-more-container"', startIndex);
}

// Find the </div> right before loadMoreIndex
let beforeLoadMore = archiveHtml.substring(0, loadMoreIndex);
let gridEndIndex = beforeLoadMore.lastIndexOf('</div>');

let prefix = archiveHtml.substring(0, startIndex + startMarker.length);
let suffix = archiveHtml.substring(gridEndIndex);

let newArchiveHtml = prefix + '\n\n' + cardsHtml + '\n\n        ' + suffix;

// Update stats count to 80
let statsRegex = /<span id="archivio-stats-count">\d+<\/span>/;
newArchiveHtml = newArchiveHtml.replace(statsRegex, `<span id="archivio-stats-count">${indicizzabili.length}</span>`);

fs.writeFileSync(htmlPath, newArchiveHtml, 'utf8');
console.log("Griglia articoli.html rigenerata. Carte scritte:", indicizzabili.length);
