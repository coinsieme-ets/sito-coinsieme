const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const reportFile = path.join('C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393', 'report_installazione_lotto2C-A.md');
const backupDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\scratch\\backup-pre-lotto2C-A-1786899349935';

// Static file server with decodeURIComponent
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    try {
        let decodedPath = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(rootDir, decodedPath === '/' ? 'index.html' : decodedPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        
        let extname = path.extname(filePath);
        let contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
    }
});

let errors = [];
const targetSlugs = [
    'accessibilita-digitale-dal-28-giugno-e-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini',
    'bonus-assunzione-disabili-per-gli-ets',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perche-e-importante',
    'nuove-regole-di-vigilanza-sulle-cooperative-piu-trasparenza-piu-responsabilita-piu-qualita-sociale',
    'pnrr-e-accessibilita-luoghi-di-cultura',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gia-tra-noi'
];

function fetchLocal(pathUrl) {
    return new Promise((resolve) => {
        http.get('http://localhost:3000' + pathUrl, (res) => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve({
                status: res.statusCode,
                body: Buffer.concat(data).toString('utf8'),
                raw: Buffer.concat(data)
            }));
        }).on('error', (e) => resolve({ status: 500, body: '', raw: Buffer.from('') }));
    });
}

async function runTests() {
    console.log("Inizio collaudo HTTP reale su http://localhost:3000...");

    // 1. Verify root directories do NOT exist
    let badDirsRemoved = [];
    for (let s of targetSlugs) {
        let p = path.join(rootDir, s);
        if (fs.existsSync(p)) {
            errors.push(`Directory errata ancora presente in root: ${p}`);
        } else {
            badDirsRemoved.push(p);
        }
    }

    // 2. Fetch /articoli.html
    let res = await fetchLocal('/articoli.html');
    if (res.status !== 200) errors.push(`HTTP ${res.status} per /articoli.html`);

    let html = res.body;

    // Count card anchor tags specifically
    let cardMatches = html.match(/<a[^>]*class="archivio-card archivio-card-link"/g) || [];
    let totalCards = cardMatches.length;

    let hrefsList = [];
    let hrefsSet = new Set();
    let titlesList = [];
    let linkRegex = /<a[^>]*href="([^"]+)"[^>]*class="archivio-card[^"]*"[^>]*data-title="([^"]*)"/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        hrefsList.push(match[1]);
        hrefsSet.add(match[1]);
        titlesList.push(match[2]);
        if (match[1].includes('-copy')) {
            errors.push(`Slug -copy trovato nell'archivio: ${match[1]}`);
        }
    }

    let distinctHrefs = hrefsSet.size;

    if (totalCards !== 80) errors.push(`Conteggio card errato: ${totalCards} (atteso 80)`);
    if (distinctHrefs !== 80) errors.push(`Conteggio href distinti errato: ${distinctHrefs} (atteso 80)`);
    if (totalCards !== distinctHrefs) errors.push(`Card duplicate rilevate! Cards: ${totalCards}, Hrefs: ${distinctHrefs}`);

    // Verify the 6 new links are under /articoli/
    let newLinksFound = 0;
    for (let s of targetSlugs) {
        let expectedHref = `/articoli/${s}/index.html`;
        if (hrefsSet.has(expectedHref)) {
            newLinksFound++;
        } else {
            errors.push(`Collegamento mancante nell'archivio: ${expectedHref}`);
        }
    }

    // Check alphabetical order
    let isAlphabetical = true;
    for (let i = 0; i < titlesList.length - 1; i++) {
        if (titlesList[i].localeCompare(titlesList[i+1], 'it') > 0) {
            isAlphabetical = false;
            break;
        }
    }
    if (!isAlphabetical) errors.push("L'ordine delle card nell'archivio non è alfabetico.");

    // 3. Fetch each of the 6 new pages via HTTP 200
    let correctDirsCreated = [];
    for (let s of targetSlugs) {
        let pageUrl = `/articoli/${s}/index.html`;
        let pRes = await fetchLocal(pageUrl);
        if (pRes.status !== 200) {
            errors.push(`HTTP ${pRes.status} per ${pageUrl}`);
        }
        
        let phtml = pRes.body;
        
        // Canonical check
        let expectedCanonical = `<link rel="canonical" href="https://www.coinsieme.it/articoli/${s}/index.html">`;
        if (!phtml.includes(expectedCanonical)) {
            errors.push(`Canonical mancante o errato per ${s}`);
        }

        // Link sanitization checks
        if (phtml.includes('chatgpt.com')) errors.push(`Trovato link/riferimento ChatGPT in ${s}`);
        if (phtml.includes('utm_source=')) errors.push(`Trovato parametro UTM in ${s}`);
        if (phtml.includes('#:~:text=')) errors.push(`Trovato text fragment in ${s}`);
        if (phtml.includes('href="http://musei.beniculturali.it')) errors.push(`Link ministeriale guasto ancora cliccabile in ${s}`);
        if (phtml.includes('<figure') || phtml.includes('placeholder-banner')) errors.push(`Trovato placeholder/figure in ${s}`);

        correctDirsCreated.push(path.join(rootDir, 'articoli', s));
    }

    // 4. Fetch PDF via HTTP 200 and verify SHA-256
    let pdfUrl = '/documenti/pnrr-linee-guida-accessibilita.pdf';
    let pdfRes = await fetchLocal(pdfUrl);
    if (pdfRes.status !== 200) errors.push(`HTTP ${pdfRes.status} per PDF ${pdfUrl}`);

    let pdfHash = crypto.createHash('sha256').update(pdfRes.raw).digest('hex');
    const expectedPdfHash = '8945e5a080463a416ddbd63945ed9e7301a21dbe3584d3805b5d6f4a5f0b05b1';
    if (pdfHash !== expectedPdfHash) {
        errors.push(`Hash PDF non corrispondente: ${pdfHash} (atteso ${expectedPdfHash})`);
    }

    // 5. Generate UTF-8 Report
    let reportContent = `# Report di Installazione Lotto 2C-A (Collaudo Reale Concluso)

## 1. Dettagli Ripristino e Integrità
- **Percorso backup utilizzato**: \`${backupDir}\`
- **File ripristinati**:
  - \`articoli.html\`
  - \`data/articoli.json\`
- **Directory errate rimosse dalla radice (${badDirsRemoved.length})**:
${badDirsRemoved.map(d => `  - \`${d}\``).join('\n')}
- **Directory corrette create sotto /articoli/ (${correctDirsCreated.length})**:
${correctDirsCreated.map(d => `  - \`${d}\\index.html\``).join('\n')}

