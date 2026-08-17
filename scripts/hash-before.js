const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getHash(text) {
    if (!text) return null;
    return crypto.createHash('sha256').update(text).digest('hex');
}

function extractData(html) {
    const titleMatch = html.match(/<h1 id="articolo-titolo"[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : null;

    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)">/);
    const canonical = canonicalMatch ? canonicalMatch[1] : null;

    const bodyMatch = html.match(/<div class="article-body">([\s\S]*?)<!-- Condivisione -->/);
    const body = bodyMatch ? bodyMatch[1].trim() : null;

    const imagesMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/g) || [];
    const images = imagesMatch.filter(m => !m.includes('official_logo.png') && !m.includes('data:image')).map(m => m.match(/src="([^"]+)"/)[1]);

    return { 
        title: getHash(title), 
        canonical: getHash(canonical), 
        body: getHash(body), 
        images: getHash(images.join(',')) 
    };
}

const mapBefore = {};

['articoli', 'pubblicazioni'].forEach(dir => {
    const p = path.join(__dirname, '..', dir);
    if (!fs.existsSync(p)) return;
    const items = fs.readdirSync(p);
    items.forEach(item => {
        const idx = path.join(p, item, 'index.html');
        if (fs.existsSync(idx)) {
            const html = fs.readFileSync(idx, 'utf8');
            mapBefore[item] = extractData(html);
        }
    });
});

const outPath = path.join(__dirname, '..', 'scratch', 'diagnostica-lotto2B', 'hash_before.json');
fs.writeFileSync(outPath, JSON.stringify(mapBefore, null, 2));
console.log("Hash pre-rigenerazione salvati in " + outPath);
