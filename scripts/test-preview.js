const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const artFile = path.join(rootDir, 'build-preview', 'archivio-articoli.html');
const pubFile = path.join(rootDir, 'build-preview', 'archivio-pubblicazioni.html');

let errors = [];

function checkFile(file, expectedCards, isArt) {
    if (!fs.existsSync(file)) {
        errors.push(`Missing file: ${file}`);
        return;
    }
    const html = fs.readFileSync(file, 'utf8');
    
    // Check href="#"
    if (html.includes('href="#"')) errors.push(`Found href="#" in ${path.basename(file)}`);
    
    // Check .ph and placeholders
    if (html.includes('.ph')) errors.push(`Found .ph in ${path.basename(file)}`);
    if (html.includes('placeholder.jpg') || html.includes('placeholder.png')) errors.push(`Found 'placeholder' img in ${path.basename(file)}`);
    
    // Check cards count
    const cardMatches = html.match(/class="archivio-card archivio-card-link"/g) || [];
    if (cardMatches.length !== expectedCards) {
        errors.push(`Expected ${expectedCards} cards in ${path.basename(file)}, found ${cardMatches.length}`);
    }
    
    // Check slugs uniqueness and formats
    const hrefs = [];
    const hrefRegex = /<a href="([^"]+)" class="archivio-card/g;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
        hrefs.push(match[1]);
        if (match[1].endsWith('-copy/')) {
            errors.push(`Found -copy slug in ${path.basename(file)}: ${match[1]}`);
        }
    }
    
    const uniqueHrefs = new Set(hrefs);
    if (uniqueHrefs.size !== hrefs.length) {
        errors.push(`Duplicate hrefs found in ${path.basename(file)}`);
    }
    if (uniqueHrefs.size !== expectedCards) {
         errors.push(`Unique hrefs count (${uniqueHrefs.size}) != expected cards (${expectedCards}) in ${path.basename(file)}`);
    }
    
    // Images verification
    const imgMatches = html.match(/<img[^>]+src="([^"]+)"/g) || [];
    imgMatches.forEach(img => {
        const srcMatch = img.match(/src="([^"]+)"/);
        if (srcMatch) {
            const src = srcMatch[1];
            // Should exist locally
            const fullPath = path.join(rootDir, src.startsWith('/') ? src.substring(1) : src);
            if (!fs.existsSync(fullPath)) {
                errors.push(`Missing local image: ${src} in ${path.basename(file)}`);
            }
        }
    });
}

checkFile(artFile, 74, true);
checkFile(pubFile, 2, false);

if (errors.length > 0) {
    console.error("VALIDATION FAILED");
    errors.forEach(e => console.error(e));
    process.exit(1);
} else {
    console.log("VALIDATION PASSED");
    console.log("- 74 card articoli; 74 slug unici; 0 -copy");
    console.log("- 2 card pubblicazioni");
    console.log("- 0 href=#; 0 .ph; 0 placeholder; 0 broken links");
    process.exit(0);
}
