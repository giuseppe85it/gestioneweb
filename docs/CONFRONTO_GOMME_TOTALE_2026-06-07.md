# CONFRONTO GOMME TOTALE 2026-06-07

MODE = OPERAIO - D1 GOMME, STEP 2-BIS.

Esito: REPORT COMPLETATO.

Perimetro eseguito:
- Firestore: sola lettura assoluta.
- Codice: sola lettura.
- Scrittura repo: solo questo file.
- Service account usato in lettura: `C:\Users\giumi\.firebase-keys\gestionemanutenzione-934ef-firebase-adminsdk-fbsvc-7a0850bcd3.json`.

Nota di interpretazione:
- `VISIBILE` significa che il record entra in almeno una vista gomme/intervento gomme attuale.
- `PERSO DAL PONTE` significa che il record non ha corrispettivo in `storage/@manutenzioni`.
- I due concetti non coincidono sempre: il Dossier Gomme NEXT legge anche `@cambi_gomme_autisti_tmp` e `@gomme_eventi`, quindi alcuni eventi non presenti in `@manutenzioni` risultano comunque visibili nel Dossier Gomme NEXT.

## Riepilogo

| Key | Record totali | Record gomme fisici | Visibili oggi come gomme | In `@manutenzioni` ma non visibili | Senza corrispettivo in `@manutenzioni` | Test/bozza evidente |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `@manutenzioni` | 82 | 16 | 16 | 0 | 0 | 0 |
| `@cambi_gomme_autisti_tmp` | 14 | 14 | 14 | 0 | 7 | 2 |
| `@gomme_eventi` | 14 | 14 | 14 | 0 | 4 | 3 raw |
| `@lavori` | 18 | 2 | 1 | 0 | 1 | 0 |
| `@segnalazioni_autisti_tmp` | 46 | 5 | 3 | 0 | 2 | 0 |
| `@controlli_mezzo_autisti` | 400 | 3 | 2 | 0 | 1 | 0 |
| `@storico_eventi_operativi` | 416 | 0 | 0 | 0 | 0 | 0 |

Dettaglio importante:
- `@manutenzioni`: i 16 record fisici includono 15 interventi gomme strutturati/testuali e 1 falso positivo testuale gia noto, TI85688, "TUBO GOMMA SCARICO CISTERNA", che non e' pneumatico.
- Eventi gomme esterni senza corrispettivo in `@manutenzioni`: 7 gruppi per ID evento, 11 righe fisiche se si contano sia tmp sia ufficiale.
- Segnalazioni/lavori/controlli senza corrispettivo gomme: 4 righe fisiche; sono record operativi o testuali, non manutenzioni eseguite certe.
- Categoria (b), cioe' esiste in `@manutenzioni` ma non entra nelle viste gomme: NON TROVATO.

## Passo 1 - Mappa completa scritture gomme dal codice

### `@cambi_gomme_autisti_tmp`

Scrive l'app autisti:
- `src/autisti/GommeAutistaModal.tsx:293-341`: costruisce record con `targetType`, `targetTarga`, `categoria`, `km`, `data`, `marca`, `tipo`, `gommeIds`, `asseId`, `asseLabel`, `rotazioneSchema`, `rotazioneText`, `rotazioneAssi`, `assiConCambioGomme`, `autista`, `contesto`, `stato`, `letta`.
- `src/autisti/GommeAutistaModal.tsx:343-349`: legge la lista e scrive `[record, ...list]` su `@cambi_gomme_autisti_tmp`.

Scrivono/aggiornano le superfici admin legacy:
- `src/components/AutistiEventoModal.tsx:269-277`: aggiorna record tmp.
- `src/components/AutistiEventoModal.tsx:280-286`: importa evento e marca il tmp `stato="importato"`, `letta=true`.
- `src/autistiInbox/AutistiAdmin.tsx:1616-1624`: aggiorna record tmp.
- `src/autistiInbox/AutistiAdmin.tsx:1784-2009`: modifica admin del record `gomme`.
- `src/autistiInbox/AutistiAdmin.tsx:2062-2075`: cancellazione admin del record `gomme`.

