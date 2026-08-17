const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const PORT = 8081;

const server = http.createServer((req, res) => {
    // Enable CORS for Decap CMS local_backend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    console.log(`[DECAP PROXY] ${req.method} ${urlPath}`);

    // Ping endpoint
    if (urlPath === '/api/v1/ping' || urlPath === '/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // List files endpoint: /api/v1/files or /api/v1/entries
    if (urlPath.startsWith('/api/v1/files') && req.method === 'GET') {
        let relDir = urlPath.replace('/api/v1/files', '').replace(/^\//, '');
        let targetDir = path.join(rootDir, relDir || 'content');
        
        let fileList = [];
        function walk(dir) {
            if (!fs.existsSync(dir)) return;
            let items = fs.readdirSync(dir);
            for (let item of items) {
                let fullPath = path.join(dir, item);
                let stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                } else {
                    let rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                    fileList.push({
                        path: rel,
                        name: item,
                        size: stat.size,
                        type: 'file'
                    });
                }
            }
        }
        walk(targetDir);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fileList));
        return;
    }

    // Read single file endpoint: /api/v1/file/:path
    if (urlPath.startsWith('/api/v1/file/') && req.method === 'GET') {
        let relPath = urlPath.replace('/api/v1/file/', '');
        let fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content, encoding: 'utf-8' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
    }

    // Write file endpoint: PUT /api/v1/file/:path or POST /api/v1/file/:path
    if ((req.method === 'PUT' || req.method === 'POST') && urlPath.startsWith('/api/v1/file/')) {
        let relPath = urlPath.replace('/api/v1/file/', '');
        let fullPath = path.join(rootDir, relPath);
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            try {
                let data = Buffer.concat(body).toString('utf8');
                let parsed = JSON.parse(data);
                let fileContent = parsed.content || data;
                
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, fileContent, 'utf8');
                console.log(`[DECAP PROXY OK] Salvato file: ${fullPath}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', path: relPath }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Default fallback
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(PORT, () => {
    console.log(`Decap CMS Proxy Server attivo su http://localhost:${PORT}`);
});
