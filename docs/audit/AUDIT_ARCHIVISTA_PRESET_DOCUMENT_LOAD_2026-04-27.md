# AUDIT ARCHIVISTA PRESET DOCUMENT LOAD — 2026-04-27

## 0. RIASSUNTO TOP-LINE
- Preset attuale: `{ tipo?: "fattura_ddt" | "preventivo" | "documento_mezzo"; contesto?: "magazzino" | "manutenzione" | "documento_mezzo" }`
- Archivista legge preset a: `src/next/NextIAArchivistaPage.tsx:194-202`
- Archivista carica documenti tramite: input file locale nei bridge, poi `File` -> base64 -> analisi
- Reader storico per id esistente: no; esiste solo snapshot lista `readNextIADocumentiArchiveSnapshot` a `src/next/domain/nextDocumentiCostiDomain.ts:1925`
- Opzione minima consigliata: B
- File da modificare: `src/next/NextIADocumentiPage.tsx`, `src/next/NextIAArchivistaPage.tsx`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`, `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`

## 1. STATO ATTUALE PRESET

`NextIAArchivistaPage` definisce il preset come struttura limitata a tipo flusso e contesto:

| Campo | Tipo | Prova |
|---|---|---|
| `tipo` | `"fattura_ddt" | "preventivo" | "documento_mezzo"` | `src/next/NextIAArchivistaPage.tsx:13-19` |
| `contesto` | `"magazzino" | "manutenzione" | "documento_mezzo"` | `src/next/NextIAArchivistaPage.tsx:15-19` |

La funzione `normalizePreset` accetta solo `tipo` e `contesto`, applica default e valida il contesto rispetto al tipo documento. Non legge id documento, URL, file name o record storico: `src/next/NextIAArchivistaPage.tsx:140-151`.

`NextIAArchivistaPage` legge il preset da `location.state` e inizializza gli state `tipoDocumento` e `contesto`:

| Uso | Prova |
|---|---|
| `useLocation()` | `src/next/NextIAArchivistaPage.tsx:194` |
| cast `location.state` a `ArchivistaNavigationState` | `src/next/NextIAArchivistaPage.tsx:195` |
| `normalizePreset(navigationState?.archivistaPreset)` | `src/next/NextIAArchivistaPage.tsx:196-198` |
| `useState<ArchivistaTipo>(normalizedPreset.tipo)` | `src/next/NextIAArchivistaPage.tsx:201` |
| `useState<ArchivistaContesto>(normalizedPreset.contesto)` | `src/next/NextIAArchivistaPage.tsx:202` |

`NextIADocumentiPage` costruisce il preset da uno storico documento IA:

| Tipo documento rilevato | Preset prodotto | Prova |
|---|---|---|
| `libretto` | `{ tipo: "documento_mezzo", contesto: "documento_mezzo" }` | `src/next/NextIADocumentiPage.tsx:213-217` |
| `preventivo` | `{ tipo: "preventivo", contesto: "magazzino" }` | `src/next/NextIADocumentiPage.tsx:218-220` |
| altri documenti | `{ tipo: "fattura_ddt", contesto: "magazzino" }` | `src/next/NextIADocumentiPage.tsx:221-223` |

Il click "Riapri review" passa il preset via `navigate(..., { state: { archivistaPreset: buildArchivistaPreset(item) } })`: `src/next/NextIADocumentiPage.tsx:457-464`. La stessa struttura è usata dal pulsante nel dettaglio modale: `src/next/NextIADocumentiPage.tsx:913-918`.

## 2. CARICAMENTO DOCUMENTO IN ARCHIVISTA

Archivista oggi carica documenti dai bridge tramite input file locale. Non risulta un percorso di caricamento automatico da storico documento IA.

Nel bridge documento mezzo:

| Punto | Prova |
|---|---|
| props attuali del bridge: solo `destinationOptions` e `onSelectDestination` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1630-1633` |
| state locale `selectedFile` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1647` |
| analisi bloccata senza file | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2030-2034` |
| conversione immagine/PDF da `selectedFile` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2053-2086` |
| payload analisi libretto contiene `fileName: selectedFile.name` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2114` |
| upload/review UI passa `onFileSelect` che chiama `setSelectedFile(nextFile)` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2626-2629` |
| upload generico usa input `type="file"` e `setSelectedFile(nextFile)` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2854-2872` |

Negli altri bridge Archivista il pattern è lo stesso:

| Bridge | File state | Analisi | Input/upload |
|---|---:|---:|---:|
| Magazzino fattura/DDT | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:91` | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:177-196` | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:365-380` |
| Preventivo magazzino | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:83` | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:157-188` | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:318-336` |
| Manutenzione fattura/DDT | `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:394` | `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:632-657` | `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:933-986` |
| Preventivo manutenzione | `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:287` | `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:485-506` | `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:679-732` |

