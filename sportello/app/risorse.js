/* Dati editoriali locali. Nessun dato dell’utente. */
(function(root){
  const areas = [
  {
    "id": "casa-autonomia",
    "title": "Casa e autonomia",
    "text": "Vivere in casa con maggiore facilità, sicurezza e indipendenza.",
    "link": "/domotica.html",
    "order": 1,
    "fallback": "/persone-famiglie.html"
  },
  {
    "id": "tecnologie-aiuto",
    "title": "Tecnologie che possono aiutare",
    "text": "Capire quando domotica e strumenti semplici possono essere davvero utili.",
    "link": "/articoli/una-casa-che-si-accorge-di-una-caduta-senza-guardarci/",
    "order": 2,
    "fallback": "/articoli.html"
  },
  {
    "id": "famiglia-assistenza",
    "title": "Famiglia e assistenza",
    "text": "Orientarsi quando aiutare una persona cara diventa più impegnativo.",
    "link": "/persone-famiglie.html",
    "order": 3,
    "fallback": "/articoli.html"
  },
  {
    "id": "lavoro-inclusione",
    "title": "Lavoro e inclusione",
    "text": "Approfondire opportunità, adattamenti e percorsi legati al lavoro.",
    "link": "/cosa-facciamo.html",
    "order": 4,
    "fallback": "/articoli.html"
  },
  {
    "id": "relazioni-solitudine",
    "title": "Relazioni, partecipazione e solitudine",
    "text": "Capire se stare soli è una scelta che fa stare bene o se sta diventando un ostacolo alle relazioni, alla partecipazione o alla possibilità di chiedere aiuto.",
    "link": "/persone-famiglie.html",
    "order": 5,
    "fallback": "/articoli.html"
  },
  {
    "id": "vita-digitale",
    "title": "Vita digitale",
    "text": "Usare con maggiore autonomia strumenti e servizi digitali.",
    "link": "/articoli.html",
    "order": 6,
    "fallback": "/persone-famiglie.html"
  }
];
  const resources = {
    '/articoli/una-casa-che-si-accorge-di-una-caduta-senza-guardarci/': {title: 'Rilevare una caduta senza telecamere', text: 'Come funzionano i radar non intrusivi che possono riconoscere movimenti compatibili con una caduta e inviare una segnalazione, tutelando maggiormente la privacy.'},
    '/domotica.html': {title: 'Domotica assistiva', text: 'Come affrontare gli adattamenti della casa, partendo dalla persona.'},
    '/persone-famiglie.html': {title: 'Persone e famiglie', text: 'Gli ambiti in cui COINSIEME può offrire informazioni e possibilità di confronto.'},
    '/cosa-facciamo.html': {title: 'Cosa facciamo', text: 'Attività e progetti della Fondazione, distinguendo ciò che è operativo da ciò che è in sviluppo.'},
    '/articoli.html': {title: 'Articoli e approfondimenti', text: 'L’archivio editoriale su autonomia, tecnologie, lavoro e cambiamenti della vita quotidiana.'}
  };

for (const [url, resource] of Object.entries(resources)) Object.assign(resource, {url, type:'pagina', territory:'non territoriale', entity:'Fondazione COINSIEME ETS', area:areas.filter(a => [a.link,a.fallback].includes(url)).map(a=>a.id)});
const data={areas,resources};
if(typeof module==='object' && module.exports) module.exports=data; else root.SportelloRisorse=data;
})(typeof window==='undefined'?globalThis:window);
