/**
 * Audit Completo Permessi PAT Airtable, Schema e Migrazione Record
 * Base: Rassegna Stampa COINSIEME (appPqa952bdRrQJNI)
 * Tabella: Segnalazioni Maurizio & Notizie
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

async function runAuditAndMigration() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appPqa952bdRrQJNI';
  const segnalazioniTableName = 'Segnalazioni Maurizio';
  const notizieTableName = 'Notizie';

  console.log('======================================================================');
  console.log('AUDIT PERMESSI PAT AIRTABLE, SCHEMA E MIGRAZIONE SEGNALAZIONI MAURIZIO');
  console.log('======================================================================');
  console.log(`Base ID: ${baseId}`);
  console.log(`Token configurato: ${token ? 'SÌ (lunghezza ' + token.length + ', prefisso ' + token.slice(0, 6) + '...)' : 'NO'}`);
  console.log('----------------------------------------------------------------------\n');

  if (!token) {
    console.error('✗ ERRORE: Token AIRTABLE_PERSONAL_ACCESS_TOKEN mancante.');
    return;
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseId,
    tokenConfigured: true,
    permissions: {
      'data.records:read': { granted: false, status: null, error: null },
      'data.records:write': { granted: false, status: null, error: null },
      'schema.bases:read': { granted: false, status: null, error: null },
      'schema.bases:write': { granted: false, status: null, error: null }
    },
    tables: {},
    migrationResults: [],
    errors: []
  };

  // 1. TEST PERMESSI SCHEMA (Metadata API)
  console.log('1. VERIFICA PERMESSI SCHEMA (schema.bases:read & schema.bases:write)...');
  const metaUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  let metaTables = null;

  try {
    const metaRes = await fetch(metaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    report.permissions['schema.bases:read'].status = metaRes.status;
    const metaText = await metaRes.text();

    if (metaRes.ok) {
      report.permissions['schema.bases:read'].granted = true;
      const metaJson = JSON.parse(metaText);
      metaTables = metaJson.tables || [];
      console.log(`   ✅ schema.bases:read: ACCORDATO (Trovate ${metaTables.length} tabelle)`);
      for (const t of metaTables) {
        report.tables[t.name] = {
          id: t.id,
          fields: (t.fields || []).map(f => ({
            name: f.name,
            type: f.type,
            choices: f.options?.choices?.map(c => c.name) || null
          })),
          views: (t.views || []).map(v => ({
            id: v.id,
            name: v.name,
            type: v.type
          }))
        };
      }
    } else {
      report.permissions['schema.bases:read'].granted = false;
      report.permissions['schema.bases:read'].error = metaText;
      console.log(`   ❌ schema.bases:read: NEGATO (${metaRes.status}): ${metaText}`);
    }
  } catch (e) {
    report.permissions['schema.bases:read'].error = e.message;
    console.log(`   ❌ schema.bases:read: ECCEZIONE: ${e.message}`);
  }

  // 2. TEST PERMESSI RECORD (REST API)
  console.log('\n2. VERIFICA PERMESSI RECORD (data.records:read & data.records:write)...');
  let segRecords = [];
  let notizieRecords = [];

  try {
    const segUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(segnalazioniTableName)}?pageSize=50`;
    const segRes = await fetch(segUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    report.permissions['data.records:read'].status = segRes.status;
    const segText = await segRes.text();

    if (segRes.ok) {
      report.permissions['data.records:read'].granted = true;
      const segJson = JSON.parse(segText);
      segRecords = segJson.records || [];
      console.log(`   ✅ data.records:read: ACCORDATO (Letti ${segRecords.length} record in "${segnalazioniTableName}")`);
    } else {
      report.permissions['data.records:read'].granted = false;
      report.permissions['data.records:read'].error = segText;
      console.log(`   ❌ data.records:read: NEGATO (${segRes.status}): ${segText}`);
    }
  } catch (e) {
    report.permissions['data.records:read'].error = e.message;
    console.log(`   ❌ data.records:read: ECCEZIONE: ${e.message}`);
  }

  try {
    const notUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(notizieTableName)}?pageSize=50`;
    const notRes = await fetch(notUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (notRes.ok) {
      const notJson = await notRes.json();
      notizieRecords = notJson.records || [];
      console.log(`   ✅ Letti ${notizieRecords.length} record in "${notizieTableName}".`);
    }
  } catch (e) {}

  if (segRecords.length > 0) {
    const testRecord = segRecords[0];
    console.log(`\n   Test scrittura (PATCH) sul record ${testRecord.id} di "${segnalazioniTableName}"...`);
    try {
      const patchUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(segnalazioniTableName)}/${testRecord.id}`;
      const currentStato = testRecord.fields.stato || 'da_pubblicare';
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: { stato: currentStato },
          typecast: true
        })
      });

      report.permissions['data.records:write'].status = patchRes.status;
      const patchText = await patchRes.text();

      if (patchRes.ok) {
        report.permissions['data.records:write'].granted = true;
        console.log(`   ✅ data.records:write: ACCORDATO`);
      } else {
        report.permissions['data.records:write'].granted = false;
        report.permissions['data.records:write'].error = patchText;
        console.log(`   ❌ data.records:write: NEGATO (${patchRes.status}): ${patchText}`);
      }
    } catch (e) {
      report.permissions['data.records:write'].error = e.message;
      console.log(`   ❌ data.records:write: ECCEZIONE: ${e.message}`);
    }
  }

  // 3. APPLICAZIONE SCHEMA
  if (metaTables && report.permissions['schema.bases:read'].granted) {
    console.log('\n3. ANALISI ED EVENTUALE AGGIORNAMENTO SCHEMA AIRTABLE...');
    const segTable = metaTables.find(t => t.name.toLowerCase() === segnalazioniTableName.toLowerCase());
    
    if (segTable) {
      console.log(`   Tabella "${segTable.name}" trovata (ID: ${segTable.id}).`);
      console.log(`   Viste attuali (${(segTable.views || []).length}):`);
      for (const v of (segTable.views || [])) {
        console.log(`     - [Vista] "${v.name}" (ID: ${v.id}, Type: ${v.type})`);
      }

      const existingFields = segTable.fields || [];
      const fieldMap = new Map(existingFields.map(f => [f.name.toLowerCase(), f]));

      console.log(`   Campi attuali (${existingFields.length}):`);
      for (const f of existingFields) {
        const opts = f.options && f.options.choices ? ` [scelte: ${f.options.choices.map(c => c.name).join(', ')}]` : '';
        console.log(`     - [Campo] "${f.name}" (${f.type})${opts}`);
      }

      if (!fieldMap.has('data_pubblicazione')) {
        console.log('   + Creazione campo "data_pubblicazione" (date)...');
        try {
          const createFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${segTable.id}/fields`;
          const cfRes = await fetch(createFieldUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'data_pubblicazione',
              type: 'date',
              options: { dateFormat: { name: 'iso' } }
            })
          });
          const cfText = await cfRes.text();
          if (cfRes.ok) {
            report.permissions['schema.bases:write'].granted = true;
            console.log('     ✅ Campo "data_pubblicazione" creato con successo.');
          } else {
            console.log(`     ❌ Errore creazione "data_pubblicazione" (${cfRes.status}): ${cfText}`);
            report.permissions['schema.bases:write'].error = cfText;
          }
        } catch (e) {
          console.log(`     ❌ Eccezione creazione "data_pubblicazione": ${e.message}`);
        }
      }

      if (!fieldMap.has('url_pubblicato')) {
        console.log('   + Creazione campo "url_pubblicato" (url)...');
        try {
          const createFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${segTable.id}/fields`;
          const cfRes = await fetch(createFieldUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'url_pubblicato',
              type: 'url'
            })
          });
          const cfText = await cfRes.text();
          if (cfRes.ok) {
            report.permissions['schema.bases:write'].granted = true;
            console.log('     ✅ Campo "url_pubblicato" creato con successo.');
          } else {
            console.log(`     ❌ Errore creazione "url_pubblicato" (${cfRes.status}): ${cfText}`);
            report.permissions['schema.bases:write'].error = cfText;
          }
        } catch (e) {
          console.log(`     ❌ Eccezione creazione "url_pubblicato": ${e.message}`);
        }
      }

      const statoField = fieldMap.get('stato');
      if (statoField && statoField.type === 'singleSelect') {
        console.log('   ~ Aggiornamento opzioni campo "stato" a sole [da_pubblicare, pubblicato]...');
        try {
          const patchFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${segTable.id}/fields/${statoField.id}`;
          const pfRes = await fetch(patchFieldUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'stato',
              type: 'singleSelect',
              options: {
                choices: [
                  { name: 'da_pubblicare' },
                  { name: 'pubblicato' }
                ]
              }
            })
          });
          const pfText = await pfRes.text();
          if (pfRes.ok) {
            report.permissions['schema.bases:write'].granted = true;
            console.log('     ✅ Opzioni campo "stato" aggiornate a: [da_pubblicare, pubblicato]');
          } else {
            console.log(`     ❌ Errore aggiornamento scelte "stato" (${pfRes.status}): ${pfText}`);
            report.permissions['schema.bases:write'].error = pfText;
          }
        } catch (e) {
          console.log(`     ❌ Eccezione aggiornamento scelte "stato": ${e.message}`);
        }
      }
    }

    const notTable = metaTables.find(t => t.name.toLowerCase() === notizieTableName.toLowerCase());
    if (notTable) {
      console.log(`\n   Tabella "${notTable.name}" trovata (ID: ${notTable.id}).`);
      const existingFields = notTable.fields || [];
      const fieldMap = new Map(existingFields.map(f => [f.name.toLowerCase(), f]));

      const NOTIZIE_FIELDS = [
        { name: 'priorita', type: 'singleSelect', options: { choices: [{ name: 'alta' }, { name: 'media' }, { name: 'bassa' }] } },
        { name: 'posizione_sito', type: 'singleSelect', options: { choices: [{ name: 'home_principale' }, { name: 'home_evidenza' }, { name: 'home_normale' }, { name: 'solo_rassegna' }] } },
        { name: 'ordine_editoriale', type: 'number', options: { precision: 0 } },
        { name: 'mantieni_in_evidenza_fino_al', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'immagine_in_evidenza', type: 'multipleAttachments' },
        { name: 'data_pubblicazione', type: 'date', options: { dateFormat: { name: 'iso' } } }
      ];

      for (const reqField of NOTIZIE_FIELDS) {
        if (!fieldMap.has(reqField.name.toLowerCase())) {
          console.log(`   + Creazione campo Notizie "${reqField.name}" (${reqField.type})...`);
          try {
            const createFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${notTable.id}/fields`;
            const cfRes = await fetch(createFieldUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(reqField)
            });
            const cfText = await cfRes.text();
            if (cfRes.ok) {
              report.permissions['schema.bases:write'].granted = true;
              console.log(`     ✅ Campo "${reqField.name}" creato con successo in Notizie.`);
            } else {
              console.log(`     ❌ Errore creazione "${reqField.name}" in Notizie (${cfRes.status}): ${cfText}`);
            }
          } catch (e) {
            console.log(`     ❌ Eccezione creazione "${reqField.name}" in Notizie: ${e.message}`);
          }
        }
      }

      const statoField = fieldMap.get('stato');
      if (statoField && statoField.type === 'singleSelect') {
        const choiceMap = new Map();
        for (const c of (statoField.options?.choices || [])) choiceMap.set(c.name.toLowerCase(), c);
        for (const reqChoice of ['segnalata', 'da_valutare', 'approvata', 'pubblica', 'pubblicata', 'scartata']) {
          if (!choiceMap.has(reqChoice.toLowerCase())) choiceMap.set(reqChoice.toLowerCase(), { name: reqChoice });
        }
        try {
          const patchFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${notTable.id}/fields/${statoField.id}`;
          const pfRes = await fetch(patchFieldUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'stato',
              type: 'singleSelect',
              options: { choices: Array.from(choiceMap.values()) }
            })
          });
          if (pfRes.ok) {
            report.permissions['schema.bases:write'].granted = true;
            console.log('     ✅ Opzioni campo "stato" Notizie aggiornate con successo.');
          }
        } catch (e) {}
      }
    }
  }

  // 4. MIGRAZIONE RECORD
  console.log('\n4. MIGRAZIONE DEI RECORD ESISTENTI IN SEGNALAZIONI MAURIZIO...');
  if (report.permissions['data.records:write'].granted && segRecords.length > 0) {
    const onlineNotizieUrls = new Set();
    const onlineNotizieMap = new Map();
    for (const not of notizieRecords) {
      const u = not.fields.url_articolo || not.fields.link_fonte || not.fields.url || '';
      if (u) {
        onlineNotizieUrls.add(u.trim().toLowerCase());
        onlineNotizieMap.set(u.trim().toLowerCase(), not);
      }
    }

    for (const r of segRecords) {
      const recId = r.id;
      const rawUrl = r.fields.url_articolo || r.fields.url || r.fields.link || '';
      const rawStato = (r.fields.stato || '').trim();
      const rawTitolo = r.fields.titolo_articolo || r.fields.titolo || r.fields.nota || recId;
      const rawData = r.fields.data_segnalazione || r.fields.data || new Date().toISOString().slice(0, 10);

      const cleanUrl = rawUrl.replace(/^.*?https?:\/\//i, 'https://').trim();
      const isOnline = onlineNotizieUrls.has(cleanUrl.toLowerCase());
      const matchingNotizia = onlineNotizieMap.get(cleanUrl.toLowerCase());

      let targetStato = rawStato;
      let extraFields = {};

      if (!rawUrl || rawUrl.trim() === '') {
        console.log(`   - Record ${recId}: riga vuota / URL assente (stato="${rawStato}") -> ignorato.`);
        continue;
      }

      if (rawStato === 'presa_in_carico' || rawStato === 'da_valutare' || !rawStato) {
        targetStato = 'da_pubblicare';
      } else if (rawStato === 'inserito') {
        if (isOnline) {
          targetStato = 'pubblicato';
          extraFields.data_pubblicazione = rawData;
          extraFields.url_pubblicato = `https://www.coinsieme.it/#${matchingNotizia ? matchingNotizia.id : ''}`;
        } else {
          targetStato = 'da_pubblicare';
        }
      } else if (rawStato === 'pubblicato') {
        if (!r.fields.data_pubblicazione) extraFields.data_pubblicazione = rawData;
        if (!r.fields.url_pubblicato) extraFields.url_pubblicato = `https://www.coinsieme.it/#${matchingNotizia ? matchingNotizia.id : ''}`;
      }

      console.log(`   - Record ${recId} ("${rawTitolo.slice(0, 35)}..."): stato "${rawStato}" -> target "${targetStato}"`);

      try {
        const updatePayload = {
          fields: {
            stato: targetStato,
            ...extraFields
          },
          typecast: true
        };
        const patchUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(segnalazioniTableName)}/${recId}`;
        const pRes = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
        const pText = await pRes.text();
        if (pRes.ok) {
          console.log(`     ✅ Aggiornato con successo: stato="${targetStato}"`);
          report.migrationResults.push({
            recordId: recId,
            titolo: rawTitolo,
            oldStato: rawStato,
            newStato: targetStato,
            extraFields,
            success: true
          });
        } else {
          console.log(`     ❌ Errore migrazione record (${pRes.status}): ${pText}`);
          report.migrationResults.push({
            recordId: recId,
            titolo: rawTitolo,
            oldStato: rawStato,
            newStato: targetStato,
            success: false,
            error: pText
          });
        }
      } catch (err) {
        console.log(`     ❌ Eccezione migrazione: ${err.message}`);
      }
    }
  } else {
    console.log('   ℹ Migrazione record non eseguita (permesso data.records:write mancante o 0 record).');
  }

  // 5. VERIFICA FINALE
  console.log('\n5. VERIFICA FINALE STATO TABELLA...');
  try {
    const finalSegRes = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(segnalazioniTableName)}?pageSize=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (finalSegRes.ok) {
      const finalSegJson = await finalSegRes.json();
      console.log(`   Stato attuale dei record in "${segnalazioniTableName}":`);
      for (const r of (finalSegJson.records || [])) {
        console.log(`   • [${r.id}] stato: "${r.fields.stato || '(vuoto)'}" | titolo: "${r.fields.titolo_articolo || r.fields.nota || ''}" | data_pubblicazione: "${r.fields.data_pubblicazione || '(vuoto)'}" | url_pubblicato: "${r.fields.url_pubblicato || '(vuoto)'}"`);
      }
    }
  } catch (e) {}

  const outPath = path.join(root, 'content', 'rassegna', 'airtable-full-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`\nReport audit completo salvato in: ${outPath}`);
  console.log('======================================================================\n');
}

if (require.main === module) {
  runAuditAndMigration().catch(err => {
    console.error('ERRORE FATALE:', err);
  });
}

module.exports = { runAuditAndMigration };
