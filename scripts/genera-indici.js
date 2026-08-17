const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'articoli.json');
const pubDataPath = path.join(rootDir, 'data', 'pubblicazioni.json');
const articoliDir = path.join(rootDir, 'articoli');
const outDir = path.join(rootDir, 'build-preview');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function generateIndex() {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, ''));
    
    const articoliFolders = fs.readdirSync(articoliDir).filter(f => fs.statSync(path.join(articoliDir, f)).isDirectory());
    
    const articles = data.filter(a => articoliFolders.includes(a.slug) && !a.slug.endsWith('-copy'));
    
    const pubData = JSON.parse(fs.readFileSync(pubDataPath, 'utf8').replace(/^\uFEFF/, ''));
    const pubsToKeep = [
        '70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook',
        'guida-allacitta-di-roma-anno-1990'
    ];
    const publications = pubData.filter(a => pubsToKeep.includes(a.slug));
    
    articles.sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));
    publications.sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));
    
    function buildCards(items, basePath) {
        return items.map(item => {
            let hasValidLocalImage = false;
            let imgLocalPath = '';
            
            if (item.immagineCopertina && typeof item.immagineCopertina === 'string') {
                let relativePath = item.immagineCopertina.startsWith('/') ? item.immagineCopertina.substring(1) : item.immagineCopertina;
                let fullPath = path.join(rootDir, relativePath);
                
                if (fs.existsSync(fullPath)) {
                    hasValidLocalImage = true;
                    imgLocalPath = '/' + relativePath.replace(/\\/g, '/');
                }
            }
            
            const title = escapeHtml(item.titolo || '');
            const link = `/${basePath}/${item.slug}/`;
            const typeLabel = basePath === 'articoli' ? 'Articolo' : 'Pubblicazione';
            const actionText = basePath === 'articoli' ? 'Leggi l\'articolo' : 'Apri la scheda';
            
            // Icon from main site (the right arrow used in links)
            const actionIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
            
            let contentHtml = '';
            
            if (hasValidLocalImage) {
                contentHtml = `
                <img src="${escapeHtml(imgLocalPath)}" alt="" class="archivio-card-image" loading="lazy" width="600" height="337">
                <div class="archivio-card-content">
                    <div class="archivio-card-meta">${typeLabel}</div>
                    <h2 class="archivio-card-title">${title}</h2>
                    <div class="archivio-card-action">${actionText} ${actionIcon}</div>
                </div>
                `;
            } else {
                contentHtml = `
                <div class="archivio-card-text-only">
                    <div class="archivio-card-meta">${typeLabel}</div>
                    <h2 class="archivio-card-title">${title}</h2>
                    <div class="archivio-card-action">${actionText} ${actionIcon}</div>
                </div>
                `;
            }

            return `
            <a href="${link}" class="archivio-card archivio-card-link" data-title="${title.toLowerCase()}">
                ${contentHtml}
            </a>
            `;
        }).join('\n');
    }
    
    const articlesCardsHtml = buildCards(articles, 'articoli');
    const pubsCardsHtml = buildCards(publications, 'pubblicazioni');
    
    const artTemplatePath = path.join(rootDir, 'templates', 'archivio-articoli-template.html');
    let artHtml = fs.readFileSync(artTemplatePath, 'utf8');
    artHtml = artHtml.replace('{{COUNT}}', articles.length.toString())
                     .replace('{{CARDS}}', articlesCardsHtml);
    fs.writeFileSync(path.join(outDir, 'archivio-articoli.html'), artHtml);
    
    const pubTemplatePath = path.join(rootDir, 'templates', 'archivio-pubblicazioni-template.html');
    let pubHtml = fs.readFileSync(pubTemplatePath, 'utf8');
    pubHtml = pubHtml.replace('{{COUNT}}', publications.length.toString())
                     .replace('{{CARDS}}', pubsCardsHtml);
    fs.writeFileSync(path.join(outDir, 'archivio-pubblicazioni.html'), pubHtml);
    
    console.log(`Generati indici in build-preview/`);
    console.log(`Articoli: ${articles.length}`);
    console.log(`Pubblicazioni: ${publications.length}`);
}

generateIndex();