Scrive/aggiorna la superficie admin NEXT:
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1863-1869`: aggiorna record tmp.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1913`: dopo import marca il tmp `stato="importato"`, `letta=true`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:2083-2084` e `src/next/autistiInbox/NextAutistiAdminNative.tsx:2379-2380`: edit/delete admin su key gomme.

Writer di rimozione per hard delete mezzo:
- `src/next/nextMezzoHardDeleteWriter.ts:13-14`: include `@cambi_gomme_autisti_tmp` e `@gomme_eventi`.
- `src/next/nextMezzoHardDeleteWriter.ts:111-125`: filtra record per mezzo e riscrive la key se rimuove righe.

### `@gomme_eventi`

Import ufficiale legacy:
- `src/components/AutistiEventoModal.tsx:280-286`: copia il record in `@gomme_eventi` senza `letta` e `stato`.
- `src/autistiInbox/AutistiAdmin.tsx:1628-1634`: stesso flusso dalla inbox admin.

Import ufficiale NEXT:
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1884-1894`: copia in `@gomme_eventi`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1896-1913`: prova anche a chiudere manutenzioni/segnalazioni/controlli selezionati come `gomme_evento`.

### `@manutenzioni`

Madre manutenzioni:
- `src/pages/Manutenzioni.tsx:301-317`: il modale gomme integra solo un blocco testuale nella descrizione.
- `src/pages/Manutenzioni.tsx:345-357`: crea la manutenzione senza marker strutturato gomme.
- `src/pages/Manutenzioni.tsx:224`: persiste la lista su `@manutenzioni`.

Import legacy da evento autisti:
- `src/components/AutistiEventoModal.tsx:294-315`: costruisce descrizione `CAMBIO GOMME`, asse, marca, km, intervento, rotazione.
- `src/components/AutistiEventoModal.tsx:339-374`: appende manutenzione con `id`, `targa`, `tipo="mezzo"`, `descrizione`, `data`, `km`, `materiali: []`; non scrive marker strutturato.

NEXT manutenzioni:
- `src/next/NextManutenzioniPage.tsx:2553-2582`: passa al writer `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`.
- `src/next/domain/nextManutenzioniDomain.ts:198-211`: shape reale marker: `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`.
- `src/next/domain/nextManutenzioniDomain.ts:294-370`: sanitizzazione assi, gomme per asse, tipo intervento, straordinario.
- `src/next/domain/nextManutenzioniDomain.ts:1037-1121`: salvataggio dei campi marker nel record finale.

Percorsi NEXT che possono creare record senza marker:
- `src/next/NextManutenzioniPage.tsx:3506-3518`: creazione lavoro/manutenzione da fare con marker gomme esplicitamente null/vuoti.
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:198-202`: appende manutenzione da fare su `@manutenzioni`.
- `src/next/writers/nextChiusuraEventoWriter.ts:384-385`: chiusura/patch di manutenzioni esistenti.

### `@lavori`

Creazione lavoro da segnalazione/controllo:
- `src/components/AutistiEventoModal.tsx:505-547`: crea lavori da controlli/segnalazioni e scrive `@lavori`.
- `src/autistiInbox/AutistiAdmin.tsx:730-734`: `appendLavori()` scrive `@lavori`.
- `src/autistiInbox/AutistiAdmin.tsx:1532-1612`: crea lavori da controllo e patcha il controllo.
- `src/next/components/NextHomeAutistiEventoModal.tsx:49-51` e `src/next/components/NextHomeAutistiEventoModal.tsx:560-567`: la modale NEXT passa la richiesta di creazione al writer esterno.

### `@segnalazioni_autisti_tmp`

App autisti:
- `src/autisti/Segnalazioni.tsx:10-15`: `TipoProblema` include `gomme`; campi gomma: `posizioneGomma`, `problemaGomma`.
- `src/autisti/Segnalazioni.tsx:312-345`: crea record con targa, autista, tipo problema, posizione/problema gomma, descrizione, data, stato.
- `src/autisti/Segnalazioni.tsx:347-350`: scrive `@segnalazioni_autisti_tmp`.

