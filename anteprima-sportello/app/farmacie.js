(() => {
 'use strict';
 const data=window.SportelloFarmacieData;
 const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
 function link(text,url){const a=make('a',text);a.href=url;return a;}
 function decorate(resource,target,catalog,resources){
  if(resource.id!=='info-salute-farmacie')return;
  const notice=make('aside');notice.className='sp-note';notice.append(make('h4','Cerchi una farmacia di turno?'));
  const p=make('p'),a=link('Consulta i turni ufficiali aggiornati dell’Ordine',data.turns);a.className='btn btn-primary';p.append(a);notice.append(p,make('p','Scegli la data sul sito dell’Ordine e telefona prima di partire. Questo catalogo non acquisisce i turni giornalieri: nessuna farmacia è indicata come di turno oggi o aperta adesso. H24 dichiarata, apertura domenicale e turno festivo sono informazioni diverse.'));
  notice.append(link('Pagina Cittadino: turni e liste H24',data.official));target.append(notice);
  target.append(make('p','Consegna locale e spedizione tramite corriere non sono equivalenti. Conferma zona, tempi, costi, disponibilità dei prodotti e gestione della ricetta con la farmacia.'),make('p','La vendita online di medicinali con ricetta non è consentita. Per medicinali senza ricetta usa solo venditori autorizzati. Un servizio di recapito concordato con il farmacista non dimostra che tutti i farmaci siano consegnabili; non inviare ricette o indirizzi a COINSIEME.'),make('p','Per le farmacie censite non sono stati accertati i singoli medicinali con ricetta recapitabili né le relative procedure. L’autorizzazione alla vendita online dei singoli siti non è verificata in questo catalogo.'),link('Ministero della Salute: vendita online di medicinali',data.law),make('p','Nessuna farmacia è presentata come partner COINSIEME. Accessibilità fisica degli ingressi e modalità di servizio notturno non verificate sul posto.'));
  const section=make('section');section.className='sp-social-catalog';const fields=make('fieldset');fields.append(make('legend','Cerca il servizio della farmacia'));
  const modeLabel=make('label','Modalità di consultazione'),mode=make('select');mode.id='farmacie-mode';
  for(const [value,text] of [['tutte','Tutte le schede censite'],['notturne','Farmacie notturne e H24'],['festive','Domenica, festivi e turni'],['consegna','Consegna locale o spedizione tramite corriere']]){const opt=make('option',text);opt.value=value;mode.append(opt);}modeLabel.append(mode);
  const nameLabel=make('label','Cerca per nome, indirizzo o riferimento territoriale'),name=make('input');name.type='search';name.autocomplete='off';name.id='farmacie-name';nameLabel.append(name);fields.append(modeLabel,nameLabel);
  const count=make('p');count.setAttribute('role','status');const list=make('div');section.append(fields,count,list);target.append(section);
  function render(){
   const matches=data.choose(window.SportelloConsegneData,{mode:mode.value,name:name.value});list.replaceChildren();count.textContent=matches.length+' farmacie censite per questi filtri. Servizi documentati, non disponibilità in tempo reale.';
   if(mode.value==='festive')list.append(make('p','Le schede indicano H24 o aperture domenicali dichiarate, non il turno della giornata. Per tutte le altre farmacie consulta l’Ordine alla data che ti interessa.'));
   if(!matches.length)list.append(make('p','Nessun risultato censito: non significa che manchino farmacie aperte nella zona. Consulta i turni ufficiali sopra.'));
   for(const record of matches){
    if(record.deliveryRef&&resources.some(r=>r.id===record.id)){
     const reference=make('p'),jump=link('Apri l’unica scheda già mostrata in Consegne a domicilio','#risorsa-'+record.id);reference.append(record.name+': ',jump);list.append(reference);
     jump.addEventListener('click',event=>{const el=[...document.querySelectorAll('[data-resource-id]')].find(item=>item.getAttribute('data-resource-id')===record.id);if(!el)return;event.preventDefault();for(let parent=el;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;el.querySelector('summary').focus();el.scrollIntoView({block:'start',behavior:'instant'});});continue;
    }
    const details=make('details');details.id='farmacia-'+record.id;details.append(make('summary',record.name),make('p',record.address));
    const dl=make('dl');for(const [label,value] of [['Apertura dichiarata, da confermare',record.opening],['Consegna e condizioni',record.delivery],['Tipo di recapito',record.deliveryKind],['Riferimento territoriale della sede, non copertura delle consegne',record.reference]])if(value)dl.append(make('dt',label),make('dd',value));details.append(dl);
    if(record.note)details.append(make('p',record.note));
    if(record.original){details.append(make('p',record.original.description),make('p',record.original.access));for(const note of record.original.notes||[])details.append(make('p',note));}
    const call=make('p');call.append(link('Chiama la farmacia: '+record.phone,'tel:'+record.phone));details.append(call,link('Mappa esterna per indirizzo',data.mapUrl(record.address)),make('p','La mappa non certifica l’ingresso o un percorso accessibile.'));
    for(const source of record.sources){const p=make('p');p.append(link(source.label,source.url),' · Consultata il '+source.checkedAt);details.append(p);}list.append(details);
   }
  }
  mode.addEventListener('change',render);name.addEventListener('input',render);render();
 }
 window.SportelloFarmacie={decorate};
})();
