(function(root){
 'use strict';
 const checkedAt='2026-10-27',official='https://www.ordinefarmacistiroma.it/cittadino';
 const turns='https://www.ordinefarmacistiroma.it/farmacie-di-turno-oggi';
 const h24='https://ordine.dstage.it/upload/media/FarmacieH24Roma.pdf';
 const law='https://www.salute.gov.it/new/it/tema/farmacie/autorizzazione-alla-vendita-line/';
 const source=(url,label)=>({url,label,checkedAt});
 const listSource=source(h24,'Ordine: elenco H24 aggiornato al 02/10/2026, collegato dalla pagina Cittadino');
 const records=[
  {id:'farmacia-7camini',name:'Farmacia 7 Camini',address:'Via Casal Bianco 147, Roma',phone:'064190190',reference:'Settecamini · Municipio IV indicato dall’Ordine',modes:['notturne','festive','consegna'],opening:'H24 dichiarata dal sito e presente nell’elenco H24 dell’Ordine. Accesso notturno e variazioni da confermare.',delivery:'Consegna dichiarata sul sito ufficiale indicizzato; contatto tramite il numero della farmacia. Zone, tempi, prodotti ammessi e costi da concordare.',deliveryKind:'Consegna locale da concordare',sources:[source('https://www.farmacia7camini.it/','Farmacia 7 Camini: sito ufficiale (lettura diretta bloccata, contenuto indicizzato)'),listSource]},
  {id:'farmacia-robinie',name:'Farmacia delle Robinie',address:'Via delle Robinie 81, Roma',phone:'062313527',reference:'Sede in via delle Robinie; quartiere non attribuito dal solo CAP',modes:['notturne','festive','consegna'],opening:'H24, sette giorni su sette, dichiarata dal sito ufficiale. Non è una verifica del turno odierno.',delivery:'Il sito documenta spedizioni tramite corriere, normalmente 2–4 giorni lavorativi. Non è confermata una consegna locale rapida; controllare prodotti, spese e condizioni.',deliveryKind:'Spedizione tramite corriere, non consegna urgente',sources:[source('https://farmaciadellerobinie.it/','Robinie: contatti e apertura dichiarata'),source('https://farmaciadellerobinie.it/spedizioni/','Robinie: condizioni di spedizione')]},
  {id:'farmacia-torraccio',name:'Farmacia comunale Torraccio di Torrenova',address:'Via del Torraccio di Torrenova 93, Roma',phone:'0657088710',reference:'Municipio VI indicato dall’Ordine',modes:['notturne','festive'],opening:'H24 nella pagina Farmacap e nell’elenco dell’Ordine. Verificare modalità notturne prima di recarsi in sede.',delivery:'Non riconfermata nella pagina attuale: un elenco Farmacap storico non prova un servizio operativo oggi.',note:'Recapito principale della farmacia: 06 57088710, pubblicato nella pagina ufficiale Farmacap. Altri elenchi riportano un numero diverso: la discordanza è conservata nel rapporto e il recapito alternativo non è confermato come attivo. Non usare il numero dello sportello sociale come telefono della farmacia.',sources:[source('https://www.farmacap.info/farmacap-farmacia-comunale-torraccio-di-torrenova/','Farmacap: farmacia, orari e recapito attuale'),listSource]},
  {id:'farmacia-romaest',name:'Farmacia Roma Est',address:'Via di Torrenova 212, Roma',phone:'062014167',reference:'Sede in via di Torrenova; copertura delle consegne non censita per quartiere',modes:['festive','consegna'],opening:'Lun–sab 08:00–20:00; domenica 09:00–13:00 dichiarati dal sito. Altri festivi da confermare: apertura domenicale non equivale a turno festivo.',delivery:'Consegna dichiarata: contatto telefonico con la farmacia o canale Pharmap indicato dal sito. Copertura, tempi effettivi, costi e prodotti da verificare direttamente.',deliveryKind:'Consegna locale da concordare',sources:[source('https://www.farmaciaromaest.com/contatti/','Roma Est: indirizzo, telefono e orari'),source('https://www.farmaciaromaest.com/servizi/','Roma Est: modalità della consegna')]},
  // The pharmacy already exists in the delivery catalog: only additional service facts here.
  {id:'consegne-castelforte',deliveryRef:true,modes:['consegna'],opening:'Lun–sab 08:30–13:00 e 16:00–19:30; domenica chiusa secondo il sito indicizzato. Eventuali turni da controllare presso l’Ordine.',delivery:'Consegna dichiarata dal sito ufficiale. Raggio, costi, tempi e prodotti ammessi non confermati; contattare il farmacista.',deliveryKind:'Consegna da concordare',sources:[source('https://www.farmaciacastelforte.it/','Castelforte: sito ufficiale indicizzato; lettura diretta in timeout')]},
  {id:'farmacia-pharmaserenissima',name:'Pharmaserenissima',address:'Via Prenestina 365/B, Roma',phone:'062593878',reference:'Municipio V documentato dall’Ordine; quartiere specifico non attribuito',modes:['notturne','festive'],opening:'Presente nell’elenco H24 dell’Ordine, aggiornato al 02/10/2026. Accesso notturno e variazioni da confermare.',delivery:'Non documentata nelle fonti consultate.',sources:[listSource]}
 ];
 const pending=[
  {name:'Farmacia Aldo Bozzi, area Tiburtina',reason:'Il sito pubblica turni del 2025, non utilizzabili come calendario 2026.',url:'https://www.farmaciaaldobozzi.com/'},
  {name:'Farmacia comunale Tor Bella Monaca',reason:'La pagina Farmacap indica domenica chiusa; nessun turno festivo attuale acquisito.',url:'https://www.farmacap.info/farmacap-farmacia-comunale-tor-bella-monaca/'},
  {name:'Farmacia Torpignattara e Angelini via Tiburtina',reason:'Indicazioni trovate in repertori secondari; sito del titolare non consultabile o fonte primaria non verificata. Nessuna apertura festiva integrata come certa.',url:official}
 ];
 const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function resolve(record,deliveries){
  if(!record.deliveryRef)return {...record};
  const base=deliveries.records.find(r=>r.id===record.id);if(!base)throw Error('Farmacia condivisa non trovata: '+record.id);
  return {...record,name:'Farmacia Castelforte',address:base.address,phone:base.phones[0].number,reference:base.coverage,original:base};
 }
 function choose(deliveries,filters={}){
  return records.map(r=>resolve(r,deliveries)).filter(r=>(!filters.mode||filters.mode==='tutte'||r.modes.includes(filters.mode))&&fold([r.name,r.address,r.reference].join(' ')).includes(fold(filters.name)));
 }
 const mapUrl=address=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);
 const data={checkedAt,official,turns,h24,law,records,pending,resolve,choose,mapUrl,dutyVerifiedDate:null};
 if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloFarmacieData=data;
})(typeof window==='undefined'?globalThis:window);
