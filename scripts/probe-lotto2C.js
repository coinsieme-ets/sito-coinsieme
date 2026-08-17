const fs = require('fs');

const a = JSON.parse(fs.readFileSync('data/articoli.json', 'utf8').replace(/^\uFEFF/,''));
const targets = [
    'accessibilit%C3%A0-digitale-dal-28-giugno-%C3%A8-legge-in-tutta-europa-ecco-cosa-cambia-per-aziende-e-cittadini.html',
    'bonus-assunzione-disabili-per-gli-ets.html',
    'il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perch%C3%A9-%C3%A8-importante.html',
    'nuove-regole-di-vigilanza-sulle-cooperative-pi%C3%B9-trasparenza-pi%C3%B9-responsabilit%C3%A0-pi%C3%B9-qualit%C3%A0-sociale.html',
    'pnrr-e-accessibilita-luoghi-di-cultura.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi.html',
    'innovazione-e-domotica-assistiva-5-invenzioni-del-futuro-gi%C3%A0-tra-noi-copy.html'
];

targets.forEach(t => {
    let f = a.find(x => x.fileSorgente === t);
    if (!f) return;
    console.log("=== " + t + " ===");
    let matches = [...f.corpoHtml.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    matches.forEach(m => {
        console.log("HREF:", m[1]);
        console.log("TEXT:", m[2].trim());
    });
});
