AUDIT USER JOURNEY COMPLETATO

# AUDIT USER JOURNEY MANUTENZIONE DAFARE — END TO END

## OUTPUT COMANDI 1-7

1. `ls src/next/NextManutenzioniPage.tsx`
```text
src/next/NextManutenzioniPage.tsx  Length 118043  LastWriteTime 12/05/2026 21:39
```

2. `rg -n "Crea lavoro|crea lavoro|onCreateLavoro|createLavoroFrom|nextLavoroCreateWriter|createManutenzioneDaFareFrom" src/next/`
```text
src/next/autistiInbox/NextAutistiAdminNative.tsx:1540 createLavoroFromSegnalazione(record)
src/next/autistiInbox/NextAutistiAdminNative.tsx:1605 createLavoroFromControllo(record)
src/next/autistiInbox/NextAutistiAdminNative.tsx:2645 onClick={() => createLavoroFromSegnalazione(r)}
src/next/autistiInbox/NextAutistiAdminNative.tsx:2771 onClick={() => createLavoroFromControllo(r)}
src/next/components/NextHomeAutistiEventoModal.tsx:48 onCreateLavoro
src/next/NextCentroControlloParityPage.tsx:46 createLavoroFromEvento
src/next/NextCentroControlloParityPage.tsx:2418 await createLavoroFromEvento(input)
src/next/nextLavoroCreateWriter.ts:142 export async function createLavoroFromEvento
src/next/writers/nextManutenzioneDaFareCreateWriter.ts:216 createManutenzioneDaFareFromEvento
src/next/writers/nextManutenzioneDaFareCreateWriter.ts:259 createManutenzioneDaFareFromSegnalazione
src/next/writers/nextManutenzioneDaFareCreateWriter.ts:307 createManutenzioneDaFareFromControllo
```

3. `rg -n "Nuova manutenzione|crea manutenzione|onCreateManutenzione|createManutenzione" src/next/`
```text
src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:1675 Si, crea manutenzione
src/next/NextManutenzioniPage.tsx:2056 + Nuova manutenzione
src/next/NextManutenzioniPage.tsx:2118 Nuova manutenzione
src/next/writers/nextManutenzioneDaFareCreateWriter.ts:216/259/307 createManutenzioneDaFareFrom*
```

4. `rg -ln "@manutenzioni|readNextManutenzioni|readNextMezzoManutenzioni" src/next/`
```text
src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts
src/next/domain/nextDossierMezzoDomain.ts
src/next/domain/nextManutenzioniDomain.ts
src/next/NextHomePage.tsx
src/next/NextManutenzioniPage.tsx
src/next/NextCentroControlloParityPage.tsx
src/next/writers/nextManutenzioneDaFareCreateWriter.ts
src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts
```

5. `rg -n "stato.*daFare|stato:.*daFare|isDaFare|filterDaFare" src/next/`
```text
src/next/domain/nextDossierMezzoDomain.ts:900 filter stato daFare/programmata
src/next/domain/nextManutenzioniDomain.ts:863 return records.filter(record.stato === "daFare")
src/next/writers/nextManutenzioneDaFareCreateWriter.ts:115 stato: "daFare"
```

6. `rg -n "ArchivioStorico|archivioStorico|useArchivioData" src/next/`
```text
src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:370 useArchivioData()
src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:48 export const useArchivioData
src/next/NextCentroControlloParityPage.tsx:1513 NextArchivioStoricoTab
```

7. `ls src/next/centroControllo/archivioStorico/`
```text
hooks/
rows/
styles/
ArchivioConfirmDelete.tsx
ArchivioFeed.tsx
ArchivioKebabMenu.tsx
ArchivioSubTabs.tsx
ArchivioToolbar.tsx
archivioTypes.ts
NextArchivioStoricoTab.tsx
```

## SETUP CORRENTE

