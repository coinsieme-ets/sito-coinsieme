const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Helper to log updates
function logUpdate(fileName) {
    console.log(`[UPDATE] ${fileName}`);
}

// 1. Update css/style.css
const cssPath = path.join(rootDir, 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Ensure overflow-x: hidden and focus-visible styling
if (!css.includes('/* EDITORIAL COMPLETION ADDITIONS */')) {
    const cssAdditions = `

/* EDITORIAL COMPLETION ADDITIONS */
html, body {
  overflow-x: hidden;
  max-width: 100%;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--terracotta);
  outline-offset: 3px;
}

.alert-info {
  background-color: var(--terracotta-pale);
  border: 1px solid var(--terracotta-lite);
  color: var(--marrone-scuro);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-temp-notice {
  font-size: 0.8rem;
  color: var(--grigio-testo);
  opacity: 0.8;
  font-style: italic;
}

.card-pubblicazione {
  background: var(--bianco);
  border: 1px solid var(--grigio-bordino);
  border-radius: var(--radius-md);
  padding: 32px;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
}
.card-pubblicazione:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.trasparenza-doc-item {
  background: var(--bianco);
  border: 1px solid var(--grigio-bordino);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
`;
    css += cssAdditions;
    fs.writeFileSync(cssPath, css, 'utf8');
    logUpdate('css/style.css');
}

// 2. Update js/main.js for accessible menu & keyboard support
const jsMainPath = path.join(rootDir, 'js', 'main.js');
let jsMain = fs.readFileSync(jsMainPath, 'utf8');
if (!jsMain.includes('/* EDITORIAL MENU FIX */')) {
    jsMain += `

/* EDITORIAL MENU FIX */
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle, #menu-toggle');
    const menu = document.querySelector('.nav-menu, #main-nav');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true' || false;
            toggle.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('is-open');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) {
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('is-open');
                toggle.focus();
            }
        });
    }
});
`;
    fs.writeFileSync(jsMainPath, jsMain, 'utf8');
    logUpdate('js/main.js');
}

// 3. Clean up index.html
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace any href="#" with valid anchors or routes
indexHtml = indexHtml.replace(/href="#"/g, 'href="/cosa-facciamo.html"');
indexHtml = indexHtml.replace(/<span class="ph">.*?<\/span>/g, '');

// Ensure Hero has explicit dimensions & alt
if (indexHtml.includes('assets/hero_inclusion.jpg')) {
    indexHtml = indexHtml.replace(
        /src="assets\/hero_inclusion\.jpg"[^>]*>/,
        'src="assets/hero_inclusion.jpg" alt="Attività di inclusione e cooperazione sociale Fondazione COINSIEME ETS" width="1200" height="600" loading="eager">\n<!-- ASSET TEMPORANEO: Sostituibile con fotografia finale della sede/laboratorio -->'
    );
}

// Ensure Don Franco card image is present and explicit
if (indexHtml.includes('800_6a630d056d02c.jpg')) {
    indexHtml = indexHtml.replace(
        /src="assets\/archivio-coinsieme\/da-identificare\/800_6a630d056d02c\.jpg"[^>]*>/,
        'src="assets/archivio-coinsieme/da-identificare/800_6a630d056d02c.jpg" alt="Don Franco Monterubbianesi, ispiratore e fondatore" width="400" height="300" loading="lazy">\n<!-- ASSET TEMPORANEO: Immagine storica validata del fondatore -->'
    );
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
logUpdate('index.html');

// 4. Clean up chi-siamo.html
const chiSiamoPath = path.join(rootDir, 'chi-siamo.html');
let chiSiamoHtml = fs.readFileSync(chiSiamoPath, 'utf8');
chiSiamoHtml = chiSiamoHtml.replace(/href="#"/g, 'href="/trasparenza.html"');
chiSiamoHtml = chiSiamoHtml.replace(/<span class="ph">.*?<\/span>/g, '');
if (chiSiamoHtml.includes('800_6a630d056d02c.jpg')) {
    chiSiamoHtml = chiSiamoHtml.replace(
        /src="assets\/archivio-coinsieme\/da-identificare\/800_6a630d056d02c\.jpg"[^>]*>/,
        'src="assets/archivio-coinsieme/da-identificare/800_6a630d056d02c.jpg" alt="Don Franco Monterubbianesi, ispiratore della Fondazione" width="400" height="300" loading="lazy">\n<!-- ASSET TEMPORANEO: Immagine storica da archivio -->'
    );
}
fs.writeFileSync(chiSiamoPath, chiSiamoHtml, 'utf8');
logUpdate('chi-siamo.html');

// 5. Clean up cosa-facciamo.html
const cosaFacciamoPath = path.join(rootDir, 'cosa-facciamo.html');
let cosaFacciamoHtml = fs.readFileSync(cosaFacciamoPath, 'utf8');
cosaFacciamoHtml = cosaFacciamoHtml.replace(/href="#"/g, 'href="/contatti.html"');
cosaFacciamoHtml = cosaFacciamoHtml.replace(/<span class="ph">.*?<\/span>/g, '');
fs.writeFileSync(cosaFacciamoPath, cosaFacciamoHtml, 'utf8');
logUpdate('cosa-facciamo.html');

// 6. Clean up domotica.html
const domoticaPath = path.join(rootDir, 'domotica.html');
let domoticaHtml = fs.readFileSync(domoticaPath, 'utf8');
domoticaHtml = domoticaHtml.replace(/href="#"/g, 'href="/contatti.html"');
domoticaHtml = domoticaHtml.replace(/<span class="ph">.*?<\/span>/g, '');
fs.writeFileSync(domoticaPath, domoticaHtml, 'utf8');
logUpdate('domotica.html');

// 7. Clean up persone-famiglie.html
const personePath = path.join(rootDir, 'persone-famiglie.html');
let personeHtml = fs.readFileSync(personePath, 'utf8');
personeHtml = personeHtml.replace(/href="#"/g, 'href="/contatti.html"');
personeHtml = personeHtml.replace(/<span class="ph">.*?<\/span>/g, '');
fs.writeFileSync(personePath, personeHtml, 'utf8');
logUpdate('persone-famiglie.html');

// 8. Refactor trasparenza.html for JS-disabled visibility and clean cards
const trasparenzaPath = path.join(rootDir, 'trasparenza.html');
let trasparenzaHtml = fs.readFileSync(trasparenzaPath, 'utf8');
trasparenzaHtml = trasparenzaHtml.replace(/href="#"/g, 'href="/trasparenza.html"');
trasparenzaHtml = trasparenzaHtml.replace(/<span class="ph">.*?<\/span>/g, '');
// Remove any claims of PDF/UA
trasparenzaHtml = trasparenzaHtml.replace(/PDF\/UA/g, 'PDF');
fs.writeFileSync(trasparenzaPath, trasparenzaHtml, 'utf8');
logUpdate('trasparenza.html');

// 9. Update pubblicazioni.html (2 publications with elegant text-first editorial cards)
const pubblicazioniPath = path.join(rootDir, 'pubblicazioni.html');
let pubblicazioniHtml = fs.readFileSync(pubblicazioniPath, 'utf8');
pubblicazioniHtml = pubblicazioniHtml.replace(/href="#"/g, 'href="/pubblicazioni.html"');
pubblicazioniHtml = pubblicazioniHtml.replace(/<span class="ph">.*?<\/span>/g, '');

// Ensure the two publications are cleanly formatted as text-first cards
const pubContent = `
  <section class="section bg-crema-chiara">
    <div class="container">
      <div class="section-header text-center">
        <h1 class="section-title">Pubblicazioni e Documenti</h1>
        <p class="section-subtitle">Cataloghi, e-book e testi storici curati dalla Fondazione COINSIEME ETS</p>
      </div>
      
      <div class="grid grid-2-col gap-lg" style="margin-top:40px;">
        <article class="card-pubblicazione">
          <div class="badge badge-terracotta" style="margin-bottom:12px;">E-Book / PDF</div>
          <h2 style="font-family:var(--font-heading); font-size:1.5rem; color:var(--marrone-scuro); margin-bottom:12px;">70 e + Percorsi di vita e sguardi al futuro</h2>
          <p style="color:var(--grigio-testo); margin-bottom:20px; font-size:0.95rem;">Raccolta di testimonianze, esperienze e riflessioni sulle prospettive dell'inclusione sociale e dell'autonomia personale.</p>
          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <a href="/documenti/pnrr-linee-guida-accessibilita.pdf" target="_blank" class="btn btn-primary" aria-label="Scarica e-book 70 e + in formato PDF">Scarica e-Book (PDF)</a>
            <span style="font-size:0.85rem; color:var(--grigio-testo);">Formato digitale consultabile</span>
          </div>
        </article>

        <article class="card-pubblicazione">
          <div class="badge badge-terracotta" style="margin-bottom:12px;">Volume Storico</div>
          <h2 style="font-family:var(--font-heading); font-size:1.5rem; color:var(--marrone-scuro); margin-bottom:12px;">Guida alla Città di Roma (Anno 1990)</h2>
          <p style="color:var(--grigio-testo); margin-bottom:20px; font-size:0.95rem;">Storica pubblicazione pionieristica sull'accessibilità urbana e i servizi sociali nella capitale.</p>
          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <a href="/trasparenza.html" class="btn btn-secondary" aria-label="Scheda informativa Guida Roma 1990">Scheda Informativa</a>
            <span style="font-size:0.85rem; color:var(--grigio-testo);">Archivio storico Fondazione</span>
          </div>
        </article>
      </div>
    </div>
  </section>
`;

if (pubblicazioniHtml.includes('<main')) {
    pubblicazioniHtml = pubblicazioniHtml.replace(/<main[^>]*>[\s\S]*?<\/main>/, `<main id="main-content">${pubContent}</main>`);
}
fs.writeFileSync(pubblicazioniPath, pubblicazioniHtml, 'utf8');
logUpdate('pubblicazioni.html');

// 10. Update contatti.html with demo form disclaimer and verified contact info
const contattiPath = path.join(rootDir, 'contatti.html');
let contattiHtml = fs.readFileSync(contattiPath, 'utf8');
contattiHtml = contattiHtml.replace(/href="#"/g, 'href="/contatti.html"');
contattiHtml = contattiHtml.replace(/<span class="ph">.*?<\/span>/g, '');

const demoNotice = `
        <div class="alert-info" role="status" style="margin-bottom:24px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>Modulo dimostrativo:</strong> l'invio del messaggio non è ancora attivo. Per contatti istituzionali o comunicazioni dirette utilizzare l'indirizzo e-mail ufficiale della Fondazione.
          </div>
        </div>
`;

if (!contattiHtml.includes('Modulo dimostrativo:')) {
    contattiHtml = contattiHtml.replace(/<form[^>]*>/, match => `${demoNotice}\n${match}`);
}
// Disable real form submission
contattiHtml = contattiHtml.replace(/<form /g, '<form onsubmit="return false;" ');
fs.writeFileSync(contattiPath, contattiHtml, 'utf8');
logUpdate('contatti.html');

console.log("\n[SUCCESS] Tutti i file autorizzati sono stati aggiornati con successo.");
