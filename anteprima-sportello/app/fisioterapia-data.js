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
  intro.keywords.push(...providers.map(r=>r.name),'vivicare');
  function chooseProviders(options={}){
    const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
    return providers.filter(r=>(options.path==='privato'?r.regime==='privato':options.path==='pubblico'?r.regime!=='privato':true)&&(!options.asl||options.asl==='tutte'||r.asls.includes(options.asl))&&(!options.regime||options.regime==='tutti'||r.regime===options.regime)&&(!options.type||options.type==='tutti'||r.types?.includes(options.type))&&fold([r.name,r.description].join(' ')).includes(fold(options.query)));
  }
  const data={checkedAt,sources,fullDescription,intro,paths,guides,providers,chooseProviders};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloFisioterapiaData=data;
})(typeof window==='undefined'?globalThis:window);
