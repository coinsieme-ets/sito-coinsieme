(function(){
  'use strict';
  const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
  function matchesTerritory(record,territory){
    if(!territory||territory==='tutti')return true;
    if(territory==='roma')return record.allRome===true;
    if(record.allRome===true)return ['v','est'].includes(territory);
    return territory==='v'?record.coverageMunicipi.includes('V'):territory==='est'&&record.coverageMunicipi.some(m=>['IV','V','VI','VII'].includes(m));
  }
  function choose(data,options={}){
    return data.records.filter(r=>(!options.kind||r.groups.includes(options.kind))&&matchesTerritory(r,options.territory)&&fold(r.name).includes(fold(options.name)));
  }
  function normalize(record,data,kind){
    return {...record,category:'mobilita',subcategory:record.groups.includes(kind)?kind:record.groups[0],entity:record.name,zone:record.coverage,
      status:'presenza_documentata',verificationScope:'mobilita',verifiedAt:data.checkedAt,source:record.sourceUrls[0],
      sources:record.sourceUrls.map(url=>({url,label:'Fonte ufficiale · '+new URL(url).hostname,checkedAt:data.checkedAt})),
      availability:'La fonte documenta il servizio o la dichiarazione dell’operatore, non la disponibilità attuale. Nessun soggetto è presentato come partner COINSIEME.',links:[]};
  }
  if(typeof module==='object'&&module.exports){module.exports={choose,matchesTerritory,normalize};return;}
  const data=window.SportelloMobilitaData,root=document.getElementById('esplora-servizi');
  if(!data||!root)return;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const controls=make('fieldset');controls.className='sp-home-filters';controls.hidden=true;
  controls.append(make('legend','Accompagnamento e mobilità: affina la ricerca'));
  const emergency=make('p','Per emergenze chiamare il '),phone=make('a','112');phone.href='tel:112';emergency.append(phone,document.createTextNode('. I trasporti privati programmati non sostituiscono il soccorso pubblico.'));controls.append(emergency);
  const notice=make('p',data.stidNotice.text),source=make('a','Avviso ufficiale STID · verificato '+data.checkedAt);source.href=data.stidNotice.url;controls.append(notice,source);
  function input(id,label,options){const wrap=make('label',label),control=make(options?'select':'input');control.id=id;
    if(options)for(const [value,text] of options){const opt=make('option',text);opt.value=value;control.append(opt);}else control.type='search';
    wrap.append(control);controls.append(wrap);control.addEventListener(options?'change':'input',()=>root.querySelector('#servizi-scelte').dispatchEvent(new Event('change',{bubbles:true})));return control;
  }
  const kind=input('mobilita-tipo','Tipologia di trasporto',[['','Tutte le tipologie'],...Object.entries(data.groups)]);
  const territory=input('mobilita-territorio','Territorio servito',[['tutti','Tutte le risorse censite'],['v','Municipio V'],['est','Roma Est · IV, V, VI e VII'],['roma','Roma intera · solo copertura documentata']]);
  const name=input('mobilita-nome','Cerca per denominazione');
  controls.append(make('p','I servizi cittadini includono i filtri Municipio V e Roma Est, ma non garantiscono vetture in ogni quartiere. Una sede romana non prova copertura dell’intera città. Accompagnamento personale e disponibilità del mezzo sono informazioni distinte.'));
  root.querySelector('#servizi-risultati').before(controls);
  for(const [id,label] of Object.entries(data.groups))window.SportelloServizi.resultGroups.push({id:'mobilita:'+id,label});
  window.SportelloMobilita={choose(ids){controls.hidden=!ids.includes('mobilita');if(controls.hidden){kind.value='';territory.value='tutti';name.value='';return [];}
    return choose(data,{kind:kind.value,territory:territory.value,name:name.value}).map(r=>normalize(r,data,kind.value));}};
})();
