const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const PORT = 8081;

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
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
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
        
        page.on('response', response => {
            const status = response.status();
            const url = response.url();
            loadedResources.add(url.split('/').pop().split('?')[0]);
            
            if (url.startsWith(`http://127.0.0.1:${PORT}`) && !url.includes('favicon.ico')) {
                if (status >= 400) {
                    failedResponses.push(`${status} ${url}`);
                }
            }
        });

        // ============================================
        // 1. Test Archivio Articoli
        // ============================================
        console.log('Testing archivio-articoli.html...');
        await page.goto(`http://127.0.0.1:${PORT}/build-preview/archivio-articoli.html`, { waitUntil: 'networkidle0' });
        
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
        
        // Check progressive loading on desktop (1440)
        await page.setViewport(viewports[2]);
        let visibleCount = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.archivio-card')).filter(c => c.style.display !== 'none').length;
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
            
            // Viewport screenshot
            await page.screenshot({ path: path.join(rootDir, 'scratch', `articoli-http-${vp.width}.jpg`), type: 'jpeg', quality: 80, fullPage: false });
            // Diagnostic full-page screenshot
            await page.screenshot({ path: path.join(rootDir, 'scratch', `articoli-http-full-${vp.width}.jpg`), type: 'jpeg', quality: 60, fullPage: true });
        }
        
        // Test Load More
        await page.setViewport(viewports[2]);
        console.log("Testing load more...");
        await page.click('#archivio-load-more');
        await new Promise(r => setTimeout(r, 200));
        visibleCount = await page.evaluate(() => Array.from(document.querySelectorAll('.archivio-card')).filter(c => c.style.display !== 'none').length);
        if (visibleCount !== 36) throw new Error(`Expected 36 visible after load more, got ${visibleCount}`);
        await page.screenshot({ path: path.join(rootDir, 'scratch', `articoli-http-after-loadmore.jpg`), type: 'jpeg', quality: 80, fullPage: false });
        
        // Test JS Search
        console.log("Testing search...");
        const titleToSearch = await page.evaluate(() => document.querySelector('.archivio-card h2').textContent.split(' ')[0]);
        await page.type('#archivio-search', titleToSearch);
        await new Promise(r => setTimeout(r, 300));
        
        const countAfterSearch = await page.evaluate(() => parseInt(document.getElementById('archivio-stats-count').textContent));
        if (countAfterSearch === 74 || countAfterSearch === 0) throw new Error(`Search failed for ${titleToSearch}, count is ${countAfterSearch}`);
        
        const loadMoreVisible = await page.evaluate(() => document.getElementById('archivio-load-more').style.display !== 'none');
        if (loadMoreVisible) throw new Error(`Load more button should be hidden during search`);
        
        await page.screenshot({ path: path.join(rootDir, 'scratch', `articoli-http-search-results.jpg`), type: 'jpeg', quality: 80, fullPage: false });
        
        // Test clear
        console.log("Testing clear...");
        await page.evaluate(() => document.getElementById('archivio-clear').click());
        await new Promise(r => setTimeout(r, 300));
        const countAfterClear = await page.evaluate(() => parseInt(document.getElementById('archivio-stats-count').textContent));
        if (countAfterClear !== 18) throw new Error(`Clear failed to restore progressive view (expected 18 on desktop, got ${countAfterClear})`);
        
        // Test search non-existing
        console.log("Testing no results...");
        await page.type('#archivio-search', 'XYZABC123NONEXISTENT');
        await new Promise(r => setTimeout(r, 300));
        const countNone = await page.evaluate(() => parseInt(document.getElementById('archivio-stats-count').textContent));
        if (countNone !== 0) throw new Error(`Search for nonexistent failed, count is ${countNone}`);
        await page.screenshot({ path: path.join(rootDir, 'scratch', `articoli-http-search-no-results.jpg`), type: 'jpeg', quality: 80, fullPage: false });
        
        // Check Mobile Menu
        console.log("Testing mobile menu...");
        await page.setViewport(viewports[0]); // Mobile
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 200));
        await page.click('.nav-toggle');
        await new Promise(r => setTimeout(r, 300));
        let menuOpened = await page.evaluate(() => document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'true');
        if (!menuOpened) throw new Error(`Mobile menu did not open`);
        await page.screenshot({ path: path.join(rootDir, 'scratch', `articoli-http-mobile-menu.jpg`), type: 'jpeg', quality: 80, fullPage: false });
        await page.click('.nav-toggle');
        await new Promise(r => setTimeout(r, 300));
        let menuClosed = await page.evaluate(() => document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'false');
        if (!menuClosed) throw new Error(`Mobile menu did not close`);
        
        // Focus test
        console.log("Testing focus...");
        await page.focus('#archivio-search');
        const searchFocused = await page.evaluate(() => document.activeElement.id === 'archivio-search');
        if (!searchFocused) throw new Error(`Failed to focus search input`);
        
        // ============================================
        // 2. Test Archivio Pubblicazioni
        // ============================================
        console.log('Testing archivio-pubblicazioni.html...');
        failedResponses = []; // reset
        await page.goto(`http://127.0.0.1:${PORT}/build-preview/archivio-pubblicazioni.html`, { waitUntil: 'networkidle0' });
        
        if (failedResponses.length > 0) {
            throw new Error(`Failed network requests:\n${failedResponses.join('\n')}`);
        }
        
        for (const vp of viewports) {
            await page.setViewport(vp);
            await new Promise(r => setTimeout(r, 200));
            await page.screenshot({ path: path.join(rootDir, 'scratch', `pubblicazioni-http-${vp.width}.jpg`), type: 'jpeg', quality: 80, fullPage: false });
        }
        
        // ============================================
        // 3. Test JS Disabled
        // ============================================
        console.log('Testing with JS disabled...');
        await page.setJavaScriptEnabled(false);
        await page.goto(`http://127.0.0.1:${PORT}/build-preview/archivio-articoli.html`, { waitUntil: 'networkidle0' });
        
        const noJsCheck = await page.evaluate(() => {
             const visibleCards = Array.from(document.querySelectorAll('.archivio-card')).filter(c => {
                 // In pure CSS, elements don't get inline style="display:none" if JS doesn't run
                 return window.getComputedStyle(c).display !== 'none';
             });
             return visibleCards.length;
        });
        if (noJsCheck !== 74) throw new Error(`Expected 74 cards visible with JS disabled, got ${noJsCheck}`);
        
        console.log('ALL TESTS PASSED SUCCESSFULLY');
        
    } catch (e) {
        console.error("TEST FAILED:", e.message);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        server.close();
    }
});
