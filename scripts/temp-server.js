const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const rootDir = path.join(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    let fp = path.join(rootDir, p === '/' ? 'index.html' : p);
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
      fp = path.join(fp, 'index.html');
    }
    
    let ext = path.extname(fp).toLowerCase();
    fs.readFile(fp, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      }
    });
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
  }
});

// AUTOMATIC WATCHER FOR CMS PUBLICATION
let buildTimer = null;
let isBuilding = false;
let buildPending = false;

function runBuildSequence() {
  if (isBuilding) {
    buildPending = true;
    return;
  }
  isBuilding = true;
  buildPending = false;

  console.log(`[AutoBuild] Rilevata modifica dal CMS. Avvio aggiornamento automatico...`);
  const nodeExec = `"${process.execPath}"`;
  const buildCmd = `${nodeExec} "${path.join(__dirname, 'build-cms.js')}" && ${nodeExec} "${path.join(__dirname, 'build-hybrid-index.js')}"`;

  exec(buildCmd, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    isBuilding = false;
    if (error) {
      console.error('[AutoBuild] Avviso durante la build:', error.message);
    } else {
      console.log('[AutoBuild] ✅ Sito aggiornato automaticamente con successo!');
    }
    if (buildPending) {
      setTimeout(runBuildSequence, 500);
    }
  });
}

function triggerAutoBuild(event, filename) {
  if (buildTimer) clearTimeout(buildTimer);
  buildTimer = setTimeout(runBuildSequence, 800);
}

const watchDirs = [
  path.join(rootDir, 'content', 'articoli'),
  path.join(rootDir, 'assets', 'uploads')
];

watchDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.watch(dir, (event, filename) => {
      if (filename && !filename.startsWith('.')) {
        triggerAutoBuild(event, filename);
      }
    });
  }
});

server.listen(3000, () => {
  console.log("Server HTTP indipendente con AutoBuild CMS attivo su http://localhost:3000");
});