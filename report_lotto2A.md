# Rapporto di Collaudo Lotto 2A (Generazione Preview)

## 1. Architettura e Motore di Generazione
Il motore di generazione statica (`scripts/genera-pagine.js`) è stato riscritto per rispettare rigorosamente le logiche approvate: non inserisce dati fittizi e non assume il tipo di file immagine se non referenziato nella mappa.
- I campi autore e data sono implementati come blocchi condizionali `{{AUTORE_HTML}}` e `{{DATA_HTML}}` per evitare fallback scorretti.
- Le immagini referenziano dinamicamente la mappa validata, con assegnazione del nome stabile basato sull'ID.
- Le risorse esterne non verificate (es. Google Drive per le pubblicazioni) vengono esplicitamente neutralizzate durante la generazione HTML, sostituendole con un avviso formale non cliccabile senza perdere l'URL di tracciamento nel JSON.
- I residui editoriali di Site123 (es. la dicitura "Condividi", i link vuoti social) adiacenti alle date sono stati purgati globalmente senza intaccare le funzioni di condivisione native del nuovo template.
- Per prevenire l'overflow orizzontale in elementi testuali anomali (es. indirizzi email lunghi senza spazi), il generatore inietta preventivamente istruzioni di stile CSS `word-break` nel wrapper del corpo testuale, operando senza alterare i file nativi del prototipo.
- Nessun Node runtime o file zip è presente nel tree (`C:\Users\Utente\.gemini\antigravity\scratch\coinsieme-proto`). I moduli Node.js (compresi Puppeteer-core) sono stati installati ed eseguiti da percorsi esterni isolati.

## 2. Statistiche d'Estrazione (Conservazione lavoro valido)
L'estrazione ha correttamente prelevato i corpi degli articoli pre-sanificati ed esteso la logica anche per le pubblicazioni. I nuovi conteggi del validatore certificano:
- **Articoli con corpo estratto:** 83
- **Articoli senza corpo:** 5
- **Articoli immediatamente generabili secondo gli stati editoriali:** 76
- **Articoli con corpo ma bloccati per altre verifiche:** 7
- **Totale bloccato dalla generazione:** 12
- **Pubblicazioni con corpo:** 8 (estratte e bonificate dai markup Site123)
- **Pubblicazioni bloccate:** 0

## 3. Dati Tecnici dell'Ambiente
A seguito dell'espulsione del runtime Node e di Node_Modules dal tree, l'albero di progetto contiene:
- **Numero File:** 79
- **Dimensione complessiva:** 44.5 MB

Confronto Hash (Integrità file base conservati senza modifiche):
*   `index.html`: `51D61677744AA6B60FC0A51E52590409A12E683979E68633FAA8CDF20864498E`
*   `articoli.html`: `019C4317FBF274D44197C3612142D4CA7CD441955D2259BF84EF1C1C8C5E9082`
*   `articolo.html`: `C5EBB54C5CBB6E04538457AF23B11ABBFC9797718C5F57B148B00D450E42FC1B`
*   `css/style.css`: `F6A2FCD3F054736A604AE677EDAA4862C6C85ECE36483CB6E5EF2BC572829628`
*   `js/main.js`: `FC4F5231B87D84442748E5DBCA77495057CACC040A17F49AA9DFF21FBD0671D9`

## 4. Collaudo del Generatore
**Comandi eseguiti (percorsi Node esternalizzati):**
```bash
..\node-v20.11.1-win-x64\node.exe scripts\genera-pagine.js --type articolo --slug 15-milioni-di-euro-per-la-digitalizzazione-del-terzo-settore --output build-preview
..\node-v20.11.1-win-x64\node.exe scripts\genera-pagine.js --type pubblicazione --slug 70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook --output build-preview
```

**Output integrale Generatore (Somma dei due log):**
```
Pagine generate: 1, Errori: 0
Pagine generate: 1, Errori: 0
```

Le due anteprime prodotte si trovano in:
- `build-preview/articoli/15-milioni-di-euro-per-la-digitalizzazione-del-terzo-settore/index.html`
- `build-preview/pubblicazioni/70-e-percorsi-di-vita-e-sguardi-al-futuro-ebook/index.html`

