'use strict';
const PAGES = ['https://www.coinsieme.it/', 'https://www.coinsieme.it/articoli.html'];
function decode(s = '') {
  return String(s).replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
    .replace(/&(amp|quot|apos|lt|gt|nbsp|agrave|egrave|eacute|igrave|ograve|ugrave);/gi,
      (_, n) => ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',agrave:'à',egrave:'è',eacute:'é',igrave:'ì',ograve:'ò',ugrave:'ù'})[n.toLowerCase()]);
}
function sourceUrl(s = '') {
  const match = decode(s).match(/https?:\/\/[^\s<>"]+/i);
  if (!match) return '';
  try { const u = new URL(match[0]); u.hash = ''; return u.href; } catch { return ''; }
}
function title(s = '') { return decode(String(s).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim(); }
function visibleHtml(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(section|article|div)\b[^>]*(?:aria-hidden=["']true["']|\shidden(?:\s|=|>)|display\s*:\s*none)[^>]*>[\s\S]*?<\/\1>/gi, '');
}
function inspectPage(html, source, expectedTitle) {
  const clean = visibleHtml(html);
  const headings = [...clean.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  for (const heading of headings) {
    for (const link of heading[1].matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      if (sourceUrl(link[1]) === sourceUrl(source) && title(link[2]) === title(expectedTitle) && title(expectedTitle)) return true;
    }
  }
  return false;
}
async function fetchPublicPages(fetcher = fetch) {
  const pages = [];
  for (const url of PAGES) {
    const res = await fetcher(url, {headers: {'Cache-Control': 'no-cache'}, signal: AbortSignal.timeout(30000)});
    if (!res.ok) throw new Error('Verifica sito inconclusiva: HTTP ' + res.status + ' ' + url);
    const html = await res.text();
    if (!html.includes('</html>') || !html.includes('COINSIEME') ||
        (url === PAGES[0] && !html.includes('CMS_RASSEGNA_SECTION_END')) ||
        (url === PAGES[1] && !html.includes('archivio'))) throw new Error('Struttura sito inattesa: ' + url);
    pages.push({url, status: res.status, html});
  }
  return pages;
}
function verifyPublication(pages, news) {
  const page = pages.find(p => inspectPage(p.html, news.url_fonte, news.titolo_editoriale));
  return {online: Boolean(page), publicUrl: page ? page.url : null};
}
function correctionFields(fields, evidence) {
  if (!evidence.online) return {stato: 'da_pubblicare', data_pubblicazione: null, url_pubblicato: null};
  return {stato: 'pubblicato', url_pubblicato: evidence.publicUrl};
}
module.exports = {PAGES, sourceUrl, title, inspectPage, fetchPublicPages, verifyPublication, correctionFields};
