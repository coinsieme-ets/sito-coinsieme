const fs = require('fs');
const path = require('path');
const express = require('express');

const rootDir = path.join(__dirname, '..');
const manifestPath = path.join(rootDir, 'batch_manifest_lotto2B.csv');
const logFile = path.join(rootDir, 'scratch', 'diagnostica-lotto2B', 'lotto3-http-validation.jsonl');

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const port = 8080;
const manifestLines = fs.readFileSync(manifestPath, 'utf8').split('\n');
const urlsToTest = [];
for (const line of manifestLines) {
    if (line.startsWith('Lotto 3;')) {
        const parts = line.split(';');
        urlsToTest.push({ url: `http://127.0.0.1:${port}/articoli/${parts[3]}/index.html`, slug: parts[3] });
    }
}

const app = express();
app.use(express.static(rootDir));

const server = app.listen(port, () => {
    runTests().catch(e => {
        console.error(e);
        process.exit(1);
    });
});

async function runTests() {
    const puppeteerModule = await import('puppeteer-core');
    const puppeteer = puppeteerModule.default;
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    
    const browser = await puppeteer.launch({
        executablePath: edgePath,
        headless: "new"
    });

    let hasErrors = false;

    for (const item of urlsToTest) {
        const slug = item.slug;
        const page = await browser.newPage();
        const urlToTest = item.url;
        
        let networkLogs = { css: false, js: false, imgTotal: 0, brokenImg: 0, brokenLocalLinks: 0 };
        
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            if (url.includes('.css') && (status === 200 || status === 304)) networkLogs.css = true;
            else if (url.includes('.js') && (status === 200 || status === 304)) networkLogs.js = true;
            else if (url.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
                networkLogs.imgTotal++;
                if (status !== 200 && status !== 304) {
                    networkLogs.brokenImg++;
                }
            }
        });

        let httpResponse = null;
        try {
            httpResponse = await page.goto(urlToTest, { waitUntil: 'networkidle0', timeout: 30000 });
        } catch (e) {
            console.error(`Errore caricamento ${urlToTest}: ${e.message}`);
            httpResponse = { status: () => 500 };
        }

        const metrics = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const bodyHtml = document.body.innerHTML;
            
            const canonicalTag = document.querySelector('link[rel="canonical"]');
            const canonical = canonicalTag ? canonicalTag.href : '';
            const title = document.title;
            
            const links = Array.from(document.querySelectorAll('a'));
            let brokenLocalLinks = 0;
            // A basic check in DOM (but we also want to catch network 404s if they were clicked, which we don't do. 
            // We just check if href is # or undefined).
            for (const a of links) {
                if (a.getAttribute('href') === '#') brokenLocalLinks++;
            }
            
            let chatgptLinks = 0;
            let chatgptUtm = 0;
            for (const a of links) {
                const href = a.href || '';
                if (href.includes('chat.openai.com') || href.includes('chatgpt')) chatgptLinks++;
                if (href.includes('utm_source=chatgpt')) chatgptUtm++;
            }
            
            return {
                canonical,
                title,
                placeholders: (bodyText.match(/CONTENUTO PROVVISORIO/g) || []).length,
                hasPh: document.querySelectorAll('.ph').length > 0,
                brokenLocalLinks,
                chatgptLinks,
                chatgptUtm,
                unresolvedTokens: (bodyHtml.match(/{{.*?}}/g) || []).length
            };
        });

        // Test broken local links via fetch
        const localLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.startsWith('http://127.0.0.1:8080/'));
        });
        
        for (const href of localLinks) {
            try {
                const r = await page.evaluate(async (url) => {
                    const res = await fetch(url, { method: 'HEAD' });
                    return res.status;
                }, href);
                if (r !== 200) networkLogs.brokenLocalLinks++;
            } catch (e) {
                networkLogs.brokenLocalLinks++;
            }
        }

        const result = {
            slug: slug,
            url: urlToTest,
            httpStatus: httpResponse ? httpResponse.status() : 500,
            canonical: metrics.canonical,
            titolo: metrics.title,
            cssCaricato: networkLogs.css,
            jsCaricato: networkLogs.js,
            immaginiTotali: networkLogs.imgTotal,
            immaginiRotte: networkLogs.brokenImg,
            linkLocaliRotti: metrics.brokenLocalLinks + networkLogs.brokenLocalLinks,
            placeholder: metrics.placeholders,
            presenzaPh: metrics.hasPh,
            linkChatGPT: metrics.chatgptLinks,
            utmChatGPT: metrics.chatgptUtm,
            tokenTemplateIrrisolti: metrics.unresolvedTokens
        };

        fs.appendFileSync(logFile, JSON.stringify(result) + "\n", 'utf8');
        
        const isError = result.httpStatus !== 200 || 
                        result.immaginiRotte > 0 || 
                        result.linkLocaliRotti > 0 || 
                        result.placeholder > 0 || 
                        result.presenzaPh || 
                        result.linkChatGPT > 0 || 
                        result.utmChatGPT > 0 || 
                        result.tokenTemplateIrrisolti > 0;
                        
        if (isError) {
            hasErrors = true;
            console.error(`ERRORE su ${slug}:`, JSON.stringify(result));
        } else {
            console.log(`OK ${slug}`);
        }

        await page.close();
    }

    await browser.close();
    server.close();
    
    if (hasErrors) {
        console.error("Ci sono errori nella scansione HTTP.");
        process.exit(1);
    } else {
        console.log("Scansione HTTP completata senza errori.");
        process.exit(0);
    }
}
