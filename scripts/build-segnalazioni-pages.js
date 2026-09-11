'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {publicUrl}=require('./publish-segnalazioni');
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function shell(title,canonical,body){
  return '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<title>'+escape(title)+' | COINSIEME</title><link rel="canonical" href="'+escape(canonical)+'">'+
    '<link rel="stylesheet" href="/css/style.css"></head><body><header class="container" style="padding:24px 0">'+
    '<a href="/">Fondazione COINSIEME ETS</a></header><main class="container" style="max-width:900px;padding:32px 0 64px">'+body+
    '</main><footer class="container" style="padding:24px 0"><a href="/rassegna.html">Tutta la rassegna</a> · <a href="/">Torna alla homepage</a></footer></body></html>';
}
function page(item,id){
 return shell(item.titolo_editoriale,publicUrl(id),'<article data-segnalazione="'+id+'">'+
   '<p>Rassegna stampa · '+escape(item.categoria)+'</p><h1><a href="'+escape(item.url_fonte)+'" target="_blank" rel="noopener noreferrer">'+escape(item.titolo_editoriale)+'</a></h1>'+
   '<p>Pubblicazione su COINSIEME: <time datetime="'+escape(item.data_pubblicazione)+'">'+escape(item.data_pubblicazione)+'</time>'+
   (item.data_fonte?' · Data della fonte: <time datetime="'+escape(item.data_fonte)+'">'+escape(item.data_fonte)+'</time>':'')+'</p>'+
   '<p style="font-size:1.15rem;line-height:1.7;margin:24px 0">'+escape(item.sintesi_editoriale)+'</p>'+
   '<p>Fonte: '+escape(item.fonte)+'</p><p><a href="'+escape(item.url_fonte)+'" target="_blank" rel="noopener noreferrer">Leggi l’articolo sulla fonte originale</a></p></article>');
}
function build(root=path.join(__dirname,'..')){
 const items=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8'));
 const dir=path.join(root,'rassegna');fs.mkdirSync(dir,{recursive:true});
 const cards=[];
 for(const item of items){
  for(const id of item.segnalazioni||[]){
   if(!/^rec[a-zA-Z0-9]{14}$/.test(id))throw new Error('ID segnalazione non valido nel dataset');
   fs.writeFileSync(path.join(dir,id+'.html'),page(item,id));
   cards.push('<article class="rassegna-card" style="margin-bottom:24px"><h2><a href="/rassegna/'+id+'.html">'+escape(item.titolo_editoriale)+'</a></h2><p>'+escape(item.sintesi_editoriale)+'</p><p>Fonte: '+escape(item.fonte)+'</p></article>');
  }
 }
 fs.writeFileSync(path.join(root,'rassegna.html'),shell('Rassegna stampa','https://www.coinsieme.it/rassegna.html','<h1>Rassegna stampa</h1><p>Le segnalazioni pubblicate da COINSIEME, con i collegamenti alle fonti.</p>'+cards.join('\n')));
 const homepage=path.join(root,'index.html');
 let html=fs.readFileSync(homepage,'utf8');
 html=html.replace(/<p data-segnalazioni-archive[\s\S]*?<\/p>\s*/g,'');
 html=html.replace('<!-- CMS_RASSEGNA_SECTION_END -->','<p data-segnalazioni-archive class="container" style="padding:20px 0"><a href="/rassegna.html">Leggi tutte le segnalazioni nella rassegna stampa</a></p>\n<!-- CMS_RASSEGNA_SECTION_END -->');
 // Preserve legacy public anchors, without changing any already-published Airtable field.
 for(const item of items){
  if(!(item.segnalazioni||[]).length)continue;
  const {inspectPage}=require('./verify-publication');
  html=html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi,card=>
   inspectPage(card,item.url_fonte,item.titolo_editoriale)&&!/^<article[^>]*\sid=/.test(card)?
   card.replace('<article ','<article id="segnalazione-'+item.segnalazioni[0]+'" '):card);
 }
 fs.writeFileSync(homepage,html);
 console.log('Pagine rassegna generate: '+cards.length);
}
if(require.main===module)build();
module.exports={build,page};
