(() => {
  'use strict';
  const data=window.SportelloContinuitaData;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  function link(label,url){const a=make('a',label);a.href=url;return a;}
  function source(target,label,url){const p=make('p');p.append(link(label,url),' · Verifica '+data.checkedAt);target.append(p);}
  function decorate(resource,target,catalog){
    if(resource.id!=='info-salute-continuita-assistenziale')return;
    const emergency=make('p');emergency.className='sp-service-caution';emergency.append('Emergenze sanitarie: chiama ',link('112','tel:112'),'. Il 116117 e AmbuFest non sostituiscono il soccorso di emergenza.');target.append(emergency);
    const central=make('details');central.id='continuita-116117';central.append(make('summary','116117 — Cure non urgenti e accesso alla guardia medica'));
    const call=make('p');call.append(link('Chiama 116117','tel:116117'));central.append(call,make('p','Regione Lazio / ASL Roma 2. Numero attivo H24, tutti i giorni nel Lazio: orientamento e cure non urgenti. Guardia medica negli orari specifici sotto indicati.'),make('p',data.hours.guardia),make('p','La centrale valuta la richiesta: può fornire consiglio sanitario, valutare l’invio del medico a domicilio o indirizzare al servizio appropriato. La visita non è automatica né prenotata da COINSIEME.'),make('p','Dopo la visita, il medico può prescrivere una terapia urgente per non oltre 48/72 ore, certificare malattia ai lavoratori turnisti fino a 3 giorni e proporre ricovero urgente. Non prescrive esami o visite specialistiche e non trascrive ricette di altri sanitari, incluse dimissioni ospedaliere.'),make('p','Accesso telefonico: le postazioni operative non sono presentate come ambulatori ad accesso diretto. Nessuna richiesta o informazione sanitaria viene raccolta qui.'));
    source(central,'Regione Lazio: 116117',data.sources.numero);source(central,'ASL: guardia medica e limiti prescrittivi',data.sources.guardia);target.append(central);
    target.append(make('h4','AmbuFest — Ambulatori di cure primarie'),make('p','Accesso diretto negli orari previsti, distinto dall’attivazione telefonica della guardia medica. Confermare eventuali variazioni prima di recarsi in sede.'),make('p',data.hours.ambufest),make('p','La fonte ASL non chiarisce le sovrapposizioni sabato/prefestivo: confermare l’orario quando coincidono. Non vengono indicati posti disponibili o apertura in tempo reale.'));
    source(target,'ASL: sedi, profili e orari AmbuFest',data.sources.ambufest);source(target,'ASL: guida Distretto 5, accesso diretto (documentazione precedente)',data.sources.accesso);source(target,'Regione: ambulatori festivi e offerta pediatrica',data.sources.regioneAmbufest);
    const section=make('section');section.className='sp-social-catalog';const fields=make('fieldset');fields.append(make('legend','Trova un AmbuFest'));
    const controls={};
    function control(key,label,options){const wrap=make('label',label),el=make(options?'select':'input');el.id='continuita-'+key;
      if(options)for(const [value,text] of options){const option=make('option',text);option.value=value;el.append(option);}else{el.type='search';el.autocomplete='off';}
      controls[key]=el;wrap.append(el);fields.append(wrap);el.addEventListener(options?'change':'input',render);
    }
    control('profile','Prestazione',[['tutti','Adulti e pediatrico'],['adulti','Adulti'],['pediatrico','Pediatrico']]);
    control('zone','Zona documentata',[['tutte','Tutte le zone'],...data.sites.map(site=>[site.zone,site.zone])]);control('name','Cerca sede, indirizzo o zona');
    const count=make('p');count.setAttribute('role','status');const list=make('div');section.append(fields,count,list);target.append(section);
    function render(){
      const records=data.choose(catalog,Object.fromEntries(Object.entries(controls).map(([key,el])=>[key,el.value])));count.textContent=records.length+' sedi AmbuFest documentate per i filtri scelti.';list.replaceChildren();
      if(!records.length)list.append(make('p','Nessuna sede censita per questi filtri. Il 116117 resta disponibile per orientamento non urgente.'));
      for(const site of records){
        const details=make('details');details.id='ambufest-'+site.id;details.append(make('summary','AmbuFest — '+site.address),make('p','ASL Roma 2 · '+site.zone),make('p','Prestazioni: '+site.profiles.join(' e ')+'. Accesso diretto; orari generali sopra indicati.'),make('p','Ingresso e accessibilità fisica da confermare con la struttura. Non sono stati verificati sul posto.'));
        if(site.facilityName)details.append(make('p','Stesso presidio già censito: '+site.facilityName+'. Gli orari e i recapiti degli altri servizi non valgono per AmbuFest.'));
        if(site.note)details.append(make('p',site.note));
        const map=link('Mappa esterna: cerca questo indirizzo',data.mapUrl(site.address));details.append(map,make('p','La mappa cerca l’indirizzo documentato: non certifica ingresso, percorso senza barriere o posizione esatta del servizio.'));
        source(details,'Fonte ASL AmbuFest',data.sources.ambufest);list.append(details);
      }
    }
    render();
  }
  window.SportelloContinuita={decorate};
})();
