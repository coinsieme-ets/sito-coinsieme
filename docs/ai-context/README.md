# COINSIEME: dossier tecnico condiviso tra AI

**Rilevazione: 2 novembre 2026.** Condivisione autorizzata solo sulla branch
documentale; nessun merge su main o deploy autorizzato.
Branch: `docs/ai-context-20261102`. Base verificata su GitHub:
`36af2016ff7e460b6db70815563f85825798e0b7`.

## Iniziare da qui

Scopo: evitare ricostruzioni ripetute e lavoro duplicato tra agenti. Questo e'
un punto di ingresso, non un nuovo archivio editoriale o un nuovo software.
Aprire anche [AGENTS.md](../../AGENTS.md). In un client che non legge AGENTS.md
automaticamente, indicare esplicitamente questi due file nel primo incarico.

| Progetto | Stato verificato | Approfondimento |
|---|---|---|
| Sito istituzionale | GitHub Pages, dominio HTTPS; homepage dinamica e quattro progetti | [Sito ed editoria](SITE-AND-EDITORIAL.md) |
| Casa che si prende cura | Online, 19 file; 33 schede, 12 hotspot, 7 ambienti, 3 simulazioni | [Casa](CASA.md) |
| Sportello servizi e ascolto | Online sotto due route distinte, entrambe noindex | [Sportello](SPORTELLO.md) |
| Quartiere, Municipio V | Prototipo locale in altra worktree; non nel pacchetto Pages | [Quartiere e laboratorio](QUARTIERE-AND-LAB.md) |
| Primo Ascolto / Collaudo Empatico della piattaforma | Materiali locali individuati; repository e deploy non accertati | [Quartiere e laboratorio](QUARTIERE-AND-LAB.md) |
| Articoli, rassegna, briefing | Pipeline Node/Airtable/Pages e briefing separato | [Sito ed editoria](SITE-AND-EDITORIAL.md) |

## Che cosa e' stato verificato

- Identita' Git delle due copie segnalate, worktree di rilascio e copia
  documentale: vedere [mappa dei repository](REPOSITORIES.md).
- Ultimo deploy Pages rilevato: run **41378058388**, deployment **7482847899**,
  successo il **2 novembre alle 02:30:40 UTC (03:30:40 italiane)**, SHA base
  `36af201`. Il precedente rilascio funzionale era `ad15a8d`, run 41308684725.
- HTTPS: homepage, rassegna.html, articoli.html, sitemap.xml rispondono 200.
  Confrontati tutti i **49 file Sportello** e i **19 Casa** con i sorgenti
  approvati: identici, normalizzando solo CRLF/LF nei testi.
- La modifica da `ad15a8d` a `36af201` riguarda soltanto
  `content/rassegna/notizie-esterne.json`, non Casa o Sportello.
- La suite del rilascio `ad15a8d` ha superato 262 test su Ubuntu. Le ulteriori
  prove eseguite per questo dossier sono registrate in [operazioni](OPERATIONS.md).

## Gerarchia delle evidenze

1. Codice e workflow del commit indicato + stato di deployment + HTTP reale.
2. Test eseguiti, con ambiente e data; non equivalgono a certificazione WCAG.
3. README e rapporti storici: utili, ma non prova di operativita' attuale.
4. Storia della chat: orientamento, mai unica prova di un rilascio.

In particolare `docs/regia-articoli-immagini.md` descrive anche una fase
precedente alla regia Airtable degli articoli. Non applicarlo come specifica
attuale ignorando `scripts/articles-editorial.js` e i workflow.

## Decisioni confermate e questioni aperte

- Riferimento ufficiale confermato: `coinsieme-ets/sito-coinsieme`, branch
  `main`. Le copie precedenti restano integralmente conservate, non principali.
- Individuare titolarita', repository e ambiente del laboratorio/piattaforma,
  chiarendo telemetria e conservazione dei dati prima di un suo rilascio.
- Quartiere separato e non pubblicato: la proposta di conservazione in
  [Quartiere e laboratorio](QUARTIERE-AND-LAB.md) richiede approvazione prima
  di qualunque copia, backup o inizializzazione Git.
- Coordinare selezione notizie dell'assistente e batch email: stati e orari
  non vanno considerati equivalenti senza verifica.
- Autorizzati commit e push dei soli otto documenti sulla branch dedicata.
  Restano esclusi merge su main, deploy, modifiche a codice, software,
  contenuti editoriali o Airtable.

## Aggiornamento nel tempo

Alla chiusura di un intervento aggiornare solo il documento pertinente e questa
base di verifica, con commit, run, prove e questioni aperte. Nessun token, export
integrale, registro di persone o screenshot privato deve entrare nel dossier.
