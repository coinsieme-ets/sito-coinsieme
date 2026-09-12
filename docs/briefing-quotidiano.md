# Briefing quotidiano: batch massimo 5

Il workflow giornaliero raccoglie nuovamente i feed Vita, Forum Terzo Settore e Superando. Il crawler orario conserva solamente un artifact e non possiede credenziali Airtable.

La selezione esclude URL già in Notizie o Segnalazioni Maurizio, titoli simili, duplicati nella raccolta, dati incompleti, fonti più vecchie di sette giorni o future, eventi locali e temi marginali. La graduatoria pesa disabilità/autonomia, accessibilità e ausili, Terzo Settore, inclusione lavorativa, welfare, con un incremento per norme e misure operative. Non importa l'arretrato di Airtable e non forza cinque elementi se non ci sono abbastanza candidati idonei.

Solo i migliori cinque vengono creati in Notizie come da_valutare. L'ID editoriale rssbrief-YYYY-MM-DD-hash identifica la provenienza automatica e il giorno italiano del batch senza nuovi campi. Un secondo tentativo riusa quel gruppo, senza altri inserimenti. Nessuna scrittura riguarda Segnalazioni Maurizio; i suoi URL vengono letti esclusivamente per escluderli.

La mail rilegge individualmente i record appena creati, verifica ID, giorno di creazione, stato, assenza duplicati e corrispondenza di titolo/URL. L'HTML reca gli stessi ID. Un limite indipendente nel renderer blocca più di cinque elementi. Nessun ripiego sul crawler grezzo o sui vecchi record. Un batch vuoto non invia email.

Non ci sono invii al push. I due cron UTC sono filtrati sull'ora italiana. Il workflow è serializzato; registro giornaliero e chiave di idempotenza Resend proteggono dai reinvii. La modalità manuale predefinita preview crea un batch reale e genera HTML, ma non riceve la credenziale Resend. Gli esiti e l'anteprima restano negli artifact del run, non nel sito pubblico.

Incidente del 12 settembre 2026: il mittente interrogava tutti gli stati in attesa, senza data né limite. Il crawler inseriva a ogni ora; params.set ripetuto per fields[] lasciava solo stato e rendeva inefficace la verifica di URL/titolo. Corretto con append e sostituito l'ingresso automatico illimitato con il batch giornaliero. I vecchi duplicati non vengono cancellati automaticamente.
