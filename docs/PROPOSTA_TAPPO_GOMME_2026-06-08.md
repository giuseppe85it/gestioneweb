# PROPOSTA TAPPO GOMME NEXT - 2026-06-08

Esito: **PROPOSTA COMPLETATA**.

Perimetro rispettato: sola lettura su codice e dati. Nessuna modifica a codice runtime, nessuna scrittura Firestore. La madre e' fuori perimetro: `src/components/AutistiEventoModal.tsx` e `src/pages/Manutenzioni.tsx` non sono proposti come punti da tappare.

## 0. Shape reale del marcatore gomme

Il writer business NEXT supporta gia' i campi strutturati gomme:

- `gommeInterventoTipo`: `ordinario` oppure `straordinario`.
- `assiCoinvolti`: assi coinvolti per interventi ordinari.
- `gommePerAsse`: dettagli per asse degli ordinari, con `asseId`, `dataCambio`, `kmCambio`.
- `gommeStraordinario`: dettaglio straordinario, con `asseId`, `quantita`, `motivo`.

Righe reali:

- `src/next/domain/nextManutenzioniDomain.ts:173-176`: payload accetta `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`.
- `src/next/domain/nextManutenzioniDomain.ts:360-372`: risoluzione tipo intervento; se c'e' `gommeStraordinario` diventa `straordinario`, se ci sono assi/gomme per asse diventa `ordinario`, se la descrizione e' cambio gomme derivato diventa `straordinario`.
- `src/next/domain/nextManutenzioniDomain.ts:1042-1063`: sanitizzazione assi, km, data, gomme per asse e straordinario.
- `src/next/domain/nextManutenzioniDomain.ts:1118-1121`: scrittura additiva dei campi strutturati nel record finale.

Il salvataggio manuale dalla pagina NEXT manutenzioni non e' il buco principale: quando il form e' impostato su gomme passa gia' i campi strutturati al writer.

- `src/next/NextManutenzioniPage.tsx:2540-2569`: il form invia `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`.

## 1. Percorsi NEXT che creano manutenzioni da sorgenti gomme

### 1.1 `nextManutenzioneDaFareCreateWriter`

File: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`.

Il builder comune crea una manutenzione `daFare` generica:

- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:106-139`: scrive `id`, `tipo`, `targa`, `descrizione`, `data:null`, `stato:"daFare"`, `urgenza`, legame origine, `km:null`, `fornitore:null`, `sottotipo:null`, `materiali:[]`.

Campi persi oggi:

- non scrive `gommeInterventoTipo`;
- non scrive `assiCoinvolti`;
- non scrive `gommePerAsse`;
- non scrive `gommeStraordinario`;
- non porta nel record strutturato eventuali `posizioneGomma`, `problemaGomma`, asse, quantita', km, marca.

#### Da evento generico

Righe reali:

- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:230-271`: `createManutenzioneDaFareFromEvento` riceve solo input generico (`descrizione`, `note`, `targa`, `origineTipo`, `origineId`) e usa il builder comune.
- `src/next/components/NextHomeAutistiEventoModal.tsx:530-567`: il modal crea la manutenzione passando descrizione, urgenza, targa, note, segnalatoDa, origine tipo/id; non passa il record sorgente completo.
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx:207-214`: chiama `createManutenzioneDaFareFromEvento(input)`.
- `src/next/NextCentroControlloParityPage.tsx:2399-2406`: chiama `createManutenzioneDaFareFromEvento(input)`.

Cosa si perde se la sorgente e' gomme: qualunque dettaglio presente nel payload originale ma non copiato in `descrizione/note`, quindi asse, posizione, problema, km o marca restano fuori dal marcatore.

Proposta:

- creare un derivatore esplicito nel writer, non nel modal, per non duplicare logica UI;
- estendere l'input o aggiungere una variante dedicata che riceva il record sorgente completo quando il tipo evento e' gomme;
- scrivere solo campi deducibili con certezza.

Mapping deducibile:

- targa: gia' presente;
- descrizione: gia' presente;
- asse: solo se il testo o il payload contiene un asse esplicito normalizzabile (`asse1`, `asse2`, `asse3`, oppure "1 asse", "2 asse", "3 asse");
- motivo: solo se il testo o un campo sorgente contiene un problema esplicito, per esempio "gomma tagliata", "foratura", "valvola lato sx";
- km, marca, quantita': solo se presenti in modo esplicito nel payload sorgente.

NON deducibile automaticamente:

- `gommeInterventoTipo` alla creazione, quando il record e' una sorgente da lavorare e non un intervento eseguito.

Decisione richiesta:

- a) Alla creazione da sorgente gomme, classificare come `straordinario` solo le sorgenti che descrivono un guasto/intervento puntuale e scrivere `gommeStraordinario` con i soli campi presenti.
- b) Non scrivere `gommeInterventoTipo` alla creazione: obbligare la scelta `ordinario/straordinario` nel flusso di completamento, mantenendo in descrizione e origine i dettagli sorgente.

### 1.2 Da segnalazione

Righe reali:

- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:273-319`: `createManutenzioneDaFareFromSegnalazione` legge targa, `tipoProblema`, `descrizione`, autista e flag verifica; crea descrizione `Segnalazione: <tipoProblema> - <descrizione>`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1668-1693`: il bottone "crea nuova" da segnalazione chiama questo writer.

Cosa viene scritto oggi:

- record `daFare` in `@manutenzioni`;
- legame verso `@segnalazioni_autisti_tmp`;
- descrizione testuale.

Cosa si perde se la segnalazione e' gomme:

- `posizioneGomma` non viene letto;
- `problemaGomma` non viene letto;
- eventuali campi target/categoria non diventano marker;
- nessun campo strutturato gomme viene scritto.

Mapping sorgente -> marker proponibile:

- se `tipoProblema` e' `gomme`, il record e' famiglia gomme;
- `posizioneGomma` -> `gommeStraordinario.asseId` solo se il valore e' un asse canonico o normalizzabile;
- `problemaGomma` -> `gommeStraordinario.motivo` solo se valorizzato;
- descrizione -> motivo aggiuntivo solo se contiene un problema gomme esplicito;
- `quantita`, `km`, `marca` -> NON proposti se assenti.

Decisione richiesta:

- a) Segnalazione gomme = manutenzione `daFare` gia' marcata `straordinario` quando c'e' un problema/posizione gomme esplicito.
- b) Segnalazione gomme = manutenzione `daFare` non tipizzata; marker obbligatorio solo al completamento.

### 1.3 Da controllo mezzo

Righe reali:

- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:321-380`: `createManutenzioneDaFareFromControllo` legge `record.check`, prende le voci false, costruisce `Controllo KO: <KO>`, sceglie le targhe in base a `target`, poi crea record con builder comune.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1700-1706`: il bottone "crea nuova" da controllo chiama questo writer.

Cosa viene scritto oggi:

- record `daFare` in `@manutenzioni`;
- una o due targhe, se controllo motrice/rimorchio/entrambi;
- descrizione testuale dei KO;
- legame verso `@controlli_mezzo_autisti`.

Cosa si perde se il KO e' gomme:

- `check.gomme === false` non diventa marker;
- eventuali note tipo "usura pneumatici 1 asse" non vengono usate per asse/motivo;
- nessun `gommeInterventoTipo`;
- nessun asse strutturato;
- nessun `kmCambio`, `quantita`, marca.

Mapping sorgente -> marker proponibile:

- `check.gomme === false` -> famiglia gomme;
- note/desrizione con "1 asse", "2 asse", "3 asse" -> asse solo se esplicito;
- note/desrizione con "usura", "taglio", "foratura", "valvola" -> motivo solo se esplicito;
- `km`, `quantita`, marca -> NON proposti se assenti.

Decisione richiesta:

- a) KO gomme da controllo = manutenzione `daFare` marcata `straordinario` solo se c'e' un problema puntuale esplicito.
- b) KO gomme da controllo = manutenzione non tipizzata; marker obbligatorio al completamento.

### 1.4 Lavoro da gruppo segnalazioni in `NextManutenzioniPage`

