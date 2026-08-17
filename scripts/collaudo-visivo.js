const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080;
const rootDir = path.join(__dirname, '..');

app.use(express.static(rootDir));

const server = app.listen(port, () => {
    console.log(`Server avviato su http://localhost:${port}`);
    runTest().catch(console.error);
});

async function runTest() {
    const puppeteerModule = await import('puppeteer-core');
    const puppeteer = puppeteerModule.default;
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    
    const browser = await puppeteer.launch({
        executablePath: edgePath,
        headless: "new"
    });

    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots', 'collaudo-lotto2B');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const pagesToTest = [
        { url: `http://localhost:${port}/articoli/15-milioni-di-euro-per-la-digitalizzazione-del-terzo-settore/index.html`, name: 'art-15-milioni' },
        { url: `http://localhost:${port}/articoli/50-anni-da-basaglia-e-dalla-prima-cooperative-di-integrazione-sociale/index.html`, name: 'art-50-anni-basaglia' },
        { url: `http://localhost:${port}/articoli/agricoltura-capodarco-vince-la-sua-battaglia-per-la-sede/index.html`, name: 'art-agricoltura' },
        { url: `http://localhost:${port}/articoli/anac-nelle-gare-non-ci-possono-essere-discriminazioni-fra-regioni-per-la-selezione-di-coop-sociali/index.html`, name: 'art-anac' },
        { url: `http://localhost:${port}/articoli/appalti-nuove-regole-per-individuare-i-ccnl/index.html`, name: 'art-appalti' },
        { url: `http://localhost:${port}/articoli/assegno-ordinario-di-invalidit%C3%A0-e-lavoro-dipendente-decurtazioni-e-adempimenti/index.html`, name: 'art-assegno' },
        { url: `http://localhost:${port}/pubblicazioni/70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook/index.html`, name: 'pub-70-e-ebook' },
        { url: `http://localhost:${port}/pubblicazioni/guida-allacitta-di-roma-anno-1990/index.html`, name: 'pub-guida-1990' },
        { url: `http://localhost:${port}/build-preview/articoli-index-lotto2B.html`, name: 'idx-articoli' },
        { url: `http://localhost:${port}/build-preview/pubblicazioni-index-lotto2B.html`, name: 'idx-pubblicazioni' }
    ];

    const viewports = [
        { width: 375, height: 900, name: '375px', isMobile: true },
        { width: 1440, height: 900, name: '1440px', isMobile: false }
    ];

    let results = [];

    for (const p of pagesToTest) {
        for (const vp of viewports) {
            const page = await browser.newPage();
            
            let networkLogs = { css: 0, js: 0, img: 0, brokenImg: 0, other: 0 };
            
            page.on('response', response => {
                const url = response.url();
                const status = response.status();
                if (url.endsWith('.css')) networkLogs.css++;
                else if (url.endsWith('.js')) networkLogs.js++;
                else if (url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
                    networkLogs.img++;
                    if (status !== 200 && status !== 304) {
                        networkLogs.brokenImg++;
                    }
                } else {
                    networkLogs.other++;
                }
            });

            await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
            const client = await page.createCDPSession();
            await client.send('Emulation.setDeviceMetricsOverride', {
                width: vp.width,
                height: vp.height,
                deviceScaleFactor: 1,
                mobile: vp.isMobile
            });
            
            await page.goto(p.url, { waitUntil: 'networkidle0' });
            await page.evaluate(() => window.scrollTo(0, 0));
            // Attendi il completamento del layout
            await new Promise(r => setTimeout(r, 500));

            const screenshotPath = path.join(screenshotsDir, `${p.name}-${vp.name}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });

            const metrics = await page.evaluate(() => {
                return {
                    innerWidth: window.innerWidth,
                    scrollWidth: document.documentElement.scrollWidth,
                    placeholders: (document.body.innerText.match(/CONTENUTO PROVVISORIO/g) || []).length,
                    mobileMenuExists: document.querySelector('.menu-toggle') !== null || document.querySelector('.mobile-nav') !== null || document.querySelector('.navbar-toggler') !== null
                };
            });

            results.push({
                page: p.name,
                viewport: vp.name,
                metrics: metrics,
                network: networkLogs,
                screenshot: screenshotPath
            });

            await page.close();
        }
    }

    await browser.close();
    server.close();
    
    console.log("\n--- RISULTATI COLLAUDO VISIVO ---");
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}
