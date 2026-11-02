(function(root){
  'use strict';
  const resource={
    id:'tirrenia-todaro',name:'Circolo Canottieri Tirrenia Todaro — Sport e socialità sul Tevere',
    categories:['socialita'],groups:['enti'],legalAddress:null,
    operationalAddress:'Lungotevere Flaminio 61, Roma',seatMunicipio:null,municipalities:[],neighborhood:null,
    territoryBasis:'Sede a Roma, Lungotevere Flaminio; non è una sede di Roma Est. Nessuna copertura territoriale presunta.',
    fields:['Sport e socialità'],
    description:'Circolo sportivo con attività di canottaggio e canoa documentate dal sito ufficiale. La testimonianza del professor Giuseppe Lattanzi valorizza il fiume, lo sport e le relazioni come occasioni di benessere e partecipazione.',
    details:[
      'La relazione «Il Tevere luogo terapeutico», presentata il 31 ottobre 2026, è una testimonianza: non documenta un servizio sanitario o un percorso riabilitativo attivabile.',
      'Accessibilità fisica, accesso all’imbarco, attrezzature adattate e supporto per persone con disabilità non verificati: chiedere direttamente al circolo se le condizioni sono adeguate alle proprie esigenze.',
      'Corsi attualmente attivi, destinatari, requisiti, condizioni di ammissione, costi e disponibilità devono essere confermati con il circolo. Nessuna prenotazione tramite COINSIEME.'
    ],
    legalStatus:'Circolo sportivo; qualificazione e attività descritte dal gestore, nessun accreditamento sanitario attestato.',runts:null,
    website:'https://www.canottieritirreniatodaro.it/',email:'info@canottieritirreniatodaro.it',phone:'063610102',
    sources:[
      {url:'https://www.canottieritirreniatodaro.it/',label:'Sito ufficiale · attività e recapiti',checkedAt:'2026-11-02'},
      {url:'/rassegna/notizie-utili/tevere-sport-benessere-partecipazione.html',label:'Leggi l’approfondimento COINSIEME: Il Tevere, un luogo di sport, benessere e partecipazione',checkedAt:'2026-11-02'}
    ],
    editorialSource:'Segnalazione del professor Giuseppe Lattanzi, presidente del circolo, tramite Contribuisci a COINSIEME. Relazione del 31 ottobre 2026.',
    caution:'Nessuna partnership con COINSIEME. Il riferimento al benessere non equivale a una prestazione riabilitativa. Accessibilità, condizioni di partecipazione e disponibilità non accertate.'
  };
  if(typeof module==='object'&&module.exports){module.exports=resource;return;}
  const records=root.SportelloSocialitaData.records;
  if(!records.some(r=>r.id===resource.id))records.push(resource);
})(typeof window==='undefined'?globalThis:window);
