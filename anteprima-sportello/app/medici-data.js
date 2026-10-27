/* Solo fonti pubbliche: nessuna consultazione del FSE del cittadino. */
(function(root){
  'use strict';
  const checkedAt='2026-10-27';
  const region='https://salutelazio.it/it/servizi/medico-di-famiglia';
  const asl='https://www.aslroma2.it/index.php/home-5-distretto/uoc-cure-primarie-5d';
  const sources=[{url:region,label:'Regione Lazio: cercare, scegliere o cambiare medico',checkedAt},
    {url:asl,label:'ASL Roma 2: scelta e revoca, sportelli e avvertenze',checkedAt}];
  // References to existing catalog records, not additional facility records.
  const offices=[
    {resourceId:'territorio-santa-caterina',address:'Via Forteguerri 4',endOfShift:'Lun-ven 17:50; sab 13:00'},
    {resourceId:'territorio-bresadola',address:'Via Bresadola 56',endOfShift:'Lun-ven 17:50; sab 12:00'},
    {resourceId:'territorio-san-felice',address:'Via degli Eucalipti 14',endOfShift:'Lun-mar 17:30; mer-ven 12:30',note:'Il civico 14 riguarda questo sportello nella fonte ASL; resta distinta la precedente incertezza 14/20 sulla struttura.'},
    {resourceId:'territorio-la-rustica',address:'Via della Rustica 218',endOfShift:'Lun-gio 17:30; ven 12:00'}
  ];
  const availabilityLabels={disponibile:'Disponibile',massimale_raggiunto:'Massimale raggiunto',da_verificare:'Da verificare'};
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  const official=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['salutelazio.it','www.salutelazio.it','aslroma2.it','www.aslroma2.it'].includes(u.hostname);}catch{return false;}};
  function availability(record){
    const evidence=record.availability||{};
    return ['disponibile','massimale_raggiunto'].includes(evidence.status)&&official(evidence.source)&&validDate(evidence.checkedAt)?evidence.status:'da_verificare';
  }
  function documented(record){
    return Boolean(record.id&&record.name&&['MMG','PLS'].includes(record.type)&&record.address&&record.asl&&official(record.source)&&validDate(record.checkedAt));
  }
  function choose(records,filters={}){
    const seen=new Set();
    return records.filter(record=>{
      if(!documented(record)||seen.has(record.id))return false;
      seen.add(record.id);
      return (!filters.type||filters.type==='tutti'||record.type===filters.type)&&
        (!filters.municipio||filters.municipio==='tutti'||String(record.municipio)===filters.municipio)&&
        (!filters.quarter||filters.quarter==='tutti'||record.quarter===filters.quarter)&&
        (!filters.name||normalize(record.name).includes(normalize(filters.name)))&&
        (!filters.availability||filters.availability==='tutti'||availability(record)===filters.availability);
    });
  }
  const data={checkedAt,sources,offices,doctors:[],availabilityLabels,availability,documented,choose,region,asl,
    publicSearch:{url:'https://www.salutelazio.it/ricerca-medici',checkedAt,status:'Ricerca pubblica in aggiornamento: nessun elenco nominativo recuperato, anche cercando Roma; nessuna esportazione individuata. Non significa assenza di medici.'}};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloMediciData=data;
})(typeof window==='undefined'?globalThis:window);