- Firestore read-only eseguito entro boundary `storage/@manutenzioni`: `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:1190-1202`.
- `@manutenzioni`: 74 record totali, 18 `from-lavoro-*`, 56 originali.
- `from-lavoro-*`: 10 `daFare`, 8 `eseguita`.
- 56 record originali in `@manutenzioni`: fallback reader li classifica `eseguita`.
- `@lavori`: 18 record originali, 10 aperti, 8 eseguiti.
- Vecchi writer ancora collegati in alcune UI: `src/next/NextCentroControlloParityPage.tsx:2414-2418` chiama `createLavoroFromEvento`, che scrive `@lavori` in `src/next/nextLavoroCreateWriter.ts:168-172`.
- In `NextAutistiAdminNative`, i pulsanti chiamano ancora handler `createLavoroFrom*`, ma nel browser la funzione si ferma prima della scrittura per `shouldBlockAdminMutations()`: `src/next/autistiInbox/NextAutistiAdminNative.tsx:734-736`, `1540-1545`, `1605-1610`.
- Nuovi writer `@manutenzioni` daFare esportati ma non importati/chiamati dalla UI: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:216`, `259`, `307`.
- Stato: post-Fasi 1-4, pre-prompt 5.

## STEP 1 — CREAZIONE MANUTENZIONE DAFARE

### 1.A — Creazione MANUALE

- Pulsante manuale dedicato "Crea manutenzione daFare": NO trovato.
- Esiste `+ Nuova manutenzione` nel modulo Manutenzioni: `src/next/NextManutenzioniPage.tsx:2055-2057`.
- Quel flusso salva una manutenzione business con `saveNextManutenzioneBusinessRecord`: `src/next/NextManutenzioniPage.tsx:1515-1535`, `src/next/domain/nextManutenzioniDomain.ts:1127-1139`.
- Il payload del form non passa `stato`, `origineTipo`, `origineRefId`, `origineRefKey`: `src/next/NextManutenzioniPage.tsx:1515-1535`.
- Il sanitizer scrive `stato` solo se il payload lo contiene: `src/next/domain/nextManutenzioniDomain.ts:950-988`.
- OGGI: Giuseppe puo' creare una manutenzione manuale generica, non una `daFare` esplicita.
- POST-prompt 5: non c'e' prova nel codice attuale che venga aggiunta una UI manuale dedicata; il nuovo writer supporta `origineTipo: "manuale"` in `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:15`, `216-240`, ma non risulta collegato.
- BUCO UX A+B: manca un ingresso manuale esplicito per creare una manutenzione `daFare`.

### 1.B — Creazione da CONTROLLO KO

- Pulsante admin diretto: `src/next/autistiInbox/NextAutistiAdminNative.tsx:2767-2773`.
- Handler vecchio: `createLavoroFromControllo` in `src/next/autistiInbox/NextAutistiAdminNative.tsx:1605-1693`.
- Nel browser, prima della scrittura, il codice blocca: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1605-1610`.
- Se quel blocco non ci fosse, `appendLavori()` non scriverebbe Firestore `@lavori`, ma clone-local `@next_clone_lavori:records`: `src/next/autistiInbox/NextAutistiAdminNative.tsx:738-756`, `src/next/nextLavoriCloneState.ts:31-32`, `76-93`.
- Pulsante/modale Centro Controllo: `src/next/components/NextHomeAutistiEventoModal.tsx:760-780`, submit `530-563`.
- Wiring Centro Controllo oggi: `src/next/NextCentroControlloParityPage.tsx:2414-2418` chiama `createLavoroFromEvento`, che scrive `@lavori`: `src/next/nextLavoroCreateWriter.ts:168-172`.
- Nuovo writer pronto: `createManutenzioneDaFareFromControllo`, `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:307-380`, scrive record con `stato: "daFare"` via `buildManutenzioneDaFareRecord`: `99-129`.
- OGGI: da Centro Controllo viene creato un lavoro in `@lavori`; da AdminNative diretto il click e' bloccato nel browser.
- POST-prompt 5: il click dovrebbe passare al nuovo writer e creare `@manutenzioni` `daFare`.
- BUCO UX A: oggi i controlli KO non generano manutenzioni `daFare`; i 18 `from-lavoro-*` sono stati creati dallo script una tantum, non dalla UI.

### 1.C — Creazione da SEGNALAZIONE

