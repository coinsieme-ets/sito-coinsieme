(function(){
  'use strict';
  const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
  function choose(data,options={}){
    const query=fold(options.query).trim();
    return data.records.filter(r=>(!options.kind||r.groups.includes(options.kind))&&(!options.channel||r.channels.includes(options.channel))&&fold([r.name,r.address,r.coverage].join(' ')).includes(query));
  }
  function normalize(r,data,kind){
    return {...r,category:'consegne',subcategory:r.groups.includes(kind)?kind:r.groups[0],entity:r.name,zone:r.coverage,
      status:'presenza_documentata',verificationScope:'consegne',verifiedAt:data.checkedAt,source:r.sourceUrls[0],
      sources:r.sourceUrls.map(url=>({url,label:'Fonte del servizio · '+new URL(url).hostname,checkedAt:data.checkedAt})),
      costs:r.costs||'Costi di consegna, supplementi e minimi non confermati: controllare il riepilogo sul canale dell’operatore prima di acquistare.',
      hours:r.hours||'Orari effettivi di consegna non confermati: verificare sul canale dell’operatore, senza confonderli con l’apertura del negozio.',
      orderingChannels:r.channels.map(id=>data.channels[id]).join('; '),
      availability:'Consegna documentata o dichiarata nella fonte, non disponibilità al tuo indirizzo in tempo reale. Nessun rapporto di partnership COINSIEME attestato.',
      links:[{label:'Consulta il canale ufficiale esterno',url:r.sourceUrls[0]}]};
  }
  if(typeof module==='object'&&module.exports){module.exports={choose,normalize};return;}
  const data=window.SportelloConsegneData,root=document.getElementById('esplora-servizi');if(!data||!root)return;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const controls=make('fieldset');controls.className='sp-home-filters';controls.hidden=true;
  controls.append(make('legend','Consegne a domicilio: affina la ricerca'),make('p',data.notice));
  function input(id,label,options){const wrap=make('label',label),el=make(options?'select':'input');el.id=id;
    if(options)for(const [value,text] of options){const opt=make('option',text);opt.value=value;el.append(opt);}else{el.type='search';el.autocomplete='off';}
    wrap.append(el);controls.append(wrap);el.addEventListener(options?'change':'input',()=>root.querySelector('#servizi-scelte').dispatchEvent(new Event('change',{bubbles:true})));return el;
  }
  const kind=input('consegne-tipo','Tipo di consegna',[['','Tutti i tipi'],...Object.entries(data.groups)]);
  const channel=input('consegne-canale','Modalità di ordinazione',[['','Tutte le modalità'],...Object.entries(data.channels)]);
  const query=input('consegne-ricerca','Nome del negozio o zona (non inserire il tuo indirizzo)');
  const pharma=make('details');pharma.className='sp-result-group';pharma.append(make('summary','Farmacie: consegna e vendita online sono cose diverse'),make('p',data.pharmacyNotice));
  const law=make('a','Informazioni del Ministero della Salute');law.href=data.pharmacySource;pharma.append(law);controls.append(pharma);
  root.querySelector('#servizi-risultati').before(controls);
  for(const [id,label] of Object.entries(data.groups))window.SportelloServizi.resultGroups.push({id:'consegne:'+id,label});
  window.SportelloConsegne={choose(ids){controls.hidden=!ids.includes('consegne');if(controls.hidden){kind.value='';channel.value='';query.value='';pharma.open=false;return [];}
    return choose(data,{kind:kind.value,channel:channel.value,query:query.value}).map(r=>normalize(r,data,kind.value));}};
})();
