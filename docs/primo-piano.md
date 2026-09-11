# Selezione PRIMO PIANO

La card `focus-news` legge `content/rassegna/notizie-esterne.json`, lo stesso dataset che riceve le Segnalazioni Maurizio pubblicate. Prima di ogni deploy, `refresh-home-editorial.js` legge tramite GET i metadati dei corrispondenti record Notizie e prepara `scratch/home-editorial.json`. Questo overlay serve solo alla card principale: non importa nuove notizie, non scrive su Airtable e non cambia le altre sezioni.

Sono idonee solo notizie pubblica/pubblicata, non future, complete di titolo, fonte e URL, con posizione home_principale, home_evidenza o home_normale.

La precedenza è: home_principale senza scadenza o con scadenza ancora valida; altre evidenze con scadenza attiva; selezione ordinaria. Una scadenza passata termina anche la precedenza di home_principale. In ciascun gruppo prevale data_pubblicazione decrescente (ripiego data_fonte), poi ordine_editoriale crescente, priorita alta/media/bassa, infine ID lessicografico per rendere stabili le parità. Ordine e priorità non mantengono una notizia meno recente nella selezione ordinaria.

Se data_pubblicazione è vuota in Notizie viene conservata la data già presente nel dataset pubblicato. Un campo di evidenza svuotato in Airtable viene invece effettivamente rimosso nell'overlay.

Il workflow Build e Deploy GitHub Pages rilegge i metadati anche nelle esecuzioni programmate alle 22 e 23 UTC (una coincide con mezzanotte italiana in ciascuna stagione). Le scadenze sono inclusive e calcolate nel fuso Europe/Rome; il sito statico le recepisce al successivo deploy riuscito, soggetto ai tempi di GitHub Actions. Il workflow delle segnalazioni usa la stessa selezione a ogni pubblicazione. RSS resta separato.

Correzione iniziale: il vecchio home_principale di Domos è stato riportato a home_normale in Airtable. Non sono stati modificati testo, stato o metadati di pubblicazione delle segnalazioni già pubblicate.
