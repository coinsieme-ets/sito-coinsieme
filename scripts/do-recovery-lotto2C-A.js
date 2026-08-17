const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');
const backupDir = path.join(rootDir, '..', 'backup-pre-lotto2C-A-1786899349935');

// Find absolute path of backup
console.log("Percorso backup:", path.resolve(backupDir));

// Restore files
if (fs.existsSync(path.join(backupDir, 'articoli.html'))) {
    fs.copyFileSync(path.join(backupDir, 'articoli.html'), path.join(rootDir, 'articoli.html'));
    console.log("Ripristinato: articoli.html");
}
if (fs.existsSync(path.join(backupDir, 'data', 'articoli.json'))) {
    fs.copyFileSync(path.join(backupDir, 'data', 'articoli.json'), path.join(rootDir, 'data', 'articoli.json'));
    console.log("Ripristinato: data/articoli.json");
}
// Any other file? install-lotto2C-A.js modified redirects_lotto2C-A.json (in brain dir, ignore).
// And copied PDF to documenti/pnrr-linee-guida-accessibilita.pdf (user said "Conserva /documenti/pnrr-linee-guida-accessibilita.pdf")

// Check the json
let b = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'articoli.json'), 'utf8').replace(/^\uFEFF/,''));
console.log("Record in data/articoli.json ripristinato:", b.length);

// Remove the 6 bad directories
const badSlugs = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html'
];
// Wait! The directories created by the bad script used `a.slug` which was NOT URL encoded!
// Let's get the actual slugs from the JSON.
let actualSlugs = b.filter(x => badSlugs.includes(x.fileSorgente)).map(x => x.slug);
console.log("Slugs da rimuovere (nella radice):", actualSlugs);

for (let s of actualSlugs) {
    let badDir = path.join(rootDir, s);
    if (fs.existsSync(badDir)) {
        console.log("Rimozione:", path.resolve(badDir));
        fs.rmSync(badDir, { recursive: true, force: true });
    }
}
