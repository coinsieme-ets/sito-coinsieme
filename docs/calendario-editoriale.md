# Calendario editoriale e promozione social

Il sistema integra la tabella privata **Articoli COINSIEME** e i workflow GitHub Pages esistenti. Non aggiunge un CMS, uno scheduler o una seconda banca dati.

## Fonte riservata

La tabella Airtable resta la fonte delle decisioni. `stato=bozza` impedisce l'uscita; `stato=pubblica` autorizza la pubblicazione alla data prevista. `programmato_il` contiene un istante ISO 8601 con fuso, coerente con `data_pubblicazione` in Europe/Rome. Se manca, gli articoli storici conservano il controllo per data. Il campo calcolato `stato_calendario` distingue bozza, approvato, programmato e pubblicato; quest'ultimo richiede `verificato_online_il`.

Titolo, autore, categoria, URL, sintesi e copertina sono nella stessa tabella. `contenuto_riservato_json` conserva il documento CMS completo delle nuove bozze e delle pubblicazioni programmate. Le immagini private possono essere incorporate nel JSON come `_private_image_base64` (JPEG compresso; rispettare il limite di lunghezza della cella Airtable). Il file JSON non deve essere aggiunto al repository pubblico. I contenuti storici già pubblicati continuano a essere letti da `content/articoli`.

La build importa i documenti privati in `scratch/private-editorial-articles.json`, escluso da Git e dall'artefatto Pages. La copertina privata viene materializzata in assets solo dopo lo scadere dell'embargo. Il registro completo è esportato come `scratch/registro-editoriale-riservato.json`: non è caricato come artifact né incluso nel sito. Contiene `id`, `title`, `scheduled_at`, `status`, `url`, `cover_image_url`, `description`, `category`, `social_authorized` per ogni articolo.

Non caricare bozze in branch, PR, allegati, artifact o cartelle del repository pubblico. Escludere una pagina dalla navigazione o usare noindex non costituisce riservatezza. Le copie storicamente già pubblicate nel repository richiedono una valutazione separata: la normale rimozione non cancella la storia Git.

## Registro pubblico

Indirizzo previsto dopo il deploy:

`https://www.coinsieme.it/assets/editoriale/registro-pubblico.json`

Struttura: `{ "schema_version": 1, "timezone": "Europe/Rome", "articles": [...] }`.

Ogni articolo contiene:

| Campo | Significato |
|---|---|
| id | Slug stabile |
| title | Titolo approvato |
| scheduled_at | Istante minimo di uscita, ISO 8601; null per lo storico senza ora |
| published_date | Data editoriale italiana |
| status | Sempre `pubblicato` nel registro pubblico |
| url | Collegamento canonico senza UTM |
| cover_image_url | Copertina ufficiale |
| social_image_url | Derivato JPEG per le piattaforme social |
| description | Sintesi approvata |
| category | Categoria tematica |
| social_authorized | Sempre true |
| promotion_key | `article:` seguito dallo slug; stabile anche dopo correzioni |
| content_revision | SHA256 del contenuto e dell'immagine per rilevare aggiornamenti |

Il registro non espone bozze, programmazioni future, identificativi Airtable, contenuti privati, esiti social o dati di accesso. Viene caricato nello stesso artefatto delle pagine: non diventa pubblico prima dell'articolo. Il consenso è indipendente dall'approvazione editoriale e predefinito a false.

## Aggiornamento automatico

`sync-rassegna.yml` controlla già ogni 15 minuti il sito. Il calendario è incluso nel confronto, anche se non ci sono nuove notizie nella rassegna. La costruzione è idempotente e riprende al successivo controllo se un'esecuzione viene ritardata. Anche `build-articoli.yml` aggiorna il registro a ogni deploy manuale o push.

Il controllo dell'ora avviene sul server durante la build, mai nel browser del lettore. Il controllo finale di sicurezza esistente rifiuta un artefatto basato su dati o codice superati. `check-editorial-privacy.js` controlla l'artefatto completo prima del caricamento, inclusi riferimenti anticipati e risorse delle bozze. Dopo il deploy si verifica l'URL canonico online prima di registrare la pubblicazione in Airtable.

GitHub Actions non garantisce un orario esatto: il cron può subire ritardi, cui si aggiungono costruzione e distribuzione. L'ora programmata è un embargo minimo, non un impegno di disponibilità al minuto. Un fallimento lascia online l'ultima versione valida; verificare gli esiti Actions in caso di mancata uscita.

## Procedura ChatGPT / Metricool

Brand verificato: Fondazione Coinsieme ETS, ID `7020957`, fuso Europe/Berlin (stesso orario civile di Roma).

1. Leggere il registro pubblico al momento di preparare i post. Una data presente nel calendario riservato non autorizza un'anticipazione.
2. Rileggere il record Airtable prima di programmare: `autorizza_social=true`, articolo ancora autorizzato, URL e immagine online con risposta valida. Un feed nella cache non sostituisce questo controllo.
3. Usare `promotion_key` e canale come chiave della singola promozione. Verificare i post Metricool già programmati e i campi Airtable `id_metricool_*`, `id_post_*`, `esito_*`, `url_post_*`, `pubblicato_il_*`. Non usare `content_revision` come autorizzazione a una seconda promozione.
4. Registrare l'intenzione nella stessa tabella e gestire un solo operatore alla volta. Dopo l'operazione salvare immediatamente l'ID Metricool; non confonderlo con l'ID del post social. In caso di timeout verificare il calendario prima di riprovare, perché la richiesta potrebbe essere stata accettata.
5. Usare `social_image_url` per il JPEG ufficiale, adattando testo e formato al canale. Gli UTM si aggiungono al post e non all'URL canonico nel registro.
6. Revoche successive all'invio a Metricool richiedono la cancellazione o modifica del post già programmato: togliere un articolo dal feed non cancella la coda Metricool.

Il sistema rende disponibili dati e controlli a ChatGPT, ma non crea da solo nuovi post Metricool né esegue ChatGPT periodicamente. Integrare il riferimento al feed nella regia social/automazione già usata dall'utente, senza creare una seconda regia. Per più operatori simultanei serve un blocco transazionale; il controllo manuale degli ID non equivale a una garanzia tecnica exactly-once.

## Responsabilità

Maurizio approva testi, immagini, date e consenso social. ChatGPT/Codex prepara i documenti privati, verifica la coerenza del calendario e mantiene il codice. GitHub Actions pubblica automaticamente i soli contenuti approvati e maturati. ChatGPT, nella regia social esistente, consulta il registro pubblico, verifica le autorizzazioni correnti e coordina Metricool.

Verifica locale: `node --test scripts/editorial-calendar.test.js scripts/articles-editorial.test.js scripts/homepage-state.test.js`. Prima del rilascio eseguire anche la suite richiesta dai workflow e il controllo dell'artefatto `_site`.
