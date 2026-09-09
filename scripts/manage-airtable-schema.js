/**
 * Gestione e Verifica Schema Airtable "Rassegna Stampa COINSIEME"
 * Base ID: appPqa952bdRrQJNI
 * Tabella: Notizie
 */

const fs = require('fs');
const path = require('path');

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

async function getBaseSchema(token, baseId) {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore lettura schema base ${baseId} (${res.status}): ${errText}`);
  }

  return await res.json();
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

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore creazione campo "${fieldConfig.name}" (${res.status}): ${errText}`);
  }

  return await res.json();
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

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore aggiornamento campo "${fieldConfig.name}" (${res.status}): ${errText}`);
  }

  return await res.json();
}

async function updateTestRecord(token, baseId, tableName, recordId, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore PATCH record di test ${recordId} (${res.status}): ${errText}`);
  }

  return await res.json();
}

async function fetchRecords(token, baseId, tableName) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=10`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore lettura record da tabella ${tableName} (${res.status}): ${errText}`);
  }

  return await res.json();
}

async function main() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appPqa952bdRrQJNI';
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Notizie';

  console.log('====================================================');
  console.log('GESTIONE E VERIFICA SCHEMA AIRTABLE ONLINE');
  console.log(`Base ID: ${baseId} | Tabella: ${tableName}`);
  console.log('====================================================\n');

  if (!token) {
    throw new Error('Token AIRTABLE_PERSONAL_ACCESS_TOKEN mancante nell\'ambiente.');
  }

  console.log('1. Interrogazione schema base via Metadata API...');
  const schemaData = await getBaseSchema(token, baseId);
  const tables = schemaData.tables || [];
  console.log(`   Trovate ${tables.length} tabelle nella base.`);

  const notizieTable = tables.find(t => t.name.toLowerCase() === tableName.toLowerCase() || t.id === tableName);
  if (!notizieTable) {
    console.error(`   Tabella "${tableName}" non trovata. Tabelle disponibili:`, tables.map(t => `${t.name} (${t.id})`));
    throw new Error(`Tabella "${tableName}" non trovata nella base ${baseId}`);
  }

  console.log(`   Tabella individuata: "${notizieTable.name}" (ID: ${notizieTable.id})`);
  const existingFields = notizieTable.fields || [];
  console.log(`   Campi attuali (${existingFields.length}):`);
  for (const f of existingFields) {
    const opts = f.options && f.options.choices ? ` [choices: ${f.options.choices.map(c => c.name).join(', ')}]` : '';
    console.log(`     - ${f.name} (${f.type}, id: ${f.id})${opts}`);
  }

  console.log('\n2. Creazione / Aggiornamento campi editoriali...');
  const existingFieldNames = new Map(existingFields.map(f => [f.name.toLowerCase(), f]));

  for (const reqField of REQUIRED_FIELDS) {
    const existing = existingFieldNames.get(reqField.name.toLowerCase());
    if (!existing) {
      console.log(`   + Creazione campo mancante: "${reqField.name}" (${reqField.type})...`);
      try {
        const created = await createField(token, baseId, notizieTable.id, reqField);
        console.log(`     ✓ Campo "${created.name}" creato con successo (ID: ${created.id}).`);
      } catch (err) {
        console.error(`     ✗ Impossibile creare "${reqField.name}": ${err.message}`);
        // Se fallisce per multipleAttachments, prova con url
        if (reqField.type === 'multipleAttachments') {
          console.log(`     -> Tentativo fallback con type: 'url'...`);
          try {
            const fallback = { ...reqField, type: 'url', options: undefined };
            const created = await createField(token, baseId, notizieTable.id, fallback);
            console.log(`     ✓ Campo "${created.name}" creato con type "url" (ID: ${created.id}).`);
          } catch (err2) {
            console.error(`     ✗ Fallback fallito: ${err2.message}`);
          }
        }
      }
    } else {
      console.log(`   = Campo "${reqField.name}" già presente (ID: ${existing.id}, Type: ${existing.type}).`);
    }
  }

  // Verifica e aggiornamento campo stato
  const statoField = existingFieldNames.get('stato');
  if (statoField && statoField.type === 'singleSelect') {
    const currentChoices = (statoField.options && statoField.options.choices) ? statoField.options.choices.map(c => c.name) : [];
    console.log(`\n3. Verifica opzioni del campo "stato" (attuali: [${currentChoices.join(', ')}])...`);
    
    // Costruisci le nuove scelte unendo le esistenti con quelle richieste
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
    console.log(`   -> Aggiornamento scelte stato in: [${updatedChoices.map(c => c.name).join(', ')}]...`);
    try {
      await updateField(token, baseId, notizieTable.id, statoField.id, {
        name: statoField.name,
        type: 'singleSelect',
        options: {
          choices: updatedChoices
        }
      });
      console.log('   ✓ Campo "stato" aggiornato con tutte le opzioni editoriali.');
    } catch (err) {
      console.warn(`   ✗ Aggiornamento opzioni stato via API: ${err.message}`);
    }
  }

  console.log('\n4. Rilettura schema finale Airtable...');
  const finalSchema = await getBaseSchema(token, baseId);
  const finalNotizie = (finalSchema.tables || []).find(t => t.id === notizieTable.id);
  console.log(`\n====================================================`);
  console.log(`ELENCO COMPLETO DEI CAMPI REALI NELLA TABELLA "${finalNotizie.name}":`);
  console.log(`====================================================`);
  for (const f of finalNotizie.fields) {
    const opts = f.options && f.options.choices ? `\n       Scelte: [${f.options.choices.map(c => c.name).join(', ')}]` : '';
    console.log(`  • ${f.name} | Tipo: ${f.type} | ID: ${f.id}${opts}`);
  }
  console.log(`====================================================\n`);

  console.log('5. Aggiornamento notizia di test con stato "pubblica", priorità "alta", posizione "home_principale", ordine "1"...');
  const recordsData = await fetchRecords(token, baseId, tableName);
  const sampleRecords = recordsData.records || [];
  if (sampleRecords.length === 0) {
    console.log('   Nessun record presente nella tabella per il test.');
  } else {
    // Scegliamo il primo record per il test
    const testRec = sampleRecords[0];
    console.log(`   Record selezionato: ID="${testRec.id}", Titolo="${testRec.fields.titolo_editoriale || testRec.fields.titolo_originale || testRec.id}"`);
    
    const patchPayload = {
      stato: 'pubblica',
      priorita: 'alta',
      posizione_sito: 'home_principale',
      ordine_editoriale: 1
    };

    console.log('   Esecuzione PATCH record su Airtable:', patchPayload);
    const patched = await updateTestRecord(token, baseId, tableName, testRec.id, patchPayload);
    console.log(`   ✓ Record aggiornato con successo su Airtable: stato="${patched.fields.stato}", priorita="${patched.fields.priorita}", posizione_sito="${patched.fields.posizione_sito}", ordine_editoriale=${patched.fields.ordine_editoriale}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n✗ ERRORE ESECUZIONE:', err);
    process.exit(1);
  });
}

module.exports = { main };
