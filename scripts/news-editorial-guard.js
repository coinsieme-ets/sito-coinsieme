'use strict';
// Match whole error-page titles, not articles discussing an error message.
function isErrorTitle(value) {
 const title=String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ').trim();
 return /^(?:(?:419|404|403|500|503)\s*[-:|]?\s*)?(?:page expired|page not found|access denied|internal server error|service unavailable|pagina scaduta|pagina non trovata)(?:\s*[|\u2013\u2014-]\s*(?:ipsoa|wolters kluwer|cloudflare))?[.!]?$/i.test(title);
}
const needsReview=item=>isErrorTitle(item.titolo_editoriale||item.title)||isErrorTitle(item.titolo_originale);
const canPublish=item=>!needsReview(item)&&(!item.stato||['pubblica','pubblicata'].includes(item.stato));
async function quarantine(api,record){
 if(!needsReview(record.fields)||!['pubblica','pubblicata'].includes(record.fields.stato))return;
 const note='Titolo di pagina di errore: pubblicazione sospesa il '+new Date().toISOString().slice(0,10)+'; verifica editoriale necessaria, anche con HTTP 200.';
 await api('tblonsfQ2mnaelCAn/'+record.id,'PATCH',{fields:{stato:'da_verificare',rilevanza_coinsieme:[record.fields.rilevanza_coinsieme,note].filter(Boolean).join('\n')}});
 record.fields={...record.fields,stato:'da_verificare'};
}
module.exports={isErrorTitle,needsReview,canPublish,quarantine};
