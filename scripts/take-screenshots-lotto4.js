const fs = require('fs');
const path = require('path');
const express = require('express');

const rootDir = path.join(__dirname, '..');
const app = express();
const port = 8080;
app.use(express.static(rootDir));

const screenshotsDir = path.join(rootDir, 'scratch', 'screenshots', 'collaudo-lotto2B-lotto4');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const pages = [
    { url: `http://127.0.0.1:${port}/articoli/raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali/index.html`, name: 'lotto4-primo' },
    { url: `http://127.0.0.1:${port}/articoli/vanga-e-fornello-l-agricoltura-sostenibile/index.html`, name: 'lotto4-ultimo' }
];

const server = app.listen(port, async () => {
    try {
        const puppeteerModule = await import('puppeteer-core');
        const puppeteer = puppeteerModule.default;
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        const browser = await puppeteer.launch({ executablePath: edgePath, headless: "new" });
        
        for (const p of pages) {
            console.log(`Screenshot per ${p.name}...`);
            const page = await browser.newPage();
            
            await page.setViewport({ width: 375, height: 800 });
            await page.goto(p.url, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(screenshotsDir, `${p.name}-375px.png`), fullPage: true });

            await page.setViewport({ width: 1440, height: 900 });
            await page.screenshot({ path: path.join(screenshotsDir, `${p.name}-1440px.png`), fullPage: true });
            
            await page.close();
        }
        
        await browser.close();
        console.log("Screenshot generati.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
