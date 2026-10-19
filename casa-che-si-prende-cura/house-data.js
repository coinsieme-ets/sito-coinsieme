window.CASA_PREVIEW_DATA = {
  assets: {
    // Il percorso resta centralizzato per rendere sostituibile la pianta senza toccare il markup.
    housePlan: 'assets/casa-plan.webp',
    housePlanAlt: 'Illustrazione isometrica di una casa arredata con soggiorno, cucina, bagno, camera da letto, corridoio, ingresso e una saletta',
    solutionImageNote: 'Illustrazione generata: non raffigura un prodotto verificato da COINSIEME.',
    cardImages: {
      'Videocitofono con monitor o app': { src: 'assets/ausili/videocitofono.webp', alt: 'Videocitofono con schermo che mostra una persona alla porta', width: 370, height: 214 },
      'Telecomando semplificato': { src: 'assets/ausili/telecomando-semplificato.webp', alt: 'Telecomando con pulsanti grandi utilizzato in soggiorno', width: 370, height: 239 },
      'Poltrona con alzata assistita': { src: 'assets/ausili/poltrona-alzata-assistita.webp', alt: 'Poltrona elettrica con meccanismo di alzata in soggiorno', width: 370, height: 239 },
      'Pinza prensile': { src: 'assets/ausili/pinza-prensile.webp', alt: 'Pinza prensile che raccoglie un oggetto leggero dal pavimento', width: 370, height: 239 },
      'Induzione e spegnimento automatico': { src: 'assets/ausili/piano-induzione.webp', alt: 'Piano a induzione in una cucina domestica', width: 370, height: 239 },
      'Sedia o sgabello da doccia': { src: 'assets/ausili/seduta-doccia.webp', alt: 'Seduta per doccia con braccioli e gambe antiscivolo', width: 370, height: 238 },
      'Maniglioni correttamente fissati': { src: 'assets/ausili/maniglioni-sostegno.webp', alt: 'Maniglioni di sostegno vicino alla doccia', width: 370, height: 238 },
      'Luci accessibili e automatizzate': { src: 'assets/ausili/illuminazione-notturna.webp', alt: 'Illuminazione notturna lungo un corridoio domestico', width: 370, height: 214 },
      'Oggetti a portata di mano': { src: 'assets/ausili/comodino-organizzato.webp', alt: 'Comodino con telefono e oggetti ordinati a portata di mano', width: 370, height: 238 },
      'Letto regolabile elettricamente': { src: 'assets/ausili/letto-regolabile.webp', alt: 'Letto domestico con schienale e gambe regolabili', width: 370, height: 238 },
      'Tapparelle e tende motorizzate': { src: 'assets/ausili/tapparelle-motorizzate.webp', alt: 'Tapparella motorizzata con comando a parete', width: 370, height: 214 },
      'Chiamata di aiuto e telesoccorso': { src: 'assets/ausili/chiamata-aiuto.webp', alt: 'Pulsante di richiesta aiuto con cordino', width: 370, height: 214 }
    }
  },
  solutions: {
    videocitofono: {
      title: 'Videocitofono con monitor o app',
      benefit: 'Aiuta a riconoscere chi suona e a comunicare prima di aprire.',
      how: 'Una telecamera e un citofono collegano il punto esterno a un monitor interno o, negli impianti compatibili, a un’app.',
      advantages: 'Permette di vedere e parlare con chi suona prima di decidere se aprire.',
      limits: 'L’app può dipendere dalla connessione e non deve essere l’unico modo per aprire o comunicare.',
      requirements: 'Verificare impianto, privacy, semplicità dei comandi, connessione e funzionamento anche senza rete.',
      room: '#ingresso',
      image: '../assets/hero_domotica.jpg',
      alt: 'Serratura elettronica controllata da smartphone accanto alla porta'
    },
    telecomando: {
      title: 'Telecomando semplificato',
      benefit: 'Raccoglie le funzioni più usate in pochi pulsanti grandi e leggibili.',
      how: 'Memorizza i comandi essenziali di televisore e dispositivi compatibili in un’interfaccia ridotta.',
      advantages: 'Riduce il numero di tasti e rende più immediato trovare le funzioni usate ogni giorno.',
      limits: 'Non tutti i dispositivi accettano gli stessi codici e alcune funzioni avanzate possono mancare.',
      requirements: 'Verificare compatibilità, leggibilità e uso autonomo con la persona.',
      room: '#soggiorno',
      image: 'assets/telecomando_demo.webp',
      alt: 'Mano che utilizza un telecomando semplificato con pochi pulsanti grandi davanti a un televisore',
      imageNote: 'Illustrazione dimostrativa, non fotografia di un prodotto verificato'
    },
    poltrona: {
      title: 'Poltrona con alzata assistita',
      benefit: 'Può agevolare il passaggio dalla posizione seduta a quella eretta.',
      how: 'Un meccanismo elettrico inclina seduta e schienale accompagnando parte del movimento.',
      advantages: 'Può ridurre lo sforzo necessario per sedersi e alzarsi.',
      limits: 'Non sostituisce una valutazione dei trasferimenti e può essere inadatta in alcune condizioni.',
      requirements: 'Valutare trasferimenti, misure, stabilità, spazio disponibile e reale utilità.',
      room: '#soggiorno'
    },
    utensili: {
      title: 'Utensili con presa facilitata',
      benefit: 'Impugnature ergonomiche e basi antiscivolo possono ridurre lo sforzo.',
      how: 'Impugnature maggiorate, leve e superfici antiscivolo modificano il modo in cui l’oggetto viene afferrato e usato.',
      advantages: 'Possono rendere più semplici apertura, taglio e preparazione senza cambiare l’intera cucina.',
      limits: 'Un ausilio utile per una presa può risultare scomodo per un’altra.',
      requirements: 'Ogni ausilio va provato: forma della presa, peso e abitudini contano più del catalogo.',
      room: '#cucina'
    },
    induzione: {
      title: 'Induzione e spegnimento automatico',
      benefit: 'Può ridurre alcuni rischi rispetto alla fiamma libera.',
      how: 'Il piano riscalda pentole compatibili e alcuni modelli interrompono il funzionamento quando non le rilevano.',
      advantages: 'Evita la fiamma libera e può offrire timer e spegnimento automatico.',
      limits: 'La superficie e le pentole restano calde; i comandi a sfioramento non sono adatti a tutti.',
      requirements: 'Verificare pentole, potenza elettrica, leggibilità dei comandi e installazione qualificata.',
      room: '#cucina'
    },
    'seduta-doccia': {
      title: 'Sedia o sgabello da doccia',
      benefit: 'Una seduta stabile può ridurre la fatica e il rischio di caduta.',
      how: 'Una seduta impermeabile consente di svolgere parte dell’igiene personale restando seduti.',
      advantages: 'Può ridurre la fatica e offrire maggiore stabilità durante la doccia.',
      limits: 'Un modello leggero o della misura sbagliata può muoversi o ostacolare il trasferimento.',
      requirements: 'Controllare altezza, spazio, portata, puntali antiscivolo e modalità di trasferimento.',
      room: '#bagno'
    },
    maniglioni: {
      title: 'Maniglioni correttamente fissati',
      benefit: 'Offrono un appoggio stabile nei movimenti e nei trasferimenti.',
      how: 'Una barra fissata alla struttura della parete offre un punto di presa durante movimenti concordati.',
      advantages: 'Può aumentare stabilità e sicurezza senza occupare molto spazio.',
      limits: 'Un maniglione collocato male o fissato solo al rivestimento può diventare pericoloso.',
      requirements: 'Posizione e ancoraggio devono essere verificati sulla parete e sui movimenti reali.',
      room: '#bagno'
    },
    luci: {
      title: 'Luci accessibili e automatizzate',
      benefit: 'Rendono più leggibili i percorsi, soprattutto negli spostamenti notturni.',
      how: 'Sensori di presenza o comandi accessibili attivano luci basse lungo i percorsi usati più spesso.',
      advantages: 'Riduce la necessità di cercare interruttori al buio e rende più visibili gli ostacoli.',
      limits: 'Sensori mal posizionati possono accendersi troppo tardi o generare attivazioni indesiderate.',
      requirements: 'Prevedere sempre un comando manuale e posizionare i sensori sui percorsi reali.',
      room: '#tutta-la-casa',
      image: '../assets/domotica_sicurezza_notturna.jpg',
      alt: 'Percorso notturno illuminato a pavimento per rendere più sicuri gli spostamenti in casa'
    },
    oggetti: {
      title: 'Oggetti a portata di mano',
      benefit: 'Un comodino organizzato rende raggiungibili telefono, acqua e telecomandi.',
      how: 'Ripiani, supporti e organizzatori mantengono gli oggetti importanti in posizioni stabili e riconoscibili.',
      advantages: 'Riduce allungamenti, ricerche e spostamenti non necessari, soprattutto durante la notte.',
      limits: 'Troppi oggetti o cavi possono creare confusione e ostacoli.',
      requirements: 'Gli oggetti non devono ostacolare il trasferimento o creare nuovi rischi.',
      room: '#camera'
    },
    letto: {
      title: 'Letto regolabile elettricamente',
      benefit: 'Le regolazioni possono agevolare il riposo e alcune attività di assistenza.',
      how: 'Motori elettrici regolano altezza o inclinazione tramite un comando raggiungibile.',
      advantages: 'Può adattare la posizione al riposo e facilitare alcune attività quotidiane.',
      limits: 'Non ogni regolazione è indicata per ogni persona e il letto richiede spazio e manutenzione.',
      requirements: 'Verificare spazio, comandi, sicurezza elettrica e indicazioni professionali.',
      room: '#camera'
    },
    tapparelle: {
      title: 'Tapparelle e tende motorizzate',
      benefit: 'Consentono apertura e chiusura con meno sforzo e da più punti della casa.',
      how: 'Un motore aziona tapparelle o tende tramite pulsante, telecomando o automazione.',
      advantages: 'Riduce lo sforzo manuale e consente di gestire luce e privacy da una posizione comoda.',
      limits: 'Il motore deve poter essere gestito in caso di guasto o interruzione elettrica.',
      requirements: 'Verificare compatibilità meccanica, protezioni e uso anche in assenza di internet.',
      room: '#tutta-la-casa',
      image: '../assets/domotica_hero_autonomia.jpg',
      alt: 'Pannello domotico accessibile nel soggiorno'
    },
    telesoccorso: {
      title: 'Chiamata di aiuto e telesoccorso',
      benefit: 'Un comando accessibile può mettere in contatto con persone o servizi concordati.',
      how: 'Un pulsante, un dispositivo indossabile o un sensore invia una richiesta a contatti o centrali definite.',
      advantages: 'Rende più immediata la richiesta di aiuto quando il telefono non è raggiungibile.',
      limits: 'Non tutti i sistemi sono servizi di emergenza e nessun dispositivo garantisce da solo l’intervento.',
      requirements: 'Chiarire chi risponde, tempi, copertura, batterie, costi e continuità del servizio.',
      room: '#tutta-la-casa'
    }
  },
  paths: {
    fatica: { label: 'Fare meno fatica', terms: ['Luci accessibili', 'Tapparelle', 'Voce e pulsanti', 'Utensili', 'Apribarattoli', 'Ausili per vestirsi'] },
    movimento: { label: 'Muoversi meglio dentro casa', terms: ['Prevenzione delle cadute', 'Deambulatore', 'Maniglioni e soglie', 'Rimozione di ostacoli', 'Porte scorrevoli', 'Corrimano', 'Doccia accessibile'] },
    raggiungere: { label: 'Raggiungere meglio gli oggetti', terms: ['Pinza prensile', 'Piani di lavoro', 'Utensili', 'Oggetti a portata', 'Ausili per vestirsi'] },
    bagno: { label: 'Rendere il bagno più comodo e sicuro', terms: ['Maniglioni correttamente', 'Doccia accessibile', 'Sollevatore', 'Sedia o sgabello', 'Doccetta', 'Rialzo WC'] },
    tranquillita: { label: 'Sentirsi più tranquilli a casa', terms: ['Chiamata di aiuto', 'Rilevatori', 'Prevenzione delle cadute', 'Videocitofono', 'Videocomunicazione'] },
    condivisione: { label: 'Usare la casa insieme ad altre persone', terms: ['Voce e pulsanti', 'Videocomunicazione', 'Piani di lavoro', 'Vassoio e stoviglie', 'Telecomando'] }
  }
};
