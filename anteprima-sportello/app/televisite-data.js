(function(root){
  'use strict';
  const checkedAt='2026-10-27';
  const records=[
    {id:'idoctors',name:'iDoctors',url:'https://www.idoctors.it/videoconsulti',
      description:'Cerca uno specialista, consulta curriculum, prezzi, appuntamenti e recensioni; scegli il videoconsulto se offerto.',
      costs:'Prenotazione gratuita per il paziente; prestazione privata a pagamento. Per il videoconsulto la pagina prevede pagamento online: non estendere le condizioni delle visite in studio alla videochiamata.',
      connection:'Dopo la prenotazione ricevi un link via email. Servono connessione stabile, telecamera e microfono; la pagina indica che non occorre scaricare software.',
      documents:'Limite esplicito iDoctors: il videoconsulto non sostituisce la visita in presenza, non rilascia referti e non è utilizzabile per prescrivere farmaci a distanza.',
      reviews:'Recensioni disponibili: le FAQ le riferiscono a utenti che hanno prenotato tramite iDoctors ed effettuato la prestazione.',
      sources:[{label:'iDoctors: videoconsulti e limiti',url:'https://www.idoctors.it/videoconsulti'},{label:'iDoctors: FAQ, prenotazioni e recensioni',url:'https://www.idoctors.it/faq'}]},
    {id:'doctolib',name:'Doctolib',url:'https://www.doctolib.it/salute/prenota-videoconsulto/',
      description:'Cerca il professionista e controlla prestazione, tariffa e appuntamenti. La modalità Video compare quando il medico l’ha attivata.',
      costs:'L’uso della piattaforma è gratuito per il paziente; la visita privata si paga. La guida al videoconsulto descrive carta di credito e preautorizzazione: verifica importo, eventuali supplementi da approvare e condizioni prima di confermare.',
      connection:'Accedi da Appuntamenti nell’app o sul sito, oppure dal link ricevuto. I documenti eventualmente condivisi dal professionista sono nella sezione Documenti.',
      documents:'La pagina descrive possibili rinnovi di prescrizioni e condivisione di documenti. Dipendono dalla valutazione del professionista e dal caso: non sono garantiti per ogni videoconsulto.',
      reviews:'Quando presenti, valutazioni e recensioni sul profilo possono provenire da Google. Controllane origine e data; non sono necessariamente recensioni di visite prenotate tramite Doctolib.',
      sources:[{label:'Doctolib: come funziona il videoconsulto',url:'https://www.doctolib.it/salute/prenota-videoconsulto/'},{label:'Doctolib: pagamento del videoconsulto',url:'https://doctolibpatient.zendesk.com/hc/it/articles/360013301840-Tutto-quello-che-c-%C3%A8-da-sapere-sul-pagamento-online-di-un-videoconsulto'},{label:'Doctolib: uso gratuito per i pazienti',url:'https://doctolibpatient.zendesk.com/hc/it/articles/14142045541788-Is-the-use-of-Doctolib-free-of-charge'},{label:'Doctolib: origine delle recensioni',url:'https://doctolib.zendesk.com/hc/it/articles/36502453558420-Comprendere-le-recensioni-sul-mio-Profilo-Doctolib'}]},
    {id:'miodottore',name:'MioDottore',url:'https://www.miodottore.it/',
      description:'Cerca medici, terapisti o cliniche sul sito o nell’app, indicando città o zona. Puoi prenotare per te o per un’altra persona e scegliere In studio oppure Online, se offerto. Prezzi e appuntamenti vanno verificati nel profilo.',
      costs:'La prenotazione non comporta costi aggiuntivi secondo il sito; la prestazione privata è a pagamento. Il supporto indica che, per le consulenze online con pagamento abilitato, il pagamento avviene durante la prenotazione entro 30 minuti, oppure secondo le istruzioni del medico. Cancellazioni e rimborsi dipendono dalle condizioni dello specialista.',
      connection:'Il supporto descrive videoconsulenze dal browser di computer o dispositivo mobile senza software aggiuntivi. Le FAQ precisano che lo specialista può utilizzare canali diversi: controlla sempre profilo e conferma via email o SMS. Le caratteristiche di accessibilità dichiarate nei filtri non garantiscono l’idoneità individuale: verifica con lo studio accessi e necessità concrete.',
      verificationNote:'Riscontro del supporto MioDottore del 13 novembre 2026, dichiarato gestito da un assistente di intelligenza artificiale. Non rappresenta una conferma definitiva da parte di un responsabile, una verifica indipendente dei singoli professionisti o una garanzia di disponibilità.',
      contactEmail:'contatto@miodottore.it',
      documents:'Nelle FAQ consultate non è stata verificata una garanzia generale di referti o prescrizioni per ogni consulenza online. Chiedi allo specialista cosa prevede esattamente la prestazione.',
      reviews:'Il sito permette di consultare recensioni di altri pazienti. Confrontale con curriculum ed esperienza professionale, senza considerarle una certificazione clinica.',
      sources:[{label:'MioDottore: ricerca e prenotazione',url:'https://www.miodottore.it/'},{label:'MioDottore: FAQ sulla consulenza online',url:'https://www.miodottore.it/faq/consulenza-online'}]}
  ];
  const data={checkedAt,records};
  if(typeof module==='object'&&module.exports)module.exports=data;else root.SportelloTelevisiteData=data;
})(typeof window==='undefined'?globalThis:window);