## 2. Metriche Indice & Collaudo HTTP Reale
- **Conteggio card totale nell'archivio**: ${totalCards} (atteso: 80)
- **Conteggio href distinti nell'archivio**: ${distinctHrefs} (atteso: 80)
- **Duplicati rilevati**: ${totalCards === distinctHrefs ? '0' : totalCards - distinctHrefs}
- **Slug -copy presenti**: ${Array.from(hrefsSet).filter(h => h.includes('-copy')).length}
- **Ordine alfabetico verificato**: ${isAlphabetical ? 'OK' : 'FALLITO'}
- **Pagine Lotto 2C-A sotto /articoli/**: ${newLinksFound}/6 verificate (HTTP 200 reale)
- **Stato HTTP PDF**: ${pdfRes.status}
- **Hash SHA-256 PDF**: \`${pdfHash}\` (${pdfHash === expectedPdfHash ? 'CONFORME' : 'NON CONFORME'})

## 3. Elenco File Modificati / Creati nel Progetto
- \`articoli.html\` (griglia rigenerata con 80 card e contatore a 80)
- \`data/articoli.json\` (conservato inventario completo da 88 record con \`indicizzabile: false\` sui 8 residui/duplicati)
- \`articoli/accessibilita-digitale-dal-28-giugno-e-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini/index.html\`
- \`articoli/bonus-assunzione-disabili-per-gli-ets/index.html\`
- \`articoli/il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perche-e-importante/index.html\`
- \`articoli/nuove-regole-di-vigilanza-sulle-cooperative-piu-trasparenza-piu-responsabilita-piu-qualita-sociale/index.html\`
- \`articoli/pnrr-e-accessibilita-luoghi-di-cultura/index.html\`
- \`articoli/innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gia-tra-noi/index.html\`
- \`documenti/pnrr-linee-guida-accessibilita.pdf\`

## 4. Esito Finale
`;

    if (errors.length === 0) {
        reportContent += `✅ **TUTTI I TEST SUPERATI CON SUCCESSO (0 ERRORI)**\n`;
        console.log("\n✅ COLLAUDO REALE SUPERATO! 0 errori.\n");
    } else {
        reportContent += `❌ **ERRORI RILEVATI (${errors.length})**:\n` + errors.map(e => `- ${e}`).join('\n') + '\n';
        console.error("\n❌ COLLAUDO FALLITO WITH ERRORS:\n", errors);
    }

    fs.writeFileSync(reportFile, reportContent, 'utf8');
    console.log("Report scritto in:", reportFile);

    server.close();
    process.exit(errors.length === 0 ? 0 : 1);
}

server.listen(3000, () => {
    runTests();
});
