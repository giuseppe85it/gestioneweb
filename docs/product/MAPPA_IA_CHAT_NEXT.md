# MAPPA IA CHAT NEXT — versione operativa

## Cosa voglio
Una chat dove scrivo una targa, un nome o una domanda, e vedo subito i dati precisi come se aprissi Mezzo 360 o Centro Controllo. Niente filtri, niente schermate da imparare.
Voglio anche poter chiedere alla chat di generare report (mensili, periodici, per mezzo, per autista) e salvarli per poterli ritrovare e riusare.

## Dove sono oggi
La chat funziona ma risponde a parole, non in modo strutturato. Per i mezzi ho aggiunto una scheda strutturata (4 sezioni: Identita, Scadenze, Lavori, Documenti) ma e ancora invisibile perche un altro pezzo del sistema intercetta i prompt prima.
L'infrastruttura per i report gia esiste in parte: artifact IA, anteprima documento, PDF generators madre. Manca il collegamento dalla chat.

## Cosa serve subito
1. Far apparire la scheda mezzo nella chat che uso davvero (la pagina IA Report).
2. Sistemare lo smistamento perche quando scrivo una targa vada alla scheda mezzo, non all'analisi testuale generica.

## Cosa serve dopo (in ordine)
1. Stessa scheda strutturata per gli autisti.
2. Vista manutenzioni in scadenza (sostituisce Centro Controllo).
3. Vista rifornimenti mensili.
4. Documenti allegati per mezzo nella scheda.
5. Report mensili generati dalla chat (rifornimenti del mese, manutenzioni in scadenza, riepilogo mezzo o autista) salvati come artifact riapribili.
6. Archivio report consultabile dalla chat: storico, riapertura, download PDF.

## Cosa NON faccio
- Non costruisco un nuovo modulo grafico unificato. Tutto passa dalla chat.
- Non porto Mezzo 360 e Autista 360 nella NEXT. Li sostituisce la chat.
- Non spengo niente sulla madre finche la chat non risponde almeno a 1 e 2 in modo affidabile.

## Decisioni prese
- Aprile 2026: confermato che la chat IA e la strada giusta, non un nuovo modulo unificato.
- Aprile 2026: il motore unificato non si cancella, ma viene limitato alle richieste trasversali.
- Aprile 2026: la card mezzo e il primo test concreto. Se funziona, si estende.
- Aprile 2026: i report mensili rientrano nel piano. Si fanno dopo le schede mezzo/autista, riusando l'archivio artifact IA esistente.

## Glossario minimo
- Card / scheda strutturata: dati mostrati in tabella o riquadri, non a parole.
- Motore unificato: pezzo del sistema che oggi cattura le richieste libere e le incrocia tra piu aree. Utile per query trasversali, fastidioso per query mirate.
- OpenAI: il modello che riformula il testo della chat in italiano naturale. Non legge i tuoi dati direttamente.
- Artifact IA: documento (di solito PDF o report leggibile) salvato dalla chat e riapribile in seguito.
- Madre / NEXT: la versione vecchia (madre, dove tutto funziona) e la nuova (NEXT, dove sviluppi).