Non sono stati trovati match in `src/next/internal-ai` per `loadDocumento`, `loadDocument` o `fetchDocumento`. Questo audit non ha trovato una funzione esistente che carica un documento storico dentro i bridge Archivista.

## 3. INTEGRAZIONE STORICO DOCUMENTI

Lo storico documenti IA è letto da `NextIADocumentiPage` tramite `readNextIADocumentiArchiveSnapshot`: import a `src/next/NextIADocumentiPage.tsx:11`, chiamata a `src/next/NextIADocumentiPage.tsx:314`.

La shape dello storico è `NextIADocumentiArchiveItem`:

| Campo | Prova |
|---|---|
| `id` | `src/next/domain/nextDocumentiCostiDomain.ts:1357` |
| `sourceKey` | `src/next/domain/nextDocumentiCostiDomain.ts:1358` |
| `sourceDocId` | `src/next/domain/nextDocumentiCostiDomain.ts:1359` |
| `tipoDocumento` | `src/next/domain/nextDocumentiCostiDomain.ts:1360` |
| `categoriaArchivio` | `src/next/domain/nextDocumentiCostiDomain.ts:1361` |
| `targa` | `src/next/domain/nextDocumentiCostiDomain.ts:1362` |
| `fileUrl` | `src/next/domain/nextDocumentiCostiDomain.ts:1367` |
| `testo` | `src/next/domain/nextDocumentiCostiDomain.ts:1370` |
| `numeroDocumento` | `src/next/domain/nextDocumentiCostiDomain.ts:1374` |

La mappatura da record Firestore allo storico normalizza `sourceKey`, `sourceDocId`, `tipoDocumento`, `targa` e `fileUrl`: `src/next/domain/nextDocumentiCostiDomain.ts:1417-1448`.

Il reader disponibile è lista/snapshot:

| Funzione | Prova |
|---|---|
| `readNextIADocumentiArchiveSnapshot(...)` | `src/next/domain/nextDocumentiCostiDomain.ts:1925-1975` |

Non è stata trovata una funzione dedicata `readArchivistaDocumentoById`, `readNextIADocumentoById` o equivalente per leggere un singolo storico documento tramite `sourceDocId`.

Il vecchio flusso IA interna gestisce la riapertura usando parametri URL, non il preset Archivista: legge `reviewDocumentId` e `reviewSourceKey` da query string a `src/next/NextInternalAiPage.tsx:4489-4500`, poi cerca il documento nella lista storico già caricata a `src/next/NextInternalAiPage.tsx:8323-8367`. Questo non precarica un `File` nei bridge Archivista.

Per riaprire una review dentro Archivista con il pipeline attuale, il dato minimo dimostrato dal codice è un file utilizzabile come `File`, perché tutti i bridge analizzano `selectedFile` o `selectedFiles`. Lo storico contiene già `fileUrl`; non contiene un `File` browser serializzabile.

## 4. PUNTO DI ESTENSIONE MINIMO

### Opzione A — preset con `documentId` opzionale + reader esistente

Fattibilità: parziale.

Fatti di codice:
- Lo storico espone `sourceDocId` e `sourceKey`: `src/next/domain/nextDocumentiCostiDomain.ts:1358-1359`.
- Non è stato trovato un reader by-id esistente.
- Esiste solo `readNextIADocumentiArchiveSnapshot(...)`, che produce la lista completa: `src/next/domain/nextDocumentiCostiDomain.ts:1925-1975`.

Con questa opzione servirebbe aggiungere un reader by-id o riusare lo snapshot lista per cercare il record. Poi servirebbe comunque convertire `fileUrl` in `File` perché i bridge non accettano direttamente un documento storico.

### Opzione B — preset con URL file

Fattibilità: sì, basata sui campi già presenti nello storico.

Fatti di codice:
- `NextIADocumentiArchiveItem` contiene `fileUrl`: `src/next/domain/nextDocumentiCostiDomain.ts:1367`.
- La pagina `/next/ia/documenti` già disabilita azioni file se `fileUrl` manca e usa `window.open(item.fileUrl, ...)`: `src/next/NextIADocumentiPage.tsx:441-444`, `src/next/NextIADocumentiPage.tsx:893-898`.
- I bridge Archivista richiedono `File`, quindi il preload via URL deve recuperare il file e costruire un `File` prima di chiamare la stessa logica oggi legata all'input.

Questa opzione non richiede reader storico aggiuntivo se `NextIADocumentiPage` passa nel preset un oggetto minimo con `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa` e un nome file derivabile.

### Opzione C — preset con documento intero

Fattibilità: sì, ma più accoppiata.

