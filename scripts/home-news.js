'use strict';
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderHomeNews(items){
 const selected=items.slice(0,5);
 const rows=selected.map(x=>{const date=x.data_pubblicazione||x.data_fonte||'';return '<li><div class="news-meta"><time datetime="'+escape(date)+'">'+escape(date?new Date(date+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'')+'</time><span>'+escape(x.fonte||x.categoria)+'</span></div><a href="'+escape(x.url_fonte)+'" target="_blank" rel="noopener noreferrer">'+escape(x.titolo_editoriale||x.titolo_originale)+' <span aria-hidden="true">↗</span><span class="sr-only"> (fonte esterna, nuova scheda)</span></a></li>';}).join('');
 return '<section id="cosa-si-muove" class="home-news" aria-labelledby="rassegna-titolo"><div class="container"><div class="home-section-heading"><div><p class="home-eyebrow">Dalle fonti esterne</p><h2 id="rassegna-titolo">Aggiornamenti e notizie selezionate da COINSIEME</h2></div><a href="/rassegna.html">La rassegna completa →</a></div>'+(rows?'<ul class="home-news-list" tabindex="0" aria-label="Notizie selezionate, elenco scorribile">'+rows+'</ul><p class="news-note">Scorri l’elenco per leggere le altre notizie. Date riferite alla pubblicazione nella rassegna.</p>':'<p>Nessuna notizia selezionata al momento.</p>')+'</div></section>';
}

function selectHomeNews(items,now=new Date()){
 const today=typeof now==='string'?now.slice(0,10):new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(now);
 const time=typeof now==='string'?Date.parse(now+'T12:00:00Z'):now.getTime();
 const day=x=>String(x||'').slice(0,10);
 const pin=x=>{const value=String(x.mantieni_in_evidenza_fino_al||'');return /^\d{4}-\d{2}-\d{2}$/.test(value)?value>=today:Number.isFinite(Date.parse(value))&&Date.parse(value)>=time;};
 const order=x=>Number.isFinite(Number(x.ordine_editoriale))&&x.ordine_editoriale!==''?Number(x.ordine_editoriale):999;
 const priority={alta:0,media:1,bassa:2};
 const seen=new Set();
 return (items||[]).filter(x=>['pubblica','pubblicata'].includes(x.stato)&&['home_principale','home_evidenza','home_normale'].includes(x.posizione_sito||'home_normale')&&
  day(x.data_pubblicazione||x.data_fonte)<=today&&/^https?:\/\//i.test(x.url_fonte||'')&&(x.titolo_editoriale||x.titolo_originale)&&x.fonte)
 .sort((a,b)=>Number(pin(b))-Number(pin(a))||day(b.data_pubblicazione||b.data_fonte).localeCompare(day(a.data_pubblicazione||a.data_fonte))||
  order(a)-order(b)||(priority[a.priorita]??1)-(priority[b.priorita]??1)||String(a.id).localeCompare(String(b.id)))
 .filter(x=>{const key=require('./verify-publication').sourceUrl(x.url_fonte);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,5);
}

module.exports={renderHomeNews,selectHomeNews};
