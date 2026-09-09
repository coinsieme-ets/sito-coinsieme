/**
 * Sincronizzazione Rassegna News da Airtable con Regia Editoriale Avanzata
 * COINSIEME ETS — Rassegna Stampa & Homepage
 *
 * Supporta i nuovi campi e stati editoriali:
 * - stato: 'segnalata' | 'da_valutare' | 'approvata' | 'pubblica' | 'pubblicata' | 'scartata'
 * - priorita: 'alta' | 'media' | 'bassa'
 * - posizione_sito: 'home_principale' | 'home_evidenza' | 'home_normale' | 'solo_rassegna'
 * - ordine_editoriale: numero intero (valori più bassi hanno precedenza)
 * - mantieni_in_evidenza_fino_al: data/ora limite fino alla quale la notizia è fissata
 * - immagine_in_evidenza: attachment / url dedicato
 * - data_pubblicazione: data/ora effettiva o programmata
 *
 * Dopo il download con successo, aggiorna lo stato su Airtable da 'pubblica' a 'pubblicata'.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const rassegnaDir = path.join(root, 'content', 'rassegna');
const rassegnaFile = path.join(rassegnaDir, 'notizie-esterne.json');

const ALLOWED_PUBLISH_STATI = new Set(['pubblica', 'pubblicata', 'approvata']);

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

function extractImageUrl(fieldValue) {
  if (!fieldValue) return '';
  if (typeof fieldValue === 'string') return fieldValue.trim();
  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    if (fieldValue[0] && fieldValue[0].url) return fieldValue[0].url.trim();
    if (typeof fieldValue[0] === 'string') return fieldValue[0].trim();
  }
  return '';
}

function parseOrderNumber(val, defaultVal = 999) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = parseInt(val.trim(), 10);
    if (!isNaN(n)) return n;
  }
  return defaultVal;
}

function normalizePosition(val) {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'home_principale' || s === 'principale' || s === 'hero') return 'home_principale';
  if (s === 'home_evidenza' || s === 'evidenza' || s === 'focus') return 'home_evidenza';
  if (s === 'solo_rassegna' || s === 'rassegna' || s === 'archivio') return 'solo_rassegna';
  return 'home_normale';
}

function normalizePriority(val) {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'alta' || s === 'high' || s === '1') return 'alta';
  if (s === 'bassa' || s === 'low' || s === '3') return 'bassa';
  return 'media';
}

function validateAndNormalizeRecord(fields, recordId = '', rawRecord = {}) {
  const rawStato = (fields.stato || fields.Stato || fields.STATO || '').trim().toLowerCase();
  if (!ALLOWED_PUBLISH_STATI.has(rawStato)) {
    return null; // Solo pubblica, pubblicata e approvata vanno online
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

  const rawPubDate = fields.data_pubblicazione || fields['Data Pubblicazione'] || fields.data_pub || rawDate;
  const data_pubblicazione = normalizeDate(rawPubDate) || data_fonte;

  // Programmazione futura: non pubblicare se la data di pubblicazione è posteriore a oggi
  const todayIso = new Date().toISOString().slice(0, 10);
  if (data_pubblicazione > todayIso) {
    console.log(`[Sync Rassegna] Notizia "${fields.titolo_editoriale || recordId}" posticipata: programmata per il ${data_pubblicazione}.`);
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

  const rawImg = fields.immagine_in_evidenza || fields['Immagine in evidenza'] || fields['Immagine in Evidenza'] || fields.immagine_news || fields['Immagine News'] || fields.image_url || fields['Image URL'] || fields.thumbnail || fields.Thumbnail || fields.immagine || fields.Immagine || fields.image || fields.Image;
  const immagine_in_evidenza = extractImageUrl(rawImg);

  const priorita = normalizePriority(fields.priorita || fields.Priorita || fields.Priority || fields.priority);
  const posizione_sito = normalizePosition(fields.posizione_sito || fields['Posizione Sito'] || fields.Posizione || fields.posizione);
  const ordine_editoriale = parseOrderNumber(fields.ordine_editoriale || fields['Ordine Editoriale'] || fields.ordine || fields.Ordine, 999);
  const rawPinnedUntil = fields.mantieni_in_evidenza_fino_al || fields['Mantieni in evidenza fino al'] || fields['mantieni_in_evidenza_fino_al'] || '';
  const mantieni_in_evidenza_fino_al = normalizeDate(rawPinnedUntil);

  const createdTime = (rawRecord && rawRecord.createdTime) ? String(rawRecord.createdTime) : '';
  const airtableRecordId = rawRecord && rawRecord.id ? String(rawRecord.id) : (fields.recordId || '');

  return {
    id,
    categoria,
    data_fonte,
    data_pubblicazione,
    titolo_originale,
    titolo_editoriale,
    fonte,
    url_fonte,
    sintesi_editoriale,
    rilevanza_coinsieme,
    immagine_in_evidenza,
    immagine_news: immagine_in_evidenza, // retrocompatibilità
    stato: 'pubblicata',
    priorita,
    posizione_sito,
    ordine_editoriale,
    mantieni_in_evidenza_fino_al,
    createdTime,
    airtableRecordId,
    originalStato: rawStato
  };
}

/**
 * Ordinamento Gerarchico Editoriale:
 * 1. Posizione sito (home_principale -> home_evidenza -> home_normale -> solo_rassegna)
 * 2. Pin attivo (mantieni_in_evidenza_fino_al >= today)
 * 3. Ordine editoriale manuale (1 prima di 2, ecc.)
 * 4. Priorità editoriale (alta -> media -> bassa)
 * 5. Data pubblicazione / data fonte (decrescente)
 * 6. ID stabile
 */
