'use strict';
function render({cover,coverImage,meta,external,escape,articleCards,news,searchMarkup,homeIcon,serviceIcon}){
  const needs=[
    ['/anteprima-sportello/#cerca=domicilio/ambito/domicilio','Aiuto a domicilio','Assistenza, infermieri e sostegno quotidiano'],
    ['/anteprima-sportello/#cerca=mobilita/ambito/mobilita','Spostamenti e accompagnamento','Raggiungere visite, servizi e luoghi di incontro'],
    ['/casa-che-si-prende-cura/','Autonomia e sicurezza in casa','Adattamenti, ausili e tecnologie semplici'],
    ['/anteprima-sportello/#cerca=socialita/ambito/socialita','Incontri e vita di quartiere','Cultura, sport e occasioni per stare insieme']
  ];
  const newsItems=news.map(x=>`<li>${meta(x)}<h4><a href="${escape(x.url)}"${external(x)}>${escape(x.title)}${external(x)?'<span class="sr-only"> (fonte esterna, nuova scheda)</span>':''}</a></h4></li>`).join('');
  return `<main id="main-content" tabindex="-1">
    <section class="container community-intro" aria-labelledby="welcome-title">
      <p class="eyebrow">Fondazione COINSIEME ETS · Roma Est</p>
      <h1 id="welcome-title">Vivere meglio, insieme</h1>
      <p class="community-lead">Informazioni e risorse per vivere con maggiore autonomia a Roma Est: servizi, soluzioni per la casa e opportunità di partecipazione.</p>
      <p class="community-territory">A partire dai Municipi V e VI. Nelle schede trovi il territorio di riferimento di ogni servizio.</p>
      <nav class="community-needs" aria-label="Da che cosa vuoi iniziare?"><ul>${needs.map(([href,title,text])=>`<li><a href="${href}"><strong>${title}</strong><span>${text}</span><span class="community-arrow" aria-hidden="true">→</span></a></li>`).join('')}</ul></nav>
    </section>
    <section class="container community-tools" aria-label="Due strumenti per la vita quotidiana">
      <article class="community-tool" aria-labelledby="community-sportello"><div class="community-tool-heading">${serviceIcon}<p class="eyebrow">Orientarsi tra servizi e opportunità</p></div><h2 id="community-sportello">Lo Sportello COINSIEME</h2><p>Trova riferimenti per l’assistenza, gli spostamenti e la vita di quartiere. Puoi consultare il catalogo senza raccontare la tua situazione.</p><a class="tool-link" href="/anteprima-sportello/#esplora-servizi">Cerca un servizio <span aria-hidden="true">→</span></a><p class="community-note">Per requisiti, costi e disponibilità, contatta il servizio indicato nella scheda.</p></article>
      <article class="community-tool community-house" aria-labelledby="community-casa"><div class="community-tool-heading">${homeIcon}<p class="eyebrow">Piccoli cambiamenti, più autonomia</p></div><h2 id="community-casa">La Casa che si prende cura</h2><p>Esplora le stanze e scopri ausili, adattamenti e tecnologie che possono alleggerire i gesti di ogni giorno.</p><a class="tool-link" href="/casa-che-si-prende-cura/">Esplora le stanze <span aria-hidden="true">→</span></a><p class="community-note">Le soluzioni vanno scelte in base alla persona e alla casa: non tutte richiedono una ristrutturazione.</p></article>
    </section>
    <div class="container community-search"><details><summary>Cerchi un nome o una parola? Cerca nel sito</summary>${searchMarkup}</details></div>
    <section class="container community-editorial" aria-labelledby="community-editorial-title"><div class="section-heading"><div><p class="eyebrow">Storie, idee e diritti</p><h2 id="community-editorial-title">Per capire e partecipare</h2></div><a href="/articoli.html">Tutti gli articoli →</a></div>
      <article class="cover" data-cover="${escape(cover.id)}">${coverImage}<div class="cover-shade"></div><div class="cover-label">${escape(cover.reason)}</div><div class="cover-copy">${meta(cover)}<h2><a href="${escape(cover.url)}"${external(cover)}>${escape(cover.title)}</a></h2><p>${escape(cover.summary)}</p><a class="cover-link" href="${escape(cover.url)}"${external(cover)}>Leggi ${cover.kind==='news'?'la notizia':'l’articolo'} →${external(cover)?'<span class="sr-only"> (fonte esterna, nuova scheda)</span>':''}</a></div></article>
      <div class="updates-grid"><div class="articles-column"><h3>Le riflessioni di COINSIEME</h3>${articleCards.join('')}</div><div class="news-column"><div class="column-heading"><h3>Notizie e informazioni utili</h3><a href="/rassegna.html">Tutta la rassegna →</a></div><ul class="news-list">${newsItems}</ul></div></div>
    </section>
    <section class="contribute-callout" aria-labelledby="contribute-home-title"><div class="container"><div><p class="eyebrow">La tua esperienza può aiutare gli altri</p><h2 id="contribute-home-title">Partecipa a COINSIEME</h2><p>Segnala un servizio, condividi un’esperienza o proponi un articolo. Facciamo crescere questo spazio, insieme.</p></div><a href="/contribuisci.html">Scopri come partecipare →</a></div></section>
    <section class="container community-contact" aria-labelledby="community-contact-title"><div><h2 id="community-contact-title">Vuoi contattare la Fondazione?</h2><p>Per informazioni su COINSIEME o per una segnalazione, scrivi alla segreteria.</p><p class="community-note">La Fondazione non gestisce le prenotazioni dei servizi elencati e non è un canale di emergenza.</p></div><div class="community-contact-links"><a href="mailto:segreteria@coinsieme.it">Scrivi alla segreteria</a><a href="/contatti.html">Contatti e WhatsApp →</a></div></section>
    <section class="community-foundation" id="progetto" aria-labelledby="community-foundation-title"><div class="container"><div><h2 id="community-foundation-title">La Fondazione, le esperienze e i progetti</h2><p>Le attività di COINSIEME, il patrimonio della cooperazione sociale e le proposte in sviluppo hanno uno spazio dedicato.</p></div><a href="/cosa-facciamo.html">Conosci attività e progetti →</a></div></section>
  </main>`;
}
module.exports={render};