Admin legacy/NEXT patchano stato, lettura, link a lavori/manutenzioni:
- `src/components/AutistiEventoModal.tsx:556-564`.
- `src/autistiInbox/AutistiAdmin.tsx:1518-1528`.
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:208-209`, `src/next/writers/nextChiusuraEventoWriter.ts:380-381`.

### `@controlli_mezzo_autisti`

App autisti:
- `src/autisti/ControlloMezzo.tsx:8`: key `@controlli_mezzo_autisti`.
- `src/autisti/ControlloMezzo.tsx:33-38`: checklist con `gomme`.
- `src/autisti/ControlloMezzo.tsx:110-119`: scrive record controllo con `check`, `note`, `target`, `timestamp`.
- `src/autisti/ControlloMezzo.tsx:183-190`: UI checklist include `GOMME`.

Admin legacy/NEXT:
- `src/components/AutistiEventoModal.tsx:567-580`: patcha controlli collegati.
- `src/autistiInbox/AutistiAdmin.tsx:1532-1612`: crea lavori da controllo e patcha `linkedLavoroId`.
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:1907-1910`: chiude controlli da evento gomme selezionato.

### `@storico_eventi_operativi`

Key scritta da flussi cambio assetto/sessione autisti, ma nel dato fisico corrente non contiene eventi gomme:
- `@storico_eventi_operativi`: 416 record letti, 0 record gomme dopo filtro su valori testuali e `tipo`.

## Passo 2 - Cosa e' visibile oggi

### Dossier Gomme NEXT

Viste:
- route `src/App.tsx:439`: `/next/dossier/:targa/gomme`.
- `src/next/NextGommeEconomiaSection.tsx:73-80`: carica `readNextMezzoManutenzioniGommeSnapshot(targa)` e, in modalita default `extended`, usa tutti gli `snapshot.gommeItems`.

Origini lette:
- `src/next/domain/nextManutenzioniGommeDomain.ts:103-118`: dominio logico include `@manutenzioni`, `@mezzi_aziendali`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1501-1546`: legge `@manutenzioni`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi` e unisce manutenzioni derivate + eventi esterni.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1321-1405`: normalizza gli eventi esterni come gomme se matchano la targa.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1408-1433`: deduplica tmp/ufficiale per `sourceRecordId`.
- `src/next/domain/nextManutenzioniGommeDomain.ts:1436-1457`: deduplica eventi esterni gia rappresentati da manutenzione.

Conclusione: un evento in `@cambi_gomme_autisti_tmp` o `@gomme_eventi` puo' essere visibile nel Dossier Gomme NEXT anche se non esiste in `@manutenzioni`.

### Storico manutenzioni / tab Gomme NEXT

- `src/next/NextMappaStoricoPage.tsx:71-84`: filtro dettaglio include `gomme`.
- `src/next/NextMappaStoricoPage.tsx:354-385`: classifica gomme da marker strutturato, `tipo="gomme"` o testo `GOMME`/`PNEUM`.
- `src/next/NextMappaStoricoPage.tsx:1137-1169`: mostra dettagli marker gomme se presenti.

Conclusione: qui entrano solo record di `@manutenzioni`; gli eventi esterni non bastano.

### Dossier Gomme legacy

- `src/pages/GommeEconomiaSection.tsx:33-45`: parser solo su blocchi `CAMBIO GOMME` nella descrizione.
- `src/pages/GommeEconomiaSection.tsx:104-129`: legge solo `storage/@manutenzioni`.

Conclusione: gli eventi esterni senza `@manutenzioni` non sono visibili nel Dossier Gomme legacy.

### Mezzo360 / Autista360 legacy

- `src/pages/Mezzo360.tsx:296-303`: legge anche `@cambi_gomme_autisti_tmp` e `@gomme_eventi`.
- `src/pages/Mezzo360.tsx:516-532`: filtra eventi gomme per targa/contesto.
- `src/pages/Mezzo360.tsx:600-610`: aggiunge eventi gomme alla timeline.
- `src/pages/Autista360.tsx:14-15` e `src/pages/Autista360.tsx:1084-1103`: legge tmp/ufficiali e li rende come eventi gomme.

Conclusione: eventi esterni visibili in timeline, anche fuori dallo storico manutenzioni.

