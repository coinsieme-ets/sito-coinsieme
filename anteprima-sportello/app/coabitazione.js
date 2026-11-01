(() => {
  'use strict';
  const data=window.SportelloCoabitazioneData;
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const anchor=(text,url)=>{const a=make('a',text);a.href=url;return a;};
  function source(target,s){const p=make('p');p.append(anchor(s.label,s.url),' · Consultata il '+s.checkedAt+(s.date?' · Pubblicata il '+s.date:''));target.append(p);}
  function decorate(resource,target){
    if(resource.id!=='info-abitare')return;
    target.classList.add('sp-coabitazione');target.append(make('h4','Abitare insieme · Cohousing e coabitazione solidale'),make('p','Hai uno spazio da condividere oppure cerchi una soluzione abitativa basata sulla solidarietà?','sp-coab-question'),make('p','COINSIEME ti aiuta a conoscere iniziative e organizzazioni esterne. Condividere l’abitazione, farsi compagnia e offrire piccoli aiuti reciproci non significa erogare assistenza professionale o sanitaria né prestazioni lavorative.'),make('p','Priorità a Roma: '+data.choose({territory:'roma'}).length+' riferimenti documentati. Le altre città e le reti nazionali informative sono consultabili separatamente. Nessuna disponibilità è garantita.','sp-coab-priority'));
    const choices=make('div',null,'sp-coab-paths'),buttons=[];target.append(choices);
    const panel=make('section');panel.id='coabitazione-percorso';panel.hidden=true;
    const title=make('h5');title.tabIndex=-1;title.id='coabitazione-titolo';panel.setAttribute('aria-labelledby',title.id);panel.append(title);
    const filters=make('fieldset');filters.append(make('legend','Cerca tra le iniziative documentate'));
    const state={path:'host',territory:'roma',type:'tutti',query:''};
    function select(id,label,values,key){const wrapper=make('label',label),input=make('select');input.id=id;for(const [value,text] of values){const o=make('option',text);o.value=value;input.append(o);}input.value=state[key];input.addEventListener('change',()=>{state[key]=input.value;render();});wrapper.append(input);filters.append(wrapper);}
    select('coabitazione-territorio','Territorio del progetto, non disponibilità',[['roma','Roma'],['milano','Città metropolitana di Milano'],['potenza','Potenza · ambito attuale da confermare'],['nazionale','Rete informativa nazionale'],['tutti','Tutti i riferimenti']], 'territory');
    select('coabitazione-tipo','Tipo di esperienza',[['tutti','Tutte le tipologie'],['convivenza','Coabitazione intergenerazionale'],['comunita','Comunità e progetti in formazione'],['rete','Rete informativa e progettuale']], 'type');
    const label=make('label','Nome dell’iniziativa'),input=make('input');input.type='search';input.id='coabitazione-nome';input.autocomplete='off';label.append(input);filters.append(label);input.addEventListener('input',()=>{state.query=input.value;render();});
    const count=make('p');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.id='coabitazione-conteggio';
    const list=make('div');panel.append(filters,count,list);
    const note=make('aside',null,'sp-coab-note');note.setAttribute('aria-label','Ruolo e responsabilità di COINSIEME');note.append(make('p',data.note),make('p','COINSIEME non raccoglie o archivia dati personali di chi offre o cerca casa. Restano applicabili gli obblighi privacy relativi al normale funzionamento del sito e agli eventuali strumenti di analisi. Nessuna organizzazione è presentata come partner della Fondazione.'));
    target.append(make('p',data.records.length+' iniziative documentate · Nessuna disponibilità abitativa verificata · Consultazione '+data.checkedAt+'.'),note,panel);
    function render(){
      const records=data.choose(state);count.textContent=records.length+(records.length===1?' iniziativa per questi filtri.':' iniziative per questi filtri.')+' Non sono offerte abitative disponibili.';list.replaceChildren();
      if(!records.length)list.append(make('p','Nessuna iniziativa documentata per questi filtri. Prova un territorio o una tipologia diversa.'));
      const territories={roma:'Roma · Riferimenti prioritari',milano:'Altra città · Area metropolitana di Milano',potenza:'Altra città · Potenza',nazionale:'Rete nazionale informativa · Non è un’offerta abitativa'},seen=new Set();
      for(const r of records){
        if(!seen.has(r.territory)){const group=make('h6',territories[r.territory]);group.dataset.coabTerritory=r.territory;list.append(group);seen.add(r.territory);}
        const card=make('details',null,'sp-service-result');card.dataset.coabId=r.id;
        const summary=make('summary',r.name+' — informazioni e condizioni');summary.append(make('span',r.type==='rete'?'Rete informativa · Nessuna stanza offerta':'Operatività e disponibilità attuali da verificare con il responsabile','sp-coab-card-status'));
        card.append(summary,make('p',r.status,'sp-service-badge'),make('p',r.description));
        const dl=make('dl');for(const [name,value] of [['Responsabile',r.entity],['Territorio e funzione',territories[r.territory]],[state.path==='host'?'Per chi vuole condividere casa':'Per chi cerca coabitazione',r[state.path]],['Accompagnamento dichiarato',r.access],['Costi e condizioni',r.costs],['Opportunità attive',r.availability],['Accessibilità e destinatari',r.eligibility]])dl.append(make('dt',name),make('dd',value));
        card.append(dl,make('p','Prima di aderire, verifica direttamente con il responsabile se il progetto sia attivo, accetti nuove richieste e sia adatto alle tue esigenze. Il collegamento alla documentazione non è un accesso abitativo confermato.'),anchor(r.siteAccess==='non_confermato'?'Riferimento ufficiale · Raggiungibilità non confermata':'Consulta le informazioni ufficiali · Sito esterno',r.url));
        if(r.email)card.append(anchor(r.email,'mailto:'+r.email));if(r.phone)card.append(anchor('Telefono: '+r.phone,'tel:'+r.phone));
        for(const s of r.sources)source(card,r.siteAccess==='non_confermato'?{...s,label:s.label+' · Riferimento documentale, raggiungibilità da verificare'}:s);list.append(card);
      }
    }
    for(const [id,label] of [['host','Ho una parte della casa da condividere'],['seeker','Cerco una coabitazione solidale']]){
      const button=make('button',label);button.type='button';button.dataset.coabPath=id;button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{state.path=id;panel.hidden=false;title.textContent=label;for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));render();title.focus({preventScroll:true});title.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});choices.append(button);buttons.push(button);
    }
    const experiences=make('details');experiences.append(make('summary','Esperienze documentate e testimonianze: come leggerle'),make('p','Nessuna raccolta indipendente di recensioni è stata verificata in questa ricognizione. Non pubblichiamo punteggi, classifiche o giudizi sui singoli partecipanti.'));
    for(const e of data.experiences){experiences.append(make('h5',e.title),make('p',e.kind),make('p',e.description));source(experiences,e.source);}target.append(experiences);
    const links=make('nav');links.setAttribute('aria-label','Approfondimenti COINSIEME sull’abitare');links.append(make('h5','Autonomia e relazioni di prossimità'),make('p','Gli approfondimenti spiegano modelli e prospettive: non sono annunci o servizi abitativi COINSIEME già operativi.'),anchor('Casa che si prende cura: soluzioni per l’autonomia','/casa-che-si-prende-cura/'),anchor('Cohousing e abitare collaborativo','/articoli/cohousing-abitare-insieme-per-vivere-piu-autonomi-un-sistema-di-vita-contemporaneo-che-unisce-casa-relazioni-servizi-condivisi-e-tecnologie-assistive/'),anchor('Esplora anche l’ambito Vicinato e solidarietà nello Sportello','#servizio-vicinato'));target.append(links);
  }
  const selectionCaption=resources=>resources.length===1&&resources[0].id==='info-abitare'?'Coabitazione solidale: 2 percorsi informativi e '+data.records.length+' iniziative documentate. Nessuna disponibilità abitativa verificata.':null;
  window.SportelloCoabitazione={decorate,selectionCaption};
})();
