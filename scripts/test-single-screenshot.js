const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = 'C:\\Users\\Utente\\.gemini\\antigravity\\scratch\\coinsieme-proto\\index.html';
const outFile = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393\\.tempmediaStorage\\homepage_1440.png';

let cmd = `"${edgePath}" --headless=new --window-size=1440,1000 --virtual-time-budget=5000 --run-all-compositor-stages-before-draw --screenshot="${outFile}" "file:///${htmlFile.replace(/\\/g, '/')}"`;

console.log("Running command:", cmd);
execSync(cmd);

let stats = fs.statSync(outFile);
console.log("Screenshot STATS:", stats.size, "bytes");
