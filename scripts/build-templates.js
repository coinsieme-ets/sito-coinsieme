const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

// Extract parts from index.html
const headMatches = indexHtml.match(/(<head>[\s\S]*?<\/head>)/);
const headerMatches = indexHtml.match(/(<!-- SKIP LINK -->[\s\S]*?<\/header>)/);
const footerMatches = indexHtml.match(/(<!-- ========== OVERLAY PIATTAFORMA ========== -->[\s\S]*?<\/html>)/);

function createTemplate(title, heading, isArticoli) {
    let head = headMatches[1].replace('<title>Fondazione COINSIEME ETS — Domotica assistiva, formazione, inclusione</title>', `<title>${title}</title>`);
    
    // Add canonical
    const canonicalUrl = isArticoli ? 'https://www.coinsieme.it/articoli.html' : 'https://www.coinsieme.it/pubblicazioni.html';
    head = head.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`);
    
    // Replace description
    const descText = isArticoli ? 
        "L'archivio degli articoli della Fondazione COINSIEME ETS sui temi dell'inclusione, cooperazione sociale, disabilità, domotica assistiva e innovazione sociale." :
        "L'archivio delle pubblicazioni e dei materiali editoriali della Fondazione COINSIEME ETS.";
    head = head.replace(/<meta name="description" content="[^"]+">/, `<meta name="description" content="${descText}">`);
    
    // Add archivio.css and make paths absolute
    head = head.replace('</head>', '  <link rel="stylesheet" href="/css/archivio.css">\n</head>');
    head = head.replace(/href="css\//g, 'href="/css/');
    
    // Adjust active state in navigation
    let header = headerMatches[1];
    if (isArticoli) {
        header = header.replace('<a href="articoli.html" class="nav-link">', '<a href="/articoli.html" class="nav-link" aria-current="page">');
    } else {
        header = header.replace('<a href="articoli.html" class="nav-link">', '<a href="/articoli.html" class="nav-link">');
    }
    header = header.replace(/href="([^#hj])/g, 'href="/$1'); // make links absolute
    header = header.replace(/src="assets\//g, 'src="/assets/');
    header = header.replace(/href="\/\//g, 'href="/');
    header = header.replace(/href="#"/g, 'href="javascript:void(0)"');
    header = header.replace(/class="ph"/g, 'class=""');
    
    let footer = footerMatches[1];
    footer = footer.replace('<script src="js/main.js"></script>', '<script src="/js/main.js"></script>\n<script src="/js/archivio.js"></script>');
    footer = footer.replace(/href="([^#hj])/g, 'href="/$1');
    footer = footer.replace(/href="\/\//g, 'href="/');
    footer = footer.replace(/href="#"/g, 'href="javascript:void(0)"');
    footer = footer.replace(/class="ph"/g, 'class=""');
    
    const searchLabel = isArticoli ? "Cerca articoli per titolo" : "Cerca pubblicazioni per titolo";
    const crossLinkHtml = isArticoli ? 
        `<a href="/pubblicazioni.html" class="btn btn-ghost" style="color:var(--bianco); border-color:rgba(255,255,255,0.3);">Consulta anche le pubblicazioni →</a>` :
        `<a href="/articoli.html" class="btn btn-ghost" style="color:var(--bianco); border-color:rgba(255,255,255,0.3);">Consulta tutti gli articoli →</a>`;
    
    const mainContent = `
<main id="main-content">
  <section class="hero-compact bg-notte" aria-labelledby="hero-titolo">
    <div class="container">
      <div class="hero-compact-content">
        <p class="hero-tagline" style="color:var(--terracotta-lite); margin-bottom: 8px;">Archivio</p>
        <h1 id="hero-titolo" style="color:var(--bianco); margin-bottom: 24px;">${heading}</h1>
        ${crossLinkHtml}
      </div>
    </div>
  </section>
  <section class="bg-crema fade-in">
    <div class="container" style="padding-top: 40px; padding-bottom: 80px;">
        <div class="archivio-header">
            <div class="archivio-search-container">
                <input type="text" id="archivio-search" class="archivio-search-input" placeholder="Cerca nel titolo..." aria-label="${searchLabel}">
                <button id="archivio-clear" class="btn btn-secondary" aria-label="Azzera ricerca">Azzera</button>
            </div>
            <div class="archivio-stats" aria-live="polite">
                Mostrati <span id="archivio-stats-count">{{COUNT}}</span> risultati.
            </div>
        </div>

        <div id="archivio-no-results" class="archivio-no-results" role="status" style="display: none;">
            Nessun risultato trovato per questo criterio di ricerca.
        </div>

        <div class="archivio-grid">
            {{CARDS}}
        </div>

        ${isArticoli ? `
        <div style="text-align: center; margin-top: 3rem;">
            <button id="archivio-load-more" class="btn btn-primary" style="display: none;" aria-live="polite">
                Mostra altri articoli
            </button>
        </div>` : ''}
    </div>
  </section>
</main>
`;

    return `<!DOCTYPE html>\n<html lang="it">\n${head}\n<body>\n${header}\n${mainContent}\n${footer}`;
}

const tplArticoli = createTemplate('Archivio Articoli — COINSIEME', 'Tutti gli articoli', true);
fs.writeFileSync(path.join(rootDir, 'templates', 'archivio-articoli-template.html'), tplArticoli);

const tplPub = createTemplate('Archivio Pubblicazioni — COINSIEME', 'Tutte le pubblicazioni', false);
fs.writeFileSync(path.join(rootDir, 'templates', 'archivio-pubblicazioni-template.html'), tplPub);
console.log("Templates updated.");