Fatti di codice:
- `NextIADocumentiPage` ha già l'intero `NextIADocumentiArchiveItem` nel click handler: `src/next/NextIADocumentiPage.tsx:457-464`.
- Passare l'intero item eviterebbe una rilettura, ma accoppierebbe `NextIAArchivistaPage` e i bridge alla shape completa del domain `nextDocumentiCostiDomain`.
- Anche con l'item intero resta necessario trasformare `fileUrl` in `File`.

### Opzione D — altro

Non necessaria per il cambio minimo. Non è stato trovato nel codice un meccanismo già pronto diverso da preset state, snapshot storico e upload `File`.

### Opzione consigliata

Opzione B.

Motivazione di codice: lo storico ha già `fileUrl` (`src/next/domain/nextDocumentiCostiDomain.ts:1367`) e il click "Riapri review" ha già l'item corrente (`src/next/NextIADocumentiPage.tsx:457-464`). Non è necessario introdurre un reader by-id per il primo incremento; serve estendere il preset e fare il preload URL -> `File` nei bridge montati dal preset.

File minimi da modificare per coprire i preset attualmente prodotti da `buildArchivistaPreset`:

1. `src/next/NextIADocumentiPage.tsx` — aggiungere dati documento minimi nel preset.
2. `src/next/NextIAArchivistaPage.tsx` — estendere type preset, leggere il payload preload e passarlo al bridge corretto.
3. `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` — ricevere preload file per `documento_mezzo` / libretto.
4. `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` — ricevere preload file per fattura/DDT magazzino.
5. `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` — ricevere preload file per preventivo magazzino.

Nota fattuale: `buildArchivistaPreset` oggi non produce contesto `manutenzione`, quindi i bridge manutenzione non sono necessari per il percorso "Riapri review" attuale da `/next/ia/documenti`. Se in futuro il preset instrada documenti verso manutenzione, andrebbero estesi anche `ArchivistaManutenzioneBridge.tsx` e `ArchivistaPreventivoManutenzioneBridge.tsx`.

## 5. RISCHI

Parti da toccare nell'opzione B:

| Area | File:riga | Rischio tecnico |
|---|---|---|
| Shape preset in partenza | `src/next/NextIADocumentiPage.tsx:213-223` | aggiungere payload documento senza rompere `tipo`/`contesto` |
| Navigate con state | `src/next/NextIADocumentiPage.tsx:457-464`, `src/next/NextIADocumentiPage.tsx:913-918` | mantenere lo stesso path `/next/ia/archivista` |
| Type preset e normalize | `src/next/NextIAArchivistaPage.tsx:17-24`, `src/next/NextIAArchivistaPage.tsx:140-151` | preservare default esistenti quando il preset non contiene preload |
| Mount bridge documento mezzo | `src/next/NextIAArchivistaPage.tsx:220-230`, `src/next/NextIAArchivistaPage.tsx:304-315` | passare preload solo al bridge corretto |
| Bridge documento mezzo | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1630-1647` | aggiungere prop e inizializzazione `selectedFile` senza alterare l'upload manuale |
| Bridge magazzino | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:90-91` | aggiungere prop e inizializzazione `selectedFile` |
| Bridge preventivo magazzino | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:82-83` | aggiungere prop e inizializzazione `selectedFile` |

Casi edge rilevati dal codice:

| Caso | Gestione attuale trovata |
|---|---|
| `fileUrl` assente | `/next/ia/documenti` disabilita/apre solo se presente: `src/next/NextIADocumentiPage.tsx:740-747`, `src/next/NextIADocumentiPage.tsx:893-898` |
| URL non scaricabile o Storage 403 | non determinato nel preload perché il preload non esiste ancora |
| Tipo documento non coerente con preset | `normalizePreset` valida solo `tipo`/`contesto`, non valida il documento: `src/next/NextIAArchivistaPage.tsx:140-151` |
| Documento cancellato dallo storico dopo click | non determinato per opzione B se il preset contiene già `fileUrl`; l'errore sarebbe sul fetch del file |
| Nome file originale | non trovato nello `NextIADocumentiArchiveItem`; sono disponibili `sourceDocId`, `tipoDocumento`, `numeroDocumento`, `targa` e `fileUrl` |

## 6. NOTE FINALI (solo fatti)

- Il preset attuale non contiene identificativi documento, URL o blob/file.
- `ArchivistaDocumentoMezzoBridge` e gli altri bridge analizzano un `File` locale e non accettano oggi un documento storico.
- Lo storico documenti IA contiene abbastanza metadati per passare almeno `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento` e `targa`.
- Non è stato trovato un reader by-id già pronto per lo storico documenti IA.
- L'opzione B mantiene invariata la route `/next/ia/archivista` e usa il dato già disponibile nel click handler di `/next/ia/documenti`.
