/**
 * Ingestione Automatica Notizie Candidate in Airtable
 * Fondazione COINSIEME ETS — Rassegna News "Cosa si muove intorno a noi"
 *
 * Scopo: Inserisce in Airtable le notizie candidate con tutti i 10 campi già compilati,
 * impostando lo stato a "proposta" (se completa di tutti i campi obbligatori) oppure
 * "da_verificare" (se incompleta o priva di fonti/date certe).
 *
 * Maurizio da iPhone deve solo:
 * 1. Leggere la notizia nella mail o nella vista Airtable "Briefing Oggi";
 * 2. Cliccare eventualmente sul link della fonte per approfondire;
 * 3. Modificare lo stato in "approvata" o "scartata".
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const defaultCandidatesFile = path.join(root, 'content', 'rassegna', 'candidati-in-attesa.json');

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function validateAndEnrichCandidate(item, index = 0) {
  const issues = [];

  const rawTitoloOriginale = (item.titolo_originale || item.titolo || '').trim();
  const rawTitoloEditoriale = (item.titolo_editoriale || item.titolo_originale || item.titolo || '').trim();
  const rawFonte = (item.fonte || '').trim();
  const rawUrlFonte = (item.url_fonte || item.url || '').trim();
  const rawDataFonte = (item.data_fonte || item.data || '').trim().slice(0, 10);
  const rawCategoria = (item.categoria || 'Welfare e Terzo Settore').trim();
  const rawSintesi = (item.sintesi_editoriale || item.sintesi || '').trim();
  const rawRilevanza = (item.rilevanza_coinsieme || item.rilevanza || '').trim();

  if (!rawTitoloEditoriale) issues.push('titolo_editoriale mancante');
  if (!rawFonte) issues.push('fonte mancante');
  if (!rawUrlFonte || !/^https?:\/\//i.test(rawUrlFonte)) issues.push('url_fonte non valido o mancante');
  if (!rawDataFonte || !/^\d{4}-\d{2}-\d{2}$/.test(rawDataFonte)) issues.push('data_fonte non valida (richiesto YYYY-MM-DD)');
  if (!rawSintesi) issues.push('sintesi_editoriale mancante');
  if (!rawRilevanza) issues.push('rilevanza_coinsieme mancante');

  const id = (item.id || '').trim() || `${slugify(rawFonte || 'news')}-${slugify(rawTitoloEditoriale).slice(0, 30)}-${rawDataFonte || 'nodate'}`;

  // Se mancano campi obbligatori -> da_verificare. Se completa -> proposta (o stato specificato se valido)
  let stato = 'proposta';
  if (issues.length > 0) {
    stato = 'da_verificare';
  } else if (item.stato && ['proposta', 'da_verificare'].includes(item.stato.trim())) {
    stato = item.stato.trim();
  }

  return {
    record: {
      id,
      categoria: rawCategoria,
      data_fonte: rawDataFonte,
      titolo_originale: rawTitoloOriginale || rawTitoloEditoriale,
      titolo_editoriale: rawTitoloEditoriale,
      fonte: rawFonte,
      url_fonte: rawUrlFonte,
      sintesi_editoriale: rawSintesi,
      rilevanza_coinsieme: rawRilevanza,
      stato
    },
    isValid: issues.length === 0,
    issues
  };
}

async function fetchExistingAirtableUrls(token, baseId, tableName) {
  const existingUrls = new Set();
  const existingIds = new Set();
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.set('fields[]', 'url_fonte');
    params.set('fields[]', 'id');
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
      throw new Error(`Errore recupero record esistenti Airtable (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      for (const rec of data.records) {
        if (rec.fields?.url_fonte) existingUrls.add(rec.fields.url_fonte.trim().toLowerCase());
        if (rec.fields?.id) existingIds.add(rec.fields.id.trim().toLowerCase());
      }
    }
    offset = data.offset || null;
  } while (offset);

  return { existingUrls, existingIds };
}

async function createAirtableRecords(token, baseId, tableName, records) {
  const BATCH_SIZE = 10;
  const created = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const body = {
      records: chunk.map((fields) => ({ fields }))
    };

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Errore creazione batch Airtable (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      created.push(...data.records);
    }
  }

  return created;
}

async function ingestCandidates(options = {}) {
  const token = options.token || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;
  const tableName = options.tableName || process.env.AIRTABLE_TABLE_NAME || 'Notizie';
  const filePath = options.filePath || defaultCandidatesFile;
  const dryRun = options.dryRun || process.argv.includes('--dry-run');

  let rawCandidates = [];
  if (options.candidates && Array.isArray(options.candidates)) {
    rawCandidates = options.candidates;
  } else if (fs.existsSync(filePath)) {
    rawCandidates = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } else {
    console.log(`[Ingest Candidati] Nessun file candidati trovato in: ${filePath}`);
    return { ingested: 0, skipped: 0, total: 0 };
  }

  if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
    console.log('[Ingest Candidati] Nessuna notizia candidata da processare.');
    return { ingested: 0, skipped: 0, total: 0 };
  }

  console.log(`[Ingest Candidati] Elaborazione di ${rawCandidates.length} notizie candidate...`);

  // Validazione ed arricchimento
  const processed = rawCandidates.map((item, idx) => validateAndEnrichCandidate(item, idx));

  // Controllo duplicati
  let existingUrls = new Set();
  let existingIds = new Set();

  if (!dryRun && !options.mock) {
    if (!token || !baseId) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN e AIRTABLE_BASE_ID sono obbligatori.');
    }
    console.log(`[Ingest Candidati] Controllo duplicati su Airtable (Base: ${baseId}, Tabella: ${tableName})...`);
    const existing = await fetchExistingAirtableUrls(token, baseId, tableName);
    existingUrls = existing.existingUrls;
    existingIds = existing.existingIds;
  } else if (options.existingUrls || options.existingIds) {
    existingUrls = options.existingUrls || new Set();
    existingIds = options.existingIds || new Set();
  }

  const toInsert = [];
  let duplicateCount = 0;

  for (const { record, isValid, issues } of processed) {
    const urlKey = (record.url_fonte || '').toLowerCase();
    const idKey = (record.id || '').toLowerCase();

    if (existingUrls.has(urlKey) || existingIds.has(idKey)) {
      console.log(`  - [DUPLICATO IGNORATO] "${record.titolo_editoriale}" (${record.fonte})`);
      duplicateCount++;
      continue;
    }

    if (!isValid) {
      console.log(`  - [DA VERIFICARE (campi mancanti: ${issues.join(', ')})] "${record.titolo_editoriale || 'Senza titolo'}"`);
    } else {
      console.log(`  - [PRONTO COME PROPOSTA] "${record.titolo_editoriale}" (${record.fonte})`);
    }

    toInsert.push(record);
    existingUrls.add(urlKey);
    existingIds.add(idKey);
  }

  console.log(`[Ingest Candidati] Riepilogo: ${toInsert.length} nuovi record da inserire (${duplicateCount} duplicati esclusi).`);

  if (toInsert.length === 0) {
    console.log('[Ingest Candidati] Nessun nuovo record da caricare su Airtable.');
    return { ingested: 0, skipped: duplicateCount, total: rawCandidates.length };
  }

  if (dryRun || options.mock) {
    console.log('[Ingest Candidati - DRY RUN] Record pronti per Airtable (nessuna scrittura effettuata):');
    toInsert.forEach((r, i) => console.log(`    #${i + 1} [${r.stato.toUpperCase()}] ${r.titolo_editoriale} (${r.fonte})`));
    return { ingested: toInsert.length, skipped: duplicateCount, total: rawCandidates.length, records: toInsert };
  }

  console.log(`[Ingest Candidati] Inserimento in corso di ${toInsert.length} record in Airtable...`);
  const createdRecords = await createAirtableRecords(token, baseId, tableName, toInsert);
  console.log(`[Ingest Candidati] Operazione completata: ${createdRecords.length} record inseriti con successo in Airtable.`);

  return { ingested: createdRecords.length, skipped: duplicateCount, total: rawCandidates.length };
}

if (require.main === module) {
  ingestCandidates().catch((err) => {
    console.error('[Ingest Candidati] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = { ingestCandidates, validateAndEnrichCandidate };
