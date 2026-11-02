# Repository, copie locali e pubblicazione

Rilevazione riferita alla base e alla data del [README](README.md).
`<COINSIEME>` indica la cartella locale della Fondazione; non e' un percorso
assoluto condiviso fra computer. Non pubblicare nomi utente e profili del PC.

## Un remoto istituzionale, piu' copie

Repository verificato: [coinsieme-ets/sito-coinsieme](https://github.com/coinsieme-ets/sito-coinsieme).
Ramo di distribuzione: `main`. CNAME e workflow indicano `www.coinsieme.it`.
Questo e' il riferimento ufficiale confermato dalla Fondazione. Le copie
storiche non sono principali e devono restare intatte, inclusi WIP e file
non tracciati. Nessuna sincronizzazione distruttiva per renderle uguali a main.

| Copia relativa a COINSIEME | Identita' alla rilevazione | Condizione |
|---|---|---|
| `sito-coinsieme-codex` | clone indipendente, main `a4562537dc2626605e271f08ebcd7f18d8c122e0` del 12 ottobre | Nessuna differenza tracciata rilevata; non e' l'ultimo sito pubblicato |
| `00_ARCHIVIO/04_INIZIATIVE/Domotica_assistiva/sito-coinsieme` | altro clone, main `e873b7ba90b7a19a993e95721b75d90c4018a553` del 24 settembre | Sei file tracciati modificati: non sovrascrivere |
| `.../Domotica_assistiva/sportello-collaudo-release` | worktree del clone precedente, HEAD staccata `9fd1186142438749e14262a9292c920ac054d9d6` | Due file tracciati modificati; non equivale all'ultimo rilascio |
| `.../Domotica_assistiva/casa-publish-worktree` | worktree dello stesso clone, branch `codex/casa-publish`, HEAD `9412e8907069c9bae0144743c57b6a4a88f4612e` | Contiene il Quartiere e sviluppi locali non pubblicati |

Le differenze sono state lette, non corrette. Questo non e' un inventario di
ogni file non tracciato dei vecchi cloni, ne' un loro backup integrale.

In **entrambe le copie segnalate** non esistono attualmente
`casa-che-si-prende-cura/index.html` e `anteprima-sportello/index.html`;
esiste invece `sportello/index.html`. Non cercare di ricostruire Casa e
catalogo recenti partendo da questi snapshot: usare il main remoto verificato
in una nuova worktree, preservando separatamente il lavoro locale precedente.

Nel clone sotto l'archivio risultano modificati:
`docs/sportello/prima-integrazione.md`, `scripts/build-cms.js`,
`scripts/sportello.test.js`, `sportello/app/app.js`, `sportello/index.html`,
`sportello/styles/main.css`. Nella worktree sportello-collaudo-release:
`scripts/daily-briefing.js` e `scripts/sync-rassegna.js`.

## Famiglia locale dei rilasci recenti

Una terza famiglia Git, nell'area di lavoro temporanea degli agenti, ha common
directory `progetti-locale/.git` e lo stesso origin istituzionale. Worktree:

| Nome | Branch/HEAD verificati |
|---|---|
| `progetti-locale` | `seo-fase1-locale`, `4a8a247` |
| `casa-seo-release` | `release-casa-seo-20261030`, `a139717` |
| `casa-seo-2c-locale` | detached `530fe18` |
| `fisio-release` | `release/fisioterapia-20261031`, `9b9dee9` |
| `coabitazione-preview` | `preview/coabitazione-20261101`, `ad15a8d` |
| `ai-context-dossier` | `docs/ai-context-20261102`, base `36af201` |

Questi nomi identificano luoghi di lavoro, non ambienti pubblici permanenti.
La branch documentale e' destinata alla condivisione su GitHub, non al deploy
o al merge su main; non contiene spostamenti dei progetti.

## Determinare la versione realmente distribuita

La versione corrente non si ricava dal nome del clone, da un server localhost
o dall'ultimo commit visibile senza controllare i workflow. Confrontare:

1. `git remote -v`, `git rev-parse HEAD`, `git branch --show-current`.
2. Ultimo main remoto e file cambiati rispetto alla base locale.
3. Ultimo deployment `github-pages` con stato **success**, SHA e run associato.
4. HTML e asset HTTPS, inclusi quelli rigenerati con dati Airtable.

Il run piu' recente del solo build-articoli non e' necessariamente l'ultimo
deploy: anche sync-rassegna distribuisce il sito. Un run riuscito puo' inoltre
non distribuire nulla quando non cambia il contenuto pubblico.

Windows: per percorsi lunghi usare l'opzione locale al comando
`git -c core.longpaths=true ...`; non cambiare impostazioni globali altrui.
Verificare il diff effettivo: segnalazioni stat/CRLF non sono automaticamente
modifiche di contenuto. Non risolverle con reset o checkout distruttivi.

## Altri progetti individuati

`.../Domotica_assistiva/PIATTAFORMA_COINSIEME` contiene software e documenti,
ma il comando Git non vi riconosce un repository. La denominazione nel suo
README non prova l'esistenza di un origin. Vedere [laboratorio](QUARTIERE-AND-LAB.md).
Non sono stati unificati cloni, cambiati origin o ripulite worktree.
