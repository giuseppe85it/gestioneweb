# Audit URL Fields Boundary

## 1. Identita del documento
- Versione: v1.0
- Data: 2026-05-04
- Scopo: classificare campi URL nel boundary readonly per sbloccare PROMPT C STEP C2.
- Natura: audit solo lettura. Nessuna patch applicata.

## 2. Mappa campi URL nel boundary

| Campo | Area boundary | Costante / entry | File:linea boundary | Stato accesso |
|---|---|---|---|---|
| `librettoUrl` | allowedFields | `FIRESTORE_MEZZI_ALLOWED_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:11` | AMMESSO oggi |
| `downloadUrl` | forbiddenFields globale | `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:654` | ESCLUSO oggi |
| `fileUrl` | forbiddenFields globale | `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:655` | ESCLUSO oggi |
| `pdfUrl` | forbiddenFields globale | `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:656` | ESCLUSO oggi |
| `url` | forbiddenFields globale | `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:657` | ESCLUSO oggi |
| `imageUrls` | forbiddenFields globale | `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:658` | ESCLUSO oggi |
| `fotoUrl` | forbiddenFields globale | `FIRESTORE_SENSITIVE_FORBIDDEN_FIELDS` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:659` | ESCLUSO oggi |
| `fotoUrl` | forbiddenFields entry sessioni | `firestore-storage-autisti-sessioni-attive-doc` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:748` | ESCLUSO oggi |
| `fotoUrls` | forbiddenFields entry sessioni | `firestore-storage-autisti-sessioni-attive-doc` | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:749` | ESCLUSO oggi |

Nota: nella mappa `allowedFields` attuale il solo campo con suffisso/contesto `Url` ammesso e' `librettoUrl`.

## 3. Classificazione librettoUrl

| Writer / consumer | File:linea | Valore scritto o propagato | Evidenza tecnica | Tipo |
|---|---:|---|---|---|
| IA libretto madre | `src/pages/IA/IALibretto.tsx:438-440` | `mezzo.librettoUrl = url`; `mezzo.librettoStoragePath = path` | `url` deriva da `getDownloadURL(storageRef)` dopo `uploadString` | URL FIRMATO |
| Copertura libretti madre, repair | `src/pages/IA/IACoperturaLibretti.tsx:426-432` | `librettoStoragePath = path`; `librettoUrl = url` | `url` deriva da `getDownloadURL(ref(storage, path))` | URL FIRMATO |
| Copertura libretti madre, upload | `src/pages/IA/IACoperturaLibretti.tsx:520-522` | `mezzo.librettoUrl = url`; `mezzo.librettoStoragePath = path` | `url` deriva da `getDownloadURL(storageRef)` dopo upload | URL FIRMATO |
| IA libretto NEXT | `src/next/NextIALibrettoPage.tsx:428-429` | `mezzo.librettoUrl = url`; `mezzo.librettoStoragePath = path` | `url` deriva da `getDownloadURL(storageRef)` dopo upload | URL FIRMATO |
| Archivista NEXT, creazione mezzo da documento | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1749-1750` | `librettoUrl: args.archiveFileUrl`; `librettoStoragePath: args.archiveFileStoragePath` | `archiveFileUrl` viene passato da `result.fileUrl` | URL FIRMATO |
| Archivista NEXT, upload archivio | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2884-2885` | `archiveFileUrl: result.fileUrl`; `archiveFileStoragePath: result.fileStoragePath` | `result.fileUrl` deriva dal client archivio | URL FIRMATO |
| Archivista archive client | `src/next/internal-ai/ArchivistaArchiveClient.ts:442` | `const fileUrl = await getDownloadURL(storageRef)` | upload su Firebase Storage, poi `getDownloadURL` | URL FIRMATO |
| Anagrafica mezzi NEXT | `src/next/nextMezziWriter.ts:121-125` | non produce `librettoUrl`; scrive patch anagrafica | nessuna produzione URL in questo writer | WRITER NON TROVATO |
| Anagrafica mezzi madre | `src/pages/Mezzi.tsx:683-686` | produce `downloadUrl` per `fotoUrl`, non `librettoUrl` | `getDownloadURL(storageRef)` usato per foto mezzo | NON WRITER LIBRETTO |

Verdetto: `librettoUrl` = URL FIRMATO Firebase Storage.

Motivo: i writer reali trovati valorizzano `librettoUrl` con valori prodotti da `getDownloadURL(...)`. In parallelo esiste `librettoStoragePath`, che e' il path tecnico strutturato.

## 4. Classificazione altri campi URL

| Campo | Stato boundary | Writer / evidenza | File:linea | Classificazione |
|---|---|---|---:|---|
| `downloadUrl` | forbidden globale | `const downloadUrl = await getDownloadURL(storageRef)` in upload foto mappa storico | `src/next/domain/nextMappaStoricoDomain.ts:455` | URL FIRMATO |
| `fileUrl` | forbidden globale | `const fileUrl = await getDownloadURL(storageRef)` in Archivista archive client | `src/next/internal-ai/ArchivistaArchiveClient.ts:442` | URL FIRMATO |
| `pdfUrl` | forbidden globale | `pdfUrl = await getDownloadURL(storageRef)` in preventivo manuale NEXT | `src/next/nextPreventivoManualeWriter.ts:244` | URL FIRMATO |
| `url` | forbidden globale | `url: URL.createObjectURL(payload.blob)` in preview PDF locale | `src/utils/pdfPreview.ts:69` | BLOB URL / DA INDAGARE |
| `imageUrls` | forbidden globale | `imageUrls.push(downloadUrl)` dopo `getDownloadURL(storageRef)` | `src/next/nextPreventivoManualeWriter.ts:198-215` | URL FIRMATO |
| `imageUrls` | forbidden globale | `imageUrls: isPdf ? [] : [fileUrl]`, dove `fileUrl` deriva da `getDownloadURL` | `src/next/internal-ai/ArchivistaArchiveClient.ts:573-576` | URL FIRMATO |
| `fotoUrl` | forbidden globale | `fotoUrl` mezzo madre valorizzato da `finalFotoUrl`, che deriva da `getDownloadURL(storageRef)` | `src/pages/Mezzi.tsx:683-686`, `src/pages/Mezzi.tsx:740-780` | URL FIRMATO |
| `fotoUrl` | forbidden globale | `return { fotoUrl: url, fotoStoragePath: path }`, dove `url` deriva da `getDownloadURL(storageRef)` | `src/utils/materialImages.ts:25-29` | URL FIRMATO |
| `fotoUrl` | forbidden globale | `let fotoUrl: string | null = fotoPreview || null`; poi eventuale upload sostituisce con URL Storage | `src/pages/MaterialiDaOrdinare.tsx:140-146` | MISTO: DATA URL / URL FIRMATO |
| `fotoUrls` | forbidden entry sessioni | `fotoUrls: foto.map((f) => f.url)`, dove `f.url` deriva da upload con `getDownloadURL` | `src/autisti/Segnalazioni.tsx:280-281`, `src/autisti/Segnalazioni.tsx:336` | URL FIRMATO |

Campi URL del boundary senza stato `allowedFields`: `downloadUrl`, `fileUrl`, `pdfUrl`, `url`, `imageUrls`, `fotoUrl`, `fotoUrls` sono gia' esclusi dal boundary attuale tramite forbiddenFields. L'audit li classifica per completezza e per prevenire future eccezioni troppo larghe.

## 5. Rischi Zero-Invenzioni

- Campi ALTO RISCHIO: 7
  - `librettoUrl`: ALTO. E' in `allowedFields` e contiene URL firmato Firebase Storage.
  - `downloadUrl`: ALTO se mai ammesso. Evidenza `getDownloadURL`.
  - `fileUrl`: ALTO se mai ammesso. Evidenza `getDownloadURL`.
  - `pdfUrl`: ALTO se mai ammesso. Evidenza `getDownloadURL`.
  - `imageUrls`: ALTO se mai ammesso. Evidenza `getDownloadURL`.
  - `fotoUrl`: ALTO se mai ammesso. Evidenza `getDownloadURL` e casi misti con data URL.
  - `fotoUrls`: ALTO se mai ammesso. Evidenza `getDownloadURL`.
- Campi NOME FUORVIANTE ma path tecnico: 0
  - Nessun campo `*Url` analizzato e' risultato path tecnico mascherato.
  - Il path tecnico corretto per libretti e' `librettoStoragePath`, non `librettoUrl`.
- Campi DA INDAGARE: 1
  - `url`: nome troppo generico; evidenza di uso come blob URL locale e possibili usi eterogenei. Resta forbidden.

Sintesi: il blocco C2 di PROMPT C e' fondato. `FIRESTORE_MEZZI_ALLOWED_FIELDS` contiene un campo `Url` che non e' path tecnico, ma URL firmato.

## 6. Opzioni operative per sblocco PROMPT C

### OPZIONE A: patch boundary chirurgica
- Cosa: rimuovere `librettoUrl` da `FIRESTORE_MEZZI_ALLOWED_FIELDS`, lasciando `librettoStoragePath` come campo leggibile dal motore.
- Pro: allinea boundary e Zero-Invenzioni; C2 puo' copiare 1:1 dal boundary senza eccezioni URL.
- Contro: richiede ricognizione impatti sui consumatori backend IA che oggi potrebbero aspettarsi `librettoUrl`.
- Perimetro file impattati: boundary readonly; eventuali registry/config/test se gia' derivati.
- Richiede patch boundary: si.

### OPZIONE B: eccezione regex per path tecnici mascherati
- Cosa: aggiungere eccezione esplicita nei test/config solo per campi `*Url` dimostrati path tecnici.
- Pro: utile se un campo `*Url` contenesse davvero un path tecnico.
- Contro: non applicabile a `librettoUrl`, perche' l'evidenza mostra `getDownloadURL(...)`; rischia di indebolire il divieto se usata genericamente.
- Perimetro file impattati: test Zero-Invenzioni / registry.config.
- Richiede patch boundary: no.

### OPZIONE C: sottoinsieme strict-safe nel registry.config
- Cosa: nel motore generico, proiettare un sottoinsieme degli allowedFields boundary, escludendo `librettoUrl` anche se il boundary lo ammette.
- Pro: sblocca C2 senza patch boundary; il motore resta piu' restrittivo del boundary.
- Contro: rompe la regola C2 precedente "allowedFields riflessi 1:1 dal boundary"; va autorizzata come scelta architetturale esplicita.
- Perimetro file impattati: `registry.config.js`, test Zero-Invenzioni, report di governance.
- Richiede patch boundary: no.

## 7. Verdetto neutro

Audit completato. Classificazione 8 campi URL boundary. Decisione operativa rimandata a Giuseppe + GPT.
