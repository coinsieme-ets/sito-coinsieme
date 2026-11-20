(function(root){
  'use strict';
  const checkedAt='2026-10-30';
  const source=(label,url,documentDate)=>({label,url,checkedAt,...(documentDate?{documentDate}:{})});
  const sources={
    roma1:source('ASL Roma 1: assistenza domiciliare','https://www.aslroma1.it/assistenza-domiciliare'),
    roma1cad:source('ASL Roma 1: sedi e recapiti CAD','https://www.aslroma1.it/dove-assistenza-domiciliare'),
    ex26:source('ASL Roma 1: accesso alla riabilitazione ex art. 26','https://www.aslroma1.it/assistenza-riabilitativa-presso-centri-accreditati-ex-art-26-legge-833-78'),
    roma2:source('ASL Roma 2: accesso, COT e assistenza domiciliare','https://www.aslroma2.it/index.php/servizi/assistenza-domiciliare-mn'),
    roma2list:source('ASL Roma 2: elenco erogatori ADI del 15 maggio 2025','https://www.aslroma2.it/attachements/j4/com_content.article/elenco-cooperative-con-recapiti-15-05-25.pdf','2025-05-15'),
    roma3cad:source('ASL Roma 3: CAD e valutazione','https://www.aslroma3.it/servizi-dalla-a-alla-z/c/cad-centri-di-assistenza-domiciliare-semiresidenziale-residenziale-rsa/'),
    roma3pua:source('ASL Roma 3: directory PUA','https://www.aslroma3.it/servizi-dalla-a-alla-z/p/pua-punto-unico-di-accesso/'),
    roma3list:source('ASL Roma 3: elenco ADI del 19 maggio 2026','https://www.aslroma3.it/wp-content/uploads/2026/06/Elenco-ADI-ASL-RM-3_aggiornato_19_05_2026.pdf','2026-05-19'),
    roma3ex:source('ASL Roma 3: indice strutture accreditate, revisionato il 25/09/2026','https://www.aslroma3.it/amministrazione-trasparente/strutture-sanitarie-private-accreditate/'),
    roma3table:source('ASL Roma 3: tabella centri ex art. 26, date non uniformi nel documento','https://www.aslroma3.it/wp-content/uploads/2025/03/Tab.-3-Centri-di-riabilitazione-ex-art.-26-Aggiornato-al-18_03_2025.pdf'),
    albo:source('FNOFI: ricerca nell’Albo dei fisioterapisti','https://fisionet.fnofi.it/albo-professionale')
  };
  const fullDescription='Interventi fisioterapici svolti presso l’abitazione da professionisti sanitari abilitati, rivolti a persone con difficoltà di movimento, disabilità, ridotta autonomia o necessità di recupero funzionale dopo interventi, traumi o ricoveri. Possono comprendere riabilitazione motoria, esercizi personalizzati, mantenimento della mobilità e indicazioni per una maggiore sicurezza nei movimenti quotidiani.';
  const intro={id:'info-fisioterapia-domicilio',category:'domicilio',categories:['domicilio'],subcategory:'fisioterapia',homeKind:'fisioterapia',name:'Fisioterapia e riabilitazione a domicilio',description:'Fisioterapia a domicilio da professionisti sanitari abilitati: percorsi pubblici e prestazioni private, da valutare con i servizi competenti.',access:'COINSIEME non eroga queste prestazioni, non gestisce prenotazioni e non dichiara convenzioni. Questa informazione non attesta la copertura locale o la disponibilità.',status:'informazione_orientativa',territorialScope:'generale',keywords:['fisioterapista','fisioterapia domiciliare','riabilitazione motoria','recupero funzionale','esercizi personalizzati','mantenimento della mobilità'],entity:null,zone:null,source:null,verifiedAt:null,links:[{url:sources.albo.url,label:'Verifica l’iscrizione all’Albo dei fisioterapisti · FNOFI'}]};
  const paths=[
    {id:'pubblico',label:'Attraverso la ASL',description:'Come richiedere una valutazione nel servizio sanitario pubblico.',title:'Richiedere una valutazione alla ASL'},
    {id:'privato',label:'Un professionista privato',description:'Prestazioni a pagamento: cosa verificare prima di scegliere.',title:'Servizi privati a pagamento'},
    {id:'orientamento',label:'Da dove cominciare?',description:'Un aiuto per individuare il primo passo.',title:'Da dove cominciare'}
  ];
  const guides=[
    {id:'roma1',name:'ASL Roma 1',territory:'Municipi I, II, III, XIII, XIV e XV',
      access:'La richiesta sanitaria può partire dal medico di famiglia, dal pediatra o dal medico ospedaliero. La scheda unica di segnalazione va indirizzata al CAD/PUA del distretto competente: non a COINSIEME.',
      contacts:[{label:'Esempio: Distretto 1, Nuovo Regina Margherita',address:'Via Emilio Morosini 30, Roma',phone:'0660106500',emails:['pua1@aslroma1.it','cad1distretto@aslroma1.it']}],
      note:'Il recapito è del Distretto 1, non di tutta la ASL. Per gli altri distretti usa la directory ufficiale. Il percorso ex art. 26 richiede la valutazione e l’autorizzazione pertinenti; non coincide con l’ADI.',sources:[sources.roma1,sources.roma1cad,sources.ex26]},
    {id:'roma2',name:'ASL Roma 2',territory:'Municipi IV, V, VI, VII, VIII e IX',resourceId:'territorio-adi-d5',
      access:'Il medico di famiglia richiede la presa in carico alla COT distrettuale, che effettua la prevalutazione e indirizza alla UVM. Per il Municipio V la pagina indica cotd5@aslroma2.it: l’invio della richiesta sanitaria compete al medico.',
      note:'Per i percorsi complessi sono previste valutazione multidimensionale e PAI. Le prestazioni occasionali possono seguire una procedura diversa. Per il Municipio V il riferimento ADI è quello già censito nel catalogo; per gli altri Municipi consultare la pagina ASL. Non inviare documenti clinici tramite COINSIEME.',sources:[sources.roma2,sources.roma2list]},
    {id:'roma3',name:'ASL Roma 3',territory:'Municipi X, XI, XII e Comune di Fiumicino',
      access:'Il medico di famiglia, il pediatra o il medico ospedaliero compila il modulo ufficiale e lo invia al PUA competente per residenza. Il servizio territoriale valuta i bisogni e il piano appropriato; per l’ex art. 26 occorre il percorso autorizzativo specifico.',
      contacts:[{label:'Esempio: PUA Municipio XI',address:'Via Vaiano 53, Roma',phone:'0656485205',emails:['pua.distretto11@aslroma3.it']},{label:'CAD Municipio XI, sede distinta dal PUA',address:'Via Giovanni Volpato 18, Roma',phone:'0656485223',emails:['pua.distretto11@aslroma3.it']}],
      note:'Questi recapiti sono esempi del Municipio XI. Pagine storiche collocano il PUA in via Volpato: la directory più recente lo distingue dal CAD. Confermare sede e accesso prima di recarsi agli sportelli; nessun orario non uniforme è riproposto qui.',sources:[sources.roma3pua,sources.roma3cad]}
  ];
  const providers=[
    {id:'adi-salus',name:'ADI Salus',regime:'adi',label:'ADI · erogatore privato riportato negli elenchi ASL',asls:['roma1','roma3'],verification:'parziale',
      description:'Il gestore dichiara interventi riabilitativi domiciliari quando previsti dal piano assistenziale. La presenza negli elenchi ADI non prova un titolo domiciliare ex art. 26.',
      seats:'Roma 1 indica via Camerata Picena 385; Roma 3 indica la sede operativa in via Val Tellina 69. Sede e territorio servito sono informazioni distinte.',
      coverage:'Presenza documentata negli elenchi ADI Roma 1 e Roma 3; zone, singole prestazioni e attuale assegnabilità da confermare con la ASL.',
      access:'Percorso SSR subordinato alla valutazione e all’affidamento della ASL, con prestazioni definite dal piano: non è una prenotazione diretta di fisioterapia tramite COINSIEME.',
      qualifications:'Prestazioni dichiarate dal gestore; identità e iscrizione del singolo fisioterapista non verificate da COINSIEME.',
      phone:'0683790843',email:'direzione@adisalus.it',url:'https://www.adisalus.it/',
      caution:'Il PDF Roma 2 del 2025 usa SALUS S.r.l. e lo stesso sito. Non viene qui attribuita una copertura Roma 2 finché la corrispondenza giuridica non è completata. Contratto corrente e disponibilità non accertati.',
      sources:[sources.roma1,sources.roma3list,source('Gestore: riabilitazione nel piano ADI','https://www.adisalus.it/assistenza-domiciliare-ad-alta-intensita/')]},
    {id:'vivisol',name:'Vivisol · cure domiciliari Lazio',regime:'adi',label:'ADI · erogatore privato riportato negli elenchi ASL',asls:['roma2','roma3'],verification:'parziale',
      description:'Prestazioni fisioterapiche domiciliari dichiarate dal gestore nell’ambito delle cure domiciliari e del piano assegnato. Non è stato accertato un distinto titolo domiciliare ex art. 26.',
      seats:'Centrali dichiarate: via Tiburtina 912 per Roma 2; piazza Antonio Meucci 23 per Roma 3. Sono sedi operative, non ambulatori con accesso diretto attestato.',
      coverage:'Riscontro istituzionale negli elenchi ADI Roma 2 e Roma 3. Il sito indica anche Roma 1: tale dichiarazione non è usata per il filtro dei riscontri ASL.',
      access:'Richiesta sanitaria al servizio territoriale e valutazione ASL; prestazioni e frequenza dipendono dal piano. Non convertire tempi dichiarati dopo l’affidamento in tempi garantiti dalla prima richiesta.',
      qualifications:'Prestazioni fisioterapiche dichiarate; qualifiche individuali del professionista assegnato da verificare.',
      contacts:[{label:'Centrale ADI Roma 2',phone:'0652200349',email:'adi_rm2@vivisol.it'},{label:'Centrale ADI Roma 3',phone:'0669315698',email:'adi_rm3@vivisol.it'}],url:'https://curedomiciliari.vivisol.it/cure-domiciliari-lazio',
      caution:'Contratto corrente, concreta assegnabilità e disponibilità non verificati. Vivisol/Vivicare non sono inseriti come due operatori distinti.',sources:[sources.roma2list,sources.roma3list,source('Gestore: sedi e prestazioni fisioterapiche nel Lazio','https://curedomiciliari.vivisol.it/cure-domiciliari-lazio')]},
    {id:'unisan-majorana',name:'Unisan · Centro di via Quirino Majorana',regime:'ex26',label:'Riabilitazione ex art. 26 · centro privato accreditato',asls:['roma3'],verification:'confermato',
      description:'Centro ambulatoriale e domiciliare documentato dalla ASL Roma 3. Il gestore descrive fisioterapia domiciliare per persone con disabilità nell’ambito del progetto riabilitativo individuale.',
      seats:'Servizio domiciliare del centro: via Quirino Majorana 145, Roma. Non confonderlo con il centro autismo di via Sbricoli o con le centrali ADI del gruppo.',
      coverage:'Centro documentato nel territorio ASL Roma 3; bacino domiciliare puntuale da verificare con centro e ASL. Non viene attribuita automaticamente copertura Roma Est.',
      access:'Percorso ex art. 26 con prescrizione specialistica e autorizzazioni previste dalla ASL. Il gestore descrive l’inserimento in lista d’attesa; non sono stati verificati posti o tempi disponibili.',
      qualifications:'Fonte istituzionale e dichiarazione del centro concordano sul regime domiciliare. Ciò non costituisce verifica individuale dei fisioterapisti.',phone:'3757912922',email:'domiciliare.m@unisan.it',url:'https://unisan.it/accreditamenti/',
      caution:'Confermato riguarda il riscontro documentale del centro e del regime, non disponibilità o copertura puntuale. L’indice ASL presenta l’elenco al 31/12/2025, ma nome del PDF e titolo richiamano il 18/03/2025 e il 09/06/2025: non attestano una revisione attuale del singolo centro. Non si deduce l’identità di CIR da recapiti condivisi, né si estende a ogni sede del gruppo il medesimo accreditamento.',sources:[sources.roma3ex,sources.roma3table,source('Gestore: centro Majorana, fisioterapia e recapito domiciliare','https://unisan.it/accreditamenti/','2026-10')]},
    {id:'fisiosalaria',name:'FisioSalaria',regime:'privato',label:'Prestazioni private a pagamento',asls:[],verification:'parziale',types:['motoria','postoperatoria','mobilita'],
      description:'Il sito dichiara fisioterapia post-operatoria, mobilizzazioni ed esercizi personalizzati a domicilio, anche per persone con mobilità ridotta.',
      seats:'Sedi pubblicate: via San Gaggio 5; via Collalto Sabino 88/90; via Giuseppe Ghislieri 25, Roma.',
      coverage:'Tutta Roma è una dichiarazione dell’operatore. Servizio nella specifica zona e disponibilità del professionista vanno confermati; nessun Municipio viene presentato come copertura verificata individualmente.',
      access:'Richiesta diretta all’operatore tramite sito, telefono o WhatsApp 340 7594636. Nessuna richiesta viene inviata da COINSIEME.',
      costs:'Pagina consultata il 30/10/2026: da 40 euro per una seduta di 50 minuti. È un prezzo pubblicato, non un preventivo individuale: importo, eventuali costi aggiuntivi e condizioni vanno riconfermati. Le promozioni non sono riproposte qui.',
      qualifications:'Abilitazione dichiarata dal gestore; nominativo e iscrizione all’Albo del fisioterapista assegnato non verificati. Controllarli prima di concordare il percorso.',phone:'0685912646',email:'info@fisiosalaria.it',url:'https://www.fisiosalaria.it/fisioterapia-domicilio-roma',
      caution:'Nessuna convenzione SSR o partnership COINSIEME viene attribuita alla prestazione. Tempi e disponibilità non accertati.',sources:[source('FisioSalaria: servizio domiciliare, sedi e listino pubblicato','https://www.fisiosalaria.it/fisioterapia-domicilio-roma')]}
  ];
  providers.push(
    {id:'alessandro-faiella',name:'Dott. Alessandro Faiella · Fisioterapia a domicilio',regime:'privato',label:'Professionista privato · prestazioni a pagamento',asls:[],verification:'parziale',types:['motoria','mobilita'],
      description:'Fisioterapia domiciliare in ambito ortopedico e neurologico, secondo il profilo professionale pubblicato da Medelit. La presenza a Roma Est è confermata dal Presidente della Fondazione, non da un riscontro diretto del professionista.',
      seats:'Roma Est: presenza confermata dal Presidente il 20 novembre 2026. Nessun indirizzo di ambulatorio verificato in questa scheda.',
      coverage:'Il profilo Medelit documenta attività domiciliare a Roma. Zona specifica, disponibilità e modalità della visita vanno concordate; non si presume copertura di tutti i quartieri di Roma Est.',
      access:'Richiesta diretta al professionista oppure tramite il profilo Medelit. Il telefono sotto è quello della scheda Google segnalata alla Fondazione, non un numero confermato direttamente dal professionista. Nessuna prenotazione gestita da COINSIEME.',
      costs:'Prestazioni private a pagamento. Importi e condizioni non riportati: richiedere preventivo per la zona e la prestazione necessaria.',
      qualifications:'Il profilo Medelit descrive la laurea in Fisioterapia e l’attività domiciliare. L’iscrizione attuale all’Albo non è stata verificata individualmente: controllarla prima di concordare il trattamento.',
      contacts:[{label:'Recapito professionale dalla scheda Google segnalata · da riconfermare',phone:'3497507990'}],url:'https://www.medelit.com/it/chi-siamo/professionisti/faiella-fisioterapista-roma/',
      caution:'Non è una conferma diretta del professionista, né una garanzia di disponibilità. Distinte le informazioni del fornitore dalla conferma territoriale del Presidente. Nessuna convenzione SSR o partnership attribuita.',
      sources:[{label:'Medelit · profilo di Alessandro Faiella e attività domiciliare a Roma; pagina consultata direttamente',url:'https://www.medelit.com/it/chi-siamo/professionisti/faiella-fisioterapista-roma/',checkedAt:'2026-11-20'}]},
    {id:'fisio-home-marco-russo',name:'Fisio Home · centro del Dott. Marco Russo',regime:'privato',label:'Centro privato · fisioterapia domiciliare a pagamento',asls:[],verification:'parziale',types:['motoria','postoperatoria','mobilita'],
      description:'Il centro dichiara fisioterapia a domicilio per persone con difficoltà di movimento o nel recupero post-operatorio, previa verifica della zona e della disponibilità.',
      seats:'Via Francesco Laparelli 124, 00176 Roma, secondo il sito ufficiale. L’indirizzo non attesta accessibilità fisica dello studio.',
      coverage:'Roma Est e Sud-Est sono indicate dal gestore per il servizio domiciliare. Concordare il singolo indirizzo, disponibilità e assistenza necessaria; nessuna copertura universale garantita.',
      access:'Contattare il centro indicando zona e prestazione richiesta. Non inviare dati sanitari a COINSIEME. Prenotazione e accordi avvengono direttamente con il centro.',
      costs:'Servizio privato a pagamento; tariffe domiciliari non verificate. Richiedere preventivo, eventuali maggiorazioni di trasferta e condizioni di cancellazione. Non si attribuiscono convenzioni SSR o rimborsi assicurativi al singolo caso.',
      qualifications:'Sul sito il responsabile dichiara un’iscrizione professionale. Iscrizione attuale all’Albo e identità del fisioterapista assegnato non verificate individualmente da COINSIEME.',phone:'0621128892',email:'info@fisioterapiaroma.eu',url:'https://www.fisioterapiaroma.eu/fisioterapia-domiciliare-a-roma/',
      caution:'Dati ricavati dal sito ufficiale il 20 novembre 2026, non confermati direttamente dal centro. Tempi, disponibilità e condizioni economiche da concordare. Nessuna partnership con COINSIEME.',
      sources:[{label:'Fisio Home · servizio domiciliare e zone dichiarate',url:'https://www.fisioterapiaroma.eu/fisioterapia-domiciliare-a-roma/',checkedAt:'2026-11-20'},{label:'Fisio Home · sede, telefono ed email sul sito ufficiale',url:'https://www.fisioterapiaroma.eu/',checkedAt:'2026-11-20'}]}
  );
  providers.push(...[
    {id:'teresa-delle-fave',name:'Teresa delle Fave · Fisioterapia a domicilio',types:['motoria','mobilita'],
      description:'La fisioterapista dichiara terapie manuali domiciliari, anche per mobilizzazione e riabilitazione motoria. Le terapie strumentali del suo sito sono indicate solo in ambulatorio, non a domicilio.',
      seats:'Ambulatorio dichiarato: FKT Gruppo Fantauzzi, via Altavilla Irpina 17, Roma. Accessibilità fisica non verificata.',
      coverage:'Zone dichiarate: Centocelle, Alessandrino, Tuscolana, Cinecittà, Anagnina, Romanina, Morena, Capannelle e Appio Claudio. Verificare il singolo indirizzo e l’appuntamento.',
      phone:'3493947304',url:'https://www.teresadellefave.it/'},
    {id:'don-bosco-home-care-fisio',name:'Don Bosco Home Care · Fisioterapia a domicilio',types:['motoria','postoperatoria','mobilita'],
      description:'Il gestore presenta sedute fisioterapiche domiciliari per anziani, persone con ridotta mobilità o nel recupero post-operatorio, con valutazione iniziale del percorso.',
      seats:'Il riferimento riguarda il servizio domiciliare. Indirizzo della sede non verificato in questa ricognizione.',
      coverage:'Roma è il territorio dichiarato dal gestore, che cita anche Tuscolano, Cinecittà e Prenestino. Copertura puntuale e disponibilità vanno confermate; non sono riprese le promesse di attivazione entro tempi prestabiliti.',
      url:'https://www.donboscohomecare.it/servizi/fisioterapia-a-domicilio/'},
    {id:'privatassistenza-appia-tuscolana-fisio',name:'PrivatAssistenza Roma Appia Tuscolana · Fisioterapia a domicilio',types:['motoria','postoperatoria','mobilita'],
      description:'Il centro presenta fisioterapia domiciliare, rieducazione motoria e percorsi post-intervento per persone anziane o con difficoltà di movimento.',
      seats:'Via Assisi 97, Roma, secondo la pagina del centro. La sede non prova accessibilità o disponibilità domiciliare.',
      coverage:'Zone dichiarate dal centro: Tuscolana, Appia Tuscolana, Appio Latino, Prenestino Centocelle e Prenestino Labicano. Concordare la copertura dell’indirizzo richiesto.',
      phone:'0676967914',url:'https://www.privatassistenza.it/roma/centro-roma-tuscolano/fisioterapia-a-domicilio/'},
    {id:'fisioterapia-preneste-domicilio',name:'Fisioterapia Preneste · Servizio a domicilio',types:['motoria','mobilita'],
      description:'Il centro dichiara anche un servizio fisioterapico a domicilio. Le attività svolte nello studio o in piscina non sono automaticamente disponibili nell’abitazione.',
      seats:'Via Prenestina 238, 00176 Roma, secondo il sito ufficiale.',
      coverage:'Sede sul territorio Prenestino; la pagina non definisce il bacino del servizio domiciliare. Non si deduce la copertura del Municipio V o di tutta Roma dalla sede: chiedere conferma della zona.',
      phone:'0627800465',url:'https://www.fisioterapiapreneste.it/chi-siamo/'},
    {id:'luigi-litta-domicilio',name:'Luigi Litta · Fisioterapia domiciliare nella provincia sud-est',types:['motoria','mobilita'],
      description:'Il profilo professionale pubblicato su AIFI descrive fisioterapia domiciliare in ambito ortopedico e neurologico.',
      seats:'Il profilo indica domicilio dei pazienti nella provincia di Roma e attività in studio ai Castelli Romani. Nessun indirizzo di studio verificato qui.',
      coverage:'Provincia sud-est di Roma, zone Prenestina, Casilina e Tuscolana, secondo il profilo AIFI. Non si equipara questa indicazione alla copertura di tutti i quartieri di Roma Est: concordare comune e indirizzo.',
      qualifications:'Il profilo AIFI riporta laurea in Fisioterapia e iscrizione FNOFI Lazio n. 355. Sono dichiarazioni del profilo: l’iscrizione corrente non è stata verificata direttamente nell’Albo. AIFI non è un ulteriore erogatore del servizio.',
      phone:'3387679955',email:'luigi.77@virgilio.it',url:'https://fisioterapisti.aifi.net/luigi-litta/'},
    {id:'fisionoleggio-top-physio-domicilio',name:'Fisionoleggio · Servizio domiciliare Top Physio',types:['motoria','postoperatoria','mobilita'],
      description:'Il sito di fisioterapia domiciliare presenta il servizio Top Physio e identifica Fisionoleggio S.r.l. nei contatti. Sono riuniti in una sola scheda, non conteggiati come operatori distinti.',
      seats:'Sede operativa dichiarata: via della Stazione Tuscolana 122, Roma. Altra sede nei contatti: via degli Olmetti 34, Formello.',
      coverage:'Il gestore dichiara un servizio nazionale. La sede romana non garantisce copertura di ogni quartiere: richiedere espressamente disponibilità e condizioni per Roma Est.',
      phone:'3351317516',url:'https://www.fisioterapiadomiciliare.com/',sourceUrls:['https://www.fisioterapiadomiciliare.com/','https://www.fisioterapiadomiciliare.com/contatti/']},
    {id:'centro-fisioterapia-roma-domicilio',name:'Centro Fisioterapia Roma · Servizio a domicilio',types:['motoria','postoperatoria','mobilita'],
      description:'Il centro presenta fisioterapia domiciliare, riabilitazione motoria e post-operatoria per persone con difficoltà a raggiungere lo studio.',
      seats:'Via Aurelia 429, interno 1/b, Roma, secondo il sito del centro. Non è una sede di Roma Est.',
      coverage:'Il gestore dichiara Roma entro e oltre il raccordo e cita anche Centocelle, Colli Aniene e Tuscolano. Concordare il singolo indirizzo: la dichiarazione non attesta disponibilità attuale.',
      phone:'0666018356',url:'https://www.centrofisioterapiaroma.it/fisioterapia-a-domicilio-roma/'}
  ].map(({sourceUrls,...record})=>({
    regime:'privato',label:'Prestazioni private a pagamento · servizio domiciliare dichiarato',asls:[],verification:'parziale',
    access:'Contattare direttamente il professionista o il centro dal recapito o sito indicato, precisando zona e prestazione necessaria. COINSIEME non prenota e non raccoglie dati sanitari.',
    costs:'Prestazioni a pagamento: richiedere un preventivo aggiornato, eventuali costi di trasferta e condizioni di cancellazione. Nessuna tariffa, gratuità o copertura SSR o assicurativa viene garantita da questa scheda.',
    qualifications:'Attività fisioterapica dichiarata nella fonte indicata. Identità e iscrizione attuale all’Albo del professionista incaricato non verificate individualmente da COINSIEME: controllarle prima del trattamento.',
    caution:'Informazioni ricavate da fonti pubbliche consultate il 20 novembre 2026, non da una conferma diretta a COINSIEME. Disponibilità, tempi e idoneità al singolo caso da concordare. Nessuna partnership attribuita.',
    ...record,sources:(sourceUrls||[record.url]).map(url=>({url,label:record.id==='luigi-litta-domicilio'?'AIFI · profilo professionale con attività domiciliare dichiarata':record.name+' · sito del fornitore',checkedAt:'2026-11-20'}))
  })));
  providers.push({id:'domus-salus-fisioterapia',name:'Domus Salus / Ital Salus · Fisioterapia domiciliare',entity:'Domus Salus / Soccorso Medico Domiciliare · P. IVA 01222340570',regime:'privato',label:'Prestazioni private a pagamento',asls:[],verification:'parziale',coverageBasis:'roma-est',description:'Il gestore presenta un servizio di fisioterapia domiciliare per recupero motorio e riabilitazione, da concordare con il professionista.',seats:'Via Nomentana 122, Roma. Non è una sede di Roma Est.',coverage:'La pagina fisioterapica cita Roma Est, fra cui Centocelle, Alessandrino, Prenestino, Collatina e Tor Sapienza. Disponibilità da confermare per il singolo indirizzo.',access:'Contatto diretto con il gestore per prestazione, professionista incaricato e preventivo.',costs:'Prestazioni private a pagamento: chiedere preventivo aggiornato e condizioni di cancellazione.',qualifications:'Identità e iscrizione del fisioterapista incaricato non verificate individualmente.',caution:'Un solo soggetto: i siti Domus Salus e Soccorso Medico Domiciliare riportano la stessa partita IVA. Nessuna conferma diretta o partnership con COINSIEME.',phone:'3518688821',url:'https://www.domussalus.it/specialisti/fisioterapista-a-domicilio-roma/',sources:[{url:'https://www.domussalus.it/specialisti/fisioterapista-a-domicilio-roma/',label:'Domus Salus · fisioterapia domiciliare e zone servite',checkedAt:'2026-11-20'}]});
  const shared=typeof module==='object'&&module.exports?require('./cure-domiciliari-data.js'):root.SportelloCureDomiciliariData;
  providers.push(...[...shared.adi.filter(r=>!r.existingPhysioId),...shared.privateCenters].map(r=>({
    id:r.id+'-fisioterapia',name:r.name+' · Fisioterapia a domicilio',entity:r.entity||r.name,regime:r.regime,
    label:r.regime==='adi'?'Percorso ADI · valutazione e PAI della ASL':'Prestazioni private a pagamento',
    asls:r.regime==='adi'?['roma2']:[],verification:'parziale',coverageBasis:r.coverageBasis,
    description:r.regime==='adi'?'L’ente descrive interventi riabilitativi domiciliari nell’ambito dell’ADI. Le prestazioni e la frequenza dipendono dalla valutazione e dal piano della ASL.':'Servizio fisioterapico domiciliare dichiarato dal centro, distinto dalle prestazioni infermieristiche. Attività specifiche da concordare.',
    seats:r.address||'Sede non riportata in questa scheda: consultare la fonte del gestore.',coverage:r.coverage,
    access:r.regime==='adi'?'Richiesta attraverso medico e servizio territoriale; valutazione ASL e PAI. Non si presenta l’ente come un fisioterapista privato prenotabile direttamente.':'Contatto diretto con il centro per quartiere, prestazione e preventivo.',
    costs:r.regime==='adi'?'A carico del servizio sanitario soltanto nel percorso autorizzato e per le prestazioni del PAI. Condizioni attuali da verificare con la ASL.':'Preventivo da concordare con il centro: nessuna tariffa o gratuità confermata.',
    qualifications:'Figure riabilitative dichiarate dall’ente; nominativo e iscrizione del fisioterapista incaricato da verificare individualmente.',
    caution:[r.regime==='adi'?'Elenco ASL del 2025: contratto corrente, disponibilità e assegnabilità non attestati.':'Dati del sito pubblico, non conferma diretta a COINSIEME.',r.sourceNote||''].filter(Boolean).join(' '),
    phone:r.phone,email:r.email,url:r.url,sources:r.sources
  })));
  intro.keywords.push(...providers.map(r=>r.name),'vivicare');
  function chooseProviders(options={}){
    const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
    return providers.filter(r=>(options.path==='privato'?r.regime==='privato':options.path==='pubblico'?r.regime!=='privato':true)&&(!options.asl||options.asl==='tutte'||r.asls.includes(options.asl))&&(!options.regime||options.regime==='tutti'||r.regime===options.regime)&&(!options.type||options.type==='tutti'||r.types?.includes(options.type))&&fold([r.name,r.description].join(' ')).includes(fold(options.query)));
  }
  const data={checkedAt,sources,fullDescription,intro,paths,guides,providers,chooseProviders};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloFisioterapiaData=data;
})(typeof window==='undefined'?globalThis:window);
