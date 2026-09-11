/**
 * Gestione e Verifica Schema Airtable "Rassegna Stampa COINSIEME"
 * Base ID: appPqa952bdRrQJNI
 * Tabella: Notizie
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const REQUIRED_FIELDS = [
  {
    name: 'priorita',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'alta' },
        { name: 'media' },
        { name: 'bassa' }
      ]
    }
  },
  {
    name: 'posizione_sito',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'home_principale' },
        { name: 'home_evidenza' },
        { name: 'home_normale' },
        { name: 'solo_rassegna' }
      ]
    }
  },
  {
    name: 'ordine_editoriale',
    type: 'number',
    options: {
      precision: 0
    }
  },
  {
    name: 'mantieni_in_evidenza_fino_al',
    type: 'date',
    options: {
      dateFormat: { name: 'iso' }
    }
  },
  {
    name: 'immagine_in_evidenza',
    type: 'multipleAttachments'
  },
  {
    name: 'data_pubblicazione',
    type: 'date',
    options: {
      dateFormat: { name: 'iso' }
    }
  }
];

const REQUIRED_STATO_CHOICES = [
  'segnalata',
  'da_valutare',
  'approvata',
  'pubblica',
  'pubblicata',
  'scartata'
];

const REQUIRED_SEGNALAZIONI_FIELDS = [
  {
    name: 'stato',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'da_pubblicare' },
        { name: 'pubblicato' }
      ]
    }
  },
  {
    name: 'url_pubblicato',
    type: 'url'
  },
  {
    name: 'data_pubblicazione',
    type: 'date',
    options: {
      dateFormat: { name: 'iso' }
    }
  }
];

async function getBaseSchema(token, baseId) {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}

  return { ok: res.ok, status: res.status, data: json, text };
}

async function createField(token, baseId, tableId, fieldConfig) {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fieldConfig)
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}

  return { ok: res.ok, status: res.status, data: json, text };
}

async function updateField(token, baseId, tableId, fieldId, fieldConfig) {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields/${fieldId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fieldConfig)
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}

  return { ok: res.ok, status: res.status, data: json, text };
}

async function fetchRecords(token, baseId, tableName) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=20`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}

  return { ok: res.ok, status: res.status, data: json, text };
}

async function patchRecord(token, baseId, tableName, recordId, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}

  return { ok: res.ok, status: res.status, data: json, text };
}

async function main() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appPqa952bdRrQJNI';
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Notizie';

  console.log('====================================================');
  console.log('GESTIONE E VERIFICA SCHEMA AIRTABLE ONLINE');
  console.log(`Base ID: ${baseId} | Tabella: ${tableName}`);
  console.log(`Token configurato: ${token ? 'SÌ (lunghezza: ' + token.length + ', prefisso: ' + token.slice(0, 4) + '...)' : 'NO'}`);
  console.log('====================================================\n');

  let metaTables = null;
  let finalFields = null;
  let observedFieldNames = [];
  let patchResult = null;
  let metaApiAccess = false;
  let metaApiStatus = 0;
  let metaApiError = null;

  if (!token) {
    console.error('✗ Token AIRTABLE_PERSONAL_ACCESS_TOKEN non disponibile nell\'ambiente.');
    return;
  }

  // 1. TENTATIVO METADATA API
  console.log('1. Interrogazione schema base via Metadata API (GET /meta/bases/...) ...');
  const metaRes = await getBaseSchema(token, baseId);
  metaApiStatus = metaRes.status;

  if (metaRes.ok && metaRes.data && metaRes.data.tables) {
    metaApiAccess = true;
    metaTables = metaRes.data.tables;
    console.log(`   ✓ Metadata API accessibile con successo! Trovate ${metaTables.length} tabelle.`);
    const notizieTable = metaTables.find(t => t.name.toLowerCase() === tableName.toLowerCase() || t.id === tableName);
    const segnalazioniTable = metaTables.find(t => t.name.toLowerCase() === 'segnalazioni maurizio' || t.name.toLowerCase() === 'segnalazioni');

    if (notizieTable) {
      console.log(`   Tabella individuata: "${notizieTable.name}" (ID: ${notizieTable.id})`);
      const existingFields = notizieTable.fields || [];
      const existingFieldNames = new Map(existingFields.map(f => [f.name.toLowerCase(), f]));

      console.log(`   Campi attuali (${existingFields.length}):`);
      for (const f of existingFields) {
        const opts = f.options && f.options.choices ? ` [choices: ${f.options.choices.map(c => c.name).join(', ')}]` : '';
        console.log(`     - ${f.name} (${f.type})${opts}`);
      }

      console.log('\n2. Creazione / Aggiornamento campi editoriali Notizie via Metadata API...');
      for (const reqField of REQUIRED_FIELDS) {
        const existing = existingFieldNames.get(reqField.name.toLowerCase());
        if (!existing) {
          console.log(`   + Creazione campo: "${reqField.name}" (${reqField.type})...`);
          const createRes = await createField(token, baseId, notizieTable.id, reqField);
          if (createRes.ok) {
            console.log(`     ✓ Creato "${reqField.name}" (ID: ${createRes.data.id})`);
          } else {
            console.warn(`     ✗ Errore creazione (${createRes.status}): ${createRes.text}`);
            if (reqField.type === 'multipleAttachments') {
              console.log(`     -> Tentativo fallback type "url"...`);
              const fallbackRes = await createField(token, baseId, notizieTable.id, { name: reqField.name, type: 'url' });
              if (fallbackRes.ok) {
                console.log(`     ✓ Creato "${reqField.name}" come URL (ID: ${fallbackRes.data.id})`);
              } else {
                console.warn(`     ✗ Fallback URL fallito: ${fallbackRes.text}`);
              }
            }
          }
        } else {
          console.log(`   = Campo "${reqField.name}" già presente.`);
        }
      }

      // Aggiornamento scelte campo stato Notizie
      const statoField = existingFieldNames.get('stato');
      if (statoField && statoField.type === 'singleSelect') {
        const choiceMap = new Map();
        for (const c of (statoField.options && statoField.options.choices || [])) {
          choiceMap.set(c.name.toLowerCase(), c);
        }
        for (const reqChoice of REQUIRED_STATO_CHOICES) {
          if (!choiceMap.has(reqChoice.toLowerCase())) {
            choiceMap.set(reqChoice.toLowerCase(), { name: reqChoice });
          }
        }
        const updatedChoices = Array.from(choiceMap.values());
        console.log(`\n3. Aggiornamento scelte "stato" Notizie in: [${updatedChoices.map(c => c.name).join(', ')}]...`);
        const updateStatoRes = await updateField(token, baseId, notizieTable.id, statoField.id, {
          name: statoField.name,
          type: 'singleSelect',
          options: { choices: updatedChoices }
        });
        if (updateStatoRes.ok) {
          console.log('   ✓ Opzioni campo "stato" Notizie aggiornate con successo.');
        } else {
          console.warn(`   ✗ Aggiornamento scelte stato (${updateStatoRes.status}): ${updateStatoRes.text}`);
        }
      }
    }

    if (segnalazioniTable) {
      console.log(`\n   Tabella Segnalazioni individuata: "${segnalazioniTable.name}" (ID: ${segnalazioniTable.id})`);
      const existingFields = segnalazioniTable.fields || [];
      const existingFieldNames = new Map(existingFields.map(f => [f.name.toLowerCase(), f]));

      console.log(`   Campi attuali Segnalazioni (${existingFields.length}):`);
      for (const f of existingFields) {
        const opts = f.options && f.options.choices ? ` [choices: ${f.options.choices.map(c => c.name).join(', ')}]` : '';
        console.log(`     - ${f.name} (${f.type})${opts}`);
      }

      console.log('\n2b. Creazione / Aggiornamento campi Segnalazioni Maurizio via Metadata API...');
      for (const reqField of REQUIRED_SEGNALAZIONI_FIELDS) {
        const existing = existingFieldNames.get(reqField.name.toLowerCase());
        if (!existing) {
          console.log(`   + Creazione campo Segnalazioni: "${reqField.name}" (${reqField.type})...`);
          const createRes = await createField(token, baseId, segnalazioniTable.id, reqField);
          if (createRes.ok) {
            console.log(`     ✓ Creato "${reqField.name}" (ID: ${createRes.data.id})`);
          } else {
            console.warn(`     ✗ Errore creazione Segnalazioni (${createRes.status}): ${createRes.text}`);
          }
        } else {
          console.log(`   = Campo Segnalazioni "${reqField.name}" già presente.`);
        }
      }

      // Aggiornamento scelte campo stato Segnalazioni Maurizio
      const statoSegField = existingFieldNames.get('stato');
      if (statoSegField && statoSegField.type === 'singleSelect') {
        const choiceMap = new Map();
        for (const c of (statoSegField.options && statoSegField.options.choices || [])) {
          choiceMap.set(c.name.toLowerCase(), c);
        }
        for (const reqChoice of [{ name: 'da_pubblicare' }, { name: 'pubblicato' }]) {
          if (!choiceMap.has(reqChoice.name.toLowerCase())) {
            choiceMap.set(reqChoice.name.toLowerCase(), reqChoice);
          }
        }
        const updatedChoices = Array.from(choiceMap.values());
        console.log(`\n3b. Aggiornamento scelte "stato" Segnalazioni in: [${updatedChoices.map(c => c.name).join(', ')}]...`);
        const updateStatoRes = await updateField(token, baseId, segnalazioniTable.id, statoSegField.id, {
          name: statoSegField.name,
          type: 'singleSelect',
          options: { choices: updatedChoices }
        });
        if (updateStatoRes.ok) {
          console.log('   ✓ Opzioni campo "stato" Segnalazioni aggiornate con successo.');
        } else {
          console.warn(`   ✗ Aggiornamento scelte stato Segnalazioni (${updateStatoRes.status}): ${updateStatoRes.text}`);
        }
      }
    }

      // Rilettura schema
      const finalSchema = await getBaseSchema(token, baseId);
      if (finalSchema.ok && finalSchema.data && finalSchema.data.tables) {
        const finalNotizie = finalSchema.data.tables.find(t => t.id === notizieTable.id);
        if (finalNotizie) {
          finalFields = finalNotizie.fields;
          console.log(`\n====================================================`);
          console.log(`SCHEMA FINALE ACCERTATO VIA METADATA API ("${finalNotizie.name}"):`);
          console.log(`====================================================`);
          for (const f of finalNotizie.fields) {
            const opts = f.options && f.options.choices ? `\n       Scelte: [${f.options.choices.map(c => c.name).join(', ')}]` : '';
            console.log(`  • ${f.name} (${f.type})${opts}`);
          }
          console.log(`====================================================\n`);
        }
      }
  } else {
    metaApiError = metaRes.text;
    console.log(`   ℹ Metadata API non abilitata per questo token (${metaRes.status}): ${metaRes.text}`);
    console.log(`   -> Nota: i Personal Access Token Airtable necessitano dei permessi 'schema.bases:read' e 'schema.bases:write' per gestire lo schema via API.`);
  }

  // 2. INTERROGAZIONE RECORD VIA STANDARD REST API
  console.log('\n4. Interrogazione record e schema dinamico via REST API (GET /v0/{baseId}/{tableName})...');
  const recordsRes = await fetchRecords(token, baseId, tableName);

  if (!recordsRes.ok) {
    console.error(`✗ Errore lettura tabella "${tableName}" (${recordsRes.status}): ${recordsRes.text}`);
  } else {
    const records = (recordsRes.data && recordsRes.data.records) || [];
    console.log(`   ✓ Letti ${records.length} record dalla tabella "${tableName}".`);

    const obsSet = new Set();
    for (const r of records) {
      for (const key of Object.keys(r.fields || {})) {
        obsSet.add(key);
      }
    }
    observedFieldNames = [...obsSet];
    console.log(`   Campi attualmente popolati nei record esistenti: [${observedFieldNames.join(', ')}]`);

    // 3. AGGIORNAMENTO RECORD DI TEST
    if (records.length > 0) {
      const testRec = records[0];
      console.log(`\n5. Test scrittura campi editoriali sul record ID="${testRec.id}" (Titolo: "${testRec.fields.titolo_editoriale || testRec.fields.titolo_originale || testRec.id}")...`);
      
      const patchPayload = {
        stato: 'pubblica',
        priorita: 'alta',
        posizione_sito: 'home_principale',
        ordine_editoriale: 1
      };

      console.log('   Invio PATCH con payload:', patchPayload);
      const patchRes = await patchRecord(token, baseId, tableName, testRec.id, patchPayload);

      patchResult = {
        ok: patchRes.ok,
        status: patchRes.status,
        fields: patchRes.ok ? patchRes.data.fields : null,
        error: patchRes.ok ? null : patchRes.text
      };

      if (patchRes.ok) {
        console.log('   ✅ PATCH RIUSCITA! Airtable ha accettato i campi editoriali:');
        console.log('      - stato:', patchRes.data.fields.stato);
        console.log('      - priorita:', patchRes.data.fields.priorita);
        console.log('      - posizione_sito:', patchRes.data.fields.posizione_sito);
        console.log('      - ordine_editoriale:', patchRes.data.fields.ordine_editoriale);
      } else {
        console.error(`   ✗ Esito PATCH (${patchRes.status}): ${patchRes.text}`);
        if (patchRes.text && (patchRes.text.includes('UNKNOWN_FIELD_NAME') || patchRes.text.includes('INVALID_VALUE_FOR_COLUMN'))) {
          console.log('\n   [ATTENZIONE]: Alcuni campi non esistono ancora come colonne nella tabella Airtable.');
          console.log('   Dettaglio risposta Airtable:', patchRes.text);
        }
      }
    }
  }

  // 4. SALVATAGGIO REPORT UNCONDIZIONALE
  const report = {
    timestamp: new Date().toISOString(),
    baseId,
    tableName,
    metaApiAccess,
    metaApiStatus,
    metaApiError,
    schemaFields: finalFields,
    observedRecordFields: observedFieldNames,
    patchTestResult: patchResult
  };

  const reportDir = path.join(root, 'content', 'rassegna');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const reportPath = path.join(reportDir, 'airtable-schema-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`\n✓ Report diagnostico salvato con successo in ${reportPath}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n✗ ERRORE INATTESO:', err);
  });
}

module.exports = { main };
