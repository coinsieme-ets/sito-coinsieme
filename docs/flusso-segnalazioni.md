# Pubblicazione delle segnalazioni

Il workflow ordinario è sync-rassegna.yml (Sincronizzazione Rassegna News da Airtable).
Controlla la base ogni 15 minuti, secondo la pianificazione GitHub Actions, e può essere
avviato manualmente o tramite gli eventi repository_dispatch già esistenti.
L'input facoltativo record_id limita il ciclo a una sola segnalazione. Il workflow
singolo richiama lo stesso flusso; non esiste un secondo percorso di conferma.

1. Legge tutte le pagine Airtable e seleziona esclusivamente stato = da_pubblicare.
2. Riutilizza il record Notizie corrispondente alla fonte o lo prepara senza duplicazioni.
3. Rifiuta titoli generici e dati insufficienti; gli errori di un record non approvano altri candidati.
4. Congela un manifest con i record del ciclo e prepara solo questi contenuti,
   mantenendo quelli già pubblici. Non promuove candidati RSS non segnalati.
5. Genera pagine permanenti /rassegna/RECORD_ID.html e archivio /rassegna.html:
   il limite delle tre schede in homepage non limita le notizie pubblicate.
6. Compila, verifica le schede e distribuisce l'artefatto su GitHub Pages nello stesso run.
7. Solo dopo il deploy confronta titolo, fonte, identificatore e canonical della pagina
   pubblica. Ritenta per la propagazione CDN; errori HTTP o contenuti non corrispondenti
   lasciano il record da_pubblicare.
8. Rilegge il record: se è già pubblicato o la fonte è cambiata, non scrive nulla.
   Altrimenti imposta pubblicato, la data odierna Europe/Rome e l'URL realmente verificato.
   Una successiva lettura API conferma i tre valori.
9. Conserva nel repository solo il dataset editoriale distribuito, con commit skip ci.
   Manifest ed esiti restano negli artifact del run.

Il workflow ha concorrenza seriale condivisa con i deploy, senza cancellare un ciclo
in corso. Un errore di deploy impedisce la conferma. Un ciclo senza record pendenti
non modifica Airtable e non esegue alcun deploy.

I record Segnalazioni già pubblicato sono sempre esclusi, inclusi quelli con dati
storici incompleti. Non si usa la data della fonte come data di pubblicazione.
url_articolo resta invariato; un alias verificato può risolvere un URL abbreviato.

## RSS separati

rss-candidates.yml raccoglie i feed, con soli permessi GitHub di lettura e senza
build, deploy o commit del sito. L'ingestione impone da_valutare/segnalata anche se
il candidato propone un altro stato. Il briefing legge i candidati e non esegue
la raccolta né il processo di pubblicazione delle segnalazioni.
L'audit schema è ora in sola lettura e non annulla le conferme di pubblicazione.

## Verifica

node --test scripts/verify-publication.test.js scripts/publish-segnalazioni.test.js

I test coprono l'ordine verifica/PATCH/rilettura, HTTP errati, schede mancanti o nascoste,
record già pubblicati, cambi di fonte durante il deploy, pagine oltre il limite home
e candidati RSS che tentano di auto-approvarsi.
