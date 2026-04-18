# AUDIT CLONEWRITEBARRIER MAPPA REALE - 2026-04-16 19:47

## SCOPO

Audit reale del file `src/utils/cloneWriteBarrier.ts` dopo la patch chirurgica su `IA Libretto`, con due obiettivi:

1. verificare che `/next/ia/libretto` sia davvero sbloccato sul solo `Analyze`;
2. mappare tutto cio che il barrier oggi autorizza o blocca ancora nel clone/NEXT: route, file, operazioni, dataset, endpoint e path Storage.

Fonte primaria: codice reale del repo.

## FILE LETTI DAVVERO

- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageWriteOps.ts`
- `src/utils/storageSync.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/utils/aiCore.ts`
- `src/utils/firestoreWriteOps.ts`
- `src/utils/materialImages.ts`
- `src/cisterna/iaClient.ts`
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`
- `src/next/NextEuromeccPage.tsx`

## FIX LIBRETTO APPLICATO

File patchato:

- `src/utils/cloneWriteBarrier.ts`

Fix reale:

- nel ramo `isAllowedIaLibrettoAnalyzeFetch()` il confronto dell'endpoint `estrazione-libretto` ora normalizza sia l'URL runtime sia la costante ammessa rimuovendo gli slash finali;
- il perimetro resta identico:
  - route: `/next/ia/libretto`
  - metodo: `POST`
  - endpoint: solo `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`
  - nessun altro endpoint aperto

Prova codice:

- costante endpoint ammesso: `src/utils/cloneWriteBarrier.ts:48-49`
- check route: `src/utils/cloneWriteBarrier.ts:176-177`
- check metodo: `src/utils/cloneWriteBarrier.ts:181-182`
- normalizzazione slash finale: `src/utils/cloneWriteBarrier.ts:185-188`

## ELENCO ECCEZIONI ATTIVE NEL BARRIER

### Tabella eccezioni reali attive