Righe reali:

- `src/next/NextManutenzioniPage.tsx:3468-3512`: crea un lavoro `daFare` da un gruppo di segnalazioni.
- `src/next/NextManutenzioniPage.tsx:3502-3505`: forza `assiCoinvolti: []`, `gommePerAsse: []`, `gommeInterventoTipo: null`, `gommeStraordinario: null`.

Cosa si perde:

- se il gruppo contiene solo o anche segnalazioni gomme, il lavoro aggregato resta non strutturato.

Proposta:

- riusare lo stesso derivatore gomme previsto per `nextManutenzioneDaFareCreateWriter`;
- se tutte le segnalazioni del gruppo sono gomme e hanno mapping coerente, proporre marker;
- se il gruppo e' misto o parziale, non inventare marker e lasciare decisione al completamento.

Decisione richiesta:

- a) Per gruppi solo-gomme coerenti, creare il lavoro gia' marcato.
- b) Per tutti i gruppi, anche solo-gomme, non scrivere marker e obbligare la classificazione al completamento.

### 1.5 `ArchivistaManutenzioneBridge`

File: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`.

Righe reali:

- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:200-215`: l'Archivista riconosce segnali manutentivi anche con testo `PNEUMATIC`.
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:1089-1132`: costruisce payload con targa, tipo, sottotipo, fornitore, km, descrizione, eseguito, data, materiali, sourceDocumentId, importo.
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:1136-1138`: salva via `saveNextManutenzioneBusinessRecord(payload)`.

Cosa si perde:

- un documento/fattura con righe pneumatici puo' creare una manutenzione senza `gommeInterventoTipo`;
- eventuali assi, km, marca, quantita' citati nel testo non diventano marker;
- il sottotipo non basta per far entrare il record nel ramo gomme strutturato.

Proposta:

- non fare inferenza muta da IA a marker definitivo;
- aggiungere una sezione di revisione gomme quando `analysis.testo` o righe review contengono gomme/pneumatici;
- salvare marker solo dopo conferma utente dei campi dedotti.

Mapping deducibile:

- asse solo se scritto in modo esplicito nel documento;
- km solo se il documento espone il km e viene gia' accettato nel campo `km`;
- motivo solo se il testo contiene un motivo esplicito;
- tipo `ordinario/straordinario` non va inventato da una fattura generica.

Decisione richiesta:

- a) Archivista mostra campi gomme obbligatori quando rileva pneumatici e salva marker solo dopo conferma.
- b) Archivista non salva marker gomme: crea manutenzione generica e manda la classificazione al flusso manutenzioni.

## 2. Ponte eventi gomme -> `@manutenzioni` in NEXT

### Lettura e visibilita' attuale

Righe reali:

- `src/next/domain/nextManutenzioniGommeDomain.ts:1501-1509`: il Dossier Gomme NEXT legge `@manutenzioni`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1321-1405`: gli eventi esterni vengono trasformati in item gomme leggibili con targa, data, asse, quantita', marca, km, autista e fonte.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1408-1457`: deduplica tra eventi esterni e manutenzioni.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1538-1546`: gli item finali includono sia manutenzioni derivate sia eventi esterni.

Verdetto: oggi il Dossier Gomme NEXT puo' mostrare eventi esterni anche se non sono in `@manutenzioni`. Questa e' visibilita' read-only, non import nello storico manutenzioni.

### Import admin attuale

Righe reali:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1884-1894`: `confirmImportGommeRecord` copia il record selezionato in `@gomme_eventi`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1895-1913`: chiude i candidati selezionati (`manutenzione`, `segnalazione`, `controllo`) e marca il tmp come importato.
- `src/next/components/NextImportGommeChiusuraModal.tsx:220-280`: il modal cerca solo candidati gia' esistenti in `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`.
- `src/next/components/NextImportGommeChiusuraModal.tsx:348-350`: se non trova candidati, mostra "Nessuna segnalazione, controllo o manutenzione gomme aperta per questo mezzo."

Verdetto: esiste un flusso NEXT che promuove l'evento da tmp a `@gomme_eventi`, ma non esiste un ponte NEXT garantito evento gomme -> nuova manutenzione in `@manutenzioni`. Se non c'e' un candidato da chiudere, l'evento resta fuori dallo storico manutenzioni.

Caso concreto gia' censito: TI282780 26/05 era evento gomme scritto, ma non aveva una manutenzione corrispondente finche' non e' stato importato manualmente nello step finale.

Decisione richiesta:

- a) Aggiungere in Dossier Gomme NEXT / modal import un gesto esplicito "Importa nello storico manutenzioni" che crea una manutenzione `eseguita` in `@manutenzioni` con marker confermato dall'utente.
- b) Non aggiungere ora il ponte: lo fara' la nuova UI gomme in progetto. Fino ad allora gli eventi esterni possono essere visibili nel Dossier ma non garantiti nello storico manutenzioni.

## 3. Doppio-submit

### Writer app autisti live verso `@cambi_gomme_autisti_tmp`

File: `src/autisti/GommeAutistaModal.tsx`.

Righe reali:

- `src/autisti/GommeAutistaModal.tsx:143-147`: genera id nuovo.
- `src/autisti/GommeAutistaModal.tsx:149-166`: stato del modal; non c'e' stato `saving`.
- `src/autisti/GommeAutistaModal.tsx:293-342`: costruisce il record gomme con targa, categoria, km, data, marca, tipo, gommeIds, asse, rotazione, autista, contesto, `stato:"nuovo"`, `letta:false`.
- `src/autisti/GommeAutistaModal.tsx:343-349`: legge `@cambi_gomme_autisti_tmp` e appende `[record, ...list]`.

Buco: un doppio tap puo' eseguire due volte `handleSave`. Normalmente genera due id diversi, quindi produce due eventi logici duplicati. Anche se non e' il duplicato same-id osservato in `@gomme_eventi`, e' un buco reale della app autisti live.

Nota perimetro: questo fix toccherebbe `src/autisti/GommeAutistaModal.tsx`, quindi app autisti produzione live. Non e' la madre manutenzioni; resta comunque da trattare come deploy live.

### Writer NEXT admin verso `@gomme_eventi`

File: `src/next/autistiInbox/NextAutistiAdminNative.tsx`.

Righe reali:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1884-1894`: copia il record tmp in `@gomme_eventi` con lo stesso `id`, senza verificare se quell'id e' gia' presente.
- `src/next/components/NextImportGommeChiusuraModal.tsx:320-338`: il modal disabilita alcuni controlli quando `busy`, ma la guardia idempotente non e' nel writer.

Buco: se `confirmImportGommeRecord` viene invocato due volte sullo stesso record, `@gomme_eventi` riceve due record con lo stesso id. Questo spiega il duplicato same-id gia' visto.

Proposta guardia minima:

- in `confirmImportGommeRecord`, prima di scrivere: se `list.some(item => String(item?.id) === idEvento)` allora non appendere di nuovo l'evento ufficiale;
- aggiungere guardia iniziale `if (gommeImportBusy) return;` per ridurre doppie invocazioni concorrenti;
- lasciare invariata la chiusura dei candidati solo se idempotente o gia' protetta dai writer di chiusura; se non lo e', separare in secondo step.

Proposta guardia app autisti:

- aggiungere `saving` in `src/autisti/GommeAutistaModal.tsx`;
- se `saving` e' true, `handleSave` ritorna senza scrivere;
- disabilitare il bottone salva durante il salvataggio;
- mantenere anche controllo id gia' presente prima di appendere, anche se l'id e' generato localmente.

Decisione richiesta:

- a) Nel prossimo step tappare sia import admin NEXT same-id sia doppio tap app autisti live.
- b) Nel prossimo step tappare solo import admin NEXT; app autisti live resta per intervento separato.

## 4. Proposta di fix puntuale

### Fix A - marker da sorgenti NEXT

