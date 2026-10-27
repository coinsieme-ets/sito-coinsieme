(() => {
  'use strict';
  const data=window.SportelloDiagnosticaData;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const link=(text,url)=>{const el=make('a',text);el.href=url;return el;};
  function decorate(resource,target){
    if(resource.id!=='info-salute-diagnostica-domicilio')return;
    target.append(make('p','Prelievi, radiografie e altri esami possono essere eseguiti a casa quando l’operatore li offre e il professionista li ritiene appropriati. Qui trovi prestazioni private a pagamento, da prenotare direttamente con l’operatore. Le attività ambulatoriali non sono automaticamente disponibili a domicilio.'),
      make('p','Prima di prenotare chiedi se il tuo indirizzo è coperto e un preventivo comprensivo di esame, uscita e refertazione. Chiarisci prescrizione richiesta, preparazione e tempi direttamente con il servizio.'),
      make('p','COINSIEME non raccoglie informazioni cliniche, non gestisce prenotazioni o pagamenti e non è convenzionata con gli operatori segnalati. Queste prestazioni non sostituiscono la continuità assistenziale pubblica: per le emergenze chiama il 112.'),
      make('p','Autorizzazione del centro, accreditamento SSR e titoli per radiologia domiciliare sono distinti. Le schede riportano quanto documentato e ciò che resta da chiarire, senza certificare l’idoneità degli operatori.'));
    const section=make('section');section.className='sp-social-catalog';
    const fields=make('fieldset');fields.append(make('legend','Cerca un esame a domicilio'));
    const label=make('label','Tipo di prestazione'),type=make('select');type.id='diagnostica-tipo';
    for(const [value,text] of [['tutti','Tutte le prestazioni'],...data.types]){const option=make('option',text);option.value=value;type.append(option);}label.append(type);
    const searchLabel=make('label','Nome o sede dell’operatore'),name=make('input');name.id='diagnostica-nome';name.type='search';name.autocomplete='off';searchLabel.append(name);
    const reset=make('button','Azzera i filtri diagnostica');reset.type='button';reset.className='btn btn-secondary';fields.append(label,searchLabel,reset);
    const status=make('p');status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
    const list=make('div');section.append(fields,status,list);target.append(section);
    function render(){
      const records=data.choose({type:type.value,name:name.value});list.replaceChildren();status.textContent=records.length+' operatori. Copertura e disponibilità da confermare.';
      if(!records.length)list.append(make('p','Nessun operatore censito per questa ricerca; non significa che la prestazione non esista.'));
      for(const r of records){
        const card=make('details');card.id='diagnostica-'+r.id;card.setAttribute('data-diagnostica-id',r.id);card.append(make('summary',r.name),make('p',r.description));
        if(r.caution){const warning=make('p',r.caution);warning.className='sp-service-caution';card.append(warning);}
        const dl=make('dl');
        for(const [title,value] of [['Sede, non copertura domiciliare',r.address],['Territorio dichiarato',r.coverage],['Come prenotare direttamente',r.booking],['Tariffe e inclusioni',r.costs],['Tempi e referti',r.timing],['Autorizzazioni: documenti e verifiche aperte',r.authorization]])dl.append(make('dt',title),make('dd',value));card.append(dl);
        for(const phone of [r.phone,r.otherPhone].filter(Boolean)){const p=make('p');p.append(link('Telefono operatore: '+phone,'tel:'+phone));card.append(p);}
        if(r.email){const p=make('p');p.append(link('Email operatore: '+r.email,'mailto:'+r.email));card.append(p);}
        for(const s of r.sources){const p=make('p');p.append(link(s.label,s.url),' · Consultata il '+s.checkedAt);card.append(p);}list.append(card);
      }
    }
    type.addEventListener('change',render);name.addEventListener('input',render);
    reset.addEventListener('click',()=>{type.value='tutti';name.value='';render();type.focus();});render();
  }
  window.SportelloDiagnostica={decorate};
})();
