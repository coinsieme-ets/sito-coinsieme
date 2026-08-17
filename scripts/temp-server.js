const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
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
        if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
            fp = path.join(fp, 'index.html');
        }
        
        let ext = path.extname(fp);
        fs.readFile(fp, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
                res.end(data);
            }
        });
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
    }
});

server.listen(3000, () => {
    console.log("Server HTTP indipendente attivo su http://localhost:3000");
});