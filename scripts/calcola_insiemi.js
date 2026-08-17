const fs = require('fs');
const lines = fs.readFileSync('batch_manifest_lotto2B.csv', 'utf8').split('\n');

const setA = [];
const setB = [];
const nuovi = [];

for (const line of lines) {
    if (line.startsWith('Lotto 1;')) {
        const parts = line.split(';');
        const slug = parts[3];
        const giaPresente = parts[8];
        setA.push(slug);
        if (giaPresente === 'SI') {
            setB.push(slug);
        } else {
            nuovi.push(slug);
        }
    }
}

console.log(`\n=== INSIEME A (Totale 20) ===`);
console.log(setA.map(s => `- \`${s}\``).join('\n'));
console.log(`\n=== INSIEME B (Già presenti, 6) ===`);
console.log(setB.map(s => `- \`${s}\``).join('\n'));
console.log(`\n=== PAGINE NUOVE (14) ===`);
console.log(nuovi.map(s => `- \`${s}\``).join('\n'));