function sortEditorialRecords(records) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const posWeight = {
    'home_principale': 1,
    'home_evidenza': 2,
    'home_normale': 3,
    'solo_rassegna': 4
  };

  const prioWeight = {
    'alta': 1,
    'media': 2,
    'bassa': 3
  };

  return [...records].sort((a, b) => {
    // 1. Posizione sito
    const posA = posWeight[a.posizione_sito] || 3;
    const posB = posWeight[b.posizione_sito] || 3;
    if (posA !== posB) return posA - posB;

    // 2. Pin attivo (se mantieni_in_evidenza_fino_al è impostato e >= oggi per le posizioni home)
    const aIsPinned = (a.mantieni_in_evidenza_fino_al && a.mantieni_in_evidenza_fino_al >= todayIso && (a.posizione_sito === 'home_principale' || a.posizione_sito === 'home_evidenza')) ? 0 : 1;
    const bIsPinned = (b.mantieni_in_evidenza_fino_al && b.mantieni_in_evidenza_fino_al >= todayIso && (b.posizione_sito === 'home_principale' || b.posizione_sito === 'home_evidenza')) ? 0 : 1;
    if (aIsPinned !== bIsPinned) return aIsPinned - bIsPinned;

    // 3. Ordine editoriale manuale (1 prima di 2, ecc.)
    const ordA = typeof a.ordine_editoriale === 'number' ? a.ordine_editoriale : 999;
    const ordB = typeof b.ordine_editoriale === 'number' ? b.ordine_editoriale : 999;
    if (ordA !== ordB) return ordA - ordB;

    // 4. Priorità editoriale (alta prima di media prima di bassa)
    const pA = prioWeight[a.priorita] || 2;
    const pB = prioWeight[b.priorita] || 2;
    if (pA !== pB) return pA - pB;

    // 5. Data pubblicazione o data fonte decrescente
    const dateA = a.data_pubblicazione || a.data_fonte || '';
    const dateB = b.data_pubblicazione || b.data_fonte || '';
    const dateDiff = dateB.localeCompare(dateA);
    if (dateDiff !== 0) return dateDiff;

    // 6. CreatedTime Airtable o ID
    const timeDiff = (b.createdTime || '').localeCompare(a.createdTime || '');
    if (timeDiff !== 0) return timeDiff;

    return (a.id || '').localeCompare(b.id || '');
  });
}

