(function(root){
  'use strict';
  const checkedAt='2026-10-28',subcategory='sostegno-psicologico-online';
  const source=(label,url)=>({label,url,checkedAt});
  const records=[
    {id:'bonus-psiconcologia-lazio',name:'Bonus Psiconcologia — Regione Lazio e Ordine Psicologi',funding:'public',
      entity:'Regione Lazio / Ordine degli Psicologi del Lazio',providerType:'Percorso pubblico finanziato · accesso soggetto a requisiti',
      description:'Colloqui psicologici o psicoterapia per pazienti oncologici e familiari. Modalità telematica documentata per particolari esigenze, da concordare.',
      recipients:'Pazienti oncologici e familiari/congiunti ammessi al beneficio secondo i requisiti della misura.',
      requirements:'Lazio: residenza o domicilio da almeno 6 mesi, ISEE inferiore a 40.000 euro e documentazione oncologica. Il beneficio viene valutato dall’Ordine.',
      credentials:'Professionisti aderenti iscritti alla sezione A dell’Albo del Lazio; esperienza psiconcologica dichiarata nel curriculum, soggetta ai controlli dell’Ordine.',
      costs:'Voucher fino a 1.200 euro per 16 colloqui; nessun contributo aggiuntivo per le prestazioni coperte. Ammissione e fondi residui da verificare sul portale ufficiale.',
      access:'Richiesta e scelta del professionista sul portale regionale tramite SPID/CIE, anche con delega prevista. Non su COINSIEME.',
      duration:'Durata e calendario da concordare con il professionista.',
      notes:['Il portale pubblico descrive come presentare la domanda. Accettazione di nuove richieste e stato individuale si verificano in area riservata: COINSIEME non li ha controllati e non garantisce fondi disponibili.'],
      audienceEvidence:'Percorso specificamente rivolto alla malattia oncologica e alla famiglia; non è un bonus generale per ogni caregiver.',
      url:'https://psiconcologia.lazio.it/',onlineItaly:false,zone:'Lazio · colloqui telematici secondo requisiti ed esigenze del beneficiario.',
      sources:[source('Ordine Lazio: requisiti, voucher e modalità telematica','https://ordinepsicologilazio.it/bonus-psiconcologia'),source('Portale pubblico del Bonus Psiconcologia','https://psiconcologia.lazio.it/')]},
    {id:'psicodigitale',name:'Psicodigitale — Colloqui online',entity:'Psicodigitale · portale di professionisti autonomi',
      description:'Colloqui individuali e di coppia in videochiamata, con abbinamento a un professionista dopo una richiesta sul sito.',
      recipients:'Persone che cercano un percorso psicologico individuale o di coppia.',
      credentials:'Le condizioni dichiarano valutazione della domanda, colloquio e verifica dell’iscrizione all’Albo regionale. Per la psicoterapia verificare anche l’annotazione del singolo professionista.',
      costs:'45 euro individuale, 55 euro coppia; primo incontro conoscitivo gratuito. Il colloquio iniziale non rende gratuito il percorso successivo.',
      duration:'Sedute di almeno 45 minuti secondo le condizioni; durata del primo incontro da verificare.',
      access:'Richiesta sul sito; pagamento mediante link online, carta o bonifico. Frequenza e disdette da concordare prima di iniziare.',
      audienceEvidence:'Non verificato un percorso specialistico dedicato a disabilità, anziani o caregiver: chiedere competenze e adeguatezza al professionista.',
      notes:['Le condizioni identificano un’attività con sede a Londra: leggere contratto, informativa e gestione dei dati prima di accettare.'],
      emails:[{label:'Informazioni operatore',address:'info@psicodigitale.it'}],url:'https://www.psicodigitale.it/home',
      sources:[source('Psicodigitale: funzionamento, prezzi e pagamento','https://www.psicodigitale.it/home'),source('Psicodigitale: condizioni e selezione dei professionisti','https://www.psicodigitale.it/termini-e-condizioni')]},
    {id:'psicologo4u',name:'Psicologo 4U — Colloqui online',entity:'Psicologo 4U · piattaforma di professionisti autonomi',
      description:'Percorsi individuali o di coppia online; scelta del professionista attraverso il sito.',
      recipients:'Persone che cercano colloqui individuali o di coppia.',
      credentials:'Il sito presenta professionisti iscritti all’Albo; le condizioni identificano il terapeuta come fornitore. Procedura dettagliata di controllo dei titoli da verificare; controllare il nominativo nell’Albo e l’annotazione per la psicoterapia.',
      costs:'49 euro individuale, 59 euro coppia. Consulenza conoscitiva di 15 minuti gratuita documentata dal centro assistenza; condizioni da riconfermare prima di prenotare.',
      duration:'50 minuti per le sedute; 15 minuti per la consulenza gratuita, distinta dalla seduta completa.',
      access:'Questionario, scelta e prenotazione in piattaforma. Carta tramite Stripe: pagamento iniziale e successivi addebiti prima degli appuntamenti. Disdetta almeno 24 ore prima secondo le condizioni.',
      audienceEvidence:'Competenze specifiche per disabilità, anziani e caregiver da verificare con il singolo professionista.',
      notes:['Le condizioni richiamano legge e giurisdizione inglesi; leggere il contratto applicabile. COINSIEME non ne certifica la conformità e non interviene nel rapporto contrattuale.'],
      emails:[{label:'Assistenza operatore',address:'hello@psicologo4u.com'}],url:'https://psicologo4u.com/',
      sources:[source('Psicologo 4U: servizio e professionisti','https://psicologo4u.com/'),source('Psicologo 4U: tariffe e condizioni contrattuali','https://app.psicologo4u.com/termini'),source('Centro assistenza: consulenza gratuita di 15 minuti','https://psicologo4u.tawk.help/article/cosa-devo-fare-quando-ricevo-la-prenotazione-di-una-consulenza-gratuita-di-15-minuti')]},
    {id:'santagostino-psiche',name:'Santagostino Psiche — Percorsi online',entity:'Santagostino · area Psiche',
      description:'Percorsi psicologici e di psicoterapia in videochiamata; accesso privato distinto dalle prestazioni pubbliche.',
      recipients:'Adulti, coppie e famiglie; verificare il percorso adatto alla propria situazione.',
      credentials:'Il sito pubblica l’équipe e i profili professionali. Il protocollo completo di verifica dell’Albo non è stato accertato nelle pagine consultate: verificare nominativo e abilitazione prima del percorso.',
      costs:'Percorso adulti online: 50 euro; coppia online: 65 euro. Primo colloquio gratuito per adulti e coppie nel percorso generale. I percorsi specialistici possono avere condizioni diverse.',
      duration:'Da verificare nella specifica prestazione: non applicare automaticamente la durata di altri percorsi al primo colloquio.',
      access:'Prenotazione sul sito ufficiale; importo, modalità di pagamento e cancellazioni da verificare nella prestazione prima di confermare.',
      audienceEvidence:'Sono documentati percorsi per adulti e famiglie; un percorso specialistico per anziani, disabilità o caregiver va verificato, non dedotto dall’accesso online.',
      url:'https://www.santagostino.it/it/psiche',sources:[source('Santagostino Psiche: percorsi e tariffe','https://www.santagostino.it/it/psiche'),source('Consulenza psicologica online: modalità ed équipe','https://www.santagostino.it/it/prestazioni/colloquio-psicologico-online')]},
    {id:'serenis',name:'Serenis — Sostegno e psicoterapia online',entity:'Serenis · servizio psicologico online',
      description:'Supporto psicologico o psicoterapia in videochiamata, con professionista scelto dopo un questionario esterno.',
      recipients:'Persone che cercano un percorso individuale o di coppia.',
      credentials:'Serenis dichiara specializzazione in psicoterapia, selezione in più fasi e valutazione clinica esterna. Non è una verifica individuale COINSIEME: controllare Albo e annotazione del professionista assegnato.',
      costs:'49 euro individuale, 59 euro coppia. Primo colloquio gratuito nei due percorsi; non gratuità delle sedute successive.',
      duration:'Individuale: 45 minuti; coppia: 55 minuti, anche per il primo colloquio secondo la pagina prezzi.',
      access:'Questionario e registrazione sul sito/app; prenotazione in area personale. Carta e altri metodi indicati nelle FAQ; verificare addebiti e regole di cancellazione.',
      audienceEvidence:'Non è stata verificata una specializzazione comune a tutti i terapeuti su disabilità, invecchiamento o caregiver.',
      emails:[{label:'Assistenza tecnica e amministrativa',address:'assistenza@serenis.it'}],url:'https://www.serenis.it/',
      sources:[source('Serenis: prezzi e durata','https://www.serenis.it/prezzi'),source('Serenis: selezione e qualifiche dichiarate','https://help.serenis.it/it/articles/5450646-i-professionisti-di-serenis-sono-qualificati'),source('Serenis: accesso, pagamenti e assistenza','https://www.serenis.it/faq')]},
    {id:'unobravo',name:'Unobravo — Colloqui psicologici online',entity:'Unobravo · servizio psicologico online',
      description:'Colloqui individuali e di coppia online con psicologi e psicoterapeuti; primo incontro conoscitivo.',
      recipients:'Persone che cercano sostegno individuale o di coppia; concordare l’adeguatezza del percorso.',
      credentials:'Le FAQ dichiarano l’iscrizione di tutti i professionisti all’Albo nazionale e una selezione interna. Per la psicoterapia controllare anche l’annotazione del professionista scelto; nessuna verifica individuale COINSIEME.',
      costs:'49 euro individuale, 59 euro coppia; primo incontro conoscitivo gratuito e non vincolante. Nessun abbonamento per questi percorsi.',
      duration:'50 minuti per seduta; confermare la durata dell’incontro conoscitivo.',
      access:'Questionario sul sito/app, abbinamento e appuntamento concordato con il professionista. Carta, Apple Pay o Google Pay; disdetta almeno 24 ore prima secondo le FAQ.',
      audienceEvidence:'Il sito pubblica contenuti sul carico assistenziale dei caregiver: non certificano una competenza comune a tutti i professionisti. Eventuali gruppi e percorsi specifici sono da riconfermare.',
      url:'https://www.unobravo.com/',sources:[source('Unobravo: percorsi e prezzi','https://www.unobravo.com/come-funziona-e-prezzi'),source('Unobravo: Albo, durata e pagamenti','https://www.unobravo.com/faq'),source('Contenuto informativo sui caregiver, non disponibilità di percorsi','https://www.unobravo.com/post/il-costo-psicologico-del-carico-assistenziale-nel-caregiver')]} 
  ];
  const intro={id:'info-sostegno-psicologico-online',name:'Sostegno psicologico online',category:'salute',categories:['salute','domicilio'],subcategory,homeKind:'psicologia',groupByCategory:{salute:subcategory,domicilio:subcategory},status:'informazione_orientativa',remoteItaly:true,
    description:'Parlare in videochiamata può ridurre gli spostamenti di persone con disabilità o anziane e di chi assiste un familiare. Adeguatezza, accessibilità e competenze specifiche vanno concordate con il professionista.',
    keywords:['psicologo','psicoterapeuta','caregiver','anziani','disabilità','videochiamata','psiconcologia'],links:[]};
  const resources=[intro,...records.map(r=>({...r,id:'psicologia-'+r.id,category:'salute',categories:['salute','domicilio'],subcategory,homeKind:'psicologia',groupByCategory:{salute:subcategory,domicilio:subcategory},kind:'servizio-online',
    funding:r.funding||'private',costs:r.funding==='public'?r.costs:'Tariffe pubblicate e verificate al 28 ottobre 2026, soggette ad aggiornamento. '+r.costs,
    providerType:r.providerType||'Operatore privato · prestazioni a pagamento',zone:r.zone||'Colloqui online accessibili in Italia; disponibilità e adeguatezza individuale da concordare.',
    remoteItaly:r.onlineItaly!==false,coverageClass:r.onlineItaly===false?'lazio_online':'nazionale_dichiarata',
    declaredCoverage:r.zone||'Servizio online; non sono state censite sedi fisiche o sportelli nel Municipio V.',coverageStatus:'Accesso da remoto documentato; non disponibilità di appuntamenti o accessibilità tecnica certificata.',
    coverageMunicipi:r.onlineItaly===false?['IV','V','VI','VII']:[],
    services:['Colloqui da remoto: verificare con il professionista il tipo di prestazione'],
    requirements:r.requirements||'Controllare identità, iscrizione all’Albo e qualifica per la prestazione scelta; concordare consenso informato e condizioni.',
    notes:[...(r.notes||[]),r.credentials,r.audienceEvidence,'Non sono state verificate individualmente le iscrizioni di tutti i professionisti. Nessuna convenzione o partnership COINSIEME.'],
    availability:'Disponibilità, accessibilità della videochiamata e possibilità di presa in carico da verificare direttamente. Non è pronto intervento.',
    status:'presenza_documentata',verificationScope:'psicologia-online',verifiedAt:checkedAt,source:r.sources[0].url,
    keywords:['psicologo','psicoterapia','sostegno psicologico','caregiver','familiari','anziani','disabilità','videochiamata',r.name],
    links:[{url:r.url,label:'Informazioni e accesso sul sito ufficiale'}]}))];
  function decorate(resource,target){
    const make=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
    if(resource.verificationScope==='psicologia-online')target.append(make('h4','Durata e primo colloquio'),make('p',resource.duration));
    if(resource.id!==intro.id)return;
    const definitions=document.createElement('dl');for(const [name,text]of [
      ['Sostegno psicologico','Colloqui con uno psicologo per affrontare difficoltà e bisogni della persona.'],
      ['Psicoterapia','Percorso con uno psicologo o un medico specificamente abilitato alla psicoterapia. Non tutti gli psicologi sono psicoterapeuti.'],
      ['Psichiatria','Prestazione medica distinta dal colloquio psicologico; non è inclusa automaticamente nei percorsi qui elencati.'],
      ['Emergenze','Questi servizi non sono pronto intervento. Per un’emergenza sanitaria chiama il 112.']])definitions.append(make('dt',name),make('dd',text));target.append(definitions);
    target.append(make('p','La modalità online non sostituisce automaticamente una valutazione in presenza quando necessaria. Nessuna promessa di risultato clinico o accessibilità digitale certificata.'),
      make('h4','Come scegliere e collegarsi'),make('p','Apri il sito ufficiale, controlla il profilo del professionista e l’Albo, chiedi esperienza sul tuo bisogno, poi verifica tariffa, durata, disdetta e modalità di collegamento. Il primo incontro gratuito, dove previsto, non equivale a un percorso gratuito.'),
      make('p','Concorda consenso informato e informativa privacy direttamente con il professionista. Un caregiver può aiutare con il dispositivo solo con l’accordo della persona: la sua presenza durante il colloquio non è automatica. Usa uno spazio riservato, non condividere password e non registrare senza accordo. Chiedi supporti per esigenze uditive, visive o cognitive.'),
      make('p','COINSIEME non raccoglie dati clinici, non prenota, non incassa pagamenti e non certifica né raccomanda clinicamente gli operatori. Il percorso pubblico è soggetto a requisiti; gli altri servizi sono privati a pagamento, elencati in ordine alfabetico, non in graduatoria.'));
    for(const [label,url]of [['Consulta l’Albo unico nazionale degli psicologi','https://areariservata.psy.it/albonazionale/ricerca'],['Consulta l’elenco professionale dell’Ordine del Lazio','https://ordinepsicologilazio.it/albo'],['Ordine Lazio: prestazioni e consenso a distanza','https://ordinepsicologilazio.it/post/prestazioni-a-distanza']]){const p=make('p',''),a=make('a',label);a.href=url;p.append(a,' · Consultata il '+checkedAt);target.append(p);}
  }
  const data={checkedAt,records,resources,decorate};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloPsicologia=data;
})(typeof window==='undefined'?globalThis:window);
