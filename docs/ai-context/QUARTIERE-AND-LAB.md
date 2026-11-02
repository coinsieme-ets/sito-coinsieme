# Quartiere, Primo Ascolto e Collaudo Empatico locali

Questi materiali non vanno equiparati al catalogo pubblico o alla Casa attuale.
Identita' e percorsi relativi sono descritti in [repository](REPOSITORIES.md).

## Il quartiere che si prende cura: verificato nei file locali

Percorso: `Domotica_assistiva/casa-publish-worktree/preview/quartiere-che-si-prende-cura/`.
Branch `codex/casa-publish`, HEAD `9412e89`; 28 file tracciati nella directory,
oltre a modifiche e nuovi file locali. Il modulo non e' presente nel main
documentato e non appartiene alle directory distribuite dai due workflow Pages.

Il pilota e' esplicitamente dedicato al Municipio Roma V, con dati territoriali
dimostrativi. Sei situazioni: vita a casa, muoversi, assistenza, salute,
stare insieme, diritti. Non e' un servizio di prenotazione o presa in carico.

- `services.json`, `scene-layout.json`, `quartiere.js/css`: dati, scene e schede.
- `experiences.js`, `experience-shell.mjs`: montaggio esperienze, pannelli,
  avanzamento e selezione accessibile delle illustrazioni.
- `shopping*`: spesa simulata, carrello, totale, sequenza di consegna e reset.
- `mobility*`, `assistance*`: ulteriori controller/modelli/schermate presenti
  localmente, con test dedicati ma in parte non tracciati.
- `build.cjs`, `template.html`: generazione locale; non pipeline di produzione.
- `pilot-baseline.json`: integrita' della baseline, da non aggiornare per
  nascondere regressioni. Fonti: README, MOBILITY.md e ASSISTANCE.md locali.

**Incoerenza storica:** il README parla ancora di sola spesa interattiva e
cinque anteprime statiche; i nuovi file mostrano sviluppi successivi per
mobilita' e assistenza. Non sono stati compilati o collaudati in questo audit:
non dichiararli completati, approvati o pubblicati.

Prossimi passi autorizzabili: preservare i nuovi file e le immagini; stabilire
quale versione consolidare; eseguire build e test soltanto in copia dedicata.
Test storici citati: `prototype.test.cjs`, `experience-shell.test.cjs`,
`shopping.test.cjs`, `mobility.test.cjs`, `assistance.test.cjs`. La cifra 133
nel README e' storica, non un risultato rieseguito per questo dossier.
Non riusare coperture dimostrative come dati reali dello Sportello.

## Piattaforma / Collaudo Empatico: stato separato

Individuati `Domotica_assistiva/PIATTAFORMA_COINSIEME` e
`Domotica_assistiva/METODO_COINSIEME`. Nel primo non risultano metadati Git
validi. Origin, branch ufficiale, URL pubblico e ambiente attivo restano
**non confermati**; il solo README non prova una distribuzione.
Repository e ambiente di pubblicazione restano esplicitamente da identificare:
non esiste nel dossier alcun collegamento GitHub o URL pubblico presunto.

Struttura: `frontend`, `frontend-v2`, `backend`, `modules`, `shared`, `tests`,
`ops`, `sites-preview`. Le cartelle del motore conversazionale/decisionale e
della memoria del caso non provano da sole un backend operativo.

- Frontend storico e V2: HTML/CSS/JS; percorsi di comprensione, conferma,
  orientamento, Mappa delle Possibilita' e primo gesto sostenibile.
- V2 conserva una mappa nel localStorage. Carica inoltre `app/analytics.js`,
  che invia eventi consentiti e contesto normalizzato a `/api/lab-analytics`.
  Non copiare questo comportamento nel pubblico ascolto senza storage/invio.
- Il README V2 dice che non invia dati: questa affermazione non descrive
  completamente il codice della telemetria. Non sono stati verificati server,
  consenso, effettiva ricezione, retention o disponibilita' dell'endpoint.
- `tests/user-flows` contiene sette documenti, inclusi registri di collaudo.
  Non sono stati letti o copiati casi personali. `tests/README.md` descrive
  test futuri, non una suite eseguibile gia' convalidata.
- `sites-preview/package.json`: sotto-progetto distinto Vinext/React/Next,
  TypeScript e Cloudflare/Vite, con Drizzle e requisito Node >=22.13.0.
  Non e' lo stack Node 20/statico del sito istituzionale. Non sono stati
  installati pacchetti, eseguite migrazioni DB o cercate credenziali.

Il documento architetturale Secondo Ciclo v0.1 sotto
`METODO_COINSIEME/07_SVILUPPO_SOFTWARE/04_ARCHITETTURA_MVP/` e' preliminare:
da primo gesto a progetto condivisibile, non funzionalita' gia' operativa.

**Decisione richiesta:** individuare repository e responsabile della versione
da conservare; verificare confini metodologici/privacy e ambiente reale prima
di programmare integrazioni con il sito. Non spostare o unificare nulla ora.

## Proposta sicura per il Quartiere: non eseguita

1. Concordare una destinazione di conservazione separata dal sito e dai suoi
   workflow, preferibilmente un repository privato dedicato al prototipo.
2. Prima di operare, concordare un breve fermo delle modifiche; censire file
   tracciati, modificati e non tracciati, branch/HEAD e differenze. Creare fuori
   dalle cartelle operative un backup verificato con manifest e hash SHA-256,
   preservando anche la storia Git della worktree e il suo common repository.
   Una copia della sola directory .git della worktree non e' un backup completo.
3. Dopo scansione di riservatezza e verifica dei diritti sulle immagini,
   preparare una COPIA dei sorgenti e asset del solo Quartiere, senza spostare
   o cancellare gli originali. Escludere credenziali, registri personali,
   dipendenze e output rigenerabili dal futuro repository condiviso, non dalla
   conservazione privata integrale concordata.
4. Inizializzare/versionare la copia solo dopo autorizzazione; annotare il
   riferimento di provenienza e distinguere baseline storica da WIP successivo.
   Se occorre mantenere la storia dei singoli file, proporre prima un'estrazione
   su clone usa-e-getta: mai riscrivere la storia del repository operativo.
5. Validare build, test e confronto con gli originali. Nessun workflow di
   deploy o collegamento automatico al sito. Un eventuale push privato richiede
   approvazione specifica del repository, dell'accesso e del pacchetto.

Non sono stati creati backup, repository o copie del prototipo con questa
proposta. Restano conservati tutti i file e le modifiche locali esistenti.
