# Sito, contenuti e automazioni

## Architettura pubblicata

Sito statico su GitHub Pages, dominio HTTPS personalizzato. HTML/CSS/JS senza
framework frontend per Casa e Sportello. Pipeline Node 20; dipendenze bloccate
in package-lock.json, tra cui sharp e heic-convert. Nessun aggiornamento qui.

Cartelle: `content/articoli` per testi JSON; `content/rassegna` per dataset e
registri editoriali; `templates` per pagine; `scripts` per build/verifiche;
`assets`, `css`, `js` per risorse. `data` contiene anche materiali di migrazione
storica: non equivale interamente al catalogo attivo degli articoli.

Entrate principali: `/`, `/chi-siamo.html`, `/cosa-facciamo.html`,
`/domotica.html`, `/articoli.html`, `/rassegna.html`, Casa e Sportello.
Non dedurre l'esistenza di indici `/articoli/` o `/rassegna/`: gli indici
pubblici usati sono quelli .html; i sotto-percorsi ospitano singole pagine.

## Flusso articoli e homepage

`scripts/build-cms.js` genera pagine e archivio, homepage dinamica, rassegna e
SEO. `articles-editorial.js` lega i JSON alla tabella Articoli COINSIEME tramite
id_cms e produce uno snapshot validato. I testi restano nei JSON; la tabella
regola pubblicazione, date e priorita'. Non creare record o stati per prova.

`refresh-home-editorial.js`, `homepage-state.js`, `build-homepage.js` e
`preview/home-dinamica/build.js` costituiscono la catena della homepage.
**preview/home-dinamica e' anche sorgente di produzione**: non cancellarla
o escluderla dal repository solo perche' si chiama preview.

Conservare: Vivere meglio, insieme; copertina editoriale; data reale del
contenuto; orologio Europe/Rome distinto; accessi Casa/catalogo; notizie;
quattro progetti con stati reali, Trilogia di Vita non dichiarata avviata.
Crediti immagini: `assets/home-progetti/CREDITS.md`.

Selezione copertina: `preview/home-dinamica/selection.js` e `policy.json`.
Precedenza redazionale anche senza immagine, copertina testuale disponibile.
Evidenze senza scadenza: 30 giorni configurabili, salvo permanentIds espliciti.
Scadenza declassa la precedenza, non cancella articolo o data. Fallback recente
entro 14 giorni, altrimenti archivio dichiarato; nessuna falsa attualita'.

`homepage-state.js` firma il contenuto pubblico normalizzato: nessun deploy
periodico se cambiano solo metadati irrilevanti. Scadenze che modificano la
selezione sono variazioni reali. Non introdurre un secondo sistema editoriale.

## Rassegna e deduplicazione

Tabelle funzionali: Notizie, Segnalazioni Maurizio, Articoli COINSIEME.
Non tutte le bozze o proposte sono autorizzate alla pubblicazione. La pipeline
prepara e poi conferma i record realmente pubblicati. Non cambiare stati per
superare blocchi di ritiro, contenuto incompleto o duplicati ambigui.

`publish-rassegna.js`, `publish-segnalazioni.js`, `build-segnalazioni-pages.js`
e `verify-publication.js` governano il flusso distribuito. Altri script npm di
ingestione/sync esistono ma non vanno assunti come equivalenti agli step attivi.
Confrontare URL normalizzato e ID prima di creare candidati; una riacquisizione
non deve sovrascrivere stati, priorita' o decisioni editoriali.

Immagini: `news-images.js`, validazione MIME/decodifica/dimensioni e fallback;
allegati HTML non sono immagini. I report scratch sono privati/temporanei.
SEO: `build-seo.js`, `build-legacy-redirects.js` e relativi test conservano
canonical e compatibilita' storica. Non modificare URL o date per attirare traffico.

## Workflow verificati

| File in .github/workflows | Funzione e cautele |
|---|---|
| build-articoli.yml | Push main/manuale: test, snapshot, build, pacchetto, Pages |
| sync-rassegna.yml | Cron ogni 15 minuti, eventi e richiamo riutilizzabile: elabora variazioni reali e scadenze |
| publish-single-segnalazione.yml | Richiama sync con record_id; non un generatore parallelo |
| daily-briefing-mail.yml | Batch e mail separati; cron UTC filtrato su 06:30 italiane; npm ci prima dei test |
| rss-candidates.yml | Raccolta oraria in artifact; nessuna credenziale Airtable, nessuna pubblicazione |
| airtable-admin-migration.yml | Manuale: leggere azioni effettive, non inferirle dal nome; definito come audit in sola lettura |

I due deploy condividono concurrency group pages, queue max e nessuna
cancellazione in corso. Checkout main; controllo condiviso deploy-safety.js
confronta SHA e impronta dei dati editoriali usati. Artefatto obsoleto escluso,
ricostruzione con origine conservata e massimo due retry (tre tentativi).
Solo periodici superati possono essere saltati; push/manuali non accorpati.

Entrambi copiano ricorsivamente Casa e anteprima-sportello. Permessi actions:
write servono ai job che richiedono ricostruzioni; non allargare a caso permessi.

## Briefing: differenze importanti

`daily-briefing.js`, `briefing-selection.js`, `send-briefing-mail.js`: massimo cinque
candidati, controlli di provenienza/URL/ID, rilettura prima dell'invio, registro
giornaliero e idempotenza Resend. La modalita' preview **crea record reali**;
non e' una simulazione offline e non riceve la credenziale di invio.

Il batch automatico usa da_valutare + data_briefing; la selezione assistita
ricorrente richiede proposta/da_verificare. Non sono stati equivalenti:
la vista Briefing Oggi documentata filtra da_valutare. Coordinamento da
decidere senza sovrascrivere le decisioni della redazione. L'avvio tardivo
dell'assistente e' gia' stato osservato; un cron non garantisce da solo un'email
con le sue candidate. Nessun recupero o invio di prova autorizzato dal dossier.

Riferimenti storici: docs/briefing-quotidiano.md e docs/flusso-segnalazioni.md.
L'ultimo elenco di run include un sync fallito il 1 novembre alle 23:05 UTC,
seguito da deploy riuscito il 2 novembre. Causa non diagnosticata in questa
ricognizione: un successo successivo non certifica la risoluzione della causa.
