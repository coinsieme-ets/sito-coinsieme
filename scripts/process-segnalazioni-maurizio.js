/**
 * Elaborazione Automatica e Pubblicazione Diretta Segnalazioni di Maurizio
 * Fondazione COINSIEME ETS — Rassegna News "Cosa si muove intorno a noi"
 *
 * DEROGA EDITORIALE:
 * Quando Maurizio inserisce direttamente un link nella tabella "Segnalazioni Maurizio",
 * si tratta di una sua scelta editoriale diretta.
 * Il sistema:
 * 1. Estrae automaticamente i metadati dal link (titolo, sintesi, fonte, data);
 * 2. Compila la scheda completa;
 * 3. Inserisce la notizia nella tabella "Notizie" direttamente con stato "approvata";
 * 4. Aggiorna lo stato della segnalazione in "pubblicata";
 * 5. Avvia la pubblicazione sul sito senza richiedere ulteriori passaggi di approvazione.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function cleanHtmlText(html = '') {
  return String(html)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDomainName(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return host;
  } catch (e) {
    return 'Fonte esterna';
  }
}

async function fetchMetadataFromUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!res.ok) {
      console.warn(`[Segnalazioni] Impossibile scaricare URL (${res.status}): ${url}`);
      return fallbackMetadata(url);
    }

    const html = await res.text();

    // 1. Titolo
    let title = '';
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitle) title = ogTitle[1];
    if (!title) {
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTag) title = titleTag[1];
    }
    title = cleanHtmlText(title || 'Notizia segnalata');

    // 2. Sintesi / Descrizione
    let summary = '';
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (ogDesc) summary = ogDesc[1];
    summary = cleanHtmlText(summary || `Aggiornamento e approfondimento segnalato da Maurizio su ${title}.`);

    // 3. Fonte
    let source = '';
    const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSite) source = cleanHtmlText(ogSite[1]);
    if (!source) source = extractDomainName(url);

    // 4. Data
    let dateStr = '';
    const ogTime = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i);
    if (ogTime && /^\d{4}-\d{2}-\d{2}/.test(ogTime[1])) {
      dateStr = ogTime[1].slice(0, 10);
    }
    if (!dateStr) {
      // Cerca data nell'URL (es. /2026/09/04/)
      const urlDate = url.match(/\b(202[4-9])\/(\d{2})\/(\d{2})\b/) || url.match(/\b(202[4-9])-(\d{2})-(\d{2})\b/);
      if (urlDate) {
        dateStr = `${urlDate[1]}-${urlDate[2]}-${urlDate[3]}`;
      }
    }
    if (!dateStr) {
      dateStr = new Date().toISOString().slice(0, 10);
    }

    return {
      title,
      summary,
      source,
      date: dateStr
    };
  } catch (err) {
    console.warn(`[Segnalazioni] Errore lettura metadati per ${url}: ${err.message}`);
    return fallbackMetadata(url);
  }
}

function fallbackMetadata(url) {
  const domain = extractDomainName(url);
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: `Aggiornamento da ${domain}`,
    summary: `Segnalazione diretta di approfondimento su ${domain}.`,
    source: domain,
    date: today
  };
}

async function fetchSegnalazioniDaPubblicare(token, baseId, tableName = 'Segnalazioni Maurizio') {
  try {
    const params = new URLSearchParams();
    params.set('filterByFormula', "OR({stato} = 'da_valutare', {stato} = '', {Stato} = 'da_valutare', {stato} = 'da_pubblicare')");
    params.set('pageSize', '50');

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Segnalazioni] Tabella "${tableName}" non raggiungibile (${res.status}): ${errText}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data.records) ? data.records : [];
  } catch (e) {
    return [];
  }
}

async function updateSegnalazioneStato(token, baseId, tableName, recordId, newStato) {
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          stato: newStato
        }
      })
    });
  } catch (e) {
    // silent
  }
}

async function insertIntoNotizie(token, baseId, tableName, recordFields) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [{ fields: recordFields }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore inserimento notizia approvata in Airtable (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.records && data.records[0];
}

async function processSegnalazioniMaurizio(options = {}) {
  const token = options.token || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;
  const segnalazioniTable = options.segnalazioniTable || 'Segnalazioni Maurizio';
  const notizieTable = options.notizieTable || process.env.AIRTABLE_TABLE_NAME || 'Notizie';

  console.log('[Segnalazioni Maurizio] Controllo nuove segnalazioni da pubblicare direttamente...');

  let rawSegnalazioni = [];
  if (options.mockSegnalazioni) {
    rawSegnalazioni = options.mockSegnalazioni;
  } else {
    if (!token || !baseId) {
      console.log('[Segnalazioni Maurizio] Token o Base ID mancanti. Operazione terminata.');
      return { processed: 0 };
    }
    rawSegnalazioni = await fetchSegnalazioniDaPubblicare(token, baseId, segnalazioniTable);
  }

  if (rawSegnalazioni.length === 0) {
    console.log('[Segnalazioni Maurizio] Nessuna nuova segnalazione in attesa.');
    return { processed: 0 };
  }

  console.log(`[Segnalazioni Maurizio] Trovate ${rawSegnalazioni.length} segnalazioni da elaborare per pubblicazione diretta.`);

  const processedRecords = [];

  for (const seg of rawSegnalazioni) {
    const f = seg.fields || seg;
    const rawUrl = (f.url_articolo || f.url || '').trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      console.warn(`  - Segnalazione record ${seg.id || ''} ignorata: URL non valido (${rawUrl})`);
      continue;
    }

    const nota = (f.nota || f.note || '').trim();
    const categoria = (f.categoria || 'Welfare e autonomia').trim();

    console.log(`  - Elaborazione link di Maurizio: ${rawUrl} ...`);
    const meta = await fetchMetadataFromUrl(rawUrl);

    const dataFonte = meta.date;
    const titoloEditoriale = meta.title;
    const titoloOriginale = meta.title;
    const fonte = meta.source;
    const sintesi = meta.summary;
    const rilevanza = nota ? `Segnalato da Maurizio: ${nota}` : `Segnalazione diretta di Maurizio per la rassegna COINSIEME.`;

    const id = `${slugify(fonte)}-${slugify(titoloEditoriale).slice(0, 30)}-${dataFonte}`;

    const notiziaApprovata = {
      id,
      categoria,
      data_fonte: dataFonte,
      titolo_originale: titoloOriginale,
      titolo_editoriale: titoloEditoriale,
      fonte,
      url_fonte: rawUrl,
      sintesi_editoriale: sintesi,
      rilevanza_coinsieme: rilevanza,
      stato: 'approvata' // DEROGA ESPLICITA: Pubblicazione diretta perché inserita da Maurizio
    };

    if (options.mock) {
      console.log(`    [MOCK] Notizia creata come APPROVATA: "${titoloEditoriale}" (${fonte})`);
      processedRecords.push(notiziaApprovata);
      continue;
    }

    try {
      await insertIntoNotizie(token, baseId, notizieTable, notiziaApprovata);
      await updateSegnalazioneStato(token, baseId, segnalazioniTable, seg.id, 'pubblicata');
      console.log(`    ✓ Notizia inserita in "${notizieTable}" come APPROVATA ed impostata come pubblicata in "${segnalazioniTable}".`);
      processedRecords.push(notiziaApprovata);
    } catch (err) {
      console.error(`    ✗ Errore salvataggio notizia per ${rawUrl}: ${err.message}`);
    }
  }

  console.log(`[Segnalazioni Maurizio] Completata elaborazione: ${processedRecords.length} notizie pubblicate direttamente.`);
  return { processed: processedRecords.length, records: processedRecords };
}

if (require.main === module) {
  processSegnalazioniMaurizio().catch((err) => {
    console.error('[Segnalazioni Maurizio] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = {
  processSegnalazioniMaurizio,
  fetchMetadataFromUrl,
  extractDomainName
};
