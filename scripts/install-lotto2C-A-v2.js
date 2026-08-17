const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataJsonPath = path.join(rootDir, 'data', 'articoli.json');
const htmlPath = path.join(rootDir, 'articoli.html');
const templatePath = path.join(rootDir, 'articolo.html');
const docDir = path.join(rootDir, 'documenti');

let articoli = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
let template = fs.readFileSync(templatePath, 'utf8');

const targetSlugs = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html'
];

targetSlugs.forEach(t => {
    let a = articoli.find(x => x.fileSorgente === t);
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
    outHtml = outHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/, '');
    outHtml = outHtml.replace(/<div class="placeholder-banner"[^>]*>[\s\S]*?<\/div>/, '');

    // Canonical & Breadcrumbs
    outHtml = outHtml.replace(/<link rel="canonical" href="https:\/\/www.coinsieme.it\/[^"]*">/, `<link rel="canonical" href="https://www.coinsieme.it/articoli/${a.slug}/index.html">`);
    // Check if breadcrumbs are present in the template, replace if they are.
    // The previous generation didn't specifically target breadcrumbs, but let's replace `/articoli.html` in internal navigation if needed.
    
    let outDir = path.join(rootDir, 'articoli', a.slug);
    if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf8');
});

// Write JSON back is NOT needed since we already marked indicizzabile: false.

// Update archive
let indicizzabili = articoli.filter(x => x.indicizzabile !== false);
indicizzabili.sort((a,b) => a.titolo.localeCompare(b.titolo, 'it'));

let cardsHtml = indicizzabili.map(a => {
    let cardTitle = a.titolo.replace(/"/g, '&quot;');
    let cardTitleLower = cardTitle.toLowerCase();
    return `
            <a href="/articoli/${a.slug}/index.html" class="archivio-card archivio-card-link" data-title="${cardTitleLower}">
                <div class="archivio-card-text-only">
                    <div class="archivio-card-meta">Articolo</div>
                    <h2 class="archivio-card-title">${cardTitle}</h2>
                    <div class="archivio-card-action">Leggi l'articolo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                </div>
            </a>`;
}).join('\n');

let archiveHtml = fs.readFileSync(htmlPath, 'utf8');
let gridRegex = /<div class="archivio-grid">([\s\S]*?)<\/div>\s*(?:<div class="archivio-load-more-container"|<div id="archivio-load-more")/i;
let match = archiveHtml.match(gridRegex);
if (match) {
    archiveHtml = archiveHtml.substring(0, match.index) + `<div class="archivio-grid">\n${cardsHtml}\n        </div>\n        ` + archiveHtml.substring(match.index + match[0].length - (archiveHtml.substring(match.index).startsWith('<div class="archivio-load-more') ? 32 : 28));
}

let statsRegex = /<span id="archivio-stats-count">\d+<\/span>/;
archiveHtml = archiveHtml.replace(statsRegex, `<span id="archivio-stats-count">${indicizzabili.length}</span>`);
fs.writeFileSync(htmlPath, archiveHtml, 'utf8');
console.log('Fatto. Generati', indicizzabili.length, 'record.');
