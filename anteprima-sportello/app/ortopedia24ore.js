(function(root){
  'use strict';
  const resource={
    id:'ortopedia24ore-noleggio-ausili',name:'Ortopedia24ore — Noleggio ausili e presidi ortopedici con consegna a domicilio',
    category:'mobilita',categories:['mobilita','domicilio'],subcategory:'ausili',homeKind:'ausili',groups:['ausili'],
    groupByCategory:{mobilita:'ausili',domicilio:'ausili'},
    keywords:['Ortopedia Centocelle','Gruppo Peretti','noleggio','letti ortopedici','letti ospedalieri','sollevatori','materassi antidecubito','deambulatori','ausili','presidi ortopedici','Centocelle','Via dei Castani'],
    description:'Operatore privato a pagamento: noleggio di ausili per mobilità e assistenza domestica, con consegna, eventuale installazione e ritiro da concordare. Non è un centro diagnostico né una prestazione sanitaria domiciliare.',
    entity:'Ortopedia24ore — marchio di Peretti Tecnologie Medicali srl, Gruppo Peretti',
    providerType:'Operatore privato · noleggio a pagamento',
    address:'Sede operativa: Via dei Castani 270/272, Roma — Centocelle.',
    zone:'Comune di Roma dichiarato nelle condizioni di noleggio; singolo indirizzo e modalità operative da concordare.',
    declaredCoverage:'Comune di Roma; Provincia di Roma e Lazio con trasporto a tariffa secondo le condizioni pubblicate.',
    coverageClass:'roma_dichiarata',coverageMunicipi:['IV','V','VI','VII'],seatMunicipio:'V',publicMunicipi:[],allRome:true,allRomeDeclared:true,
    coverageStatus:'Copertura comunale dichiarata dall’operatore; non disponibilità immediata in ogni quartiere.',
    services:['Noleggio di letti ortopedici e ospedalieri','Sollevatori e materassi antidecubito','Deambulatori e altri ausili: modello e disponibilità da confermare','Consegna, eventuale installazione e ritiro a domicilio'],
    recipients:'Persone e famiglie che cercano ausili per mobilità o assistenza a casa.',
    requirements:'Concordare ausilio, condizioni di utilizzo e accesso al domicilio direttamente con l’operatore. Per l’idoneità dell’ausilio rivolgersi al professionista sanitario di riferimento; non inviare dati sanitari a COINSIEME.',
    access:'Telefono, WhatsApp o email dell’operatore; COINSIEME non gestisce prenotazioni, contratti o pagamenti.',
    hours:'Negozio: lunedì–sabato 9:00–20:00, domenica chiuso. Servizio clienti dichiarato H24: non significa apertura fisica H24 o consegna notturna garantita.',
    costs:'Noleggio a pagamento. Le condizioni pubblicate dichiarano consegna e ritiro gratuiti nel Comune di Roma, a tariffa in provincia e nel Lazio. Verificare prezzo totale, durata minima, installazione, condizioni di restituzione ed eventuali costi aggiuntivi prima dell’ordine.',
    availability:'Disponibilità degli ausili, tempi di consegna e ritiro da concordare; nessuna consegna immediata o notturna garantita da COINSIEME.',
    notes:['Nessuna convenzione o partnership con Fondazione COINSIEME ETS.',
      'Le condizioni prevedono durate minime variabili per prodotto, comunicazione della disdetta e possibili sospensioni stagionali: leggere il contratto applicabile prima di confermare.',
      'Ortopedia Centocelle / Ortopedia100 appartiene al medesimo gruppo ma il sito indica Peretti Medical Group srl, distinta da Peretti Tecnologie Medicali srl. Un’unica scheda per il servizio Ortopedia24ore; i recapiti delle due attività non sono intercambiati.'],
    phones:[{label:'Telefono e WhatsApp',number:'3335015465'},{label:'Secondo telefono',number:'3333966527'}],
    emails:[{label:'Email operatore',address:'info@ortopedia24ore.it'}],
    status:'presenza_documentata',verificationScope:'servizio',verifiedAt:'2026-10-27',source:'https://www.ortopedia24ore.it/',
    sources:[
      {url:'https://www.ortopedia24ore.it/',label:'Ortopedia24ore: sede, recapiti e orari',checkedAt:'2026-10-27'},
      {url:'https://www.ortopedia24ore.it/condizioni-generali-di-noleggio/',label:'Condizioni di noleggio: trasporto e restituzione',checkedAt:'2026-10-27'},
      {url:'https://www.ortopedia24ore.it/prodotti/letto-ospedaliero-elettrico-in-legno-con-posizione-trendelenburg/',label:'Noleggio letto ospedaliero e materasso: esempio ufficiale',checkedAt:'2026-10-27'},
      {url:'https://ortopediacentocelle.it/',label:'Ortopedia Centocelle: attività dello stesso gruppo',checkedAt:'2026-10-27'}
    ],
    links:[{url:'https://www.ortopedia24ore.it/',label:'Sito ufficiale Ortopedia24ore'},{url:'https://wa.me/393335015465',label:'WhatsApp dell’operatore (sito esterno)'},{url:'https://www.google.com/maps/search/?api=1&query=Via%20dei%20Castani%20270%2F272%2C%20Roma',label:'Mappa della sede operativa'}]
  };
  if(typeof module==='object'&&module.exports)module.exports=resource;else root.SportelloOrtopedia24ore=resource;
})(typeof window==='undefined'?globalThis:window);
