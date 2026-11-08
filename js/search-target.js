(function(){
 'use strict';
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const byData=(name,id)=>[...document.querySelectorAll('['+name+']')].find(el=>el.getAttribute(name)===id);
 function reveal(node){
  if(!node)return false;
  for(let el=node;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;
  const focus=node.matches('details')?node.querySelector(':scope > summary'):node;
  if(!focus.hasAttribute('tabindex')&&!focus.matches('summary,a,button'))focus.tabIndex=-1;
  focus.focus({preventScroll:true});node.scrollIntoView({block:'start',behavior:'auto'});return true;
 }
 function set(id,value){const el=document.getElementById(id);if(el){el.value=value;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}}
 function open(){
  if(location.hash.startsWith('#scheda-')){
   const key=location.hash.slice(8),card=[...document.querySelectorAll('article.solution')].find(el=>fold(el.querySelector('h3')?.textContent)===key);
   if(card){const detail=card.querySelector('details');if(detail)detail.open=true;reveal(card);}return;
  }
  if(!location.hash.startsWith('#cerca='))return;
  document.getElementById('search-target-notice')?.remove();
  let parts;try{parts=location.hash.slice(7).split('/').map(decodeURIComponent);}catch{return;}
  const [category,kind,id]=parts;
  if(parts.length!==3||!id||id.length>180||!/^[-a-z0-9]+$/.test(id))return;
  const choice=[...document.querySelectorAll('#servizi-scelte input')].find(el=>el.value===category);if(!choice)return;
  document.querySelectorAll('#servizi-scelte input').forEach(el=>{el.checked=el===choice;});choice.dispatchEvent(new Event('change',{bubbles:true}));
  let node;
  if(kind==='ambito'){
   if(category==='socialita'){document.querySelector('[data-journey="tutte"]')?.click();node=document.getElementById('socialita-titolo');}
   else node=byData('data-group',category+':'+id)||document.querySelector('#servizi-risultati details')||document.getElementById('servizi-risultati-titolo');
  }else if(kind==='sociale'){
   document.querySelector('[data-journey="tutte"]')?.click();
   for(let i=0;i<30;i++){node=byData('data-social-resource',id);if(node)break;const more=[...document.querySelectorAll('.sp-social-pathways button')].find(el=>el.textContent==='Mostra altre risorse'&&!el.hidden);if(!more)break;more.click();}
  }else if(kind==='coabitazione'){
   document.querySelector('[data-coab-path="seeker"]')?.click();set('coabitazione-territorio','tutti');node=byData('data-coab-id',id);
  }else if(kind.startsWith('fisio-')){
   document.querySelector('[data-path="'+(kind==='fisio-privato'?'privato':'pubblico')+'"]')?.click();set('fisioterapia-asl','tutte');node=byData('data-physio-provider',id);
  }else{
   const prefixes={risorsa:'risorsa-',diagnostica:'diagnostica-',televisite:'televisite-',farmacia:'farmacia-',residenza:'',ambufest:'ambufest-',cupmedico:''};
   if(Object.hasOwn(prefixes,kind))node=document.getElementById(prefixes[kind]+id);
  }
  if(!reveal(node)){
   const old=document.getElementById('search-target-notice');old?.remove();
   const note=document.createElement('p');note.id='search-target-notice';note.textContent='La scheda cercata non è disponibile con questo collegamento. Puoi esplorare le risorse della categoria selezionata.';note.tabIndex=-1;document.getElementById('servizi-risultati').before(note);reveal(note);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',open,{once:true});else open();
 window.addEventListener('hashchange',open);
 window.addEventListener('pageshow',event=>{if(event.persisted)open();});
})();