- Pulsante admin diretto: `src/next/autistiInbox/NextAutistiAdminNative.tsx:2641-2648`.
- Handler vecchio: `createLavoroFromSegnalazione`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540-1603`.
- Nel browser il codice blocca prima della scrittura: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540-1545`.
- Da Centro Controllo, la modale chiama ancora `onCreateLavoro`: `src/next/components/NextHomeAutistiEventoModal.tsx:48-50`, `555-563`.
- Wiring Centro Controllo oggi: `src/next/NextCentroControlloParityPage.tsx:2414-2418` -> `createLavoroFromEvento`.
- Nuovo writer pronto: `createManutenzioneDaFareFromSegnalazione`, `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:259-305`.
- OGGI: da Centro Controllo viene creato un lavoro in `@lavori`; da AdminNative diretto il click e' bloccato nel browser.
- POST-prompt 5: il click dovrebbe creare `@manutenzioni` `daFare`.
- BUCO UX A: stessa frattura del controllo KO.

## STEP 2 — DOVE GIUSEPPE LE VEDE DOPO LA CREAZIONE

### 2.1 Home `/next`

- La card "Manutenzioni da fare" esiste: `src/next/NextHomePage.tsx:627-658`.
- La pagina legge `readNextManutenzioniDaFareSnapshot()`: `src/next/NextHomePage.tsx:16-19`, `351-355`.
- Il contatore usa la lunghezza delle daFare: `src/next/NextHomePage.tsx:381-387`.
- Mostra fino a 3 righe sintetiche: `src/next/NextHomePage.tsx:146-166`, `269-281`.
- Click card e link widget vanno solo a `/next/manutenzioni`: `src/next/NextHomePage.tsx:627-628`, `724-726`.
- Esito: SI, le 10 daFare sono contate; solo 3 sono visibili come preview; nessuna riga apre il record.
- BUCO UX A+B: Home segnala l'esistenza ma non permette apertura puntuale o completamento.

### 2.2 Modulo Manutenzioni `/next/manutenzioni`

- Legge `readNextManutenzioniDaFareSnapshot()`: `src/next/NextManutenzioniPage.tsx:770-777`.
- KPI "Manutenzioni da fare" per targa: `src/next/NextManutenzioniPage.tsx:805-818`, `968`, `2047-2050`.
- Tab Dashboard: mostra KPI e "Ultimi interventi", non una lista daFare dedicata: `src/next/NextManutenzioniPage.tsx:2017-2107`.
- Tab Nuova/Modifica: e' form di salvataggio, non lista daFare: `src/next/NextManutenzioniPage.tsx:2116-2463`.
- Tab Dettaglio: monta `NextMappaStoricoPage`, ma solo se `view === "mappa"` e c'e' targa attiva: `src/next/NextManutenzioniPage.tsx:2991-3031`.
- Tab Quadro PDF: filtra per tipo e periodo, non per `stato`: `src/next/NextManutenzioniPage.tsx:1039-1052`, `2474-2490`.
- Esito: SI per KPI; NO per lista daFare dentro il modulo.
- BUCO UX A+B: manca una lista operativa daFare con stato/azione nel modulo Manutenzioni.

### 2.3 Centro Controllo Sinottica `/next/centro-controllo`

- La pagina carica daFare con `readNextManutenzioniDaFareSnapshot()`: `src/next/NextCentroControlloParityPage.tsx:995-1012`.
- Passa i record come `lavoriAperti` alla sinottica: `src/next/NextCentroControlloParityPage.tsx:1519-1525`.
- La sinottica raggruppa per targa: `src/next/components/NextCentroControlloSinottica.tsx:556-565`.
- KPI "Manutenzioni urgenti": `src/next/components/NextCentroControlloSinottica.tsx:1518-1529`.
- Chip per riga mezzo: `src/next/components/NextCentroControlloSinottica.tsx:1278-1310`.
- Click chip singolo: chiama `onLavoroClick(first.id)` senza targa: `src/next/components/NextCentroControlloSinottica.tsx:970-974`, parent `src/next/NextCentroControlloParityPage.tsx:1730-1732`.
- Click chip multiplo: parent non apre lista; naviga al primo id con targa: `src/next/NextCentroControlloParityPage.tsx:1625-1636`.
- Esito: SI, conta/chip per mezzo; NO, non apre una lista di manutenzioni.
- BUCO UX A+B: chip singolo puo' arrivare a `/next/manutenzioni?recordId=...` senza targa; chip multiplo non mostra elenco, apre solo il primo.

