/**
 * Sincronizzazione Rassegna News da Airtable
 * COINSIEME ETS — Flusso Editoriale "Cosa si muove intorno a noi"
 *
 * Scarica solo ed esclusivamente le notizie con stato "approvata" da Airtable,
 * valida i 10 campi dello schema editoriale e aggiorna content/rassegna/notizie-esterne.json
 * solo se ci sono differenze effettive.
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

function validateAndNormalizeRecord(fields, recordId = '') {
  const stato = (fields.stato || fields.Stato || '').trim();
  if (stato !== 'approvata') {
    return null; // Scarta categoricamente tutto ciò che non è approvata
  }

  const url_fonte = (fields.url_fonte || fields.Url_fonte || fields['URL Fonte'] || fields['url_fonte'] || fields.url || '').trim();
  if (!/^https?:\/\//i.test(url_fonte)) {
    console.warn(`[Sync Rassegna] Notizia "${fields.titolo_editoriale || fields.Titolo || recordId}" scartata: url_fonte non valido o mancante.`);
    return null;
  }

  const data_fonte = (fields.data_fonte || fields.Data_fonte || fields['Data Fonte'] || fields['data_fonte'] || fields.data || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_fonte)) {
    console.warn(`[Sync Rassegna] Notizia "${fields.titolo_editoriale || recordId}" scartata: data_fonte mancante o non valida.`);
    return null;
  }

  const fonte = (fields.fonte || fields.Fonte || '').trim();
  if (!fonte) {
    console.warn(`[Sync Rassegna] Notizia "${fields.titolo_editoriale || recordId}" scartata: fonte mancante.`);
    return null;
  }

  const titolo_editoriale = (fields.titolo_editoriale || fields['Titolo Editoriale'] || fields.titolo_originale || fields['Titolo Originale'] || fields.titolo || '').trim();
  if (!titolo_editoriale) {
    console.warn(`[Sync Rassegna] Notizia record "${recordId}" scartata: titolo mancante.`);
    return null;
  }

  const sintesi_editoriale = (fields.sintesi_editoriale || fields['Sintesi Editoriale'] || fields.sintesi || '').trim();
  if (!sintesi_editoriale) {
    console.warn(`[Sync Rassegna] Notizia "${titolo_editoriale}" scartata: sintesi_editoriale mancante.`);
    return null;
  }

  const id = (fields.id || fields.ID || '').trim() || `${slugify(fonte)}-${slugify(titolo_editoriale).slice(0, 30)}-${data_fonte}`;
  const categoria = (fields.categoria || fields.Categoria || 'Welfare e autonomia').trim();
  const titolo_originale = (fields.titolo_originale || fields['Titolo Originale'] || titolo_editoriale).trim();
  const rilevanza_coinsieme = (fields.rilevanza_coinsieme || fields['Rilevanza COINSIEME'] || fields['Rilevanza per COINSIEME'] || fields.rilevanza || '').trim();
  if (!rilevanza_coinsieme) {
    console.warn(`[Sync Rassegna] Notizia "${titolo_editoriale}" scartata: rilevanza_coinsieme mancante.`);
    return null;
  }

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
    stato: 'approvata'
  };
}

async function fetchFromAirtable(token, baseId, tableName) {
  let allRecords = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.set('filterByFormula', "OR({stato} = 'approvata', {Stato} = 'approvata')");
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

  // Normalizza e valida
  const validApproved = rawRecords
    .map((rec) => validateAndNormalizeRecord(rec.fields || rec, rec.id || ''))
    .filter(Boolean)
    .sort((a, b) => b.data_fonte.localeCompare(a.data_fonte));

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
