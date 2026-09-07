/**
 * Sincronizzazione Rassegna News da Airtable
 * COINSIEME ETS — Flusso Editoriale "Cosa si muove intorno a noi"
 *
 * Scarica tutte le notizie con stato "approvata" da Airtable,
 * valida e normalizza i campi con tolleranza sui nomi colonna e formati data,
 * ordina per data_fonte decrescente (e createdTime/id per pari data),
 * e aggiorna content/rassegna/notizie-esterne.json solo se ci sono differenze.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const rassegnaDir = path.join(root, 'content', 'rassegna');
const rassegnaFile = path.join(rassegnaDir, 'notizie-esterne.json');

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeDate(rawDate) {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return '';
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

function validateAndNormalizeRecord(fields, recordId = '', rawRecord = {}) {
  const stato = (fields.stato || fields.Stato || fields.STATO || '').trim().toLowerCase();
  if (stato !== 'approvata') {
    return null; // Scarta categoricamente tutto ciò che non è approvata
  }

  const url_fonte = (fields.url_fonte || fields.Url_fonte || fields['URL Fonte'] || fields['Url Fonte'] || fields['url_fonte'] || fields.url || fields.Url || fields.link || fields.Link || '').trim();
  if (!/^https?:\/\//i.test(url_fonte)) {
    console.warn(`[Sync Rassegna] Notizia "${fields.titolo_editoriale || fields.Titolo || recordId}" scartata: url_fonte non valido o mancante.`);
    return null;
  }

  const rawDate = fields.data_fonte || fields.Data_fonte || fields['Data Fonte'] || fields['data_fonte'] || fields.data || fields.Data || fields['Data pubblicazione'] || fields['data_pubblicazione'] || (rawRecord && rawRecord.createdTime);
  const data_fonte = normalizeDate(rawDate);
  if (!data_fonte) {
    console.warn(`[Sync Rassegna] Notizia "${fields.titolo_editoriale || recordId}" scartata: data_fonte mancante o non valida.`);
    return null;
  }

  let fonte = (fields.fonte || fields.Fonte || fields['Fonte'] || fields.source || fields.Source || '').trim();
  if (!fonte && url_fonte) {
    fonte = extractDomainName(url_fonte);
  }

  const titolo_editoriale = (fields.titolo_editoriale || fields['Titolo Editoriale'] || fields.titolo_originale || fields['Titolo Originale'] || fields.titolo || fields.Titolo || fields.Title || fields.title || '').trim();
  if (!titolo_editoriale) {
    console.warn(`[Sync Rassegna] Notizia record "${recordId}" scartata: titolo mancante.`);
    return null;
  }

  let sintesi_editoriale = (fields.sintesi_editoriale || fields['Sintesi Editoriale'] || fields.sintesi || fields.Sintesi || fields.summary || fields.Summary || fields.descrizione || fields.Descrizione || '').trim();
  if (!sintesi_editoriale) {
    sintesi_editoriale = titolo_editoriale;
  }

  const id = (fields.id || fields.ID || '').trim() || `${slugify(fonte)}-${slugify(titolo_editoriale).slice(0, 30)}-${data_fonte}`;
  const categoria = (fields.categoria || fields.Categoria || fields['Categoria'] || 'Welfare e autonomia').trim();
  const titolo_originale = (fields.titolo_originale || fields['Titolo Originale'] || titolo_editoriale).trim();
  let rilevanza_coinsieme = (fields.rilevanza_coinsieme || fields['Rilevanza COINSIEME'] || fields['Rilevanza per COINSIEME'] || fields['Rilevanza'] || fields.rilevanza || fields.note || fields.Note || '').trim();
  if (!rilevanza_coinsieme) {
    rilevanza_coinsieme = "Rilevante per l'osservatorio e il contesto di COINSIEME.";
  }

  const createdTime = (rawRecord && rawRecord.createdTime) ? String(rawRecord.createdTime) : '';

  return {
    id,
    categoria,
    data_fonte,
    titolo_originale,
    titolo_editoriale,
    fonte,
    url_fonte,
    sintesi_editoriale,
    rilevanza_coinsieme,
    stato: 'approvata',
    createdTime
  };
}

async function fetchFromAirtable(token, baseId, tableName) {
  let allRecords = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.set('filterByFormula', "OR(LOWER({stato}) = 'approvata', LOWER({Stato}) = 'approvata')");
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Sync Rassegna] Query con formula fallita (${res.status}): ${errText}. Tento lettura completa tabella...`);
      const fallbackUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}${offset ? `?offset=${offset}` : ''}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!fallbackRes.ok) {
        throw new Error(`Errore API Airtable (${fallbackRes.status} ${fallbackRes.statusText})`);
      }
      const data = await fallbackRes.json();
      if (Array.isArray(data.records)) {
        allRecords = allRecords.concat(data.records);
      }
      offset = data.offset || null;
      continue;
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      allRecords = allRecords.concat(data.records);
    }
    offset = data.offset || null;
  } while (offset);

  return allRecords;
}

async function syncRassegna(options = {}) {
  const token = options.token || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;
  const tableName = options.tableName || process.env.AIRTABLE_TABLE_NAME || 'Notizie';

  let rawRecords = [];

  if (options.mockRecords) {
    rawRecords = options.mockRecords;
  } else {
    if (!token || !baseId) {
      console.error('ERRORE: AIRTABLE_PERSONAL_ACCESS_TOKEN e AIRTABLE_BASE_ID sono obbligatori.');
      console.error('Configura i GitHub Secrets nel repository prima di eseguire la sincronizzazione.');
      process.exit(1);
    }
    console.log(`[Sync Rassegna] Interrogazione Airtable (Base: ${baseId}, Tabella: ${tableName})...`);
    rawRecords = await fetchFromAirtable(token, baseId, tableName);
  }

  // Normalizza, valida e ordina rigorosamente per data decrescente e createdTime per parità
  const validApproved = rawRecords
    .map((rec) => validateAndNormalizeRecord(rec.fields || rec, rec.id || '', rec))
    .filter(Boolean)
    .sort((a, b) => {
      const dateDiff = (b.data_fonte || '').localeCompare(a.data_fonte || '');
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = (b.createdTime || '').localeCompare(a.createdTime || '');
      if (timeDiff !== 0) return timeDiff;
      return (a.id || '').localeCompare(b.id || '');
    })
    .map(item => {
      // Clean createdTime helper before writing JSON
      const { createdTime, ...cleanItem } = item;
      return cleanItem;
    });

  console.log(`[Sync Rassegna] Notizie approvate e verificate trovate: ${validApproved.length}`);

  // Verifica esistente
  let existingContent = '';
  if (fs.existsSync(rassegnaFile)) {
    existingContent = fs.readFileSync(rassegnaFile, 'utf8').trim();
  }

  const newContent = JSON.stringify(validApproved, null, 2);

  if (existingContent === newContent) {
    console.log('[Sync Rassegna] Nessuna variazione rispetto al file locale. Operazione completata (0 modifiche).');
    return { changed: false, count: validApproved.length };
  }

  if (!fs.existsSync(rassegnaDir)) {
    fs.mkdirSync(rassegnaDir, { recursive: true });
  }

  fs.writeFileSync(rassegnaFile, newContent + '\n', 'utf8');
  console.log(`[Sync Rassegna] Aggiornato con successo ${rassegnaFile} (${validApproved.length} notizie approvate).`);
  return { changed: true, count: validApproved.length };
}

// Esecuzione diretta se invocato da riga di comando
if (require.main === module) {
  syncRassegna().catch((err) => {
    console.error('[Sync Rassegna] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = { syncRassegna, validateAndNormalizeRecord };