### Inbox Gomme

- `src/autistiInbox/AutistiGommeAll.tsx:73-80`: legge `@cambi_gomme_autisti_tmp`.
- `src/autistiInbox/AutistiGommeAll.tsx:117-119`: di default filtra i non importati; gli importati sono visibili solo togliendo il filtro `Solo non importate`.

## Passo 3 - Confronto dati

Regola di incrocio usata:
- match forte diretto: stesso ID manutenzione, `from-lavoro-<id>`, `origineRefId`, `origineRefs`, `chiusuraRefId`;
- match compatibile: targa + data entro 3 giorni + contenuto gomma + asse compatibile;
- mai match per somiglianza di ID;
- nessun match targa-only senza data;
- se il target trovato non e' manutenzione gomme, viene segnalato come `non-gomme` e non chiude la divergenza.

## Schede Divergenze

### TI313387 - Caso in testa

Scheda D1 - TI313387, cluster eventi gomme 27/12/2025 - 28/12/2025

- Targa: TI313387.
- Date segnate: 2025-12-27 e 2025-12-28.
- Autista: GIUSEPPE MILIO, badge 517.
- Dove vive:
  - `@cambi_gomme_autisti_tmp`: 5 record.
  - `@gomme_eventi`: 1 record ufficiale duplicato dal tmp.
- Superficie probabile di scrittura:
  - app autisti per `@cambi_gomme_autisti_tmp`;
  - import admin per il record presente anche in `@gomme_eventi`.
- Corrispettivo in `@manutenzioni`: NON TROVATO.
- Visibilita oggi:
  - VISIBILE nel Dossier Gomme NEXT come evento esterno;
  - VISIBILE in Mezzo360/Autista360 come evento gomme;
  - NON visibile nello storico manutenzioni come manutenzione, perche' non esiste in `@manutenzioni`;
  - NON visibile nel Dossier Gomme legacy, che legge solo `@manutenzioni`.

Record fisici del cluster:

| ID | Key | Data | Cosa e' stato segnato |
| --- | --- | --- | --- |
| `4b0dcad6-5981-487a-b5a1-7979bf392092` | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | 2025-12-28 | `tipo=sostituzione`; `asseLabel=1° asse`; `asseId=asse1`; `marca=kumo prova`; `km=3589999`; `gommeIds=["motrice2assi-asse1-1","motrice2assi-asse1-2","motrice2assi-asse1-1","motrice2assi-asse1-2"]` |
| `a42d3045-b2e8-46d0-8efc-1eb02b0a070c` | `@cambi_gomme_autisti_tmp` | 2025-12-28 | `tipo=sostituzione`; `asseLabel=1° asse`; `asseId=asse1`; `km=333333`; stessi `gommeIds` duplicati |
| `a9d13560-d80a-47ac-a2b4-d86b0a47496a` | `@cambi_gomme_autisti_tmp` | 2025-12-28 | `tipo=sostituzione`; `asseLabel=1° asse`; `asseId=asse1`; `km=32588`; stessi `gommeIds` duplicati |
| `bec9e2c4-c911-4f43-bef2-c91968b5460e` | `@cambi_gomme_autisti_tmp` | 2025-12-27 | `tipo=sostituzione`; `asseLabel=Anteriore`; `asseId=anteriore`; `km=150000`; `gommeIds=["motrice2assi-anteriore-0","motrice2assi-anteriore-0"]` |
| `dc6ae1a5-c824-411a-9d52-b8479adbcccc` | `@cambi_gomme_autisti_tmp` | 2025-12-27 | `tipo=sostituzione`; `asseLabel=1° asse`; `asseId=asse1`; `km=5000`; `gommeIds=["motrice2assi-asse1-1","motrice2assi-asse1-2"]` |

Perche' e' divergenza:
- Sono eventi gomme scritti in key gomme.
- Non hanno manutenzione corrispondente in `@manutenzioni`.
- Sono probabilmente bozze/registrazioni ripetute dello stesso intervento: stessa targa, stesso asse logico anteriore/asse1, date consecutive, km molto incoerenti.

