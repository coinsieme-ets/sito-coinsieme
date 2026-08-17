const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..');
const ts = Date.now();
const dest = path.join(__dirname, '..', '..', `backup-completamento-editoriale-${ts}`);

function copyDir(s, d) {
    fs.mkdirSync(d, { recursive: true });
    let count = 0;
    fs.readdirSync(s, { withFileTypes: true }).forEach(e => {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'node_extracted' || e.name === 'node.zip') return;
        let sp = path.join(s, e.name);
        let dp = path.join(d, e.name);
        if (e.isDirectory()) {
            count += copyDir(sp, dp);
        } else {
            fs.copyFileSync(sp, dp);
            count++;
        }
    });
    return count;
}

let total = copyDir(src, dest);
console.log('BACKUP_SUCCESS');
console.log('Destinazione:', path.resolve(dest));
console.log('Totale file copiati:', total);
