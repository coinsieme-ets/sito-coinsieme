const path = require('path');
const fs = require('fs');

async function run() {
    const puppeteer = await import('puppeteer-core');
    
    // Find Edge
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    let edgePath = edgePaths.find(p => fs.existsSync(p));
    if (!edgePath) {
        console.error("Microsoft Edge not found.");
        process.exit(1);
    }
    
    const browser = await puppeteer.default.launch({
        executablePath: edgePath,
        headless: 'new'
    });
    
    const page = await browser.newPage();
    const rootDir = path.join(__dirname, '..');
    const previewDir = path.join(rootDir, 'build-preview');
    
    const targets = [
        { name: 'archivio-articoli', file: path.join(previewDir, 'archivio-articoli.html') },
        { name: 'archivio-pubblicazioni', file: path.join(previewDir, 'archivio-pubblicazioni.html') }
    ];
    
    const viewports = [
        { width: 375, height: 812 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 }
    ];
    
    for (const target of targets) {
        await page.goto(`file:///${target.file.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
        
        for (const vp of viewports) {
            await page.setViewport(vp);
            // wait a little bit for reflow
            await new Promise(r => setTimeout(r, 200));
            
            const screenshotPath = path.join(rootDir, 'scratch', `${target.name}-${vp.width}.jpg`);
            await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80, fullPage: true });
            console.log(`Saved screenshot: ${screenshotPath}`);
        }
    }
    
    await browser.close();
}

run().catch(console.error);
