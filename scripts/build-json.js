const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const backupDir = 'C:\\Users\\Utente\\OneDrive\\Documenti\\COINSIEME\\Backup_completo_Site123_2026-08-13\\pagine-html';
console.log('Start script...');
const dataDir = path.join(dir, 'data');

let articoliRaw = fs.readFileSync(path.join(dataDir, 'articoli.json'), 'utf8');
articoliRaw = articoliRaw.replace(/^\uFEFF/, '');
const articoli = JSON.parse(articoliRaw);

let pubblicazioniRaw = fs.readFileSync(path.join(dataDir, 'pubblicazioni.json'), 'utf8');
pubblicazioniRaw = pubblicazioniRaw.replace(/^\uFEFF/, '');
const pubblicazioni = JSON.parse(pubblicazioniRaw);

function extractBody(html) {
    const marker = 'class="responsive-handler fr-view breakable"';
    let idx = html.indexOf(marker);
    if (idx === -1) return null;
    
    // Trova l'inizio del div
    let startIdx = html.lastIndexOf('<div', idx);
    if (startIdx === -1) return null;

    let endIdx = -1;
    let divCount = 0;
    
    for (let i = startIdx; i < html.length; i++) {
        if (html.startsWith('<div', i)) divCount++;
        if (html.startsWith('</div', i)) {
            divCount--;
            if (divCount === 0) {
                endIdx = i;
                break;
            }
        }
    }
    
    if (endIdx === -1) return null;
    
    // Contenuto interno al div
    let body = html.substring(startIdx, endIdx);
    body = body.substring(body.indexOf('>') + 1); // remove the opening tag itself
    return body;
}

function sanitizeBody(body) {
    if (!body) return body;
    // Rimuovi script e style
    body = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    body = body.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Rimuovi handler JS e attributi in-line pericolosi
    body = body.replace(/ on\w+="[^"]*"/gi, '');
    body = body.replace(/ on\w+='[^']*'/gi, '');
    body = body.replace(/javascript:[^"']*/gi, '#');
    
    // Rimuovi pulsanti condivisione site123 e CMS elements (basato sulle classi site123)
    body = body.replace(/<div[^>]*class="[^"]*share-buttons[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    // Clean ChatGPT links and UTMs
    // Se c'è utm_source=chatgpt.com o utm_source=chatgpt, lo tolgo dall'URL
    body = body.replace(/(\?|&)utm_source=chatgpt(\.com)?(&utm_medium=[^&"'\s]+)?(&utm_campaign=[^&"'\s]+)?/gi, '');
    body = body.replace(/(\?|&)utm_medium=chatgpt(&utm_campaign=[^&"'\s]+)?/gi, '');
    
    // Pulisci l'ancoraggio nudo a chatgpt.com
    body = body.replace(/<a[^>]*href="[^"]*chatgpt\.com[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

    return body.trim();
}

articoli.forEach(a => {
    // Non riestrarre inutilmente gli articoli già estratti
    if (a.testoCompletoDisponibile && !a.corpoHtml) {
        const fileSorgente = path.join(backupDir, a.fileSorgente);
        if (fs.existsSync(fileSorgente)) {
            const html = fs.readFileSync(fileSorgente, 'utf8');
            const body = extractBody(html);
            a.corpoHtml = sanitizeBody(body);
            if (!a.corpoHtml) {
                console.warn(`Attenzione: corpo non trovato per articolo ${a.slug}`);
            }
        } else {
            console.warn(`File sorgente non trovato per articolo: ${fileSorgente}`);
        }
    }
});

pubblicazioni.forEach(p => {
    if (p.testoCompletoDisponibile !== false && !p.corpoHtml) {
        const fileSorgente = p.paginaSorgente ? path.join(backupDir, p.paginaSorgente) : null;
        if (fileSorgente && fs.existsSync(fileSorgente)) {
            const html = fs.readFileSync(fileSorgente, 'utf8');
            const body = extractBody(html);
            p.corpoHtml = sanitizeBody(body);
            if (!p.corpoHtml) {
                console.warn(`Attenzione: corpo non trovato per pubblicazione ${p.slug}`);
            }
        } else {
            console.warn(`File sorgente non trovato per pubblicazione: ${fileSorgente}`);
        }
    }
});

fs.writeFileSync(path.join(dataDir, 'articoli.json'), JSON.stringify(articoli, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'pubblicazioni.json'), JSON.stringify(pubblicazioni, null, 2), 'utf8');
console.log('Estrazione e sanificazione completate per articoli e pubblicazioni.');
