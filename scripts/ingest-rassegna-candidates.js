/**
 * Ingestione Automatica Notizie Candidate in Airtable con Protezione Duplicati
 * Fondazione COINSIEME ETS — Rassegna News "Cosa si muove intorno a noi"
 *
 * Regole di Governance Editoriale:
 * 1. Duplicato certo (stesso url_fonte o stesso id): notizia non creata (skip completo).
 * 2. Possibile duplicato editoriale (titolo simile ma URL diverso / fonte diversa):
 *    entra con stato "da_verificare" e nota esplicita in rilevanza_coinsieme.
 * 3. Aggiornamento sostanziale: proposto come "da_verificare" per revisione esplicita.
 * 4. Nessuna pubblicazione automatica: nessun candidato entra mai come "approvata".
 *    Lo stato iniziale è "proposta" solo se completo, verificato e non sospetto duplicato.
 *    Altrimenti è "da_verificare".
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const defaultCandidatesFile = path.join(root, 'content', 'rassegna', 'candidati-in-attesa.json');

const DUPLICATE_NOTE_PREFIX = 'Possibile duplicato editoriale: verificare se aggiorna una notizia già pubblicata.';

const STOP_WORDS_IT = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una',
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'd',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'e', 'ed', 'o', 'od', 'ma', 'anche', 'se', 'perche', 'come', 'quando',
  'che', 'chi', 'cui', 'quale', 'quali', 'quanto', 'quanti',
  'non', 'piu', 'meno', 'molto', 'poco', 'tutto', 'tutti',
  'verso', 'via', 'si', 'ha', 'hanno', 'e', 'sono', 'era', 'stato', 'stata',
  'progetto', 'nuovo', 'nuova', 'nuovi', 'nuove'
]);

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeUrl(rawUrl = '') {
  if (!rawUrl) return '';
  const cleanStr = String(rawUrl).trim();
  try {
    const parsed = new URL(cleanStr);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'].forEach(p => {
      parsed.searchParams.delete(p);
    });
    let normalized = parsed.origin.toLowerCase() + parsed.pathname.replace(/\/+$/, '').toLowerCase();
    if (parsed.search) normalized += parsed.search.toLowerCase();
    return normalized;
  } catch (e) {
    return cleanStr.toLowerCase().replace(/\/+$/, '');
  }
}

function extractSignificantTokens(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP_WORDS_IT.has(w));
}

function calculateSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;

  const jaccard = intersection / union;
  const overlap = intersection / Math.min(setA.size, setB.size);

  return Math.max(jaccard, overlap * 0.85);
}

function checkEditorialSimilarity(newTitle, existingRecords = []) {
  const newTokens = extractSignificantTokens(newTitle);
  if (newTokens.length === 0) return null;

  let highestScore = 0;
  let matchingRecord = null;

  for (const rec of existingRecords) {
    const existingTitle = rec.titolo_editoriale || rec.titolo_originale || '';
    const existingTokens = extractSignificantTokens(existingTitle);
    const score = calculateSimilarity(newTokens, existingTokens);

    if (score > highestScore) {
      highestScore = score;
      matchingRecord = rec;
    }
  }

  // Soglia di similarità semantica per possibile duplicato (>= 45% overlap/Jaccard)
  if (highestScore >= 0.45 && matchingRecord) {
    return {
      score: highestScore,
      matchedTitle: matchingRecord.titolo_editoriale || matchingRecord.titolo_originale,
      matchedFonte: matchingRecord.fonte || matchingRecord.url_fonte
    };
  }

  return null;
}

function validateAndEnrichCandidate(item, existingRecords = []) {
  const issues = [];

  const rawTitoloOriginale = (item.titolo_originale || item.titolo || '').trim();
  const rawTitoloEditoriale = (item.titolo_editoriale || item.titolo_originale || item.titolo || '').trim();
  const rawFonte = (item.fonte || '').trim();
  const rawUrlFonte = (item.url_fonte || item.url || '').trim();
  const rawDataFonte = (item.data_fonte || item.data || '').trim().slice(0, 10);
  const rawCategoria = (item.categoria || 'Welfare e Terzo Settore').trim();
  const rawSintesi = (item.sintesi_editoriale || item.sintesi || '').trim();
  let rawRilevanza = (item.rilevanza_coinsieme || item.rilevanza || '').trim();

  if (!rawTitoloEditoriale) issues.push('titolo_editoriale mancante');
  if (!rawFonte) issues.push('fonte mancante');
  if (!rawUrlFonte || !/^https?:\/\//i.test(rawUrlFonte)) issues.push('url_fonte non valido o mancante');
  if (!rawDataFonte || !/^\d{4}-\d{2}-\d{2}$/.test(rawDataFonte)) issues.push('data_fonte non valida (richiesto YYYY-MM-DD)');
  if (!rawSintesi) issues.push('sintesi_editoriale mancante');
  if (!rawRilevanza) issues.push('rilevanza_coinsieme mancante');

  const id = (item.id || '').trim() || `${slugify(rawFonte || 'news')}-${slugify(rawTitoloEditoriale).slice(0, 30)}-${rawDataFonte || 'nodate'}`;

  // Controllo similarità con record esistenti
  const similarityMatch = checkEditorialSimilarity(rawTitoloEditoriale || rawTitoloOriginale, existingRecords);
  let isPotentialDuplicate = false;

  if (similarityMatch) {
    isPotentialDuplicate = true;
    if (!rawRilevanza.includes(DUPLICATE_NOTE_PREFIX)) {
      rawRilevanza = `${DUPLICATE_NOTE_PREFIX} (${similarityMatch.matchedFonte}: "${similarityMatch.matchedTitle}"). ${rawRilevanza}`.trim();
    }
  }

  // REGOLA: Nessun candidato entra mai come "approvata".
  // Se mancano campi o c'è un possibile duplicato -> "segnalata".
  // Se completo, verificato e non duplicato -> "da_valutare".
  let stato = 'da_valutare';
  if (issues.length > 0 || isPotentialDuplicate) {
    stato = 'segnalata';
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
    isPotentialDuplicate,
    similarityMatch,
    issues
  };
}

async function fetchExistingAirtableRecords(token, baseId, tableName) {
  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.append('fields[]', 'url_fonte');
    params.append('fields[]', 'id');
    params.append('fields[]', 'titolo_editoriale');
    params.append('fields[]', 'titolo_originale');
    params.append('fields[]', 'fonte');
    params.append('fields[]', 'data_fonte');
    params.append('fields[]', 'stato');
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
        records.push({
          id: rec.fields?.id || rec.id,
          url_fonte: rec.fields?.url_fonte || '',
          titolo_editoriale: rec.fields?.titolo_editoriale || '',
          titolo_originale: rec.fields?.titolo_originale || '',
          fonte: rec.fields?.fonte || '',
          data_fonte: rec.fields?.data_fonte || '',
          stato: rec.fields?.stato || ''
        });
      }
    }
    offset = data.offset || null;
  } while (offset);

  return records;
}

async function createAirtableRecords(token, baseId, tableName, records) {
  const BATCH_SIZE = 10;
  const created = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const body = {
      records: chunk.map((fields) => ({ fields })),
      typecast: true
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
 // All automatic ingestion now goes through the same daily, bounded batch.
 const {prepareBatch}=require('./daily-briefing');
 if(options.dryRun || options.mock) throw new Error('Usare i test di selezione senza scritture o il workflow preview');
 return prepareBatch(options);
}

async function fetchSegnalazioniDaValutare(token, baseId, tableName = 'Segnalazioni Maurizio') {
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=100`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const records = Array.isArray(data.records) ? data.records : [];
    return records.filter(seg => {
      const s = String(seg.fields?.stato || seg.fields?.Stato || '').trim().toLowerCase();
      return s !== 'scartata' && s !== 'scartato' && s !== 'trasferita_in_notizie' && s !== 'trasferito';
    });
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
        },
        typecast: true
      })
    });
  } catch (e) {
    // silent
  }
}

if (require.main === module) {
  ingestCandidates().catch((err) => {
    console.error('[Ingest Candidati] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = {
  ingestCandidates,
  validateAndEnrichCandidate,
  normalizeUrl,
  calculateSimilarity,
  extractSignificantTokens,
  checkEditorialSimilarity,
  fetchSegnalazioniDaValutare,
  updateSegnalazioneStato,
  DUPLICATE_NOTE_PREFIX
};
