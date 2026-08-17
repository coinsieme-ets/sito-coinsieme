const fs = require('fs');
const readline = require('readline');

const csvPath = 'C:\\Users\\Utente\\.gemini\\antigravity\\brain\\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393\\audit_editoriale_pre_indici_lotto2B.csv';

function parseCSVLine(text) {
    const re = /(?:\s|^)(?:"([^"]*?)"|([^;]+))?(?=;|$)/g;
    const matches = [];
    let match;
    while ((match = re.exec(text)) !== null) {
        if (match.index === re.lastIndex) re.lastIndex++; // avoid infinite loops
        matches.push(match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2] || '');
    }
    // Remove the extra match at the end if the line ends with semicolon
    if (text.endsWith(';') && matches.length > 0 && matches[matches.length-1] === '') {
        // do nothing, let it be handled differently
    }
    // simple split approach considering quotes
    const result = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0; i<text.length; i++){
        let c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ';' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
const headers = parseCSVLine(lines[0]);
const data = lines.slice(1).map(l => parseCSVLine(l));

let errors = [];

if (data.length !== 76) errors.push(`Expected 76 data rows, got ${data.length}`);

let invalidCols = 0;
data.forEach(row => {
    if (row.length !== 10) invalidCols++;
});
if (invalidCols > 0) errors.push(`Found ${invalidCols} rows with column count != 10`);

const slugs = new Set();
const canonicals = new Set();
let indSi = 0;
let indNo = 0;
let redSi = 0;
let corpi = 0;
let hashes = 0;

data.forEach((row, idx) => {
    if (row.length !== 10) return;
    const slug = row[1];
    const can = row[2];
    const corpo = row[3];
    const hash = row[4];
    const ind = row[6];
    const red = row[8];
    
    slugs.add(slug);
    if (can) canonicals.add(can);
    
    if (ind === 'SI') indSi++;
    if (ind === 'NO') indNo++;
    if (red === 'SI') redSi++;
    if (corpo === 'SI') corpi++;
    if (hash && hash.length > 0) hashes++;
});

if (slugs.size !== 76) errors.push(`Expected 76 unique slugs, got ${slugs.size}`);
if (canonicals.size !== 76) errors.push(`Expected 76 unique canonicals, got ${canonicals.size}`);
if (indSi !== 74) errors.push(`Expected 74 indicizzabile=SI, got ${indSi}`);
if (indNo !== 2) errors.push(`Expected 2 indicizzabile=NO, got ${indNo}`);
if (redSi !== 2) errors.push(`Expected 2 redirect=SI, got ${redSi}`);
if (corpi !== 76) errors.push(`Expected 76 corpi presenti, got ${corpi}`);
if (hashes !== 76) errors.push(`Expected 76 valid hashes, got ${hashes}`);

if (errors.length > 0) {
    console.error("CERTIFICATION FAILED:");
    errors.forEach(e => console.error("- " + e));
    process.exit(1);
} else {
    console.log("CERTIFICATION PASSED:");
    console.log(`76 righe;
10 colonne per riga;
76 slug unici;
76 canonical unici;
74 indicizzabile = SI;
2 indicizzabile = NO;
2 redirect pianificato = SI;
76 corpi presenti;
76 hash non vuoti.`);
    process.exit(0);
}
