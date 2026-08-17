const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const articoliDir = path.join(rootDir, 'articoli');
const articoliJsonPath = path.join(rootDir, 'data', 'articoli.json');

const articoliData = JSON.parse(fs.readFileSync(articoliJsonPath, 'utf8').replace(/^\uFEFF/, ''));
const folders = fs.readdirSync(articoliDir).filter(f => fs.statSync(path.join(articoliDir, f)).isDirectory());

console.log(`Found ${folders.length} folders in articoli/`);

const migrated = articoliData.filter(a => folders.includes(a.slug));

console.log(`Matched ${migrated.length} items in JSON`);

// 1. Uniqueness Checks
const slugs = new Set();
const canonicals = new Set();
const duplicates = { slugs: [], canonicals: [] };

const validationErrors = [];

const parsedItems = [];

for (const a of migrated) {
    if (!a.titolo || a.titolo.trim() === '') validationErrors.push(`Titolo vuoto per: ${a.slug}`);
    if (slugs.has(a.slug)) duplicates.slugs.push(a.slug);
    slugs.add(a.slug);

    const htmlPath = path.join(articoliDir, a.slug, 'index.html');
    let htmlContent = '';
    if (fs.existsSync(htmlPath)) {
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const bodyMatch = htmlContent.match(/<div class="article-body">([\s\S]*?)<\/div>/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';
        if (!body) validationErrors.push(`Corpo HTML vuoto o mancante per: ${a.slug}`);

        const canonMatch = htmlContent.match(/<link rel="canonical" href="([^"]+)"/);
        if (canonMatch) {
            const canonicalUrl = canonMatch[1];
            if (canonicals.has(canonicalUrl)) duplicates.canonicals.push(canonicalUrl);
            canonicals.add(canonicalUrl);
        } else {
            validationErrors.push(`Canonical mancante nell'HTML per: ${a.slug}`);
        }
        
        if (htmlContent.includes('2024-01-01') || htmlContent.includes('1 gennaio 2024')) validationErrors.push(`Data fittizia in: ${a.slug}`);
        if (htmlContent.includes('Redazione COINSIEME')) validationErrors.push(`Autore fittizio in: ${a.slug}`);
        
        const normalizedBody = body.replace(/\s+/g, ' ').trim();
        const hash = crypto.createHash('sha256').update(normalizedBody).digest('hex');
        
        parsedItems.push({
            slug: a.slug,
            titolo: a.titolo,
            urlOriginale: a.urlOriginale,
            body: normalizedBody,
            hash: hash,
            links: Array.from(body.matchAll(/href="([^"]+)"/g)).map(m => m[1]),
            images: Array.from(body.matchAll(/src="([^"]+)"/g)).map(m => m[1])
        });
    } else {
        validationErrors.push(`File index.html non trovato per: ${a.slug}`);
    }
}

console.log("\n--- VALIDATION ERRORS ---");
if (validationErrors.length === 0) console.log("Nessun errore di validazione trovato.");
else validationErrors.forEach(e => console.log(e));

console.log("\n--- DUPLICATES ---");
console.log("Slugs:", duplicates.slugs);
console.log("Canonicals:", duplicates.canonicals);

// 2. Pair Comparison
const suspectedPairs = [];
// Explicit pairs
const p1_a = parsedItems.find(i => i.slug === 'dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104');
const p1_b = parsedItems.find(i => i.slug === 'dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104-copy');
if (p1_a && p1_b) suspectedPairs.push([p1_a, p1_b]);

const p2_a = parsedItems.find(i => i.slug === 'raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali');
const p2_b = parsedItems.find(i => i.slug === 'raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali-copy');
if (p2_a && p2_b) suspectedPairs.push([p2_a, p2_b]);

// Look for others with "-copy", "-1", etc or similar titles
for (let i = 0; i < parsedItems.length; i++) {
    for (let j = i + 1; j < parsedItems.length; j++) {
        const item1 = parsedItems[i];
        const item2 = parsedItems[j];
        
        // skip if already in explicit pairs
        if ((item1 === p1_a && item2 === p1_b) || (item1 === p1_b && item2 === p1_a) ||
            (item1 === p2_a && item2 === p2_b) || (item1 === p2_b && item2 === p2_a)) continue;
            
        let isSuspect = false;
        if (item1.hash === item2.hash) isSuspect = true;
        else if (item1.titolo.toLowerCase() === item2.titolo.toLowerCase()) isSuspect = true;
        else if (item1.titolo.toLowerCase().includes(item2.titolo.toLowerCase()) && item2.titolo.length > 20) isSuspect = true;
        else if (item2.titolo.toLowerCase().includes(item1.titolo.toLowerCase()) && item1.titolo.length > 20) isSuspect = true;
        
        if (isSuspect) suspectedPairs.push([item1, item2]);
    }
}

console.log("\n--- PAIR ANALYSIS ---");
suspectedPairs.forEach((pair, idx) => {
    const [a, b] = pair;
    console.log(`\nPair ${idx + 1}:`);
    console.log(`A: [${a.slug}] ${a.titolo} (Orig: ${a.urlOriginale})`);
    console.log(`B: [${b.slug}] ${b.titolo} (Orig: ${b.urlOriginale})`);
    console.log(`Same Hash? ${a.hash === b.hash}`);
    if (a.hash !== b.hash) {
        console.log(`Body A length: ${a.body.length}, Body B length: ${b.body.length}`);
        const arrA = a.body.split('');
        const arrB = b.body.split('');
        let diffCount = 0;
        let snippet = '';
        for(let i=0; i<Math.min(arrA.length, arrB.length); i++) {
            if (arrA[i] !== arrB[i]) {
                if (diffCount < 5) snippet += `[At ${i}: A='${arrA[i]}', B='${arrB[i]}'] `;
                diffCount++;
            }
        }
        diffCount += Math.abs(arrA.length - arrB.length);
        console.log(`Differences at char level: ${diffCount}. First diffs: ${snippet}`);
    }
    console.log(`Links A: ${a.links.length}, Links B: ${b.links.length}`);
    console.log(`Images A: ${a.images.length}, Images B: ${b.images.length}`);
});