## 5. Esito Validatore
**Comando eseguito:** `..\node-v20.11.1-win-x64\node.exe scripts\valida-dati.js`

**Output integrale Validatore:**
```
Validazione superata.
Articoli con corpo estratto: 83
Articoli senza corpo: 5
Articoli immediatamente generabili secondo gli stati editoriali: 76
Articoli con corpo ma bloccati per altre verifiche: 7
Totale bloccato dalla generazione: 12
Pubblicazioni con corpo: 8
Pubblicazioni bloccate: 0
Pagine generate: 2
Risorse verificate: 2
```
*Zero placeholder sfuggiti, zero link ChatGPT attivi, zero link Drive per risorse non verificate, zero residui testuali "Condividi" di Site123, e file validamente codificati in UTF-8 senza BOM.* L'esito della neutralizzazione della risorsa Drive nella pubblicazione è andato a buon fine, sostituendo l'URL con una nota formale e azzerando le ricorrenze residue del dominio esterno.

## 6. Collaudo Visivo (Microsoft Edge Headless / CDP)
Avviando un server locale (`express`) è stato effettuato un collaudo mobile con Microsoft Edge forzando le emulazioni nativamente via Chrome DevTools Protocol (`Emulation.setDeviceMetricsOverride`). Prima dello screenshot, l'emulatore esegue uno scorrimento all'inizio della pagina (`window.scrollTo(0,0)`) per garantire una cattura conforme partendo dall'intestazione.

**Percorsi dei nuovi screenshot (375px reali):**
*   `scratch/screenshots/collaudo-lotto2A/articolo-375px-reale.png`
*   `scratch/screenshots/collaudo-lotto2A/pubblicazione-375px-reale.png`

Le **dimensioni fisiche** dei file immagine generati corrispondono esattamente a 375x900 pixel.

**Risultati HTTP e Metriche Mobile Effettive (Viewport 375px):**
- **Risorse Statiche (CSS, JS):** Trovate ed evase correttamente in locale (`HTTP 200` per `style.css` e `main.js`). 
- **Immagini Rotte / Placeholder visivi:** 0 trovate su 100% dei cicli, nessun `CONTENUTO PROVVISORIO` in rendering.
- **Metriche Layout 375px:** 
  - `innerWidth: 375px`
  - `document.documentElement.scrollWidth: 375px`
  *(Rigido controllo dell'assenza di overflow orizzontale, garantito dalle restrizioni e dal rispetto dei limiti architetturali)*
- Il pulsante hamburger è visibile nel layout catturato, sebbene il mobile menu non disponga di logiche javascript complesse all'interno dell'anteprima statica.

## 7. Elenco File Creati/Modificati nel Lotto 2A
*   `templates/articolo-template.html` (Modificato - introduzione nuovi segnaposti HTML opzionali)
*   `templates/pubblicazione-template.html` (Modificato - introduzione nuovi segnaposti HTML opzionali)
*   `scripts/build-json.js` (Modificato - integrato parsing pubblicazioni)
*   `scripts/genera-pagine.js` (Riscritto - restrizioni, neutralizzazione Drive, correzione word-break, sanificazione stringhe Site123)
*   `scripts/valida-dati.js` (Riscritto - conteggi analitici su 83 corpi, validazione blocco risorse non verificate, blocco residui Site123)
*   `scripts/collaudo-visivo.js` (Creato - testing CDP puro per metriche vere mobile 375x900 e scrollTo(0,0))
*   `report_lotto2A.md` (Creato/Aggiornato con tutte le correzioni documentate)

**Conferma Finale:** I cinque file consolidati (`index.html`, `articoli.html`, `articolo.html`, `css/style.css`, `js/main.js`) non sono stati alterati e corrispondono perfettamente al backup di inizio fase.

Il Lotto 2A è stato ora riportato all'aderenza tecnica richiesta ed è formalmente concluso. L'esecuzione è stata arrestata senza avviare la generazione massiva (Lotto 2B).
