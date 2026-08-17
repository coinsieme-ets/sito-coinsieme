const fs = require('fs');

const a = fs.readFileSync('articoli/raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali/index.html','utf8');
const b = fs.readFileSync('articoli/raggiunta-finalmente-l-intesa-per-il-rinnovo-del-contratto-delle-cooperative-sociali-copy/index.html','utf8');

const bA = a.match(/<div class="article-body">([\s\S]*?)<\/div>/)[1].trim().replace(/\s+/g, ' ');
const bB = b.match(/<div class="article-body">([\s\S]*?)<\/div>/)[1].trim().replace(/\s+/g, ' ');

console.log("Length A:", bA.length);
console.log("Length B:", bB.length);

let firstDiff = -1;
for (let i = 0; i < Math.min(bA.length, bB.length); i++) {
    if (bA[i] !== bB[i]) {
        firstDiff = i;
        break;
    }
}

if (firstDiff !== -1) {
    console.log("Diff at index", firstDiff);
    console.log("A around diff:", bA.substring(Math.max(0, firstDiff - 20), firstDiff + 100));
    console.log("B around diff:", bB.substring(Math.max(0, firstDiff - 20), firstDiff + 100));
} else {
    console.log("No differences found.");
}
