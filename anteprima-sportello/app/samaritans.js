(function(root){
  'use strict';
  const resource={
    id:'samaritans-ascolto',
    name:'Samaritans OdV — Ascolto telefonico e sostegno emotivo',
    categories:['socialita','vicinato'],groups:['enti','volontariato'],
    legalAddress:null,operationalAddress:'Servizio telefonico; nessuna sede fisica censita in questa scheda.',
    seatMunicipio:null,municipalities:['IV','V','VI','VII'],neighborhood:null,
    territoryBasis:'Ascolto telefonico accessibile anche da Roma Est; i Municipi indicano accesso telefonico, non sedi locali.',
    fields:['Ascolto e sostegno emotivo','Volontariato e solidarietà'],
    description:'Associazione di volontariato che offre ascolto telefonico riservato a persone che attraversano momenti di solitudine, crisi o difficoltà emotiva.',
    details:[
      'Orario pubblicato: tutti i giorni, dalle 13:00 alle 22:00.',
      'Costo: chiamata al numero urbano secondo il piano tariffario del proprio operatore; non è un numero verde.',
      'Non è assistenza sanitaria, psicoterapia o pronto intervento.',
      'Per il volontariato consulta la scheda separata sul sito ufficiale: selezione, formazione e disponibilità dei corsi vanno confermate con l’associazione.'
    ],
    legalStatus:'Organizzazione di volontariato secondo il sito ufficiale; estremi RUNTS non verificati in questa scheda.',runts:null,
    website:'https://www.samaritansonlus.org/',email:null,phone:'0677208977',
    sources:[{url:'https://www.samaritansonlus.org/',label:'Samaritans OdV · sito ufficiale',checkedAt:'2026-10-27'},
      {url:'https://www.samaritansonlus.org/vuoi-aiutare/diventa-volontario/',label:'Informazioni ufficiali sul volontariato',checkedAt:'2026-10-27'}],
    caution:'Recapito e orari riscontrati nei contenuti ufficiali indicizzati; accesso diretto alle pagine intermittente durante la verifica. Nessuna partnership con COINSIEME. Corsi e posti attuali non confermati direttamente con l’associazione.'
  };
  if(typeof module==='object'&&module.exports){module.exports=resource;return;}
  const records=root.SportelloSocialitaData.records;
  if(!records.some(r=>r.id===resource.id))records.push(resource);
})(typeof window==='undefined'?globalThis:window);