### 2.4 Centro Controllo Archivio Storico, tab Archivio

- Il feed legge `readNextManutenzioniLegacyDataset()`: `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:12-14`, `58-68`.
- I record `@manutenzioni` diventano tab `Manutenzioni`: `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:75-80`, `110-115`.
- Tab disponibili: `Lavori`, `Manutenzioni`, `Segnalazioni`, `Richieste`: `src/next/centroControllo/archivioStorico/ArchivioSubTabs.tsx:26-30`.
- I record `@lavori` non sono caricati nel feed archivio: `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:110-112`.
- Filtri disponibili: Autista, Targa, search, periodo: `src/next/centroControllo/archivioStorico/ArchivioToolbar.tsx:136-168`, `205-267`.
- Il filtro Autista e' ignorato per manutenzioni: `src/next/centroControllo/archivioStorico/hooks/useArchivioFilters.ts:146-151`, `251-271`.
- Filtro per stato: NO trovato.
- Filtro per origine: NO trovato.
- Riga manutenzione hardcoded come timeline Aperta/Eseguita nello stesso timestamp: `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:142-154`.
- PDF archivio hardcoded `statoLabel: "Eseguita"`: `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:238-263`.
- Esito: SI, i 18 `from-lavoro-*` sono nella sorgente tab Manutenzioni salvo filtri/hide; NO, non sono filtrabili per stato/origine e le daFare sono rappresentate come eseguite.
- BUCO UX A+B: Archivio misrappresenta lo stato daFare e non offre filtri stato/origine.

### 2.5 Dossier Mezzo `/next/dossier-mezzo/<targa>`

- Il dominio legge `readNextMezzoManutenzioniSnapshot(targa)`: `src/next/domain/nextDossierMezzoDomain.ts:760-778`.
- Le manutenzioni `daFare` e `programmata` finiscono in `lavoriInAttesa`: `src/next/domain/nextDossierMezzoDomain.ts:899-909`.
- La sezione "Manutenzioni" mostra colonne "Da fare" e "Eseguite": `src/next/NextDossierMezzoPage.tsx:551-554`.
- Il modale "Manutenzioni da fare" mostra tutte le pending del mezzo: `src/next/NextDossierMezzoPage.tsx:571-584`.
- Click riga apre `/next/manutenzioni?targa=...&recordId=...`: `src/next/NextDossierMezzoPage.tsx:389-394`.
- PDF Dossier include `lavoriInAttesa` e `lavoriEseguiti`: `src/next/NextDossierMezzoPage.tsx:284-290`; il motore PDF rende stato "DA FARE"/"ESEGUITA": `src/utils/pdfEngine.ts:2224-2247`.
- Esito: SI, mostra daFare del mezzo e le include nel PDF.
- Limite: `programmata` viene aggregata sotto "Da fare", senza badge distinto.

### 2.6 Pagina vecchia `/next/lavori-in-attesa`

- Route ancora viva: `src/App.tsx:38-41`, `378-400`.
- Pagina `/next/lavori-in-attesa` monta `NextLavoriUnifiedDashboard`: `src/next/NextLavoriInAttesaPage.tsx:1-4`.
- Legge ancora `@lavori`: `src/next/NextLavoriDaEseguirePage.tsx:51`, `192-195`.
- Filtra aperti con `isLavoroInAttesaGlobal`: `src/next/NextLavoriDaEseguirePage.tsx:305-314`.
- Firestore read-only: `@lavori` ha 18 record, 10 aperti, 8 eseguiti.
- Esito: `/next/lavori-in-attesa` mostra i 10 lavori aperti originali; gli 8 eseguiti sono su `/next/lavori-eseguiti`.
- POST-prompt 5: la SPEC prevede rimozione route vecchie: `docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md:361-383`.

