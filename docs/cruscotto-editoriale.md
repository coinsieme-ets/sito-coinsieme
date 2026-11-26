# Cruscotto editoriale COINSIEME

Interfaccia Airtable: https://airtable.com/appPqa952bdRrQJNI/pbdatROJ9veet1iKw
Tabella articoli: tbldu5S3r7ZppEF1y.

## Responsabilita
- Articoli nuovi o programmati: documento completo e copertina nella fonte Airtable riservata, campo contenuto_riservato_json. Non salvarli nel CMS/Git pubblico prima della pubblicazione.
- CMS/Git: sorgenti storici gia pubblicati. Vedere [Calendario editoriale e promozione social](calendario-editoriale.md) per il flusso attuale.
- Airtable: stato, data_pubblicazione, programmato_il, autorizza_social, rilevanza_home, ordine_home, mantieni_in_evidenza_fino_al.
- id_cms corrisponde al nome del file: non modificarlo o rinominare file senza migrazione dedicata.
- I campi descrittivi derivano dal documento riservato o dal sorgente storico; modificare il documento sorgente per cambiare testo e metadati, e mantenere id_cms coerente con lo slug.

## Uso
1. Per un nuovo articolo creare il record in Airtable con stato=bozza e documento completo in contenuto_riservato_json. Conservare anche la copertina privatamente secondo la guida del calendario; non commettere testi o immagini delle bozze nel repository pubblico.
2. Nel Cruscotto aprire Articoli COINSIEME e selezionare il record.
3. Dopo approvazione impostare stato=pubblica, data_pubblicazione e programmato_il con data/ora e fuso coerenti. La disponibilita parte dal primo deploy utile successivo all’istante previsto. Impostare autorizza_social solo con consenso esplicito alla promozione.
4. Scegliere principale/evidenza/normale/solo_archivio, ordine e scadenza eventuale. Scadenza vuota mantiene la priorita.
5. Il workflow sync-rassegna controlla il calendario ogni 15 minuti, anche senza nuove notizie. In alternativa avviare Build e Deploy GitHub Pages. GitHub Actions puo subire ritardi: l’orario programmato e un embargo minimo.
6. Il controllo dopo il deploy verifica il link canonico e registra verificato_online_il. Solo gli articoli online autorizzati vengono inclusi nel registro pubblico per ChatGPT/Metricool; controllare anche pagina e immagine prima di programmare il post.

I sorgenti storici gia pubblicati mantengono il percorso CMS/Git. Il calendario si integra nel workflow esistente senza aggiungere uno scheduler o cambiare la grafica del sito.
Questa prima versione non ritira pagine gia generate: impostarle a bozza o a una data futura blocca la build, senza cancellare pagine o URL. Per escludere dalla home usare solo_archivio mantenendo pubblica.

## Garanzie tecniche
La sincronizzazione scrive soltanto metadati descrittivi dei record esistenti; i nuovi record sono bozze. Rilegge la tabella dopo le scritture. Duplicati, stati/date invalidi o snapshot mancanti/incoerenti fermano la build. Lo snapshot privato contiene hash dei file e scade dopo sei ore. In CI e obbligatorio, anche durante i deploy della rassegna.

Test: node --test scripts/articles-editorial.test.js scripts/article-home.test.js
Build: node scripts/refresh-home-editorial.js (richiede PAT), node scripts/build-cms.js, node scripts/build-hybrid-index.js.
I token restano nei segreti GitHub; non vengono inclusi nelle pagine pubbliche.
