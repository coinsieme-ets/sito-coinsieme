const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const pages = ['chi-siamo', 'cosa-facciamo', 'domotica', 'persone-famiglie', 'trasparenza', 'contatti'];

function norm(str) {
    return str.replace(/\s+/g, ' ').trim();
}

for (let p of pages) {
    let fp = path.join(rootDir, `${p}.html`);
    let html = fs.readFileSync(fp, 'utf8');

    console.log(`\n=================== ${p}.html ===================`);
    let ps = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
                  .map(m => norm(m[1].replace(/<[^>]+>/g, '')))
                  .filter(t => t.length > 30);
    
    ps.slice(0, 3).forEach((t, i) => console.log(`P${i+1}: "${t}"`));
}
