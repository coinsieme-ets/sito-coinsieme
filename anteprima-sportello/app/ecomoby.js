(function(root){
  'use strict';
  const resource={
    id:'ecomobyproject-assistenza-ausili',name:'EcoMobyProject — Assistenza, manutenzione e riparazione ausili',
    category:'mobilita',categories:['mobilita','domicilio'],subcategory:'ausili',homeKind:'ausili',groups:['ausili'],
    groupByCategory:{mobilita:'ausili',domicilio:'ausili'},
    keywords:['riparazione carrozzina','scooter elettrico','ausili disabili','batterie','letti motorizzati','manutenzione','assistenza tecnica'],
    description:'Operatore privato che dichiara manutenzione e riparazione di ausili per la mobilità e per la casa. Servizio a pagamento, con modalità di intervento da concordare direttamente.',
    entity:'EcoMobyProject',providerType:'Operatore privato · servizio a pagamento',
    address:'Sedi indicate: Firenze e Rosignano Marittimo (Livorno).',
    zone:'Copertura nazionale dichiarata dall’azienda; modalità concrete a Roma da concordare.',
    declaredCoverage:'Nazionale, secondo il sito aziendale. Non equivale a intervento domiciliare garantito in ogni località.',
    coverageClass:'nazionale_dichiarata',coverageMunicipi:[],seatMunicipio:null,publicMunicipi:[],allRome:false,allRomeDeclared:false,
    coverageStatus:'Dichiarazione nazionale riscontrata nella fonte ufficiale; disponibilità di ritiro o intervento a Roma non confermata.',
    services:['Scooter elettrici per anziani e persone con disabilità','Carrozzine motorizzate','Batterie e caricabatterie','Attuatori elettrici','Letti motorizzati e altri ausili'],
    recipients:'Persone e famiglie che necessitano di assistenza tecnica per ausili.',
    requirements:'Comunicare marca, modello e problema direttamente all’operatore per la valutazione tecnica. Non inviare dati personali o sanitari a COINSIEME.',
    access:'Contattare direttamente l’operatore via telefono, email o sito ufficiale. Possibile ritiro tramite corriere oppure presso l’indirizzo del cliente secondo disponibilità e accordi.',
    costs:'Servizio a pagamento. Preventivo, costi di trasporto, tempi e disponibilità dei ricambi da verificare con l’operatore.',
    availability:'Ausili sostitutivi e noleggio sono possibilità dichiarate, soggette a disponibilità; non sono garantiti da questa scheda.',
    notes:['Nessuna partnership o convenzione con Fondazione COINSIEME ETS. COINSIEME segnala il servizio, ma non riceve richieste di riparazione né gestisce pagamenti.',
      'Pagine ufficiali e recapiti controllati il 27 ottobre 2026, con risposta HTTP 200. Il funzionamento del modulo e l’accettazione di richieste non sono stati provati; per chiarimenti utilizzare telefono o email dell’operatore.'],
    phones:[{label:'Informazioni e preventivi',number:'3394040759'}],emails:[{label:'Email dell’operatore',address:'info@ecomobyproject.com'}],
    status:'presenza_documentata',verificationScope:'servizio',verifiedAt:'2026-10-27',source:'https://www.ecomobyproject.com/assistenza',
    sources:[{url:'https://www.ecomobyproject.com/assistenza',label:'Assistenza · sito ufficiale EcoMobyProject',checkedAt:'2026-10-27'}],
    links:[{url:'https://www.ecomobyproject.com/richiesta-riparazione-manutenzione/index',label:'Pagina di richiesta segnalata · sul sito dell’operatore'}]
  };
  if(typeof module==='object'&&module.exports)module.exports=resource;else root.SportelloEcoMoby=resource;
})(typeof window==='undefined'?globalThis:window);
