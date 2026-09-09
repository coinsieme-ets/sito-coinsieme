/**
 * Raccolta Automatica Notizie Candidate da Feed RSS Autorevoli
 * Fondazione COINSIEME ETS — Rassegna Stampa "Cosa si muove intorno a noi"
 *
 * Fonti monitorate:
 * 1. Vita.it
 * 2. Forum Nazionale del Terzo Settore
 *
 * Funzionalità:
 * - Scarica i feed RSS;
 * - Filtra gli articoli pertinenti all'osservatorio COINSIEME (disabilità, welfare, autonomia, cura, terzo settore, inclusione);
 * - Estrae metadati completi (inclusa og:image e sintesi);
 * - Assegna categoria tematica e bozza di rilevanza editoriale;
 * - Previene duplicati e inserisce le nuove proposte in Airtable tramite ingestCandidates().
 */

const fs = require('fs');
const path = require('path');
const { ingestCandidates } = require('./ingest-rassegna-candidates');

const root = path.resolve(__dirname, '..');
const candidatesJsonPath = path.join(root, 'content', 'rassegna', 'candidati-in-attesa.json');

const RSS_FEEDS = [
  {
    name: 'Vita.it',
    url: 'https://www.vita.it/feed/',
    defaultCategory: 'Welfare e Terzo Settore'
  },
  {
    name: 'Forum Terzo Settore',
    url: 'https://www.forumterzosettore.it/feed/',
    defaultCategory: 'Terzo Settore e Normativa'
  }
];

const RELEVANCE_KEYWORDS = [
  'disabil', 'welfare', 'terzo settore', 'cooperat', 'cooperaz', 'autonomia',
  'caregiver', 'inclusi', 'anzian', 'fragil', 'abitare', 'casa', 'cura',
  'progetto di vita', 'assistenz', 'accessib', 'domotica', 'formazione',
  'orientamento', 'sostegn', 'sanit', 'sociosanitar', 'minori', 'comunit'
];

function cleanHtmlText(text = '') {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch (e) {}
  return new Date().toISOString().slice(0, 10);
}

function isRelevantArticle(title = '', desc = '', category = '') {
  const combined = `${title} ${desc} ${category}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some(kw => combined.includes(kw));
}

function mapToCategory(title = '', desc = '', sourceCategory = '') {
  const t = `${title} ${desc} ${sourceCategory}`.toLowerCase();
  if (/domotic|tecnolog|software|digitale/i.test(t)) return 'Domotica & Tecnologia';
  if (/lavoro|scuola|occupaz|formazione|capacit/i.test(t)) return 'Lavoro e inclusione';
  if (/ricerca|duchenne|malatt|genet/i.test(t)) return 'Disabilità & Ricerca';
  if (/cooperaz|coop/i.test(t)) return 'Cooperazione sociale';
  if (/legge|decreto|riforma|inps|normativa|governo|istituzion/i.test(t)) return 'Riforma disabilita';
  if (/caregiver|cura|anzian|famigli|abitare|casa|vulnerab/i.test(t)) return 'Welfare e cura';
  return 'Welfare e autonomia';
}

function generateRilevanzaText(title = '', category = '', source = '') {
  return `Notizia selezionata dall'osservatorio COINSIEME da ${source} per il tema "${category}". Rilevante per l'orientamento, i servizi territoriali e la costruzione di reti comunitarie.`;
}

async function fetchArticleOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return '';
    const html = await res.text();
    const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    if (ogMatch && /^https?:\/\//i.test(ogMatch[1])) {
      return ogMatch[1].trim();
    }
  } catch (e) {}
  return '';
}

async function fetchCandidatesFromRss() {
  console.log('=== [RSS Crawler] Inizio scansione feed autorevoli ===');
  const candidates = [];

  for (const feed of RSS_FEEDS) {
    console.log(`\n[RSS Crawler] Scansione: ${feed.name} (${feed.url})...`);
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!res.ok) {
        console.warn(`  ✗ Errore download feed ${feed.name}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      console.log(`  ✓ Trovati ${itemMatches.length} elementi nel feed.`);

      for (const itemXml of itemMatches) {
        const rawTitle = (itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1] || '';
        const title = cleanHtmlText(rawTitle);
        const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || [];
        const link = (linkMatch[1] || '').trim();
        const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i) || [];
        const data_fonte = parseRssDate(pubDateMatch[1]);
        const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) || [];
        const summary = cleanHtmlText(descMatch[1] || title);
        const catMatch = itemXml.match(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i) || [];
        const rawCat = cleanHtmlText(catMatch[1] || '');

        if (!title || !link || !/^https?:\/\//i.test(link)) continue;

        // Filtro pertinenza
        if (!isRelevantArticle(title, summary, rawCat)) {
          continue;
        }

        const categoria = mapToCategory(title, summary, rawCat);
        const rilevanza_coinsieme = generateRilevanzaText(title, categoria, feed.name);

        candidates.push({
          titolo_originale: title,
          titolo_editoriale: title,
          fonte: feed.name,
          url_fonte: link,
          data_fonte,
          categoria,
          sintesi_editoriale: summary.length > 300 ? summary.slice(0, 297) + '...' : summary,
          rilevanza_coinsieme,
          rawLink: link
        });
      }
    } catch (err) {
      console.error(`  ✗ Errore scansione ${feed.name}: ${err.message}`);
    }
  }

  console.log(`\n[RSS Crawler] Totale articoli pertinenti selezionati: ${candidates.length}`);

  // Recupera immagini og:image per i candidati
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    console.log(`  [${i + 1}/${candidates.length}] Ricerca immagine per: "${c.titolo_editoriale}"...`);
    const ogImg = await fetchArticleOgImage(c.url_fonte);
    if (ogImg) {
      c.immagine_news = ogImg;
    }
    delete c.rawLink;
  }

  return candidates;
}

async function main() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Notizie';

  const candidates = await fetchCandidatesFromRss();

  if (candidates.length === 0) {
    console.log('[RSS Crawler] Nessun candidato pertinente da elaborare.');
    return;
  }

  // Salva comunque il file candidati in content/rassegna per tracciabilità
  const rassegnaDir = path.dirname(candidatesJsonPath);
  if (!fs.existsSync(rassegnaDir)) {
    fs.mkdirSync(rassegnaDir, { recursive: true });
  }
  fs.writeFileSync(candidatesJsonPath, JSON.stringify(candidates, null, 2) + '\n', 'utf8');
  console.log(`[RSS Crawler] Salvati ${candidates.length} candidati in: ${candidatesJsonPath}`);

  // Se i token Airtable sono disponibili, esegue l'ingestione diretta
  if (token && baseId) {
    console.log('[RSS Crawler] Token Airtable presenti: avvio ingestione candidati su Airtable...');
    await ingestCandidates({
      token,
      baseId,
      tableName,
      candidates
    });
  } else {
    console.log('[RSS Crawler] Token Airtable non configurati in locale: esecuzione in modalità DRY RUN.');
    await ingestCandidates({
      dryRun: true,
      candidates
    });
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[RSS Crawler] ERRORE:', err);
    process.exit(1);
  });
}

module.exports = { fetchCandidatesFromRss, main };
