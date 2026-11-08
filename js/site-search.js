(function(root){
  'use strict';
  const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').replace(/[^a-z0-9]+/g,' ').trim();
  const slug=value=>fold(value).replace(/ /g,'-');
  const aliases=[['aiuto a casa','assistenza domiciliare','badante','assistente familiare'],['giochi di carte','burraco','scopa','tressette','briscola'],['aprire senza chiavi','serratura smart','serrature intelligenti'],['salvavita','telesoccorso','chiamata di aiuto'],['fisioterapia','fisioterapista','riabilitazione'],['fare amicizia','socialita','incontrarsi'],['cup','recup','prenotare visite'],['cohousing','coabitazione','abitare insieme']];
  const stop=new Set(['a','ad','al','alla','alle','agli','allo','ai','da','dal','dalla','di','del','della','delle','dei','e','ed','il','lo','la','le','gli','i','in','nel','nella','per','un','una','uno','con','che','cerco','cercare','vorrei']);
  function search(entries,query,today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'})){
    const q=fold(query).slice(0,250),tokens=q.split(' ').filter(t=>t&&!stop.has(t));
    if(q.length<2||!tokens.length)return [];
    const groups=aliases.filter(group=>group.some(term=>(' '+q+' ').includes(' '+term+' ')));
    return entries.filter(e=>!e.until||e.until>=today).map(e=>{
      const title=fold(e.title),body=fold(e.text||e.summary),all=title+' '+body;
      const direct=tokens.every(t=>all.split(' ').some(w=>w.startsWith(t)));
      const related=groups.some(group=>group.some(term=>title.includes(term)));
      const score=direct?(title===q?150:title.includes(q)?110:70)+tokens.filter(t=>title.includes(t)).length*6:related?85:0;
      return {entry:e,score};
    }).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title,'it')).map(x=>x.entry);
  }
  const api={fold,slug,search};
  if(typeof module==='object'&&module.exports){module.exports=api;return;}
  root.CoinsiemeSearch=api;
  const section=document.getElementById('site-search');if(!section)return;
  const input=section.querySelector('input'),form=section.querySelector('form'),clear=section.querySelector('[data-search-clear]'),panel=section.querySelector('[data-search-results]'),list=section.querySelector('ol'),status=section.querySelector('[role="status"]'),heading=section.querySelector('h3'),more=section.querySelector('[data-search-more]');
  let limit=5,timer;
  function draw(){
    const q=input.value.trim();list.replaceChildren();clear.hidden=!q;panel.hidden=q.length<2;more.hidden=true;
    if(q.length<2){status.textContent=q?'Scrivi almeno due caratteri.':'';return;}
    const results=search(root.CoinsiemeSearchIndex||[],q);
    status.textContent=results.length?results.length+' risultati · '+Math.min(limit,results.length)+' mostrati':'Nessun risultato. Prova con una parola più semplice oppure esplora lo Sportello.';
    if(!results.length){const li=document.createElement('li'),a=document.createElement('a');a.href='/anteprima-sportello/#esplora-servizi';a.textContent='Esplora lo Sportello';li.append(a);list.append(li);}
    for(const item of results.slice(0,limit)){
      const li=document.createElement('li'),label=document.createElement('span'),a=document.createElement('a'),p=document.createElement('p');
      label.className='site-search-kind';label.textContent=item.type;a.href=item.url;a.textContent=item.title;p.textContent=item.summary;li.append(label,a,p);list.append(li);
    }
    more.hidden=results.length<=limit;
  }
  function reset(){clearTimeout(timer);input.value='';limit=5;draw();}
  if(!Array.isArray(root.CoinsiemeSearchIndex)){
    status.textContent='La ricerca non è disponibile. Puoi consultare direttamente le sezioni del sito.';panel.hidden=false;heading.textContent='Da dove iniziare';
    for(const [title,url]of [['Sportello','/anteprima-sportello/#esplora-servizi'],['Casa','/casa-che-si-prende-cura/'],['Articoli','/articoli.html']]){const li=document.createElement('li'),a=document.createElement('a');a.textContent=title;a.href=url;li.append(a);list.append(li);}return;
  }
  form.hidden=false;
  input.addEventListener('input',()=>{clearTimeout(timer);limit=5;timer=setTimeout(draw,220);});
  form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);draw();if(!panel.hidden)heading.focus({preventScroll:true});});
  clear.addEventListener('click',()=>{reset();input.focus();});
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){reset();input.focus();}});
  more.addEventListener('click',()=>{limit+=5;draw();list.children[limit-5]?.querySelector('a')?.focus();});
  window.addEventListener('pagehide',reset);window.addEventListener('pageshow',e=>{if(e.persisted)reset();});
})(typeof window==='undefined'?globalThis:window);
