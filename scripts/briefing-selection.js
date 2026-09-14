'use strict';
const {normalizeUrl}=require('./ingest-rassegna-candidates');
const {sourceUrl}=require('./verify-publication');
const canonical=value=>normalizeUrl(sourceUrl(value));
const normalizedTitle=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function isSameStory(title,records){const key=normalizedTitle(title);return key.length>=20&&records.some(r=>normalizedTitle(r.titolo_editoriale||r.titolo_originale)===key);}
const MAX=5;
function rank(item){
 const title=item.titolo_editoriale||item.titolo_originale||'',text=title+' '+(item.selection_text||item.sintesi_editoriale||'');
 const localEvent=/festa\b|festival|anniversario|premiaz|inaugura|ciclo di incontri|seminario|murale mosaic/i.test(text);
 const practicalImpact=/inserimento lavorativ|luogo di lavoro|contratti|servizi sociali|sociosanitar|prestazioni|riabilit|linee guida|normativa|progetto di vita|barriere fisiche|accessibilit.{0,15}digital/i.test(text);
 if(localEvent&&!practicalImpact)return {score:0,reason:"Evento locale senza ricaduta operativa documentata",exclusionReason:"evento locale/non pertinente"};
 const groups=[
  [/disabil|autismo|autistic|autonomia|progetto di vita|inabilit|invalidant|sclerosi multipla|paralisi cerebrale|malattie rare/i,50,'Disabilita, autonomia e progetto di vita'],
  [/assistiv|domotic|accessibilit|barriere (?:fisiche|architettoniche|sensoriali|cognitive)|ausili/i,48,'Accessibilita, tecnologie assistive e rimozione delle barriere'],
  [/terzo settore|economia sociale|cooperativ|\bETS\b|RUNTS/i,35,'Terzo Settore ed economia sociale'],
  [/lavoro|occupaz|inserimento lavorativ|inclusion/i,30,'Lavoro e inclusione'],
  [/welfare|non autosufficien|politiche sociali|caregiver|anziani fragili/i,30,'Welfare e politiche sociali']
 ];
 let score=0,reasons=[];for(const [rx,weight,label] of groups)if(rx.test(text)){score+=weight+(rx.test(title)?15:0);reasons.push(label);}
 if(score && /norma|pension|legge|decreto|bando|contribut|diritti|commissione europea|fisco/i.test(text)){score+=25;reasons.push('Norme o misure con impatto operativo');}
 return {score,reason:reasons.join('; ')};
}
function selectCandidates(candidates,existing=[],segnalazioni=[],date){
 const newsUrls=new Set(existing.map(r=>canonical(r.url_fonte)));
 const segUrls=new Set(segnalazioni.map(r=>canonical(r.url_articolo)));
 const urls=new Set([...newsUrls,...segUrls]);
 const earliest=new Date(Date.parse(date+'T12:00:00Z')-7*86400000).toISOString().slice(0,10);
 const excluded=[],ranked=[];
 for(const item of candidates){
  const url=canonical(item.url_fonte), rating=rank(item);let reason;
  if(!url||!/^https?:\/\//.test(url)||!item.fonte||!item.titolo_editoriale||!item.sintesi_editoriale)reason='incompleto';
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(item.data_fonte||'')||item.data_fonte<earliest||item.data_fonte>date)reason='data non idonea';
  else if(segUrls.has(url))reason='segnalazione Maurizio';
  else if(newsUrls.has(url))reason='duplicato URL in Notizie';
  else if(rating.score<45)reason=rating.exclusionReason||'bassa rilevanza';
  else if(isSameStory(item.titolo_editoriale,existing))reason='duplicato titolo identico';
  if(reason){excluded.push({title:item.titolo_editoriale,source:item.fonte,url:item.url_fonte,score:rating.score,reason});continue;}
  ranked.push({...item,...rating});
 }
 const selected=[],sourceCounts=new Map();
 const sourceKey=item=>String(item.fonte).trim().toLowerCase().replace(/\s+/g,' ');
 while(ranked.length){
  // Relevance remains first; diversity only breaks equal-score ties.
  ranked.sort((a,b)=>b.score-a.score||(sourceCounts.get(sourceKey(a))||0)-(sourceCounts.get(sourceKey(b))||0)||b.data_fonte.localeCompare(a.data_fonte)||a.url_fonte.localeCompare(b.url_fonte));
  const item=ranked.shift();const url=canonical(item.url_fonte);let reason;
  if(urls.has(url)||isSameStory(item.titolo_editoriale,selected))reason='duplicato nella raccolta';
  else if(selected.length>=MAX)reason='oltre le cinque piu rilevanti';
  if(reason)excluded.push({title:item.titolo_editoriale,source:item.fonte,url:item.url_fonte,score:item.score,reason});else{selected.push(item);urls.add(url);sourceCounts.set(sourceKey(item),(sourceCounts.get(sourceKey(item))||0)+1);}
 }
 return {selected,excluded,total:candidates.length};
}
module.exports={MAX,rank,selectCandidates,isSameStory};