Proposta:
- NON importare automaticamente tutto il cluster.
- Serve decisione su quale record e' reale.
- Se Giuseppe approva un solo record reale, i campi strutturati deducibili dal record scelto sono:
  - `gommeInterventoTipo: "ordinario"` se era sostituzione ordinaria;
  - `assiCoinvolti: ["asse1"]` oppure `["anteriore"]` secondo il record scelto;
  - `gommePerAsse: [{ asseId: <asse scelto>, dataCambio: <data del record scelto>, kmCambio: <km del record scelto> }]`.
- Campi mancanti/non proponibili senza decisione:
  - quale data tenere: 2025-12-27 o 2025-12-28;
  - quale km tenere: 5000, 32588, 150000, 333333, 3589999;
  - se scartare il record con `marca=kumo prova`;
  - se i `gommeIds` duplicati significano 2 gomme o un errore di selezione.

Casella decisione:
- [ ] approva un solo record da importare
- [ ] scarta tutto il cluster
- [ ] da chiarire

Domanda secca:
- a) importare il record reale scelto da Giuseppe;
- b) scartare tutti i record TI313387 del 27/12-28/12 come bozze/test.

Verdetto TI313387:
- Giuseppe ricordava correttamente che un cambio gomme era stato segnato.
- Non e' nello storico `@manutenzioni`.
- Oggi non e' perso da tutte le viste: compare nel Dossier Gomme NEXT e nelle timeline che leggono gli eventi esterni.
- E' perso dal ponte verso lo storico manutenzioni e dal Dossier Gomme legacy.

### Divergenze non test

Scheda D2 - TI282780, 2026-05-26

- Targa: TI282780. Nel contesto record compare anche TI180147.
- Data: 2026-05-26.
- Autista: SANDRO CALABRESE, badge 530.
- Cosa e' stato segnato:
  - `tipo=riparazione`;
  - `asseLabel=3° asse`;
  - `asseId=asse3`;
  - `km=1234`;
  - `gommeIds=["SOSTITUZIONE VALVOLA LATO SX 3 ASSE"]`.
- Dove vive:
  - `@cambi_gomme_autisti_tmp` (`71f003d9-59b4-4ce5-9301-852723bfa937`);
  - `@gomme_eventi` (`71f003d9-59b4-4ce5-9301-852723bfa937`).
- Superficie probabile:
  - app autisti per tmp;
  - import admin per evento ufficiale.
- Corrispettivo in `@manutenzioni`: NON TROVATO.
- Visibilita oggi:
  - VISIBILE nel Dossier Gomme NEXT come evento esterno;
  - VISIBILE in Mezzo360/Autista360;
  - NON visibile nello storico manutenzioni.
- Perche' non si vede nello storico:
  - manca il record `@manutenzioni`.

Proposta:
- Importare solo se Giuseppe conferma che deve diventare manutenzione storica.
- Campi strutturati deducibili:
  - `gommeInterventoTipo: "straordinario"` perche' il testo parla di riparazione/sostituzione valvola, non di cambio ordinario completo;
  - record manutenzione: `targa=TI282780`, `data=2026-05-26`, `km=1234`;
  - `gommeStraordinario: { asseId: "asse3", quantita: null, motivo: "SOSTITUZIONE VALVOLA LATO SX 3 ASSE" }`.
- Mancano:
  - quantita gomme coinvolte;
  - marca pneumatico;
  - conferma che una sostituzione valvola vada storicizzata come manutenzione gomme.

Casella decisione:
- [ ] approva
- [ ] scarta
- [ ] da chiarire

Domanda secca:
- a) importare come evento gomme straordinario;
- b) lasciare solo come evento esterno.

Scheda D3 - TI298409, 2026-05-08

- Targa: TI298409.
- Data: 2026-05-08.
- Autista/segnalatore nel lavoro: RICCARDO FENDERICO.
- Cosa e' stato segnato:
  - `descrizione=Segnalazione: gomme - 4 gomme di trazione usurate, quasi finite. Da sostituire`;
  - `tipo=targa`;
  - `eseguito=false`;
  - `source.key=@segnalazioni_autisti_tmp`;
  - `source.id=7d1d8009-69af-4578-a8ef-060d1d4f5766`.
