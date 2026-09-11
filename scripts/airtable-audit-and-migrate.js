'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {sourceUrl, fetchPublicPages, verifyPublication, correctionFields} = require('./verify-publication');
const BASE = 'appPqa952bdRrQJNI';
const TARGETS = ['rec4qZsXdfj5wd8Ts','recYqvAnpvV3nvk9C','recgDFWwnojeDVOym','rechy2PgToVMZaOvG'];
async function runAuditAndMigration() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  if (!token) throw new Error('PAT Airtable mancante');
  if (process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_BASE_ID !== BASE) throw new Error('Base diversa da quella autorizzata');
  const report = {timestamp: new Date().toISOString(), baseId: BASE, commit: process.env.GITHUB_SHA || null,
    permissions: {}, requests: [], articles: [], corrections: [], manualAction: null};
  const out = path.join(__dirname, '../content/rassegna/airtable-full-audit.json');
  async function request(endpoint, method = 'GET', body) {
    const res = await fetch('https://api.airtable.com/v0/' + endpoint, {
      method, headers: {Authorization: 'Bearer ' + token, 'Content-Type':'application/json'},
      ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal: AbortSignal.timeout(30000)
    });
    const data = await res.json();
    report.requests.push({method, endpoint, status:res.status, ...(res.ok ? {} : {error:data.error})});
    console.log(method + ' ' + endpoint + ' HTTP ' + res.status);
    return {ok:res.ok,status:res.status,data};
  }
  function requireOk(r) { if (!r.ok) throw new Error('Airtable HTTP ' + r.status + ': ' + JSON.stringify(r.data.error)); return r.data; }
  function permission(name, r) { report.permissions[name] = {status:r.status,granted:r.ok}; }
  async function records(table) {
    let all = [], offset;
    do {
      const r = await request(BASE + '/' + table + '?pageSize=100' + (offset ? '&offset=' + encodeURIComponent(offset) : ''));
      const data = requireOk(r); all.push(...data.records); offset = data.offset;
    } while(offset);
    return all;
  }
  try {
    const metaPath = 'meta/bases/' + BASE + '/tables';
    const meta = await request(metaPath); permission('schema.bases:read',meta);
    const tables = requireOk(meta).tables;
    const seg = tables.find(t => t.name === 'Segnalazioni Maurizio');
    const news = tables.find(t => t.name === 'Notizie');
    if (!seg || !news) throw new Error('Tabelle attese mancanti');
    const read = await request(BASE + '/' + seg.id + '?pageSize=100');
    permission('data.records:read',read); requireOk(read);
    const before = await records(seg.id);
    const allNews = await records(news.id);
    const pages = await fetchPublicPages();
    report.publicPages = pages.map(({url,status,html}) => ({url,status,
      sha256:require('node:crypto').createHash('sha256').update(html).digest('hex')}));
    // Verify every target before any write. A failed HTTP/ambiguous match never means "offline".
    for (const id of TARGETS) {
      const record = before.find(r => r.id === id);
      if (!record) throw new Error('Segnalazione mancante: ' + id);
      const matches = allNews.filter(n => sourceUrl(n.fields.url_fonte) === sourceUrl(record.fields.url_articolo));
      if (matches.length !== 1) throw new Error('Corrispondenza Notizie non univoca: ' + id);
      const n = matches[0];
      const evidence = verifyPublication(pages,n.fields);
      const publicUrl = record.fields.url_pubblicato;
      let anchorExists = false;
      if (publicUrl) {
        const u = new URL(publicUrl);
        const page = pages.find(p => p.url === u.origin + u.pathname);
        anchorExists = Boolean(page && (!u.hash || page.html.includes('id="' + u.hash.slice(1) + '"')));
      }
      report.articles.push({recordId:id, note:record.fields.nota, before:record.fields,
        notizieRecordId:n.id, notizieTitle:n.fields.titolo_editoriale, source:n.fields.url_fonte,
        notizieStato:n.fields.stato, previousPublicAnchorExists:anchorExists, ...evidence});
    }
    // No-op probes: do not change field type or introduce arbitrary test records.
    const state = seg.fields.find(f => f.name === 'stato');
    if (!state || state.type !== 'singleSelect') throw new Error('Campo stato inatteso');
    const schemaProbe = await request(metaPath + '/' + seg.id + '/fields/' + state.id,'PATCH',{name:state.name});
    permission('schema.bases:write',schemaProbe); requireOk(schemaProbe);
    const probe = before.find(r => r.id === TARGETS[0]);
    const writeProbe = await request(BASE + '/' + seg.id + '/' + probe.id,'PATCH',{fields:{stato:probe.fields.stato}});
    permission('data.records:write',writeProbe); requireOk(writeProbe);
    // Fields already exist in this base; do not delete/recreate anything.
    for (const [name,type] of [['data_pubblicazione','date'],['url_pubblicato','url'],['url_articolo','singleLineText']]) {
      if (!seg.fields.some(f => f.name === name && f.type === type)) throw new Error('Campo atteso assente o di tipo inatteso: ' + name);
    }
    for (const article of report.articles) {
      const fields = correctionFields(article.before,article);
      const changed = Object.entries(fields).some(([k,v]) => (article.before[k] ?? null) !== v);
      if (changed) {
        const current = requireOk(await request(BASE + '/' + seg.id + '/' + article.recordId));
        if (JSON.stringify(current.fields) !== JSON.stringify(article.before)) throw new Error('Record modificato durante verifica: ' + article.recordId);
        requireOk(await request(BASE + '/' + seg.id + '/' + article.recordId,'PATCH',{fields}));
        report.corrections.push({recordId:article.recordId,fields});
      }
    }
    const allowed = ['da_pubblicare','pubblicato'];
    const currentRecords = await records(seg.id);
    if (currentRecords.some(r => r.fields.stato && !allowed.includes(r.fields.stato))) {
      throw new Error('Altri record usano ancora opzioni precedenti: nessuna eliminazione automatica');
    }
    if (state.options.choices.some(c => !allowed.includes(c.name))) {
      // Airtable may reject choice editing. Never delete/recreate the field as a workaround.
      const choices = allowed.map(name => {
        const c = state.options.choices.find(c => c.name === name);
        if (!c) throw new Error('Opzione attesa mancante: ' + name);
        return c;
      });
      const result = await request(metaPath + '/' + seg.id + '/fields/' + state.id,'PATCH',{options:{choices}});
      report.choiceUpdate = result;
      if (!result.ok) {
        if (result.status !== 422) requireOk(result);
        report.manualAction = 'In Segnalazioni Maurizio, modifica il campo stato ed elimina da_valutare, presa_in_carico, inserito, scartato; conserva da_pubblicare e pubblicato.';
      }
    }
    const finalMeta = requireOk(await request(metaPath));
    report.finalTable = finalMeta.tables.find(t => t.id === seg.id);
    report.finalRecords = await records(seg.id);
    for (const article of report.articles) {
      const expected = correctionFields(article.before,article);
      const final = report.finalRecords.find(r => r.id === article.recordId);
      if (!final || Object.entries(expected).some(([k,v]) => (final.fields[k] ?? null) !== v)) throw new Error('Verifica finale record fallita: ' + article.recordId);
    }
    report.status = report.manualAction ? 'records_verified_manual_choices_required' : 'complete';
  } catch (e) { report.status = 'failed'; report.error = e.message; throw e; }
  finally { fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n'); }
}
if (require.main === module) runAuditAndMigration().catch(e => {console.error(e.message);process.exitCode=1;});
module.exports = {runAuditAndMigration};
