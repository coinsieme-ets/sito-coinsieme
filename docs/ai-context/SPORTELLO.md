# Sportello: catalogo e ascolto facoltativo

## Due percorsi distinti, entrambi pubblicati ma noindex

- [Catalogo corrente](https://www.coinsieme.it/anteprima-sportello/#esplora-servizi):
  nove categorie; consultazione libera, ricerca, filtri e informazioni espandibili.
- [Primo ascolto storico](https://www.coinsieme.it/sportello/): percorso
  dimostrativo separato. Non sostituirlo implicitamente al catalogo.

Il catalogo conserva anche un percorso facoltativo di ascolto; non richiedere
racconti personali per cercare un servizio. Entrambe le route mantengono
`noindex,nofollow`, referrer restrittivo e CSP con connessioni/form vietati.

## Architettura corrente

`anteprima-sportello/index.html` carica moduli vanilla in ordine esplicito.
`app/servizi.js` contiene le nove aree e 51 risorse base; non e' il conteggio
di tutti gli operatori distribuiti nei sottocataloghi. `orientamento.js`
seleziona le risorse; `esplora.js` rende categorie, ricerca, gruppi e conteggi.
`app.js`, `navigazione.js`, `risorse.js`, `territorio.js` supportano ascolto,
navigazione e dati di orientamento. Stili in `styles/`.

Moduli specifici: medici, continuita', televisite, diagnostica, farmacie,
residenziali, psicologia, fisioterapia, mobilita', consegne, socialita',
operatori domiciliari, Samaritans, EcoMobyProject, Ortopedia24ore e coabitazione.
I file `*-data.js` separano molti cataloghi dai renderer; alcuni moduli
storici mantengono i propri dati. Non introdurre una seconda banca dati.

49 file nel pacchetto corrente: le ultime due dipendenze sono
`coabitazione-data.js` e `coabitazione.js`. Non fissare questo conteggio
come invariante immutabile: aggiornarlo quando si approva un nuovo modulo.

## Decisioni vincolanti

- Nessuna diagnosi, inferenza dei bisogni o finto colloquio AI: la rilettura
  dell'ascolto riporta il testo dichiarato tramite textContent.
- Racconto solo in memoria/DOM, senza invio o storage; cancellazione alla
  chiusura, al cambio pagina e al ripristino dalla cache di navigazione.
- Introduzioni direttamente leggibili nel gruppo selezionato: niente doppia
  scheda introduttiva con titolo e comando Approfondisci ripetuti.
- Operatori, ambulatori e piattaforme restano espandibili. Riutilizzare un
  unico record nei diversi percorsi; verificare conteggi e deduplicazione.
- Distinguere sede da copertura, ADI da riabilitazione ex art. 26, servizi
  pubblici da privati, accreditamento da convenzione/disponibilita' SSR.
- Le disponibilita' di medici non sono dedotte da elenchi: filtri nominativi
  nascosti fino a dati attendibili. Il 116117 non sostituisce il 112.
- Le fonti e le date devono restare visibili; nessuna farmacia aperta adesso,
  tariffa o disponibilita' non verificata. Nessuna partnership presunta.

## Ultimo modulo: Abitare insieme

Unico record introduttivo `info-abitare`, due percorsi (offrire/cercare), cinque
riferimenti condivisi. Roma e' il filtro iniziale; Milano, Potenza e rete
nazionale sono distinti. Coabitazione significa casa condivisa, compagnia e
piccoli aiuti, non assistenza professionale o sanitaria. Nessuna raccolta di
annunci/recensioni/dati personali; accordi e responsabilita' restano esterni.
Covillaggio presenta problemi di raggiungibilita'; Convivicon non e' collegato
come accesso operativo. Disponibilita' e operativita' attuali da riconfermare.

## Verifiche e sviluppo successivo

Riferimenti: `scripts/anteprima-sportello.test.js`, `sportello.test.js`,
`service-presentation.test.js`, `coabitazione.test.js` e test dei moduli.
La suite verifica anche tutte le 511 selezioni non vuote delle nove categorie.
Provare filtri combinati, zero risultati, focus, tastiera, tel/mail/mappe e 390 px.
Il controllo HTTPS del dossier conferma l'integrita' dei 49 file correnti.

Le due pipeline Pages devono copiare ricorsivamente l'intera directory, non
un elenco parziale di JS. Le future pagine SEO informative richiedono un
progetto separato: non togliere noindex dal collaudo come scorciatoia.