File principale: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`.

Cosa cambia:

- aggiungere helper di derivazione marker da segnalazione/controllo/evento;
- applicarlo solo quando la sorgente e' esplicitamente gomme;
- scrivere solo campi certi;
- non inventare `km`, marca, quantita', asse o motivo se assenti.

Dipendenze UI:

- `src/next/components/NextHomeAutistiEventoModal.tsx`: se serve passare record sorgente completo al writer.
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`: adeguare il chiamante se l'input cambia.
- `src/next/NextCentroControlloParityPage.tsx`: adeguare il chiamante se l'input cambia.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`: crea da segnalazione/controllo usando gia' i writer specifici.

Decisione richiesta unica per questo fix:

- a) marker immediato alla creazione quando la sorgente gomme ha dati espliciti;
- b) marker obbligatorio solo al completamento.

### Fix B - ponte eventi gomme -> storico manutenzioni

File probabili:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx`;
- `src/next/components/NextImportGommeChiusuraModal.tsx`;
- eventualmente `src/next/domain/nextManutenzioniGommeDomain.ts` solo per riusare normalizzazioni/descrizioni, senza cambiare lettura.

Cosa cambia:

- quando l'evento gomme non ha candidato in `@manutenzioni`, offrire una scelta esplicita di import;
- creare una manutenzione in `@manutenzioni` solo dopo conferma;
- marker scritto solo dai campi evento espliciti: tipo, asse, quantita', marca, km, autista, motivo se presente.

Decisione richiesta:

- a) import manuale nel Dossier/import modal NEXT;
- b) ponte rimandato alla nuova UI gomme.

### Fix C - Archivista

File: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`.

Cosa cambia:

- intercettare documenti con pneumatici/gomme;
- mostrare revisione marker gomme prima del salvataggio;
- salvare marker solo se confermato.

Decisione richiesta:

- a) Archivista deve supportare marker gomme con conferma utente;
- b) Archivista resta generico e la classificazione passa dalla pagina manutenzioni.

### Fix D - doppio-submit

File:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx`;
- `src/autisti/GommeAutistaModal.tsx` solo se Giuseppe approva di toccare app autisti live.

Cosa cambia:

- id guard su `@gomme_eventi`;
- busy guard nell'import;
- saving guard nell'app autisti.

Decisione richiesta:

- a) tappare entrambi;
- b) tappare solo NEXT admin ora.

## 5. Perimetro file previsto per lo step 2

Lista chiusa proposta, da confermare prima della patch:

- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/components/NextImportGommeChiusuraModal.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/autisti/GommeAutistaModal.tsx` solo per doppio-submit app autisti live, se opzione 3a approvata
- test mirati nuovi o esistenti sotto `src/next/**/__tests__` se presenti nel perimetro del fix approvato

File esplicitamente esclusi:

- `src/components/AutistiEventoModal.tsx`
- `src/pages/Manutenzioni.tsx`
- qualunque dato Firestore

## 6. Sintesi decisioni richieste

1. Sorgenti gomme -> manutenzione `daFare`:
   - a) marker immediato quando i campi sorgente sono espliciti;
   - b) marker solo al completamento.

2. Ponte eventi gomme -> `@manutenzioni`:
   - a) gesto di import nel Dossier/import modal NEXT;
   - b) ponte rimandato alla nuova UI gomme.

3. Doppio-submit:
   - a) tappare NEXT admin e app autisti live;
   - b) tappare solo NEXT admin ora.

4. Archivista:
   - a) aggiungere revisione marker gomme prima del salvataggio;
   - b) lasciare Archivista generico e classificare dopo in Manutenzioni.

## 7. Verdetto

Il buco NEXT e' confermato.

- Il writer business sa gia' salvare il marcatore gomme.
- Il form diretto Manutenzioni NEXT lo passa correttamente quando l'utente seleziona gomme.
- I percorsi NEXT da sorgenti (`segnalazione`, `controllo`, evento generico, gruppo) creano manutenzioni generiche e perdono il marker.
- Il Dossier Gomme NEXT legge gli eventi esterni, ma questa e' visibilita' read-only: non garantisce ingresso nello storico `@manutenzioni`.
- L'import admin NEXT verso `@gomme_eventi` non e' idempotente per id.
- La app autisti live puo' duplicare submit per doppio tap.
