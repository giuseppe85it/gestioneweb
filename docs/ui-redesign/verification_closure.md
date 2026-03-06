# Verification Closure - UI/Flows

Data verifica: 2026-03-05  
Ambito: sola analisi codice (`src/` read-only), nessuna modifica logica applicativa.

## 1) Documenti nel DossierMezzo - VERIFICATO

### Esito
- `DossierMezzo` usa collezioni Firestore reali con nome esplicito: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
- Il prefisso `@documenti_` viene anche usato come check logico per instradare la cancellazione (non come wildcard query).
- Query su collezioni senza `@` (`documenti_mezzi`, `documenti_magazzino`, `documenti_generici`): **NON TROVATO**.

### Prove
- `src/pages/DossierMezzo.tsx` - funzione `loadData` (useEffect): definisce `iaCollections` con le 3 collezioni e interroga con `collection(db, col)` + `getDocs`.
- `src/pages/DossierMezzo.tsx` - funzione `loadData` (blocco documenti magazzino): query diretta `collection(db, "@documenti_magazzino")`.
- `src/pages/DossierMezzo.tsx` - funzione `deletePreventivo`: usa `p.sourceKey.startsWith("@documenti_")` e poi `deleteDoc(doc(db, p.sourceKey, docId))`.
- Campi usati in filtro/merge: `tipoDocumento`, `targa`, `fornitore`, `dataDocumento`, `totaleDocumento`, `fileUrl`, `id/docId`.

### Impatto UI (redesign)
- La UI Dossier deve mantenere la provenienza documento (source collection) nel modello vista.
- Filtri e badge documento devono essere allineati al filtro reale: solo `FATTURA`/`PREVENTIVO` + match targa normalizzata.
- L'azione elimina deve conservare `sourceKey/sourceDocId`, altrimenti non e possibile puntare il record corretto.

## 2) Eventi Autisti - INCOERENTE

### Esito
- Flusso realmente usato da pagine Autisti/Admin/Home: `@storico_eventi_operativi`.
- Esiste anche `autisti_eventi` (Firestore collection), ma risulta solo in una funzione non collegata alle schermate correnti.
- Chiamate a `loadFirestoreAutistiEventi(...)`: **NON TROVATO**.

### Prove
- `src/utils/homeEvents.ts` - funzione `loadHomeEvents`: legge `@storico_eventi_operativi` (`getItemSync(KEY_STORICO_EVENTI_OPERATIVI)`).
- `src/autisti/LoginAutista.tsx` - `appendEventoOperativo` + `handleLogin`: scrittura evento login su `@storico_eventi_operativi`.
- `src/autisti/SetupMezzo.tsx` - `appendEventoOperativo` + setup assetto: scrittura `INIZIO_ASSETTO/CAMBIO_ASSETTO`.
- `src/autisti/HomeAutista.tsx` - `appendEventoOperativo` + `handleLogout`/`handleSgancioMotriceConfirm`: scrittura eventi operativi.
- `src/autisti/CambioMezzoAutista.tsx` - `appendEventoOperativo` + `conferma`: scrittura cambio assetto.
- `src/autistiInbox/AutistiAdmin.tsx` - `saveCanonEdit`/`deleteCanonEvent`: modifica/cancellazione nello stesso stream.
- Lettura UI:
  - `src/pages/Home.tsx` (`EVENTI_KEY`)
  - `src/autistiInbox/AutistiInboxHome.tsx`
  - `src/autistiInbox/AutistiLogAccessiAll.tsx`
  - `src/pages/Autista360.tsx`
  - `src/pages/Mezzo360.tsx`
- `src/utils/homeEvents.ts` - funzione `loadFirestoreAutistiEventi`: query `collection(db, "autisti_eventi")`.

### Impatto UI (redesign)
- Dashboard eventi e timeline devono avere una sola sorgente canonica dichiarata.
- Le azioni admin di rettifica devono essere comunicate come modifica dello stream operativo unico.
- Il copy UI deve evitare ambiguita su "eventi autisti" vs "storico operativo".

### Suggerimento standard
- Definire in documentazione un canale canonicale unico per eventi autisti.
- Trattare `autisti_eventi` come legacy/deprecato finche non esiste migrazione esplicita.
- Allineare journey e inventory alla sola sorgente effettivamente letta dalle schermate attive.

## 3) Schema record `@manutenzioni` e `@attrezzature_cantieri` - VERIFICATO

### Esito
- Shape e campi sono deducibili da tipi TS + validazioni + writer effettivi.
- Obbligatorieta dedotta dal codice UI client (non risulta uno schema server-side vincolante nel repo).

### Prove
- `@manutenzioni`:
  - `src/pages/Manutenzioni.tsx` - interfaccia `VoceManutenzione`.
  - `src/pages/Manutenzioni.tsx` - funzione `handleAdd`: costruzione record e scrittura.
  - `src/pages/Manutenzioni.tsx` - funzione `persistStorico`: normalizzazione (`km/ore/sottotipo/eseguito -> null`) e `setItemSync`.
  - `src/components/AutistiEventoModal.tsx` - funzione `appendGommeManutenzione`: writer aggiuntivo con shape parziale ma compatibile.
  - Letture principali: `src/pages/DossierMezzo.tsx`, `src/pages/Mezzo360.tsx`, `src/pages/GestioneOperativa.tsx`, `src/pages/GommeEconomiaSection.tsx`.