### 2.7 Altre superfici

- Internal AI Mezzo Card mostra "Lavori aperti", "Lavori chiusi", "Manutenzioni" da D02: `src/next/internal-ai/InternalAiMezzoCard.tsx:182-190`.
- La card mostra liste ma non stato `daFare`/`programmata` e non azioni: `src/next/internal-ai/InternalAiMezzoCard.tsx:193-245`.
- Il reader D02 usato dalla card e' ora basato su `@manutenzioni`: `src/next/nextOperativitaTecnicaDomain.ts:1-8`, `140-166`.
- La registry backend Chat IA conserva ancora `work.lavori` su `@lavori`: `backend/internal-ai/server/lib/registry.config.js:372-379`.
- Analytics Chat IA puo' ancora generare route verso `/next/dettagliolavori` o `/next/lavori-*`: `src/next/chat-ia/agents/analytics.ts:53-58`.
- BUCO UX B/debito: superfici IA possono mantenere nomenclatura e routing "lavori" non coerenti con la futura dismissione completa.

## STEP 3 — APERTURA DI UNA MANUTENZIONE DAFARE

- Pagina dettaglio manutenzione standalone analoga a `/next/dettagliolavori`: NO trovata.
- Il dettaglio reale e' embedded nel tab `Dettaglio` di `/next/manutenzioni`: `src/next/NextManutenzioniPage.tsx:2991-3031`, `src/next/NextMappaStoricoPage.tsx:632-656`.
- La query `recordId` funziona solo se c'e' anche `targa`: `src/next/NextManutenzioniPage.tsx:1216-1249`.
- Home: click porta solo a `/next/manutenzioni`, non al record: `src/next/NextHomePage.tsx:627-628`, `724-726`.
- Dossier Mezzo: apre con `targa` + `recordId`, quindi percorso corretto: `src/next/NextDossierMezzoPage.tsx:389-394`.
- Centro Controllo chip singolo: passa solo `recordId`, quindi non seleziona il record in modo affidabile: `src/next/NextCentroControlloParityPage.tsx:1730-1732`.
- Centro Controllo chip multiplo: apre il primo record con targa, ma non una lista: `src/next/NextCentroControlloParityPage.tsx:1625-1636`.
- Archivio: menu "Apri dettaglio" passa solo `recordId`: `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:103-108`.
- Origine controllo/segnalazione: Firestore ha `origineRefId` e `origineRefKey` su 17/18 migrati, ma nessuna UI renderizza o apre l'origine.
- BUCO UX A+B: apertura incompleta da Home/Archivio/Sinottica; manca una pagina dettaglio autonoma e manca "vedi origine".

## STEP 4 — COMPLETAMENTO DI UNA MANUTENZIONE DAFARE

- Pulsante esplicito "Esegui" / "Completa": NO trovato.
- Azione disponibile nel dettaglio embedded: `Modifica`, `src/next/NextMappaStoricoPage.tsx:645-652`, collegata a `handleEdit`: `src/next/NextManutenzioniPage.tsx:3027-3030`, `1394-1422`.
- Il salvataggio riscrive il record con `saveNextManutenzioneBusinessRecord`: `src/next/NextManutenzioniPage.tsx:1515-1535`.
- Il salvataggio non passa `stato`, `dataEsecuzione`, `eseguitoDa`, `origine*`: `src/next/NextManutenzioniPage.tsx:1515-1535`.
- `saveNextManutenzioneBusinessRecord` rimuove il record vecchio e inserisce il nuovo: `src/next/domain/nextManutenzioniDomain.ts:1127-1139`.
- Lo stato viene poi ricavato dal fallback: se ci sono `data`, `km/ore`, `fornitore/eseguito/importo`, allora `eseguita`: `src/next/domain/nextManutenzioniDomain.ts:497-515`.
- `dataEsecuzione` non viene valorizzata dal form; il campo usato e' `data`: `src/next/NextManutenzioniPage.tsx:2157-2163`.
- `km/ore` e `fornitore` sono campi form: `src/next/NextManutenzioniPage.tsx:2165-2190`.
- `importo` non e' nel form; se payload non lo passa, il sanitizer scrive `importo: null`: `src/next/domain/nextManutenzioniDomain.ts:993`.
- BUCO UX A+B: completamento possibile solo come modifica indiretta e fallback di stato, non come transizione esplicita daFare -> eseguita.

