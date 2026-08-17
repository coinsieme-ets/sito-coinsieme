const fs = require('fs');
const path = require('path');

const dataDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\scratch\\coinsieme-proto\\data';
const articoli = JSON.parse(fs.readFileSync(path.join(dataDir, 'articoli.json'), 'utf8'));
const pubblicazioni = JSON.parse(fs.readFileSync(path.join(dataDir, 'pubblicazioni.json'), 'utf8'));

const validArticoli = articoli.filter(a => !(a.statoComplessivo.startsWith('richiede-') || a.statoComplessivo === 'possibile-duplicato' || a.statoComplessivo === 'non-migrare-per-ora'));
const validPubblicazioni = pubblicazioni.filter(p => p.statoMigrazione !== 'non-migrare-per-ora');

console.log(`Articoli validi: ${validArticoli.length}`);
console.log(`Pubblicazioni valide: ${validPubblicazioni.length}`);

function printBatch(items, startIndex, endIndex, name) {
    console.log(`\n### ${name}`);
    for (let i = startIndex; i < endIndex && i < items.length; i++) {
        console.log(`- **${items[i].titolo}** (\`${items[i].slug}\`)`);
    }
}

printBatch(validArticoli, 0, 20, "Lotto 1 (Articoli 1-20)");
printBatch(validArticoli, 20, 40, "Lotto 2 (Articoli 21-40)");
printBatch(validArticoli, 40, 60, "Lotto 3 (Articoli 41-60)");
printBatch(validArticoli, 60, 76, "Lotto 4 (Articoli 61-76)");

console.log(`\n### Pubblicazioni (Incluse nel Lotto 4)`);
for (let i = 0; i < validPubblicazioni.length; i++) {
    console.log(`- **${validPubblicazioni[i].titolo}** (\`${validPubblicazioni[i].slug}\`)`);
}
