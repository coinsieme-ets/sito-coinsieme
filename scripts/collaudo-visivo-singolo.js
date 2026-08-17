const express = require('express');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
let urlToTest = '';
let vpWidth = 1440;
let outName = '';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') urlToTest = args[++i];
    if (args[i] === '--width') vpWidth = parseInt(args[++i], 10);
    if (args[i] === '--output') outName = args[++i];
}

if (!urlToTest || !outName) {
    console.error("Uso: --url <url> --width <width> --output <nome>");
    process.exit(1);
}

const isMobile = vpWidth === 375;
const vpHeight = isMobile ? 900 : 1000;

const app = express();
const port = 8080;
const rootDir = path.join(__dirname, '..');

app.use(express.static(rootDir));

const server = app.listen(port, () => {
    runTest().catch(e => {
        console.error(e);
        process.exit(1);
    });
});

async function runTest() {
    const puppeteerModule = await import('puppeteer-core');
    const puppeteer = puppeteerModule.default;
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    
    const browser = await puppeteer.launch({
        executablePath: edgePath,
        headless: "new"
    });

    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots', 'collaudo-lotto2B-campione');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const page = await browser.newPage();
    let networkLogs = { css: 0, js: 0, img: 0, brokenImg: 0, other: 0, brokenLocalLinks: 0 };
    
    page.on('response', response => {
        const url = response.url();
        const status = response.status();
        if (url.endsWith('.css')) networkLogs.css++;
        else if (url.endsWith('.js')) networkLogs.js++;
        else if (url.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
            networkLogs.img++;
            if (status !== 200 && status !== 304) {
                networkLogs.brokenImg++;
            }
        } else {
            networkLogs.other++;
        }
    });

    await page.setViewport({ width: vpWidth, height: vpHeight, isMobile: isMobile });
    const client = await page.createCDPSession();
    await client.send('Emulation.setDeviceMetricsOverride', {
        width: vpWidth,
        height: vpHeight,
        deviceScaleFactor: 1,
        mobile: isMobile
    });
    
    let httpResponse = null;
    try {
        httpResponse = await page.goto(urlToTest, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch (e) {
        console.error("Timeout o errore di caricamento:", e.message);
        await browser.close();
        server.close();
        process.exit(1);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const metrics = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const navToggle = document.querySelector('.nav-toggle');
        let hamburgerDisplay = 'none';
        let hamburgerVisible = false;
        
        if (navToggle) {
            const style = window.getComputedStyle(navToggle);
            hamburgerDisplay = style.display;
            const rect = navToggle.getBoundingClientRect();
            hamburgerVisible = style.display !== 'none' && rect.width > 0 && rect.height > 0;
        }

        return {
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            placeholders: (bodyText.match(/CONTENUTO PROVVISORIO/g) || []).length,
            headerExists: document.querySelector('header') !== null || document.querySelector('.header') !== null,
            hamburgerExists: navToggle !== null,
            hamburgerDisplay: hamburgerDisplay,
            hamburgerVisible: hamburgerVisible
        };
    });

    const isHttpOk = httpResponse && httpResponse.status() === 200;
    const isOverflow = metrics.scrollWidth > metrics.innerWidth;
    const isHeaderMissing = !metrics.headerExists && !urlToTest.includes('index-lotto2B'); // indices might have header now, but wait, we generated indices with header, so everyone has header!
    const isHamburgerMissingOnMobile = isMobile && !metrics.hamburgerVisible;
    const isCssMissing = networkLogs.css === 0;
    const isJsMissing = networkLogs.js === 0;
    const hasBrokenImages = networkLogs.brokenImg > 0;

    if (!isHttpOk || isHeaderMissing || isHamburgerMissingOnMobile || isCssMissing || isJsMissing || isOverflow || hasBrokenImages) {
        console.error(`Validazione fallita per ${urlToTest}`);
        console.error(`- HTTP: ${httpResponse ? httpResponse.status() : 'null'}`);
        console.error(`- Header: ${metrics.headerExists}`);
        console.error(`- HamburgerMobile: ${isMobile ? metrics.hamburgerVisible : 'N/A'}`);
        console.error(`- CSS: ${networkLogs.css}, JS: ${networkLogs.js}`);
        console.error(`- Overflow: ${metrics.scrollWidth} > ${metrics.innerWidth}`);
        console.error(`- Immagini rotte: ${networkLogs.brokenImg}`);
        
        await browser.close();
        server.close();
        process.exit(1);
    }

    const screenshotPath = path.join(screenshotsDir, outName);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const result = {
        url: urlToTest,
        httpStatus: httpResponse ? httpResponse.status() : null,
        metrics: metrics,
        network: networkLogs,
        consoleErrors: consoleErrors,
        screenshot: screenshotPath
    };

    const logFile = path.join(rootDir, 'collaudo-lotto2B-singolo.log');
    fs.appendFileSync(logFile, JSON.stringify(result) + "\n", 'utf8');

    await page.close();
    await browser.close();
    server.close();
    
    console.log("Completato:", outName);
    process.exit(0);
}
