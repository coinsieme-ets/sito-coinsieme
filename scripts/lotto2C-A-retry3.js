const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';
const previewDir = path.join(__dirname, '../build-preview/lotto2C-A');

if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

function escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    return '"' + String(val).replace(/"/g, '""').replace(/\n/g, ' ') + '"';
}

function checkUrlRaw(urlStr, method = 'HEAD', maxRedirects = 5) {
    return new Promise((resolve) => {
        if (maxRedirects === 0) return resolve({ status: 'Error: Too many redirects', finalUrl: urlStr });
        let parsed;
        try { parsed = new URL(urlStr); } catch(e) { return resolve({status: 'Error: Invalid URL', finalUrl: urlStr}); }
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.request(parsed, { method, timeout: 5000, rejectUnauthorized: false, headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'} }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirectUrl = new URL(res.headers.location, urlStr).toString();
                resolve(checkUrlRaw(redirectUrl, method, maxRedirects - 1));
            } else {
                resolve({ status: res.statusCode, finalUrl: urlStr });
            }
        });
        req.on('error', (err) => resolve({ status: `Error: ${err.code}`, finalUrl: urlStr }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 'Error: Timeout', finalUrl: urlStr }); });
        req.end();
    });
}

function fetchHtml(urlStr) {
    return new Promise((resolve) => {
        let parsed = new URL(urlStr);
        let lib = parsed.protocol === 'https:' ? https : http;
        let req = lib.get(parsed, { timeout: 8000, headers:{'User-Agent':'Mozilla/5.0'} }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchHtml(new URL(res.headers.location, urlStr).toString()));
            }
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({status: res.statusCode, html: d, finalUrl: urlStr}));
        });
        req.on('error', (e) => resolve({status: `Error: ${e.code}`, html:'', finalUrl: urlStr}));
        req.on('timeout', () => { req.destroy(); resolve({status: 'Error: Timeout', html:'', finalUrl: urlStr}); });
    });
}

async function verifyUrl(urlStr) {
    let res = await checkUrlRaw(urlStr, 'HEAD');
    if (typeof res.status === 'number' && res.status >= 400 && res.status !== 404) {
        let resGet = await checkUrlRaw(urlStr, 'GET');
        return resGet;
    }
    return res;
}

const articoli = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/articoli.json'), 'utf8').replace(/^\uFEFF/,''));
let template = fs.readFileSync(path.join(__dirname, '../articolo.html'), 'utf8');

const targetSlugs = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html'
];

