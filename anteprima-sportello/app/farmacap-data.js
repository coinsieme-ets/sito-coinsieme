(function(root){
 'use strict';
 const checkedAt='2026-11-25',base='https://www.farmacap.info/';
 const source=(slug,label)=>({url:base+slug+'/',label,checkedAt});
 const continuous='Lun–ven 08:30–20:00; sabato 08:30–13:00; domenica chiusa, secondo la pagina della sede. Confermare variazioni e festività.';
 const split='Lun–ven 08:30–13:00 e 16:30–20:00; sabato 08:30–13:00; domenica chiusa, secondo la pagina della sede. Confermare variazioni e festività.';
 const rows=[
  ['borghesiana-iii','Borghesiana III','Via Petralia Sottana 55/57, 00132 Roma','0657088330',continuous],
  ['bruno-pelizzi','Bruno Pelizzi','Viale Rolando Vignali 66, 00173 Roma','0657088340',continuous],
  ['camocelli','Camocelli','Via Casilina 2023, 00132 Roma','0657088350',continuous],
  ['casilino-23-isola-liri','Casilino 23 – Isola Liri','Via Francesco Ferraironi 25, 00177 Roma','0657088360',continuous],
  ['cinecitta-est','Cinecittà Est','Viale Antonio Ciamarra 66, 00173 Roma','0657088410','Lun–sab 08:30–20:00; domenica chiusa secondo la pagina della sede. Confermare variazioni e festività.'],
  ['colli-aniene-gottifredi','Colli Aniene Gottifredi',"Via Edoardo d’Onofrio 70, 00155 Roma",'0657088420',continuous],
  ['colle-prenestino','Colle Prenestino','Via Prenestina 1206 A/B, 00132 Roma','0657088430','Lun–ven 08:00–20:00; sabato 08:00–13:00; domenica chiusa secondo la pagina della sede. Confermare variazioni e festività.'],
  ['delle-palme','Delle Palme','Via delle Palme 195/A, 00171 Roma','0657088460',continuous],
  ['feronia','Feronia','Via del Peperino 38, 00158 Roma','0657088500',split],
  ['forte-tiburtino','Forte Tiburtino','Via Diego Angeli 59–61, 00159 Roma','0657088520',split],
  ['gasperina','Gasperina','Via di Gasperina 232/234/236, 00173 Roma','0657088530',continuous],
  ['gregna-s-andrea','Gregna S. Andrea','Via San Giorgio Morgeto 169/173, 00173 Roma','067214826',split],
  ['messi-doro','Messi d’Oro','Via Egidio Galbani 69, 00156 Roma','0657088580',continuous],
  ['prato-fiorito','Prato Fiorito','Via Andria 78/80, 00132 Roma','0657088640',continuous],
  ['primavera','Primavera','Largo della Primavera 16 C, 00171 Roma','0657088650',split],
  ['santa-maura','Santa Maura','Via Pietro Marchisio 91/97, 00173 Roma','0657088660',split],
  ['tor-bella-monaca','Tor Bella Monaca','Via Giovanni Castano 23/25, 00133 Roma','0657088680',split],
  ['tor-sapienza-rucellai','Tor Sapienza – Rucellai','Viale Giorgio Morandi 163, 00155 Roma','0657088690',split],
  ['tor-tre-teste','Tor Tre Teste','Via Roberto Lepetit 207/209, 00155 Roma','0657088700',continuous],
  ['torraccio-di-torrenova','Torraccio di Torrenova','Via del Torraccio di Torrenova 93, 00133 Roma','0657088710','H24 dichiarata dalla pagina della sede; confermare modalità notturne e variazioni.']
 ];
 const steady=new Set(['bruno-pelizzi','camocelli','cinecitta-est']);
 const periodic=new Set(['delle-palme','primavera','santa-maura','tor-sapienza-rucellai','torraccio-di-torrenova']);
 const covid=new Set(['borghesiana-iii','camocelli','cinecitta-est','colli-aniene-gottifredi','delle-palme','gasperina','messi-doro','tor-sapienza-rucellai','tor-tre-teste']);
 const strep=new Set(['bruno-pelizzi','camocelli','cinecitta-est','colli-aniene-gottifredi','delle-palme','tor-sapienza-rucellai']);
 const vaccine=new Set(['bruno-pelizzi','camocelli','cinecitta-est','gasperina','tor-sapienza-rucellai']);
 const social=new Set(['bruno-pelizzi','forte-tiburtino','primavera','torraccio-di-torrenova']);
 const records=rows.map(([slug,title,address,phone,opening])=>{
  const services=[
   {id:'autoanalisi',label:'Autoanalisi capillare: glicemia, colesterolo e uricemia',availability:'Dichiarata dalla scheda della sede e dalla pagina di servizio FARMACAP; confermare modalità e costo.'},
   {id:'pressione',label:'Misurazione della pressione arteriosa',availability:'Dichiarata nella scheda della sede; non è un Holter pressorio.'},
   {id:'screening',label:'Screening del colon-retto',availability:'Indicato nella scheda della sede; verificare requisiti, programma e disponibilità attuali.'}
  ];
  const sources=[source('farmacap-farmacia-comunale-'+slug,'FARMACAP: scheda ufficiale della sede'),source('autoanalisi-del-sangue-capillare','FARMACAP: autoanalisi capillari')];
  if(steady.has(slug)||periodic.has(slug)){
   for(const [id,label] of [['ecg','Elettrocardiogramma (ECG)'],['holter-cardiaco','Holter cardiaco'],['holter-pressorio','Holter pressorio']]){
    services.push({id,label,availability:steady.has(slug)?'Sede elencata nella pagina del servizio. Contattare la farmacia per prenotazione, disponibilità e costo.':'Soltanto giornate periodiche indicate dalla pagina del servizio: calendario da confermare; non è disponibilità continuativa.'});
    sources.push(source(id==='ecg'?'elettrocardiogramma':id,'FARMACAP: '+label+' e sedi indicate'));
   }
  }
  if(covid.has(slug)){
   services.push({id:'tamponi',label:'Tampone Covid-19',availability:'Sede elencata nella pagina dedicata; verificare attivazione, prenotazione e costo.'});
   sources.push(source('tamponi-covid','FARMACAP: tamponi Covid e sedi indicate'));
  }
  if(strep.has(slug))services.push({id:'streptococco',label:'Test rapido per lo streptococco',availability:'Indicato nella scheda della sede; verificare modalità e disponibilità attuali.'});
  if(vaccine.has(slug))services.push({id:'vaccinazioni',label:'Vaccinazioni',availability:'Indicate nella scheda della sede; verificare tipologia, requisiti, campagna e disponibilità attuali.'});
  if(['camocelli','tor-sapienza-rucellai'].includes(slug))services.push({id:'deblistering',label:'Organizzazione dei medicinali (deblistering)',availability:'Servizio dichiarato dalla sede: condizioni e modalità da concordare con il farmacista.'});
  return {id:'farmacap-'+slug,slug,name:'Farmacia comunale '+title,address,phone,opening,reference:'Sede documentata da FARMACAP a Roma Est o sud-est; non indica la copertura di eventuali consegne.',modes:['comunali'],network:'FARMACAP',checkedAt,verification:'Fonti ufficiali pubbliche; non conferma diretta dell’operatore.',services,socialServices:social.has(slug)?'La pagina della sede indica telecompagnia, consulenza sociale, consulenza psicologica e FARMAReCUP. Modalità e disponibilità vanno chieste allo sportello sociale, distinto dalla farmacia.':null,socialNote:slug==='primavera'?'Il recapito dello sportello sociale è riportato con una formattazione incongruente nella fonte: per verificarlo usare il numero della farmacia, senza ricostruirlo.':null,delivery:'Consegna non verificata per questa sede. Non dedotta dall’appartenenza alla rete FARMACAP.',sources};
 });
 function integrate(existing){
  const result=existing.map(record=>{
   const match=records.find(r=>record.sources.some(s=>s.url===r.sources[0].url));
   if(!match)return record;
   return {...record,network:match.network,checkedAt:match.checkedAt,verification:match.verification,services:match.services,socialServices:match.socialServices,socialNote:match.socialNote,modes:[...new Set([...record.modes,...match.modes])],sources:[...record.sources.filter(s=>!match.sources.some(n=>n.url===s.url)),...match.sources]};
  });
  for(const record of records)if(!result.some(r=>r.sources.some(s=>s.url===record.sources[0].url)))result.push(record);
  return result;
 }
 const data={checkedAt,records,integrate};
 if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloFarmacapData=data;
})(typeof window==='undefined'?globalThis:window);
