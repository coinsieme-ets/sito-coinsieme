/* Interessi soltanto in memoria; nessuna lettura del racconto. */
(() => {
  'use strict';
  const root=document.getElementById('esplora-servizi');
  const catalog=window.SportelloServizi,engine=window.SportelloOrientamento;
  const choices=root.querySelector('#servizi-scelte'),results=root.querySelector('#servizi-risultati'),status=root.querySelector('#servizi-stato');
  const make=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
  // Simple line icons supplement the visible labels; they carry no information alone.
  const paths={house:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',people:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a6 6 0 0 1 12 0v3M17 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 5',heart:'M20 5c-3-3-6 0-8 2-2-2-5-5-8-2-5 5 3 11 8 15 5-4 13-10 8-15',chat:'M3 3h18v14H9l-6 4V3M7 8h10M7 12h7',bag:'M4 7h16v14H4V7M8 7V5a4 4 0 0 1 8 0v2',phone:'M6 2h12v20H6V2M10 18h4',route:'M5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M5 8v6h14v2',building:'M2 8 12 2l10 6H2M4 21h16M6 10v8M12 10v8M18 10v8'};
  for(const area of catalog.areas){
    const label=make('label',null,'sp-service-choice'),input=make('input');input.type='checkbox';input.value=area.id;input.id='servizio-'+area.id;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',area.icon==='health'?'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3':paths[area.icon]);svg.append(path);
    const copy=make('span');copy.append(make('strong',area.title),make('span',area.text));label.append(input,svg,copy);choices.append(label);
  }
  function selected(){return [...choices.querySelectorAll('input:checked')].map(input=>input.value);}
  const homeControls=make('fieldset',null,'sp-home-filters');
  homeControls.append(make('legend','Assistenza a domicilio: affina la ricerca'));
  function selectControl(id,label,items){
    const wrapper=make('label',label),select=make('select');select.id=id;
    for(const [value,text] of items){const option=make('option',text);option.value=value;select.append(option);}
    wrapper.append(select);homeControls.append(wrapper);select.addEventListener('change',render);return select;
  }
  const homeKind=selectControl('domicilio-tipo','Che cosa cerchi?',[['tutti','Tutte le tipologie'],['badante','Cerco una badante o un assistente familiare'],['cooperativa','Cerco una cooperativa di assistenza domiciliare'],['pubblico','Cerco i servizi sociali del Municipio'],['ausili','Assistenza tecnica per ausili domestici']]);
  const homeTerritory=selectControl('domicilio-territorio','Territorio',[['tutti','Tutti gli operatori censiti'],['v','Municipio Roma V'],['est','Roma Est · Municipi IV, V, VI e VII'],['roma','Tutta Roma · solo copertura espressamente dichiarata']].filter(([value])=>value!=='roma'||engine.hasDocumentedRomeCoverage(catalog)));
  const national=make('option','Copertura nazionale dichiarata · intervento locale da concordare');national.value='nazionale';homeTerritory.append(national);
  const searchLabel=make('label','Cerca per nome o ausilio'),homeName=make('input');homeName.type='search';homeName.id='domicilio-nome';searchLabel.append(homeName);homeControls.append(searchLabel);homeName.addEventListener('input',render);
  homeControls.append(make('p','I filtri riguardano soltanto Assistenza a domicilio. Municipio V e Roma Est includono sedi accertate o territori documentati, non disponibilità garantita. Una sede a Roma non prova copertura in tutta la città. I Municipi non accertati restano da verificare. Nessun operatore è presentato come partner COINSIEME.'));
  results.before(homeControls);
  function render(){
    const ids=selected();homeControls.hidden=!ids.includes('domicilio');
    if(window.SportelloSocialita)window.SportelloSocialita.render(ids);
    const resources=engine.chooseHomeResources(ids,catalog,{kind:homeKind.value,territory:homeTerritory.value,name:homeName.value}).filter(r=>(r.category!=='socialita'||!window.SportelloSocialita?.available)&&(r.category!=='mobilita'||!window.SportelloMobilita)&&(r.category!=='consegne'||!window.SportelloConsegne));
    if(window.SportelloMobilita)for(const item of window.SportelloMobilita.choose(ids))if(!resources.some(r=>r.id===item.id))resources.push(item);
    if(window.SportelloConsegne)resources.push(...window.SportelloConsegne.choose(ids));
    results.replaceChildren();
    root.querySelector('#servizi-empty').hidden=ids.length>0;
    root.querySelector('.sp-results-shortcut').hidden=!ids.length;
    root.querySelector('#servizi-vai-risultati').textContent=ids.includes('socialita')?'Vedi le opportunità': 'Vedi le opportunità ('+resources.length+')';
    root.querySelector('#servizi-riepilogo').textContent=ids.length?catalog.areas.filter(a=>ids.includes(a.id)).map(a=>a.title).join(' · '):'Nessun interesse selezionato';
    const verified=resources.filter(catalog.isVerifiedResource).length;
    status.textContent=ids.length?ids.length+(ids.length===1?' interesse selezionato. ':' interessi selezionati. ')+resources.length+' schede: '+verified+' risorse con presenza documentata; '+(resources.length-verified)+' informazioni orientative.':'Scegli liberamente uno o più interessi. Non occorre raccontare la tua situazione.';
    if(ids.includes('socialita'))status.textContent='Per la socialità consulta il repertorio e il suo conteggio filtrato. Altre opportunità selezionate: '+resources.length+'.';
    if(ids.length&&!resources.length&&!ids.includes('socialita'))results.append(make('p','Nessuna risorsa documentata per questi filtri. La mancata inclusione non prova assenza del servizio: copertura o municipio possono richiedere conferma.'));
    const destinations=new Map();
    for(const group of engine.groupServiceResources(resources,ids,catalog)){
      let target=results;
      if(group.collapsible){
        const section=make('details',null,'sp-result-group'),summary=make('summary',group.label+' ('+group.resources.length+')');
        const hint=make('span','Esplora questo ambito','sp-service-invite');summary.append(hint);
        section.append(summary);target=make('div',null,'sp-result-group-content');section.append(target);results.append(section);
        if(group.id==='domicilio:pubblico')target.append(make('p','PUA e uffici sociali orientano e valutano l’accesso: non sono prestazioni domiciliari. L’ADI è invece assistenza sanitaria, distinta dalla badante. Nessuna richiesta viene attivata qui.'));
        section.addEventListener('toggle',()=>{hint.textContent=section.open?'Chiudi questo ambito':'Esplora questo ambito';});
      }
      for(const resource of group.resources)destinations.set(resource.id,{target,group});
    }
    for(const resource of resources){
      const {target,group}=destinations.get(resource.id),presentation=engine.servicePresentation(resource,group,catalog);
      const details=make(presentation.inline?'div':'details',null,'sp-service-result'+(presentation.inline?' sp-service-intro':''));
      details.setAttribute('data-resource-id',resource.id);
      details.id='risorsa-'+resource.id;
      if(presentation.inline){
        if(presentation.showHeading)details.append(make('h4',resource.name));
      }else{
        const summary=make('summary',resource.name);summary.append(make('span','Approfondisci','sp-service-invite'));details.append(summary);
        details.addEventListener('toggle',()=>{summary.querySelector('.sp-service-invite').textContent=details.open?'Chiudi i dettagli':'Approfondisci';});
      }
      const isVerified=catalog.isVerifiedResource(resource);
      const badge=isVerified?(resource.verificationScope==='consegne'?'Consegna dichiarata · Copertura e disponibilità da verificare':resource.verificationScope==='mobilita'?'Trasporto documentato · Condizioni e disponibilità da confermare':resource.verificationScope==='operatore'?'Operatore censito · Servizi e copertura dichiarati, disponibilità non verificata':resource.verificationScope==='riferimento'?'Riferimento istituzionale · Accesso specifico da verificare':resource.verificationScope==='servizio'?'Servizio documentato · Disponibilità non verificata':'Sede documentata · Disponibilità delle prestazioni non verificata'):resource.status==='in_preparazione'?'Progetto in preparazione · Non è un servizio attivabile':'Informazione orientativa · Non è un servizio attivabile';
      details.append(make('p',badge,'sp-service-badge'),make('p',resource.description));
      if(isVerified){
      const dl=make('dl');
      const fields=[['Indirizzo documentato',resource.address],['Indirizzo da confermare',resource.addressNote],['Ente o operatore',resource.entity],['Tipologia',resource.providerType],['Territorio di riferimento',resource.zone],['Servizi citati nella fonte, non disponibilità in tempo reale',(resource.services||[]).join('; ')],['Destinatari',resource.recipients],['Requisiti documentati',resource.requirements],['Accesso',resource.access||'Consultare il sito ufficiale o contattare la struttura; nessuna richiesta viene inviata da questa pagina.'],['Orari documentati',resource.hours],['Costi',resource.costs||'Non verificati: la presenza della sede non attesta gratuità.']];
      if(resource.verificationScope==='mobilita')fields.splice(5,0,['Tipo di mezzo',resource.vehicle],['Accessibilità del trasporto',resource.accessibility],['Accompagnamento personale distinto dal mezzo',resource.personalAssistance]);
      if(resource.verificationScope==='consegne')fields.splice(5,0,['Canali documentati',resource.orderingChannels]);
      if(resource.homeKind)fields.splice(2,0,['Municipio della sede',resource.seatMunicipio||'Non accertato in questa ricognizione'],['Territorio dichiarato dall’operatore',resource.declaredCoverage],['Municipi con iscrizione RUC documentata',resource.publicMunicipi&&resource.verificationScope==='operatore'?(resource.publicMunicipi.length?resource.publicMunicipi.join(', ')+' · iscrizione, non contratto attivo o disponibilità garantiti':'Non documentati in questa ricognizione'):null],['Stato della verifica territoriale',resource.coverageStatus]);
      for(const [label,value] of fields){if(value){dl.append(make('dt',label),make('dd',value));}}details.append(dl);
      details.append(make('p',resource.availability));
      for(const note of resource.notes||[])details.append(make('p',note,'sp-service-caution'));
      for(const phone of resource.phones||[]){const p=make('p'),a=make('a',phone.label+': '+phone.number);a.href='tel:'+phone.number;p.append(a);details.append(p);}
      for(const email of resource.emails||[]){const p=make('p'),a=make('a',email.label+': '+email.address);a.href='mailto:'+email.address;p.append(a);details.append(p);}
      for(const source of resource.sources||[]){const p=make('p'),a=make('a',source.label);a.href=source.url;a.rel='noopener noreferrer';p.append(a,make('span',' · Consultata il '+source.checkedAt));details.append(p);}
      }else if(resource.access){details.append(make('p',resource.access));}
      for(const link of resource.links){const a=make('a',link.label);a.href=link.url;details.append(a);}
      if(window.SportelloMedici)window.SportelloMedici.decorate(resource,details,catalog);
      if(window.SportelloContinuita)window.SportelloContinuita.decorate(resource,details,catalog);
      if(window.SportelloTelevisite)window.SportelloTelevisite.decorate(resource,details,catalog);
      if(window.SportelloDiagnostica)window.SportelloDiagnostica.decorate(resource,details);
      if(window.SportelloFarmacie)window.SportelloFarmacie.decorate(resource,details,catalog,resources);
      if(window.SportelloResidenziali)window.SportelloResidenziali.decorate(resource,details);
      target.append(details);
    }
    root.querySelector('#servizi-azzera').disabled=!ids.length;
  }
  choices.addEventListener('change',render);
  function reach(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  root.querySelector('#servizi-vai-risultati').addEventListener('click',event=>{event.preventDefault();reach(root.querySelector('#servizi-risultati-titolo'));});
  root.querySelector('.sp-edit-choices').addEventListener('click',event=>{event.preventDefault();reach(choices.querySelector('input'));});
  root.querySelector('#servizi-azzera').addEventListener('click',()=>{clear();choices.querySelector('input').focus();});
  function clear(){choices.querySelectorAll('input').forEach(i=>{i.checked=false;});homeKind.value='tutti';homeTerritory.value='tutti';homeName.value='';render();}
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',event=>{if(event.persisted)clear();});
  root.querySelector('#servizi-controls').hidden=false;render();
  if(location.hash==='#esplora-servizi')root.querySelector('h2').focus();
})();
