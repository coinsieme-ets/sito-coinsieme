/* Arricchisce la scheda orientativa e i presidi esistenti, senza duplicarli. */
(() => {
  'use strict';
  const data=window.SportelloMediciData;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  function link(label,url){const el=make('a',label);el.href=url;return el;}
  function source(container,entry){const p=make('p');p.append(link(entry.label,entry.url),' · Verifica '+entry.checkedAt);container.append(p);}
  function orientation(container,catalog){
    const help=make('aside');help.className='sp-note';help.setAttribute('aria-label','Aiuto per la scelta del medico');
    help.append(make('h4','Non riesci a trovare un medico disponibile?'),make('p','Rivolgiti a uno degli sportelli territoriali ASL indicati sotto. Richiedi l’elenco aggiornato dei medici convenzionati e assistenza nella scelta; segnala se non riesci a individuare un medico che accetti nuovi assistiti. Sarà la ASL a indicarti il percorso applicabile: COINSIEME non assegna medici e non garantisce posti disponibili.'));
    container.append(help,make('p','Orientamento alla scelta del medico: già disponibile.'),make('p','Elenco nominativo dei medici: in preparazione.'),make('p','Disponibilità di nuovi assistiti: non ancora verificabile attraverso i dati acquisiti.'));
    container.append(make('p','La scelta avviene tramite il servizio sanitario regionale, non tramite COINSIEME. Non inserire dati sanitari o credenziali in questa pagina.'),
      make('p','Per cercare un medico: consulta personalmente il tuo FSE oppure richiedi alla ASL l’elenco dei convenzionati. Per la prima scelta del medico di famiglia e per il pediatra consulta gli sportelli ASL; per cambiare medico di famiglia è previsto anche il FSE.'));
    for(const entry of data.sources)source(container,entry);
    const state=make('p',data.publicSearch.status);state.append(' ',link('Controlla la ricerca regionale',data.publicSearch.url),' · Verifica '+data.checkedAt);container.append(state);
    const documented=data.choose(data.doctors);
    const section=make('section');section.className='sp-social-catalog';section.hidden=!documented.length;
    const fieldset=make('fieldset');fieldset.append(make('legend','Cerca un professionista documentato'));
    const controls={};
    function select(key,label,items){
      const wrapper=make('label',label),control=make('select');control.id='medici-'+key;
      for(const [value,text] of items){const option=make('option',text);option.value=value;control.append(option);}
      wrapper.append(control);fieldset.append(wrapper);controls[key]=control;control.addEventListener('change',render);
    }
    select('type','Medico di famiglia o pediatra',[['tutti','Tutti'],['MMG','Medico di famiglia (MMG)'],['PLS','Pediatra (PLS)']]);
    select('municipio','Municipio',[['tutti','Tutti'],...['IV','V','VI','VII'].map(n=>[n,'Municipio '+n])]);
    select('quarter','Quartiere documentato',[['tutti','Tutti'],...[...new Set(documented.map(r=>r.quarter).filter(Boolean))].sort().map(q=>[q,q])]);
    select('availability','Nuovi assistiti',[['tutti','Tutti gli stati'],...Object.entries(data.availabilityLabels)]);
    controls.quarter.disabled=!documented.some(r=>r.quarter);
    controls.availability.disabled=!documented.some(r=>data.availability(r)!=='da_verificare');
    if(controls.availability.disabled)fieldset.append(make('p','Filtro disponibilità non attivo: mancano riscontri documentati sui nuovi assistiti.'));
    const nameLabel=make('label','Nome del professionista'),name=make('input');name.type='search';name.id='medici-name';name.autocomplete='off';nameLabel.append(name);fieldset.append(nameLabel);controls.name=name;name.addEventListener('input',render);
    const count=make('p');count.setAttribute('role','status');const list=make('div');
    section.append(fieldset,count,list);container.append(section);
    function render(){
      const records=data.choose(data.doctors,Object.fromEntries(Object.entries(controls).map(([key,control])=>[key,control.value])));
      count.textContent=records.length+' professionisti documentati per i filtri scelti. Nessuna disponibilità è dedotta dalla presenza in elenco.';
      list.replaceChildren();
      if(!records.length)list.append(make('p',data.doctors.length?'Nessun risultato per questi filtri.':'Nominativi non ancora integrati: le fonti pubbliche consultate non consentono un censimento verificabile. Usa i percorsi ufficiali e gli sportelli sotto indicati.'));
      for(const record of records){
        const details=make('details'),summary=make('summary',record.name+' · '+record.type);details.append(summary);
        details.append(make('p',record.address+' · Quartiere: '+(record.quarter||'da verificare')+' · Municipio: '+(record.municipio||'da verificare')+' · '+record.asl));
        const status=data.availability(record);details.append(make('p','Nuovi assistiti: '+data.availabilityLabels[status]));
        if(status!=='da_verificare')source(details,{url:record.availability.source,label:'Fonte della disponibilità (non in tempo reale)',checkedAt:record.availability.checkedAt});
        if(record.phone)details.append(link(record.phone,'tel:'+record.phone.replace(/\s/g,'')));
        if(record.hours)details.append(make('p','Orari documentati: '+record.hours));
        source(details,{url:record.source,label:'Fonte ufficiale del professionista',checkedAt:record.checkedAt});
        details.append(link('Come scegliere o cambiare medico',data.region));list.append(details);
      }
    }
    render();
    container.append(make('h4','Sportelli scelta e revoca: presidi già presenti nel catalogo'));
    const offices=make('ul');
    for(const office of data.offices){
      if(!catalog.resources.some(r=>r.id===office.resourceId))continue;
      const li=make('li'),a=link(office.address,'#risorsa-'+office.resourceId);
      a.addEventListener('click',event=>{
        const target=document.getElementById('risorsa-'+office.resourceId);if(!target)return;
        event.preventDefault();for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
        const summary=target.querySelector('summary');summary.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});
      });li.append(a);offices.append(li);
    }
    container.append(offices,make('p','Apri il presidio per le informazioni specifiche sullo sportello: i recapiti infermieristici già censiti non sono recapiti per la scelta del medico. Quartieri dei singoli ambulatori e posti disponibili restano da verificare.'));
  }
  function decorate(resource,container,catalog){
    if(resource.id==='info-salute-medici-pediatri')orientation(container,catalog);
    const office=data.offices.find(item=>item.resourceId===resource.id);if(!office)return;
    container.id='risorsa-'+resource.id;
    container.append(make('h4','Scelta e revoca del medico: sportello nello stesso presidio'),make('p',office.address+' · Municipio V · ASL Roma 2'),
      make('p','Scelta/revoca dalle 11:00 fino a fine turno. Fine turno nella tabella ASL: '+office.endOfShift+'. Confermare prima di recarsi allo sportello.'),
      make('p','Informazioni distinte dagli orari e dai contatti infermieristici sopra riportati. Nessun telefono specifico per scelta/revoca verificato.'));
    if(office.note)container.append(make('p',office.note));
    source(container,{url:data.asl,label:'ASL: fonte dello sportello scelta e revoca',checkedAt:data.checkedAt});
  }
  window.SportelloMedici={decorate};
})();
