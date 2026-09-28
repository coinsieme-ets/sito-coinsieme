# Prima integrazione locale Sportello
Riferimento: PROGETTO_TECNICO_SPORTELLO_COINSIEME.md e V1 storica 121d2816c8d94f9c76bf11043d7efa45b1731d84. Repository storico e tag non modificati.
Adattamento minimo vanilla del percorso Ascoltare, Comprendere, Confermare, con header/footer e stile del sito. Nessuna nuova dipendenza.
Comprendere significa rileggere fedelmente esclusivamente le dichiarazioni: nessuna AI, diagnosi, inferenza o attribuzione di bisogni.
Il racconto libero facoltativo è mantenuto solo nel DOM, mostrati tramite textContent e cancellati al termine, alla navigazione, pagehide e al ripristino dalla cache di navigazione. Nessun database, storage, invio, analytics o servizi esterni per il racconto. CSP vieta connessioni e invii di form. Font del sito restano disponibili; non ricevono il racconto.
Dopo la conferma il percorso offre un primo orientamento basato sulle scelte della persona: non viene aperto alcun caso o contattato un operatore.
Accessi: Da dove iniziare in homepage e richiamo secondario Persone e famiglie.
Route inclusa esplicitamente nel confezionamento; sitemap legge la route ma rispetta noindex della fase dimostrativa. Non rendere indicizzabile prima della valutazione del servizio.
Nessun commit, push o deploy in questa fase. Modifiche AOI precedenti mantenute separate.

## Primo livello di orientamento
Dopo la conferma si possono scegliere da zero a tre aree, senza preselezioni. La scelta non deriva dal racconto.
Il catalogo locale sportello/app/orientamento.js espone sei aree ordinate; relazioni-solitudine distingue anche la solitudine scelta da quella vissuta come ostacolo, senza interpretare la persona.
La schermata finale mostra le aree e 2–4 URL distinti: prima le destinazioni principali, poi gli accessi alternativi indicati come fallback, con un massimo di due risorse associate a ciascuna area. Il catalogo attuale contiene quattro pagine esistenti. La disponibilità è verificata localmente nei test, senza richieste HTTP dal browser; il selettore supporta l'esclusione di risorse non disponibili ma non pretende di rilevare guasti di rete in tempo reale.
Senza scelte si presentano Persone e famiglie e l'archivio Articoli, senza attribuire bisogni.
Le card sono checkbox native con etichette, stato di selezione e avviso del limite. Le immagini allegate sono decorative, ottimizzate in WebP; le scene del riferimento sono inquadrate in CSS e i testi sono HTML.
Il fallback finale rimanda a /contatti.html, senza parametri, testo precompilato o invio del racconto; è esplicito che non è un servizio di emergenza né garantisce risposta immediata.
Rivedere/correggere il racconto invalida la conferma; correggerlo azzera le scelte precedenti. Termine, navigazione e cache avanti/indietro cancellano anche scelte e risorse.
Nessuna modifica a privacy, sitemap, noindex, workflow o documenti editoriali/AOI.

## Allineamento alle specifiche 01–07 (28 settembre 2026)
Sei schermate: introduzione, perimetro, racconto libero, rilettura/conferma, aree, risorse. La slide 07 è un riferimento tematico. Si riutilizzano header, footer, fotografie e componenti esistenti, senza importare loghi o menu alternativi delle slide.
`app/risorse.js` contiene aree, titoli, descrizioni, URL, tipologia, territorio ed ente; `app/orientamento.js` contiene solo la selezione. Massimo tre aree scelte, due risorse per area e quattro complessive, senza duplicati. Il catalogo comprende pagine del sito: le risorse territoriali non sono ancora disponibili.
La rilettura è il testo originale, mostrato come testo semplice: non è una sintesi AI o una valutazione simulata. Non esistono operatori, messaggistica integrata o invii. Il fallback apre soltanto i contatti del sito, senza trasferire il racconto.
Anteprima `noindex,nofollow`, esclusa dalla sitemap. Nessuna modifica al codice news, Airtable, AOI o alle automazioni editoriali.

### Verifiche locali finali
- Build completa riuscita; Sportello escluso dalla sitemap con noindex,nofollow.
- 108 test Node superati.
- 165 verifiche browser sui tre casi guida e viewport desktop 1440, tablet 820, mobile 390; nessun invio del racconto, nessuna persistenza, correzione e reset verificati.
- Controllo ripetibile: avviare un server statico del repository e lanciare `node scripts/sportello-browser-check.js` con Playwright disponibile; `SPORTELLO_URL` e `SPORTELLO_QA_DIR` sono facoltativi.
- Inclusione della cartella sportello autorizzata anche nel pacchetto distribuito da sync-rassegna.yml. La logica news è intatta; entrambi i workflow distribuiscono la stessa cartella.
