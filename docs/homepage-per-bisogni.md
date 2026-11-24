# Homepage per bisogni

Revisione approvata il 24 novembre 2026.

Il generatore di produzione scripts/build-homepage.js attiva community:true nel renderer condiviso preview/home-dinamica/build.js. Le due pipeline Pages continuano a utilizzare questo generatore attraverso build-cms.js.

La composizione si trova in community-layout.js e gli stili aggiuntivi in community.css. Il foglio viene copiato nel pacchetto assets/home-dinamica e referenziato con hash per aggiornare la cache.

Ordine: quattro accessi pratici, Sportello e Casa, ricerca facoltativa, copertina e contenuti editoriali, partecipazione, contatti e richiamo alla Fondazione. Progetti e patrimonio storico sono descritti in cosa-facciamo.html. Il vecchio ancoraggio #progetto resta valido.

La selezione editoriale, lo stato pubblico firmato, le fonti, le date e le protezioni contro pubblicazioni premature non cambiano. Nessun intervento su Iubenda o nuovi strumenti di tracciamento.

I collegamenti generali ad assistenza domiciliare e mobilita aprono i filtri delle rispettive categorie. Le schede e i cataloghi non sono modificati.

Controlli: suite offline completa, build ripetuta e pacchetti Pages, validazione dello stato editoriale, ricerca, tastiera e layout a 320, 390 e 1280 px.
