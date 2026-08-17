const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const PORT = 8082; // Different port to avoid conflicts

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(rootDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }
    if (fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).on('error', (err) => {
        res.writeHead(500);
        res.end('Server Error');
    }).pipe(res);
});

server.listen(PORT, '127.0.0.1', async () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
    let browser;
    try {
        const puppeteer = await import('puppeteer-core');
        const edgePaths = [
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
        ];
        let edgePath = edgePaths.find(p => fs.existsSync(p));
        
        browser = await puppeteer.default.launch({
            executablePath: edgePath,
            headless: 'new',
            args: ['--no-sandbox']
        });
        
        const page = await browser.newPage();
        const viewports = [
            { width: 375, height: 900 },
            { width: 768, height: 1024 },
            { width: 1440, height: 900 }
        ];

        let failedResponses = [];
        let loadedResources = new Set();
        let loadedPages = new Set();
        
        page.on('response', response => {
            const status = response.status();
            const url = response.url();
            loadedResources.add(url.split('/').pop().split('?')[0]);
            
            if (url.startsWith(`http://127.0.0.1:${PORT}`) && !url.includes('favicon.ico')) {
                loadedPages.add(url);
                if (status >= 400) {
                    failedResponses.push(`${status} ${url}`);
                }
            }
        });

        // ============================================
        // 1. Test Articoli Root
        // ============================================
        console.log('Testing articoli.html...');
        await page.goto(`http://127.0.0.1:${PORT}/articoli.html`, { waitUntil: 'networkidle0' });
        
        // Assert loaded resources
        const requiredAssets = ['style.css', 'archivio.css', 'main.js', 'archivio.js'];
        for (const reqAsset of requiredAssets) {
            if (!loadedResources.has(reqAsset)) {
                throw new Error(`Required asset not loaded: ${reqAsset}`);
            }
        }
        
        if (failedResponses.length > 0) {
            throw new Error(`Failed network requests:\n${failedResponses.join('\n')}`);
        }
        
        // Check canonical
        const canonicalArt = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href);
        if (canonicalArt !== 'https://www.coinsieme.it/articoli.html') throw new Error('Canonical incorrect on articoli');
        
        const descArt = await page.evaluate(() => document.querySelector('meta[name="description"]')?.content);
        if (!descArt || !descArt.includes("archivio degli articoli")) throw new Error('Meta description incorrect on articoli');
        
        // Check progressive loading on desktop (1440)
        await page.setViewport(viewports[2]);
        let visibleCount = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.archivio-card')).filter(c => window.getComputedStyle(c).display !== 'none').length;
        });
        if (visibleCount !== 18) throw new Error(`Expected 18 initially visible on desktop, got ${visibleCount}`);
        
        // Take viewport screenshots
        for (const vp of viewports) {
            await page.setViewport(vp);
            await new Promise(r => setTimeout(r, 200));
            
            // Strictly fail if overflow
            const dims = await page.evaluate(() => {
                return { 
                    innerWidth: window.innerWidth, 
                    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) 
                };
            });
            if (dims.scrollWidth > dims.innerWidth) {
                throw new Error(`Horizontal overflow at ${vp.width}px! (scroll: ${dims.scrollWidth}, inner: ${dims.innerWidth})`);
            }
            if (vp.width === 375 || vp.width === 1440) {
                await page.screenshot({ path: path.join(rootDir, 'scratch', `root-articoli-${vp.width}.jpg`), type: 'jpeg', quality: 80, fullPage: false });
            }
        }
        
        // Test JS interaction
        await page.setViewport(viewports[2]);
        await page.click('#archivio-load-more');
        await new Promise(r => setTimeout(r, 200));
        
        console.log("Testing search...");
        const titleToSearch = await page.evaluate(() => document.querySelector('.archivio-card h2').textContent.split(' ')[0]);
        await page.type('#archivio-search', titleToSearch);
        await new Promise(r => setTimeout(r, 300));
        
        console.log("Testing clear...");
        await page.evaluate(() => document.getElementById('archivio-clear').click());
        await new Promise(r => setTimeout(r, 300));
        
        console.log("Testing mobile menu...");
        await page.setViewport(viewports[0]); // Mobile
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 200));
        await page.click('.nav-toggle');
        await new Promise(r => setTimeout(r, 300));
        let menuOpened = await page.evaluate(() => document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'true');
        if (!menuOpened) throw new Error(`Mobile menu did not open`);
        await page.click('.nav-toggle');
        await new Promise(r => setTimeout(r, 300));
        
        // Check for placeholder, .ph, -copy, href="#"
        const bodyHtmlArt = await page.evaluate(() => document.body.innerHTML);
        if (bodyHtmlArt.includes('.ph')) throw new Error('Found .ph');
        if (bodyHtmlArt.includes('placeholder.jpg')) throw new Error('Found placeholder img');
        if (bodyHtmlArt.includes('-copy/')) throw new Error('Found -copy');
        if (bodyHtmlArt.includes('href="#"')) throw new Error('Found href="#"');
        
        // ============================================
        // 2. Test Pubblicazioni Root
        // ============================================
        console.log('Testing pubblicazioni.html...');
        failedResponses = []; // reset
        await page.goto(`http://127.0.0.1:${PORT}/pubblicazioni.html`, { waitUntil: 'networkidle0' });
        
        if (failedResponses.length > 0) {
            throw new Error(`Failed network requests:\n${failedResponses.join('\n')}`);
        }
        
        const canonicalPub = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href);
        if (canonicalPub !== 'https://www.coinsieme.it/pubblicazioni.html') throw new Error('Canonical incorrect on pubblicazioni');
        
        const descPub = await page.evaluate(() => document.querySelector('meta[name="description"]')?.content);
        if (!descPub || !descPub.includes("archivio delle pubblicazioni")) throw new Error('Meta description incorrect on pubblicazioni');

        // Check for placeholder, .ph, -copy, href="#"
        const bodyHtmlPub = await page.evaluate(() => document.body.innerHTML);
        if (bodyHtmlPub.includes('.ph')) throw new Error('Found .ph');
        if (bodyHtmlPub.includes('placeholder.jpg')) throw new Error('Found placeholder img');
        if (bodyHtmlPub.includes('-copy/')) throw new Error('Found -copy');
        if (bodyHtmlPub.includes('href="#"')) throw new Error('Found href="#"');
        
        for (const vp of viewports) {
            if (vp.width === 375 || vp.width === 1440) {
                await page.setViewport(vp);
                await new Promise(r => setTimeout(r, 200));
                await page.screenshot({ path: path.join(rootDir, 'scratch', `root-pubblicazioni-${vp.width}.jpg`), type: 'jpeg', quality: 80, fullPage: false });
            }
        }
        
        // ============================================
        // 3. Test JS Disabled
        // ============================================
        console.log('Testing with JS disabled...');
        await page.setJavaScriptEnabled(false);
        await page.goto(`http://127.0.0.1:${PORT}/articoli.html`, { waitUntil: 'networkidle0' });
        
        const noJsCheck = await page.evaluate(() => {
             const visibleCards = Array.from(document.querySelectorAll('.archivio-card')).filter(c => {
                 return window.getComputedStyle(c).display !== 'none';
             });
             return visibleCards.length;
        });
        if (noJsCheck !== 74) throw new Error(`Expected 74 cards visible with JS disabled, got ${noJsCheck}`);
        
        // ============================================
        // 4. Test Links
        // ============================================
        console.log('Testing all links for 200 OK...');
        const allLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.archivio-card')).map(a => a.href);
        });
        
        // Actually fetch a sample to avoid taking forever, or all of them since there are only 74
        for (const link of allLinks) {
            const url = new URL(link);
            const relativePath = url.pathname;
            const res = await fetch(`http://127.0.0.1:${PORT}${relativePath}`);
            if (res.status !== 200) {
                throw new Error(`Link ${relativePath} failed with status ${res.status}`);
            }
        }
        
        console.log('ALL TESTS PASSED SUCCESSFULLY');
        
    } catch (e) {
        console.error("TEST FAILED:", e.message);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        server.close();
    }
});
