# Cruscotto editoriale COINSIEME

Interfaccia Airtable: https://airtable.com/appPqa952bdRrQJNI/pbdatROJ9veet1iKw
Tabella articoli: tbldu5S3r7ZppEF1y.

## Responsabilita
- CMS/Git: titolo, testo, immagini, autore, categoria, tipo e rubrica. I testi non sono duplicati in Airtable.
- Airtable: stato, data_pubblicazione, rilevanza_home, ordine_home, mantieni_in_evidenza_fino_al.
- id_cms corrisponde al nome del file: non modificarlo o rinominare file senza migrazione dedicata.
- I campi descrittivi sono aggiornati dal CMS e non vanno modificati in Airtable.

## Uso
1. Scrivere/salvare un nuovo articolo nel CMS. Il deploy lo registra in Airtable come bozza e non lo include sul sito.
2. Nel Cruscotto aprire Articoli COINSIEME e selezionare il record.
3. Impostare stato=pubblica e la data. Una data futura programma la disponibilita dal primo deploy utile successivo.
4. Scegliere principale/evidenza/normale/solo_archivio, ordine e scadenza eventuale. Scadenza vuota mantiene la priorita.
5. Attendere il workflow programmato esistente (22 e 23 UTC), oppure avviare manualmente Build e Deploy GitHub Pages in GitHub Actions. Anche i salvataggi CMS avviano il workflow.
6. Verificare il deploy e il link pubblico: pubblica e una decisione editoriale, non un'attestazione di pubblicazione completata.

Gli 86 articoli presenti al passaggio conservano le impostazioni iniziali. Nessuna modifica al flusso Notizie/Segnalazioni. Non aumentata la frequenza dei workflow.
Questa prima versione non ritira pagine gia generate: impostarle a bozza o a una data futura blocca la build, senza cancellare pagine o URL. Per escludere dalla home usare solo_archivio mantenendo pubblica.

## Garanzie tecniche
La sincronizzazione scrive soltanto metadati descrittivi dei record esistenti; i nuovi record sono bozze. Rilegge la tabella dopo le scritture. Duplicati, stati/date invalidi o snapshot mancanti/incoerenti fermano la build. Lo snapshot privato contiene hash dei file e scade dopo sei ore. In CI e obbligatorio, anche durante i deploy della rassegna.

Test: node --test scripts/articles-editorial.test.js scripts/article-home.test.js
Build: node scripts/refresh-home-editorial.js (richiede PAT), node scripts/build-cms.js, node scripts/build-hybrid-index.js.
I token restano nei segreti GitHub; non vengono inclusi nelle pagine pubbliche.
