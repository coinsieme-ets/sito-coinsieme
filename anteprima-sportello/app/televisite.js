(() => {
  'use strict';
  const data=window.SportelloTelevisiteData;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  function link(text,url){const a=make('a',text);a.href=url;return a;}
  function decorate(resource,target){
    if(resource.id!=='info-salute-visite-private-televisite')return;
    target.append(make('p','iDoctors, Doctolib e MioDottore aiutano a cercare specialisti, confrontare appuntamenti e prezzi pubblicati e prenotare. Le visite private sono a pagamento; consultazione e prenotazione sono generalmente gratuite per il cittadino, salvo condizioni specifiche.'),
      make('p','Alcuni professionisti offrono una visita o un colloquio in videochiamata con smartphone, tablet o computer. Può ridurre gli spostamenti, anche per persone anziane o con disabilità. Controlli, esami già effettuati e seconde opinioni possono essere discussi a distanza quando il medico lo ritiene appropriato.'),
      make('p','Leggi più recensioni, quando disponibili, e controlla data, qualifiche ed esperienza del medico. Le opinioni dei pazienti non certificano la qualità clinica. Le regole sulle recensioni variano fra piattaforme.'),
      make('p','Una videochiamata non equivale sempre a una visita completa: prestazione, pagamento, prescrizioni e documenti rilasciati vanno chiariti prima di prenotare. Non tutti gli esami o le visite si possono fare a distanza.'));
    const warning=make('p');warning.className='sp-service-caution';warning.append('Questi servizi non sostituiscono medico di famiglia, guardia medica o pronto soccorso. Per emergenze sanitarie chiama il ',link('112','tel:112'),'.');target.append(warning);
    target.append(make('h4','Come iniziare, passo dopo passo'));
    const steps=make('ol');
    for(const text of ['Apri uno dei siti ufficiali sotto e cerca lo specialista. Per una visita in studio indica la città sul sito della piattaforma.',
      'Se vuoi collegarti da casa, cerca Video o Online e verifica che il professionista offra quella prestazione.',
      'Controlla prezzo, pagamento, eventuale account richiesto, disdetta e cosa riceverai dopo il colloquio. Se qualcosa non è chiaro, chiedi al professionista prima di confermare.',
      'Prenota soltanto sul sito scelto. Leggi la conferma e prova telecamera, microfono e connessione prima dell’appuntamento.'])steps.append(make('li',text));
    target.append(steps,make('p','Se non sai come collegarti, puoi chiedere aiuto a un familiare, a un caregiver (chi ti assiste) o a una persona di fiducia, mantenendo il controllo delle tue scelte. Non condividere password. Prepara eventuali esami e inviali solo nei canali indicati dal servizio: non caricarli su COINSIEME.'),make('p','COINSIEME offre solo orientamento: non prenota, non incassa pagamenti e non raccoglie dati sanitari. Nessuna convenzione commerciale o partnership dichiarata con queste piattaforme. Non sono state censite disponibilità di singoli medici nel Municipio V.'));
    for(const record of data.records){
      const details=make('details');details.id='televisite-'+record.id;details.append(make('summary',record.name+' — Scopri modalità e limiti'),make('p',record.description));
      const dl=make('dl');for(const [label,value] of [['Costi e pagamento',record.costs],['Come collegarsi',record.connection],['Prescrizioni e documenti: cosa verificare',record.documents],['Recensioni',record.reviews]])dl.append(make('dt',label),make('dd',value));
      details.append(dl,link('Apri il servizio ufficiale '+record.name,record.url));
      for(const source of record.sources){const p=make('p');p.append(link(source.label,source.url),' · Consultata il '+data.checkedAt);details.append(p);}
      target.append(details);
    }
  }
  window.SportelloTelevisite={decorate};
})();
