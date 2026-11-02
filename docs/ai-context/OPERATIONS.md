# Verifiche, sicurezza e prosecuzione

## Lavoro svolto per questo dossier

Identita' di quattro copie/worktree e ultimo main letti; nuova worktree
documentale su branch dedicata. Lettura mirata di codice, workflow e specifiche;
nessuna lettura di storie di persone o ricerca di file di credenziali.
Nessun cambiamento a funzionalita', dipendenze, dati Airtable o pubblicazioni.
La successiva autorizzazione riguarda esclusivamente commit e push degli otto
documenti sulla branch `docs/ai-context-20261102`, non main o GitHub Pages.

Verifiche dirette: API GitHub deployment success, confronto HTTPS di 49 file
Sportello e 19 Casa, status 200 degli indici e sitemap indicati nel README.
Confronto SHA-256 con normalizzazione solo CRLF/LF per i testi; binari byte
per byte. I file editoriali rigenerati non sono inferiti dal solo HEAD locale.

Suite completa rieseguita su questa base con Node **20.20.2** e dipendenze
gia' disponibili: **262 test superati**, zero falliti o saltati. Inclusi i
test offline di confezionamento dei due workflow Pages, senza avviarli.
Controllo dossier: otto documenti, 14 collegamenti locali e 16 riferimenti
espliciti a sorgenti risolti; scansione mirata di segreti, email e percorsi
personali superata, affiancata dalla lettura dei testi. Nessuna differenza
nei file tracciati: solo questi nuovi Markdown sono presenti nella worktree.
Non rieseguiti collaudi dei prototipi esterni, screen reader o dispositivi reali.

## Prove locali per interventi successivi

Leggere prima package.json e il workflow coinvolto. Node 20 e dipendenze
esistenti per il sito; sites-preview usa un ambiente diverso. Niente installazioni
o aggiornamenti automatici per leggere il dossier.

Suite del sito, in PowerShell con Node 20 gia' disponibile e dipendenze risolte:

```powershell
$tests = Get-ChildItem scripts -Filter '*.test.js' | ForEach-Object FullName
node -r ./scripts/test-support/offline.js --test @tests preview/home-dinamica/selection.test.js
```

Il supporto offline usa fixture e non autorizza l'esecuzione separata di script
live. I test pre-release simulano entrambi i pacchetti Pages e il mancato
confezionamento di una dipendenza come prova negativa. Conservare queste prove.
Il repository non definisce un generico npm test: usare comandi effettivi.

Per UI usare server statico locale, browser disponibile e controlli mirati:
desktop + 390 px, tastiera, focus, etichette, filtri e zero risultati,
schede/dettagli, errori JS, overflow, movimento ridotto, reset delle demo.
Non installare Playwright o modificare lockfile se esiste gia' un runtime.

Non lanciare npm run build alla cieca: la build ordinaria legge lo snapshot
editoriale validato, puo' recuperare immagini e scrive HTML/dataset. Per una
simulazione usare ambienti isolati come fanno i test, mai Airtable reale.

## Rilascio futuro, solo previa autorizzazione

1. Ricontrollare main remoto e differenze; preservare commit editoriali e WIP.
2. Diff selettivo, test, pacchetti completi e nessun file privato/temporaneo.
3. Commit e push senza forzature soltanto dell'ambito approvato.
4. Seguire run reale fino al deployment; non ripetere tentativi alla cieca.
5. HTTPS, file dipendenti, route e funzioni coinvolte; registrare SHA/run/prove.

Un errore di sicurezza non e' una richiesta di disabilitare il controllo.
Per ripristino individuare artefatto integro con hash e scadenza verificati;
non presumere tuttora scaricabile un artifact storico citato in chat.
Il dossier non ha ricontrollato integrita'/ubicazione dei backup pregressi.
Non perdere contenuti editoriali successivi a un eventuale ripristino.

## Riservatezza e condivisione con altre AI

Questo insieme contiene percorsi relativi, identita' pubbliche di repository,
SHA e run, non valori di segreti. Non includere .env, configurazioni di account,
token, indirizzi personali, storie di utenti, export Airtable o log di invio.
Una regex non certifica l'assenza di dati sensibili: unire scansione e lettura.
Non caricare automaticamente l'intero archivio della Fondazione nei client AI.

Per iniziare un incarico: fornire branch/copia corrente, AGENTS.md, README e
il documento pertinente. Per chiuderlo: aggiornare solo fatti verificati,
elencare cio' che resta locale e chiedere le approvazioni ancora necessarie.

## Limiti della ricognizione

Nessuna bonifica di tutti i cloni o dei loro file non tracciati; nessun nuovo
audit SEO, controllo di registri personali, migrazione o test clinico.
Repository/deploy della piattaforma, collaudi reali di accessibilita', stato
attuale delle iniziative esterne e titolarita' di ogni asset storico restano
verifiche separate. Non colmare questi vuoti con la memoria della chat.
