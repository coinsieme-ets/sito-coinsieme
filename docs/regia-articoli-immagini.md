# Regia articoli e immagini news

Gli articoli sono gestiti nei JSON di content/articoli e nell'editor /admin, non in una tabella Airtable Articoli. L'editor espone rilevanza_home (principale/evidenza/normale/solo_archivio), ordine_home e mantieni_in_evidenza_fino_al. I contenuti esistenti senza campi restano normale, ordine 999, senza scadenza. Nessuna modifica al testo è necessaria.

Il blocco principale è la card grande della sezione Conoscenza della homepage. La graduatoria considera rilevanza, evidenza con scadenza attiva inclusiva, ordine crescente, data decrescente. Una scadenza superata elimina la precedenza principale/evidenza; solo_archivio resta sempre escluso dalla home. L'archivio mantiene tutti gli articoli. La ricompilazione giornaliera applica le scadenze al successivo deploy riuscito.

Le immagini news vengono recuperate a ogni build dalle pagine fonte: prima og:image, quindi twitter:image. Sono verificati HTTP, MIME, decodifica del file e dimensioni minime. Le copie locali hanno un nome ricavato dall'hash dei byte originali. Se mancano immagini valide, la fonte è irraggiungibile o la stessa immagine viene riutilizzata fra più news, compare assets/news/placeholder.svg. Nessun ripiego sulle immagini dell'archivio storico o sulle immagini di categoria.

Il report scratch/news-images.json registra pagina fonte, URL immagine originale, file mostrato, status e motivi del fallback; viene conservato nell'artifact GitHub news-image-verification. Le immagini sono rigenerate per ogni deploy e incluse nell'artefatto Pages, non nei commit. Un anno vecchio nel percorso dell'immagine non indica una selezione dall'archivio COINSIEME: si usa esclusivamente il metadato della pagina fonte corrente.

Il briefing salva anche briefing-outcome.json: candidati, esclusioni per motivo, selezionati, inseriti, destinatario, mittente configurato/effettivo, chiamata Resend, HTTP e message ID. Se non ci sono record idonei, HTTP e message ID restano null e il motivo è no_new_relevant_news.