- `@attrezzature_cantieri`:
  - `src/pages/AttrezzatureCantieri.tsx` - type `Movimento`.
  - `src/pages/AttrezzatureCantieri.tsx` - funzione `handleSave`: validazioni campi + creazione record.
  - `src/pages/AttrezzatureCantieri.tsx` - funzione `handleEditSave`: update record coerente con stesso shape.
  - Lettori fuori `AttrezzatureCantieri.tsx`: **NON TROVATO**.

### Campi dedotti (obbligatori/opzionali)
- `@manutenzioni`
  - Obbligatori (writer attivi): `id`, `targa`, `tipo`, `descrizione`, `data`.
  - Opzionali: `km`, `ore`, `sottotipo`, `eseguito`, `fornitore`, `materiali[]`.
- `@attrezzature_cantieri`
  - Obbligatori (validati in `handleSave/handleEditSave`): `id`, `tipo`, `data`, `materialeCategoria`, `descrizione`, `quantita`, `unita`, `cantiereId/cantiereLabel`.
  - Opzionali: `note`, `fotoUrl`, `fotoStoragePath`, `sourceCantiereId`, `sourceCantiereLabel`.

### Impatto UI (redesign)
- I form devono distinguere chiaramente campi minimi obbligatori e campi opzionali avanzati.
- Le tabelle/liste devono tollerare record legacy con campi opzionali null/mancanti.
- Le validazioni in UI vanno allineate ai writer reali, non solo ai tipi visuali.

## 4) Allegati preventivi in Acquisti - INCOERENTE

### Esito
- Sono attivi piu pattern Storage:
  - IA: `preventivi/ia/{extractionId}.pdf` e `preventivi/ia/{extractionId}_{idx}.{ext}`.
  - Manuale/fallback: `preventivi/{id}.pdf`.
- Non emerge un pattern unico "definitivo"; entrambi sono usati in funzioni operative correnti.

### Prove
- `src/pages/Acquisti.tsx` - funzione `runEstrazioneIA`: upload PDF/foto su `preventivi/ia/...`.
- `src/pages/Acquisti.tsx` - funzione `salvaNuovoPreventivo`: se upload manuale salva su `preventivi/{id}.pdf`; se IA riusa `iaUploadedRefs`.
- `src/pages/Acquisti.tsx` - funzione `salvaModifiche`: fallback `draft.pdfStoragePath || preventivi/{draft.id}.pdf`.
- `src/pages/Acquisti.tsx` - funzioni `loadIaStorageFiles` / `loadIaOrphanFiles`: gestione cartella `preventivi/ia`.

### Impatto UI (redesign)
- La UI allegati deve gestire esplicitamente sorgente documento (`IA` vs `manuale`).
- Le azioni anteprima/download devono usare resolver uniforme per path misti.
- Il cleanup allegati deve evitare cancellazioni errate distinguendo path IA da path manuali.

### Suggerimento standard
- Definire un contratto unico di naming/path con campo `sourceType`.
- Mantenere un layer di compatibilita in lettura per i path legacy gia salvati.
- Rendere visibile in UI il tipo di allegato e la sua origine di caricamento.

## 5) Ruoli/permessi e route legacy - INCOERENTE

### Esito
- Controlli di accesso applicativi espliciti rilevati solo nel dominio Autisti (`AutistiGate` + stato sessione locale/live).
- Guard ruolo Admin/Capo su routing generale: **NON TROVATO**.
- Route legacy/alias e bookmark query sono presenti e attivi, senza redirect canonico univoco.

### Prove
- `src/App.tsx` - definizione route: esposizione diretta route Admin/Capo/Autisti senza wrapper di ruolo dedicato.
- `src/autisti/AutistiGate.tsx` - funzione `checkFlow`: login/setup/controllo obbligatorio/revoca per percorso Autisti.
- Alias dossier:
  - `src/App.tsx`: `/dossiermezzi/:targa` e `/dossier/:targa` puntano entrambi a `DossierMezzo`.
- Alias dettaglio ordini/acquisti:
  - `src/App.tsx`: `/acquisti/dettaglio/:ordineId` e `/dettaglio-ordine/:ordineId`.
  - `src/pages/Acquisti.tsx` - `openDettaglio`: naviga su `/acquisti/dettaglio/...`.
  - `src/pages/OrdiniArrivati.tsx` e `src/pages/OrdiniInAttesa.tsx` - `openDettaglio`: navigano su `/dettaglio-ordine/...`.
- Bookmark/query state:
  - `src/pages/Acquisti.tsx` usa `useSearchParams` (`tab`).
  - `src/pages/Autista360.tsx` usa `useSearchParams` (`nome`).

### Impatto UI (redesign)
- La separazione visuale Admin/Autisti non puo essere trattata come sicurezza finche non c'e un gate ruolo esplicito.
- La nuova sitemap deve dichiarare URL canoniche e alias supportati per evitare deep-link rotti.
- Filtri/tab da query string devono restare stabili per compatibilita bookmark.

### Suggerimento standard
- Formalizzare una matrice accessi per area (Admin/Capo/Autista) e associarla alle route.
- Scegliere una route canonica per ogni dettaglio e mantenere alias con redirect controllato.
- Documentare i query param supportati (es. `tab`, `nome`) come contratto di navigazione.