- Dove vive:
  - `@lavori` (`a5ba1512-2961-40a9-9c00-a27b6559bef2`).
- Superficie probabile:
  - creazione lavoro da segnalazione autisti in admin/inbox.
- Corrispettivo in `@manutenzioni`: NON TROVATO per questo lavoro.
- Nota importante:
  - la segnalazione sorgente `7d1d8009-69af-4578-a8ef-060d1d4f5766` e' collegata alla manutenzione gomme `1778587360877` del 2026-05-12;
  - questo record `@lavori` resta una divergenza/orfano rispetto alla regola di confronto per ID e data +-3 giorni.
- Visibilita oggi:
  - la manutenzione del 2026-05-12 e' visibile come gomme;
  - questo lavoro specifico non e' visibile come intervento gomme storico.

Proposta:
- Non importare automaticamente: rischio duplicato della manutenzione `1778587360877`.
- Se Giuseppe vuole chiudere la divergenza, la proposta piu' prudente e' scartare/archiviare il lavoro orfano o agganciarlo alla manutenzione gia esistente, non creare una nuova manutenzione.
- Campi strutturati deducibili solo dal testo, se si decidesse comunque di importare:
  - intervento richiesto su gomme di trazione/posteriore;
  - quantita testuale: 4 gomme;
  - mancano data esecuzione reale, km, marca, asse strutturato esatto.

Casella decisione:
- [ ] approva
- [ ] scarta
- [ ] da chiarire

Domanda secca:
- a) scartare/agganciare come duplicato operativo della manutenzione `1778587360877`;
- b) creare una nuova manutenzione storica separata.

Scheda D4 - TI84069, 2026-02-05

- Targa: TI84069. Nel contesto motrice compare TI113417.
- Data: 2026-02-05.
- Autista: SANDRO CALABRESE, badge 530.
- Cosa e' stato segnato:
  - `tipoProblema=gomme`;
  - `target=rimorchio`;
  - `ambito=rimorchio`;
  - `posizioneGomma=asse2`;
  - `problemaGomma=forata`;
  - `descrizione=Tagliata`;
  - `stato=nuova`;
  - `letta=false`.
- Dove vive:
  - `@segnalazioni_autisti_tmp` (`7e9925c6-b92c-4daa-9209-b8bd496564a1`).
- Superficie:
  - app autisti segnalazioni.
- Corrispettivo in `@manutenzioni`: NON TROVATO.
- Visibilita oggi:
  - non e' visibile come intervento gomme storico;
  - e' una segnalazione nuova, non una manutenzione eseguita.

Proposta:
- Non importare come manutenzione eseguita senza decisione.
- Se Giuseppe conferma che la gomma e' stata riparata/sostituita, i campi deducibili sarebbero parziali:
  - `gommeInterventoTipo: "straordinario"`;
  - `gommeStraordinario: { asseId: "asse2", quantita: null, motivo: "forata/tagliata" }`.
- Mancano:
  - data esecuzione reale;
  - km;
  - quantita gomme;
  - marca;
  - conferma che l'intervento sia stato fatto.

Casella decisione:
- [ ] approva
- [ ] scarta
- [ ] da chiarire

Domanda secca:
- a) trattarla come segnalazione ancora da chiarire;
- b) importarla come evento gomme straordinario eseguito.

Scheda D5 - TI285195 / TI279216, 2026-03-25

- Targa target: TI285195 rimorchio. Nel contesto motrice compare TI279216.
- Data record: 2026-03-25.
- Autista: PIERO LAURO, badge 513.
- Cosa e' stato segnato:
  - `target=rimorchio`;
  - `check.gomme=false`;
  - `note=In data 24/03/ ho comunicato l'usura peneumatici 1 asse .`;
  - `letta=false`.
- Dove vive:
  - `@controlli_mezzo_autisti` (`48660226-d99a-44db-9b41-c340716338df`).
- Superficie:
  - app autisti controllo mezzo.
- Corrispettivo in `@manutenzioni`: NON TROVATO.
- Visibilita oggi:
  - non e' visibile come intervento gomme storico;
  - e' un controllo KO/nota, non una manutenzione eseguita.