## STEP 5 — VISIBILITA' STATO IN OGNI LISTA/TABELLA

- Home: mostra urgenza, non stato: `src/next/NextHomePage.tsx:269-281`.
- Manutenzioni Dashboard: non mostra badge stato negli "Ultimi interventi": `src/next/NextManutenzioniPage.tsx:2074-2101`.
- Manutenzioni PDF: nessun filtro stato; filtra tipo/periodo: `src/next/NextManutenzioniPage.tsx:1039-1052`.
- Sinottica: chip mostra numero e urgenza, non stato: `src/next/components/NextCentroControlloSinottica.tsx:1278-1310`.
- Archivio: mostra timeline Aperta/Eseguita hardcoded e PDF "Eseguita": `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx:142-154`, `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx:238-263`.
- Dossier: mostra badge "DA FARE" / "ESEGUITA": `src/next/NextDossierMezzoPage.tsx:551-554`, `571-584`.
- Filtri stato disponibili: nessuno trovato su Home, Manutenzioni, Sinottica, Archivio; solo separazione Dossier per "Da fare" e "Eseguite".

## STEP 6 — TRACCIABILITA' ORIGINE

- Il reader conserva i campi `origineTipo`, `origineRefId`, `origineRefKey`: `src/next/domain/nextManutenzioniDomain.ts:597-623`.
- Il writer li scrive: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:99-129`.
- Firestore read-only sui 18 migrati: `origineTipo` = 15 segnalazione, 2 controllo, 1 null; `origineRefId` e `origineRefKey` presenti su 17/18.
- Ricerca UI: nessun uso dei campi `origineTipo/origineRefId/origineRefKey` fuori da domain/writer.
- Una manutenzione `from-lavoro-*` si distingue oggi solo per id interno, non visivamente.
- BUCO UX A+B: nessuna UI mostra "creato da controllo", "creato da segnalazione" o "migrato da lavoro storico"; nessuna apertura dell'origine.

## STEP 7 — STATO POST-PROMPT 5

- La SPEC prevede che i tre writer oggi diretti a `@lavori` vengano sostituiti da writer `@manutenzioni` con `stato: "daFare"`: `docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md:17`.
- Prompt 5 deve rimuovere vecchie route/pagine Lavori: `docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md:361-383`.
- Dopo prompt 5, se il wiring verra' sostituito, Centro Controllo e modali non dovrebbero piu' creare `@lavori`.
- Restano buchi B indipendenti dal solo repoint writer: lista daFare nel modulo, apertura record senza targa, completamento esplicito, filtri stato/origine, tracciabilita' origine.
- Le superfici IA con `work.lavori` restano debito dichiarato finche' non vengono pulite: `docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md:49`, `backend/internal-ai/server/lib/registry.config.js:372-379`.

## RIEPILOGO BUCHI UX TROVATI

| # | Buco | Superficie | A=oggi / B=post-5 | Criticita' | Descrizione 1 riga |
|---|------|-----------|-------------------|------------|---------------------|
| 1 | Creazione manuale daFare assente | Manutenzioni | A+B | Alta | Il form crea manutenzione generica, non `stato: daFare` esplicito. |
| 2 | AdminNative "CREA LAVORO" visibile ma bloccato | Autisti Admin | A | Alta | Il click entra nel vecchio handler ma `shouldBlockAdminMutations()` ferma la scrittura. |
| 3 | Centro Controllo crea ancora `@lavori` | Modale evento | A | Critica | `onCreateLavoro` chiama `createLavoroFromEvento`, non il writer manutenzione. |
| 4 | Home non apre record specifico | Home | A+B | Media | Conta/preview daFare, ma naviga solo al modulo generico. |
| 5 | Lista daFare mancante nel modulo | Manutenzioni | A+B | Critica | Esiste solo KPI per targa, non una lista operativa filtrabile. |
| 6 | `recordId` senza `targa` non apre dettaglio | Archivio/Sinottica | A+B | Critica | La pagina usa `recordId` solo con `targa`; alcuni ingressi passano solo id. |
| 7 | Archivio misrappresenta stato | Archivio Storico | A+B | Critica | Riga/PDF manutenzione indicano "Eseguita" anche per `daFare`. |
| 8 | Filtri stato/origine assenti | Archivio/Manutenzioni | A+B | Alta | Nessuna superficie principale filtra `daFare/programmata/eseguita` o origine. |
| 9 | Quadro PDF senza stato e fragile per data nulla | Manutenzioni PDF | B | Alta | Nuovi daFare con `data: null` rischiano di sparire dal filtro periodo default. |
| 10 | Programmate fuse con Da fare | Dossier | B | Media | `programmata` e `daFare` finiscono entrambe nel gruppo "Da fare". |
| 11 | Completamento non esplicito | Manutenzioni | A+B | Critica | Si completa solo modificando e affidandosi al fallback di stato. |
| 12 | Origine non visibile/apribile | Tutte | A+B | Alta | I campi origine ci sono nei dati ma non nella UI. |
| 13 | Vecchie pagine Lavori ancora vive | `/next/lavori-*` | A | Alta | I 18 record `@lavori` restano consultabili separatamente dalla nuova manutenzione. |
| 14 | Debito IA su nomenclatura/routing lavori | Chat IA / Internal AI | B | Media | Alcune superfici restano su `work.lavori` o route `/next/lavori-*`. |

## CONCLUSIONI

- Buchi A oggi, pre-prompt 5: 10.
- Buchi B futuri, da affrontare dopo prompt 5: 11.
- Buchi pre-esistenti alla dismissione, non causati dalle Fasi 1-4: 4.
- Stato del flusso oggi: i record `from-lavoro-*` migrati sono leggibili in Home, Sinottica, Archivio, Dossier e Manutenzioni, ma il journey non e' end-to-end per apertura, stato, origine e completamento.
- Stato post-prompt 5: il repoint dei writer risolve la creazione futura, ma non chiude i buchi UX di visibilita' e azione.

## PROPOSTA NEXT STEPS

1. Prompt 5: ricollegare/rimuovere i vecchi flussi `@lavori` e dismettere le route Lavori come da SPEC.
2. Prompt audit/patch Manutenzioni: introdurre una vista operativa daFare con filtri stato/origine e apertura record.
3. Prompt apertura dettaglio: rendere robusto `/next/manutenzioni?recordId=...` anche quando manca `targa`, oppure riallineare tutti i chiamanti.
4. Prompt Archivio Storico: distinguere stato reale e origine nelle righe/PDF/filtri.
5. Prompt completamento: definire e verificare la transizione utente da `daFare` a `eseguita`.
6. Prompt tracciabilita' origine: rendere consultabile il controllo/segnalazione origine dove `origineRef*` esiste.
7. Prompt IA/debito Categoria F: riallineare registry, analytics e card IA alla dismissione `@lavori`.

## STATO FIRESTORE

- Letture eseguite: `storage/@manutenzioni` e `storage/@lavori`, exact document, tramite boundary read-only.
- Cosa cercavo: conteggio record `from-lavoro-*`, stati `daFare/eseguita`, record originali, origine dei migrati, conteggio `@lavori`.
- Cosa ho trovato: `@manutenzioni` 74 totali; 18 `from-lavoro-*`; 10 `daFare`; 8 `eseguita`; 56 originali fallback `eseguita`; `@lavori` 18 totali, 10 aperti e 8 eseguiti; 17/18 migrati con `origineRefId/origineRefKey`.
- Cosa NON ho trovato: nessun uso UI dei campi origine; nessun filtro UI per stato/origine; nessuna pagina dettaglio manutenzione standalone.
- Collection adiacenti non estese: nessuna estensione boundary eseguita; `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` citate solo come origine gia' prevista dai writer.
- Conclusione operativa: asserzioni confermate.
- Firestore confermato invariato da questo audit: zero scritture Firestore, zero script di migrazione, zero build/lint.
