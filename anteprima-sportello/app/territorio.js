/* Verifica documentale del 23 ottobre 2026, non conferma telefonica di disponibilita. */
(function(root){
  const checked='2026-10-23';
  const nursing='https://www.aslroma2.it/index.php?id=279&option=com_content&view=article';
  const municipal='https://www.comune.roma.it/web/it/amministrazione-trasparente-procedimenti-amministrativi-municipi.page?contentId=PRC1569557';
  const pua='https://www.aslroma2.it/index.php/servizi-5d/punto-unico-di-accesso-pua-2';
  const puaMunicipal='https://www.aslroma2.it/index.php/servizi-6d/punto-unico-di-accesso-pua-3';
  const source=(url,label)=>({url,label,checkedAt:checked});
  const phone=(number,label)=>({number,label});
  const cdc=[
    ['santa-caterina','Santa Caterina','Via Niccolò Forteguerri 4, Roma','0651005229'],
    ['bresadola','Bresadola','Via Giacomo Bresadola 56, Roma','0641434812'],
    ['san-felice','San Felice',null,'0641436886'],
    ['la-rustica','La Rustica','Via della Rustica 218, Roma','0641436460']
  ].map(([id,name,address,number])=>({
    id:'territorio-'+id,category:'salute',subcategory:'case-ambulatori',
    name:'Casa della Comunità '+name,entity:'ASL Roma 2',providerType:'Pubblico',
    address,description:'Presidio identificato nelle fonti ASL. È documentato un ambulatorio infermieristico; il recapito indicato riguarda soltanto questo ambulatorio.',
    services:['Ambulatorio infermieristico'],phones:[phone(number,'Ambulatorio infermieristico, non centralino')],
    sources:[source(nursing,'ASL Roma 2 · Ambulatori infermieristici')],
    notes:[],verificationScope:'sede'
  }));
  cdc[2].addressNote='Via degli Eucalipti, Roma: civico 14 nelle pagine operative ASL e nella notizia regionale; civico 20 negli atti amministrativi. Ingresso da confermare.';
  cdc[2].notes=['Civico non univoco: non viene proposto un indirizzo completo da usare senza conferma.'];
  cdc[2].sources.push(
    source('https://www.regione.lazio.it/notizie/sanita-riqualificata-e-rinnovata-la-casa-della-comunita-san-felice-a-centocelle','Regione Lazio · San Felice, 14/11/2025'),
    source('https://www.regione.lazio.it/sites/default/files/amministrazione-trasparente/delibere-a-contrarre/G00335-15012026.pdf','Regione Lazio · Atto amministrativo, 15/01/2026')
  );
  const resources=[...cdc,
    {id:'territorio-adi-d5',category:'salute',categories:['salute','domicilio'],subcategory:'domiciliare-sanitaria',name:'Assistenza domiciliare ASL Roma 2 · Distretto 5',entity:'ASL Roma 2',providerType:'Pubblico',address:'Via Giacomo Bresadola 56, terzo piano, Roma',description:'Servizio distrettuale di assistenza domiciliare sanitaria. Non coincide con l’aiuto domestico o con una badante.',services:['Assistenza domiciliare sanitaria'],recipients:'Residenti o domiciliati nel Distretto con non autosufficienza e difficoltà di accesso agli ambulatori, secondo la valutazione del servizio.',access:'La pagina ASL prevede la richiesta del medico di medicina generale alla Centrale Operativa Territoriale e la valutazione del bisogno. Questo sito non invia richieste.',hours:'Sportello: lunedì, mercoledì e venerdì 8:30–12:30. Non sono gli orari di tutte le prestazioni domiciliari.',phones:[phone('0641434833','Assistenza domiciliare Distretto 5')],sources:[source('https://www.aslroma2.it/index.php/servizi/assistenza-domiciliare-mn','ASL Roma 2 · Assistenza domiciliare')],notes:['Una guida ASL del 2018 indicava un’altra sede: non è utilizzata come riferimento operativo.'],verificationScope:'servizio'},
    {id:'territorio-pua-forteguerri',category:'diritti',categories:['diritti','salute'],name:'PUA Municipio V · Forteguerri',entity:'ASL Roma 2 e Roma Capitale · Municipio V',providerType:'Pubblico',address:'Via Niccolò Forteguerri 4, Roma',description:'Punto di orientamento e accesso integrato ai percorsi sociali e sociosanitari.',services:['Orientamento sociosanitario'],access:'La pagina ASL indica accesso previo appuntamento: contattare il PUA.',phones:[phone('0651008525','PUA Forteguerri')],sources:[source(pua,'ASL Roma 2 · PUA'),source(municipal,'Roma Capitale · Procedimenti municipali'),source('https://salutelazio.it/it/servizi/case-della-comunita','Salute Lazio · Case della Comunità')],notes:['Orari ASL e Comune non coincidenti; Salute Lazio riporta per il PUA un recapito diverso. Non viene pubblicato un orario univoco. Confermare direttamente prima di recarsi in sede.'],verificationScope:'servizio'},
    {id:'territorio-pua-togliatti',category:'diritti',categories:['diritti','salute'],name:'PUA Municipio V · Togliatti',entity:'Roma Capitale · Municipio V, in integrazione con ASL Roma 2',providerType:'Pubblico',address:'Viale Palmiro Togliatti 983, Roma',description:'Sede municipale del Punto Unico di Accesso, per informazioni e orientamento sociosanitario.',services:['Orientamento sociosanitario'],access:'La pagina ASL indica accesso diretto. Confermare con la sede giorni e orari prima della visita.',phones:[phone('0669607626','PUA Togliatti')],sources:[source(municipal,'Roma Capitale · Procedimenti municipali'),source(puaMunicipal,'ASL Roma 2 · Punti di accesso municipali')],notes:['Il Comune include il martedì pomeriggio, la pagina ASL no: orario non univoco, da confermare.'],verificationScope:'servizio'},
    {id:'territorio-guarnieri',category:'salute',subcategory:'ospedali',name:'Clinica Guarnieri',entity:'Clinica Guarnieri S.p.A.',providerType:'Privato',address:'Via Tor de’ Schiavi 139, Roma',description:'Casa di cura identificata sul sito dell’ente. Il regime economico e le condizioni vanno verificati per la singola prestazione.',services:[],access:'La pagina contatti indica prenotazioni di visite ed esami al numero della clinica.',phones:[phone('06245995','Clinica Guarnieri')],sources:[source('https://www.clinicaguarnieri.it/contatti/','Clinica Guarnieri · Contatti')],notes:['L’apertura della struttura H24 non significa disponibilità H24 di visite o prenotazioni.'],verificationScope:'sede'},
    {id:'territorio-casilino',category:'salute',subcategory:'ospedali',name:'Policlinico Casilino · poliambulatori',entity:'Policlinico Casilino',providerType:'Privato · regime della singola prestazione da verificare',address:'Via Casilina 1040, Roma · edifici D ed E, poliambulatori',description:'La mappa ufficiale identifica al civico 1040 i poliambulatori. Non usare questo indirizzo indistintamente per ogni reparto del complesso.',services:['Poliambulatori, edifici D ed E'],phones:[phone('06231881','Centralino del Policlinico, non dei soli poliambulatori')],sources:[source('https://www.policlinicocasilino.it/la-struttura/','Policlinico Casilino · La struttura'),source('https://www.policlinicocasilino.it/contatti/','Policlinico Casilino · Contatti'),source('https://www.lifenet.it/cliniche/policlinico-casilino/','Lifenet · Policlinico Casilino')],notes:['Il sito del gruppo indica 1049 per la struttura generale; 1040 è confermato per i poliambulatori. Chiedere l’ingresso pertinente alla prestazione. Copertura per i residenti del Municipio V non attestata.'],zone:'Roma Est · risorsa di prossimità, non classificata qui come sede del Municipio V',verificationScope:'sede'},
    {id:'territorio-vannini',category:'salute',subcategory:'ospedali',name:'Ospedale Madre Giuseppina Vannini',entity:'Istituto Figlie di San Camillo',providerType:'Ospedale classificato accreditato',address:'Via di Acqua Bullicante 4, Roma',description:'Ospedale identificato dal sito dell’ente. Presenza documentata: prestazioni e disponibilità richiedono verifica specifica.',services:[],phones:[phone('0624291600','CUP · Centro prenotazioni'),phone('0624291900','Prenotazioni private')],sources:[source('https://roma.figliedisancamillo.it/dove-siamo/','Ospedale Vannini · Dove siamo'),source('https://roma.figliedisancamillo.it/','Ospedale Vannini · Sito ufficiale')],notes:['CUP e prenotazioni private sono canali distinti. Non sono indicati tempi di attesa o disponibilità.'],verificationScope:'sede'}
  ];
  const protesica='https://www.aslroma2.it/index.php/servizi-9d/uoc-assistenza-protesica-e-riabilitativa?id=11&view=page';
  const consultori='https://www.aslroma2.it/index.php/component/pagebuilderck/';
  const consultoriFlyer='https://www.aslroma2.it/attachments/article/644/vernice%20violenza%20invito.pdf';
  const demografico='https://www.comune.roma.it/web/it/municipio-v-uffici-e-contatti.page?contentId=UFF27965';
  const urp='https://www.comune.roma.it/web/it/dettaglio.page?contentId=UFF507041';
  const social='https://www.comune.roma.it/web/it/municipio-v-uffici-e-contatti.page?contentId=UFF511749';
  const rubric='https://www.comune.roma.it/web/it/rubrica-uffici.page?cpz=servsoc&mun=municipio_v';
  const email=(address,label)=>({address,label});
  const officeHours='Lunedì 9:00–13:00; martedì e giovedì 9:00–13:00 e 15:00–17:00. Orari pubblicati, non appuntamento garantito.';
  const at=id=>resources.find(r=>r.id==='territorio-'+id);
  const nurseHours=['Lun–ven 8:00–12:30; mar e gio 14:00–17:00.','Lun–ven 8:00–12:30 e 14:00–16:00; sab 8:00–12:30.','Lun–ven 10:30–13:00.','Lun–gio 14:00–17:00; ven 8:30–11:30.'];
  cdc.forEach((r,i)=>{
    r.hours='Solo ambulatorio infermieristico: '+nurseHours[i];
    r.access='La pagina ASL indica accesso diretto o programmato; le condizioni dipendono dalla prestazione. Contattare l’ambulatorio prima di recarsi in sede.';
    r.notes.push('L’elenco generale delle prestazioni infermieristiche non prova che ogni prestazione sia erogata in questa sede.');
  });
  at('adi-d5').emails=[email('adi.distretto5@aslroma2.it','Segreteria ADI D5: non inviare dati sanitari attraverso questo Sportello')];
  at('pua-forteguerri').emails=[email('pua.distretto5@aslroma2.it','PUA Distretto 5')];
  at('pua-togliatti').emails=[email('pua.mun05@comune.roma.it','PUA municipale')];
  for(const id of ['pua-forteguerri','pua-togliatti'])at(id).groupByCategory={salute:'case-ambulatori',diritti:'servizi-sociali'};
  const casilino=at('casilino');
  casilino.access='SSN: impegnativa e tessera sanitaria, prenotazione tramite CUP regionale 06 9939, Salute Lazio o CUP centrale (edificio C). Il laboratorio SSN richiede prenotazione online. Per il privato utilizzare il distinto canale ufficiale della struttura.';
  casilino.requirements='Impegnativa e tessera sanitaria per le prestazioni SSN; verificare il regime della specifica prestazione.';
  casilino.phones.push(phone('069939','CUP regionale · prenotazioni SSN'));
  casilino.sources.push(source('https://www.policlinicocasilino.it/prenotazioni/','Policlinico Casilino · Prenotazioni SSN'));
  const vannini=at('vannini');
  vannini.access='SSN con impegnativa e tessera sanitaria; CUP fisico in Piazza della Marranella 11. Canale telefonico SSN distinto dalle prenotazioni private. Il recapito di via di Acqua Bullicante 4 è la sede ospedaliera.';
  vannini.hours='Telefono SSN: lun–ven 9:00–17:00. Telefono privato: lun–ven 9:00–13:00 e 13:30–17:00. Non sono gli orari di tutti i reparti.';
  vannini.sources.push(source('https://roma.figliedisancamillo.it/centro-unico-di-prenotazione/','Ospedale Vannini · CUP e accesso fisico'));
  at('guarnieri').hours='Prenotazioni visite/esami: lun–sab 8:00–20:00. Non equivale a disponibilità di ogni prestazione.';
  at('guarnieri').notes.push('Non equiparare convenzioni assicurative e prestazioni SSN: il regime economico della singola prestazione resta da confermare.');
  resources.push({
    id:'territorio-protesica-d5',category:'salute',subcategory:'protesica',name:'UOS Assistenza Protesica · 5° Distretto',entity:'ASL Roma 2',providerType:'Pubblico',address:'Via Casilina 395, Roma',
    description:'Ufficio per le richieste e le autorizzazioni di presidi e ausili. Non è una prenotazione di fisioterapia o di trattamento riabilitativo.',
    services:['Valutazione amministrativa e autorizzazione delle richieste di ausili'],verificationScope:'servizio',
    access:'La pagina ASL rinvia al Protocollo Autorizzazioni Protesica 2020. Confermare documentazione e procedura applicabile all’ausilio richiesto.',
    hours:'Ufficio protesico: lunedì, mercoledì e venerdì 8:30–12:00.',
    phones:[phone('0651007731','Ufficio protesico D5')],emails:[email('assistenzaprotesicad5@aslroma2.it','Assistenza protesica D5')],
    sources:[source(protesica,'ASL Roma 2 · Assistenza Protesica D5')],notes:['La fonte contiene anche riferimenti normativi e protocolli storici: non attestiamo l’attualità di ogni procedura o il diritto individuale alla fornitura.']
  });
  const clinics=[
    ['condottieri','Piazza dei Condottieri 34, Roma','0651008553'],
    ['spencer','Via Herbert Spencer 282, Roma','0651008804'],
    ['resede','Via delle Resede 1, Roma',null],
    ['tor-cervara','Via di Tor Cervara 307, Roma',null],
    ['manfredonia','Via Manfredonia 43, Roma',null]
  ];
  for(const [id,address,number] of clinics)resources.push({
    id:'territorio-consultorio-'+id,category:'salute',subcategory:'prevenzione',name:'Consultorio familiare · '+address.replace(', Roma',''),entity:'ASL Roma 2',providerType:'Pubblico',address,
    description:'Sede elencata nella pagina ASL dei consultori del Distretto 5. Le singole attività e l’apertura nel giorno desiderato vanno confermate.',
    services:['Consultorio familiare'],verificationScope:'sede',phones:number?[phone(number,'Consultorio · accoglienza')]:[],
    access:'La pagina ASL collega un portale per visite ginecologiche e ostetriche. Per le altre attività e per l’accoglienza contattare la sede: non è documentata una modalità unica per ogni servizio.',
    hours:null,notes:['La pagina riporta accoglienza 12:15–13:15 senza specificare i giorni: non viene presentato un orario settimanale completo.'],
    sources:[source(consultori,'ASL Roma 2 · Consultori familiari D5')]
  });
  for(const id of ['resede','tor-cervara','manfredonia']){
    const r=at('consultorio-'+id);
    r.sources.push(source(consultoriFlyer,'ASL Roma 2 · Opuscolo consultori'));
    r.notes.push('Recapiti discordanti fra pagina ASL e opuscolo ufficiale: nessun numero proposto come confermato. Consultare la fonte ufficiale per chiarimento.');
  }
  resources.push(
    {id:'territorio-anagrafe',category:'diritti',subcategory:'anagrafe-documenti',name:'Servizi Anagrafici e di Stato Civile · Municipio V',entity:'Roma Capitale · Municipio V',providerType:'Pubblico',address:'Via Torre Annunziata 1, Roma',description:'Atti e certificazioni demografiche. La pagina istituzionale colloca qui gli atti a vista e lo Stato civile trasferito da Prenestina.',services:['Servizi anagrafici e di stato civile'],verificationScope:'servizio',hours:'Orario generale pubblicato: lun, mer e ven 8:30–13:00; mar e gio 8:30–17:00. Non è l’orario specifico CIE.',access:'Modalità diverse secondo l’atto: consultare la pagina ufficiale. Per lo Stato civile è indicato il contatto telefonico per concordare l’appuntamento.',phones:[phone('0669606423','Servizio demografico')],emails:[email('demografico.mun05@comune.roma.it','Informazioni demografiche · posta ordinaria')],sources:[source(demografico,'Municipio V · Anagrafe e Stato civile')],notes:['Nessuna funzione anagrafica attribuita all’URP di via Prenestina.']},
    {id:'territorio-cie',category:'diritti',subcategory:'anagrafe-documenti',name:'Carta d’identità elettronica · Municipio V',entity:'Roma Capitale · Municipio V',providerType:'Pubblico',address:'Via Torre Annunziata 1, Roma',description:'Rilascio CIE nella sede indicata dal Municipio, con prenotazione sul portale del Ministero dell’Interno.',services:['Rilascio CIE'],verificationScope:'servizio',hours:'Fasce CIE: lun, mer e ven 8:30–13:00; mar e gio 8:30–16:30.',access:'Prenotazione attraverso Agenda CIE, seguendo il collegamento del sito municipale. Eventuali aperture aggiuntive vanno verificate sulla pagina ufficiale.',phones:[],emails:[],links:[{url:'https://www.prenotazionicie.interno.gov.it/',label:'Agenda CIE · Ministero dell’Interno'}],sources:[source(demografico,'Municipio V · Modalità e orari CIE')],notes:['La pagina distingue gli orari generali dell’anagrafe da quelli CIE; non estendere le 17:00 alla CIE. Disponibilità degli appuntamenti non verificata.']}
  );
  for(const [id,address,number] of [['torre','Via Torre Annunziata 1, Roma','0669606455'],['prenestina','Via Prenestina 510, Roma','0669607332']])resources.push({
    id:'territorio-urp-'+id,category:'diritti',subcategory:'urp',name:'Ufficio Relazioni con il Pubblico · '+address.replace(', Roma',''),entity:'Roma Capitale · Municipio V',providerType:'Pubblico',address,verificationScope:'servizio',
    description:'Sportello URP per informazioni e rapporti con il Municipio. Non è uno sportello anagrafico.',
    services:['Informazioni municipali e accesso documentale'],hours:'Lun, mer e ven 8:30–12:30; mar e gio 8:30–12:30 e 14:00–16:30.',
    access:'La pagina ufficiale indica gli sportelli negli orari di apertura e i canali di posta; non specifica un appuntamento obbligatorio.',
    phones:[phone(number,'URP · sede '+address.replace(', Roma',''))],emails:[email('ld.mun05@comune.roma.it','URP Municipio V')],
    sources:[source(urp,'Municipio V · Ufficio Relazioni con il Pubblico')],notes:['Gli orari pubblicati includono anche lunedì, mercoledì e venerdì, oltre al riferimento iniziale del martedì e giovedì.']
  });
  const socialOffices=[
    {id:'anziani',name:'Area Anziani',description:'Area sociale richiamata nell’organizzazione del Coordinamento tecnico. Ricevimento e recapiti specifici non confermati.',url:social,emails:[],hours:null,notes:['La pagina di dettaglio collegata dal Municipio non è risultata consultabile. Non sono attribuiti all’Area gli orari o i recapiti di altri uffici.']},
    {id:'disabilita',name:'Area Disabili',description:'Orientamento e presa in carico per persone con disabilità e familiari; assistenza domiciliare e percorsi di socializzazione citati nella pagina istituzionale.',url:'https://www.comune.roma.it/web/it/dettaglio.page?contentId=UFF27766',emails:[],hours:officeHours,notes:['La fonte riporta due grafie diverse dell’email della responsabile: non viene proposto un indirizzo personale corretto per inferenza.']},
    {id:'minori',name:'Area Minori e Famiglie',description:'Area municipale per minori e famiglie; la fonte cita sostegno economico, affido e assistenza domiciliare. Interventi subordinati al percorso competente.',url:'https://www.comune.roma.it/web/it/dettaglio.page?contentId=UFF27764',emails:[],hours:officeHours,notes:[]},
    {id:'adulti',name:'Area Adulti',description:'Ufficio municipale per le persone adulte, riportato nella rubrica dei servizi sociali. Le misure concretamente accessibili richiedono verifica individuale presso l’ente.',url:rubric,emails:[email('sabina.dagostino@comune.roma.it','Responsabile Area Adulti · contatto professionale pubblicato')],hours:officeHours,notes:[]},
    {id:'poverta-abitare',name:'Povertà Emarginazione e Disagio Abitativo',description:'Area competente per inclusione sociale, povertà e disagio abitativo. Non è un elenco di contributi aperti né una garanzia di sostegno economico.',url:'https://www.comune.roma.it/web/it/dettaglio.page?contentId=UFF27765',emails:[email('ufficiotecnicoadi.mun05@comune.roma.it','Ufficio tecnico · povertà e disagio abitativo')],hours:officeHours,notes:['La rubrica contiene ancora sigle di misure storiche: non sono riproposte come prestazioni attualmente disponibili.']}
  ];
  for(const office of socialOffices)resources.push({
    id:'territorio-sociale-'+office.id,category:'diritti',subcategory:office.id==='poverta-abitare'?'sostegni-diritti':'servizi-sociali',
    name:office.name,entity:'Roma Capitale · Municipio V',providerType:'Pubblico',address:office.id==='anziani'?null:'Viale Palmiro Togliatti 983, Roma',
    addressNote:office.id==='anziani'?'Il Coordinamento tecnico è in viale Palmiro Togliatti 983; la sede di ricevimento specifica dell’Area Anziani non è confermata.':null,
    description:office.description,services:[office.name],verificationScope:office.id==='anziani'?'riferimento':'servizio',
    access:'Necessità di appuntamento e modalità del singolo procedimento non confermate: consultare la scheda ufficiale o il PUA municipale prima della visita.',
    phones:[],emails:office.emails,hours:office.hours,sources:[source(office.url,'Municipio V · '+office.name)],notes:office.notes
  });
  for(const resource of resources){
    Object.assign(resource,{kind:'territoriale',status:'presenza_documentata',verifiedAt:checked,source:resource.sources[0].url,zone:resource.zone||'Municipio Roma V · copertura della singola prestazione da verificare',links:resource.links||[],costs:resource.costs||null,availability:'La presenza documentata non garantisce disponibilità, accesso, gratuità o presa in carico per la singola prestazione.'});
  }
  if(typeof module==='object'&&module.exports)module.exports=resources;else root.SportelloTerritorio=resources;
})(typeof window==='undefined'?globalThis:window);