Proposta:
- Non importare automaticamente come manutenzione.
- Il testo dice che l'usura era stata comunicata il 24/03, ma non dice che il cambio sia stato eseguito.
- Campi deducibili solo se Giuseppe conferma esecuzione:
  - asse: 1 asse;
  - tipo problema: usura pneumatici;
  - targa rimorchio: TI285195.
- Mancano:
  - esito intervento;
  - data esecuzione;
  - km;
  - quantita gomme;
  - marca;
  - tipo marker ordinario/straordinario.

Casella decisione:
- [ ] approva
- [ ] scarta
- [ ] da chiarire

Domanda secca:
- a) lasciare come controllo/segnalazione, non intervento;
- b) creare/importare una manutenzione gomme solo dopo conferma dei dati mancanti.

## Falsi positivi testuali / da scartare

Scheda FP1 - TI279216 / TI285195, 2026-05-21

- Targa: TI279216. Nel contesto rimorchio compare TI285195.
- Data: 2026-05-21.
- Autista: PIERO LAURO, badge 513.
- Cosa e' stato segnato:
  - `tipoProblema=altro`;
  - `descrizione=Asse anteriore mi sono accorto di un rumore di tipo lamiera cmq mi sono fermato dal gommista a cadenazzo ho fatto controllare i giochi sui cuscinetti pressione tiraggio bulloni tutto ok bisognerebbe farlo controllare in officina grazie`;
  - `linkedLavoroId=d0c31311-b3fa-4c7b-969b-ab328d95b6f9`.
- Dove vive:
  - `@segnalazioni_autisti_tmp` (`cbcf3c6f-3175-4c76-911f-e2d3ebc20fb4`).
- Corrispettivo:
  - esiste lavoro collegato `d0c31311-b3fa-4c7b-969b-ab328d95b6f9`, ma non e' manutenzione gomme.
- Perche' e' falso positivo:
  - contiene la parola `gommista`, ma il testo dice che giochi cuscinetti, pressione e bulloni sono stati controllati e risultano ok;
  - il problema residuo e' rumore di lamiera / controllo officina, non cambio gomme.

Proposta:
- Scartare dal perimetro interventi gomme.

Casella decisione:
- [ ] approva scarto
- [ ] scarta lo scarto
- [ ] da chiarire

## Test / bozze

Scheda T1 - TI282780, 2026-06-26

- Targa: TI282780. Nel contesto record compare TI180147.
- Data: 2026-06-26, futura rispetto al 2026-06-07.
- Autista: SANDRO CALABRESE, badge 530.
- Dove vive:
  - `@cambi_gomme_autisti_tmp`;
  - `@gomme_eventi`, presente due volte con lo stesso ID.
- ID: `ea43d48f-0ef3-40d5-8c63-8245333fc142`.
- Cosa e' stato segnato:
  - `tipo=riparazione`;
  - `asseLabel=1° asse`;
  - `asseId=asse1`;
  - `marca=Prova`;
  - `km=1234`;
  - `gommeIds=["RIPARAZIONE PER FORATURA LATO DX"]`.
- Perche' e' test/bozza:
  - data futura 2026-06-26;
  - marca `Prova`;
  - duplicato in `@gomme_eventi`.

Proposta:
- Scartare, salvo conferma esplicita contraria.

Casella decisione:
- [ ] approva scarto
- [ ] scarta lo scarto
- [ ] da chiarire

Scheda T2 - TI313387, 2025-12-28

- ID: `4b0dcad6-5981-487a-b5a1-7979bf392092`.
- Gia incluso nel cluster TI313387.
- Perche' e' test/bozza:
  - `marca=kumo prova`;
  - `km=3589999`;
  - `gommeIds` duplicati.

Proposta:
- Dentro la decisione TI313387, questo record va considerato candidato scarto/test.

Casella decisione:
- [ ] approva scarto
- [ ] scarta lo scarto
- [ ] da chiarire

## Record con corrispettivo trovato

