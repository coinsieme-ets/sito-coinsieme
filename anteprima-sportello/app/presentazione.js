/* Presentazione progressiva: riusa schede e controlli senza un secondo catalogo. */
(function(root){
 'use strict';
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const knownZones=['Alessandrino','Appio Latino','Centocelle','Collatino','Colli Aniene','Don Bosco','Giardinetti','La Rustica','Pigneto','Prenestino','Quarticciolo','Romanina','San Basilio','Tor Pignattara','Tor Sapienza','Tor Vergata','Torpignattara','Tuscolano','Villa De Sanctis'];
 function zoneFor(record){
  const text=[record.coverage,record.declaredCoverage,record.zone].filter(Boolean).join(' ');
  if(record.regime==='adi')return 'Percorsi ASL · accesso tramite valutazione';
  if(/da confermare|da riconfermare|non.*delimita|non.*specific|non si presume|non garantisce|non.*equipara/i.test(text))return 'Zona puntuale da confermare';
  const zones=knownZones.filter(z=>text.toLowerCase().includes(z.toLowerCase()));
  return zones.length?zones.join(', '):record.allRomeDeclared?'Roma · copertura cittadina dichiarata':'Zona puntuale da confermare';
 }
 function addressMatches(a,b){return !!a&&!!b&&fold(a)===fold(b);}
 const mapAvailable=count=>count>0&&count<=8;
 const api={fold,zoneFor,addressMatches,mapAvailable};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 const explorer=document.getElementById('esplora-servizi');if(!explorer)return;
 document.body.classList.add('q-readable');
 const results=document.getElementById('servizi-risultati');
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const toolbar=make('section',null,'q-subcategories');toolbar.setAttribute('aria-label','Scegli una sottocategoria');
 results.before(toolbar);
 const title=make('h3','Scegli una sottocategoria');toolbar.append(title);
 const back=make('button','Tutti gli ambiti','q-back');back.type='button';toolbar.before(back);
 back.addEventListener('click',()=>{
  document.getElementById('servizi-azzera').click();document.getElementById('servizi-scelte').querySelector('input').focus();
  document.getElementById('servizi-scelte').scrollIntoView({block:'start'});
 });
 let active=null;
 const catalog=window.SportelloServizi;
 function records(){return [...catalog.resources,...catalog.homeOperators,...catalog.nursingResources,...catalog.technicalResources,...catalog.sharedResources,...window.SportelloFisioterapiaData.providers];}
 function cardId(card){return card.dataset.resourceId||card.dataset.physioProvider||card.dataset.socialResource;}
 function recordFor(card){return [...records(),...(window.SportelloSocialitaData?.records||[])].find(r=>r.id===cardId(card));}
 function sourceAddress(record){return record?.address||record?.seats||'';}
 function enhanceCard(card){
  const summary=card.querySelector(':scope > summary');if(!summary||summary.dataset.qEnhanced)return;
  summary.dataset.qEnhanced='true';
  const record=recordFor(card),phone=card.querySelector('a[href^="tel:"]');
  if(record?.neighborhood)summary.append(make('span','Quartiere della sede: '+record.neighborhood,'q-zone'));
  if(phone){const link=make('a',phone.textContent.replace(/^.*?:\s*/,''),'q-phone');link.href=phone.getAttribute('href');link.setAttribute('aria-label','Chiama '+(record?.name||'il servizio')+' al '+link.textContent);link.addEventListener('click',e=>e.stopPropagation());summary.append(link);}
  if(card.dataset.physioProvider||record?.homeKind==='infermieristica'){
   card.classList.add('q-directory-record');card.dataset.qZone=zoneFor(record||{});
   const zone=make('span','Zone servite: '+card.dataset.qZone,'q-zone');summary.append(zone);
   if(!phone)summary.append(make('span','Telefono non documentato · consulta la scheda','q-zone'));
  }
 }
 function setupGroup(group){
  if(group.dataset.qReady)return;group.dataset.qReady='true';
  const summary=group.querySelector(':scope > summary');if(!summary)return;
  const label=summary.firstChild?.textContent||'Servizi';
  const controls=make('div',null,'q-view-controls');
  const searchLabel=make('label','Cerca in questa sottocategoria'),search=make('input');search.type='search';search.placeholder='Nome o servizio';searchLabel.append(search);
  const sortLabel=make('label','Ordina'),sort=make('select');
  for(const [value,text]of [['az','Nome A–Z'],['zone','Zone dichiarate']]){const o=make('option',text);o.value=value;sort.append(o);}sortLabel.append(sort);
  const count=make('p',null,'q-count');count.setAttribute('role','status');
  controls.append(searchLabel,sortLabel,count);summary.after(controls);
  const map=make('div',null,'q-map');map.hidden=true;
  const view=make('div',null,'q-view-switch');view.setAttribute('role','group');view.setAttribute('aria-label','Visualizzazione di '+label);
  const listBtn=make('button','Elenco'),mapBtn=make('button','Mostra sulla mappa');listBtn.type=mapBtn.type='button';
  listBtn.setAttribute('aria-pressed','true');mapBtn.setAttribute('aria-pressed','false');view.append(listBtn,mapBtn);controls.prepend(view);controls.after(map);
  let mapMode=false;
  const cards=()=>[...group.querySelectorAll('details[data-resource-id],details[data-physio-provider]')];
  function refresh(){
   const all=cards();for(const card of all)enhanceCard(card);
   for(const card of all)card.hidden=!!search.value&&!fold(card.textContent).includes(fold(search.value));
   const shown=all.filter(c=>!c.hidden),parents=new Set(all.map(c=>c.parentElement));
   for(const parent of parents){
    parent.querySelectorAll(':scope > .q-zone-heading').forEach(e=>e.remove());
    const siblings=all.filter(c=>c.parentElement===parent);
    siblings.sort((a,b)=>(sort.value==='zone'?(a.dataset.qZone||'Zona puntuale da confermare').localeCompare(b.dataset.qZone||'Zona puntuale da confermare','it'):0)||(recordFor(a)?.name||a.querySelector('summary').textContent).localeCompare(recordFor(b)?.name||b.querySelector('summary').textContent,'it'));
    let lastZone=null;
    for(const card of siblings){
     if(sort.value==='zone'&&!card.hidden&&card.dataset.qZone!==lastZone){lastZone=card.dataset.qZone||'Zona puntuale da confermare';parent.append(make('h4',lastZone,'q-zone-heading'));}
     parent.append(card);
    }
   }
   const points=shown.flatMap(card=>{
    const record=recordFor(card),geo=(window.QuartiereGeometrie||{})[cardId(card)];
    return geo&&addressMatches(sourceAddress(record),geo.address)?[{card,geo,record}]:[];
   });
   count.textContent=shown.length+' schede'+(points.length?' · '+points.length+' sedi con riferimento cartografico':'');
   view.hidden=!mapAvailable(points.length);
   mapBtn.disabled=!mapAvailable(points.length);
   if(!mapAvailable(points.length)){mapMode=false;listBtn.setAttribute('aria-pressed','true');mapBtn.setAttribute('aria-pressed','false');}
   map.hidden=!mapMode;drawMap(map,points);
  }
  function switchMode(value){mapMode=value;listBtn.setAttribute('aria-pressed',String(!value));mapBtn.setAttribute('aria-pressed',String(value));refresh();}
  listBtn.addEventListener('click',()=>switchMode(false));mapBtn.addEventListener('click',()=>switchMode(true));
  search.addEventListener('input',refresh);sort.addEventListener('change',refresh);
  group.qRefresh=refresh;refresh();
 }
 function drawMap(holder,points){
  holder.replaceChildren();if(holder.hidden)return;
  const notice=make('p','Sedi indicative dalla mappa di riferimento ricevuta: non itinerari accessibili verificati. Il punto non attesta la copertura a domicilio.');holder.append(notice);
  const frame=make('div',null,'q-map-frame'),world=make('div',null,'q-map-world');frame.tabIndex=0;frame.setAttribute('role','region');frame.setAttribute('aria-label','Mappa delle sedi. Usa i pulsanti per aprire le schede.');
  const image=make('img');image.src='/quartiere-riferimento-mappa.svg';image.alt='';image.width=1000;image.height=910;world.append(image);frame.append(world);
  const merc=v=>Math.asinh(Math.tan(v*Math.PI/180));
  for(const area of window.QuartiereAree||[]){
   const [lon,lat]=area.point;const label=make('span',area.name,'q-map-label');label.setAttribute('aria-hidden','true');
   label.style.left=((lon-12.495)/.14*100)+'%';label.style.top=((merc(41.939)-merc(lat))/(merc(41.939)-merc(41.844))*100)+'%';world.append(label);
  }
  const clusters=new Map();
  for(const p of points){const key=p.geo.point.map(v=>v.toFixed(3)).join(',');if(!clusters.has(key))clusters.set(key,[]);clusters.get(key).push(p);}
  for(const cluster of clusters.values()){
   const {card,geo,record}=cluster[0];
   const [lon,lat]=geo.point;if(lon<12.495||lon>12.635||lat<41.844||lat>41.939)continue;
   const pin=make('button',cluster.length>1?String(cluster.length):'•','q-pin');pin.type='button';pin.setAttribute('aria-label',cluster.length>1?'Apri '+cluster.length+' schede nella stessa zona: '+cluster.map(p=>p.record.name).join(', '):'Apri scheda '+record.name);pin.title=cluster.map(p=>p.record.name).join(' · ');
   pin.style.left=((lon-12.495)/.14*100)+'%';pin.style.top=((merc(41.939)-merc(lat))/(merc(41.939)-merc(41.844))*100)+'%';
   pin.addEventListener('click',()=>{for(const p of cluster)p.card.open=true;card.querySelector('summary').focus();card.scrollIntoView({block:'start'});});world.append(pin);
  }
  let zoom=1;const commands=make('div',null,'q-map-commands');
  for(const [text,label,delta]of [['+','Ingrandisci la mappa',.25],['−','Riduci la mappa',-.25],['↺','Ripristina la mappa',0]]){
   const button=make('button',text);button.type='button';button.setAttribute('aria-label',label);button.addEventListener('click',()=>{zoom=delta?Math.min(3,Math.max(1,zoom+delta)):1;world.style.width=(zoom*100)+'%';});commands.append(button);
  }
  const attribution=make('a','© OpenStreetMap');attribution.href='https://www.openstreetmap.org/copyright';
  holder.append(commands,frame,attribution);
 }
 function update(){
  observer.disconnect();
  const groups=[...results.querySelectorAll('.sp-result-group')];
  if(active&&!groups.some(g=>g.dataset.group===active))active=null;
  toolbar.replaceChildren(title);
  for(const group of groups){
   setupGroup(group);group.qRefresh?.();
   const summary=group.querySelector(':scope > summary'),label=summary.firstChild?.textContent||'Servizi';
   const button=make('button',label);button.type='button';button.setAttribute('aria-pressed',String(active===group.dataset.group));
   button.addEventListener('click',()=>{active=group.dataset.group;update();group.open=true;summary.focus();group.scrollIntoView({block:'start'});});toolbar.append(button);
   group.hidden=!!active&&group.dataset.group!==active;
  }
  toolbar.hidden=!groups.length;back.hidden=!document.querySelector('#servizi-scelte input:checked');
  for(const card of explorer.querySelectorAll('details[data-resource-id],details[data-physio-provider],details[data-social-resource]'))enhanceCard(card);
  observer.observe(results,{childList:true,subtree:true});
  const social=explorer.querySelector('.sp-social-catalog');if(social)observer.observe(social,{childList:true,subtree:true});
 }
 const observer=new MutationObserver(()=>update());update();
 document.getElementById('servizi-scelte').addEventListener('change',()=>requestAnimationFrame(update));
 explorer.addEventListener('click',event=>{if(event.target.closest('[data-path]'))requestAnimationFrame(update);});
 root.QuartierePresentazione=api;
})(typeof window==='undefined'?globalThis:window);
