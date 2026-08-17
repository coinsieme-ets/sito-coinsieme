const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update index.html
let indexFile = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexFile, 'utf8');

// Ensure hero img has class="hero-bg"
indexHtml = indexHtml.replace(/<img\s+src="assets\/hero_inclusion\.jpg"[^>]*>/i, 
    '<img src="assets/hero_inclusion.jpg" class="hero-bg" alt="Attività di inclusione e cooperazione sociale Fondazione COINSIEME ETS" width="1200" height="600" loading="eager">'
);

// Populate hero h1 and subtitle
indexHtml = indexHtml.replace(/<h1 id="hero-titolo">[\s\S]*?<\/h1>/i,
    '<h1 id="hero-titolo">Coltiviamo inclusione, autonomia e innovazione sociale</h1>'
);
indexHtml = indexHtml.replace(/<p class="hero-subtitle">[\s\S]*?<\/p>/i,
    '<p class="hero-subtitle">Da oltre cinquant\'anni promuoviamo i diritti delle persone con disabilità, l\'integrazione lavorativa e la domotica assistiva per la vita indipendente.</p>'
);

fs.writeFileSync(indexFile, indexHtml, 'utf8');
console.log("index.html aggiornato con successo.");

// 2. Update domotica.html (remove placeholder banner)
let domFile = path.join(rootDir, 'domotica.html');
let domHtml = fs.readFileSync(domFile, 'utf8');

domHtml = domHtml.replace(/<div class="placeholder-banner"[\s\S]*?<\/div>/gi, '');

fs.writeFileSync(domFile, domHtml, 'utf8');
console.log("domotica.html aggiornato (rimosso avviso placeholder).");

// 3. Update css/archivio.css
let archCssFile = path.join(rootDir, 'css', 'archivio.css');
let archCss = fs.readFileSync(archCssFile, 'utf8');

archCss = archCss.replace(/\.archivio-grid\s*\{[\s\S]*?\}/i, `.archivio-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    width: 100%;
    box-sizing: border-box;
}
@media (min-width: 640px) {
    .archivio-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
}`);

fs.writeFileSync(archCssFile, archCss, 'utf8');
console.log("css/archivio.css aggiornato.");

// 4. Update css/style.css
let styleCssFile = path.join(rootDir, 'css', 'style.css');
let styleCss = fs.readFileSync(styleCssFile, 'utf8');

// Remove overflow-x: hidden from global html, body
styleCss = styleCss.replace(/html,\s*body\s*\{\s*overflow-x:\s*hidden;[\s\S]*?\}/gi, '');

// Replace overflow-wrap: anywhere with overflow-wrap: break-word
styleCss = styleCss.replaceAll('overflow-wrap: anywhere;', 'overflow-wrap: break-word; word-break: normal;');

// Global Reset and Box Sizing
let globalFixes = `
/* RESPONSIVE & CONTAINER FIXES */
*, *::before, *::after {
  box-sizing: border-box;
}
html, body {
  max-width: 100%;
  margin: 0;
  padding: 0;
}
img, svg, video, canvas {
  max-width: 100%;
  height: auto;
}
.container, .container--narrow, .container--wide {
  width: 100%;
  max-width: 1140px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 20px;
  padding-right: 20px;
  box-sizing: border-box;
}
@media (max-width: 639px) {
  .container, .container--narrow, .container--wide {
    padding-left: 16px;
    padding-right: 16px;
  }
}
.grid-2, .grid-3, .grid-4, .grid-2-col, .orientamento-grid, .percorso-steps, .dimensioni-grid {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.grid-2 > *, .grid-3 > *, .grid-4 > *, .grid-2-col > *, .orientamento-grid > *, .percorso-steps > *, .dimensioni-grid > * {
  min-width: 0;
}
.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  margin-bottom: 16px;
  max-width: 100%;
  box-sizing: border-box;
}
.breadcrumb * {
  max-width: 100%;
  overflow-wrap: break-word;
}
.card-pubblicazione {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  padding: 24px 20px;
}
@media (max-width: 639px) {
  .card-pubblicazione {
    padding: 20px 16px;
  }
}

/* HERO RESPONSIVE LAYOUT */
.hero {
  position: relative;
  background: var(--notte);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
@media (min-width: 900px) {
  .hero {
    min-height: clamp(480px, 70vh, 720px);
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, rgba(27,38,44,0.85) 0%, rgba(61,34,8,0.70) 55%, rgba(61,34,8,0.25) 100%);
    display: block;
  }
  .hero > .container {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  .hero-content {
    position: relative;
    z-index: 2;
    width: min(680px, 100%);
    max-width: 100%;
    padding: clamp(40px, 6vw, 72px) 0;
    box-sizing: border-box;
  }
}

@media (max-width: 899px) {
  .hero {
    display: flex;
    flex-direction: column;
    min-height: auto;
    padding: 0 0 36px 0;
    background: var(--notte);
  }
  .hero-bg {
    position: relative;
    inset: auto;
    width: 100%;
    height: 240px;
    object-fit: cover;
    display: block;
  }
  .hero-overlay {
    display: none;
  }
  .hero > .container {
    padding: 24px 16px 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .hero-content {
    width: 100%;
    max-width: 100%;
    padding: 0;
    box-sizing: border-box;
  }
  .hero-tagline {
    margin-bottom: 8px;
    font-size: 0.8rem;
  }
  .hero-content h1 {
    font-size: clamp(1.6rem, 6.5vw, 2.2rem);
    line-height: 1.25;
    margin-bottom: 12px;
    color: var(--bianco);
    overflow-wrap: break-word;
  }
  .hero-subtitle {
    font-size: 0.95rem;
    line-height: 1.55;
    margin-bottom: 24px;
    color: rgba(255,255,255,0.9);
    max-width: 100%;
    overflow-wrap: break-word;
  }
  .hero-ctas {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  .hero-ctas .btn {
    width: 100%;
    justify-content: center;
    white-space: normal;
    box-sizing: border-box;
  }
}
`;

styleCss += '\n' + globalFixes;
fs.writeFileSync(styleCssFile, styleCss, 'utf8');
console.log("css/style.css aggiornato con regole responsive e hero flessibile.");
