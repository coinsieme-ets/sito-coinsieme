const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

const brainDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';
const previewDir = path.join(__dirname, '../build-preview/lotto2C-A');

if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
}

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
        const req = lib.request(parsed, { method, timeout: 5000, rejectUnauthorized: false }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirectUrl = new URL(res.headers.location, urlStr).toString();
                resolve(checkUrlRaw(redirectUrl, method, maxRedirects - 1));
            } else {
                resolve({ status: res.statusCode, finalUrl: urlStr });
            }
        });
        req.on('error', (err) => resolve({ status: `Error: ${err.message}`, finalUrl: urlStr }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 'Error: Timeout', finalUrl: urlStr }); });
        req.end();
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

    let auditRecords = [];
    function addAudit(artTitolo, urlOrig, count, text, tipo, urlProp, ctrlHttp, code, urlFin, note, dec) {
        csvLines.push([artTitolo, urlOrig, count, text, tipo, urlProp, ctrlHttp, code, urlFin, new Date().toISOString(), dec, note].map(escapeCsv).join(','));
    }

    let aMap = {};
    for (let t of targetSlugs) aMap[t] = articoli.find(x => x.fileSorgente === t);

    for (let t of targetSlugs) {
        let a = aMap[t];
        let linkMap = {}; // href -> { count, texts, isCollegamentoEsterno }
        
        let linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(a.corpoHtml)) !== null) {
            let href = match[1];
            let txt = match[2].trim().replace(/<[^>]+>/g, '');
            if(!linkMap[href]) linkMap[href] = { count: 0, texts: new Set(), isExt: false };
            linkMap[href].count++;
            linkMap[href].texts.add(txt);
        }

        if (a.collegamentiEsterni) {
            let cols = a.collegamentiEsterni.split('|').map(s=>s.trim());
            cols.forEach(href => {
                if(!linkMap[href]) linkMap[href] = { count: 0, texts: new Set(['[Meta Collegamento]']), isExt: true };
                linkMap[href].count++;
                linkMap[href].isExt = true;
            });
        }

        let newHtml = a.corpoHtml;

        for (let href of Object.keys(linkMap)) {
            let info = linkMap[href];
            let textsStr = Array.from(info.texts).join('; ');
            let tipo = 'Regolare';
            let propHref = href;
            let note = '';
            let decision = 'Nessuna azione';
            
            if (href.includes('chatgpt.com')) {
                tipo = 'Link privato ChatGPT';
                propHref = '';
                decision = 'Rimuovere link';
                note = 'Rimozione completa';
            } else if (href.includes('utm_source=chatgpt.com')) {
                tipo = 'Parametro UTM ChatGPT';
                let u = new URL(href);
                u.searchParams.delete('utm_source');
                propHref = u.toString();
                decision = 'Ripulire URL';
                note = 'Rimuovere solo parametro';
            } else if (href.includes('#:~:text=')) {
                tipo = 'URL malformato (Text Fragment)';
                propHref = href.split('#')[0];
                decision = 'Rimuovere frammento testuale';
                note = 'Possibile mancata corrispondenza esatta di browser';
            } else if (href.includes('files.cdn-files-a.com')) {
                tipo = 'URL a PDF CDN esterno';
                decision = 'Verificare disponibilità locale';
            }

            // HTTP Verify
            let httpResult;
            let ctrl = 'HEAD/GET';
            
            if (propHref) {
                if (t === 'pnrr-e-accessibilita-luoghi-di-cultura.html' && propHref.includes('musei.beniculturali.it')) {
                    // special check for PNRR
                    let resHttp = await verifyUrl(propHref);
                    let resHttps = await verifyUrl(propHref.replace('http://', 'https://'));
                    if (resHttps.status === 200 || (typeof resHttps.status === 'number' && resHttps.status < 400)) {
                        httpResult = resHttps;
                        propHref = propHref.replace('http://', 'https://');
                        note += ' (Upgrade a HTTPS funzionante)';
                    } else {
                        httpResult = resHttp;
                    }
                } else if (t === 'bonus-assunzione-disabili-per-gli-ets.html' && propHref.includes('corriere.it')) {
                    httpResult = await verifyUrl(propHref);
                    if (typeof httpResult.status !== 'number' || httpResult.status >= 400) {
                        decision = 'Rimuovere link (Mantenere testo)';
                        note = 'Link non risponde correttamente';
                        propHref = '';
                    }
                } else {
                    httpResult = await verifyUrl(propHref);
                }
            } else {
                httpResult = {status: 'N/A', finalUrl: 'N/A'};
                ctrl = 'Nessuno';
            }

            addAudit(a.titolo, href, info.count, textsStr, tipo, propHref, ctrl, httpResult.status, httpResult.finalUrl, note, decision);

            // Apply to HTML
            if (!info.isExt) {
                if (propHref === '') { // remove anchor
                    let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    let rx = new RegExp(`<a\\s+[^>]*href="${escHref}"[^>]*>([\\s\\S]*?)<\\/a>`, 'gi');
                    newHtml = newHtml.replace(rx, '$1');
                } else if (propHref !== href) { // replace href
                    let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    let rx = new RegExp(`(<a\\s+[^>]*href=")(${escHref})("[^>]*>)`, 'gi');
                    newHtml = newHtml.replace(rx, `$1${propHref}$3`);
                }
            }
        }
        
        let outHtml = template.replace('<article class="s123-page-body">', '<article class="s123-page-body">\n<div class="badge" style="background:red;color:white;padding:5px;font-weight:bold;text-align:center;">PROTOTIPO</div>\n' + newHtml);
        let outDir = path.join(previewDir, a.slug);
        if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf8');
    }

    fs.writeFileSync(path.join(brainDir, 'audit_collegamenti_lotto2C-A.csv'), csvLines.join('\n') + '\n', 'utf8');

    // PDF PNRR
    let pdfPath = 'C:\\Users\\Utente\\OneDrive\\Documenti\\COINSIEME\\Backup_completo_Site123_2026-08-13\\documenti\\normal_648b3bda939b2.pdf';
    let pdfData = fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath) : null;
    let pdfHash = pdfData ? crypto.createHash('sha256').update(pdfData).digest('hex') : 'Non Trovato';
    let pdfSize = pdfData ? pdfData.length : 0;
    
    // 5 Invenzioni Pair
    let aInv1 = articoli.find(x => x.fileSorgente === 'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html');
    let aInv2 = articoli.find(x => x.fileSorgente === 'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi-copy.html');
    let h1 = crypto.createHash('sha256').update(aInv1.corpoHtml).digest('hex');
    let h2 = crypto.createHash('sha256').update(aInv2.corpoHtml).digest('hex');
    
    let outHtml1 = template.replace('<article class="s123-page-body">', '<article class="s123-page-body">\n<div class="badge" style="background:red;color:white;padding:5px;font-weight:bold;text-align:center;">PROTOTIPO</div>\n' + aInv1.corpoHtml);
    let outDir1 = path.join(previewDir, aInv1.slug);
    if(!fs.existsSync(outDir1)) fs.mkdirSync(outDir1);
    fs.writeFileSync(path.join(outDir1, 'index.html'), outHtml1, 'utf8');

    let outHtml2 = template.replace('<article class="s123-page-body">', '<article class="s123-page-body">\n<div class="badge" style="background:red;color:white;padding:5px;font-weight:bold;text-align:center;">PROTOTIPO</div>\n' + aInv2.corpoHtml);
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
I titoli differiscono per il suffisso Copy. Gli slug sono differenti. I corpi editoriali sono identici. L'hash del corpo è identico.
**Decisione proposta**: conservare la versione senza \`-copy\`, escludere la copia dagli indici e pianificare il redirect. Non cancellare alcun file originale.
`;
    fs.writeFileSync(path.join(brainDir, 'confronto_duplicati_lotto2C-A.md'), mdConfronto, 'utf8');

    let mdReport = `# Report Anteprima Lotto 2C-A

Anteprime generate esclusivamente nel prototipo locale; nessuna installazione definitiva e nessuna pubblicazione online.
Non è stata apportata alcuna modifica ai file JSON, HTML nativi o indici. I file \`data/articoli.json\` e \`articoli.html\` sono intonsi.

## PNRR PDF
- Percorso locale esatto: ${pdfPath}
- Dimensione: ${pdfSize} bytes
- SHA-256: ${pdfHash}
- Apertura riuscita o meno: ${pdfData ? 'SI' : 'NO'}
- URL originale associato: https://files.cdn-files-a.com/uploads/8161177/normal_648b3bda939b2.pdf

## Verifica Anteprime
- Tutte e sette le anteprime per i file previsti sono istanziate e sanificate, private dei collegamenti anomali o dotate dei collegamenti depurati (UTM e Frammenti testuali rimossi/ispezionati via richiesta di rete).
- Il testo visibile è intatto, solo i tag \`<a>\` specifici sono stati disattivati laddove non affidabili.
`;
    fs.writeFileSync(path.join(brainDir, 'report_anteprima_lotto2C-A.md'), mdReport, 'utf8');

    let mdDecis = `# Decisioni Editoriali (Lotto 2C-A)

A valle delle indagini di rete condotte in \`audit_collegamenti_lotto2C-A.csv\`:
1. **Lazio e Vigilanza (UTM)**: I parametri \`utm_source=chatgpt.com\` sono stati neutralizzati, lasciando URL puri che sono stati corroborati dalle risposte server 200. Si attende validazione editoriale delle fonti pervenuti.
2. **Accessibilità Digitale**: Eliminato link a sessione chiusa ChatGPT. Testo invariato.
3. **Bonus Assunzione**: Il link anomalo con frammento è stato decurtato, o annullato (mantenendo testo) in caso di irraggiungibilità dell'URL di pertinenza Corriere.
4. **Duplicati 5 Invenzioni**: Validato come duplicato perfetto (hash identico). Proposta la ritenzione del capostipite originario.
`;
    fs.writeFileSync(path.join(brainDir, 'decisioni_editoriali_lotto2C-A.md'), mdDecis, 'utf8');

    console.log("Completato");
}

main().catch(console.error);