async function fetchFromAirtable(token, baseId, tableName) {
  let allRecords = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.set('filterByFormula', "OR(LOWER({stato}) = 'pubblica', LOWER({stato}) = 'pubblicata', LOWER({stato}) = 'approvata', LOWER({Stato}) = 'pubblica', LOWER({Stato}) = 'pubblicata', LOWER({Stato}) = 'approvata')");
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

async function markRecordsAsPublishedOnAirtable(token, baseId, tableName, records) {
  const toUpdate = records.filter(r => r.originalStato === 'pubblica' && r.airtableRecordId);
  if (toUpdate.length === 0) return;

  console.log(`[Sync Rassegna] Aggiornamento stato su Airtable da 'pubblica' a 'pubblicata' per ${toUpdate.length} record...`);

  const BATCH_SIZE = 10;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const body = {
      records: chunk.map(r => ({
        id: r.airtableRecordId,
        fields: {
          stato: 'pubblicata'
        }
      }))
    };

    try {
      const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        console.log(`  ✓ Aggiornati ${chunk.length} record in 'pubblicata'.`);
      } else {
        const err = await res.text();
        console.warn(`  ✗ Errore PATCH Airtable: ${err}`);
      }
    } catch (e) {
      console.warn(`  ✗ Eccezione PATCH Airtable: ${e.message}`);
    }
  }
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
      console.log('[Sync Rassegna] Token o Base ID mancanti in ambiente locale. Utilizzo dataset locale esistente.');
      return { changed: false, count: 0 };
    }
    console.log(`[Sync Rassegna] Interrogazione Airtable (Base: ${baseId}, Tabella: ${tableName})...`);
    rawRecords = await fetchFromAirtable(token, baseId, tableName);
  }

  // Normalizza, valida e filtra
  const validRecords = rawRecords
    .map((rec) => validateAndNormalizeRecord(rec.fields || rec, rec.id || '', rec))
    .filter(Boolean);

  // Ordina secondo la gerarchia a 5 livelli
  const sorted = sortEditorialRecords(validRecords);

  // Pulisci i campi interni helper
  const cleanResults = sorted.map(item => {
    const { createdTime, airtableRecordId, originalStato, ...cleanItem } = item;
    return cleanItem;
  });

  console.log(`[Sync Rassegna] Notizie pubblicabili conformi al nuovo schema: ${cleanResults.length}`);

  // Se siamo collegati ad Airtable, aggiorna lo stato dei record da 'pubblica' a 'pubblicata'
  if (token && baseId && !options.mockRecords) {
    await markRecordsAsPublishedOnAirtable(token, baseId, tableName, sorted);
  }

  // Verifica se ci sono variazioni rispetto al file locale
  let existingContent = '';
  if (fs.existsSync(rassegnaFile)) {
    existingContent = fs.readFileSync(rassegnaFile, 'utf8').trim();
  }

  const newContent = JSON.stringify(cleanResults, null, 2);

  if (existingContent === newContent) {
    console.log('[Sync Rassegna] Nessuna variazione rispetto al file locale. Operazione completata (0 modifiche).');
    return { changed: false, count: cleanResults.length, records: cleanResults };
  }

  if (!fs.existsSync(rassegnaDir)) {
    fs.mkdirSync(rassegnaDir, { recursive: true });
  }

  fs.writeFileSync(rassegnaFile, newContent + '\n', 'utf8');
  console.log(`[Sync Rassegna] Aggiornato con successo ${rassegnaFile} (${cleanResults.length} notizie registrate).`);
  return { changed: true, count: cleanResults.length, records: cleanResults };
}

if (require.main === module) {
  syncRassegna().catch((err) => {
    console.error('[Sync Rassegna] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = { syncRassegna, validateAndNormalizeRecord, sortEditorialRecords };
