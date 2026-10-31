(() => {
  'use strict';
  const data=window.SportelloFisioterapiaData;
  function groupCaption(group){return group.id==='domicilio:fisioterapia'?data.paths.length+' percorsi · '+data.providers.length+' erogatori documentati':null;}
  function selectionCaption(resources){return resources.length===1&&resources[0].id===data.intro.id?'Fisioterapia: '+data.paths.length+' percorsi di orientamento e '+data.providers.length+' erogatori documentati. Non sono disponibilità verificate.':null;}
  const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
  function link(label,url){const a=make('a',label);a.href=url;return a;}
  function sources(target,items){
    for(const item of items){const p=make('p');p.append(link(item.label,item.url),' · Ultima verifica: '+item.checkedAt+(item.documentDate?' · Data indicata dalla fonte: '+item.documentDate:''));target.append(p);}
  }
  function contact(target,item){
    if(item.label)target.append(make('p',item.label));
    if(item.address)target.append(make('p',item.address));
    if(item.phone)target.append(link('Telefono: '+item.phone,'tel:'+item.phone));
    for(const email of item.emails||(item.email?[item.email]:[]))target.append(link(email,'mailto:'+email));
  }
  function showExisting(id){
    const type=document.getElementById('domicilio-tipo'),name=document.getElementById('domicilio-nome'),territory=document.getElementById('domicilio-territorio');
    name.value='';territory.value='tutti';type.value='pubblico';type.dispatchEvent(new Event('change'));
    const target=document.getElementById('risorsa-'+id);if(!target)return;
    for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    const summary=target.querySelector('summary');summary.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});
  }
  function decorate(resource,target,catalog){
    if(resource.id!==data.intro.id)return;
    target.classList.add('sp-physio-intro');
    const section=make('section',null,'sp-physio');section.setAttribute('aria-label','Percorsi di fisioterapia e riabilitazione a domicilio');target.append(section);
    const welcome=make('p',null,'sp-physio-welcome');welcome.append(make('strong','Hai bisogno di fisioterapia a domicilio?'),' Scopri come richiedere una valutazione attraverso il servizio sanitario pubblico oppure come individuare un professionista privato');section.append(welcome);
    const choices=make('div',null,'sp-physio-paths'),buttons=[];
    const content=make('section');content.id='fisioterapia-percorso';content.hidden=true;
    const heading=make('h4');heading.id='fisioterapia-percorso-titolo';heading.tabIndex=-1;content.setAttribute('aria-labelledby',heading.id);
    const note=make('aside',null,'sp-physio-note');note.setAttribute('aria-label','Nota informativa COINSIEME');note.append(make('strong','Il ruolo di COINSIEME'),make('p',resource.access+' COINSIEME non è un intermediario sanitario: non raccoglie documenti clinici né gestisce pagamenti.'),make('p','Il riepilogo generale del catalogo conta questo ambito come una scheda di orientamento. Al suo interno sono documentati '+data.providers.length+' erogatori, non '+data.providers.length+' professionisti disponibili.'));
    for(const item of resource.links)note.append(link(item.label,item.url));
    const body=make('div');content.append(heading,body);section.append(choices,make('p',data.guides.length+' riferimenti ASL · '+data.providers.length+' erogatori documentati · Fonti verificate il '+data.checkedAt+'.','sp-physio-meta'),note,content);
    const current={path:null,asl:'roma2',regime:'tutti',query:'',type:'tutti'};
    function control(parent,id,label,items,value,onChange){
      const wrapper=make('label',label),select=make('select');select.id=id;
      for(const [v,text] of items){const option=make('option',text);option.value=v;select.append(option);}select.value=value;
      wrapper.append(select);parent.append(wrapper);select.addEventListener('change',()=>onChange(select.value));return select;
    }
    function card(record){
      const details=make('details',null,'sp-service-result');details.dataset.physioProvider=record.id;details.append(make('summary',record.name+' — modalità e verifiche'),make('p',record.label,'sp-service-badge'),make('p',record.description));
      const dl=make('dl');
      const fields=[['Sedi documentate, non copertura',record.seats],['Territorio e limiti della verifica',record.coverage],['Modalità di accesso',record.access],['Costi',record.costs||'Prestazioni SSR: solo nel percorso valutato e autorizzato dalla ASL. Non sono verificate tariffe private, quote individuali o condizioni economiche applicabili al singolo caso.'],['Qualifiche e riscontro documentale',record.qualifications],['Stato della verifica',record.verification==='confermato'?'Confermato il riscontro documentale del centro e del regime; copertura puntuale e disponibilità da verificare.':'Parziale: documentate le informazioni indicate; contratto, professionista e disponibilità individuali non accertati.']];
      for(const [label,value] of fields)dl.append(make('dt',label),make('dd',value));details.append(dl,make('p',record.caution,'sp-service-caution'));
      if(record.phone||record.email)contact(details,record);
      for(const item of record.contacts||[])contact(details,item);
      details.append(link('Sito ufficiale '+record.name,record.url));sources(details,record.sources);return details;
    }
    function providers(parent,options){
      const count=make('p'),list=make('div');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.dataset.physioCount='';parent.append(count,list);
      function update(){
        const records=data.chooseProviders(options());count.textContent=records.length+(records.length===1?' scheda di erogatore per questi filtri.':' schede di erogatori per questi filtri.')+' Nessuna disponibilità individuale verificata.';list.replaceChildren();
        if(!records.length)list.append(make('p','Nessuna scheda documentata per questi filtri. Non significa che il servizio non esista: consulta il servizio ASL o le fonti ufficiali.'));
        for(const record of records)list.append(card(record));
      }
      update();return update;
    }
    function publicPath(){
      const steps=make('ol',null,'sp-physio-steps');
      for(const text of ['Parlane con il medico di famiglia o con il reparto prima della dimissione: chiedi se sia indicata una valutazione per la riabilitazione a domicilio.',
        'Individua qui sotto la tua ASL e consulta le indicazioni del PUA/CAD o del servizio territoriale competente: la richiesta segue la procedura prevista per quel territorio.',
        'Il servizio sanitario valuta il bisogno e il percorso appropriato. L’eventuale accesso alle prestazioni dipende dalla valutazione e dalle autorizzazioni: non sono garantiti automaticamente un ciclo o un tempo di attivazione.'])steps.append(make('li',text));body.append(steps);
      const differences=make('details');differences.append(make('summary','ADI ed ex articolo 26: differenze, valutazione e piani'),make('p','L’ADI può comprendere interventi riabilitativi nel piano assistenziale. Per i bisogni complessi la valutazione multidimensionale considera aspetti sanitari e assistenziali e porta al PAI, il Piano Assistenziale Individualizzato. Le prestazioni occasionali possono seguire una procedura diversa.'),make('p','La riabilitazione domiciliare ex articolo 26 della legge 833/1978 è un percorso distinto: servono le valutazioni e autorizzazioni pertinenti e un progetto riabilitativo individuale (PRI). Un titolo ADI non prova automaticamente un titolo ex art. 26. Requisiti, modalità e frequenza dipendono dal servizio competente; non è un percorso di urgenza.'));sources(differences,[data.sources.roma2,data.sources.ex26]);body.append(differences);
      const filters=make('fieldset',null,'sp-physio-filters');filters.append(make('legend','Orientamento per ASL'));
      const guides=make('div'),operatorSection=make('section');body.append(filters,guides,operatorSection);
      function renderGuides(){
        guides.replaceChildren();
        for(const guide of data.guides.filter(g=>current.asl==='tutte'||g.id===current.asl)){
          const item=make('article',null,'sp-physio-guide');item.dataset.physioGuide=guide.id;item.append(make('h5',guide.name),make('p','Informazione istituzionale documentata · Accesso individuale da valutare','sp-service-badge'),make('p',guide.territory),make('p',guide.access));
          for(const c of guide.contacts||[])contact(item,c);
          if(guide.resourceId){
            const r=catalog.resources.find(r=>r.id===guide.resourceId);
            if(r){item.append(make('p','Presidio già nel catalogo: '+r.name+' · '+r.address));const button=make('button','Apri la scheda ADI del Distretto 5 già censita');button.type='button';button.addEventListener('click',()=>showExisting(r.id));item.append(button);}
          }
          item.append(make('p',guide.note));sources(item,guide.sources);guides.append(item);
        }
      }
      control(filters,'fisioterapia-asl','ASL di riferimento',[['roma1','ASL Roma 1'],['roma2','ASL Roma 2'],['roma3','ASL Roma 3'],['tutte','Tutte le tre ASL']],current.asl,v=>{current.asl=v;renderGuides();update();});
      control(filters,'fisioterapia-regime','Percorso documentato',[['tutti','ADI e riabilitazione ex art. 26'],['adi','ADI'],['ex26','Riabilitazione ex art. 26']],current.regime,v=>{current.regime=v;update();});
      const queryLabel=make('label','Nome dell’erogatore'),query=make('input');query.type='search';query.id='fisioterapia-nome';query.autocomplete='off';query.value=current.query;queryLabel.append(query);filters.append(queryLabel);query.addEventListener('input',()=>{current.query=query.value;update();});
      operatorSection.append(make('h5','Enti documentati nel percorso pertinente'),make('p','Sono erogatori privati citati dalle fonti istituzionali, non uffici ASL. Accreditamento, contratto SSR e disponibilità sono informazioni distinte. Il filtro ASL usa i riscontri istituzionali, non la sola sede o una copertura commerciale dichiarata.'));
      const update=providers(operatorSection,()=>({path:'pubblico',asl:current.asl,regime:current.regime,query:current.query}));renderGuides();
    }
    function privatePath(){
      body.append(make('p','Prestazioni private a pagamento, da richiedere direttamente all’operatore. Verifica prima nominativo e iscrizione all’Albo del professionista, appropriatezza del percorso, preventivo e condizioni di cancellazione. COINSIEME non prenota, non raccoglie dati clinici e non incassa pagamenti.'),make('p','La copertura di Roma è dichiarata dal gestore: non sono disponibili riscontri puntuali per i singoli Municipi. Per questo non viene proposto un filtro territoriale che potrebbe suggerire disponibilità accertate.'));
      const filters=make('fieldset',null,'sp-physio-filters');filters.append(make('legend','Cerca nelle schede private documentate'));body.append(filters);
      const label=make('label','Nome o prestazione'),search=make('input');search.id='fisioterapia-nome';search.type='search';search.autocomplete='off';search.value=current.query;label.append(search);filters.append(label);
      control(filters,'fisioterapia-tipo','Prestazione dichiarata',[['tutti','Tutte le prestazioni documentate'],['motoria','Riabilitazione motoria'],['postoperatoria','Fisioterapia post-operatoria'],['mobilita','Mobilità e mobilizzazioni']],current.type,v=>{current.type=v;update();});
      const update=providers(body,()=>({path:'privato',type:current.type,query:current.query}));search.addEventListener('input',()=>{current.query=search.value;update();});sources(body,[data.sources.albo]);
    }
    function helpPath(){
      const list=make('ol');
      for(const text of ['Parlane con il medico di famiglia o, prima della dimissione, con il reparto ospedaliero. Chiedi quale valutazione e quale percorso siano appropriati, senza dare per scontato un trattamento domiciliare.',
        'Individua la ASL e il distretto competenti per la tua residenza o il domicilio sanitario. Consulta la directory ufficiale PUA/CAD; non basarti soltanto sul CAP.',
        'Chiedi al servizio pubblico quali documenti e autorizzazioni servano e come conoscere gli erogatori assegnabili. Non inviare referti o dati sanitari a COINSIEME.',
        'Se scegli un percorso privato, verifica il professionista, la zona di intervento, il preventivo e le condizioni direttamente con il servizio. Non sostituire una valutazione sanitaria con questa pagina.'])list.append(make('li',text));
      body.append(list);sources(body,[data.sources.roma1cad,data.sources.roma2,data.sources.roma3cad,data.sources.albo]);
    }
    function choose(id,focus=true){
      if(current.path&&current.path!==id){current.query='';current.type='tutti';}
      current.path=id;content.hidden=false;heading.textContent=data.paths.find(p=>p.id===id).title;body.replaceChildren();for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.path===id));
      if(id==='pubblico')publicPath();else if(id==='privato')privatePath();else helpPath();
      if(focus){heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    }
    for(const path of data.paths){const button=make('button');button.append(make('strong',path.label),make('span',path.description));button.type='button';button.dataset.path=path.id;button.setAttribute('aria-controls',content.id);button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>choose(path.id));buttons.push(button);choices.append(button);}
    const explanation=make('details');explanation.append(make('summary','Che cosa può comprendere la fisioterapia a domicilio'),make('p',data.fullDescription));sources(explanation,[data.sources.albo,data.sources.roma2]);
    section.append(explanation,make('p','Ausili e domotica possono sostenere l’autonomia, ma non sostituiscono la riabilitazione sanitaria.'),link('Esplora le soluzioni informative della Casa che si prende cura','/casa-che-si-prende-cura/'));
    const query=document.getElementById('domicilio-nome').value.trim().toLocaleLowerCase('it');
    const found=query.length>=3&&data.providers.find(p=>p.name.toLocaleLowerCase('it').includes(query));
    if(found){current.query=query;current.asl='tutte';choose(found.regime==='privato'?'privato':'pubblico',false);}
  }
  window.SportelloFisioterapia={decorate,groupCaption,selectionCaption,introId:data.intro.id};
})();
