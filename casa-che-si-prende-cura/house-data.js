window.CASA_PREVIEW_DATA = {
  assets: {
    // Il percorso resta centralizzato per rendere sostituibile la pianta senza toccare il markup.
    housePlan: 'assets/casa-plan.webp',
    housePlanAlt: 'Illustrazione isometrica di una casa arredata con soggiorno, cucina, bagno, camera da letto, corridoio, ingresso e una saletta',
    solutionImageNote: 'Illustrazione generata: non raffigura un prodotto verificato da COINSIEME.',
    cardImages: {
      'Vedere chi arriva e aprire senza spostarsi': { src: 'assets/ausili/videocitofono.webp', alt: 'Videocitofono con schermo che mostra una persona alla porta', width: 370, height: 214 },
      'Telecomando semplificato': { src: 'assets/ausili/telecomando-semplificato.webp', alt: 'Telecomando con pulsanti grandi utilizzato in soggiorno', width: 370, height: 239 },
      'Poltrona con alzata assistita': { src: 'assets/ausili/poltrona-alzata-assistita.webp', alt: 'Poltrona elettrica con meccanismo di alzata in soggiorno', width: 370, height: 239 },
      'Pinza prensile': { src: 'assets/ausili/pinza-prensile.webp', alt: 'Pinza prensile che raccoglie un oggetto leggero dal pavimento', width: 370, height: 239 },
      'Induzione e spegnimento automatico': { src: 'assets/ausili/piano-induzione.webp', alt: 'Piano a induzione in una cucina domestica', width: 370, height: 239 },
      'Sedia o sgabello da doccia': { src: 'assets/ausili/seduta-doccia.webp', alt: 'Seduta per doccia con braccioli e gambe antiscivolo', width: 370, height: 238 },
      'Maniglioni correttamente fissati': { src: 'assets/ausili/maniglioni-sostegno.webp', alt: 'Maniglioni di sostegno vicino alla doccia', width: 370, height: 238 },
      'Luci accessibili e automatizzate': { src: 'assets/ausili/illuminazione-notturna.webp', alt: 'Illuminazione notturna lungo un corridoio domestico', width: 370, height: 214 },
      'Oggetti a portata di mano': { src: 'assets/ausili/comodino-organizzato.webp', alt: 'Comodino con telefono e oggetti ordinati a portata di mano', width: 370, height: 238 },
      'Letto regolabile elettricamente': { src: 'assets/ausili/letto-regolabile.webp', alt: 'Letto domestico con schienale e gambe regolabili', width: 370, height: 238 },
      'Tapparelle elettriche e tende motorizzate': { src: 'assets/ausili/tapparelle-motorizzate.webp', alt: 'Tapparella motorizzata con comando a parete', width: 370, height: 214 },
      'Chiamata di aiuto e telesoccorso': { src: 'assets/ausili/chiamata-aiuto.webp', alt: 'Pulsante di richiesta aiuto con cordino', width: 370, height: 214 }
    }
  },
  solutions: {
    videocitofono: {
      title: 'Ingresso e accessi',
      imageTitle: 'Vedere chi arriva e aprire senza spostarsi',
      benefit: 'Vedere chi arriva, rispondere dal divano o dal letto e rientrare senza cercare le chiavi: soluzioni diverse possono rendere l’accesso più semplice per chiunque.',
      how: 'Un videocitofono compatibile può portare sullo smartphone la chiamata, la voce e, se l’impianto dispone di video, le immagini di chi suona. Il comando può sbloccare il portone condominiale compatibile: la porta dell’appartamento è un accesso distinto. Una serratura intelligente può sbloccare la porta di casa; per muovere fisicamente il battente può servire una motorizzazione separata.',
      advantages: 'Puoi riconoscere chi suona e aprire a un familiare o assistente autorizzato senza alzarti. Una serratura predisposta può aiutare quando rientri con le borse della spesa o hai dimenticato le chiavi in casa, evitando gesti difficili per chi ha poca forza nelle mani o mobilità ridotta. Codice e impronta possono consentire l’ingresso anche senza telefono, se il dispositivo e gli accessori li prevedono.',
      limits: 'Telefono, codice e impronta non sono funzioni universali. Il comando nelle vicinanze e quello via Internet dipendono dal sistema e dagli eventuali accessori. Senza rete possono non funzionare i comandi remoti. Sbloccare la serratura non significa aprire fisicamente la porta.',
      requirements: 'Verificare compatibilità di citofono, porta e serratura, condizioni condominiali, raggiungibilità dei comandi e semplicità d’uso. Proteggere account e credenziali, valutare privacy e aggiornamenti, controllare batterie e alimentazione e predisporre una modalità alternativa di accesso concretamente utilizzabile.',
      article: '../articoli/aprire-senza-chiavi-rispondere-al-citofono-da-lontano/',
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
      title: 'Tapparelle elettriche e tende motorizzate',
      benefit: 'Consentono apertura e chiusura con meno sforzo e da più punti della casa.',
      how: 'Un motore aziona tapparelle o tende tramite pulsante, telecomando o automazione.',
      advantages: 'Riduce lo sforzo manuale e consente di gestire luce e privacy da una posizione comoda.',
      limits: 'Il motore deve poter essere gestito in caso di guasto o interruzione elettrica.',
      requirements: 'Verificare compatibilità meccanica, protezioni e uso anche in assenza di internet.',
      room: '#tutta-la-casa',
      image: '../assets/domotica_hero_autonomia.jpg',
      alt: 'Pannello domotico accessibile nel soggiorno'
    },
    robot: {
      title: 'Robot per la pulizia dei pavimenti',
      benefit: 'Ridurre la fatica nelle pulizie quotidiane, senza chinarsi o spingere continuamente un apparecchio.',
      how: 'Un robot aspirapolvere o lavapavimenti percorre le zone compatibili con il suo sistema. La prova qui sotto mostra un percorso illustrativo predisposto, non la mappatura o le prestazioni di un modello commerciale.',
      advantages: 'Può aiutare nella manutenzione quotidiana dei pavimenti e lasciare alla persona altre attività.',
      limits: 'Non riordina oggetti e cavi, non pulisce tutte le superfici e può incontrare difficoltà con soglie, tappeti o ostacoli. Non sostituisce l’assistenza personale.',
      requirements: 'Verificare accessibilità dei comandi, spazio per la base, manutenzione e manuale del modello. Non lasciare che robot, cavi o base creino ostacoli al passaggio. La simulazione non controlla dispositivi reali.',
      room: '#prova-robot',
      image: 'assets/robot-schema.svg',
      alt: 'Schema di un robot per la pulizia con spazzola laterale',
      imageNote: 'Simbolo illustrativo, non fotografia di un modello commerciale.'
    },
    voce: {
      title: 'Voce e contatto',
      benefit: 'Comandare una luce senza usare le mani o parlare con un familiare dal divano: funzioni diverse, da scegliere insieme alla persona.',
      how: 'Uno smart speaker come Echo con Alexa o un dispositivo Google compatibile riceve comandi vocali per gli apparecchi configurati. Drop In, sui dispositivi Echo predisposti, permette invece un contatto audio o video con persone autorizzate, anche senza premere rispondi.',
      advantages: 'La voce può sostituire tocchi e digitazione quando hai le mani occupate o muoverti è difficile. Un contatto familiare concordato può rendere più semplice parlare senza prendere il telefono.',
      limits: 'Non tutte le funzioni sono presenti su tutti i modelli. Drop In non è una funzione universale degli assistenti e non richiede di per sé IA generativa. Alexa+ può rendere il dialogo più naturale, ma può fraintendere e non è un servizio di emergenza.',
      requirements: 'Provare compatibilità e comprensione della voce, proteggere account e autorizzazioni, concordare i contatti e mantenere un comando fisico accessibile. Le spiegazioni e le fonti sono nelle schede qui sotto.',
      room: '#comandi-vocali',
      secondaryLink: '#videocomunicazione',
      secondaryLabel: 'Scopri videocomunicazione e Drop In',
      image: 'assets/voce-schema.svg',
      alt: 'Schema di uno smart speaker: microfono, altoparlante e collegamento per comunicare',
      imageNote: 'Simbolo illustrativo, non fotografia di un modello commerciale.'
    },
    videocamera: {
      title: 'Videocamere e visione dell’ambiente',
      benefit: 'Vedere una zona della casa da un’app può facilitare un contatto concordato con chi vi abita, rispettandone la riservatezza.',
      how: 'Una videocamera compatibile può mostrare immagini in diretta alle persone autorizzate tramite un’app. Alcuni smart display prevedono una funzione dedicata: Amazon distingue Live View dalla conversazione Drop In. L’audio e la registrazione dipendono dal modello e dalle impostazioni.',
      advantages: 'Puoi vedere l’ambiente inquadrato quando la persona è d’accordo. Per parlare con lei occorre verificare la comunicazione audio bidirezionale: non ogni videocamera la offre.',
      limits: 'La visione è limitata all’inquadratura; rete, alimentazione o servizio possono interrompersi. La videocamera non garantisce di rilevare cadute o malori e non assicura soccorso. Non è uno strumento da usare per sorvegliare di nascosto.',
      requirements: 'Concordare finalità e accessi con la persona, considerare conviventi e visitatori, evitare ambienti intimi. Proteggere account, limitare utenti autorizzati e verificare come spegnere la ripresa. Valutare separatamente registrazioni, conservazione e condizioni del servizio.',
      room: '#videocamere',
      image: 'assets/videocamera-schema.svg',
      alt: 'Schema di una videocamera con obiettivo orientato verso una zona della casa',
      imageNote: 'Simbolo illustrativo, non fotografia di un modello commerciale.'
    },
    telesoccorso: {
      title: 'Chiamata di aiuto e telesoccorso',
      benefit: 'Un comando accessibile può mettere in contatto con persone o servizi concordati.',
      how: 'Un pulsante, un dispositivo indossabile o un sensore predisposto invia una richiesta a contatti o centrali definite. Alcuni impianti antifurto, come quelli descritti da Verisure, prevedono un SOS e un canale vivavoce con la centrale: richiesta, conversazione e attivazione degli aiuti sono passaggi distinti.',
      advantages: 'Rende più immediata la richiesta di aiuto quando il telefono non è raggiungibile.',
      limits: 'Non tutti i sistemi sono servizi di emergenza e nessun dispositivo garantisce da solo l’intervento. Un microfono non dimostra che basti gridare per avviare un SOS; non presumere rilevamento automatico delle cadute o ascolto continuo.',
      requirements: 'Chiarire chi risponde, tempi, copertura, batterie, costi e continuità del servizio. Per Verisure verificare modello, dotazione indossabile, modalità di pressione e contratto; il dispositivo specifico da portare al collo non è qui confermato. COINSIEME non gestisce allarmi o soccorsi.',
      room: '#prova-aiuto'
    }
  },
  paths: {
    fatica: { label: 'Fare meno fatica', terms: ['Luci accessibili', 'Tapparelle', 'Comandi vocali', 'Robot per la pulizia', 'Utensili', 'Apribarattoli', 'Ausili per vestirsi', 'Vedere chi arriva', 'Serrature intelligenti', 'Motorizzazione della porta'] },
    movimento: { label: 'Muoversi meglio dentro casa', terms: ['Prevenzione delle cadute', 'Deambulatore', 'Maniglioni e soglie', 'Rimozione di ostacoli', 'Porte scorrevoli', 'Corrimano', 'Doccia accessibile', 'Motorizzazione della porta'] },
    raggiungere: { label: 'Raggiungere meglio gli oggetti', terms: ['Pinza prensile', 'Piani di lavoro', 'Utensili', 'Oggetti a portata', 'Ausili per vestirsi'] },
    bagno: { label: 'Rendere il bagno più comodo e sicuro', terms: ['Maniglioni correttamente', 'Doccia accessibile', 'Sollevatore', 'Sedia o sgabello', 'Doccetta', 'Rialzo WC', 'Vasca con sportello', 'WC con bidet'] },
    tranquillita: { label: 'Sentirsi più tranquilli a casa', terms: ['Chiamata di aiuto', 'Rilevatori', 'Prevenzione delle cadute', 'Vedere chi arriva', 'Serrature intelligenti', 'Videocomunicazione'] },
    condivisione: { label: 'Usare la casa insieme ad altre persone', terms: ['Comandi vocali', 'Videocomunicazione', 'Piani di lavoro', 'Vassoio e stoviglie', 'Telecomando'] }
  }
};
