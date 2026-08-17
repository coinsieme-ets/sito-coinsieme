const fs = require('fs');
const html = fs.readFileSync('data/articoli.json','utf8');
const p = JSON.parse(html.replace(/^\uFEFF/,'')).find(x=>x.slug==='pnrr-e-accessibilita-luoghi-di-cultura');
let newHtml = p.corpoHtml;
let href='http://musei.beniculturali.it/progetti/m1c3-investimento-1-2';
let escHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let m = newHtml.match(/<a[^>]*musei\.beniculturali\.it[^>]*>/i);
console.log('Actual tag:', m ? m[0] : null);
