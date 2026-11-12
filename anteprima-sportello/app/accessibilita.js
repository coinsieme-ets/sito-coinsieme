(function(root){
  'use strict';
  const groups=[
    {id:'barriere-architettoniche',name:'Barriere architettoniche e percorsi accessibili',description:'Edifici, negozi, ingressi, rampe e percorsi negli spazi aperti al pubblico.'},
    {id:'comunicazione-accessibile',name:'Comunicazione e orientamento accessibili',description:'Segnaletica, percorsi tattili, orientamento e informazioni comprensibili: le attività specifiche vanno verificate nella scheda.'},
    {id:'accessibilita-digitale',name:'Accessibilità digitale',description:'Accessibilità di siti, applicazioni, documenti e servizi online, distinta dall’aiuto a usare i dispositivi.'},
    {id:'facilitazione-digitale',name:'Assistenza e facilitazione digitale',description:'Aiuto nell’uso di smartphone, computer, SPID, CIE e servizi digitali quotidiani.'}
  ];
  function memberships(resource){
    if(resource.id==='connessioni-sociali-accessibilita')return ['barriere-architettoniche','comunicazione-accessibile'];
    if(resource.id==='coinsieme-barriere-digitali'||resource.id.startsWith('facilitazione-roma-'))return ['facilitazione-digitale'];
    return [];
  }
  function select(resources,ids,kind='tutte'){
    if(!ids.includes('digitale'))return resources;
    return resources.flatMap(resource=>{
      const categories=resource.categories||[resource.category];
      if(!categories.includes('digitale')||resource.id==='info-digitale')return [resource];
      const kinds=memberships(resource);
      if(kind!=='tutte'&&!kinds.includes(kind)){
        const others=categories.filter(c=>c!=='digitale'&&ids.includes(c));
        return others.length?[{...resource,category:others[0],categories:others}]:[];
      }
      return [{...resource,groupByCategory:{...resource.groupByCategory,digitale:kind==='tutte'?kinds[0]||'generale':kind}}];
    });
  }
  function counts(resources){return Object.fromEntries(groups.map(group=>[group.id,new Set(resources.filter(r=>memberships(r).includes(group.id)).map(r=>r.id)).size]));}
  function mount(root,catalog,onChange){
    const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
    const fieldset=make('fieldset');fieldset.id='accessibilita-filtri';fieldset.className='sp-home-filters sp-accessibility-filters';fieldset.hidden=true;
    fieldset.append(make('legend','Accessibilità e barriere: scegli un ambito'));
    const options=make('div');options.className='sp-accessibility-options';fieldset.append(options);
    const totals=counts([...catalog.resources,...(catalog.sharedResources||[])]);
    for(const group of [{id:'tutte',name:'Tutti gli ambiti',description:'Mostra le risorse documentate, una sola volta.'},...groups]){
      const label=make('label'),input=make('input');input.type='radio';input.name='accessibilita-ambito';input.value=group.id;input.id='accessibilita-ambito-'+group.id;input.checked=group.id==='tutte';
      const text=make('span');text.append(make('strong',group.name),make('span',group.description));
      if(group.id!=='tutte')text.append(make('small',totals[group.id]+(totals[group.id]===1?' scheda documentata':' schede documentate')));
      label.append(input,text);options.append(label);input.addEventListener('change',onChange);
    }
    const empty=make('p','Non sono ancora presenti schede di erogatori con attività documentate in questo ambito. Non sono attribuite competenze non verificate.');empty.className='sp-accessibility-empty';empty.setAttribute('role','status');empty.hidden=true;
    const info=make('a','Orientamento all’accessibilità digitale per organizzazioni');info.href='/assistenza-digitale.html#organizzazioni';empty.append(document.createTextNode(' '),info);fieldset.append(empty);
    root.querySelector('#servizi-risultati').before(fieldset);
    return {select(resources,ids){
      fieldset.hidden=!ids.includes('digitale');
      if(fieldset.hidden){fieldset.querySelector('input[value="tutte"]').checked=true;empty.hidden=true;return resources;}
      const kind=fieldset.querySelector('input:checked').value;empty.hidden=kind==='tutte'||totals[kind]>0;
      return select(resources,ids,kind);
    }};
  }
  const api={groups,memberships,select,counts,mount};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SportelloAccessibilita=api;
})(typeof window==='undefined'?globalThis:window);
