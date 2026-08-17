const fs = require('fs');
const path = require('path');

const pubTemplatePath = path.join(__dirname, '..', 'templates', 'pubblicazione-template.html');
const pubTemplate = fs.readFileSync(pubTemplatePath, 'utf8');

const pubs = ['70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook', 'guida-allacitta-di-roma-anno-1990'];

pubs.forEach(slug => {
    const pubPath = path.join(__dirname, '..', 'pubblicazioni', slug, 'index.html');
    if (!fs.existsSync(pubPath)) return;
    
    const oldHtml = fs.readFileSync(pubPath, 'utf8');
    
    // Extract metadata and body
    const titleMatch = oldHtml.match(/<h1 id="articolo-titolo"[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const canonicalMatch = oldHtml.match(/<link rel="canonical" href="([^"]+)">/);
    const canonical = canonicalMatch ? canonicalMatch[1] : '';
    
    const bodyMatch = oldHtml.match(/<div class="article-body">([\s\S]*?)<!-- Condivisione -->/);
    const body = bodyMatch ? bodyMatch[1].trim() : '';

    const metaMatch = oldHtml.match(/<!-- Meta -->\s*<div[^>]*>([\s\S]*?)<\/div>/);
    const metaHtml = metaMatch ? metaMatch[1] : '';

    let newHtml = pubTemplate;
    newHtml = newHtml.replace(/\{\{TITOLO\}\}/g, title);
    newHtml = newHtml.replace(/\{\{META_DESCRIPTION\}\}/g, "Pubblicazione: " + title);
    newHtml = newHtml.replace(/\{\{CANONICAL_URL\}\}/g, canonical);
    newHtml = newHtml.replace(/\{\{CORPO_HTML\}\}/g, body);

    // Replace <h1 ...> {{TITOLO}} </h1> explicitly because the regex above might replace the meta title
    newHtml = newHtml.replace(/<h1 id="articolo-titolo"[^>]*>[\s\S]*?<\/h1>/, `<h1 id="articolo-titolo" style="margin-bottom:20px;">\n          ${title}\n        </h1>`);

    newHtml = newHtml.replace(/\{\{SCHEMA_AUTORE\}\}/g, '');
    newHtml = newHtml.replace(/\{\{SCHEMA_DATA\}\}/g, '');
    
    newHtml = newHtml.replace(/\{\{AUTORE_HTML\}\}/g, '');
    newHtml = newHtml.replace(/\{\{DATA_HTML\}\}/g, '');
    newHtml = newHtml.replace(/\{\{TEMPO_LETTURA\}\}/g, '2');
    newHtml = newHtml.replace(/\{\{PULSANTE_DOWNLOAD\}\}/g, '<span class="note" style="color:var(--grigio-testo); font-style:italic;">Risorsa digitale disponibile previa verifica della Fondazione</span><br><br>');
    newHtml = newHtml.replace(/\{\{IMMAGINE_HTML\}\}/g, '');
    
    fs.writeFileSync(pubPath, newHtml, 'utf8');
    console.log(`Aggiornata: ${slug}`);
});
