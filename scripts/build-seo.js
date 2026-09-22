// Build-only SEO artifacts. No network calls or editorial mutations.
const fs = require('node:fs');
const path = require('node:path');
const ORIGIN = 'https://www.coinsieme.it';
const TARGET = 'dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104';
const ALIASES = ['dal-2027-cambiano-le-regole-per-l-invalidità-civile-e-la-legge-104-copy', TARGET + '-copy'];
const escape = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function canonical(html) {
  const tag = (html.match(/<link\b[^>]*>/gi) || []).find(t => /\brel=["']canonical["']/i.test(t));
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
}
function isIndexable(html) {
  return !(html.match(/<meta\b[^>]*>/gi) || []).some(t => /http-equiv=["']refresh["']/i.test(t) || (/name=["'](?:robots|googlebot)["']/i.test(t) && /noindex/i.test(t)));
}
function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? htmlFiles(path.join(dir,e.name)) : e.name.endsWith('.html') ? [path.join(dir,e.name)] : []);
}
function build(root, articles) {
  const urls = new Set();
  function add(file, expected) {
    const html = fs.readFileSync(file,'utf8'), value = canonical(html);
    if (expected && (value !== expected || !isIndexable(html))) throw Error('SEO canonical mismatch: '+file);
    if (!value || !isIndexable(html)) return;
    const url = new URL(value);
    if (url.origin !== ORIGIN || url.search || url.hash) throw Error('SEO invalid canonical: '+value);
    urls.add(url.href);
  }
  // Only articles actually rendered by CMS, never stale directories or drafts.
  for (const item of articles.filter(a=>a.visible!==false)) {
    if (!/^[a-z0-9-]+$/.test(item.slug)) throw Error('SEO invalid slug');
    add(path.join(root,'articoli',item.slug,'index.html'), `${ORIGIN}/articoli/${item.slug}/`);
  }
  for (const name of fs.readdirSync(root).filter(n=>n.endsWith('.html') && n!=='404.html')) add(path.join(root,name));
  for (const dir of ['pubblicazioni','rassegna']) for(const file of htmlFiles(path.join(root,dir))) add(file);
  const destination = `${ORIGIN}/articoli/${TARGET}/`;
  if(!urls.has(destination)) throw Error('SEO redirect target not published');
  for(const alias of ALIASES) {
    const file=path.join(root,'articoli',alias,'index.html');
    if(fs.existsSync(file) && !/http-equiv=["']refresh["']/i.test(fs.readFileSync(file,'utf8'))) throw Error('SEO refusing to overwrite content: '+file);
    // Static Pages: instant meta refresh is permanent for Google, NOT HTTP 301.
    const html=`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Articolo trasferito — COINSIEME</title>
<link rel="canonical" href="${escape(destination)}">
<meta http-equiv="refresh" content="0;url=${escape(destination)}">
</head><body><p>L’articolo è disponibile al suo indirizzo definitivo: <a href="${escape(destination)}">Invalidità civile e Legge 104</a>.</p></body></html>
`;
    fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,html);
  }
  // Omit optional lastmod: publication dates, migration defaults and filesystem
  // timestamps do not establish a reliable date of substantive modification.
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...urls].sort().map(url=>`  <url><loc>${escape(url)}</loc></url>`).join('\n')+'\n</urlset>\n';
  fs.writeFileSync(path.join(root,'sitemap.xml'),xml);
  return {urls:urls.size, articles:articles.filter(a=>a.visible!==false).length, redirects:ALIASES.length};
}
module.exports={build,TARGET,ALIASES};