| Route/modulo interessato | File coinvolto | Tipo operazione | Dataset / endpoint / path coinvolto | Stato | Motivo tecnico | Corretto o da rivedere |
|---|---|---|---|---|---|---|
| scope `internal_ai_magazzino_inline_magazzino` usato da IA interna Magazzino inline | `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@inventario` | `AUTORIZZATO MA FRAGILE` | deroga scoped via contatore interno, non legata direttamente al pathname | da monitorare |
| `/next/ia/interna` | `src/main.tsx`, `src/App.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti` | `AUTORIZZATO MA FRAGILE` | confronto endpoint esatto via stringa normalizzata solo da `origin+pathname` | da rivedere per fragilita slash |
| `/next/ia/archivista` | `src/main.tsx`, `src/App.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti` | `AUTORIZZATO MA FRAGILE` | stesso meccanismo dell'IA interna | da rivedere per fragilita slash |
| `/next/ia/libretto` | `src/next/NextIALibrettoPage.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app` | `AUTORIZZATO` | solo `POST` su route e endpoint dedicati, con slash finale normalizzato | corretto |
| `/next/ia/libretto` | `src/next/NextIALibrettoPage.tsx`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadString` | `mezzi_aziendali/` | `AUTORIZZATO` | upload limitato al path del libretto mezzo | corretto |
| `/next/ia/libretto` | `src/next/NextIALibrettoPage.tsx`, `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@mezzi_aziendali` | `AUTORIZZATO` | update solo dataset finale usato dalla madre | corretto |
| `/next/ia/archivista` | `src/utils/firestoreWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `firestore.addDoc` | `@documenti_magazzino` | `AUTORIZZATO` | add ammesso solo su collection archivista whitelisted | corretto |
| `/next/ia/archivista` | `src/utils/firestoreWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `firestore.addDoc` | `@documenti_mezzi` | `AUTORIZZATO` | add ammesso solo su collection archivista whitelisted | corretto |
| `/next/ia/archivista` | `src/utils/firestoreWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `firestore.setDoc` | `storage/@preventivi` | `AUTORIZZATO` | set ammesso solo sul doc whitelisted | corretto |
| `/next/ia/archivista` | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadBytes` | `documenti_pdf/` | `AUTORIZZATO` | upload binario archivista su prefix whitelisted | corretto |
| `/next/ia/archivista` | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadBytes` | `preventivi/` | `AUTORIZZATO` | upload binario archivista su prefix whitelisted | corretto |
| `/next/ia/archivista` | `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@mezzi_aziendali` | `AUTORIZZATO` | update mezzo ammesso solo per archivista | corretto |
| `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti`, `/next/dettagliolavori`, `/next/dettagliolavori/:lavoroId` | `src/App.tsx`, `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@lavori` | `AUTORIZZATO` | perimetro lavori limitato al solo dataset lavori | corretto |
| `/next/euromecc`, `/next/euromecc/*` | `src/next/NextEuromeccPage.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `/api/pdf-ai-enhance` | `AUTORIZZATO` | eccezione same-origin specifica | corretto |
| `/next/euromecc`, `/next/euromecc/*` | `src/next/NextEuromeccPage.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `http://127.0.0.1/internal-ai-backend/euromecc/pdf-analyze` | `AUTORIZZATO MA FRAGILE` | check host/path hardcoded su `127.0.0.1`, non `localhost` | da rivedere |
| `/next/euromecc`, `/next/euromecc/*` | `src/next/NextEuromeccPage.tsx`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadBytes` | `euromecc/relazioni/` | `AUTORIZZATO` | upload limitato al prefix relazioni | corretto |
| `/next/euromecc`, `/next/euromecc/*` | `src/next/NextEuromeccPage.tsx`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@ordini` | `AUTORIZZATO` | scrittura limitata al dataset ordini | corretto |
| `/next/magazzino` | `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@inventario`, `@materialiconsegnati`, `@cisterne_adblue` | `AUTORIZZATO` | dataset magazzino limitati e dichiarati nel barrier | corretto |
| `/next/magazzino` | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadBytes` | `inventario/` | `AUTORIZZATO` | upload limitato alle foto inventario | corretto |
| `/next/dossiermezzi/:targa`, `/next/dossier/:targa`, `/next/dossier/:targa/gomme`, `/next/dossier/:targa/rifornimenti` | `src/App.tsx`, `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@manutenzioni`, `@inventario`, `@materialiconsegnati` | `AUTORIZZATO` | deroga dossier solo sulle chiavi dati dichiarate | corretto |
| `/next/manutenzioni` | `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping` | `AUTORIZZATO` | deroga manutenzioni limitata ai dataset tecnici dichiarati | corretto |
| `/next/manutenzioni` | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadBytes` | `mezzi_foto/` | `AUTORIZZATO` | upload limitato alle foto mezzi manutenzioni | corretto |

### Conteggio eccezioni attive

- 9 famiglie modulo/scope con eccezioni attive
- 15 pattern di route
- 1 scoped allowance separata

## ELENCO BLOCCHI ANCORA ATTIVI

### Tabella blocchi residui raggruppati

| Route/modulo interessato | File coinvolto | Tipo operazione | Dataset / endpoint / path coinvolto | Stato | Motivo tecnico | Corretto o da rivedere |
|---|---|---|---|---|---|---|
| tutte le route clone `/next/**` salvo eccezioni specifiche | `src/main.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | same-origin `/api/*` | `BLOCCATO` | prefisso mutante globale `SAME_ORIGIN_MUTATING_API_PREFIXES` | corretto |
| tutte le route clone `/next/**` salvo eccezioni specifiche | `src/main.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `cloudfunctions.net/analisi_economica_mezzo` | `BLOCCATO` | endpoint mutante noto senza eccezioni | corretto |
| tutte le route clone `/next/**` salvo eccezioni specifiche | `src/main.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `cloudfunctions.net/stamp_pdf` | `BLOCCATO` | endpoint mutante noto senza eccezioni | corretto |
| tutte le route clone tranne `/next/ia/interna` e `/next/ia/archivista` | `src/main.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `cloudfunctions.net/estrazioneDocumenti` | `BLOCCATO` | eccezione stretta solo per IA interna e archivista | corretto |
| tutte le route clone tranne `/next/ia/libretto` | `src/main.tsx`, `src/utils/cloneWriteBarrier.ts` | `fetch.runtime` | `estrazione-libretto-` | `BLOCCATO` | eccezione stretta solo per IA Libretto | corretto |
| tutte le route clone `/next/**` | `src/main.tsx`, `src/utils/cloneWriteBarrier.ts`, `src/cisterna/iaClient.ts` | `fetch.runtime` / custom `cisterna.*` | `ia_cisterna_extract`, `estrazioneschedacisterna`, `cisterna_documenti_extract` | `BLOCCATO` | nessuna deroga clone per verticale cisterna | corretto |
| tutte le route clone `/next/**` | `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.removeItemSync` | qualsiasi key | `BLOCCATO` | nessuna eccezione per rimozioni storage-style | corretto |
| tutte le route clone senza whitelist matching | `src/utils/storageSync.ts`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | qualsiasi key non ammessa per route/scope | `BLOCCATO` | enforcement dataset-specific | corretto |
| tutte le route clone senza whitelist matching | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadBytes` | qualsiasi path non whitelisted | `BLOCCATO` | enforcement prefix-specific | corretto |
| tutte le route clone senza whitelist matching | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.uploadString` | qualsiasi path non whitelisted | `BLOCCATO` | solo IA Libretto ha deroga `uploadString` | corretto |
| tutte le route clone `/next/**` | `src/utils/storageWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `storage.deleteObject` | qualsiasi path | `BLOCCATO` | nessuna eccezione su delete Storage | corretto |
| tutte le route clone `/next/**` salvo archivista add/set espliciti | `src/utils/firestoreWriteOps.ts`, `src/utils/cloneWriteBarrier.ts` | `firestore.addDoc`, `firestore.setDoc`, `firestore.updateDoc`, `firestore.deleteDoc` | qualunque collection/doc non whitelisted | `BLOCCATO` | Firestore write aperto solo in pochi casi archivista | corretto |
| tutte le route clone `/next/**` | `src/utils/aiCore.ts`, `src/utils/cloneWriteBarrier.ts` | `functions.aiCore`, `functions.aiCore.pdf_ia` | task/tipo IA core | `BLOCCATO` | nessuna eccezione per funzioni IA core legacy | corretto |
| tutte le route clone `/next/**` | `src/utils/materialImages.ts`, `src/utils/cloneWriteBarrier.ts` | `materialImages.upload`, `materialImages.delete` | immagini materiali | `BLOCCATO` | nessuna eccezione diretta su helper dedicato | corretto |
| moduli NEXT senza eccezioni dedicate, es. `/next/centro-controllo`, `/next/ia/documenti`, `/next/cisterna`, `/next/mezzi`, `/next/attrezzature-cantieri` | `src/App.tsx`, `src/utils/cloneWriteBarrier.ts` | tutte le operazioni mutate via barrier | dataset/endpoint/path non whitelisted | `BLOCCATO` | il barrier non apre nessuna deroga per queste route | corretto |
| `/next/dossiermezzi` list page | `src/App.tsx`, `src/utils/cloneWriteBarrier.ts` | `storageSync.setItemSync` | qualsiasi key | `BLOCCATO` | whitelist dossier usa prefix `/next/dossiermezzi/` e non la list route | `BLOCCO SOSPETTO BUG` solo se la list page dovesse scrivere in futuro |

### Conteggio blocchi residui censiti

- 16 gruppi di blocco residuo

## DATASET / ENDPOINT / PATH STORAGE COINVOLTI

### Dataset storage-style autorizzati da qualche deroga

- `@inventario`
- `@materialiconsegnati`
- `@cisterne_adblue`
- `@mezzi_aziendali`
- `@lavori`
- `@ordini`
- `@manutenzioni`
- `@mezzi_foto_viste`
- `@mezzi_hotspot_mapping`

### Collection / doc Firestore autorizzati da qualche deroga

- `@documenti_magazzino`
- `@documenti_mezzi`
- `storage/@preventivi`

### Endpoint fetch.runtime autorizzati da qualche deroga

- `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`
- `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`
- `/api/pdf-ai-enhance`
- `http://127.0.0.1/internal-ai-backend/euromecc/pdf-analyze`

### Path Storage autorizzati da qualche deroga

- `mezzi_aziendali/`
- `documenti_pdf/`
- `preventivi/`
- `euromecc/relazioni/`
- `inventario/`
- `mezzi_foto/`

## BLOCCHI CORRETTI

Blocchi che il codice rende oggi chiaramente intenzionali e coerenti:

- blocco clone-wide di tutti i `fetch.runtime` mutanti noti fuori dalle route whitelisted
- blocco di `storageSync.removeItemSync` su tutte le route clone
- blocco di `storage.deleteObject`
- blocco di `firestore.updateDoc` e `firestore.deleteDoc`
- blocco di `functions.aiCore` e `functions.aiCore.pdf_ia`
- blocco della verticale cisterna nel clone/NEXT
- blocco dei moduli NEXT che non hanno alcuna deroga dichiarata nel barrier

## BLOCCHI SOSPETTI O FRAGILI

| Caso | Perche e fragile | Stato consigliato |
|---|---|---|
| `/next/ia/interna` e `/next/ia/archivista` su `estrazioneDocumenti` | confronto endpoint ancora esatto via `${origin}${pathname}` senza normalizzazione slash finale | da rivedere |
| `/next/euromecc` backend locale PDF analyze | host hardcoded `127.0.0.1`, non `localhost` | da rivedere |
| scoped allowance `internal_ai_magazzino_inline_magazzino` | una volta aperta, la deroga non verifica il pathname | da monitorare |
| `/next/dossiermezzi` list page | la whitelist dossier copre solo `/next/dossiermezzi/` con slash, non la list route | verificare se voluto |

## EVENTUALI MISMATCH TECNICI

### Mismatch corretto in questo task

- `/next/ia/libretto`
  - prima: il confronto dell'endpoint falliva se il runtime produceva slash finale
  - adesso: confronto normalizzato, browser verificato

### Mismatch simili ancora presenti

1. `estrazioneDocumenti`
   - stessa famiglia di confronto stringa rigida via `${origin}${pathname}`
   - non e dimostrato un bug runtime attuale, ma la fragilita tecnica e reale

2. `euromecc` backend locale
   - match esplicito solo su `127.0.0.1`
   - un ambiente che usi `localhost` resterebbe bloccato

3. `dossiermezzi` list route
   - la whitelist usa prefix `/next/dossiermezzi/`
   - la route list reale in `src/App.tsx` e `path="dossiermezzi"`

## ESITO PROVA BROWSER

Prova eseguita davvero su `http://127.0.0.1:4174/next/ia/libretto`

Passi verificati:

1. apertura pagina
2. upload file immagine -> `OK`
3. click `Analizza` -> `OK`
4. `POST` reale verso `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app/` -> `200`
5. nessun `[CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`
6. risultati reali visibili nella UI -> `OK`

Passo non eseguito:

- click `Salva nei documenti del mezzo`

Motivo:

- avrebbe scritto su dataset reale `@mezzi_aziendali` e su Storage reale.

## VERDETTO FINALE

`IA LIBRETTO NEXT: SBLOCCATO`

`MAPPATURA CLONEWRITEBARRIER: COMPLETA`
