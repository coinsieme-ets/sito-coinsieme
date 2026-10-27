(function(root){
  'use strict';
  const checkedAt='2026-10-27';
  const sources={
    guardia:'https://www.aslroma2.it/index.php/servizi/guardia-medica',
    numero:'https://salutelazio.it/it/servizi/116117-numero-unico-europeo-per-cure-non-urgenti',
    ambufest:'https://www.aslroma2.it/index.php/ambufest',
    regioneAmbufest:'https://salutelazio.it/it/servizi/ambulatori-aperti-fine-settimana-e-festivi',
    accesso:'https://www.aslroma2.it/attachments/article/637/Italiano-Format%20guida%20A5.pdf'
  };
  // Facility references reuse existing records; service-specific facts remain separate.
  const sites=[
    {id:'forteguerri',resourceId:'territorio-santa-caterina',zone:'Prenestino - Torpignattara',profiles:['adulti','pediatrico']},
    {id:'eucalipti',resourceId:'territorio-san-felice',serviceAddress:'Via degli Eucalipti 14, Roma',zone:'Centocelle - Tor de’ Schiavi',profiles:['adulti'],note:'Il civico 14 è documentato per AmbuFest. Resta distinta la cautela 14/20 già presente nella scheda generale del presidio.'},
    {id:'casal-pazzi',address:'Via Casal de’ Pazzi 16, Roma',zone:'Casal de’ Pazzi',profiles:['adulti','pediatrico'],note:'ASL elenca anche il pediatrico; la tabella regionale per i bambini sotto i 6 anni non riporta questa sede. Confermare servizio pediatrico e fascia di età prima di recarsi qui.'},
    {id:'torrenova',address:'Via della Tenuta di Torrenova 138, Roma',zone:'Tor Vergata - Torre Angela',profiles:['adulti','pediatrico']},
    {id:'rubellia',address:'Via Rubellia 1, Roma',zone:'Settecamini',profiles:['adulti']}
  ];
  const hours={guardia:'Notti feriali e festive 20:00–08:00; sabato e prefestivi 10:00–20:00; domenica e festivi 08:00–20:00.',
    ambufest:'Sabato, domenica e festivi 10:00–19:00; prefestivi 14:00–19:00.'};
  function resolve(site,catalog){
    const existing=site.resourceId?catalog.resources.find(r=>r.id===site.resourceId):null;
    if(site.resourceId&&!existing)throw Error('Presidio AmbuFest non trovato: '+site.resourceId);
    return {...site,address:site.serviceAddress||existing?.address||site.address,facilityName:existing?.name||null};
  }
  const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function choose(catalog,filters={}){
    return sites.map(site=>resolve(site,catalog)).filter(site=>(!filters.profile||filters.profile==='tutti'||site.profiles.includes(filters.profile))&&(!filters.zone||filters.zone==='tutte'||site.zone===filters.zone)&&fold([site.address,site.zone,site.facilityName,'AmbuFest'].join(' ')).includes(fold(filters.name)));
  }
  const mapUrl=address=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);
  const data={checkedAt,sources,sites,hours,resolve,choose,mapUrl};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloContinuitaData=data;
})(typeof window==='undefined'?globalThis:window);