Esempi principali, deduplicati:
- TI298409, evento gomme 2026-05-12: `@cambi_gomme_autisti_tmp` / `@gomme_eventi` -> `@manutenzioni` `1778587360877`.
- TI285195, evento gomme 2026-05-05 -> `@manutenzioni` `1777979571388`.
- TI239045, evento gomme 2026-03-31 -> `@manutenzioni` `1774962027367`.
- TI81027, evento gomme 2026-03-24 -> `@manutenzioni` `1774962042583`.
- TI324623, evento gomme 2026-03-24 -> `@manutenzioni` `1776958902385`.
- TI84069, evento gomme 2026-03-24 -> `@manutenzioni` `1774363044856`.
- TI239279, evento gomme 2026-02-27 -> `@manutenzioni` `1772531987235`.
- TI280132, lavoro/controllo gomme -> `@manutenzioni` `from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d`.
- TI285195, controllo del 2026-03-09 con testo `Sostituzione gomme 3 Asse km294278` -> `@manutenzioni` `1773066080204`.

## Verdetto Ponte

Il ponte verso `@manutenzioni` non e' solo un problema storico.

Fatto piu recente non-test senza corrispettivo in `@manutenzioni`:
- TI282780, 2026-05-26, `@cambi_gomme_autisti_tmp` + `@gomme_eventi`, `SOSTITUZIONE VALVOLA LATO SX 3 ASSE`.

Verdetto:
- Il flusso che scrive/importa eventi gomme in `@cambi_gomme_autisti_tmp` e `@gomme_eventi` puo' ancora lasciare record fuori da `@manutenzioni`.
- La visibilita NEXT e' parzialmente protetta perche' il Dossier Gomme NEXT legge anche gli eventi esterni.
- Lo storico manutenzioni, il Dossier Gomme legacy e ogni logica che dipende solo da `@manutenzioni` restano incompleti per questi casi.

Punto esatto da presidiare, senza fix in questa sessione:
- import admin gomme legacy/NEXT: dopo la scrittura in `@gomme_eventi`, il record deve avere una decisione esplicita e verificabile su `@manutenzioni`:
  - crea manutenzione strutturata;
  - collega/chiude manutenzione esistente;
  - oppure marca come evento esterno da non importare.
- Righe critiche:
  - `src/autistiInbox/AutistiAdmin.tsx:1628-1634`: importa in `@gomme_eventi` e marca tmp importato, senza creare `@manutenzioni`.
  - `src/next/autistiInbox/NextAutistiAdminNative.tsx:1884-1913`: importa in `@gomme_eventi` e prova chiusure selezionate, ma se non viene selezionata/creata una manutenzione il ponte verso `@manutenzioni` resta aperto.
  - `src/components/AutistiEventoModal.tsx:339-374`: quando crea manutenzione legacy, la crea solo testuale e senza marker strutturato.

## Output decisionale compatto

| Scheda | Targa | Data | Dove vive | Verdetto | Decisione richiesta |
| --- | --- | --- | --- | --- | --- |
| D1 | TI313387 | 2025-12-27/28 | `@cambi_gomme_autisti_tmp`, parziale `@gomme_eventi` | scritto, visibile in NEXT esteso, assente da `@manutenzioni` | scegliere record reale o scartare cluster |
| D2 | TI282780 | 2026-05-26 | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | scritto, visibile in NEXT esteso, assente da `@manutenzioni` | importare straordinario o lasciare evento esterno |
| D3 | TI298409 | 2026-05-08 | `@lavori` | lavoro orfano/duplicabile, manutenzione del 12/05 gia visibile | scartare/agganciare o creare nuova |
| D4 | TI84069 | 2026-02-05 | `@segnalazioni_autisti_tmp` | segnalazione nuova, non intervento eseguito | chiarire o importare straordinario |
| D5 | TI285195/TI279216 | 2026-03-25 | `@controlli_mezzo_autisti` | controllo KO/nota, non intervento eseguito | lasciare controllo o importare dopo dati mancanti |
| FP1 | TI279216/TI285195 | 2026-05-21 | `@segnalazioni_autisti_tmp` | falso positivo testuale `gommista` | scartare |
| T1 | TI282780 | 2026-06-26 | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | test/bozza | scartare salvo conferma |
| T2 | TI313387 | 2025-12-28 | `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | test/bozza dentro cluster TI313387 | scartare salvo conferma |
