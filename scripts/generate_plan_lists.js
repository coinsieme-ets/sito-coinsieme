const fs = require('fs');
const lines = fs.readFileSync('batch_manifest_lotto2B.csv', 'utf8').split('\n');

let currentBatch = '';
let markdown = '';

for (const line of lines) {
    if (!line.trim() || line.startsWith('batch;')) continue;
    const parts = line.split(';');
    const batch = parts[0];
    const title = parts[2].replace(/^"|"$/g, '').replace(/""/g, '"');
    const slug = parts[3];

    if (batch !== currentBatch) {
        markdown += `\n### ${batch}\n`;
        currentBatch = batch;
    }
    markdown += `- **${title}** (\`${slug}\`)\n`;
}

fs.writeFileSync('plan_batches.md', markdown, 'utf8');
