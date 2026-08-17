const fs = require('fs');
const path = require('path');
const express = require('express');

const rootDir = path.join(__dirname, '..');
const manifestPath = path.join(rootDir, 'batch_manifest_lotto2B.csv');
const logFile = path.join(rootDir, 'scratch', 'diagnostica-lotto2B', 'lotto4-http-validation.jsonl');

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const manifestLines = fs.readFileSync(manifestPath, 'utf8').split('\n');
const urlsToTest = [];
for (const line of manifestLines) {
    if (line.startsWith('Lotto 4;')) {
        const parts = line.split(';');
        urlsToTest.push({ url: `http://127.0.0.1:8080/articoli/${parts[3]}/index.html`, slug: parts[3] });
    }
}

const app = express();
app.use(express.static(rootDir));

const server = app.listen(8080, async () => {
    try {
        const puppeteerModule = await import('puppeteer-core');
        const puppeteer = puppeteerModule.default;
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        const browser = await puppeteer.launch({ executablePath: edgePath, headless: "new" });

        for (const item of urlsToTest) {
            const url = item.url;
            let logEntry = {
                url,
                httpStatus: null,
                presenzaPh: false,
                linkLocaliRotti: 0,
                placeholder: 0,
                immaginiRotte: 0,
                cssCaricato: false,
                jsCaricato: false,
                linkChatGPT: 0,
                utmChatGPT: 0,
                tokenTemplateIrrisolti: 0
            };

            const page = await browser.newPage();
            const response = await page.goto(url, { waitUntil: 'networkidle0' });
            logEntry.httpStatus = response.status();
            
            const checks = await page.evaluate(() => {
                const results = {};
                results.presenzaPh = document.querySelectorAll('.ph').length > 0;
                results.linkLocaliRotti = document.querySelectorAll('a[href="#"]').length;
                results.placeholder = (document.body.innerText.match(/CONTENUTO PROVVISORIO/g) || []).length + (document.body.innerText.toLowerCase().match(/placeholder/g) || []).length;
                let brokenImages = 0;
                document.querySelectorAll('img').forEach(img => {
                    if (img.naturalWidth === 0 && !img.src.includes('data:image')) brokenImages++;
                });
                results.immaginiRotte = brokenImages;
                
                let cssLoaded = false;
                for (let i = 0; i < document.styleSheets.length; i++) {
                    if (document.styleSheets[i].href && document.styleSheets[i].href.includes('style.css')) cssLoaded = true;
                }
                results.cssCaricato = cssLoaded;
                
                results.jsCaricato = typeof window.appConfig !== 'undefined' || document.querySelectorAll('script[src*="main.js"]').length > 0;
                
                const html = document.documentElement.outerHTML;
                results.linkChatGPT = (html.match(/chatgpt\.com/gi) || []).length;
                results.utmChatGPT = (html.match(/utm_source=chatgpt/gi) || []).length;
                results.tokenTemplateIrrisolti = (html.match(/\{\{.*?\}\}/g) || []).length;
                
                return results;
            });
            
            Object.assign(logEntry, checks);
            console.log(`OK ${item.slug}`);
            
            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
            await page.close();
        }

        await browser.close();
        server.close();
        console.log("Scansione HTTP completata senza errori.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});
