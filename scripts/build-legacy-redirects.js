const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const redirects = {
  'articoli/tag/no-profit': '/articoli.html',
  'articoli/.c/cooperative-sociali': '/articoli.html',
  'progetti-e-servizi/supera-le-barriere-digitali-un-servizio-di-prossimità-contro-le-nuove-esclusioni-sociali': '/cosa-facciamo.html',
  'articoli/.c/disabili': '/articoli.html',
  'trasparenza/statuto-della-fondazione-coinsieme-ets': '/assets/documenti/trasparenza/statuto-fondazione.pdf',
  'trasparenza/trasparenza': '/trasparenza.html',
  'trasparenza/bilancio-2024': '/assets/documenti/trasparenza/bilancio-esercizio-2024.pdf',
  'articoli/tag/donfrancomonterubbianesi-capodarco-comunitàdicapodarco-inclusione-disabilità-cooperazionesociale-memoria-solidarietà-mauriziomarotta-fondazionecoinsieme': '/articoli.html',
  'trasparenza/contatti': '/contatti.html',
  'progetti-e-servizi/corso-di-formazione-domotica-assistiva': '/formazione.html',
  'domotica-assistiva': '/domotica.html',
  'trasparenza/estremi-iscrizione-al-runts-della-fondazione-coinsieme-ets': '/assets/documenti/trasparenza/iscrizione-runts.pdf',
  'archivio-storico/archivio-storico': '/chi-siamo.html#storia-titolo',
  'articoli/tag/comune-di-roma': '/articoli.html',
  'articoli/.c/all/-page/4': '/articoli.html',
  'progetti-e-servizi/corso-di-formazione-per-agriturismo-digitale': '/formazione.html',
  'articoli/le-nuove-norme-del-decreto-sicurezza-e-il-rischio-di-un-arretramento-nell-inclusione-lavorativa-delle-persone-con-disabilità': '/articoli/le-nuove-norme-del-decreto-sicurezza-e-il-rischio-di-un-arretramento-nell-inclusione-lavorativa-delle-persone-con-disabilita/',
  'articoli/il-coin-e-il-santa-maria-della-pietà-di-roma': '/articoli/il-coin-e-il-santa-maria-della-pieta-di-roma/',
  'domotica-assistiva/la-domotica-assistiva-alla-portata-di-tutti': '/domotica.html',
  'pubblicazioni/pubblicazioni-alcuni-eroi-del-nostro-tempo': '/pubblicazioni.html',
  'articoli/turismo-accessibile-opportunità-e-sfide-per-l-industria-turistica-italiana': '/articoli/turismo-accessibile-opportunita-e-sfide-per-l-industria-turistica-italiana/',
  'galleria': '/pubblicazioni.html',
  'progetti-e-servizi': '/cosa-facciamo.html',
  'pubblicazioni/un-profeta-tra-terra-e-cielo-don-franco-monterubbianesi': '/pubblicazioni.html',
  'articoli/il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perché-è-importante': '/articoli/il-lazio-dimezza-l-irap-per-le-cooperative-sociali-cosa-cambia-e-perche-e-importante/',
  'archivio-storico': '/chi-siamo.html#storia-titolo',
  'blog/rendere-il-mondo-un-posto-migliore-le-chiavi-per-il-successo-delle-imprese-sociali': '/articoli.html',
  'pubblicazioni-alcuni-eroi-del-nostro-tempo/un-profeta-tra-terra-e-cielo-don-franco-monterubbianesi': '/pubblicazioni.html',
  'pubblicazioni-alcuni-eroi-del-nostro-tempo/pubblicazioni-alcuni-eroi-del-nostro-tempo': '/pubblicazioni.html',
  'pubblicazioni-alcuni-eroi-del-nostro-tempo/guida-allacitta-di-roma-anno-1990': '/pubblicazioni/guida-allacitta-di-roma-anno-1990/',
  'la-domotica-assistiva/la-domotica-assistiva-alla-portata-di-tutti': '/domotica.html',
  'documenti-istituzionali/estremi-iscrizione-al-runts-della-fondazione-coinsieme-ets': '/assets/documenti/trasparenza/iscrizione-runts.pdf',
  'la-domotica-assistiva/scarica-il-depliant-del-servizio': '/domotica.html',
  'servizi-della-fondazione/corso-di-formazione-per-agriturismo-digitale': '/formazione.html',
  'servizi-della-fondazione/supera-le-barriere-digitali-un-servizio-di-prossimità-contro-le-nuove-esclusioni-sociali': '/cosa-facciamo.html',
  'servizi-della-fondazione/corso-di-formazione-domotica-assistiva': '/formazione.html',
  'pubblicazioni-alcuni-eroi-del-nostro-tempo/.c/accessibilità': '/pubblicazioni.html',
  'documenti-istituzionali/statuto-della-fondazione-coinsieme-ets': '/assets/documenti/trasparenza/statuto-fondazione.pdf',
  'documenti-istituzionali/bilancio-2024': '/assets/documenti/trasparenza/bilancio-esercizio-2024.pdf'
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildRedirect(target) {
  const absoluteTarget = `https://www.coinsieme.it${target}`;
  const safeTarget = escapeHtml(target);
  const safeCanonical = escapeHtml(absoluteTarget);

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pagina trasferita - Fondazione COINSIEME ETS</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${safeCanonical}">
  <meta http-equiv="refresh" content="0; url=${safeTarget}">
  <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p>La pagina è stata trasferita. <a href="${safeTarget}">Apri la destinazione aggiornata</a>.</p>
</body>
</html>
`;
}

for (const [legacyPath, target] of Object.entries(redirects)) {
  const outputDir = path.join(ROOT, ...legacyPath.split('/'));
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), buildRedirect(target), 'utf8');
}

console.log(`Generate ${Object.keys(redirects).length} pagine di compatibilita per URL storici.`);

module.exports = { redirects, buildRedirect };
