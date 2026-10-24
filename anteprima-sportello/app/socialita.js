(function () {
  'use strict';
  const groups={enti:'Associazioni, fondazioni ed ETS',volontariato:'Volontariato e solidarietà',comitati:'Comitati di quartiere e cittadinanza attiva',csaq:'Case sociali delle persone anziane e del quartiere'};
  function filter(records, options={}) {
    const term=(options.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
    return records.filter(r=>(!options.group||r.groups.includes(options.group))&&(!options.municipio||r.municipalities.includes(options.municipio))&&(!options.neighborhood||r.neighborhood===options.neighborhood)&&(!options.field||r.fields.includes(options.field))&&r.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').includes(term));
  }
  if(typeof module==='object'&&module.exports){module.exports={filter,groups};return;}
  const root=document.getElementById('esplora-servizi');
  if(!root)return;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const section=make('section');section.className='sp-social-catalog';section.hidden=true;
  section.setAttribute('aria-labelledby','socialita-titolo');
  const heading=make('h3','Risorse per socialità e partecipazione');heading.id='socialita-titolo';section.append(heading);
  section.append(make('p','Prima ricognizione documentale, non elenco esaustivo. I Municipi filtrano sedi documentate oppure ambiti dichiarati: la distinzione è indicata in ogni scheda. Nessun ente è presentato come partner della Fondazione.'));
  const controls=make('fieldset'),legend=make('legend','Affina le risorse di socialità');controls.append(legend);section.append(controls);
  const inputs={};let records=[],limit=12,loaded=false,failed=false;
  function control(key,label,options){const wrap=make('label',label),input=make(options?'select':'input');input.id='socialita-'+key;
    if(options)for(const [value,text] of options){const opt=make('option',text);opt.value=value;input.append(opt);}else input.type='search';
    wrap.append(input);controls.append(wrap);inputs[key]=input;input.addEventListener(options?'change':'input',()=>{limit=12;draw();});return input;
  }
  control('group','Ambito',[['','Tutti gli ambiti'],...Object.entries(groups)]);
  control('municipio','Municipio · sede o attività documentate',[['','Tutti i territori censiti'],...['V','IV','VI','VII'].map(m=>[m,'Municipio '+m])]);
  control('neighborhood','Quartiere verificato',[['','Tutti · quartieri non ancora accertati']]);inputs.neighborhood.disabled=true;
  control('field','Campo di intervento',[['','Tutti i campi']]);control('name','Denominazione');
  const count=make('p');count.setAttribute('role','status');const list=make('div');
  const more=make('button','Mostra altre risorse');more.type='button';more.className='btn btn-outline';more.addEventListener('click',()=>{const previous=limit;limit+=12;draw();const next=list.children[previous];if(next)next.querySelector('summary').focus();});
  section.append(count,list,more);root.querySelector('#servizi-risultati').before(section);
  function draw(){
    list.replaceChildren();const options=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value]));const matches=filter(records,options);
    count.textContent=failed?'Catalogo non caricato. Restano disponibili le altre opportunità e le fonti nel rapporto.':!loaded?'Caricamento del catalogo…':matches.length+' risorse · '+Math.min(limit,matches.length)+' mostrate';
    more.hidden=limit>=matches.length;
    for(const r of matches.slice(0,limit)){
      const details=make('details'),summary=make('summary',r.name);details.className='sp-service-result';summary.append(make('span',' · Approfondisci'));details.append(summary,make('p',r.description));
      for(const paragraph of r.details||[])details.append(make('p',paragraph));
      const dl=make('dl');const rows=[['Qualificazione',r.legalStatus],['Sede legale',r.legalAddress||'Non verificata in questa ricognizione'],['Sede / presidio operativo riportato',r.operationalAddress],['Municipio della sede',r.seatMunicipio||'Non accertato; non dedotto dal CAP'],['Ambito territoriale',r.territoryBasis],['Municipi riferiti all’ambito',r.municipalities.join(', ')||'Da verificare'],['Quartiere',r.neighborhood||'Da verificare'],[r.editorialSource?'Ambito di intervento dichiarato':'Campi documentati',r.fields.join('; ')]];
      if(r.runts)rows.push(['Codice fiscale',r.runts.taxCode],['Sezione RUNTS',r.runts.section],['Repertorio e iscrizione',r.runts.number+' · '+r.runts.registeredAt]);
      for(const [label,value] of rows)if(value)dl.append(make('dt',label),make('dd',value));details.append(dl,make('p',r.caution));
      function link(label,url){const p=make('p'),a=make('a',label);a.href=url;p.append(a);details.append(p);}
      if(r.phone)link('Telefono pubblicato: '+r.phone,'tel:'+r.phone);
      if(r.email)link('Email pubblicata: '+r.email,'mailto:'+r.email);
      if(r.website)link('Sito indicato nella fonte · apertura da verificare',r.website);
      for(const source of r.sources)link(source.label+' · consultata '+source.checkedAt,source.url);
      if(r.editorialSource)details.append(make('p',r.editorialSource));
      list.append(details);
    }
  }
  window.SportelloSocialita={get available(){return loaded;},render(ids){section.hidden=!ids.includes('socialita');if(section.hidden){for(const input of Object.values(inputs))input.value='';limit=12;}draw();}};
  try {
    records=window.SportelloSocialitaData.records;loaded=true;
    for(const field of [...new Set(records.flatMap(r=>r.fields))].sort()){const opt=make('option',field);opt.value=field;inputs.field.append(opt);}
    draw();
  } catch {failed=true;draw();}
})();
