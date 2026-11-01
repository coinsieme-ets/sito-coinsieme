(function(root){
  'use strict';
  const checkedAt='2026-11-01';
  const source=(label,url,date)=>({label,url,checkedAt,...(date?{date}:{})});
  const note='La Fondazione COINSIEME ETS segnala iniziative e piattaforme esterne a esclusivo scopo informativo. Non pubblica annunci abitativi privati, non gestisce contatti o abbinamenti tra persone e non partecipa agli eventuali accordi di convivenza. Le informazioni e le condizioni delle offerte sono di responsabilità dei rispettivi soggetti che le pubblicano. La Fondazione non garantisce la disponibilità delle proposte né l’affidabilità dei singoli partecipanti';
  const records=[
    {id:'tor-vergata',name:'Insieme Siamo Migliori',entity:'Università degli Studi di Roma Tor Vergata',territory:'roma',type:'convivenza',status:'Percorso universitario documentato; adesioni attuali da confermare',
      description:'Coabitazione tra studenti fuori sede e ospitanti: anziani, famiglie e coppie. Non è assistenza professionale.',
      host:'Contatta il servizio alloggi per conoscere il percorso di valutazione e incontro.',seeker:'Verifica con l’Ateneo requisiti per gli studenti e modalità di candidatura.',
      access:'Il progetto descrive un’équipe che valuta gli abbinamenti e segue le convivenze.',costs:'Contributo alle spese previsto; importo e condizioni da richiedere.',
      availability:'Nessuna stanza verificata. Il portale Convivicon segnalato dall’Ateneo non è risultato verificabile nel controllo: usare prima i contatti istituzionali.',
      eligibility:'Accessibilità degli spazi e partecipazione in presenza di disabilità non accertate.',email:'alloggi@uniroma2.it',phone:'0672592565',
      url:'https://web.uniroma2.it/it/percorso/utilitr_e_servizi/sezione/insieme-siamo-migliori',
      sources:[source('Tor Vergata: progetto e partecipazione','https://web.uniroma2.it/it/percorso/utilitr_e_servizi/sezione/insieme-siamo-migliori'),source('Ateneo: esperienza documentata nel gennaio 2026','https://web.uniroma2.it/it/contenuto/premio-roma-best-practices-awards-2025-a-roma-tor-vergata','2026-01-16')]},
    {id:'coab',name:'Covillaggio / CoAb APS',entity:'CoAb APS, denominazione del gestore',territory:'roma',type:'comunita',siteAccess:'non_confermato',status:'Comunità e progetti in formazione · Operatività e disponibilità attuali da verificare',
      description:'Rete che parte da Roma e facilita gruppi interessati a cohousing e altre forme di coabitazione.',
      host:'Chiedi se e come una casa già disponibile possa inserirsi in un progetto.',seeker:'Consulta le attività e chiarisci il tipo di comunità che cerchi.',
      access:'Il gestore dichiara incontri, formazione e facilitazione dei gruppi. Non equivale a mediazione individuale anziano-studente.',
      costs:'Registrazione gratuita; quota associativa pubblicata di 10 euro annui per le iniziative pertinenti, da riconfermare. Non è un costo dell’alloggio.',
      availability:'Nessuna opportunità abitativa verificata. Pagine reperite tramite motore di ricerca; controllo diretto del sito non concluso per errore DNS. Non prova la cessazione delle attività.',eligibility:'Accessibilità e criteri dei singoli progetti da verificare.',
      url:'https://covillaggio.org/cosafacciamo/',sources:[source('CoAb: attività, adesione e condizioni','https://covillaggio.org/cosafacciamo/'),source('Covillaggio: notizie della rete','https://covillaggio.org/notizie/')]},
    {id:'meglio-milano',name:'Prendi in casa',entity:'MeglioMilano',territory:'milano',type:'convivenza',status:'Percorso di adesione descritto dal gestore; nuove convivenze da confermare',
      description:'Residenti della Città metropolitana di Milano con spazio in casa e giovani fuori sede, studenti o lavoratori.',
      host:'Consulta la procedura per ospitanti; è indicata anche la possibilità di contatto telefonico.',seeker:'Consulta la candidatura esterna, i colloqui e le condizioni di partecipazione.',
      access:'Il gestore descrive incontri, proposta di abbinamento e monitoraggio della convivenza.',costs:'Contributo alle spese previsto. La pagina descrittiva riporta 250–280 euro mensili: importo corrente e altre condizioni da confermare, non preventivo.',
      availability:'Nessuna stanza o abbinamento verificato. Non è un servizio per Roma.',eligibility:'Richiesta di autonomia reciproca; inclusione e accessibilità da chiarire con il gestore.',
      email:'prendiincasa@meglio.milano.it',phone:'0276020589',url:'https://www.meglio.milano.it/prendi-in-casa/come-partecipare/',
      sources:[source('MeglioMilano: modalità di partecipazione','https://www.meglio.milano.it/prendi-in-casa/come-partecipare/'),source('MeglioMilano: progetto e condizioni dichiarate','https://www.meglio.milano.it/prendi-in-casa/il-progetto/'),source('MeglioMilano: recapiti','https://www.meglio.milano.it/prendi-in-casa/contatti/')]},
    {id:'casa-nonni',name:'A casa coi nonni',entity:'Universosud',territory:'potenza',type:'convivenza',status:'Progetto documentato; operatività e ambito attuali da riconfermare',
      description:'Iniziativa nata a Potenza per pensionati autosufficienti e giovani studenti o lavoratori. Non viene attribuita copertura a Roma.',
      host:'Scrivi direttamente al gestore per verificare l’adesione come ospitante.',seeker:'Contatta il gestore per requisiti e possibilità nel territorio effettivamente seguito.',
      access:'Il sito descrive raccolta delle adesioni e abbinamento; continuità del supporto da confermare.',costs:'Previsto un contributo alle spese, senza importo corrente accertato.',
      availability:'Nessun annuncio attuale verificato; le notizie reperite includono esperienze del 2022–2023, non prova di nuove disponibilità.',eligibility:'Autosufficienza indicata per gli ospitanti; non attestata idoneità a bisogni assistenziali o disabilità.',
      email:'hello@acasacoinonni.it',url:'https://www.acasacoinonni.it/',sources:[source('Universosud: progetto e contatti','https://www.acasacoinonni.it/'),source('Archivio del gestore: notizie storiche','https://www.acasacoinonni.it/blog/')]},
    {id:'housinglab',name:'HousingLab',entity:'Associazione HousingLab, Milano',territory:'nazionale',type:'rete',status:'Rete informativa e accompagnamento progettuale, non portale di stanze',
      description:'Mappatura nazionale del cohousing e attività di ricerca, formazione e supporto a comunità abitative.',
      host:'Consulta le risorse per conoscere modelli e progettazione di comunità.',seeker:'Usa la mappa come punto di partenza, verificando poi ogni progetto con il responsabile.',
      access:'Accompagnamento dei gruppi dichiarato; nessun servizio di abbinamento personale attestato.',costs:'Costi di eventuali consulenze o progetti da richiedere; nessun listino abitativo verificato.',
      availability:'La mappa documenta progetti, non certifica posti liberi o attività corrente di ogni iniziativa.',eligibility:'Inclusione e accessibilità dipendono dal singolo progetto.',
      email:'info@housinglab.it',url:'https://www.housinglab.it/',sources:[source('HousingLab: associazione, mappa e attività','https://www.housinglab.it/')]}
  ];
  const experiences=[{title:'Un condominio intergenerazionale: il percorso Green Opificio',description:'Racconto collettivo del percorso di comunità, pubblicato da HousingLab che lo ha accompagnato. È documentazione del gestore, non una recensione indipendente né una disponibilità abitativa attuale.',kind:'Esperienza pubblicata dal gestore',source:source('HousingLab: Green Opificio','https://www.housinglab.it/green-opificio-un-bellesperimento-di-mix-generazionale','2019-09-26')}];
  const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
  const choose=(options={})=>records.filter(r=>(!options.territory||options.territory==='tutti'||r.territory===options.territory)&&(!options.type||options.type==='tutti'||r.type===options.type)&&fold(r.name+' '+r.entity).includes(fold(options.query)));
  const data={checkedAt,note,records,experiences,choose};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloCoabitazioneData=data;
})(typeof window==='undefined'?globalThis:window);