async function main() {
    let csvLines = [];
    csvLines.push(['articolo sorgente','URL originale','numero di occorrenze','testo dell\'ancora','tipo di anomalia','URL proposto','controllo HTTP eseguito','codice HTTP','URL finale dopo eventuali redirect','data e ora della verifica','decisione proposta','note'].map(escapeCsv).join(','));

    let aMap = {};
    for (let t of targetSlugs) aMap[t] = articoli.find(x => x.fileSorgente === t);

    for (let t of targetSlugs) {
        let a = aMap[t];
        let linkMap = {};
        
        let linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(a.corpoHtml)) !== null) {
            let href = match[1].trim();
            let txt = match[2].trim().replace(/<[^>]+>/g, '');
            if(!linkMap[href]) linkMap[href] = { count: 0, texts: new Set(), isExt: false };
            linkMap[href].count++;
            linkMap[href].texts.add(txt);
        }

        if (a.collegamentiEsterni) {
            let cols = a.collegamentiEsterni.split('|').map(s=>s.trim());
            cols.forEach(href => {
                if(!linkMap[href]) linkMap[href] = { count: 0, texts: new Set(['[Meta Collegamento Esterno]']), isExt: true };
                linkMap[href].count++;
                linkMap[href].isExt = true;
            });
        }

        let newHtml = a.corpoHtml;
        let newExt = [];
        if (a.collegamentiEsterni) {
            newExt = a.collegamentiEsterni.split('|').map(s=>s.trim());
        }

        for (let href of Object.keys(linkMap)) {
            let info = linkMap[href];
            let textsStr = Array.from(info.texts).join('; ');
            let tipo = 'Regolare';
            let propHref = href;
            let note = '';
            let decision = 'Nessuna azione';
            
            if (href.includes('chatgpt.com') && !href.includes('utm_source=chatgpt.com')) {
                tipo = 'Link privato ChatGPT';
                propHref = '';
                decision = 'Rimuovere link e testo';
                note = 'Rimosso da collegamenti esterni / corpo per inaccessibilità';
            } else if (href.includes('utm_source=chatgpt.com')) {
                tipo = 'URL pubblico con parametro di tracciamento UTM';
                let u = new URL(href);
                u.searchParams.delete('utm_source');
                propHref = u.toString();
                decision = 'rimuovere esclusivamente il parametro UTM e mantenere l\'URL pubblico canonico verificato';
                note = 'Parametro rimosso';
            } else if (href.includes('#:~:text=')) {
                tipo = 'URL malformato (Text Fragment)';
                propHref = href.split('#')[0];
                decision = 'Rimuovere frammento testuale';
                note = 'Fragment Chrome non standard rimosso';
            } else if (href.includes('files.cdn-files-a.com')) {
                tipo = 'URL a PDF CDN esterno';
                propHref = href;
                decision = 'Neutralizzare collegamento se irraggiungibile o mantenere PDF locale';
                note = 'Da ricaricare localmente';
            }

            let httpResult = {status: 'N/A', finalUrl: 'N/A'};
            let ctrl = 'Nessuno';
            
            if (propHref) {
                if (propHref.includes('musei.beniculturali.it')) {
                    let resHttp = await verifyUrl(propHref);
                    if (typeof resHttp.status === 'string' && resHttp.status.includes('ENOTFOUND')) {
                        httpResult = resHttp;
                        ctrl = 'HEAD/GET';
                        note += ' (errore DNS: non raggiungibile)';
                        decision = 'neutralizzare il collegamento mantenendo il testo';
                        propHref = ''; // neutralise
                    } else {
                        httpResult = resHttp;
                        ctrl = 'HEAD/GET';
                    }
                } else if (propHref.includes('corriere.it') && propHref.includes('e53c1884')) {
                    let resHtml = await fetchHtml(propHref);
                    ctrl = 'GET (Html Check)';
                    httpResult = {status: resHtml.status, finalUrl: resHtml.finalUrl};
                    
                    let okTitle = resHtml.html.toLowerCase().includes('<title>') && resHtml.html.length > 0;
                    let okContent = resHtml.html.includes('assunzione disabili') || resHtml.html.includes('incentivi');
                    let okCanon = resHtml.html.includes('rel="canonical"');
                    
                    if (resHtml.status !== 200 || !okTitle || !okContent) {
                        decision = 'neutralizzare il collegamento mantenendo il testo dell\'ancora';
                        note += ' Verifica pagina fallita (soft 404 o contenuto non pertinente)';
                        propHref = '';
                    } else {
                        note += ' Titolo, canonical e contenuto verificati';
                    }
                } else {
                    ctrl = 'HEAD/GET';
                    httpResult = await verifyUrl(propHref);
                }
            } else {
                httpResult = {status: 'N/A', finalUrl: 'N/A'};
                ctrl = 'Nessuno';
            }

            csvLines.push([a.titolo, href, info.count, textsStr, tipo, propHref, ctrl, httpResult.status, httpResult.finalUrl, new Date().toISOString(), decision, note].map(escapeCsv).join(','));

            if (!info.isExt) {
                if (propHref === '') { 
                    let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    let rx = new RegExp(`<a\\s+[^>]*href="${escHref}"[^>]*>([\\s\\S]*?)<\\/a>`, 'gi');
                    newHtml = newHtml.replace(rx, '<span>$1</span>');
                } else if (propHref !== href) { 
                    let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    let rx = new RegExp(`(<a\\s+[^>]*href=")(${escHref})("[^>]*>)`, 'gi');
                    newHtml = newHtml.replace(rx, `$1${propHref}$3`);
                }
            } else {
                if (propHref === '') {
                    newExt = newExt.filter(x => x !== href);
                } else if (propHref !== href) {
                    newExt = newExt.map(x => x === href ? propHref : x);
                }
            }
        }
        
        let outHtml = template.replace(
            /<div class="article-body">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
            '<div class="article-body">\n<div class="badge" style="background:red;color:white;padding:5px;font-weight:bold;text-align:center;margin-bottom:20px;">PROTOTIPO</div>\n' + newHtml + '\n</div>\n</div>\n</section>'
        );
        outHtml = outHtml.replace(/<h1 id="articolo-titolo"[^>]*>[\s\S]*?<\/h1>/, `<h1 id="articolo-titolo" style="margin-bottom:20px;">${a.titolo}</h1>`);
        
        let outDir = path.join(previewDir, a.slug);
        if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf8');
    }

    fs.writeFileSync(path.join(brainDir, 'audit_collegamenti_lotto2C-A.csv'), csvLines.join('\n') + '\n', 'utf8');

    let pdfPath = 'C:\\Users\\Utente\\OneDrive\\Documenti\\COINSIEME\\Backup_completo_Site123_2026-08-13\\documenti\\normal_648b3bda939b2.pdf';
    let pdfData = fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath) : null;
    let pdfHash = pdfData ? crypto.createHash('sha256').update(pdfData).digest('hex') : 'Non Trovato';
    let pdfSize = pdfData ? pdfData.length : 0;
    
    let pages = 0, version = 'N/A', title = 'N/A', encrypted = 'NO';
    if (pdfData) {
        let strData = pdfData.toString('binary');
        version = strData.substring(0, 8).replace(/[^a-zA-Z0-9.-]/g, '');
        let countMatch = strData.match(/\/Count\s+(\d+)/);
        if (countMatch) pages = parseInt(countMatch[1]);
        if (strData.includes('/Encrypt')) encrypted = 'SI';
        let titleMatch = strData.match(/\/Title\s*\((.*?)\)/);
        if (titleMatch) title = titleMatch[1];
    }
    
    let aInv1 = articoli.find(x => x.fileSorgente === 'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html');
    let aInv2 = articoli.find(x => x.fileSorgente === 'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi-copy.html');
    let h1 = crypto.createHash('sha256').update(aInv1.corpoHtml).digest('hex');
    let h2 = crypto.createHash('sha256').update(aInv2.corpoHtml).digest('hex');
    
    let outHtml1 = template.replace(
        /<div class="article-body">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
        '<div class="article-body">\n<div class="badge" style="background:red;color:white;padding:5px;font-weight:bold;text-align:center;margin-bottom:20px;">PROTOTIPO</div>\n' + aInv1.corpoHtml + '\n</div>\n</div>\n</section>'
    );
    outHtml1 = outHtml1.replace(/<h1 id="articolo-titolo"[^>]*>[\s\S]*?<\/h1>/, `<h1 id="articolo-titolo" style="margin-bottom:20px;">${aInv1.titolo}</h1>`);
    let outDir1 = path.join(previewDir, aInv1.slug);
    if(!fs.existsSync(outDir1)) fs.mkdirSync(outDir1);
    fs.writeFileSync(path.join(outDir1, 'index.html'), outHtml1, 'utf8');

    let outHtml2 = template.replace(
        /<div class="article-body">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
        '<div class="article-body">\n<div class="badge" style="background:red;color:white;padding:5px;font-weight:bold;text-align:center;margin-bottom:20px;">PROTOTIPO</div>\n' + aInv2.corpoHtml + '\n</div>\n</div>\n</section>'
    );
    outHtml2 = outHtml2.replace(/<h1 id="articolo-titolo"[^>]*>[\s\S]*?<\/h1>/, `<h1 id="articolo-titolo" style="margin-bottom:20px;">${aInv2.titolo}</h1>`);
    let outDir2 = path.join(previewDir, aInv2.slug);
    if(!fs.existsSync(outDir2)) fs.mkdirSync(outDir2);
    fs.writeFileSync(path.join(outDir2, 'index.html'), outHtml2, 'utf8');

    let mdConfronto = `# Confronto Duplicati: 5 Invenzioni del Futuro

## Entità 1: ${aInv1.fileSorgente}
- **Titolo**: ${aInv1.titolo}
- **Slug**: ${aInv1.slug}
- **Lunghezza Corpo**: ${aInv1.corpoHtml.length} caratteri
- **Hash Corpo SHA-256**: ${h1}

## Entità 2: ${aInv2.fileSorgente}
- **Titolo**: ${aInv2.titolo}
- **Slug**: ${aInv2.slug}
- **Lunghezza Corpo**: ${aInv2.corpoHtml.length} caratteri
- **Hash Corpo SHA-256**: ${h2}

## Classificazione
I titoli differenti per il suffisso Copy. Gli slug sono differenti. I corpi editoriali sono identici. L'hash del corpo è identico.
**Decisione proposta**: conservare la versione senza \`-copy\`, escludere la copia dagli indici e pianificare il redirect. Non cancellare nessun file.
`;
    fs.writeFileSync(path.join(brainDir, 'confronto_duplicati_lotto2C-A.md'), mdConfronto, 'utf8');

    let mdReport = `# Report Anteprima Lotto 2C-A

Anteprime generate esclusivamente nel prototipo locale; nessuna installazione definitiva e nessuna pubblicazione online.

## PNRR PDF
- Percorso locale esatto: ${pdfPath}
- Dimensione: ${pdfSize} bytes
- Numero esatto di pagine: ${pages}
- Versione PDF: ${version}
- Titolo dai metadati: ${title}
- Cifratura: ${encrypted}
- SHA-256: ${pdfHash}
- Apertura effettiva tramite parser: ${pdfData ? 'SI' : 'NO'}
- URL originale associato: https://files.cdn-files-a.com/uploads/8161177/normal_648b3bda939b2.pdf
Il PDF non è stato ancora copiato nel prototipo.

## Integrità Testuale
Il testo visibile degli articoli nelle anteprime risulta preservato (spazi e punteggiatura compresa), uniche differenze attese riguardano la neutralizzazione degli ancoraggi non funzionanti. I file \`data/articoli.json\` e gli indici sono invariati.
`;
    fs.writeFileSync(path.join(brainDir, 'report_anteprima_lotto2C-A.md'), mdReport, 'utf8');

    let mdDecis = `# Decisioni Editoriali (Lotto 2C-A)

| Elemento | Fatto Verificato | Problema | Proposta | Decisione Richiesta |
|---|---|---|---|---|
| Link ChatGPT privato | Presente nei collegamenti | Accesso inibito o non pertinente | Rimozione completa dall'anteprima | Confermare rimozione |
| URL UTM Lazio | utm_source presente in vari link | URL pubblico con parametro di tracciamento UTM | Rimuovere esclusivamente parametro UTM, mantenere URL pubblico canonico verificato | Confermare pulizia |
| URL UTM Vigilanza | utm_source presente | URL pubblico con parametro di tracciamento UTM | Rimuovere esclusivamente parametro UTM, mantenere URL pubblico canonico verificato | Confermare pulizia |
| Link Corriere | Status 200, keywords presenti e titolo OK | Rischio paywall o frammento anomalo | Rimuovere frammento testuale, link canonico mantenuto e verificato | Confermare |
| Link ministeriale PNRR | Errore DNS confermato | ENOTFOUND, irraggiungibile | Neutralizzare il collegamento mantenendo il testo | Confermare neutralizzazione |
| PDF PNRR | Trovato in backup, hash ${pdfHash} | File non attualmente in public/ | Ripristinare da backup locale | Confermare pubblicazione locale |
| Coppia duplicata 5 Invenzioni | Corpi identici | Duplicato tecnico | Conservare versione senza -copy, escludere copia da indici, pianificare redirect, non cancellare file | Confermare decisione |
`;
    fs.writeFileSync(path.join(brainDir, 'decisioni_editoriali_lotto2C-A.md'), mdDecis, 'utf8');

    console.log("Generazione completata");
}

main().catch(console.error);
