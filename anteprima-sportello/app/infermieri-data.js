/* Fonti pubbliche consultate il 20 novembre 2026, non conferme dirette. */
(function(root){
  'use strict';
  const checkedAt='2026-11-20';
  const records=[
    {id:'aeva-xenior',name:'AEVA / Xenior — Assistenza infermieristica privata',entity:'AEVA Srl',
      description:'Servizio privato di assistenza infermieristica domiciliare, distinto dai percorsi ADI dello stesso gruppo.',
      services:['Assistenza infermieristica domiciliare programmata'],phone:'0665796125',email:'info@aeva.cloud',
      declaredCoverage:'Roma e dintorni. Una comunicazione del gruppo cita Roma Est, La Rustica, Borghesiana e Tuscolana per le assistenze domiciliari; copertura del servizio privato da confermare.',
      coverageBasis:'roma',allRomeDeclared:false,
      caution:'L’annuncio di ricerca del personale documenta attività territoriali, non disponibilità di infermieri né accesso automatico al servizio privato.',
      urls:['https://www.gruppoaeva.it/servizi/xenior/assistenza-infermieristica/','https://www.gruppoaeva.it/lavora-con-noi/infermieri-per-assistenze-domiciliari-roma-di-alta-complessita/']},
    {id:'don-bosco',name:'Don Bosco Home Care — Infermieristica a domicilio',entity:'Don Bosco Home Care',address:'Via Statilio Ottato 81, 00175 Roma',
      description:'Prestazioni infermieristiche domiciliari: prelievi, medicazioni e supporto sanitario secondo il servizio descritto dall’operatore.',
      services:['Prelievi del sangue','Medicazioni semplici e avanzate','Cambio e gestione del catetere vescicale','Iniezioni e terapie endovenose prescritte','Gestione delle stomie'],phone:'0686851139',email:'info@donboscohomecare.it',
      declaredCoverage:'Tutta Roma e città metropolitana dichiarate; il sito cita anche Cinecittà e Tuscolano. Disponibilità al singolo indirizzo da concordare.',
      coverageBasis:'roma-est',allRomeDeclared:true,
      urls:['https://donboscohomecare.it/servizi/servizi-infermieristici-a-domicilio/']},
    {id:'domus-ital-salus',name:'Domus Salus / Ital Salus — Infermieristica a domicilio',entity:'Domus Salus / Soccorso Medico Domiciliare · P. IVA 01222340570',address:'Via Nomentana 122, 00161 Roma',
      description:'Assistenza infermieristica a domicilio per medicazioni, prelievi e gestione delle terapie prescritte. I due siti con la stessa partita IVA sono censiti come un solo riferimento.',
      services:['Prelievi del sangue','Medicazioni avanzate','Cambio e gestione del catetere vescicale','Flebo e terapie endovenose prescritte','Gestione delle stomie e degli accessi vascolari'],phone:'3518688821',
      declaredCoverage:'Roma Est espressamente citata: Centocelle, Alessandrino, Prenestino, Tiburtina, Collatina, Tor Sapienza, Torre Maura e altre zone elencate dall’operatore.',
      coverageBasis:'roma-est',allRomeDeclared:false,coverageMunicipi:['IV','V','VII'],
      caution:'Le due pagine riportano indicazioni differenti sugli orari: non sono riprodotte come disponibilità garantite. Confermare condizioni e recapito operativo. Non sono riportate le attribuzioni municipali incongruenti del sito.',
      urls:['https://www.domussalus.it/servizi/infermiere-a-domicilio-roma/','https://www.soccorsomedicodomiciliare.com/it/infermiere-domicilio-roma']},
    {id:'esa-life',name:'Esa Life Medical — Assistenza infermieristica domiciliare',entity:'Esa Life Medical',
      description:'Servizio domiciliare che comprende medicazioni, prelievi e assistenza alle terapie prescritte. La scheda riguarda l’infermieristica, non la prenotazione di un’ambulanza.',
      services:['Medicazioni','Prelievi del sangue','Emogasanalisi','Assistenza alle terapie prescritte'],phone:'0664467467',
      declaredCoverage:'Roma e provincia dichiarate per i servizi sanitari. La pagina infermieristica indica Roma, senza un elenco dei quartieri: chiedere conferma per Roma Est.',
      coverageBasis:'roma',allRomeDeclared:false,
      urls:['https://www.esa24.it/servizi/assistenza-infermieristica/','https://www.esa24.it/']},
    {id:'farmacia-castelforte',name:'Farmacia Castelforte — Infermieri a domicilio',entity:'Farmacia Castelforte',address:'Via Castelforte 29–33, 00171 Roma',
      description:'La farmacia presenta un servizio infermieristico a domicilio in zona Prenestina, distinto dalla vendita e dalla consegna di prodotti.',
      services:['Medicazioni avanzate','Cambio del catetere vescicale','Clisteri evacuativi','Iniezioni e flebo prescritte'],phone:'062596198',email:'farmaciacastelforte@gmail.com',
      declaredCoverage:'Zona Prenestina dichiarata per le prestazioni infermieristiche. Il sito presenta la farmacia come riferimento anche per Tor Pignattara e Centocelle: verificare il singolo indirizzo.',
      coverageBasis:'roma-est',allRomeDeclared:false,
      urls:['https://www.farmaciacastelforte.it/servizi/servizi-infermieristici-a-domicilio-a-roma/']},
    {id:'for-life',name:'For Life Emergenza — Infermiere a domicilio',entity:'For Life Emergenza Srl',
      description:'Servizio infermieristico privato a domicilio per singole prestazioni e interventi programmati o ricorrenti.',
      services:['Prelievi del sangue','Medicazioni semplici e complesse','Cateterismo vescicale','Clisteri evacuativi','Terapie endovenose prescritte','Gestione delle stomie','Rimozione dei punti di sutura'],phone:'0686976146',
      declaredCoverage:'L’operatore dichiara interventi ovunque a Roma e in provincia. La copertura comprende quindi il quadrante est come dichiarazione cittadina, non come disponibilità già accertata.',
      coverageBasis:'roma',allRomeDeclared:true,
      urls:['https://www.emergenzaforlife.it/servizio/infermiere-domicilio-roma/']},
    {id:'medelit',name:'Medelit — Infermieri a domicilio a Roma',entity:'Medelit',
      description:'Servizio privato che mette in relazione la richiesta domiciliare con i professionisti che coprono l’indirizzo romano indicato sul sito dell’operatore.',
      services:['Prelievi del sangue','Medicazioni e cura delle lesioni da pressione','Cambio e gestione del catetere vescicale','Iniezioni e terapie endovenose prescritte','Gestione delle stomie e degli accessi vascolari'],
      declaredCoverage:'Roma: la copertura effettiva è verificata dal sito Medelit in base all’indirizzo. Non è documentata qui la copertura uniforme di Roma Est.',
      coverageBasis:'roma',allRomeDeclared:false,
      caution:'La pagina di Roma precisa che l’assistenza infermieristica a ore, diurna o notturna, non è attualmente prenotabile: non viene presentata come servizio disponibile.',
      urls:['https://www.medelit.com/it/serviziadomicilio/infermieri-a-domicilio-a-roma/']},
    {id:'pic-siam5',name:'PIC Infermieri a casa — SIAM5',entity:'Siam5 Srl',
      description:'Servizio di intermediazione tra la persona e professionisti autonomi per prestazioni infermieristiche domiciliari concordate, secondo le condizioni pubblicate da PIC.',
      services:['Prelievi del sangue','Medicazioni','Cambio e gestione del catetere vescicale','Clisteri evacuativi e microclismi','Iniezioni e flebo prescritte','Gestione delle stomie e degli accessi vascolari'],phone:'3444489399',email:'info@infermieriacasa.com',
      declaredCoverage:'Roma e area metropolitana dichiarate. Quartieri e copertura del singolo indirizzo a Roma Est da riconfermare prima della richiesta.',
      coverageBasis:'roma',allRomeDeclared:false,
      urls:['https://www.infermieriacasa.com/contatti/','https://www.infermieriacasa.com/servizi-infermieristici-a-domicilio/']},
    {id:'privatassistenza-tuscolana',name:'PrivatAssistenza Roma Appia Tuscolana — Infermieristica',entity:'LO SMERALDO scs · Centro PrivatAssistenza Roma Appia Tuscolana',address:'Via Assisi 97, Roma',
      description:'Il centro dichiara prestazioni sanitarie infermieristiche a domicilio, distinte dall’assistenza familiare e dalla fisioterapia.',
      services:['Prelievi del sangue','Cambio e gestione del catetere vescicale','Clisteri evacuativi','Flebo e terapie endovenose prescritte','Medicazioni semplici e complesse','Gestione delle stomie'],phone:'0676967914',email:'centro@romatuscolano.privatassistenza.it',
      declaredCoverage:'Roma Tuscolana, Appia Tuscolana, Appio Latino, Prenestino Centocelle e Prenestino Labicano citati nella pagina infermieristica del centro. Disponibilità da concordare.',
      coverageBasis:'roma-est',allRomeDeclared:false,
      urls:['https://www.privatassistenza.it/roma/centro-roma-tuscolano/infermiere-a-domicilio/','https://centri.privatassistenza.it/roma/centro-roma-tuscolano/']},
    {id:'roma-medical',name:'Roma Medical Ambulanze — Assistenza infermieristica a casa',entity:'Roma Medical Ambulanze',address:'Via Ignazio Scimonelli 152, 00173 Roma',
      description:'Servizio sanitario privato domiciliare per cure infermieristiche, medicazioni e assistenza dopo il ricovero. È distinto dal trasporto sanitario dello stesso operatore.',
      services:['Medicazioni complesse','Gestione di cateteri e stomie','Iniezioni e flebo prescritte','Monitoraggio dei parametri vitali','Assistenza post-ricovero'],phone:'062009270',email:'romamedicalambulanze@libero.it',
      declaredCoverage:'Sede nel quadrante sud-est di Roma. La pagina documenta il servizio domiciliare ma non ne delimita i quartieri: copertura a Roma Est da confermare.',
      coverageBasis:'sede',allRomeDeclared:false,
      caution:'06 2009270 è il recapito aziendale. Il 112 è il numero pubblico di emergenza, non un numero di Roma Medical.',
      urls:['https://www.romamedicalambulanze.it/assistenza-domiciliare']},
    {id:'sanigest',name:'Sanigest — Assistenza infermieristica domiciliare',entity:'Sanigest',
      description:'Prestazioni infermieristiche sanitarie private a domicilio, secondo il servizio presentato dall’operatore.',
      services:['Medicazioni','Iniezioni e gestione delle terapie prescritte','Monitoraggio dei parametri vitali','Rimozione dei punti di sutura'],email:'prenotazione@sanigest.org',
      declaredCoverage:'Il sito cita Prenestino, Tiburtino e Tuscolano, con un limite dichiarato di 10 km dal centro. Non si presume copertura delle aree più esterne di Roma Est.',
      coverageBasis:'roma-est',allRomeDeclared:false,
      urls:['https://www.sanigest.org/assistenza-infermieristica-domiciliare-a-roma/']},
    {id:'victoria-life',name:'Victoria Life — Assistenza infermieristica domiciliare',entity:'Victoria Life Srl',address:'Vicolo del Fosso di Tor Pagnotta 49, 00134 Roma',
      description:'Assistenza infermieristica privata a domicilio, con medicazioni e supporto post-operatorio descritti nel sito dell’operatore.',
      services:['Medicazioni e cura delle lesioni da pressione','Posizionamento e cambio del catetere vescicale','Clisteri evacuativi','Terapie endovenose e iniezioni prescritte','Gestione degli accessi vascolari'],phone:'065022788',
      declaredCoverage:'Roma e tutto il Lazio dichiarati. Non è una sede a Roma Est; disponibilità e condizioni al singolo indirizzo restano da concordare.',
      coverageBasis:'roma',allRomeDeclared:true,
      urls:['https://www.victorialiferoma.com/assistenza-infermieristica-domiciliare']}
  ];
  records.push({id:'sanit-form',name:'Sanit Form Service — Infermieristica a domicilio',entity:'Sanit Form Service Sas · P. IVA 14550581004',address:'Via Stefano Borgia 66, Roma',description:'Servizio infermieristico domiciliare organizzato, con prestazioni concordate secondo il bisogno assistenziale.',services:['Prelievi del sangue','Medicazioni semplici e avanzate','Cateterismi','Iniezioni e terapie endovenose prescritte','Clisteri evacuativi su prescrizione'],phone:'3931882361',email:'info@sanitformservices.it',whatsapp:'3931882361',declaredCoverage:'Copertura di Roma e di tutto il territorio provinciale dichiarata dal sito: quartiere, disponibilità e preventivo da concordare.',coverageBasis:'roma',allRomeDeclared:true,urls:['https://www.sanitformservices.it/','https://www.sanitformservices.it/contatti/','https://www.sanitformservices.it/servizi/clistere-evacuativo/'],caution:'Le versioni indicizzate e la pagina contatti letta direttamente presentano impaginazioni diverse: riconfermare recapiti e condizioni con il gestore.'});
  const shared=typeof module==='object'&&module.exports?require('./cure-domiciliari-data.js'):root.SportelloCureDomiciliariData;
  records.push(...[...shared.privateCenters,...shared.adi].map(r=>({...r,entity:r.entity||r.name,description:r.regime==='adi'?'Assistenza infermieristica nel percorso ADI: interventi concordati attraverso la ASL e previsti dal piano individuale. Non è una prestazione privata prenotabile direttamente.':'Il centro dichiara assistenza infermieristica a domicilio nelle zone indicate, distinta dalle attività fisioterapiche dello stesso gestore.',declaredCoverage:r.coverage,coverageMunicipi:r.regime==='adi'?['V','VI','VII']:[],allRomeDeclared:false,urls:r.sources.map(s=>s.url),caution:r.sourceNote})));
  for(const r of records){
    const terms=r.services.join(' ');
    const aliases=[[/preliev/i,'prelievo'],[/clister/i,'clistere'],[/endovenos|flebo/i,'endovena'],[/iniezion/i,'iniezione'],[/medicazion/i,'medicazione']].filter(([pattern])=>pattern.test(terms)).map(([,term])=>term);
    Object.assign(r,{id:'infermieri-'+r.id,category:'domicilio',categories:['domicilio','salute'],subcategory:'domiciliare-sanitaria',groupByCategory:{domicilio:'infermieristica'},homeKind:'infermieristica',kind:'territoriale',status:'presenza_documentata',privatePaid:true,providerType:'Servizio infermieristico privato · condizioni economiche da concordare',verificationScope:'servizio',seatMunicipio:null,coverageMunicipi:r.coverageMunicipi||[],zone:r.declaredCoverage,verifiedAt:checkedAt,source:r.urls[0],
      coverageStatus:r.coverageBasis==='roma-est'?'Roma Est o suoi quartieri citati dalla fonte; disponibilità non verificata.':r.allRomeDeclared?'Copertura cittadina dichiarata; nessuna disponibilità individuale accertata.':'Roma o sede romana documentate; copertura di Roma Est da riconfermare.',
      requirements:'Chiarire con l’operatore la prestazione, la documentazione e l’eventuale prescrizione necessaria.',
      access:'Contattare direttamente l’operatore per verificare quartiere, prestazione, orari e preventivo. Non inviare documenti o dati sanitari a COINSIEME.',
      costs:'Servizio privato: chiedere il preventivo complessivo, inclusi materiali, uscita e possibili supplementi. Nessuna gratuità o copertura SSR attestata da questa scheda.',
      availability:'Presenza del servizio documentata da fonti pubbliche, non conferma diretta dell’operatore. Nessuna garanzia di disponibilità, tempi di intervento o continuità assistenziale.',
      notes:['Qualifiche e iscrizioni dei singoli infermieri non verificate individualmente da COINSIEME. Richiedere il nominativo e verificarne l’iscrizione all’Albo.','Non è un servizio di emergenza e non sostituisce il percorso pubblico ADI. Nessuna partnership con COINSIEME attestata.',...(r.caution?[r.caution]:[])],
      phones:r.phone?[{number:r.phone,label:'Recapito pubblicato dall’operatore'}]:[],emails:r.email?[{address:r.email,label:'Email pubblicata dall’operatore'}]:[],links:[],keywords:['infermiere','infermieri','infermieristica','domicilio',r.entity,...r.services,...aliases],sources:r.urls.map(url=>({url,label:'Fonte ufficiale · '+r.entity,checkedAt}))});
    if(r.regime==='adi'){
      r.privatePaid=false;r.providerType='Ente erogatore ADI · accesso tramite ASL';
      r.coverageStatus='Presenza nell’elenco ASL del 2025, non conferma del contratto corrente o disponibilità.';
      r.requirements='Valutazione del bisogno da parte della ASL e attivazione del PAI: non basta contattare l’ente.';
      r.access='Rivolgersi al medico e al CAD/servizio territoriale per la valutazione. L’ente può chiarire i propri recapiti, ma COINSIEME non attiva l’assistenza.';
      r.costs='Percorso a carico del servizio sanitario soltanto quando autorizzato dalla ASL e compreso nel PAI. Nessuna prestazione privata gratuita automaticamente.';
      r.notes=r.notes.filter(n=>!n.includes('non sostituisce il percorso pubblico ADI'));
      r.notes.push('Recapito presente nell’elenco ASL Roma 2 del 15 maggio 2025: da riconfermare con l’ente. Non dedurre posti, tempi o convenzioni correnti dall’elenco.');
      r.sources=shared.adi.find(x=>'infermieri-'+x.id===r.id).sources;
      for(const contact of [...r.phones,...r.emails])contact.label='Recapito nell’elenco ASL del 15/05/2025 · da riconfermare';
    }
  }
  if(typeof module==='object'&&module.exports)module.exports=records;else root.SportelloInfermieriData=records;
})(typeof window==='undefined'?globalThis:window);
