# Schema Contenuti - COINSIEME ETS

## data/articoli.json
Array di oggetti con la seguente struttura:
- `titolo` (string): Titolo dell'articolo.
- `slug` (string): Identificativo URL (es. "titolo-articolo").
- `urlOriginale` (string): URL canonico del sito preesistente.
- `fileSorgente` (string): Nome del file HTML sorgente originale.
- `testoCompletoDisponibile` (boolean): `true` se il corpo del testo è completo, `false` se incompleto.
- `sintesi` (string): Sottotitolo o primo paragrafo.
- `autore` (string|null): Nome dell'autore, se dichiarato.
- `data` (string|null): Data di pubblicazione, se dichiarata.
- `immagine` (string|null): URL originale dell'immagine.
- `idImmagine` (string|null): Identificativo asset (es. IMG_1).
- `azioneImmagine` (string): `usare-immagine-originale`, `sostituire-in-futuro`, `attendere-verifica-fondazione`, `non-pubblicare-duplicato`, `memoria-storica-da-verificare`, `omettere-immagine`.
- `allegatiPDF` (string|null): URL di eventuali PDF allegati.
- `audio` (string|null): URL di eventuale audio collegato.
- `collegamentiEsterni` (string): Link presenti nel corpo originale.
- `statoTesto` (string): `testo-migrabile`, `testo-incompleto`, `testo-da-verificare`, `testo-da-correggere`.
- `statoComplessivo` (string): Stato finale di approvazione per la migrazione.
- `redirectPrevisto` (string): URL futuro (`/articoli/<slug>/index.html`).
- `nota` (string, opzionale): Note redazionali (es. "Rimuovere ChatGPT...").

## data/pubblicazioni.json
- `titolo`, `slug`, `tipologia`, `paginaSorgente`, `copertina`, `risorsa`, `autore`, `editore`, `anno`, `isbn`.
- `audiolibro` (boolean).
- `statoRisorsa`: `risorsa-locale-verificata`, `link-drive-da-verificare`, `risorsa-mancante`.
- `statoDiritti`: `da-verificare`, `dati-bibliografici-incompleti`.
- `statoMigrazione`: `migrabile-scheda-senza-download`, `migrabile-previa-verifica-link`.

## data/audio.json
- `contenuto`: Titolo identificativo.
- `paginaSorgente`: Riferimento HTML.
- `disponibilita`: `Drive` o `Locale`.
- `accessibilita`: `da verificare`, `non valutabile...`.
- `trascrizione`: Note testuali.
- `titolarita`: Diritti.
- `azioneProposta`: Azione per il generatore.
