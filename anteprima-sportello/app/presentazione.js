/* Migliora la leggibilita senza sovrapporre filtri ai percorsi del catalogo. */
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
 const api={fold,zoneFor};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 const explorer=document.getElementById('esplora-servizi');if(!explorer)return;
 const results=document.getElementById('servizi-risultati'),choices=document.getElementById('servizi-scelte');
 document.body.classList.add('q-readable');
 const make=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const back=make('button','Tutti gli ambiti','q-back');back.type='button';results.before(back);
 back.addEventListener('click',()=>{document.getElementById('servizi-azzera').click();choices.querySelector('input').focus();choices.scrollIntoView({block:'start'});});
 function records(){const c=window.SportelloServizi;return [...c.resources,...c.homeOperators,...c.nursingResources,...c.technicalResources,...c.sharedResources,...window.SportelloFisioterapiaData.providers,...(window.SportelloSocialitaData?.records||[])];}
 function enhanceCard(card,byId){
  const summary=card.querySelector(':scope > summary');if(!summary||summary.dataset.qEnhanced)return;
  summary.dataset.qEnhanced='true';
  const record=byId.get(card.dataset.resourceId||card.dataset.physioProvider||card.dataset.socialResource),phone=card.querySelector('a[href^="tel:"]');
  if(record?.neighborhood)summary.append(make('span','Quartiere della sede: '+record.neighborhood,'q-zone'));
  if(phone){const link=make('a',phone.textContent.replace(/^.*?:\s*/,''),'q-phone');link.href=phone.getAttribute('href');link.setAttribute('aria-label','Chiama '+(record?.name||'il servizio')+' al '+link.textContent);link.addEventListener('click',e=>e.stopPropagation());summary.append(link);}
  if(card.dataset.physioProvider||record?.homeKind==='infermieristica'){
   card.classList.add('q-directory-record');
   summary.append(make('span',record?.regime==='adi'?zoneFor(record):'Zone servite: '+zoneFor(record||{}),'q-zone'));
   if(!phone)summary.append(make('span','Telefono non documentato · consulta la scheda','q-zone'));
  }
 }
 function update(){
  observer.disconnect();
  back.hidden=!choices.querySelector('input:checked');
  const byId=new Map(records().map(r=>[r.id,r]));
  for(const card of explorer.querySelectorAll('details[data-resource-id],details[data-physio-provider],details[data-social-resource]'))enhanceCard(card,byId);
  observer.observe(results,{childList:true,subtree:true});
  const social=explorer.querySelector('.sp-social-catalog');if(social)observer.observe(social,{childList:true,subtree:true});
 }
 const observer=new MutationObserver(update);update();
 choices.addEventListener('change',()=>requestAnimationFrame(update));
 root.QuartierePresentazione=api;
})(typeof window==='undefined'?globalThis:window);
