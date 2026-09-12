'use strict';
const {normalizeUrl,checkEditorialSimilarity}=require('./ingest-rassegna-candidates');
const MAX=5;
function rank(item){
 const title=item.titolo_editoriale||item.titolo_originale||'',text=title+' '+(item.sintesi_editoriale||'');
 if(/inaugurat|murale mosaic/i.test(text))return {score:0,reason:'Iniziativa locale senza impatto operativo esplicito'};
 if(/festa\b|festival|anniversario|premiaz|inaugura|ciclo di incontri|seminario/i.test(title))return {score:0,reason:'Evento o comunicato locale'};
 const groups=[
  [/disabil|autismo|autistic|autonomia|progetto di vita|inabilit|invalidant|sclerosi multipla/i,50,'Disabilita, autonomia e progetto di vita'],
  [/assistiv|domotic|accessibilit.{0,15}digital|ausili/i,48,'Tecnologie assistive e accessibilita digitale'],
  [/terzo settore|economia sociale|cooperativ|\bETS\b|RUNTS/i,35,'Terzo Settore ed economia sociale'],
  [/lavoro|occupaz|inserimento lavorativ|inclusion/i,30,'Lavoro e inclusione'],
  [/welfare|non autosufficien|politiche sociali|caregiver|anziani fragili/i,30,'Welfare e politiche sociali']
 ];
 let score=0,reasons=[];for(const [rx,weight,label] of groups)if(rx.test(text)){score+=weight+(rx.test(title)?15:0);reasons.push(label);}
 if(score && /norma|pension|legge|decreto|bando|contribut|diritti|commissione europea|fisco/i.test(text)){score+=25;reasons.push('Norme o misure con impatto operativo');}
 return {score,reason:reasons.join('; ')};
}
function selectCandidates(candidates,existing=[],segnalazioni=[],date){
 const urls=new Set([...existing.map(r=>normalizeUrl(r.url_fonte)),...segnalazioni.map(r=>normalizeUrl(r.url_articolo))]);
 const earliest=new Date(Date.parse(date+'T12:00:00Z')-7*86400000).toISOString().slice(0,10);
 const excluded=[],ranked=[];
 for(const item of candidates){
  const url=normalizeUrl(item.url_fonte), rating=rank(item);let reason;
  if(!url||!/^https?:\/\//.test(url)||!item.fonte||!item.titolo_editoriale||!item.sintesi_editoriale)reason='incompleto';
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(item.data_fonte||'')||item.data_fonte<earliest||item.data_fonte>date)reason='data non idonea';
  else if(urls.has(url))reason='URL gia presente o segnalazione Maurizio';
  else if(rating.score<45)reason='rilevanza insufficiente o evento locale';
  else if(checkEditorialSimilarity(item.titolo_editoriale,existing))reason='duplicato editoriale';
  if(reason){excluded.push({title:item.titolo_editoriale,reason});continue;}
  ranked.push({...item,...rating});
 }
 ranked.sort((a,b)=>b.score-a.score||b.data_fonte.localeCompare(a.data_fonte)||a.url_fonte.localeCompare(b.url_fonte));
 const selected=[];
 for(const item of ranked){const url=normalizeUrl(item.url_fonte);let reason;
  if(urls.has(url)||checkEditorialSimilarity(item.titolo_editoriale,selected))reason='duplicato nella raccolta';
  else if(selected.length>=MAX)reason='oltre le cinque piu rilevanti';
  if(reason)excluded.push({title:item.titolo_editoriale,reason});else{selected.push(item);urls.add(url);}
 }
 return {selected,excluded,total:candidates.length};
}
module.exports={MAX,rank,selectCandidates};
