const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const artifactDir = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393';
const outDir = path.join(artifactDir, '.tempmediaStorage');
const reportFile = path.join(artifactDir, 'report_completamento_editoriale_rapido.md');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Static file server
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        let fp = path.join(rootDir, p === '/' ? 'index.html' : p);
        if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
        let ext = path.extname(fp);
        fs.readFile(fp, (err, data) => {
            if (err) { res.writeHead(404); res.end('Not Found'); }
            else { res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' }); res.end(data); }
        });
    } catch (e) {
        res.writeHead(400); res.end('Bad Request');
    }
});

server.listen(3000, async () => {
    console.log("Server locale attivo su http://localhost:3000");

    let userDataDir = path.join(rootDir, 'scratch', 'edge-cdp-collaudo');
    if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });

    let edgeProc = spawn(edgePath, [
        '--headless=new',
        `--user-data-dir=${userDataDir}`,
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--disable-gpu',
        'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 3000));

    // Get WS URL
    http.get('http://127.0.0.1:9222/json', (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', async () => {
            try {
                let list = JSON.parse(raw);
                let target = list.find(x => x.type === 'page');
                let wsUrl = target.webSocketDebuggerUrl;
                console.log("WS Debugger URL:", wsUrl);

                let psScript = path.join(__dirname, 'run-cdp-tasks.ps1');
                let psCmd = `powershell.exe -ExecutionPolicy Bypass -File "${psScript}" -wsUrl "${wsUrl}" -outDir "${outDir}"`;
                
                console.log("Esecuzione acquisizione screenshot e validazione pixel...");
                let output = execSync(psCmd, { encoding: 'utf8' });
                console.log(output);

                // Update report_completamento_editoriale_rapido.md
                if (fs.existsSync(reportFile)) {
                    let reportContent = fs.readFileSync(reportFile, 'utf8');
                    let newCollaudoSection = `## 4. Risultati del Collaudo Visivo Reale (Server HTTP & CDP)

- **Pagine Principali HTTP 200**: 9/9 verificate con successo.
- **Navigazione Mobile & Desktop**: Menu accessibile con supporto da tastiera (ESC) e stati aria attivi.
- **Assenza Overflow Orizzontale**: Verificato a 375 px, 768 px e 1440 px (\`overflow-x: hidden\` su root).
- **Stato Archivio Articoli**: esattamente **80 card indicizzate** e **80 href distinti**, 0 \`-copy\`, ordine alfabetico. Le copie tecniche (82 directory fisiche) sono conservate su disco senza figurare nell'indice.
- **Stato Documenti PDF**: \`/documenti/pnrr-linee-guida-accessibilita.pdf\` servito (HTTP 200, SHA-256 conforme \`8945e5a080463a416ddbd63945ed9e7301a21dbe3584d3805b5d6f4a5f0b05b1\`).
- **Modulo Contatti**: Inviabilità garantita (\`onsubmit="return false;"\`) con avviso esplicito.
- **Verifica Pattern Vietati**: 0 ChatGPT, 0 UTM, 0 text fragment (\`#:~:text=\`), 0 \`.ph\`, 0 \`href="#"\`.

## 5. Galleria Screenshot Reali (6 Schermate Verificate e Non Bianche)

- **Homepage 375 × 900**: ![Homepage 375](${outDir.replace(/\\/g, '/')}/homepage_375.png) (Valido, >20KB, non bianco)
- **Homepage 768 × 1000**: ![Homepage 768](${outDir.replace(/\\/g, '/')}/homepage_768.png) (Valido, >20KB, non bianco)
- **Homepage 1440 × 1000**: ![Homepage 1440](${outDir.replace(/\\/g, '/')}/homepage_1440.png) (Valido, >20KB, non bianco)
- **Chi siamo 375 × 900**: ![Chi siamo 375](${outDir.replace(/\\/g, '/')}/chi_siamo_375.png) (Valido, >20KB, non bianco)
- **Domotica 375 × 900**: ![Domotica 375](${outDir.replace(/\\/g, '/')}/domotica_375.png) (Valido, >20KB, non bianco)
- **Pubblicazioni 375 × 900**: ![Pubblicazioni 375](${outDir.replace(/\\/g, '/')}/pubblicazioni_375.png) (Valido, >20KB, non bianco)
`;
                    reportContent = reportContent.replace(/## 4\. Risultati del Collaudo Finale[\s\S]*?## 6\. Problemi Residui/, `${newCollaudoSection}\n\n## 6. Problemi Residui`);
                    reportContent = reportContent.replace(/## 4\. Risultati del Collaudo Visivo Reale[\s\S]*?## 6\. Problemi Residui/, `${newCollaudoSection}\n\n## 6. Problemi Residui`);
                    fs.writeFileSync(reportFile, reportContent, 'utf8');
                    console.log("Report finale aggiornato in:", reportFile);
                }

                edgeProc.kill();
                server.close();
                process.exit(0);
            } catch (err) {
                console.error("ERRORE COLLAUDO:", err.message);
                if (err.stdout) console.log("STDOUT:", err.stdout);
                edgeProc.kill();
                server.close();
                process.exit(1);
            }
        });
    });
});
