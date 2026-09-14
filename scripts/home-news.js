'use strict';
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderHomeNews(items){
 const selected=items.slice(0,5);
 const rows=selected.map(x=>{const date=x.data_pubblicazione||x.data_fonte||'';return '<li><div class="news-meta"><time datetime="'+escape(date)+'">'+escape(date?new Date(date+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'')+'</time><span>'+escape(x.fonte||x.categoria)+'</span></div><a href="'+escape(x.url_fonte)+'" target="_blank" rel="noopener noreferrer">'+escape(x.titolo_editoriale||x.titolo_originale)+' <span aria-hidden="true">↗</span><span class="sr-only"> (fonte esterna, nuova scheda)</span></a></li>';}).join('');
 return '<section id="cosa-si-muove" class="home-news" aria-labelledby="rassegna-titolo"><div class="container"><div class="home-section-heading"><div><p class="home-eyebrow">Dalle fonti esterne</p><h2 id="rassegna-titolo">Aggiornamenti e notizie selezionate da COINSIEME</h2></div><a href="/rassegna.html">La rassegna completa →</a></div>'+(rows?'<ul class="home-news-list" tabindex="0" aria-label="Notizie selezionate, elenco scorribile">'+rows+'</ul><p class="news-note">Scorri l’elenco per leggere le altre notizie. Date riferite alla pubblicazione nella rassegna.</p>':'<p>Nessuna notizia selezionata al momento.</p>')+'</div></section>';
}
module.exports={renderHomeNews};
