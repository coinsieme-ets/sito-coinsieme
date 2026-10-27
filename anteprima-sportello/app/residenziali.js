(() => {
  'use strict';
  const data=window.SportelloResidenzialiData;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  function link(text,url){const a=make('a',text);a.href=url;return a;}
  function decorate(resource,target){
    if(resource.id!=='info-salute-residenziali')return;
    target.append(make('p','Una RSA offre assistenza sanitaria e tutelare a persone non autosufficienti. Una casa di riposo è una struttura socioassistenziale: non equivale a una RSA. Case famiglia, comunità alloggio e riabilitazione residenziale hanno finalità e requisiti diversi.'),make('p','Per il percorso sanitario rivolgiti alla ASL: la valutazione multidimensionale individua il livello appropriato e il percorso di inserimento. Per la residenzialità sociale chiedi ai servizi sociali competenti un progetto individuale. Nessuna richiesta viene inoltrata da COINSIEME.'));
    const guide=make('aside');guide.className='sp-note';guide.append(make('h4','Da dove iniziare'),link('Accesso e lista d’attesa RSA — ASL Roma 2',data.sources.accesso));
    const call=make('p');call.append('Informazioni ASL RSA: ',link('06 5100 5058','tel:0651005058'),' / ',link('06 5100 5061','tel:0651005061'),'. Appuntamenti e recapiti da ricontrollare nella fonte ufficiale.');guide.append(call,make('p','Nel percorso SSR la ripartizione della spesa dipende dal livello assistenziale. Per il mantenimento può esserci una quota sociale e alberghiera a carico della persona, con eventuale sostegno dell’ente locale secondo requisiti e ISEE. Chiedi anche quali extra sono esclusi; tariffe regionali e retta privata non sono la stessa cosa.'),link('Regione Lazio: compartecipazione e valutazione (DGR 614/2025)',data.sources.quote),make('p'),link('Regione Lazio: riferimento tariffario e contributo 2025 (DGR 877/2025)',data.sources.tariffe),make('p','Le misure straordinarie riferite al 2025 non sono presentate come contributi automaticamente attivi nel 2026. Richiedi l’importo applicabile al tuo caso agli uffici competenti.'));
    const rates=make('details');rates.append(make('summary','Quanto può costare: riferimenti tariffari pubblicati nel 2025'),make('p',data.tariffReference),link('Leggi la fonte regionale e le condizioni',data.sources.tariffe));guide.append(rates);
    target.append(guide,make('p','Proprietà privata, autorizzazione, accreditamento e contratto SSR sono informazioni diverse. Un contratto pubblicato non certifica posti liberi né l’ammissione di una singola persona. Le dichiarazioni dei gestori sono distinte dagli atti istituzionali; nessuna partnership con COINSIEME. Non inviare dati sanitari a questo Sportello.'));
    const section=make('section');section.className='sp-social-catalog';const fields=make('fieldset');fields.append(make('legend','Cerca una struttura residenziale'));
    function select(id,label,options){const wrapper=make('label',label),input=make('select');input.id=id;for(const [value,text] of options){const option=make('option',text);option.value=value;input.append(option);}wrapper.append(input);fields.append(wrapper);return input;}
    const type=select('residenziali-tipo','Tipologia',[['tutte','Tutte le tipologie'],...data.types]);
    const municipio=select('residenziali-territorio','Municipio della sede documentato',[['tutti','Tutte le sedi censite'],['IV','Municipio IV'],['V','Municipio V'],['VI','Municipio VI'],['da-verificare','Municipio da confermare']]);
    const access=select('residenziali-accesso','Modalità di accesso documentata',[['tutti','Tutte le modalità'],...data.accessModes]);
    const label=make('label','Nome o indirizzo della struttura'),name=make('input');name.type='search';name.autocomplete='off';name.id='residenziali-nome';label.append(name);fields.append(label);
    const reset=make('button','Azzera i filtri delle strutture');reset.type='button';reset.className='btn btn-secondary';fields.append(reset);
    const status=make('p');status.setAttribute('role','status');status.setAttribute('aria-atomic','true');const list=make('div');section.append(fields,status,list);target.append(section);
    function render(){
      const matches=data.choose({type:type.value,municipio:municipio.value,access:access.value,name:name.value});list.replaceChildren();status.textContent=matches.length+' strutture documentate. Disponibilità di posti non verificata.';
      if(!matches.length)list.append(make('p','Nessuna scheda documentata per questi filtri: non significa che il servizio non esista. Consulta ASL, Comune o GEOASSA.'));
      for(const record of matches){
        const details=make('details');details.id=record.id;details.setAttribute('data-residenziale-id',record.id);details.append(make('summary',record.name+' — '+record.services.map(s=>data.types.find(t=>t[0]===s.type)[1]).join(' / ')),make('p',record.address));
        const dl=make('dl');
        const rows=[['Territorio',record.municipioNote||'Municipio '+record.municipio+' — sede, non bacino di accesso'],['Gestione, non proprietà dell’immobile',record.management],['Attività e destinatari',record.services.map(s=>s.description+' Accesso: '+s.access.map(a=>data.accessModes.find(m=>m[0]===a)[1]).join(', ')).join(' ')],['Autorizzazione, accreditamento e contratti',record.accreditation],['Ingresso privato',record.privateAdmission],['Costi e tariffe',record.costs],['Richiesta e attesa',record.services.some(s=>s.access.includes('ssr'))?'Rivolgiti alla ASL per valutazione, livello, domanda e lista. Il contatto con la struttura non sostituisce l’autorizzazione all’ingresso.':'Verificare con servizi sociali e gestore progetto, requisiti, eventuale valutazione ASL, costi e lista d’attesa.'],['Accessibilità fisica',record.physical],['Da chiarire',record.notes]];
        for(const [title,value] of rows)dl.append(make('dt',title),make('dd',value));details.append(dl);
        if(record.phone){const p=make('p');p.append(link('Telefono struttura: '+record.phone,'tel:'+record.phone));details.append(p);}else details.append(make('p','Recapito telefonico della struttura da verificare: usa il sito ufficiale.'));
        details.append(link('Sito ufficiale o contatti del gestore',record.website),make('p'),link('Mappa esterna per indirizzo',data.mapUrl(record.address)),make('p','La mappa non certifica l’accessibilità dell’ingresso.'));
        for(const source of record.sources){const p=make('p');p.append(link(source.label,source.url),' · Consultata il '+source.checkedAt+(source.documentDate?' · Documento: '+source.documentDate:''));details.append(p);}list.append(details);
      }
    }
    for(const el of [type,municipio,access])el.addEventListener('change',render);name.addEventListener('input',render);reset.addEventListener('click',()=>{type.value='tutte';municipio.value='tutti';access.value='tutti';name.value='';render();type.focus();});render();
    const pending=make('details');pending.append(make('summary','Ricerca ancora da completare: fonti e sedi non confermate'));
    for(const record of data.pending){const p=make('p');p.append(make('strong',record.name+': '),record.reason+' ',link('Fonte da approfondire',record.source));pending.append(p);}target.append(pending);
  }
  window.SportelloResidenziali={decorate};
})();
