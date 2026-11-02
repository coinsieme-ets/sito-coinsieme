# La Casa che si prende cura

Pagina reale: [Casa](https://www.coinsieme.it/casa-che-si-prende-cura/).
Identita' di repository e deploy: [README](README.md), non le vecchie copie.

## Finalita' e componenti

Orientamento su autonomia quotidiana, ausili e domotica assistiva; non vendita,
installazione, valutazione clinica o servizio di soccorso erogato da COINSIEME.

- `casa-che-si-prende-cura/index.html`: contenuto iniziale leggibile senza JS,
  sette ambienti, 33 schede, accessi e percorsi. H1 e canonical da preservare.
- `house-data.js`: `CASA_PREVIEW_DATA`, dati delle soluzioni e associazioni
  immagini. Il nome storico PREVIEW non implica che la pagina sia solo locale.
- `casa.js`: filtro degli ambienti, 12 hotspot, pannelli di approfondimento,
  percorsi guidati, sei azioni di percorso e tre simulazioni con ripristino.
- `casa.css`, `assets/`: pianta, immagini e resa responsive. Totale 19 file.

Le tre simulazioni riguardano illuminazione, tapparella e chiamata di aiuto.
Sono dimostrazioni locali: nessun apparecchio controllato o soccorso attivato.
Le immagini dimostrative/generated sono etichettate, non prodotti certificati.

## Decisioni da conservare

- Title SEO: `Casa intelligente e domotica assistiva | COINSIEME`.
  H1 e URL canonico invariati; dati strutturati WebPage coerenti.
- Denominazioni approvate: Tapparelle elettriche e tende motorizzate;
  Comandi vocali e pulsanti semplificati; Chiamata di aiuto e telesoccorso.
- Una serratura smart non coincide con la motorizzazione della porta.
  Salvavita anziani e' un'espressione comune, non una definizione tecnica
  univoca di telesoccorso o garanzia di intervento.
- Conservare compatibilita', batterie, accesso alternativo, privacy,
  comandi fisici accessibili e limiti del rilevamento cadute.
- Le tre simulazioni devono funzionare anche dopo filtro/apertura/chiusura,
  con reset coerente, focus visibile e movimento ridotto.

## Prove e prosecuzione

Test di riferimento: `scripts/casa-che-si-prende-cura.test.js`,
`scripts/casa-seo.test.js`, `scripts/casa-seo-2c.test.js` e test di confezionamento.
Le asserzioni verificano esplicitamente 33 schede, 7 ambienti e 12 hotspot.
Il controllo HTTPS del dossier ha confrontato tutti i 19 file pubblicati.

Per modifiche future confrontare conteggi e ID, eseguire i test pertinenti,
poi provare tastiera, smartphone a 390 px e azioni/ripristino delle tre demo.
Non basta controllare uno screenshot. Screen reader e smartphone reali
richiedono una verifica dedicata; non dichiarare certificazioni di accessibilita'.

Homepage e pagina `domotica.html` sono accessi alla Casa. I rimandi dagli
articoli devono sopravvivere alla build: non modificare solo l'HTML generato.
L'approvazione di una scheda non autorizza aggiornamenti editoriali generali.

## Limiti e questioni aperte

Le indicazioni non sostituiscono la verifica individuale di un ausilio o di
un impianto. Nessuna disponibilita' commerciale e' certificata dal dossier.
Non confondere questa pagina pubblicata con le bozze `preview/` presenti in
vecchie worktree. Non importare il Quartiere per completare la Casa.
