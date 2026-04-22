# STATO MIGRAZIONE NEXT

## Regola architetturale corrente
- La madre legacy resta intoccabile.
- `src/next/*` e il nuovo perimetro applicativo del gestionale.
- La NEXT non e piu da considerare globalmente `read-only`.
- Le scritture reali si aprono modulo per modulo, solo quando il modulo viene esplicitamente promosso.
- L'apertura non e globale: va limitata ai dataset e alle operazioni necessari al modulo in lavorazione.
- `src/utils/cloneWriteBarrier.ts` resta il punto di controllo esplicito per abilitare o negare le scritture.
- Change report, continuity report e documenti di stato devono restare allineati ogni volta che un modulo NEXT apre o modifica il proprio perimetro di scrittura.

## 0.0 Aggiornamento operativo 2026-04-22 IA Archivista: fix Storage Rules per `preventivi/`
- execution completata nel solo file `storage.rules`, senza toccare file sorgente, barrier o altre regole;
- causa: la regola `preventivi/{allPaths=**}` mancava da sempre — tutti gli upload Archivista su `preventivi/` ricevevano `storage/unauthorized`;
- fix: aggiunto `match /preventivi/{allPaths=**} { allow read, write: if request.auth != null; }` prima del catch-all;
- deploy: `firebase deploy --only storage` -> `OK` — progetto `gestionemanutenzione-934ef`;
- impatto: ramo `Preventivo -> Manutenzione` e ramo `Preventivo -> Magazzino` ora operativi lato Storage;
- verifiche: `npm run build` `OK`, `npm run lint` `582/567/15` delta zero;
- stato onesto dei rami: verifica runtime con preventivo reale -> `DA VERIFICARE`.

## 0.0 Aggiornamento operativo 2026-04-22 IA Archivista: distinzione esplicita `Preventivo -> Magazzino` vs `Preventivo -> Manutenzione`
- execution completata nel solo perimetro `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`, `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` e `src/next/internal-ai/ArchivistaArchiveClient.ts`, piu aggiornamento contesto/documentazione, senza toccare wiring pagina, barrier, writer manutenzioni o dataset fuori da `storage/@preventivi`;
- `/next/ia/archivista`:
  - il ramo `Preventivo -> Manutenzione` non usa piu la family `preventivo_magazzino`, ma `preventivo_manutenzione`;
  - il ramo `Preventivo -> Magazzino` mantiene la family `preventivo_magazzino`;
  - entrambi i rami archiviano sempre e solo in `storage/@preventivi`;
- payload preventivo:
  - il record archivista su `@preventivi` persiste ora in modo additivo `ambitoPreventivo`;
  - valori usati:
    - `magazzino` per `ArchivistaPreventivoMagazzinoBridge.tsx`
    - `manutenzione` per `ArchivistaPreventivoManutenzioneBridge.tsx`
  - `metadatiMezzo: { targa, km }` resta invariato e continua a comparire solo nel ramo manutenzione;
- duplicate check:
  - `findArchivistaDuplicateCandidates(...)` filtra ora i candidati per family reale del record;
  - il ramo `Preventivo -> Manutenzione` controlla duplicati solo contro `preventivo_manutenzione`;
  - il ramo `Preventivo -> Magazzino` continua a controllare solo `preventivo_magazzino`;
- continuita dati:
  - nessuna migrazione dei record gia presenti in `storage/@preventivi`;
  - eventuali record storici manutenzione archiviati prima di questa patch con family `preventivo_magazzino` restano invariati e costituiscono debito noto;
- verifiche eseguite:
  - `npx eslint src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
  - `npm run lint` -> `KO` per errori globali preesistenti fuori perimetro patch;
- stato onesto del ramo:
  - distinzione `family + ambitoPreventivo` lato runtime -> `FATTO`
  - verifica browser live con preventivi reali dei due rami -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-22 IA Archivista: attivato il ramo `Preventivo -> Manutenzione`
- execution completata nel perimetro `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`, `src/next/internal-ai/ArchivistaArchiveClient.ts` e `src/next/NextIAArchivistaPage.tsx`, piu aggiornamento contesto/documentazione, senza toccare writer manutenzioni, barrier, domain procurement o moduli esterni;
- `/next/ia/archivista`:
  - la combinazione `Preventivo -> Manutenzione` non e piu `out_of_scope` e monta ora un bridge reale;
  - la UI del nuovo bridge ricalca visivamente il ramo `Fattura / DDT + Manutenzione` per step upload, analisi, duplicati e conferma archivio;
  - la logica non segue il ramo consuntivo manutenzioni: usa la stessa pipeline del ramo `Preventivo -> Magazzino`;
  - l'analisi resta sull'endpoint `documents/preventivo-magazzino-analyze`;
  - il duplicate check resta su `@preventivi` con family `preventivo_magazzino`;
  - l'archiviazione finale resta sempre e solo su `storage/@preventivi`;
- payload preventivo:
  - il record salvato mantiene la shape esistente del preventivo archivista;
  - la sola estensione additiva introdotta e `metadatiMezzo: { targa, km }`;
  - `targa` e obbligatoria a livello UI prima dell'archiviazione;
  - `km` resta opzionale;
- boundary confermati:
  - nessuna scrittura in `@manutenzioni`;
  - nessuna scrittura in `@documenti_mezzi`;
  - nessun tocco a `@inventario` o `@materialiconsegnati`;
  - nessuna modifica a `cloneWriteBarrier.ts`, perche la write su `storage/@preventivi` era gia ammessa nel contesto Archivista;
- verifiche eseguite:
  - `npx eslint src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts src/next/NextIAArchivistaPage.tsx` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
  - `npm run lint` -> `KO` per errori globali preesistenti fuori perimetro patch;
- stato onesto del ramo:
  - Archivista `Preventivo -> Manutenzione` lato runtime -> `FATTO`
  - verifica browser live del nuovo bridge e del record finale in `storage/@preventivi` -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 IA Archivista: restyling completo `ArchivistaManutenzioneBridge`
- execution completata nel solo perimetro `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` e `src/next/internal-ai/internal-ai.css`, piu aggiornamento contesto/documentazione, senza toccare writer, handler business, barrier o moduli esterni;
- `/next/ia/archivista` ramo `Fattura / DDT + Manutenzione`:
  - la UI non usa piu il layout dispersivo precedente e viene ricomposta in 5 card step numerate coerenti con il mockup approvato;
  - `Step 1` resta sempre visibile e concentra upload, thumbnails pagina per pagina, rimozione e `Analizza documento`;
  - `Step 2` appare solo dopo `analysis !== null` e raccoglie riassunto breve, campi estratti, materiali con toggle e avvisi con toggle;
  - `Step 3` appare solo dopo il controllo duplicati e isola match, scelta utente e conferma finale;
  - `Step 4` appare dopo archiviazione riuscita e concentra il riepilogo archivio + CTA per aprire la manutenzione;
  - `Step 5` mostra il form manutenzione in griglia 2 colonne e, al successo, la card finale `Manutenzione creata`;
- toggle UI:
  - `showMateriali` default `true`
  - `showAvvisi` default `false`
- boundary confermati:
  - nessun handler esistente e stato modificato;
  - nessuna logica di business e stata cambiata;
  - nessun writer o contratto dati e stato alterato;
  - nessuna modifica a `cloneWriteBarrier.ts`;
- verifiche eseguite:
  - `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - restyling step-based `ArchivistaManutenzioneBridge` -> `FATTO`
  - verifica browser live del mockup completo su `/next/ia/archivista` -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 IA Documenti: tab `Libretti` con delete dedicato
- execution completata nel solo perimetro `src/next/NextIADocumentiPage.tsx` e `src/utils/cloneWriteBarrier.ts`, piu aggiornamento contesto/documentazione, senza toccare reader, domain o logica degli altri tab;
- `/next/ia/documenti`:
  - aggiunge il filtro `Libretti` accanto ai filtri esistenti;
  - quando il filtro attivo e `libretti`, mostra solo i documenti con `tipoDocumento === "libretto"` case-insensitive;
  - il filtro `Tutti` continua a mostrare tutti i documenti inclusi i libretti;
  - nel solo tab `Libretti`, ogni riga mostra `Elimina` con conferma inline `Eliminare questo libretto?`;
  - alla conferma la pagina riusa `deleteNextDocumentoCosto(...)` tramite scoped allowance e rimuove subito il record dalla lista locale;
- barrier:
  - `/next/ia/documenti` consente ora anche `firestore.deleteDoc` solo sui path sotto `@documenti_mezzi/`;
  - nessun widening su altre collection o altri path;
- verifiche eseguite:
  - `npx eslint src/next/NextIADocumentiPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - tab `Libretti` + delete mirato nello storico documenti -> `FATTO`
  - verifica browser live del tab e dell'eliminazione reale -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 IA Documenti + Dossier: cambio valuta inline, targa -> Dossier, link storico
- execution completata nel solo perimetro `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/NextIADocumentiPage.tsx`, `src/next/NextDossierMezzoPage.tsx` e `src/utils/cloneWriteBarrier.ts`, piu aggiornamento contesto/documentazione, senza toccare reader, modale dettaglio, azioni esistenti o altre route;
- domain documenti/costi:
  - `updateNextDocumentoCurrency(item, newCurrency)` e ora disponibile in fondo a `nextDocumentiCostiDomain.ts`;
  - la funzione aggiorna `currency` e `valuta` sulla sorgente reale del documento:
    - `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` -> `updateDoc` Firestore clone-safe
    - `@costiMezzo` -> update locale del record target e riscrittura del dataset `storage/@costiMezzo`;
- `/next/ia/documenti`:
  - la pagina resta basata su `readNextIADocumentiArchiveSnapshot()` e mantiene invariate le azioni `PDF`, `Riapri review`, `Chiedi alla IA` e il modale dettaglio;
  - ogni riga espone ora `Modifica` valuta inline con select `EUR | CHF`, bottoni `Salva` / `Annulla` e aggiornamento locale del record dopo il salvataggio;
  - se `currency === "UNKNOWN"`, il badge `Valuta da verificare` apre direttamente l'editor inline e scompare dopo salvataggio riuscito;
  - la targa e ora cliccabile e porta a `buildNextDossierPath(item.targa)` senza aprire il modale riga;
- Dossier:
  - la sezione `Fatture` aggiunge il link piccolo `Vai allo storico ->` verso `/next/ia/documenti`;
  - nessuna altra logica della pagina viene alterata;
- barrier:
  - `cloneWriteBarrier.ts` apre ora solo per `/next/ia/documenti`:
    - `firestore.updateDoc` sui path sotto `@documenti_mezzi/`, `@documenti_magazzino/`, `@documenti_generici/`
    - `storageSync.setItemSync("@costiMezzo")`
  - nessun widening su altri path o collection;
- verifiche eseguite:
  - `npx eslint src/next/NextIADocumentiPage.tsx src/next/NextDossierMezzoPage.tsx src/next/domain/nextDocumentiCostiDomain.ts src/utils/cloneWriteBarrier.ts` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - cambio valuta inline source-aware su `/next/ia/documenti` -> `FATTO`
  - navigazione targa -> Dossier e link Dossier -> storico -> `FATTO`
  - verifica browser live del salvataggio valuta e della navigazione reale -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 Dossier Mezzo: delete fatture source-aware multi-collection
- execution completata nel solo perimetro `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/NextDossierMezzoPage.tsx` e `src/utils/cloneWriteBarrier.ts`, piu aggiornamento contesto/documentazione, senza toccare la madre, writer manutenzioni, reader nuovi o collection non richieste;
- domain documenti/costi:
  - `deleteNextDocumentoCosto(item)` e ora disponibile in fondo a `nextDocumentiCostiDomain.ts`;
  - la funzione usa `item.sourceKey` per scegliere la collection o il dataset corretto:
    - `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` -> delete Firestore clone-safe via `firestoreWriteOps`
    - `@costiMezzo` -> filter + riscrittura del dataset `storage/@costiMezzo`, senza toccare altre collection;
- Dossier:
  - la sezione `Fatture` continua a mostrare le stesse righe e la stessa `Anteprima PDF`;
  - ogni riga fattura espone ancora `Elimina` con lo stesso pattern visivo del bottone preventivi;
  - al click, la pagina controlla se `legacy.manutenzioni` contiene un record con `sourceDocumentId === item.id`;
  - la conferma mostra messaggio semplice se non esistono manutenzioni collegate, oppure un avviso esplicito che la manutenzione restera anche dopo l'eliminazione della fattura;
  - dopo `Conferma`, il Dossier elimina solo il documento sorgente corretto e ricarica `readNextDossierMezzoCompositeSnapshot(targa)` senza reload pagina;
- barrier:
  - `cloneWriteBarrier.ts` gestisce il delete Dossier in modo piu preciso;
  - `firestore.deleteDoc` e consentito solo per path sotto `@documenti_mezzi/`, `@documenti_magazzino/`, `@documenti_generici/`;
  - `storageSync.setItemSync` e consentito nel contesto Dossier solo per `@costiMezzo`, per supportare il caso storage-style filter + rewrite;
  - le deroghe Archivista e gli altri rami Firestore restano invariati;
- verifiche eseguite:
  - `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/NextDossierMezzoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - delete fattura source-aware nel Dossier -> `FATTO`
  - verifica browser live dei casi `@costiMezzo`, `@documenti_mezzi` e altre sorgenti documentali -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 Manutenzioni NEXT: importo + dettaglio materiali/fattura
- execution completata nel perimetro `src/next/domain/nextManutenzioniDomain.ts`, `src/next/NextManutenzioniPage.tsx` e `src/next/NextMappaStoricoPage.tsx`, piu aggiornamento contesto/documentazione, senza toccare writer/barrier extra, madre o altri moduli;
- domain manutenzioni:
  - `NextManutenzioneBusinessSavePayload` accetta ora opzionalmente `importo?: number | null`;
  - il record persistito `@manutenzioni` salva `importo` in modo additivo e continua a funzionare anche se il campo manca;
  - in lettura, il domain arricchisce opzionalmente i record con `sourceDocumentFileUrl` e `sourceDocumentCurrency` ricavati da `sourceDocumentId` quando il documento collegato esiste in `@documenti_mezzi`;
- Dashboard `/next/manutenzioni`:
  - la riga `Ultimi interventi` usa ora `buildDescrizioneSnippet(..., 40)` e mostra misura, officina e importo solo quando disponibili;
  - i record senza `fornitore`, `importo` o metadati documento non cambiano comportamento;
- Dettaglio embedded:
  - `NextMappaStoricoPage` riceve ora dal parent anche `materiali`, `importo`, `fornitore`, `sourceDocumentId` e `sourceDocumentFileUrl`;
  - mostra la sezione `Materiali / ricambi` solo se la manutenzione ha voci materiali;
  - mostra il bottone `Apri fattura` solo se `sourceDocumentId` e `fileUrl` sono entrambi disponibili;
- verifiche eseguite:
  - `npx eslint src/next/domain/nextManutenzioniDomain.ts src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - estensione additiva `importo` sul record manutenzione -> `FATTO`
  - Dashboard e dettaglio materiali/fattura -> `FATTO`
  - verifica browser con dataset reale che esponga `importo`, `materiali` e `sourceDocumentId` -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 rollback `Dossier Mezzo -> Fatture -> Crea manutenzione`
- execution completata nel solo perimetro `src/next/NextDossierMezzoPage.tsx`, `src/next/domain/nextDossierMezzoDomain.ts` e `src/utils/cloneWriteBarrier.ts`, piu aggiornamento contesto/documentazione, senza toccare `src/next/domain/nextManutenzioniDomain.ts`, Archivista o la madre;
- Dossier:
  - la sezione `Fatture` di `/next/dossier/<targa>` torna a mostrare solo elenco, dati sintetici e `Anteprima PDF`;
  - rimossi il bottone `Crea manutenzione`, il badge `Manutenzione collegata`, il mount del modal dedicato e lo stato locale collegato;
  - eliminato il file `src/next/NextDossierFatturaToManutenzioneModal.tsx`;
- domain:
  - rimosso `hasLinkedManutenzione` da `nextDossierMezzoDomain.ts`;
  - `sourceDocumentId` non e stato toccato nel writer manutenzioni e resta disponibile per il ramo Archivista;
- barrier:
  - rimosse dal contesto Dossier le write exception su `@manutenzioni`, `@inventario`, `@materialiconsegnati`;
  - confermata intatta la deroga `/next/ia/archivista` aperta nel task 39;
- verifiche eseguite:
  - `npx eslint src/next/NextDossierMezzoPage.tsx src/next/domain/nextDossierMezzoDomain.ts src/utils/cloneWriteBarrier.ts` -> `OK` con warning noto `baseline-browser-mapping`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - rollback del collegamento Dossier -> manutenzioni -> `FATTO`
  - verifica browser che la sezione `Fatture` sia identica a prima del task 38A -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-21 Archivista Manutenzione multipagina + step 2 opzionale scrivente
- execution completata nel perimetro `backend/internal-ai/server/internal-ai-adapter.js`, `backend/internal-ai/server/internal-ai-document-extraction.js`, `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` e `src/utils/cloneWriteBarrier.ts`, senza toccare altre route backend, writer alternativi o moduli NEXT fuori da Archivista;
- backend:
  - `documents.manutenzione-analyze` accetta ora `pages[]` opzionale solo per il ramo Manutenzione;
  - quando `pages[]` e presente, la route usa la prima pagina solo come fallback di contesto e inoltra il gruppo completo all'extractor;
  - `runProviderBinaryExtraction()` costruisce ora un array di `input_image` / `input_file` solo quando `args.pages[]` esiste; il comportamento single-file resta identico quando `pages[]` e assente o vuoto;
  - `documento-mezzo-analyze`, `preventivo-magazzino-analyze` e gli altri call site condivisi non sono stati modificati;
- frontend `/next/ia/archivista` ramo `Fattura / DDT + Manutenzione`:
  - il bridge accetta ora selezione multipla, mostra anteprima pagina per pagina con rimozione singola e invia `pages[]` al backend quando i file sono piu di uno;
  - in caso multi-file, l'archiviazione finale crea un PDF combinato locale del documento logico solo per preservare tutte le pagine nell'originale archiviato;
  - dopo `Conferma e archivia`, compare uno step 2 opzionale `Crea manutenzione da questa fattura?`;
  - il form step 2 e precompilato con `targa`, `data`, `tipo`, `sottotipo`, `officina`, `eseguito`, `km`, `descrizione`, `importo`, righe materiali selezionabili e `sourceDocumentId` del documento appena archiviato;
  - `Salva manutenzione` usa il writer canonico `saveNextManutenzioneBusinessRecord()` e non introduce writer paralleli;
- barrier:
  - `/next/ia/archivista` consente ora anche `storageSync.setItemSync` per `@manutenzioni`, `@inventario`, `@materialiconsegnati`, senza aprire altri dataset;
- verifiche eseguite:
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> `OK`
  - `node --check backend/internal-ai/server/internal-ai-document-extraction.js` -> `OK`
  - `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx src/utils/cloneWriteBarrier.ts` -> `OK` con warning noto `baseline-browser-mapping`;
- stato onesto del ramo:
  - backend multi-pagina solo per `manutenzione-analyze` -> `FATTO`
  - Archivista Manutenzione con step 2 opzionale verso `@manutenzioni` -> `FATTO`
  - verifica live browser end-to-end con documento reale e comparsa record in `/next/manutenzioni` -> `DA VERIFICARE`

## 0.0 Aggiornamento operativo 2026-04-16 separazione componente Libretto nel ramo review reale
- execution completata nel solo perimetro `src/next/NextInternalAiPage.tsx` + nuovi `src/next/internal-ai/NextEstrazioneLibretto.tsx` e `src/next/internal-ai/next-estrazione-libretto.css`, senza toccare madre, router, backend, writer o barrier;
- `/next/ia/interna`:
  - il ramo reale del modale review operativo resta `documentReviewModalState.isOpen && activeDocumentReviewRoute`;
  - quando la route reale e `Documento mezzo -> Libretto`, il modale monta ora `NextEstrazioneLibretto.tsx`;
  - gli altri casi del modale continuano a usare il ramo generico gia esistente;
- separazione UI:
  - la UI del libretto e stata estratta da `NextInternalAiPage.tsx` in un componente dedicato;
  - tutti gli stili del ramo sono isolati in `next-estrazione-libretto.css` con prefisso `iai-`;
  - nessuna logica business nuova introdotta; il componente riusa solo state e handler del parent via props;
- verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/NextEstrazioneLibretto.tsx` -> `OK`
  - `npm run build` -> `OK`
  - browser su `/next/ia/interna`:
    - con iniezione locale di stato documentale nel runtime reale della pagina, il caso `Documento mezzo -> Libretto` monta il nuovo componente separato;
    - un caso `Preventivo fornitore` continua a mostrare il modale generico;
    - nessun errore console nuovo imputabile alla patch; restano solo i `403` Storage gia preesistenti;
- stato onesto del ramo:
  - separazione strutturale del caso `Documento mezzo -> Libretto` nel modale operativo -> `FATTO`
  - altri rami del modale review operativo -> invariati

## 0.0 Aggiornamento operativo 2026-04-16 fix barrier IA Libretto + audit mappa barrier
- execution completata nel solo perimetro `src/utils/cloneWriteBarrier.ts`, senza modificare madre o altri file runtime;
- `/next/ia/libretto`:
  - resta autorizzato solo per `POST` a `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`;
  - il check URL rimuove ora gli slash finali sia lato runtime sia lato costante ammessa;
  - l'eccezione continua a non aprire altri endpoint, altri moduli o altri metodi;
- verifiche eseguite:
  - `npx eslint src/utils/cloneWriteBarrier.ts src/next/NextIALibrettoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - browser reale su `/next/ia/libretto`:
    - upload file -> `OK`
    - `Analizza` -> `POST` reale `200` verso `estrazione-libretto`
    - nessun `[CLONE_NO_WRITE] ... fetch.runtime`
    - risultati reali visibili
    - `Salva` non cliccato per evitare scrittura su dataset reale;
- audit creato:
  - `docs/audit/AUDIT_CLONEWRITEBARRIER_MAPPA_REALE_2026-04-16_1947.md`
- mappa barrier:
  - eccezioni attive censite: 9 famiglie modulo/scope, 15 pattern di route, 1 scoped allowance;
  - blocchi residui censiti: 16 gruppi;
  - fragilita residue note: match esatto di `estrazioneDocumenti`, host hardcoded `127.0.0.1` per backend locale Euromecc, scoped allowance IA Magazzino inline non pathname-bound.

## 0.0 Aggiornamento operativo 2026-04-16 IA Libretto NEXT riallineato alla madre
- execution completata nel solo perimetro `src/next/NextIALibrettoPage.tsx` + `src/utils/cloneWriteBarrier.ts`, senza modificare la madre legacy;
- `/next/ia/libretto`:
  - esegue ora la stessa analisi reale della madre verso `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`;
  - invia payload `base64Image` + `mimeType: image/jpeg`;
  - mostra i risultati estratti come campi editabili e non piu come stub read-only;
  - salva con la stessa pipeline dati della madre;
- salvataggio finale:
  - legge `storage/@mezzi_aziendali`;
  - fa match del mezzo per targa normalizzata;
  - crea un mezzo fallback se il match non esiste;
  - carica il file preview su `mezzi_aziendali/<mezzoId>/libretto.jpg`;
  - esegue `getDownloadURL`;
  - aggiorna il record mezzo con gli stessi campi logici gia mappati nel legacy, inclusi almeno `assicurazione`, `dataImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `librettoUrl`, `librettoStoragePath`;
  - chiude con `setItemSync("@mezzi_aziendali", mezzi)`;
- barrier:
  - apertura stretta solo per `/next/ia/libretto`;
  - consentiti solo `POST` a `estrazione-libretto`, `storage.uploadString` sotto `mezzi_aziendali/` e `setItemSync("@mezzi_aziendali")`;
  - nessuna apertura ulteriore su altri dataset, altri path Storage o altri moduli;
- verifiche eseguite:
  - `npx eslint src/next/NextIALibrettoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
  - `npm run build` -> `OK`;
- stato onesto del ramo:
  - `/next/ia/libretto` -> `FATTO` sul percorso dati madre
  - `NEXT IA hub` complessivo -> `in sviluppo`

## 0.0 Aggiornamento operativo 2026-04-15 Archivista V1 chiusura lato documenti / archiviazione
- execution completata nel perimetro `NextIAArchivistaPage.tsx`, bridge Archivista sotto `src/next/internal-ai/*`, backend documentale IA separato e `cloneWriteBarrier.ts`, senza toccare madre, writer business post-archivio o verticali fuori V1;
- `/next/ia/archivista`:
  - rende operative tutte e sole le quattro famiglie V1 `Fattura / DDT + Magazzino`, `Fattura / DDT + Manutenzione`, `Documento mezzo`, `Preventivo + Magazzino`;
  - mantiene `Preventivo + Manutenzione` fuori V1 e non attiva `Cisterna`, `Euromecc`, `Carburante`;
  - per tutte le famiglie mostra review non chat, stato analisi, riassunto, campi principali, avvisi, campi mancanti, controllo duplicati e stato archivio esplicito;
- archiviazione finale:
  - `Fattura / DDT + Magazzino` -> upload originale + record primario `@documenti_magazzino`;
  - `Fattura / DDT + Manutenzione` -> upload originale + record primario `@documenti_mezzi`, senza creare manutenzioni;
  - `Documento mezzo` -> upload originale + record archivio in `@documenti_mezzi` collegato al mezzo, con update `@mezzi_aziendali` solo su conferma esplicita;
  - `Preventivo + Magazzino` -> upload originale + record confermato in `storage/@preventivi`, senza update listino;
- duplicati:
  - prima dell'archiviazione il controllo archivio e obbligatorio;
  - se il match e forte l'utente deve scegliere tra `Stesso documento`, `Versione migliore`, `Documento diverso`;
  - `Versione migliore` resta non distruttivo e mantiene traccia del collegamento al record precedente;
- backend IA separato:
  - resta `documents.manutenzione-analyze` su OpenAI puro;
  - aggiunti endpoint server-side dedicati `documents.documento-mezzo-analyze` e `documents.preventivo-magazzino-analyze`;
  - `internal-ai-document-extraction.js` supporta ora i profili `documento_mezzo` e `preventivo_magazzino`, oltre a `manutenzione`;
- barrier:
  - apertura stretta solo per `/next/ia/archivista`;
  - consentiti solo upload Storage `documenti_pdf/` e `preventivi/`, `addDoc` su `@documenti_magazzino` / `@documenti_mezzi`, `setDoc` su `storage/@preventivi`, `setItemSync("@mezzi_aziendali")`;
  - nessuna apertura su `@costiMezzo`, `@manutenzioni`, `@listino_prezzi` o flussi fuori V1;
- verifiche eseguite:
  - `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts src/next/internal-ai/internal-ai.css src/utils/cloneWriteBarrier.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-document-extraction.js` -> `OK` con warning noto solo sul CSS ignorato dalla config;
  - `npm run build` -> `OK`;
- stato onesto del ramo:
  - Archivista V1 lato documenti / archiviazione -> `FATTO`
  - IA Report e azioni business dopo archivio -> `NON FATTO`

## 0.0 Aggiornamento operativo 2026-04-15 Importa documenti layout approvato
- execution completata nel perimetro `src/next/NextIAArchivistaPage.tsx`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`, `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`, `src/next/internal-ai/internal-ai.css`, senza toccare madre, backend, barrier o writer business;
- `/next/ia/archivista` usa ora il nome prodotto `Importa documenti` e una testata compatta con CTA `IA Report` + opzioni secondarie;
- la fascia alta segue la struttura approvata `Tipo documento / Contesto / Upload + Analizza`;
- il shell desktop ora dispone preview a sinistra, dati estratti a destra, tabella righe sotto e convalida finale in basso;
- i rami `Magazzino` e `Manutenzione` sono stati ricomposti nel nuovo ordine visuale preservando i rispettivi motori;
- `Documento mezzo` e `Preventivo + Magazzino` restano agganciati allo stesso shell visivo ma non sono stati rifiniti nei dettagli fini della review in questo task;
- verifiche:
  - `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
  - `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto file ignorato dalla config
  - `npm run build` -> `OK`
- stato capability:
  - layout prodotto `Importa documenti` -> `FATTO`
  - uniformazione visuale fine di tutti i bridge Archivista -> `PARZIALE`

## 0.0 Aggiornamento operativo 2026-04-15 Archivista V1 step 2: ramo Manutenzione review attivo
- execution completata nel perimetro `src/next/NextIAArchivistaPage.tsx`, nuovo `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` e `src/next/internal-ai/internal-ai.css`, senza toccare madre, backend, functions, api o writer business;
- `/next/ia/archivista`:
  - resta pagina non chat con scelta guidata `Tipo` + `Contesto`;
  - rende ora attivi davvero solo `Fattura / DDT + Magazzino` e `Fattura / DDT + Manutenzione`;
  - mantiene `Documento mezzo` e `Preventivo + Magazzino` visibili ma non attivi;
  - mantiene `Preventivo + Manutenzione` fuori V1 e non introduce `Cisterna`, `Euromecc`, `Carburante`;
- bridge Manutenzione:
  - `ArchivistaManutenzioneBridge.tsx` richiama il servizio reale `estrazioneDocumenti`;
  - la review resta pulita dentro Archivista e mostra stato analisi, riassunto breve, dati estratti principali, righe trovate, avvisi e campi mancanti;
  - l'esito e esplicito: `Documento analizzato`, `Non ancora archiviato`, `Nessuna manutenzione ancora creata`;
  - nessuna UI chat, nessun writer business, nessun save automatico e nessun handoff eseguibile;
- bridge Magazzino:
  - `ArchivistaMagazzinoBridge.tsx` resta attivo e non viene rifatto;
  - i testi distinguono ora in modo piu netto il ramo Magazzino dal nuovo ramo Manutenzione;
- barrier:
  - nessuna modifica nuova in questa patch;
  - il riuso del solo `POST` a `estrazioneDocumenti` su `/next/ia/archivista` continua ad appoggiarsi alla deroga minima gia presente nel worktree;
- verifiche eseguite:
  - `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
  - `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto file ignorato dalla config
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - `Fattura / DDT + Magazzino` dentro Archivista -> `FATTO`
  - `Fattura / DDT + Manutenzione` con review analitica non chat -> `FATTO`
  - `Documento mezzo` e `Preventivo + Magazzino` visibili ma non attivi -> `IN CORSO`
  - archiviazione definitiva, collegamenti automatici e azioni business finali Archivista -> `NON FATTO`

## 0.0 Aggiornamento operativo 2026-04-15 Archivista V1 step 1: ramo Magazzino attivo
- execution completata nel perimetro `src/next/NextIAArchivistaPage.tsx`, nuovo `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`, `src/next/internal-ai/internal-ai.css` e `src/utils/cloneWriteBarrier.ts`, senza toccare madre, backend, functions, api o writer business;
- `/next/ia/archivista`:
  - resta pagina non chat con scelta `Tipo` e `Contesto`;
  - rende operativo davvero solo `Fattura / DDT + Magazzino`;
  - mostra gli altri rami V1 come `In arrivo` (`Fattura / DDT + Manutenzione`, `Documento mezzo`, `Preventivo + Magazzino`);
  - mantiene `Preventivo + Manutenzione` fuori V1 e non introduce `Cisterna`, `Euromecc`, `Carburante`;
- bridge Magazzino:
  - `ArchivistaMagazzinoBridge.tsx` richiama il servizio reale `estrazioneDocumenti`;
  - la review resta pulita dentro Archivista e mostra stato analisi, dati estratti principali, righe trovate e avvisi;
  - nessuna UI chat, nessun writer business, nessun handoff nuovo;
- barrier:
  - `cloneWriteBarrier.ts` estende in modo stretto l'eccezione gia esistente per il solo `POST` a `estrazioneDocumenti`, aggiungendo anche il pathname `/next/ia/archivista`;
  - nessuna altra write exception viene aperta;
- verifiche eseguite:
  - `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
  - `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto file ignorato dalla config
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - separazione visibile IA 1 / IA 2 nel runtime NEXT -> `FATTO`
  - `Fattura / DDT + Magazzino` dentro Archivista -> `FATTO`
  - altri rami V1 visibili ma non attivi -> `IN CORSO`
  - salvataggi business, review finale confermativa e archiviazione completa IA 2 -> `NON FATTO`

## 0.0 Aggiornamento operativo 2026-04-14 multi-file attivo anche nella card alta `Documento + Analizza`
- execution completata nel solo perimetro autorizzato `src/next/NextInternalAiPage.tsx`, senza toccare madre, backend IA interno, parser legacy o writer business;
- UI:
  - la card alta reale di `/next/ia/interna` accetta ora anche selezione multipla nel campo `Documento`;
  - con `2 o piu file` compare il toggle in italiano `Tratta questi file come un unico documento`, attivo di default;
  - con `1 file` il flusso continua a usare invariato il motore `useIADocumentiEngine()` e il comportamento resta identico a prima;
- orchestrazione:
  - il ramo multi-file della card alta non introduce un secondo motore;
  - riusa il percorso allegati/orchestrazione gia approvato per la chat IA;
  - l'analisi multi-file della card alta usa prompt neutro, cosi non dipende dal draft corrente del composer;
- risultato:
  - con `2 o piu file` il riepilogo finale resta unico e aggregato;
  - le preview dei singoli allegati restano consultabili nel flusso gia esistente;
  - il flusso chat/allegati gia patchato non viene rotto o riscritto;
- verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentAnalysis.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts` -> `OK`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - card alta `/next/ia/interna` multi-file -> `FATTO`
  - backend, extraction singolo file e writer -> invariati
  - rischio residuo: la card alta multi-file sostituisce il contesto allegati corrente per mantenere un solo percorso coerente ed evitare una seconda implementazione divergente

## 0.0 Aggiornamento operativo 2026-04-14 IA interna documentale multi-file con riepilogo unico
- execution completata nel solo perimetro autorizzato `src/next/NextInternalAiPage.tsx`, `src/next/internal-ai/internalAiDocumentAnalysis.ts`, `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`, `src/next/internal-ai/internalAiUniversalHandoff.ts`, `src/next/internal-ai/internalAiUniversalOrchestrator.ts`, senza toccare madre, parser legacy, extraction pipeline del file singolo o writer business;
- UI:
  - nel flusso allegati di `/next/ia/interna` compare il toggle in italiano `Tratta questi file come un unico documento`;
  - il toggle si attiva di default solo quando gli allegati sono almeno 2 e si azzera automaticamente quando si torna a 0/1 allegato;
  - la proposal automatica e la review mostrano un solo riepilogo finale unificato, mentre le preview dei singoli file restano consultabili come allegati separati;
- orchestrazione:
  - il flag logico viene passato all'orchestratore universale;
  - router e handoff trattano il gruppo come un unico documento logico, ma senza cambiare upload, parsing o classificazione del singolo allegato quando il flag non e attivo;
  - gli action intent duplicati sullo stesso target vengono collassati solo nel caso multi-file unificato;
- aggregazione:
  - `internalAiDocumentAnalysis.ts` unisce in modo prudente header, righe e testo breve delle analisi gia presenti sui singoli allegati;
  - i campi coerenti vengono mantenuti, quelli conflittuali vengono azzerati e marcati come `da verificare`, senza inventare valori;
  - nessun merge PDF fisico viene introdotto;
- comportamento verificato:
  - 1 file -> comportamento invariato;
  - 2 o piu file -> un solo riepilogo logico finale con review unificata e tab allegato per la sola preview;
- verifiche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts src/next/internal-ai/internalAiDocumentAnalysis.ts` -> `OK`
  - `npm run build` -> `OK`
- stato onesto del ramo:
  - capability multi-file `stessa manutenzione -> riepilogo unico` -> `FATTO`
  - nessun cambio a extraction per-file, upload, madre o writer
  - rischio residuo: su gruppi multi-file eterogenei i campi header/totali in conflitto vengono mantenuti `DA VERIFICARE` invece di essere forzati

## 0.0 Aggiornamento operativo 2026-04-13 UI `Magazzino -> Documenti e costi` allineata a `SPEC_DOCUMENTI_COSTI_UI` - PATCH PARZIALE
- execution completata nel solo perimetro autorizzato `src/next/NextMagazzinoPage.tsx`, con riuso delle classi `.doc-costi-*` in `src/next/internal-ai/internal-ai.css`, senza toccare `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/NextIADocumentiPage.tsx`, writer, barrier o backend;
- dati reali usati dal tab:
  - documenti archivio Magazzino: `NextIADocumentiArchiveItem[]` filtrati con `sourceKey = "@documenti_magazzino"`;
  - supporto righe documento: `materialCostSupport.documents` -> `NextDocumentiMagazzinoSupportDocument.voci`;
  - preventivi materiali: `NextProcurementPreventivoItem[]` dal procurement read-only gia usato dal tab;
- UI applicata:
  - header con statistiche, filtri `Tutti / Fatture / DDT / Preventivi / Da verificare`, ricerca locale, gruppi collassabili per fornitore, tabella righe, totale fornitore e totale generale;
  - click riga -> modale dettaglio; `PDF` apre `fileUrl` in nuova tab senza aprire il modale; `Chiedi alla IA` naviga a `NEXT_INTERNAL_AI_PATH` con `state.initialPrompt`;
  - i pannelli legacy sotto la lista documenti non vengono piu renderizzati, quindi il tab resta visivamente focalizzato solo sui documenti/preventivi del dominio Magazzino;
- perimetro dati confermato:
  - restano esclusi fatture manutenzione, preventivi per targa, documenti generici, libretti e cisterna;
  - `/next/ia/documenti` resta l'archivio globale IA, senza modifiche in questo task;
- verifiche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - browser verificato davvero su `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi` e `http://127.0.0.1:4174/next/ia/documenti`
  - controlli verificati: nuova UI visibile in Magazzino, sezioni fornitore collassabili, filtro e ricerca funzionanti, click riga apre il modale, `PDF` apre una nuova tab senza aprire il modale, `Chiedi alla IA` porta a `/next/ia/interna` con prompt precaricato, `/next/ia/documenti` invariato come archivio globale;
- stato onesto del ramo:
  - riallineamento UI del tab `Magazzino -> Documenti e costi` -> `PATCH PARZIALE`
  - nessun cambio a logica business, writer o barrier
  - limite reale: i preventivi procurement del tab non espongono `voci` ma solo `rows`, quindi il modale mostra solo l'intestazione per quei record e non puo chiudere la spec al 100%
  - errori console residui osservati: backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`, preesistenti e non introdotti da questa patch

## 0.0 Aggiornamento operativo 2026-04-13 FIX PERIMETRO `Magazzino -> Documenti e costi`
- execution completata nel solo perimetro autorizzato `src/next/NextMagazzinoPage.tsx`, senza toccare `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/NextIADocumentiPage.tsx`, writer, barrier o backend;
- audit dati reale del tab:
  - il tab continua a leggere `readNextDocumentiCostiFleetSnapshot({ includeCloneDocuments: false })`, `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })` e `readNextProcurementSnapshot({ includeCloneOverlays: false })`;
  - il discriminante strutturale affidabile per i documenti Magazzino e `sourceKey = "@documenti_magazzino"` insieme a `sourceType = "documento_magazzino"`;
- correzione applicata:
  - `documentiMagazzinoItems` resta gia limitato a `@documenti_magazzino` nell'archivio IA read-only;
  - `materialiCostItems` non include piu record `costo_mezzo` e mostra ora solo record con `sourceKey = "@documenti_magazzino"` e `sourceType = "documento_magazzino"`;
  - la copy della sezione `Costi materiali e prezzi` e stata riallineata al nuovo perimetro reale, senza citare piu `@costiMezzo` come sorgente visibile del tab;
  - ordini, arrivi, preventivi e listino procurement restano come supporto read-only del dominio materiali, coerenti con `Magazzino` e separati dall'archivio globale IA;
- verifiche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - browser verificato davvero su `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi` e `http://127.0.0.1:4174/next/ia/documenti`
  - controlli verificati: in Magazzino la card `Costi materiali e prezzi` non mostra piu righe da `costo_mezzo`; `/next/ia/documenti` resta l'archivio globale per fornitore senza regressioni visibili;
- stato onesto del ramo:
  - correzione perimetro tab `Magazzino -> Documenti e costi` -> `FATTO`
  - nessun cambio a logica business globale, writer o barrier
  - errori console residui osservati: backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`, preesistenti e non introdotti da questa patch

## 0.0 Aggiornamento operativo 2026-04-13 UI SPEC `DOCUMENTI_COSTI_UI` - PATCH PARZIALE
- execution completata nel solo perimetro autorizzato `src/next/NextIADocumentiPage.tsx` e `src/next/internal-ai/internal-ai.css`, senza toccare `src/next/domain/nextDocumentiCostiDomain.ts`, writer, barrier o backend;
- `/next/ia/documenti`:
  - layout sostituito con pagina `Documenti e costi` per fornitore, con header statistiche, filtri `Tutti / Fatture / DDT / Preventivi / Da verificare`, ricerca locale, sezioni collassabili, tabella righe, totale per fornitore e totale generale;
  - click riga -> modale dettaglio locale con intestazione documento e azioni `Apri PDF originale`, `Da verificare`, `Riapri review`, `Chiedi IA ->`;
  - `PDF` apre `fileUrl` in nuova tab senza aprire il modale;
  - `Chiedi alla IA` naviga a `NEXT_INTERNAL_AI_PATH` con `state.initialPrompt`;
  - `Da verificare` aggiorna solo stato locale del componente, senza scritture remote;
- vincoli rispettati:
  - il reader resta `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`;
  - nessuna modifica a domain read-only, writer Firestore/Storage, barrier o motore condiviso sotto;
  - `Riapri review` resta disponibile per evitare regressione rispetto alla pagina precedente;
- verifiche eseguite:
  - `npx eslint src/next/NextIADocumentiPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - browser verificato davvero su `http://127.0.0.1:4174/next/ia/documenti`
  - controlli verificati: sezioni fornitore collassabili, filtro `Preventivi`, ricerca per `TI324623`, apertura modale al click riga, `PDF` in nuova tab, `Chiedi alla IA` con prompt precaricato su `/next/ia/interna`
- stato onesto del ramo:
  - UI spec documenti/costi sopra il domain reale -> `PARZIALE`
  - motivo del parziale: la shape reale di `NextIADocumentiArchiveItem` non espone `voci`, quindi il modale puo mostrare solo l'intestazione; inoltre la UI mantiene `Riapri review` per non regredire rispetto al file precedente
  - errori runtime residui osservati nel browser: backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`, preesistenti e non introdotti da questa patch

## 0.0 Aggiornamento operativo 2026-04-12 UI SPEC `IA_UNIVERSAL_DISPATCHER` - PATCH PARZIALE
- execution completata nel solo perimetro autorizzato `src/next/components/HomeInternalAiLauncher.tsx`, `src/next/NextInternalAiPage.tsx`, `src/next/NextIADocumentiPage.tsx`, `src/next/internal-ai/internal-ai.css`, senza toccare domain, orchestrator, writer, barrier o motori legacy;
- Home:
  - la card `Assistente IA` rispetta ora il launcher unico della spec con prompt, menu `+`, voci attive/in arrivo e link `Storico`;
  - submit prompt -> `navigate(NEXT_INTERNAL_AI_PATH, { state: { initialPrompt } })`;
  - menu `+` -> `navigate(..., { state: { triggerUpload } })`;
- `/next/ia/interna`:
  - shell dispatcher nuova con header compatto, composer, colonna destra funzioni, link `Storico analisi`, handoff banner piu compatto e review interna a due colonne;
  - ingresso pulito: nella superficie reale `overview/page` non vengono piu reidratati automaticamente gli allegati IA-only persistiti, quindi non compare piu `fattura mariba.jpeg` o altro handoff sporco di default;
  - il prompt passato dalla Home viene precaricato e il menu `+` attiva i trigger supportati (`libretto` verificato in browser verso `/next/ia/libretto`);
- `/next/ia/documenti`:
  - layout riscritto come storico ufficiale read-only, ma usando solo i campi e le sezioni davvero esposte dal domain `readNextIADocumentiArchiveSnapshot()`;
  - filtri e sezioni oggi possibili: `Tutti`, `Fatture`, `Preventivi`, `Da verificare`;
  - CTA verificate: `Apri originale`, `Riapri review`, `Vai a`;
- verifiche eseguite:
  - `npm run build` -> `OK`
  - browser verificato davvero su `/next`, `/next/ia/interna`, `/next/ia/documenti`
  - nessun `Maximum update depth exceeded` osservato in queste verifiche; restano i `403` noti dei listing Storage Firebase
- stato onesto del ramo:
  - Home launcher + dispatcher page -> `FATTO`
  - storico ufficiale spec al 100% -> `NON FATTO`
  - motivo del parziale: il domain read-only non espone ancora sezioni dedicate `Libretti`, `Cisterna`, `Manutenzioni`, quindi la spec non e chiudibile al 100% senza toccare `src/next/domain/nextDocumentiCostiDomain.ts`

## 0.0 Aggiornamento operativo 2026-04-12 AUDIT STATO REALE IA INTERNA / DOCUMENTALE
- audit solo documentale completato, senza patch runtime;
- report principale creato: `docs/audit/AUDIT_IA_INTERNA_STATO_REALE_2026-04-12.md`;
- verifiche browser eseguite davvero su `/next`, `/next/ia/interna`, `/next/ia/documenti`;
- quadro reale verificato:
  - la Home `/next` apre direttamente `/next/ia/interna`;
  - `/next/ia/interna` e l'ingresso unico documentale reale e parte pulito;
  - upload + `Analizza` funzionano davvero e aprono la review;
  - `/next/ia/documenti` resta soprattutto storico secondario del motore;
  - il motore documentale dietro la UI nuova resta il hook shared `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`;
- scritture reali presenti nel codice e fotografate dal report:
  - `POST` a `estrazioneDocumenti`;
  - upload originale su Storage `documenti_pdf/...`;
  - salvataggio Firestore in `@documenti_mezzi` / `@documenti_magazzino` / `@documenti_generici`;
  - update `valuta`;
  - import materiali in `@inventario`;
  - tracking/artifact/richieste IA in `localStorage` namespaced e mirror opzionale su adapter isolato;
- errori runtime reali ancora aperti:
  - `403` sui listing Storage Firebase;
  - `Maximum update depth exceeded`;
- stato onesto del ramo:
  - ingresso unico documentale -> `ATTIVO`
  - flusso base upload/analisi/review/storico -> `ATTIVO`
  - architettura documentale completamente separata dal motore legacy/shared -> `NON FATTO`

## 0.0 Aggiornamento operativo 2026-04-12 FIX LAUNCHER HOME IA -> INGRESSO UNICO REALE
- execution completata nel solo perimetro autorizzato `src/next/components/HomeInternalAiLauncher.tsx` e `src/next/NextHomePage.tsx`, senza toccare madre, motore documentale, barrier, backend o altri moduli NEXT;
- causa reale verificata nel codice:
  - la Home `/next` montava `HomeInternalAiLauncher`, che apriva un modale custom `Conversazione rapida dalla Home`;
  - il modale montava direttamente `NextInternalAiPage` con `surfaceVariant=\"home-modal\"`;
  - il launcher passava `draftPrompt` e soprattutto `draftAttachments` come `initialChatInput` e `initialChatAttachments`, cosi il ramo documentale del modale Home poteva aprirsi gia popolato e mostrare review/proposal sporche;
- soluzione scelta e applicata:
  - rimosso il launcher modale custom dalla Home;
  - il CTA del pannello `IA interna` naviga ora direttamente alla route reale `/next/ia/interna`;
  - la microcopy della Home e stata riallineata all'ingresso unico documentale reale, senza promettere piu una conversazione nel modale;
- verifiche tecniche eseguite:
  - `npx eslint src/next/components/HomeInternalAiLauncher.tsx src/next/NextHomePage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime browser verificato davvero su `http://localhost:5173/next`:
    - click sul launcher Home IA
    - navigazione a `http://localhost:5173/next/ia/interna`
    - nessun modale `Conversazione rapida dalla Home`
    - nessuna review sporca o `fattura mariba.jpeg` aperta di default
    - ingresso documentale pulito e coerente col flusso reale
- stato onesto del ramo:
  - launcher Home IA -> `FATTO`
  - ingresso unico documentale -> invariato e riusato come sorgente unica
  - modale Home custom -> rimosso dal flusso attivo della Dashboard
- documentazione di supporto:
  - `docs/change-reports/20260412_144023_home_ia_launcher_fix.md`
  - `docs/continuity-reports/20260412_144023_continuity_home_ia_launcher_fix.md`

## 0.0 Aggiornamento operativo 2026-04-12 FIX MIRATO `ANALIZZA` IA INTERNA NEL CLONE
- execution completata nel solo perimetro autorizzato `src/utils/cloneWriteBarrier.ts`, senza toccare `NextInternalAiPage`, `NextIADocumentiPage`, moduli business, backend o rules;
- `src/utils/cloneWriteBarrier.ts` autorizza ora solo il caso stretto `fetch.runtime` che soddisfa contemporaneamente tutte le condizioni:
  - pathname corrente esatto `/next/ia/interna`
  - metodo esatto `POST`
  - endpoint esatto `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`
- nessun widening generico del barrier:
  - nessuna wildcard nuova;
  - nessuna apertura per altre route `/next/*`;
  - nessuna apertura per altri endpoint Cloud Functions;
  - nessuna nuova deroga su storage, Firestore o writer business;
- verifiche tecniche eseguite:
  - `npx eslint src/utils/cloneWriteBarrier.ts` -> `OK`
  - `npm run build` -> `OK`
  - runtime browser verificato davvero su `http://localhost:5173/next/ia/interna`:
    - upload `audit-fattura-mariba.pdf`
    - click `Analizza`
    - `POST` verso `estrazioneDocumenti` partito davvero in network con `200`
    - review documento aperta correttamente con CTA `Apri originale`, `Vai a Inventario`, `Torna alla home documentale`
- errori residui osservati e non corretti in questo task:
  - richieste di listing Storage Firebase `403` gia presenti nel runtime;
  - ricorrenze `Maximum update depth exceeded` durante la review, non bloccanti per il flusso `Analizza`;
- stato onesto del ramo:
  - `Analizza` su `/next/ia/interna` -> `SBLOCCATO`
  - `home sporca` -> nessuna prova nuova, resta `NON RIPRODOTTA` nel worktree/runtime correnti
- documentazione di supporto:
  - `docs/change-reports/20260412_141306_ia_interna_fix_analizza_clone_barrier.md`
  - `docs/continuity-reports/20260412_141306_continuity_ia_interna_fix_analizza_clone_barrier.md`

## 0.0 Aggiornamento operativo 2026-04-12 AUDIT IA INTERNA DOCUMENTALE - HOME SPORCA / ANALIZZA BLOCCATO
- audit solo diagnostico completato senza patch runtime e senza widening del barrier;
- `/next/ia/interna` nel worktree/runtime corrente non riproduce una review sporca di default:
  - `src/App.tsx` monta la route su `NextInternalAiPage`;
  - `NextInternalAiPage.tsx` parte con `documentWorkspaceTab = "inbox"` e `openedHistoryDocumentId = null`;
  - la sola auto-riapertura dimostrata passa da `reviewDocumentId` / `reviewSourceKey` letti da `location.search`;
  - la query viene generata da `buildInternalAiHistoryReviewPath()` in `src/next/NextIADocumentiPage.tsx` e poi rimossa con `navigate(..., { replace: true })`;
  - non emergono `localStorage` o `sessionStorage` documentali che riaprano la review: browser verificato davvero con home pulita sia su `http://localhost:5173/next/ia/interna` sia sulla preview `4174`;
- `Analizza` nel clone e invece bloccato in modo reale e dimostrabile:
  - con file caricato il bottone si abilita davvero, quindi non e un problema di `disabled` o handler non agganciato;
  - `src/pages/IA/IADocumenti.tsx` chiama ancora il `POST` legacy verso `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`;
  - `src/main.tsx` installa sempre `installCloneFetchBarrier()`;
  - `src/utils/cloneWriteBarrier.ts` marca `cloudfunctions.net/estrazionedocumenti` come mutating fetch e blocca la chiamata in clone tramite `assertCloneWriteAllowed("fetch.runtime", { method, url })`;
  - il browser conferma warning `[CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`, stack reale fino a `handleUnifiedDocumentAnalyze()` e assenza del `POST` verso `estrazioneDocumenti` nella traccia rete;
- stato onesto del ramo:
  - `home sporca su /next/ia/interna` -> `NON RIPRODOTTA` nel worktree/runtime correnti;
  - `Analizza` -> `BLOCCATO` dal barrier globale del clone;
- patch minima consigliata:
  - nessuna patch runtime urgente per la home finche non si dimostra un chiamante che entra con query sporca;
  - per `Analizza` serve una decisione esplicita: o UI clone-safe onesta che non invochi il `POST` legacy nel clone, oppure apertura mirata del trasporto consentito con modifica deliberata del barrier / backend;
- documentazione di supporto:
  - `docs/change-reports/20260412_133832_audit_ia_interna_stato_sporco_blocco_analizza.md`
  - `docs/continuity-reports/20260412_133832_continuity_audit_ia_interna_stato_sporco_blocco_analizza.md`

## 0. Aggiornamento operativo 2026-04-12 FIX ENTRY / LAYOUT / DESTINAZIONI IA INTERNA DOCUMENTALE
- execution completata nel solo perimetro autorizzato `src/next/NextInternalAiPage.tsx`, `src/next/NextIADocumentiPage.tsx`, `src/pages/IA/IADocumenti.tsx`, `src/next/internal-ai/internal-ai.css`, `src/next/nextStructuralPaths.ts`, `src/next/NextManutenzioniPage.tsx`, `src/next/NextDossierMezzoPage.tsx`, senza toccare madre legacy, backend, rules o moduli fuori whitelist;
- corretto lo stato di ingresso di `/next/ia/interna`:
  - nessuna review persistita si apre piu di default;
  - la route entra sempre sulla home documentale pulita con upload, tipo atteso, motore `Documenti IA`, CTA `Analizza`, `Apri storico`;
  - la review si apre solo da nuovo file, `Riapri review` o route esplicita `?reviewDocumentId=...`;
- corretta la review desktop in modalita viewport-fit:
  - scroll pagina desktop bloccato quando la review e attiva;
  - header compatto sempre visibile;
  - area review a 3 colonne con scroll interni e footer CTA stabili;
  - `Apri originale`, CTA destinazione e `Torna alla home documentale` restano sempre visibili;
- corrette le destinazioni finali reali:
  - fattura magazzino -> `Magazzino -> Inventario` tramite `/next/magazzino?tab=inventario`;
  - fattura manutenzione -> `Manutenzioni` contestualizzate tramite `/next/manutenzioni?targa=<targa>`;
  - preventivo per targa -> `Dossier` contestualizzato sulla sezione `Preventivi` tramite `/next/dossier/<targa>#preventivi`;
  - `Da verificare` -> riapertura review documento su `/next/ia/interna` via query `reviewDocumentId`;
- micro-supporto aggiunto solo dove necessario:
  - `NextManutenzioniPage.tsx` legge `?targa=` e preseleziona il mezzo corretto senza toccare la logica business del modulo;
  - `NextDossierMezzoPage.tsx` legge `#preventivi` e porta il viewport sulla sezione dedicata senza cambiare logiche di lettura/salvataggio;
  - `src/pages/IA/IADocumenti.tsx` espone anche `resetCurrentDocument()` per chiudere davvero la review e tornare alla home documentale pulita;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx src/pages/IA/IADocumenti.tsx src/next/NextManutenzioniPage.tsx src/next/NextDossierMezzoPage.tsx src/next/nextStructuralPaths.ts` -> `OK`
  - `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto: file ignorato dalla config ESLint del repo
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna`, `/next/ia/documenti`, `/next/magazzino?tab=inventario`, `/next/manutenzioni?targa=TI324623`, `/next/dossier/TI313387#preventivi`
  - controlli browser verificati: home pulita su `/next/ia/interna`, `Riapri review` funzionante, review desktop senza page-scroll attivo, scroll interni visibili, `Apri originale` funzionante in tab separata, `Vai a Inventario`, `Vai a Manutenzioni`, `Vai al preventivo` corretti;
- documentazione di supporto:
  - `docs/change-reports/20260412_125333_ia_interna_documentale_fix_entry_layout_destinazioni.md`
  - `docs/continuity-reports/20260412_125333_continuity_ia_interna_documentale_fix_entry_layout_destinazioni.md`
- stato capability:
  - `IA interna NEXT -> ingresso documentale pulito + review viewport-fit + destinazioni finali` -> `PARZIALE`
  - restano `DA VERIFICARE` nuovi upload live end-to-end e un record storico live `Da verificare` cliccabile nel dataset corrente.

## 0. Aggiornamento operativo 2026-04-12 IA INTERNA DOCUMENTALE UNIFICATA
- execution completata nel solo perimetro autorizzato `src/next/NextInternalAiPage.tsx`, `src/next/NextIADocumentiPage.tsx`, `src/next/internal-ai/internal-ai.css` e `src/pages/IA/IADocumenti.tsx`, senza toccare madre legacy fuori deroga esplicita, backend, rules o altri file `src/pages/IA/*`;
- `/next/ia/interna` e ora l'ingresso unico documentale della NEXT:
  - header sintetico con stato IA e bottone `Apri storico`;
  - colonna sinistra `Ingresso unico` con upload, tipo atteso, motore `Documenti IA`, CTA `Analizza`;
  - area destra con tab `Inbox`, `Da verificare`, `Salvati`, `Chat IA`;
  - review documento a 3 colonne e storico filtrabile con `Apri originale`, `Riapri review`, `Vai a`;
- il motore reale di `Documenti IA` non e stato duplicato:
  - `src/pages/IA/IADocumenti.tsx` espone ora il hook `useIADocumentiEngine()`;
  - il hook riusa upload, preview file, analisi documento, apertura originale, archivio, verifica valuta, salvataggio e import inventario gia presenti nella pagina legacy;
  - `/next/ia/documenti` resta disponibile ma viene declassata a superficie secondaria/storico del motore reale, con CTA verso `/next/ia/interna`;
- le destinazioni utente verificate nel codice reale e nel browser sono:
  - fattura magazzino -> `Magazzino -> Inventario` tramite `buildNextMagazzinoPath("inventario")`;
  - fattura manutenzione -> dossier del mezzo corretto tramite `buildNextDossierPath(targa)`;
  - preventivo per targa -> dossier del mezzo corretto tramite `buildNextDossierPath(targa)`;
  - ambiguo / non deciso -> review documento su `/next/ia/documenti`;
- verifiche tecniche eseguite:
  - `npx eslint src/pages/IA/IADocumenti.tsx src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` e `/next/ia/documenti`
  - controlli browser verificati: shell ingresso unico visibile, storico apribile, `Riapri review` funzionante, `Vai al dossier` funzionante su `/next/dossier/TI313387`, `Apri originale` funzionante in tab separata;
- documentazione di supporto:
  - `docs/change-reports/20260412_115351_ia_interna_documentale_unificata.md`
  - `docs/continuity-reports/20260412_115351_continuity_ia_interna_documentale_unificata.md`
- stato capability:
  - `IA interna NEXT -> ingresso unico documentale + riuso motore IADocumenti` -> `PARZIALE`
  - restano `DA VERIFICARE` upload live end-to-end dei rami finali `Magazzino`, `Manutenzioni`, `Preventivi`, `Da verificare` su nuovi file nel dataset corrente.

## 0. Aggiornamento operativo 2026-04-11 DOSSIER MEZZO — FLUSSO FATTURA → MANUTENZIONE
- flusso "Fattura → Manutenzione" implementato nel perimetro `/next/dossiermezzi/*` e `/next/dossier/*`;
- `callPdfAiEnhance` riusata da `NextEuromeccPage` senza duplicazione della logica bridge;
- `saveNextManutenzioneBusinessRecord` chiamata con `sourceDocumentId: fattura.id` per collegamento documento;
- `cloneWriteBarrier.ts` aggiornato: nuova deroga Dossier per `@manutenzioni`, `@inventario`, `@materialiconsegnati`;
- `hasLinkedManutenzione` aggiunta a `nextDossierMezzoDomain.ts` per anti-duplicazione badge;
- `sourceDocumentId` propagato lungo tutta la catena: payload → raw dataset → HistoryItem → ReadOnlyItem → LegacyViewItem → DossierItem;
- la prova end-to-end su dati live resta `DA VERIFICARE`;
- `npm run build` → OK;
- documentazione: `docs/change-reports/20260411_dossier_fattura_to_manutenzione.md`, `docs/continuity-reports/20260411_continuity_dossier_fattura_to_manutenzione.md`

## 0. Aggiornamento operativo 2026-04-11 AUDIT RUNTIME E2E FIX MAGAZZINO + IA INTERNA
- audit runtime/documentazione completato senza patch runtime aggiuntive e senza allargare il perimetro writer;
- route verificate realmente:
  - `/next/magazzino?tab=documenti-costi`
  - `/next/ia/interna`
- evidenza live verificata sul dominio:
  - il pannello `Carichi stock da arrivi procurement` espone `Pronte: 9`, `Bloccate: 1`, con un caso `MARIBA` gia consolidato in inventario visibile nel runtime;
  - il pannello documentale `Righe supporto` espone `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`;
  - i tre candidati documentali correnti restano bloccati (`OLIO EXXON PER COMPRESSORE`, `CARTUCCIA PER PSD100029 FT036-FT037 PRIMARIA`, `SPESE DI TRASPORTO E IMBALLI`);
- evidenza live verificata nella IA interna:
  - la review destra mantiene davvero la gerarchia `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici`;
  - `Dettagli tecnici` resta collassato di default e `Righe estratte` resta il blocco piu leggibile;
  - nel contesto live persistito corrente `fattura_mariba_534909.pdf` e `fattura_adblue_aprile.pdf` non espongono pero bottoni `Conferma`: il blocco decisionale mostra ancora `Scelta attuale: DA VERIFICARE`, quindi non esiste in questa sessione un caso documentale davvero eseguibile end-to-end;
- nessuna scrittura business reale e stata eseguita:
  - nessun click mutante su `Riconcilia documento`, `Aggiungi costo/documento` o `Carica stock`;
  - nessuna quantita prima/dopo e misurabile nel browser sul ramo documentale richiesto;
  - nessun micro-fix runtime e stato necessario nel perimetro autorizzato;
- verifiche tecniche rieseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> `OK` sul runtime; warning noto solo sul CSS ignorato dalla config ESLint del repo
  - `npm run build` -> `OK`
- documentazione di supporto:
  - `docs/change-reports/20260411_233850_audit_runtime_magazzino_ia_fix_e2e.md`
  - `docs/continuity-reports/20260411_233850_continuity_audit_runtime_magazzino_ia_fix_e2e.md`
- stato capability:
  - `Magazzino NEXT -> verifica runtime fix riconciliazione documentale` -> `PARZIALE`
  - `IA interna NEXT -> verifica runtime review destra + gating live` -> `PARZIALE`
  - la prova end-to-end su un candidato documentale live `Pronto` resta `DA VERIFICARE`

## 0. Aggiornamento operativo 2026-04-11 FIX RICONCILIAZIONE STOCK + REVIEW DESTRA IA INTERNA MAGAZZINO
- execution strutturale completata nel solo perimetro autorizzato `src/next/NextMagazzinoPage.tsx`, `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`, `src/next/NextInternalAiPage.tsx`, `src/next/internal-ai/internal-ai.css` e documentazione collegata, senza toccare madre legacy, Manutenzioni o `cloneWriteBarrier.ts`;
- corretto un bug business reale nel flusso documentale `Magazzino`:
  - nei casi tipo `MARIBA`, quando esiste match forte con inventario e arrivo procurement ma la sorgente procurement risulta gia consolidata a stock, le scelte `Riconcilia documento` e `Aggiungi costo/documento a materiale esistente` non aumentano piu la giacenza;
  - la sola riconciliazione ora e ammessa solo se il `load key` procurement risulta gia presente in inventario;
  - se l'arrivo procurement compatibile esiste ma non e ancora consolidato, il ramo `riconciliazione senza carico` viene bloccato e il carico quantita resta riservato a `Carica stock` o ai casi davvero non ancora caricati;
- la review full screen della IA interna `Magazzino` e stata riallineata senza rifarla da zero:
  - colonna destra in ordine operativo `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici`;
  - le righe estratte diventano il blocco visivo piu leggibile;
  - i dettagli tecnici (`stockKey`, `sourceLoadKey`, confidence, presidio, ecc.) stanno in box collassabile chiuso di default;
  - `DA VERIFICARE` resta evidenziato in banner e decisione;
- nessuna nuova scrittura business e stata aperta:
  - nessun writer nuovo oltre ai due casi gia approvati del dominio;
  - nessuna modifica alla barrier;
  - nessuna apertura su manutenzioni, consegne, ordini, preventivi o listino;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> `OK` sul runtime; warning noto solo sul CSS ignorato dalla config ESLint del repo
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
  - struttura destra confermata e leggibilita righe estratte verificata;
- limite residuo verificato nel task:
  - su `/next/magazzino?tab=documenti-costi` il dataset live espone `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`;
  - la patch runtime e chiusa nel clone, ma la prova end-to-end live del ramo `riconciliazione senza carico` su un candidato reale pronto resta `DA VERIFICARE`;
- documentazione di supporto:
  - `docs/change-reports/20260411_214553_magazzino_ia_fix_riconciliazione_stock_review_destra_execution.md`
  - `docs/continuity-reports/20260411_214553_continuity_magazzino_ia_fix_riconciliazione_stock_review_destra_execution.md`
- stato capability:
  - `Magazzino NEXT -> gating riconciliazione stock da documento` -> `PARZIALE`
  - `IA interna NEXT -> review documento destra riallineata` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-11 IA INTERNA MAGAZZINO DOCUMENT EXTRACTION PIPELINE
- execution strutturale completata nel solo perimetro autorizzato del sottosistema IA interna NEXT e del backend IA separato, senza toccare la madre legacy e senza aprire nuovi writer business;
- la review full screen documentale di `/next/ia/interna` usa ora una pipeline documentale reale:
  - `backend/internal-ai/server/internal-ai-document-extraction.js` distingue `pdf_text`, `pdf_scan`, `image_document`;
  - quando possibile estrae header documento e righe materiali strutturate;
  - i dati strutturati vengono serializzati nel nuovo payload `documentAnalysis` sugli allegati IA;
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts` e `internalAiUniversalHandoff.ts` usano i nuovi dati per correggere il routing:
  - fattura materiali `Magazzino` -> `documenti-costi`;
  - fattura `AdBlue` -> `documenti-costi` con proposta `Carica stock AdBlue`;
  - preventivo -> procurement;
  - documento ambiguo -> inbox documentale / `DA VERIFICARE`;
- `src/next/NextInternalAiPage.tsx` mostra ora nella review:
  - tipo documento, fornitore, numero, data, destinatario;
  - imponibile / IVA / totale se presenti;
  - righe materiali con `descrizione`, `quantita`, `unita`, `prezzoUnitario`, `totaleRiga`, `codiceArticolo`;
  - filtri prudenziali su label generici o valori spurii (`Fornitore`, `Materiale`, `Targa` non valida);
- nessuna logica business di stock viene alterata:
  - nessun writer nuovo;
  - nessuna nuova apertura della barrier;
  - il perimetro inline scrivente resta limitato ai due casi gia approvati;
- verifiche tecniche eseguite:
  - `npx eslint src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiDocumentAnalysis.ts src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiUniversalEntityResolver.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalTypes.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/internal-ai-document-extraction.js backend/internal-ai/server/internal-ai-chat-attachments.js backend/internal-ai/server/internal-ai-adapter.js` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` con `tmp-runtime-materiali.png`, `tmp-runtime-adblue.pdf`, `tmp-runtime-preventivo.pdf`, `tmp-runtime-ambiguo.pdf`
  - review verificata `full screen` in tutti i casi e contenuti attesi trovati nel modal;
- documentazione di supporto:
  - `docs/change-reports/20260411_202032_ia_interna_magazzino_document_extraction_pipeline_execution.md`
  - `docs/continuity-reports/20260411_202032_continuity_ia_interna_magazzino_document_extraction_pipeline_execution.md`
- stato capability:
  - `IA interna NEXT -> Magazzino document extraction pipeline` -> `PARZIALE`
  - la pipeline e chiusa lato clone/backend IA separato, ma restano `DA VERIFICARE` OCR debole, PDF pesanti e audit su allegati reali non sintetici

## 0. Aggiornamento operativo 2026-04-11 IA INTERNA MAGAZZINO FULL SCREEN DOCUMENT REVIEW
- execution UI/runtime completata nel solo perimetro autorizzato `src/next/NextInternalAiPage.tsx` e `src/next/internal-ai/internal-ai.css`, senza toccare madre legacy, writer business generali o barrier;
- la UX documentale della chat `/next/ia/interna` non si appoggia piu solo alla card sopra la chat:
  - dopo l'analisi di fatture o preventivi si apre un modale full screen dedicato alla review documento;
  - a sinistra il documento resta il protagonista visivo con preview grande e leggibile, scroll pieno, PDF/image viewer e zoom immagine;
  - a destra la review mostra dati estratti, righe materiali, match inventario, proposta IA, decisione utente, esecuzione ed evidenza documento;
- la decisione finale resta all'utente:
  - le azioni disponibili sono `Collega a materiale esistente`, `Aggiungi costo/documento a materiale esistente`, `Crea nuovo articolo`, `Carica stock`, `DA VERIFICARE`;
  - la IA puo suggerire la scelta di default, ma nessuna esecuzione parte piu automaticamente subito dopo l'analisi;
  - l'esecuzione inline resta comunque confinata ai due soli casi gia ammessi `riconcilia_senza_carico` e `carica_stock_adblue`;
- la card dossier sopra la chat non sparisce ma cambia ruolo:
  - resta leggibile;
  - mostra riepilogo, presidio e risultato;
  - serve soprattutto a riaprire la review documento o usare il fallback;
- i casi `preventivo_fornitore` e `documento_ambiguo` usano la stessa review full screen ma non sbloccano scritture inline:
  - il preventivo porta al fallback `Apri Procurement / ordini / fornitori`;
  - il caso ambiguo resta `DA VERIFICARE`;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` con `fattura mariba.jpeg`, `fattura_adblue_aprile.pdf`, `preventivo_materiale_test.pdf`, `documento_ambiguo_test.pdf`
  - verificata la presenza del modale full screen, delle route/tab documento, della preview grande a sinistra, delle decision cards a destra e del fallback distinto per Magazzino/Procurement
  - nessuna esecuzione automatica o fuori perimetro rilevata nei casi dummy/ambigui;
- documentazione di supporto:
  - `docs/change-reports/20260411_170658_ia_interna_magazzino_fullscreen_document_review_execution.md`
  - `docs/continuity-reports/20260411_170658_continuity_ia_interna_magazzino_fullscreen_document_review_execution.md`
- stato capability:
  - `IA interna NEXT -> Magazzino full screen document review` -> `PARZIALE`
  - superficie review chiusa lato clone, ma resta `DA VERIFICARE` la resa su allegati reali multiriga/OCR debole e la persistenza della decisione utente su casi live pronti

## 0. Aggiornamento operativo 2026-04-11 IA INTERNA MAGAZZINO INLINE CONFIRM + EXECUTION
- execution strutturale completata nel solo perimetro autorizzato di `src/next/NextInternalAiPage.tsx`, `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`, `src/next/internal-ai/internal-ai.css` e `src/utils/cloneWriteBarrier.ts`, senza toccare la madre legacy e senza aprire nuovi writer business;
- il flusso standard dei documenti `Magazzino` nella chat `/next/ia/interna` non richiede piu il passaggio obbligatorio nel modulo target quando esiste un match forte sui due soli casi ammessi:
  - la review documento full screen espone la decisione utente e, quando il match e forte, abilita `Conferma riconciliazione` oppure `Conferma carico AdBlue`;
  - dopo la scelta utente nella review, l'esecuzione avviene inline nel modale/chat;
  - l'esito finale torna nella stessa scheda con dati operativi leggibili;
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts` carica il contesto `Magazzino` realmente disponibile nel clone, riusa le stesse decisioni controllate dei due casi ammessi e ricalcola l'esito dopo l'azione:
  - `riconcilia_senza_carico`
  - `carica_stock_adblue`
- `src/utils/cloneWriteBarrier.ts` non apre il dominio in modo generale:
  - introduce solo una scoped allowance temporanea `internal_ai_magazzino_inline_magazzino`;
  - la scoped allowance consente solo `storageSync.setItemSync` su `@inventario` mentre l'azione inline e in corso;
  - nessuna apertura su consegne, manutenzioni, ordini, preventivi, listino o altri writer `Magazzino`;
- `Apri in Magazzino` resta disponibile come fallback, ispezione manuale e approfondimento, ma non e piu il flusso standard obbligatorio quando il match e forte;
- i casi ambigui o con match debole restano bloccati:
  - nessun bottone inline;
  - stato `DA VERIFICARE`;
  - al massimo una sola domanda breve e mirata;
  - nessuna scrittura;
- verifiche tecniche eseguite:
  - `npx eslint src/utils/cloneWriteBarrier.ts src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
  - fallback `Apri in Magazzino` verificato come funzionante verso `/next/magazzino?tab=documenti-costi`
  - nei casi ambigui nessuna scrittura viene esposta;
- limite residuo verificato nel task:
  - il dataset live usato dal support snapshot `@documenti_magazzino` espone `Righe supporto: 3`, `Pronte: 0`, `Bloccate: 3`;
  - la patch UI/runtime inline e quindi chiusa nel clone, ma la prova end-to-end su un candidato reale pronto `MARIBA` o `AdBlue` resta `DA VERIFICARE`;
- documentazione di supporto:
  - `docs/change-reports/20260411_083921_ia_interna_magazzino_inline_confirm_execute_execution.md`
  - `docs/continuity-reports/20260411_083921_continuity_ia_interna_magazzino_inline_confirm_execute_execution.md`
- stato capability:
  - `IA interna NEXT -> Magazzino inline confirm/execute/result` -> `PARZIALE`
  - flusso inline disponibile e guard-rail invariati, ma esecuzione reale su riga pronta ancora da rivalidare con dataset idoneo

## 0. Aggiornamento operativo 2026-04-11 SCHEDA DOCUMENTO IA INTERNA MAGAZZINO
- execution UI/UX completata nel solo perimetro autorizzato di `src/next/NextInternalAiPage.tsx` e `src/next/internal-ai/internal-ai.css`, senza toccare motore IA, router documentale, writer business o barrier;
- la proposta documento della IA interna non e piu una card generica:
  - il rendering sopra la chat usa ora una vera scheda gestionale con testata, riassunto rapido, interpretazione IA, dati estratti, righe/materiali, match, evidenza testuale e box finale azione;
  - `DA VERIFICARE` e i presidi prudenziali restano visibili come badge e blocchi dedicati;
  - il layout resta responsive con griglia 2 colonne su desktop e stack pulito su mobile;
- il contenitore documento resta alto e leggibile:
  - `min-height` reale;
  - `max-height` con scroll interno;
  - resa coerente anche nel modale rapido della Home e nella route piena `/next/ia/interna`;
- nessuna logica document-driven cambia:
  - le azioni automatiche restano `Riconcilia documento`, `Carica stock AdBlue`, `DA VERIFICARE`;
  - nessuna nuova scrittura viene aperta;
  - il writer business resta subordinato alla conferma nel modulo target;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/ia/interna` con `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`: scheda presente con 7 sezioni leggibili e pannello non collassato

## 0. Aggiornamento operativo 2026-04-10 UI MODALE IA INTERNA MAGAZZINO
- execution UI completata nel solo perimetro autorizzato della superficie `/next/ia/interna`, senza toccare motore di classificazione, writer business o barrier;
- `src/next/NextInternalAiPage.tsx` non rende piu la proposal card documento dentro il composer compresso:
  - la proposta automatica viene montata in una fascia dedicata sopra i messaggi chat;
  - il pannello scrolla in vista quando arriva una nuova classificazione;
  - il contenuto mostra in modo leggibile `Documento letto`, `Tipo rilevato`, `Azione proposta`, `Motivazione`, `Presidio` e CTA;
- `src/next/internal-ai/internal-ai.css` aggiunge:
  - `min-height` reale del pannello proposta;
  - `max-height` controllata con `overflow: auto`;
  - card dedicate con gerarchia visiva piu forte;
  - campi riassuntivi per evitare l'effetto "striscia" anche nel modale rapido della Home;
- nessuna logica document-driven viene cambiata:
  - i casi forti continuano a proporre le stesse azioni;
  - i casi ambigui restano `DA VERIFICARE`;
  - nessuna nuova scrittura viene aperta;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> `OK` sul TSX, warning noto sul CSS ignorato dalla config ESLint del repo
  - `npm run build` -> `OK`
  - runtime verificato sul modale IA aperto dalla Home con allegato `fattura_mariba_534909.pdf`
  - verificata proposal shell visibile a circa `320px` di altezza con testo leggibile `Fattura materiali di Magazzino` -> `Riconcilia documento`
- documentazione di supporto:
  - `docs/change-reports/20260410_234600_ia_interna_modal_ui_fix_execution.md`
  - `docs/continuity-reports/20260410_234600_continuity_ia_interna_modal_ui_fix_execution.md`

## 0. Aggiornamento operativo 2026-04-10 IA INTERNA MAGAZZINO DOCUMENT-DRIVEN UX
- execution strutturale completata nel solo perimetro autorizzato del sottosistema IA interna NEXT, senza toccare la madre e senza aprire nuovi writer business;
- `/next/ia/interna` non richiede piu prompt tecnici per i documenti di `Magazzino`:
  - `src/next/NextInternalAiPage.tsx` accetta ora submit anche con solo allegato;
  - in assenza di testo utente genera un prompt base prudente (`Controlla questo documento allegato`);
  - esegue in background una classificazione documentale e mostra una card automatica con `tipo rilevato`, `azione proposta`, `motivazione`, `confidenza`, eventuale singola domanda breve e CTA verso il modulo target;
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts` riconosce ora meglio fatture materiali `Magazzino` e fatture `AdBlue` anche da nomi file realistici con `_` e `-`, distinguendo:
  - fattura materiali `Magazzino` -> proposta `Riconcilia documento` con apertura di `/next/magazzino?tab=documenti-costi`;
  - fattura `AdBlue` -> proposta `Carica stock AdBlue` con apertura di `/next/magazzino?tab=documenti-costi`;
  - documento ambiguo o fuori perimetro -> `DA VERIFICARE` senza scrittura, con una sola domanda di sblocco;
- `src/next/internal-ai/internalAiUniversalHandoff.ts` porta i casi documentali forti sul modulo canonico `next.magazzino`, filtra meglio riferimenti sporchi su `targa/materiale` e mantiene prudente il payload se la classificazione non e dimostrata;
- la conferma utente resta obbligatoria nel modulo target:
  - nessuna nuova scrittura oltre ai due casi gia approvati `riconcilia_senza_carico` e `carica_stock_adblue`;
  - i casi `MARIBA` / materiali gia consolidati e `AdBlue` / stock non ancora caricato passano sempre dal tab `documenti-costi`;
  - i casi ambigui non sbloccano nessun writer e restano in `DA VERIFICARE`;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts` -> `OK`
  - `npm run build` -> `OK`
  - preview locale verificata su `/next/ia/interna` con allegati dummy `fattura_mariba_534909.pdf`, `fattura_adblue_aprile.pdf`, `documento_ambiguo.pdf`
  - verificata la comparsa della proposta automatica, la CTA verso `Magazzino` o `DA VERIFICARE` e il mantenimento del blocco scritture fino alla conferma nel modulo target
  - nessun submit o writer business reale eseguito durante la verifica runtime;
- documentazione di supporto:
  - `docs/change-reports/20260410_181242_ia_interna_magazzino_document_driven_execution.md`
  - `docs/continuity-reports/20260410_181242_continuity_ia_interna_magazzino_document_driven_execution.md`
- stato capability:
  - `IA interna NEXT -> Magazzino document-driven UX` -> `PARZIALE`
  - la UX attachment-first e chiusa nel clone, ma resta `DA VERIFICARE` la robustezza su PDF/immagini reali quando i segnali documentali disponibili sono deboli

## 0. Aggiornamento operativo 2026-04-10 IA INTERNA MAGAZZINO FATTURE WRITE EXCEPTION
- execution strutturale completata nel solo perimetro autorizzato dell'IA interna NEXT e del modulo `Magazzino`, senza toccare la madre legacy;
- la capability D05 non apre scritture libere su `Magazzino`: la deroga resta confinata al tab `/next/magazzino?tab=documenti-costi` e solo ai flussi documentali di fattura;
- casi scriventi abilitati:
  - `riconcilia_senza_carico`: fattura materiali gia coperta da arrivo procurement compatibile e da voce inventario gia consolidata; l'azione collega la sorgente documento a `stockLoadKeys` e non aumenta la giacenza;
  - `carica_stock_adblue`: fattura AdBlue con quantita leggibile, UDM `lt`, niente mismatch unita e niente `stockLoadKey` gia presente; l'azione crea o aggiorna il materiale AdBlue di inventario e aumenta la giacenza;
- file runtime allineati:
  - `src/next/domain/nextDocumentiCostiDomain.ts` espone ora sui support docs di `@documenti_magazzino` anche `tipoDocumento`, `numeroDocumento`, `nomeFile`, `fileUrl`, `daVerificare`, cosi il modulo puo bloccare gli automatismi fuori perimetro;
  - `src/next/NextMagazzinoPage.tsx` costruisce decisioni esplicite `riconcilia_senza_carico` / `carica_stock_adblue` / `DA VERIFICARE`, usa anti-doppio-carico su `stockLoadKeys`, blocca i documenti non fattura, blocca mismatch unita e mostra il pannello `Azione controllata IA su fattura magazzino`;
  - `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`, `internalAiUniversalRequestResolver.ts` e `internalAiUniversalHandoff.ts` instradano ora le fatture materiali del dominio `Magazzino` alla vista `documenti-costi`, con priorita documentale anche nei prompt `fattura AdBlue`;
  - `src/next/internal-ai/internalAiUniversalContracts.ts` e `internalAiUnifiedIntelligenceEngine.ts` dichiarano la deroga come eccezione mirata, non come apertura generale di writer business nel dominio D05;
- guard-rail confermati:
  - nessuna scrittura libera su `@materialiconsegnati`, manutenzioni, ordini, preventivi o altri writer Magazzino fuori dai due casi fattura;
  - nessun auto-update silenzioso quando l'unita della fattura non coincide con la voce materiale;
  - se il documento e `daVerificare`, il match non e forte oppure il carico risulta gia consolidato, l'esito resta `DA VERIFICARE` o blocco esplicito;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> `OK`
  - `npm run build` -> `OK`
  - preview locale verificata su `/next/magazzino?tab=documenti-costi` con render corretto del nuovo pannello `Azione controllata IA su fattura magazzino`
  - nessun submit o writer business eseguito durante la verifica runtime;
- documentazione di supporto:
  - `docs/change-reports/20260410_160342_ia_interna_magazzino_fatture_write_exception_execution.md`
  - `docs/continuity-reports/20260410_160342_continuity_ia_interna_magazzino_fatture_write_exception_execution.md`
- stato capability:
  - `IA interna NEXT -> Magazzino fatture write exception` -> `PARZIALE`
  - deroga tecnica attiva e circoscritta, ma serve audit separato su match documento/materiale/fornitore, anti-doppio-carico e assenza di aperture laterali fuori perimetro

## 0. Aggiornamento operativo 2026-04-10 IA INTERNA MAGAZZINO READ-ONLY
- execution strutturale completata nel solo perimetro autorizzato dell'IA interna NEXT, senza toccare la madre e senza aprire scritture business;
- il dominio `Magazzino` entra ora nel sottosistema `/next/ia/interna` come capability read-only reale:
  - `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` legge e incrocia `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino`, costi materiali derivati e procurement di supporto (`@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`);
  - `src/next/domain/nextMaterialiMovimentiDomain.ts` espone anche lo snapshot read-only AdBlue dentro `readNextMagazzinoRealeSnapshot()`, cosi il motore unificato puo leggere stock, movimenti, attrezzature e cisterna sullo stesso asse D05;
  - le risposte Magazzino sono strutturate in blocchi `Stock`, `Movimenti`, `Documenti / Fatture`, `Preventivi`, `Costi di supporto`, `Criticita / DA VERIFICARE`;
- `src/next/internal-ai/internalAiUniversalContracts.ts`, `internalAiUniversalRequestResolver.ts` e `internalAiUniversalHandoff.ts` agganciano ora D05 al modulo canonico `next.magazzino` con hook dedicati:
  - `magazzino.main`
  - `inventario.main`
  - `materiali.main`
  - `magazzino.docs`
  - `magazzino.adblue`
- `src/next/NextMagazzinoPage.tsx` consuma il payload standard `iaHandoff` del layer universale e applica prefill coerente a tab, materiale, targa e documento, restando dentro `/next/magazzino`;
- nessun file backend `backend/internal-ai/server/*` e stato toccato: il path locale del motore unificato e gia sufficiente a servire il dominio Magazzino in sola lettura e il bridge server-side resta invariato;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/domain/nextMaterialiMovimentiDomain.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> `OK`
  - `npm run build` -> `OK`
  - preview locale verificata su `/next/ia/interna` con richiesta `quanta giacenza ho del materiale AdBlue e quali documenti o preventivi risultano collegati`
  - verificata risposta strutturata `Magazzino reale` con blocchi `Stock`, `Movimenti`, `Documenti / Fatture`, `Preventivi`, `Costi di supporto`, `Criticita / DA VERIFICARE` e riferimenti ai dataset reali del dominio
  - nessun submit o write-path business eseguito durante la verifica runtime
- documentazione di supporto:
  - `docs/change-reports/20260410_190500_ia_interna_magazzino_readonly_execution.md`
  - `docs/continuity-reports/20260410_190500_continuity_ia_interna_magazzino_readonly_execution.md`
- stato capability:
  - `IA interna NEXT -> Magazzino read-only` -> `PARZIALE`
  - output dati reale chiuso lato lettura, ma resta `DA VERIFICARE` il planner/handoff universale su alcuni prompt misti materiale/documenti/preventivi

## 0. Aggiornamento operativo 2026-04-10 AUTONOMIA NEXT STOCK - dominio `Magazzino`
- execution strutturale completata nel solo perimetro autorizzato per portare il dominio stock in modalita `AUTONOMIA NEXT`, senza riaprire runtime legacy come writer canonici del magazzino;
- `/next/magazzino` resta l'ingresso operativo pubblico canonico del dominio stock e usa `src/next/domain/nextMagazzinoStockContract.ts` come contratto ufficiale lato NEXT;
- `src/next/NextMagazzinoPage.tsx` ora assorbe anche il carico stock degli arrivi procurement:
  - le righe `arrived` di `readNextProcurementSnapshot({ includeCloneOverlays: false })` diventano candidati `Carichi stock da arrivi procurement` nella vista `Documenti e costi`;
  - ogni arrivo consolidabile usa `stockKey`, `stockLoadKeys`, UDM canoniche e deduplica prudente contro documenti materiali gia caricati;
  - il carico stock degli arrivi si esegue in `Magazzino`, non nelle route procurement read-only;
- `src/next/domain/nextProcurementDomain.ts` chiarisce ora nel layer che ordini/arrivi restano supporto read-only e che il consolidamento stock canonico passa da `/next/magazzino?tab=documenti-costi`;
- `src/next/NextProcurementReadOnlyPanel.tsx` espone copy coerente sul fatto che il procurement NEXT e supporto e che il dominio stock canonico resta `Magazzino`; le viste `Ordini` e `Arrivi` mostrano il richiamo operativo verso `/next/magazzino`;
- `src/next/nextData.ts` riallinea la shell:
  - `Magazzino` compare prima di `Materiali da ordinare` nella sezione `MAGAZZINO`;
  - `Operativita Globale` non e piu descritta come `Importato read-only`, ma come `Operativo parziale`;
  - il testo architetturale dichiara ora `Magazzino` come punto stock canonico e procurement/documenti come supporti o preview;
- nessun writer nuovo e stato aperto su costi/documenti o procurement; ordini, arrivi, preventivi e listino restano leggibili e di supporto, non writer canonici del dominio stock nella NEXT;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/domain/nextProcurementDomain.ts src/next/nextData.ts src/next/domain/nextMagazzinoStockContract.ts src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts` -> `OK`
  - `npm run build` -> `OK`
  - preview locale verificata su `/next/magazzino`, `/next/magazzino?tab=documenti-costi`, `/next/magazzino?tab=cisterne-adblue`, `/next/inventario`, `/next/materiali-consegnati`, `/next/materiali-da-ordinare?tab=arrivi`
  - verificata la visibilita del pannello `Carichi stock da arrivi procurement`, delle sole UDM `pz/lt/kg/mt`, del form AdBlue e dei redirect canonici
  - nessun submit browser mutante eseguito, per non alterare dataset Firebase reali
- documentazione di supporto:
  - `docs/change-reports/20260410_125234_magazzino_next_autonomia_stock_execution.md`
  - `docs/continuity-reports/20260410_125234_continuity_magazzino_next_autonomia_stock_execution.md`
- stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`
  - autonomia operativa stock NEXT migliorata e centralizzata, ma audit separato ancora necessario

## 0. Aggiornamento operativo 2026-04-10 PATCH CONTRATTO STOCK - dominio `Magazzino` NEXT
- execution strutturale completata nel solo perimetro autorizzato del contratto stock condiviso del modulo `Magazzino`;
- creato `src/next/domain/nextMagazzinoStockContract.ts` come helper unico per:
  - unita stock canoniche ammesse `pz`, `lt`, `kg`, `mt`;
  - canonicalizzazione legacy `m -> mt`;
  - identita materiale pragmatica su `descrizione + fornitore + unita`;
  - `stockKey`, `stockLoadKeys`, compatibilita unita e riconoscimento prudente AdBlue;
- `src/next/NextMagazzinoPage.tsx` ora:
  - consolida i carichi manuali sul materiale gia esistente quando la chiave stock coincide;
  - blocca aggiornamenti automatici quando l'unita del movimento non coincide con quella del materiale;
  - mantiene gli item inventario a quantita zero per non perdere tracciabilita, matching e deduplica;
  - scrive consegne con `stockKey` e usa risoluzione inventario per `inventarioRefId`, poi `stockKey`, poi fallback descrittivo + unita coerente;
  - registra i cambi cisterna AdBlue con `quantitaLitri`, `inventarioRefId`, `stockKey` e scarico reale su `@inventario`;
  - aggiunge nella vista `Documenti e costi` un pannello `Carichi stock da documenti` con carico controllato, unita esplicita, deduplica rispetto agli arrivi procurement e blocco delle righe gia consolidate tramite `stockLoadKeys`;
- `src/next/domain/nextManutenzioniDomain.ts` ora rende coerente il writer materiali di `Manutenzioni` con il nuovo contratto stock:
  - unita canonicalizzate;
  - errore esplicito su mismatch di unita;
  - errore esplicito su stock insufficiente;
  - rollback reale se fallisce la persistenza dei side effect su `@inventario` / `@materialiconsegnati`;
- `src/next/domain/nextMaterialiMovimentiDomain.ts` espone `stockKey` e canonicalizza le unita legacy per mantenere compatibilita con dossier e lettori materiali;
- nessun writer nuovo e stato aperto su costi/documenti;
- verifiche tecniche eseguite:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts src/next/domain/nextMagazzinoStockContract.ts` -> `OK`
  - `npm run build` -> `OK`
  - preview runtime verificata su `/next/magazzino`, `/next/magazzino?tab=documenti-costi`, `/next/magazzino?tab=cisterne-adblue`, `/next/inventario`, `/next/materiali-consegnati`
  - verificati live i guardrail UI su unita ammesse, pannello documenti/costi e form AdBlue; non sono stati eseguiti submit browser mutanti per non alterare dataset Firebase reali
- documentazione di supporto:
  - `docs/change-reports/20260410_164500_magazzino_next_contratto_stock_condiviso_execution.md`
  - `docs/continuity-reports/20260410_164500_continuity_magazzino_next_contratto_stock_condiviso_execution.md`
- stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`
  - audit finale aggiornato ancora da eseguire separatamente

## 0. Aggiornamento operativo 2026-04-10 AUDIT FINALE - dominio `Magazzino` NEXT
- audit-only completato senza patch runtime;
- verificati sul codice reale:
  - `/next/magazzino` come ingresso pubblico canonico del dominio;
  - `/next/inventario` e `/next/materiali-consegnati` come redirect compatibili, non runtime doppi;
  - `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino` e dataset collegati del dominio;
  - writer esterni reali `Acquisti`, `DettaglioOrdine`, `Manutenzioni`, `IADocumenti`;
  - lettori reali `DossierMezzo`, `Mezzo360`, analisi/costi legacy e reader NEXT collegati.
- verdetti finali per blocco:
  - `Route e wiring Magazzino NEXT` -> `CHIUSO`
  - `Inventario` -> `PARZIALE`
  - `Materiali consegnati` -> `PARZIALE`
  - `Cisterne AdBlue` -> `CHIUSO`
  - `Documenti e costi` -> `PARZIALE`
  - `Compatibilita con Dossier / lettori` -> `PARZIALE`
  - `Compatibilita con writer esterni` -> `PARZIALE`
  - `Parity logica con la madre` -> `PARZIALE`
  - `Dominio Magazzino NEXT` -> `PARZIALE`
- gap reali confermati:
  - parity PDF legacy del dominio ancora assente in `NextMagazzinoPage.tsx`;
  - dominio stock ancora multi-writer e non transazionale;
  - rischio concreto di doppio decremento in `Acquisti.tsx` e `DettaglioOrdine.tsx`;
  - import inventario IA legacy ancora basato su matching descrittivo;
  - costi materiali ancora solo supporto derivato read-only, non dato canonico.
- nessun file `src/*` modificato in questo task;
- audit dedicato:
  - `docs/audit/AUDIT_FINALE_MAGAZZINO_NEXT_DOMINIO_2026-04-10.md`
- stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PATCH STRUTTURALE - dominio allargato `Magazzino` NEXT
- execution strutturale completata nel solo perimetro autorizzato del modulo `Magazzino`.
- `src/next/NextMagazzinoPage.tsx` ora:
  - preserva shape e wrapper reali di `@inventario`, `@materialiconsegnati`, `@cisterne_adblue` senza riscrivere i dataset in forma impoverita;
  - preserva i valori legacy delle unita, poi il follow-up stock `2026-04-10` canonicalizza `m -> mt` e limita gli aggiornamenti automatici alle sole UDM `pz`, `lt`, `kg`, `mt`;
  - registra nuove consegne con `inventarioRefId`, `materialeLabel`, `direzione`, `tipo`, `origine` e `targa/mezzoTarga` quando il destinatario e un mezzo;
  - ripristina lo stock in delete prima via `inventarioRefId` e poi via fallback `descrizione + unita + fornitore`;
  - aggiunge una quarta vista `Documenti e costi` read-only.
- la vista `Documenti e costi` legge in sola lettura:
  - archivio `@documenti_magazzino` via `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`;
  - supporto costi/documenti via `readNextDocumentiCostiFleetSnapshot({ includeCloneDocuments: false })`;
  - ordini, arrivi, preventivi e listino via `readNextProcurementSnapshot({ includeCloneOverlays: false })`;
  - collegamenti dossier/segnali via `readNextMagazzinoRealeSnapshot()`.
- `src/next/domain/nextMaterialiMovimentiDomain.ts` inferisce meglio `MEZZO` / `MAGAZZINO` nei movimenti materiali e raggruppa i destinatari mezzo per targa canonica.
- `src/next/nextStructuralPaths.ts` accetta ora anche `?tab=documenti-costi` e i redirect legacy di `Operativita` verso `inventario/materiali` puntano direttamente al modulo canonico `/next/magazzino?tab=...`.
- nessun writer nuovo e stato aperto su `@documenti_magazzino`, `@preventivi`, `@listino_prezzi` o `@costiMezzo`.
- follow-up documentale `2026-04-10` completato:
  - creati `docs/change-reports/20260409_222842_magazzino_next_dominio_allargato_execution.md` e `docs/continuity-reports/20260409_222842_continuity_magazzino_next_dominio_allargato_execution.md`;
  - riallineato `CONTEXT_CLAUDE.md`;
  - sincronizzati i mirror obbligatori in `docs/fonti-pronte/`.
- verifiche tecniche:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/nextStructuralPaths.ts src/next/domain/nextMaterialiMovimentiDomain.ts` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next/magazzino`, `/next/inventario`, `/next/materiali-consegnati` e sulla nuova vista `Documenti e costi`
- stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`
  - chiusura finale demandata ad audit separato

## 0. Aggiornamento operativo 2026-04-09 PRE-AUDIT - `Magazzino` legacy vs NEXT
- audit-only completato senza patch runtime; sezione storica pre-patch, superata dalla mega patch `22:28` e dall'audit finale `2026-04-10`;
- verificati sul codice reale:
  - `@inventario` come dataset storage-style multi-writer;
  - `@materialiconsegnati` come dataset storage-style multi-writer;
  - `@documenti_magazzino` come collection documentale/costi, non come ledger stock;
- writer legacy reali confermati:
  - `Inventario`
  - `MaterialiConsegnati`
  - `Acquisti`
  - `DettaglioOrdine`
  - `Manutenzioni`
  - `IADocumenti`
- nel momento del pre-audit il nuovo `src/next/NextMagazzinoPage.tsx` copriva il core storage del dominio:
  - CRUD `@inventario`
  - consegne su `@materialiconsegnati`
  - rollback compensativo della seconda scrittura
  - `@cisterne_adblue`
- nel momento del pre-audit il nuovo modulo NON copriva ancora:
  - `@documenti_magazzino`
  - costi/fatture/preventivi materiali
  - integrazione applicativa con `IADocumenti`
  - integrazione applicativa con `Acquisti` / `DettaglioOrdine`
  - parity dei PDF legacy magazzino
- verdetto del pre-audit:
  - `Inventario logica madre` -> `COPERTO`
  - `Materiali consegnati logica madre` -> `COPERTO`
  - `Cross-modulo magazzino` -> `PARZIALE`
  - `Nuovo Magazzino NEXT` -> `PARZIALE`
  - `Compatibilita con Dossier / IA / costi / documenti` -> `PARZIALE`
- stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`
- audit dedicato:
  - `docs/audit/AUDIT_MAGAZZINO_NEXT_VS_MADRE_LOGICA_DOMINIO_2026-04-09.md`

## 0. Aggiornamento operativo 2026-04-09 PROMPT-DOC-RULE - riallineamento regola globale NEXT
- aggiornati i documenti ufficiali per superare la vecchia formula storica `clone NEXT read-only salvo eccezioni`;
- la regola corrente e ora esplicitata cosi:
  - `src/next/*` = nuovo perimetro applicativo;
  - madre intoccabile;
  - scritture reali consentite solo modulo per modulo;
  - apertura controllata e non globale;
- `cloneWriteBarrier.ts` come controllo esplicito;
- nessun runtime toccato in questo task; aggiornamento solo documentale.

## 0. Aggiornamento operativo 2026-04-09 PROMPT38 - `Magazzino` come ingresso unico pubblico
- `PROMPT38` completato sul solo wiring NEXT del dominio magazzino.
- `src/next/NextMagazzinoPage.tsx` ora legge il parametro query `tab` e apre in modo effettivo:
  - `inventario`
  - `materiali-consegnati`
  - `cisterne-adblue`
- `src/next/nextData.ts` espone nella sidebar un solo ingresso pubblico principale `Magazzino` che punta a `/next/magazzino`; le voci pubbliche separate `Inventario` e `Materiali consegnati` non restano piu ingressi visibili principali.
- `src/next/NextHomePage.tsx` aggiorna il widget `Magazzino` e punta ora a `/next/magazzino`.
- `src/App.tsx` mantiene attivi i vecchi path ma solo come redirect di compatibilita:
  - `/next/inventario` -> `/next/magazzino?tab=inventario`
  - `/next/materiali-consegnati` -> `/next/magazzino?tab=materiali-consegnati`
- Nessuna business logic del modulo `Magazzino` e stata modificata.
- Nessun writer, dataset o barrier e stato allargato.
- Nessun file `NextInventarioPage.tsx` o `NextMaterialiConsegnatiPage.tsx` e stato cancellato.
- Verifiche tecniche:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/next/nextData.ts src/next/NextHomePage.tsx src/App.tsx src/next/nextStructuralPaths.ts` -> `OK`
  - `npm run build` -> `OK`
  - runtime verificato su `/next`, `/next/magazzino`, `/next/inventario`, `/next/materiali-consegnati`
- Stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT18S - nuovo modulo `/next/magazzino`
- `PROMPT18S` completato sul perimetro autorizzato `Magazzino` NEXT.
- Creati `src/next/NextMagazzinoPage.tsx` e `src/next/next-magazzino.css`; aggiunta la route `/next/magazzino` in `src/App.tsx`.
- Il modulo usa una pagina unica con switcher interno e tre sezioni:
  - `Inventario`
  - `Materiali consegnati`
  - `Cisterne AdBlue`
- Persistenza reale usata:
  - `@inventario` via `getItemSync` / `setItemSync`
  - `@materialiconsegnati` via `getItemSync` / `setItemSync`
  - `@cisterne_adblue` via `getItemSync` / `setItemSync` come dataset storage-style dedicato
  - upload immagini inventario via `storageWriteOps.uploadBytes` su `inventario/*`
- `src/utils/cloneWriteBarrier.ts` ora consente per il solo pathname `/next/magazzino` le scritture strettamente necessarie su `@inventario`, `@materialiconsegnati`, `@cisterne_adblue` e gli upload `inventario/*`.
- La sezione `Materiali consegnati` include i fix richiesti dalla spec:
  - blocco se stock insufficiente
  - rollback se fallisce la seconda scrittura
  - warning prima del ripristino di un articolo orfano
- Verifiche tecniche:
  - `npx eslint src/next/NextMagazzinoPage.tsx src/App.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Magazzino NEXT` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT37B - raccolta stabile `docs/fonti-pronte/`
- `PROMPT37B` completato in sola documentazione; nessun file runtime toccato.
- Creata `docs/fonti-pronte/` come cartella unica e stabile per le fonti piu usate nelle nuove chat.
- La cartella contiene copie aggiornate dei documenti chiave obbligatori, alcuni report selezionati, un indice dedicato e una overview sintetica del progetto NEXT.
- Regola permanente aggiunta: quando cambia un file sorgente gia specchiato in `docs/fonti-pronte/`, nello stesso task va aggiornata anche la sua copia.
- Verifiche tecniche:
  - nessun build runtime richiesto perche il task e solo documentale.

## 0. Aggiornamento operativo 2026-04-09 PROMPT35 - `Quadro manutenzioni PDF`: compressore a ore
- `PROMPT35` completato sul solo perimetro `Manutenzioni` NEXT autorizzato.
- `src/next/NextManutenzioniPage.tsx`:
  - corretto il ramo reale del `Quadro manutenzioni PDF` che mostrava ancora una card metrica hardcoded `Km` anche sotto filtro `Compressore`;
  - introdotta una separazione esplicita delle metriche per soggetto:
    - `Mezzo` -> `Km attuali`, `Km intervento`, `Δ km` se disponibile;
    - `Compressore` -> `Ore attuali`, `Ore intervento`, `Δ ore` se disponibile;
    - `Attrezzature` -> nessuna metrica forzata; mostra solo la misura realmente presente nel record.
  - anche l'export locale PDF usa ora intestazione colonna coerente (`Km`, `Ore` o `Misura`) in base al filtro attivo.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Quadro manutenzioni PDF` -> `PARZIALE`
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT34 - fix cross-modulo `Manutenzioni` dopo audit
- `PROMPT34` completato sui domain/view NEXT collegati a `Manutenzioni`, `Dossier`, `Dossier Gomme` e `Operativita`.
- `src/next/domain/nextManutenzioniDomain.ts`:
  - corretto il bug reale sul writer `@materialiconsegnati`;
  - rimosse le due scritture consecutive sulla stessa chiave;
  - il flusso materiali salva ora un solo record unificato per ogni materiale scaricato da manutenzione, con campi coerenti sia per i reader materiali/movimenti sia per il Dossier mezzo-centrico.
- `src/next/domain/nextManutenzioniGommeDomain.ts`:
  - `toGommeItems(...)` privilegia ora le strutture `gommePerAsse` e genera item ordinari per asse anche quando la descrizione legacy non basta;
  - `mapNextManutenzioniItemsToLegacyView(...)` costruisce una descrizione strutturata per l'ordinario e per lo straordinario, usando il testo legacy solo come fallback.
- `src/next/NextGommeEconomiaSection.tsx`:
  - la UI `Dossier Gomme` mostra ora in modo esplicito `Stato ordinario per asse` ed `Eventi straordinari`;
  - il motivo dello straordinario viene mostrato quando disponibile.
- `src/next/domain/nextDossierMezzoDomain.ts` + `src/next/NextDossierMezzoPage.tsx`:
  - il Dossier principale espone ora `gommePerAsse` e `gommeStraordinarie` accanto alla lista manutenzioni generale;
  - la lista manutenzioni resta compatibile con i record legacy ma privilegia le nuove descrizioni strutturate quando esistono.
- `src/next/domain/nextOperativitaGlobaleDomain.ts`:
  - il reader di `@manutenzioni` valorizza ora i nuovi campi gomme strutturati e costruisce descrizioni coerenti per ordinario/straordinario senza cambiare la shape storage.
- Verifiche tecniche:
  - `npx eslint src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/NextGommeEconomiaSection.tsx src/next/NextDossierMezzoPage.tsx src/next/domain/nextDossierMezzoDomain.ts src/next/domain/nextOperativitaGlobaleDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`
  - `Collegamento con Dossier` -> `PARZIALE`
  - `Collegamento con Operativita` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT33 - Euromecc: documenti originali + lista ricambi → ordine
- `PROMPT33` completato su `/next/euromecc` tab `Relazioni`.
- Feature A: upload documento originale su Firebase Storage al momento di `handleConferma`; campi `fileUrl`, `fileStoragePath`, `fileSize` salvati su `euromecc_relazioni`; "Apri documento" link nello `RelazioneStoricoItem`.
- Feature B: selettore tipo documento (Relazione/Lista ricambi) nella `RelazioniUpload`; flusso AI dedicato per lista ricambi con parsing `RicambiAiPayload`; `RicambiReviewUI` con checkboxes, campi editabili, selezione fornitore/data; writer `handleCreaOrdineRicambiAndSave` su `@ordini` + salvataggio in `euromecc_relazioni` con badge `ordineId`/`ordineMateriali`.
- Deroghe barrier: `storage.uploadBytes` per `euromecc/relazioni/`, `storageSync.setItemSync` per `@ordini`.
- Regola `storage.rules` aggiunta per `euromecc/relazioni/{relazioneId}/{fileName}`.
- Build: OK, zero errori TypeScript.
- Stato migrazione Euromecc tab Relazioni: IMPORTATO CON SCRITTURA (Feature A + B aggiunte).

## 0. Aggiornamento operativo 2026-04-09 PROMPT32 - audit profondo cross-modulo `Manutenzioni`
- `PROMPT32` completato in sola lettura, senza patch runtime, con audit strutturale del modulo `/next/manutenzioni` e dei collegamenti reali verso `Dossier`, `App Autisti`, `Quadro manutenzioni PDF`, `Dettaglio` e boundary NEXT vs madre.
- Verifiche confermate:
  - `/next/manutenzioni` monta direttamente `NextManutenzioniPage` sotto `NextRoleGuard`;
  - il modulo legge davvero `@manutenzioni`, `@mezzi_aziendali`, il layer rifornimenti convergente e il layer gomme convergente;
  - il writer salva in shape retrocompatibile `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`;
  - il Dossier NEXT usa davvero `readNextMezzoManutenzioniGommeSnapshot(...)`, quindi legge la stessa convergenza manutenzioni/gomme del modulo;
  - i collegamenti autisti realmente usati dal perimetro sono `@rifornimenti_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`.
- Fragilita verificate:
  - `src/next/domain/nextManutenzioniDomain.ts` ha ancora nel writer materiali una doppia scrittura sulla stessa chiave `@materialiconsegnati`, con sovrascrittura del primo payload;
  - il Dossier principale riduce le manutenzioni a una vista legacy e non espone i nuovi campi strutturati gomme;
  - `NextGommeEconomiaSection` in `legacy_parity` esclude gli eventi gomme esterni e continua a dipendere in larga parte dal parsing della descrizione testuale, quindi la parity sulle nuove strutture gomme non e completa;
  - `NextOperativitaGlobaleDomain` continua a consumare `@manutenzioni` come lista generica senza assorbire i nuovi campi gomme;
  - il PDF quadro e coerente col runtime attuale ma la parity con la madre non e dimostrata.
- Verdetto audit:
  - `Manutenzioni NEXT` -> `PARZIALE`
  - `Dettaglio` -> `PARZIALE`
  - `Quadro manutenzioni PDF` -> `PARZIALE`
  - `Collegamento con Dossier` -> `PARZIALE`
  - `Collegamento con App Autisti` -> `PARZIALE`
  - `Boundary NEXT vs Madre` -> `PARZIALE`
- Audit dedicato creato:
  - `docs/audit/AUDIT_MANUTENZIONI_NEXT_CROSSMODULO_PROMPT32_2026-04-09.md`

## 0. Aggiornamento operativo 2026-04-09 PROMPT31B - foto reale mezzo nel PDF `Quadro manutenzioni` + pulizia testi UI
- `PROMPT31B` completato sul runtime `/next/manutenzioni` con focus esclusivo su export PDF locale del quadro e riduzione del rumore testuale in UI.
- `src/next/NextManutenzioniPage.tsx`:
  - rimuove l'uso diretto di `generateSmartPDF()` per l'export del quadro e usa un export locale con `jsPDF` + `jspdf-autotable`;
  - quando l'export riguarda una sola targa, recupera la **foto reale del mezzo** da `fotoUrl` del preview mezzo associato alla targa (`mezzoPreviewByTarga`) e la stampa nella testata del PDF;
  - se la foto reale non e disponibile, mostra un fallback pulito nel riquadro immagine del PDF senza usare tavole tecniche `public/gomme/*`;
  - il bottone `PDF quadro generale` esporta ora i risultati realmente visibili nel quadro, quindi rispetta anche la ricerca `targa / autista`;
  - rimuove copy fisse ridondanti da `Dashboard`, `Nuova / Modifica`, `Quadro manutenzioni PDF`, sezioni gomme e tagliando completo;
  - sposta le spiegazioni utili su `title` / `aria-label` dei controlli principali.
- `src/next/NextMappaStoricoPage.tsx`:
  - alleggerisce il `Dettaglio` embedded rimuovendo pill/KPI ridondanti e accorciando il messaggio vuoto della manutenzione selezionata;
  - aggiunge tooltip sulle tab `Sinistra / Destra` e sull'immagine mostrata nel viewer.
- `src/next/next-mappa-storico.css`:
  - rimuove lo stile non piu usato di `man2-form-note`.
- Nessuna modifica a madre, Euromecc, backend/rules, PDF engine globale o logica `Calibra`.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT30 - ripristino viste tecniche `Sinistra / Destra` + ricerca rapida nel quadro `Manutenzioni`
- `PROMPT30` completato sul runtime `/next/manutenzioni` con focus esclusivo su viewer embedded del `Dettaglio` e filtro operativo del `Quadro manutenzioni PDF`.
- `src/next/NextMappaStoricoPage.tsx` nel ramo `embedded`:
  - riaggancia il mapping tecnico reale gia presente nel repo tramite `resolveNextManutenzioneTechnicalView(...)`;
  - usa la categoria del mezzo per mostrare di nuovo l'immagine tecnica da `public/gomme/*` nel viewer;
  - mantiene fallback alla foto vista solo se la categoria non ha una tavola tecnica valida;
  - lascia nel runtime embedded solo le tab `Sinistra` e `Destra`;
  - non reintroduce `Calibra`, marker, drag, palette o override tecnici.
- `src/next/NextManutenzioniPage.tsx`:
  - aggiorna la copy del form per dichiarare le sole viste tecniche `Sinistra / Destra`;
  - aggiunge nel `Quadro manutenzioni PDF` lo `Step 3` con input visibile `Filtra per targa o autista`;
  - il filtro rapido del quadro agisce sui risultati mostrati e resta separato dalla ricerca generale alta di pagina.
- `src/next/next-mappa-storico.css`:
  - adatta la griglia degli step del quadro a 3 blocchi visibili;
  - aggiunge il trattamento visuale dell'immagine tecnica nel viewer embedded.
- Nessuna modifica a madre, Euromecc, backend/rules, PDF engine globale, `Calibra`, `mezziHotspotAreas.ts` o altri moduli NEXT.
- Verifiche tecniche:
  - `npx eslint src/next/NextMappaStoricoPage.tsx src/next/NextManutenzioniPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT29 - nuova UI tab Riepilogo Euromecc + export PDF
- `PROMPT29` completato sul runtime `/next/euromecc` tab `Riepilogo`.
- `src/next/NextEuromeccPage.tsx`:
  - rimosso JSX inline del tab `report` (textarea + window.print).
  - rimossi `buildReportText`, `copyText`, `reportText`, `handleCopyReport` — ora non piu necessari.
  - aggiunto import `EuromeccAreaType` da `./euromeccAreas`.
  - aggiunto tipo locale `RiepilogoCardData`.
  - aggiunta funzione `generatePdfRiepilogo()` con import lazy di `jspdf`, `jspdf-autotable`, `html2canvas`.
  - aggiunta funzione `buildRiepilogoCards()` che costruisce le card per area filtrate per periodo.
  - aggiunti componenti locali: `RiepilogoMappaImpianto`, `RiepilogoCaricoDiagram`, `RiepilogoAreaCard`, `RiepilogoTab`.
  - il tab `report` usa ora `<RiepilogoTab>` con mappa SVG read-only, card per area ordinate per urgenza, layout speciale punti di carico con overlay frecce SVG, bottone Esporta PDF.
- `src/next/next-euromecc.css`: aggiunte tutte le classi `eur-riepilogo-*` definite nella spec.
- `package.json`: aggiunto `html2canvas ^1.4.1` come dipendenza esplicita (era gia presente in node_modules come transitiva).
- `MapSvg`, `SiloDiagram`, `CaricoDiagram`, `CARICO_HOTSPOTS`, `SILO_HOTSPOTS`, altri tab, Firestore: NON toccati.
- Archivio PDF su Firestore: NON implementato (fase 2, escluso esplicitamente dal prompt).
- Verifiche tecniche:
  - `npm run build` -> OK, zero errori TypeScript.
- Stato modulo:
  - `Euromecc` -> `PARZIALE` (tab Riepilogo aggiornato; verifica runtime visiva DA VERIFICARE in ambiente live).

## 0. Aggiornamento operativo 2026-04-09 PROMPT28 - rimozione completa `Calibra` dal `Dettaglio` di `Manutenzioni`
- `PROMPT28` completato sul runtime `/next/manutenzioni` con focus esclusivo sulla pulizia del tab `Dettaglio`.
- `src/next/NextMappaStoricoPage.tsx` non monta piu nel ramo `embedded`:
  - bottone `Calibra`
  - modalita calibra
  - palette forme / target
  - pulsante `Salva`
  - marker tecnici
  - drag / reposition marker
  - overlay tecnici nel viewer del dettaglio
- Il `Dettaglio` embedded resta ora composto da:
  - tab `Fronte / Sinistra / Destra / Retro`
  - viewer statico con foto/placeholder della vista attiva
  - box `Manutenzione selezionata` con data, tipo, assi, km e descrizione del record aperto
  - card destra con dati mezzo, storico recente e azioni rapide
- `src/next/domain/nextMappaStoricoDomain.ts` rimuove read/write clone-side degli override tecnici non piu usati dal runtime del dettaglio.
- `src/next/NextManutenzioniPage.tsx` aggiorna la copy del form per non rimandare piu a una gestione foto/calibra non presente nel dettaglio embedded.
- `src/next/next-mappa-storico.css` aggiunge solo lo styling del nuovo riepilogo manutenzione selezionata e mantiene il layout pulito del viewer.
- Nessuna modifica a madre, Euromecc, PDF, backend/rules, `nextManutenzioniDomain.ts`, `nextManutenzioniGommeDomain.ts` o `mezziHotspotAreas.ts`.
- Verifiche tecniche:
  - `npx eslint src/next/NextMappaStoricoPage.tsx src/next/NextManutenzioniPage.tsx src/next/domain/nextMappaStoricoDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-09 PROMPT27 - distinzione gomme ordinarie vs straordinarie in `Manutenzioni`
- `PROMPT27` completato sul runtime `/next/manutenzioni` con focus esclusivo sulla separazione tra cambio gomme ordinario e cambio gomme straordinario.
- `src/next/domain/nextManutenzioniDomain.ts` estende in modo retrocompatibile il record clone-side di manutenzione con:
  - `gommeInterventoTipo?: "ordinario" | "straordinario"`
  - `gommeStraordinario?: { asseId; quantita; motivo }`
- Il form `Nuova / Modifica` di `src/next/NextManutenzioniPage.tsx` espone ora 2 flussi gomme distinti:
  - `Gomme ordinarie per asse` -> mantiene selezione assi + `gommePerAsse`
  - `Gomme straordinarie` -> salva un evento puntuale con motivo esplicito, asse facoltativo e quantita facoltativa, senza aggiornare lo stato ordinario per asse
- `src/next/domain/nextManutenzioniGommeDomain.ts` esclude ora gli eventi straordinari dal calcolo `buildNextGommeStateByAsse(...)` e costruisce un elenco separato di eventi straordinari per il quadro.
- Il `Quadro manutenzioni PDF` distingue ora davvero:
  - `Stato gomme ordinario per asse`
  - `Eventi gomme straordinari`
- L'export PDF tabellare del modulo rende esplicita la differenza tra `Gomme ordinarie per asse` e `Gomme straordinarie` anche nel campo sottotipo/descrizione.
- Nessuna modifica a viewer tecnico, `NextMappaStoricoPage.tsx`, `nextMappaStoricoDomain.ts`, `mezziHotspotAreas.ts`, madre, Euromecc o backend.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 PROMPT26 - stato gomme per asse in `Manutenzioni`
- `PROMPT26` completato sul runtime `/next/manutenzioni` con focus esclusivo sulla gestione gomme per asse.
- `src/next/domain/nextManutenzioniDomain.ts` estende in modo retrocompatibile il record clone-side di manutenzione con `gommePerAsse?: { asseId; dataCambio; kmCambio }[]`, mantenendo `assiCoinvolti` e senza rompere i record legacy privi del nuovo campo.
- `src/next/domain/nextManutenzioniGommeDomain.ts` costruisce ora lo stato finale gomme per asse usando gli assi canonici reali (`anteriore`, `posteriore`, `asse1`, `asse2`, `asse3`) e il reader canonico km attuali gia in uso nel modulo.
- `src/next/NextManutenzioniPage.tsx` aggiorna `Nuova / Modifica`:
  - gli assi vengono mostrati solo nel flusso `gomme`;
  - il salvataggio registra un evento per asse con `dataCambio` e `kmCambio` se applicabile;
  - per categorie non motorizzate il km resta facoltativo e non dominante.
- Il `Quadro manutenzioni PDF` espone ora anche il filtro `Attrezzature` e mostra per i risultati `Mezzo` lo stato gomme per asse:
  - motorizzati -> `data cambio`, `km cambio`, `km attuali`, `km percorsi`;
  - rimorchi / semirimorchi -> `data cambio` come dato principale.
- Nessuna modifica a `NextMappaStoricoPage.tsx`, `nextMappaStoricoDomain.ts`, `mezziHotspotAreas.ts`, madre, viewer tecnico o backend.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/domain/nextRifornimentiDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 PROMPT24 - Display marker salvati in modalita normale + PROMPT24 audit 4 problemi
- Audit PROMPT24 completato sul runtime `/next/manutenzioni`:
  - Problema A (`Calibra`): il flusso create/place/drag/save/reload era gia funzionale nei run precedenti; il gap residuo era che i marker salvati NON erano visibili in modalita normale (non-calibra). Risolto: in modalita normale il viewer tecnico mostra ora span read-only per i target con override persistito, senza interattivita.
  - Problema B (`Km dal cambio gomme`): gia implementato nei run precedenti; `kmPercorsiDalCambio` calcolato e mostrato nel pannello laterale del `Dettaglio` quando il record aperto e di tipo gomme e i dati km sono validi.
  - Problema C (`Deduplica`): gia implementato nei run precedenti; `ultimeManutenzioniMezzoSenzaUltimo` filtra per `id` il record gia mostrato in `Ultimo intervento mezzo`.
  - Problema D (`Clean UX`): gia implementato; modalita normale pulita, calibra con board e palette distinta.
- `src/next/NextMappaStoricoPage.tsx`: il canvas tecnico ora mostra span `man2-technical-marker--readonly` per i soli target salvati in vista normale; in calibra mostra i marker button interattivi come prima.
- `src/next/next-mappa-storico.css`: aggiunta `.man2-technical-marker--readonly` (pointer-events: none, opacity ridotta).
- Verifiche tecniche:
  - `npm run build` -> OK
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - `Calibra` create/place/drag/save + deduplica runtime in `Manutenzioni`
- Audit sul codice reale del runtime `/next/manutenzioni` completato:
  - il doppione ancora visibile nasceva dal parent `NextManutenzioniPage`, che costruiva `Ultimo intervento mezzo` e `Ultime manutenzioni mezzo` dalla stessa testa lista;
  - `Calibra` era gia avanzato ma non rispettava ancora il flusso esplicito richiesto `create/place/drag/save`.
- `src/next/NextManutenzioniPage.tsx` passa ora al `Dettaglio` una lista `ultimeManutenzioniMezzo` gia deduplicata rispetto al record mostrato nel box `Ultimo intervento mezzo`.
- `src/next/NextMappaStoricoPage.tsx` implementa ora il flusso completo:
  - click `Calibra`;
  - selezione target dalla palette;
  - click sul disegno per creare/posizionare il marker;
  - drag di un marker gia salvato per riposizionarlo;
  - bottone `Salva` esplicito;
  - rilettura successiva della posizione salvata.
- `src/next/domain/nextMappaStoricoDomain.ts` persiste gli override tecnici clone-side su dataset visuale separato per:
  - `categoriaKey`
  - `vista`
  - `targetId`
  - `x`
  - `y`
- `src/next/next-mappa-storico.css` aggiunge lo styling dei marker tecnici trascinabili e delle azioni di calibrazione, senza toccare la madre.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - deduplica storico + `Calibra` reale in `Manutenzioni`
- Audit locale sul runtime di `/next/manutenzioni` completato:
  - il box `Ultimo intervento mezzo` e la lista `Ultime manutenzioni mezzo` mostravano lo stesso record;
  - `Calibra` permetteva solo preview/selezione, non vero spostamento marker con persistenza.
- `src/next/NextManutenzioniPage.tsx` deduplica ora la lista `Ultime manutenzioni mezzo`, escludendo il record gia esposto in `Ultimo intervento mezzo`.
- `src/next/domain/nextMappaStoricoDomain.ts` introduce override tecnici clone-side persistiti su chiave locale separata per:
  - `categoriaKey`
  - `vista`
  - `targetId`
  - `x`
  - `y`
- `src/next/NextMappaStoricoPage.tsx` usa ora questi override nel viewer tecnico:
  - in `Calibra` l'utente seleziona un target dalla palette;
  - clicca sul disegno per posizionarlo o trascina un marker gia salvato per spostarlo;
  - al rilascio il viewer salva la nuova posizione e la rilegge dal layer clone-side.
- Il perimetro resta confinato alla NEXT: nessuna patch a madre, Firestore/rules/backend o PDF.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - delta km gomme + tooltip `Calibra` in `Manutenzioni`
- Audit locale completato sul runtime reale di `/next/manutenzioni`: il km attuale del mezzo nel tab `Dettaglio` deriva gia dal reader canonico rifornimenti `readNextRifornimentiReadOnlySnapshot()` tramite `readPageData()` in `src/next/NextManutenzioniPage.tsx`; non e stato introdotto nessun reader nuovo.
- `src/next/NextManutenzioniPage.tsx` passa ora al viewer tecnico anche `km` e `tipo` del record manutenzione aperto.
- `src/next/NextMappaStoricoPage.tsx` mostra il delta `Km dal cambio gomme` solo quando tutte queste condizioni sono vere:
  - il record aperto e coerente con una manutenzione gomme (`assiCoinvolti` presenti oppure descrizione/tipo compatibili);
  - il record contiene `km` valido del cambio;
  - il mezzo ha `kmAttuali` valido da ultimo rifornimento;
  - il delta non e negativo.
- Se uno dei dati manca o il delta non e affidabile, il viewer resta pulito e non mostra numeri inventati.
- Il bottone `Calibra` non aggiunge piu testo guida fisso nel layout: ora espone un help breve via `title` + `aria-label`, valido sia su hover sia su focus tastiera.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - visibilita runtime `Attrezzature` + `Calibra` in `Manutenzioni`
- Audit runtime locale eseguito sul codice reale di `/next/manutenzioni`:
  - `Attrezzature` non era presente nel JSX runtime del form `Nuova / Modifica`;
  - `Calibra` esisteva nel viewer embedded del `Dettaglio`, ma il bottone risultava quasi invisibile perche montato con variante secondaria trasparente su superficie chiara.
- `src/next/NextManutenzioniPage.tsx` espone ora davvero 3 opzioni tipo intervento:
  - `Mezzo`
  - `Compressore`
  - `Attrezzature`
- `src/next/domain/nextManutenzioniDomain.ts` estende in modo retrocompatibile il tipo manutenzione per supportare `attrezzature` anche in salvataggio/lettura clone-side.
- `src/next/NextMappaStoricoPage.tsx` e `src/next/next-mappa-storico.css` rendono il comando `Calibra` leggibile e visibile nel toolbar tecnico del tab `Dettaglio`, senza rifare il viewer.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - binding esplicito record -> viewer tecnico in `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, il tab `Dettaglio` non usa piu fallback impliciti alla prima/ultima manutenzione con `assiCoinvolti`.
- `src/next/NextManutenzioniPage.tsx` mantiene ora un `selectedDetailRecordId` esplicito e passa a `NextMappaStoricoPage` il record manutenzione realmente aperto dalla UI parent.
- Le superfici che aprono il dettaglio da un record reale impostano ora quel record in modo esplicito:
  - `Ultimi interventi` in `Dashboard`;
  - `Apri dettaglio` nel `Quadro manutenzioni PDF`;
  - selezione voci storico direttamente nella card destra del `Dettaglio`.
- `src/next/NextMappaStoricoPage.tsx` usa il record selezionato come unica sorgente per:
  - `assiCoinvolti`;
  - label del viewer tecnico;
  - azione `Modifica manutenzione aperta`.
- Se il record aperto non ha `assiCoinvolti`, la tavola tecnica resta pulita; `Calibra` continua a lavorare sul record aperto.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `KO` per errori preesistenti fuori whitelist in `src/next/NextEuromeccPage.tsx`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - viewer tecnico `Dettaglio` pulito + modalita `Calibra` in `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, il ramo tecnico `Sinistra/Destra` del tab `Dettaglio` non mostra piu marker neutri permanenti: in vista normale restano solo immagine tecnica e highlight reali della manutenzione aperta.
- `src/next/NextMappaStoricoPage.tsx` introduce una modalita `Calibra` dedicata al viewer tecnico:
  - in vista normale il renderer e pulito;
  - in `Calibra` compaiono preview asse cliccabile e grammatica target per verificare il mapping, senza sporcare il runtime operativo.
- `src/next/mezziHotspotAreas.ts` tipizza ora i target hotspot con `targetKind` e permette di distinguere davvero:
  - `assi` -> glow/circoli;
  - `fanali_specchi` -> capsule/pill;
  - `attrezzature` -> marker tecnici non circolari.
- `src/next/next-mappa-storico.css` nasconde gli overlay neutri del renderer tecnico fuori da `Calibra`, differenzia i marker delle viste foto e riallinea il comportamento visuale del dettaglio al dato realmente salvato.
- Nessuna modifica a Firestore/backend/rules, writer business, PDF o moduli legacy.
- Verifiche tecniche:
  - `npx eslint src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - flusso assi strutturato in `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni` il modulo NEXT supporta ora un flusso gomme/assi nuovo e inline, senza riaprire il modale legacy:
  - in `Nuova / Modifica` l'utente seleziona gli assi coinvolti tramite chip inline;
  - il record manutenzione salva in modo retrocompatibile il nuovo campo opzionale `assiCoinvolti?: string[]`;
  - nel tab `Dettaglio`, per le sole viste `Sinistra` e `Destra`, il viewer carica la tavola tecnica reale da `public/gomme` in base alla categoria del mezzo e illumina automaticamente gli assi salvati;
  - `Fronte` e `Retro` mantengono il fallback attuale foto/hotspot.
- `src/next/domain/nextManutenzioniDomain.ts` estende in modo compatibile il record manutenzione e il payload di salvataggio con `assiCoinvolti`, senza inferenze dal testo descrizione e senza rompere i record legacy privi del campo.
- `src/next/domain/nextManutenzioniGommeDomain.ts` ospita ora helper NEXT-only per:
  - normalizzare gli id asse canonici (`anteriore`, `posteriore`, `asse1`, `asse2`, `asse3`);
  - risolvere assi disponibili per categoria;
  - mappare in modo deterministico categoria -> tavola tecnica reale `DX/SX` usando i file davvero presenti in `public/gomme`, compresa l'anomalia reale `motrice2assiSx.png`.
- `src/next/NextManutenzioniPage.tsx` rimuove il ponte verso `NextModalGomme` e sostituisce il vecchio bottone con selezione assi inline coerente col form attuale.
- `src/next/NextMappaStoricoPage.tsx` aggiunge un ramo embedded tecnico per `Sinistra/Destra`: usa `TruckGommeSvg` solo come renderer SVG, ma senza montare il runtime del vecchio modale; gli hotspot restano disponibili solo sulle viste foto/fallback.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - fix definitivo della riga `Data / KM-Ore / Fornitore` in `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni` e stata corretta solo la resa strutturale della riga campi `Data / KM-Ore / Fornitore` nella tab `Nuova / Modifica`.
- `src/next/next-mappa-storico.css` usa ora una griglia desktop piu pulita e proporzionata:
  - `Data` su colonna corta fissa;
  - `KM/Ore` su colonna medio-corta stabile;
  - `Fornitore` su colonna lunga flessibile;
  - niente 3 colonne uguali e niente campo centrale visivamente strozzato.
- Nessuna modifica a JSX, domain, writer, route, `pdfEngine`, Firestore o logica dati.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - foto rimosse da `Nuova / Modifica` in `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, la tab `Nuova / Modifica` non espone piu la gestione foto del mezzo:
  - rimossi sezione `4 foto collegate al dettaglio`, placeholder `Fronte / Sinistra / Destra / Retro`, pulsanti upload e preview dalla schermata form;
  - al loro posto resta solo una nota sintetica che rimanda alla tab `Dettaglio`.
- La gestione foto resta disponibile solo nel tab `Dettaglio`, che continua a usare `NextMappaStoricoPage` come sede corretta per viste foto e hotspot.
- `src/next/NextManutenzioniPage.tsx` accorcia il form e aggiorna la copy iniziale del pannello operativo; `src/next/next-mappa-storico.css` aggiunge solo lo stile minimo della nota e compatta il blocco finale.
- Nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextMappaStoricoDomain.ts`, `src/utils/cloneWriteBarrier.ts`, route, writer business o `pdfEngine`.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - micro-fix UI mirato su `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni` e stato applicato un fix mirato a 4 problemi reali emersi nel browser, senza cambiare routing, business o struttura principale del modulo.
- `src/next/next-mappa-storico.css` corregge il bilanciamento tema:
  - il contenuto operativo dei tab appare ora come superficie chiara continua e dominante;
  - il nero resta confinato soprattutto a shell esterna, tab principali, outline e accenti;
  - i pannelli interni di `Nuova / Modifica`, `Dettaglio` e `Quadro manutenzioni PDF` risultano meno percepiti come isole sparse nel nero.
- `src/next/NextManutenzioniPage.tsx` corregge la tab `Nuova / Modifica`:
  - la riga `Data / KM-Ore / Fornitore` usa ora una griglia stabile con colonna corta, media e lunga, senza sovrapposizioni;
  - la card `Componenti inclusi / materiali` mantiene solo materiali/componenti pertinenti;
  - l'autosuggest materiali mostra la descrizione materiale come voce principale e il fornitore come informazione secondaria prefissata.
- Nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextMappaStoricoDomain.ts`, `src/utils/cloneWriteBarrier.ts`, route, writer business o `pdfEngine`.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - fix tema chiaro delle superfici operative di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni` non e stata cambiata la struttura del modulo: e stato corretto solo il bilanciamento chiaro/scuro delle superfici operative interne, per avvicinarlo meglio al riferimento approvato.
- `src/next/next-mappa-storico.css` mantiene shell esterna, tab principali e bottoni outline su base scura, ma porta a tema chiaro:
  - contenitori principali dei tab;
  - pannelli form di `Nuova / Modifica`;
  - card e blocchi informativi del `Dettaglio`;
  - step filtro e righe risultato di `Quadro manutenzioni PDF`;
  - input, textarea, placeholder foto e card materiali come parti coerenti della stessa superficie operativa.
- `src/next/NextManutenzioniPage.tsx` non cambia struttura, tab, flussi, routing o contenuti funzionali.
- Nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextMappaStoricoDomain.ts`, `src/utils/cloneWriteBarrier.ts`, route, writer business o `pdfEngine`.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - affinamento UI/CSS del runtime reale di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni` non e stato rifatto il modulo: e stato rifinito lo stato reale esistente per avvicinarlo meglio al mock approvato senza toccare business, routing o flussi.
- `src/next/NextManutenzioniPage.tsx` mantiene struttura, tab e logica esistenti, ma alleggerisce la dashboard:
  - copy piu corta sotto il titolo `Dashboard`;
  - rimossi i titoli sezione ridondanti sopra KPI e pulsanti azione;
  - nessun cambio a form, filtri, tab o wiring locale.
- `src/next/next-mappa-storico.css` riallinea la pelle del modulo:
  - header piu compatto e meno pesante;
  - select/search piu rifiniti;
  - strip riepilogo mezzo piu ordinata e precisa;
  - tab meno glossy e piu compatte;
  - KPI, pulsanti azione e lista `Ultimi interventi` piu compatti;
  - pannelli `Nuova / Modifica`, `Dettaglio` e `Quadro manutenzioni PDF` alleggeriti senza redesign funzionale.
- Nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextMappaStoricoDomain.ts`, `src/utils/cloneWriteBarrier.ts`, route, writer business o `pdfEngine`.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - dashboard reset UI di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, la `Dashboard` e stata alleggerita davvero e non si presenta piu come pagina a pannelli pesanti:
  - l'header comune resta l'unico blocco condiviso e contiene solo titolo `MANUTENZIONI`, selezione mezzo, ricerca rapida, metadati sintetici e tab;
  - sotto l'header non compaiono piu macro-card di contesto o shell duplicate.
- `src/next/NextManutenzioniPage.tsx` riallinea i 4 tab finali senza toccare business o domain:
  - tab finali presenti: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`;
  - `Storico` resta assente;
  - `Dashboard` e ridotta a risultati rapidi, accessi veloci e contesto attivo molto compatto;
  - `Nuova / Modifica` resta full-width e mantiene `Tagliando completo` visibile solo quando il tipo intervento selezionato e `Tagliando`;
  - `Quadro manutenzioni PDF` resta filtro sopra + elenco full-width sotto.
- `src/next/NextMappaStoricoPage.tsx` mantiene il `Dettaglio` come tab principale tecnico:
  - il contenuto parte subito con 2 card root vere;
  - nessun blocco hero o topbar inutile sopra al contenuto reale.
- `src/next/next-mappa-storico.css` compatta ulteriormente la Dashboard e rimuove l'effetto di macro-pannello di contesto, mantenendo il perimetro scoped `.mx-*` / `.ms-*`.
- Nessuna modifica a writer, domain business, clone barrier, PDF engine, storage logic o route legacy.
- Verifica runtime reale eseguita su `http://127.0.0.1:4173/next/manutenzioni`:
  - header comune compatto presente;
  - `Dashboard` verificata come ingresso rapido, senza pannello grande di contesto mezzo;
  - `Nuova / Modifica` full-width verificata;
  - `Tagliando completo` nascosto di default e visibile solo dopo selezione `Tagliando`;
  - `Dettaglio` verificato con `2` card root vere immediate;
  - `Quadro manutenzioni PDF` verificato con `Step 1`, `Step 2`, elenco full-width e `Apri dettaglio` funzionante verso `Dettaglio`;
  - `Storico` assente.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-08 - hard layout fix UI di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, la struttura shared con colonna laterale persistente e contesto duplicato e stata eliminata davvero:
  - l'header comune resta l'unico punto condiviso del modulo e contiene solo titolo `MANUTENZIONI`, selezione mezzo, ricerca rapida `targa / modello / autista`, metadati sintetici e tab;
  - non compaiono piu preview risultati o card contesto duplicate dentro l'header comune;
  - `Dashboard`, `Nuova / Modifica` e `Quadro manutenzioni PDF` usano tutta la larghezza disponibile senza shell left-column.
- `src/next/NextManutenzioniPage.tsx` riallinea i 4 tab finali senza toccare business o domain:
  - tab finali: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`;
  - `Storico` resta assente;
  - `Dashboard` e ridotta a ingresso rapido con risultati, navigazione veloce e contesto minimo;
  - `Nuova / Modifica` resta full-width e mantiene `Tagliando completo` visibile solo quando il tipo intervento selezionato e `Tagliando`;
  - `Quadro manutenzioni PDF` resta filtro sopra + elenco full-width sotto, senza blocchi secondari da dashboard.
- `src/next/NextMappaStoricoPage.tsx` riallinea davvero il tab `Dettaglio`:
  - nessun blocco bianco/hero inutile prima del contenuto reale;
  - il dettaglio parte subito con 2 card root vere in `.ms-layout`;
  - la card sinistra resta dominante per viste foto, hotspot, zone e indicatori coerenti con la vista attiva;
  - la card destra resta compatta per riepilogo mezzo, ultime manutenzioni e azioni rapide.
- `src/next/next-mappa-storico.css` elimina il comportamento shared-left-column e compatta l'header comune, mantenendo il perimetro scoped `.mx-*` / `.ms-*`.
- Nessuna modifica a writer, domain business, clone barrier, PDF engine, storage logic o route legacy.
- Verifica runtime reale eseguita su `http://127.0.0.1:4173/next/manutenzioni`:
  - header comune compatto presente con `1` input ricerca, `0` blocchi `.mx-header-search-results`, `0` blocchi `.mx-header-context`, `4` tab visibili;
  - `Dashboard` verificata senza `.mx-side-column`, senza `.mx-kpi-grid--dashboard`, senza `.mx-timeline-block`, come ingresso rapido puro;
  - `Nuova / Modifica` verificata senza `.mx-side-column`, con `Tagliando completo` nascosto di default e visibile solo dopo selezione `Tagliando`;
  - `Dettaglio` verificato con `2` card root vere (`.ms-column--main` + `.ms-column--side`), `0` `.ms-topbar` e `0` hero bianchi sopra il contenuto;
  - `Quadro manutenzioni PDF` verificato con `Step 1`, `Step 2`, `10` righe elenco, `0` `.mx-pdf-secondary` e `Apri dettaglio` funzionante verso il tab `Dettaglio`;
  - `Storico` assente.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-07 - riallineamento finale family UI di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, il modulo usa ora solo 4 tab coerenti con il mockup master finale:
  - `Dashboard`
  - `Nuova / Modifica`
  - `Dettaglio`
  - `Quadro manutenzioni PDF`
- `src/next/NextManutenzioniPage.tsx` riallinea la shell UI del modulo senza toccare business o domain:
  - il vecchio tab `Storico` non compare piu;
  - l'header comune resta compatto e mantiene titolo `MANUTENZIONI`, selezione mezzo, ricerca rapida `targa / modello / autista` e tab navigazione;
  - `Dashboard` resta una superficie full-width usata soprattutto per ricerca rapida, risultati immediati e accessi veloci;
  - `Nuova / Modifica` mantiene il form full-width e rende il blocco `Tagliando completo` visibile solo quando il tipo intervento selezionato e `Tagliando`;
  - `Quadro manutenzioni PDF` resta elenco-first, con `Apri dettaglio` che porta direttamente al tab `Dettaglio`.
- `src/next/NextMappaStoricoPage.tsx` viene riallineato come vero tab `Dettaglio` del modulo:
  - la vecchia topbar interna non domina piu la scena;
  - il contenuto si presenta come 2 card vere:
    - card principale foto / hotspot / zone / viste;
    - card secondaria riepilogo mezzo, azioni rapide, ultime manutenzioni e cronologia collegata.
- `src/next/next-mappa-storico.css` mantiene il perimetro scoped `.ms-*` / `.mx-*` e porta il dettaglio su un layout piu netto a due superfici, senza modificare il design system globale.
- Nessuna modifica a writer, domain business, barrier clone, PDF engine, route o storage logic.
- Verifica runtime reale eseguita su `http://127.0.0.1:4173/next/manutenzioni`:
  - tab visibili: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`;
  - `Storico` assente;
  - ricerca rapida verificata con query `TI`, preview risultati presente (`6` risultati nel controllo locale) con targa, mezzo/modello e autista solito;
  - `Tagliando completo` invisibile di default e visibile solo dopo selezione `Tipo intervento = Tagliando`;
  - `Dettaglio` verificato con `2` card root vere in `.ms-layout`, azioni `Apri dossier mezzo` e `Apri quadro PDF` presenti;
  - `Quadro manutenzioni PDF` verificato con `Step 1`, `Step 2`, `10` righe elenco e `Apri dettaglio` funzionante verso il tab `Dettaglio`.
- Verifiche tecniche:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 0. Aggiornamento operativo 2026-04-07 - refactor UI `layout family` del modulo `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, i tab non sono piu trattati come pagine con la stessa impaginazione laterale ripetuta:
  - `src/next/NextManutenzioniPage.tsx` usa ora un header compatto condiviso con titolo `MANUTENZIONI`, selezione mezzo, ricerca rapida e navigazione tab, poi rende `Dashboard`, `Nuova / Modifica` e `Quadro manutenzioni PDF` come superfici full-width indipendenti della stessa famiglia;
  - il tab `Storico` e stato rimosso dalla navigazione e la sua funzione di consultazione e assorbita dal `Quadro manutenzioni PDF`;
  - `src/next/next-mappa-storico.css` riallinea la shell `.mx-*` per supportare header comune, superfici full-width e dashboard semplificata, senza toccare il tono specialistico della `Mappa storico`.
- Riallineamenti chiusi nel perimetro consentito:
  - `Dashboard` semplificata con ultimi interventi mezzo/compressore, segnalazioni aperte, `Km ultimo rifornimento`, accessi rapidi e timeline breve;
  - `Nuova / Modifica` resa pagina operativa full-width, senza card laterali fisse, mantenendo campi base, tagliando, materiali, blocco 4 foto, note e azioni finali;
  - `Quadro manutenzioni PDF` confermato come schermata principale elenco-first: prima filtro soggetto/periodo, poi risultati esportabili;
  - `Mappa storico` lasciata specialistica e separata.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`;
  - nessuna modifica a `src/next/domain/nextMappaStoricoDomain.ts`;
  - nessuna modifica a `src/utils/cloneWriteBarrier.ts`;
  - nessuna modifica a writer business, route, PDF engine o madre legacy.
- Verifica runtime reale eseguita su `http://127.0.0.1:4173/next/manutenzioni`:
  - header comune compatto presente con ricerca rapida e contesto mezzo;
  - tab visibili: `Dashboard`, `Nuova / Modifica`, `Quadro manutenzioni PDF`, `Mappa storico`;
  - tab `Storico` assente;
  - `Dashboard` full-width senza `.mx-side-column`, con `4` KPI e blocchi principali;
  - `Nuova / Modifica` full-width senza `.mx-side-column`, con `4` card foto nel corpo del form;
  - `Quadro manutenzioni PDF` full-width senza `.mx-side-column`, con `Step 1`, `Step 2`, `10` righe elenco e vecchie `.mx-pdf-result-card` assenti.
- Verifica tecnica:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`
- Limite esplicito:
  - il task riallinea solo struttura UI/layout; nessuna modifica a business o stato audit del modulo.

## 0. Aggiornamento operativo 2026-04-07 - riallineamento UI del tab `Quadro manutenzioni PDF` come elenco filtrabile
- Sul runtime ufficiale `/next/manutenzioni`, il tab `Quadro manutenzioni PDF` non usa piu i cardoni riepilogativi come struttura principale:
  - `src/next/NextManutenzioniPage.tsx` mantiene i 2 step filtro (`Soggetto`, `Periodo`) ma porta sotto un elenco operativo di risultati esportabili, con righe dedicate a foto, targa, mezzo/modello o compressore, autista solito, `Km ultimo rifornimento`, data manutenzione, tipo/manutenzione e azioni `PDF mezzo` / `PDF compressore` + `Apri dettaglio`;
  - `src/next/next-mappa-storico.css` riallinea il tab PDF a una grammatica elenco-first piu operativa, lasciando riepilogo rapido e cronologia in un blocco secondario.
- Correzione chiusa nel perimetro consentito:
  - nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`;
  - nessuna modifica a `src/next/domain/nextMappaStoricoDomain.ts`;
  - nessuna modifica a `src/utils/cloneWriteBarrier.ts`;
  - nessuna modifica a writer business, route, PDF engine o madre legacy.
- Verifica runtime reale eseguita su `http://127.0.0.1:4173/next/manutenzioni`:
  - `Step 1` e `Step 2` presenti;
  - elenco risultati presente sotto i filtri con `10` righe reali verificate;
  - vecchia struttura principale a card rimossa (`.mx-pdf-result-card` assenti nel DOM del tab attivo);
  - azioni `PDF mezzo` / `PDF compressore` e `Apri dettaglio` presenti sulle righe elenco;
  - riepilogo rapido e cronologia restano secondari sotto l'elenco.
- Verifica tecnica:
  - `npx eslint src/next/NextManutenzioniPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`
- Limite esplicito:
  - il task riallinea solo il tab `Quadro manutenzioni PDF`; nessuna modifica a business o stato audit del modulo.

## 0. Aggiornamento operativo 2026-04-07 - riallineamento UI dei tab `Dashboard`, `Storico`, `Nuova / Modifica` e `Quadro manutenzioni PDF` di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, i tab diversi da `Mappa storico` non usano piu la resa beige/generica ereditata dal layout legacy:
  - `src/next/NextManutenzioniPage.tsx` riallinea `Dashboard`, `Storico`, `Nuova / Modifica` e introduce la vista interna `Quadro manutenzioni PDF` come tab tecnico locale, senza toccare domain business, writer o route;
  - `src/next/next-mappa-storico.css` ospita ora anche lo styling scoped della shell premium dei tab non-mappa (`.mx-*`), mantenendo invariato il design system globale fuori da `/next/manutenzioni`.
- Riallineamenti chiusi nel perimetro consentito:
  - `Dashboard` ora e mezzo-centrica e compressore-centrica, con KPI tecnici, blocchi aree e azioni rapide;
  - `Storico` usa card cronologiche premium, con badge visivi distinti per `Mezzo`, `Compressore`, `Tagliando`, `Derivato`;
  - `Nuova / Modifica` separa campi base, blocco `Tagliando completo`, materiali, descrizione/note e blocco visuale delle 4 viste foto collegate alla `Mappa storico`;
  - `Quadro manutenzioni PDF` espone davvero i 2 step filtro `Soggetto` (`Mezzo` / `Compressore`) e `Periodo` (`Ultimo mese`, mesi disponibili, `Tutto`), con lista risultati impaginata sotto e cronologia completa;
  - nel modulo compare una `Ricerca mezzo rapida` con preview reale di `targa`, `marca/modello` e `autista solito`.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`;
  - nessuna modifica a `src/next/domain/nextMappaStoricoDomain.ts`;
  - nessuna modifica a `src/utils/cloneWriteBarrier.ts`;
  - nessuna modifica a writer business, upload/storage logic, route, PDF engine o madre legacy.
- Verifica runtime reale eseguita su `http://127.0.0.1:4173/next/manutenzioni`:
  - `Dashboard tecnico manutenzioni` visibile con `5` KPI, `4` blocchi area e timeline tecnica;
  - `Ricerca mezzo rapida` verificata con preview reale, es. query `TI1` -> risultato `TI178456 ... Autista solito: ORLANDO BUTTI`;
  - `Storico` verificato con card cronologiche e badge visuali;
  - `Nuova / Modifica` verificato con blocco `Tagliando completo`, sezione `Componenti inclusi / materiali` e `8` card foto complessive tra main + sidebar;
  - `Quadro manutenzioni PDF` verificato con `Step 1`, `Step 2`, `14` card risultati e cronologia sotto dopo selezione `Tutto`.
- Verifica tecnica:
  - `npx eslint src/next/NextManutenzioniPage.tsx` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`
- Limite esplicito:
  - il task riallinea solo UI/layout/UX dei tab non-mappa; nessuna modifica a business o stato audit del modulo.

## 0. Aggiornamento operativo 2026-04-07 - fix dell'inferenza zona nella `Mappa storico` di `Manutenzioni`
- Sul runtime ufficiale `/next/manutenzioni`, la vista interna `Mappa storico` non assegna piu in modo errato interventi gomme/assi anteriori alla zona `Fanali anteriori`.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/domain/nextMappaStoricoDomain.ts` sostituisce il vecchio match piatto `includes()` con una risoluzione a priorita:
    - prima ramo specialistico per `gomma/gomme/pneumatico/pneumatici/ruota/ruote/asse/assale`;
    - poi fallback generale con scoring delle keyword specifiche;
    - se il componente e riconoscibile ma la direzione non e affidabile, restituisce nessuna zona automatica;
  - `src/next/mezziHotspotAreas.ts` ripulisce le keyword troppo generiche:
    - `fronte-fanali` non usa piu `anteriore` come keyword autonoma;
    - le aree assi/pneumatici usano keyword piu specifiche per fronte/sinistra/destra/retro.
- Causa reale verificata:
  - il matcher precedente assegnava le zone filtrando tutte le aree con una qualunque keyword inclusa nel testo;
  - `fronte-fanali` conteneva la keyword troppo generica `anteriore` ed era valutata prima di `fronte-assale`;
  - un record reale come `CAMBIO GOMME ... Asse: Anteriore` finiva quindi anche su `Fanali anteriori`.
- Verifica runtime reale eseguita:
  - prima della patch:
    - `TI298409` -> `Zone: Fanali anteriori, Assale anteriore, Assi e pneumatici sinistri, Assi e pneumatici destri, Assi posteriori`
    - `TI324623` -> stesso errore su `Fanali anteriori`
  - dopo la patch:
    - `TI298409` -> `Zone: Assale anteriore`
    - `TI324623` -> `Zone: Assale anteriore`
    - `TI313387` con `asse: 1° asse` senza direzione affidabile -> `Zona non deducibile`
- Verifica tecnica:
  - `npx eslint src/next/domain/nextMappaStoricoDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
  - `npm run build` -> bundle costruito con successo (`vite build` chiuso con `✓ built`), restano solo warning noti su chunk size / `jspdf`
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`
- Limite esplicito:
  - il task corregge solo l'inferenza zona della mappa; nessuna modifica a writer business, route, barrier clone o UI generale.

## 0. Aggiornamento operativo 2026-04-07 - riallineamento UI della vista `Mappa storico` in `Manutenzioni` NEXT
- Sul runtime ufficiale `/next/manutenzioni`, quando la vista attiva e `Mappa storico`, la UI non usa piu il layout generico precedente:
  - `src/next/NextManutenzioniPage.tsx` compatta header modulo, tabs e selettore mezzo per lasciare la scena alla vista tecnica;
  - `src/next/NextMappaStoricoPage.tsx` riorganizza la vista come shell specialistica con header tecnico compatto, griglia principale a 2 colonne e pannello zona stabile;
  - `src/next/next-mappa-storico.css` sostituisce il look generico con una resa piu tecnica, piu scura e piu focalizzata, mantenendo il CSS scoped `.ms-*`.
- Obiettivi visivi chiusi nel perimetro consentito:
  - sparita la falsa colonna vuota a sinistra causata dal layout host del modulo;
  - foto/placeholder della vista attiva ora dominante e di dimensione importante;
  - colonna destra resa come pannello tecnico stabile per ricerca, filtri, dettaglio zona e storico cronologico;
  - testi descrittivi ridotti e note dati rese discrete.
- Boundary preservato:
  - nessuna modifica a domain business, writer, route, PDF, clone barrier o logica hotspot/ricerca/filtri;
  - nessuna modifica alla madre legacy.
- Verifica finale eseguita:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato davvero su `http://127.0.0.1:4173/next/manutenzioni` con screenshot e misure DOM:
    - shell `Mappa storico` a piena larghezza;
    - griglia interna ~`60/40` (`698px / 448px`);
    - superficie foto/placeholder dominante (`664px` di larghezza);
    - nessun paragrafo descrittivo legacy residuo nel dettaglio zona.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`
- Limite esplicito:
  - il task riallinea solo la UI/layout della vista `Mappa storico`; non cambia lo stato audit del modulo e non apre nuove logiche business.

## 0. Aggiornamento operativo 2026-04-07 - `Manutenzioni` NEXT reso scrivente con vista interna `Mappa storico`
- La route ufficiale `/next/manutenzioni` non e piu un clone read-only:
  - `src/next/NextManutenzioniPage.tsx` e ora il runtime NEXT reale del modulo, con dashboard, storico, form di creazione/modifica, eliminazione e vista interna `Mappa storico`;
  - il writer business passa da `src/next/domain/nextManutenzioniDomain.ts`, preservando la shape legacy reale su `@manutenzioni` (`id`, `targa`, `tipo`, `fornitore`, `km`, `ore`, `sottotipo`, `descrizione`, `eseguito`, `data`, `materiali`);
  - la vista `Mappa storico` vive dentro la stessa route, senza nuova route dedicata e senza toccare `src/App.tsx`.
- Compatibilita business preservata nel perimetro verificato:
  - scrittura compatibile su `@manutenzioni`;
  - effetti legacy replicati su `@inventario` e `@materialiconsegnati` con la stessa prudenza del modulo madre;
  - convergenza gomme riusata via `nextManutenzioniGommeDomain.ts`, senza rompere le voci derivate da eventi autisti;
  - `Km ultimo rifornimento` letto solo via `nextRifornimentiDomain.ts`, mai da sort raw di `@rifornimenti`.
- Nuova vista interna `Mappa storico`:
  - nuove letture/scritture visuali isolate in `src/next/domain/nextMappaStoricoDomain.ts`;
  - metadati visuali separati su `@mezzi_foto_viste` e `@mezzi_hotspot_mapping`;
  - upload foto in Firebase Storage su `mezzi_foto/{targa}/{vista}_{timestamp}.{ext}`;
  - 4 viste (`fronte`, `sinistra`, `destra`, `retro`), ricerca storico, filtri/modali, dettaglio zona e hotspot manuali.
- Boundary clone aggiornato in modo chirurgico:
  - `src/utils/cloneWriteBarrier.ts` consente su `/next/manutenzioni` solo `storageSync.setItemSync` per `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`;
  - consentito solo `storage.uploadBytes` su path `mezzi_foto/...`;
  - nessun widening globale del clone e nessuna apertura su altre route/moduli.
- Verifica finale eseguita:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/mezziHotspotAreas.ts src/next/NextMappaStoricoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale reale su `http://127.0.0.1:4173/next/manutenzioni`:
    - route aperta senza errori;
    - modulo non piu read-only;
    - creazione, modifica ed eliminazione verificate davvero sul dataset reale con record di test poi rimosso;
    - convergenza gomme verificata davvero su mezzo reale `TI178456` (`gommeItems > 0`);
    - `Mappa storico` visibile come vista interna;
    - upload foto vista, hotspot, dettaglio zona, ricerca e filtri verificati davvero;
    - label `Km ultimo rifornimento` verificata davvero.
- Stato aggiornato del modulo:
  - `Manutenzioni` -> `PARZIALE`
- Limite esplicito:
  - la patch execution non auto-promuove il modulo a `CHIUSO` senza audit separato;
  - il test runtime foto ha ripristinato i metadati visuali, ma un eventuale file binario di prova su Storage puo restare orfano perche questa patch non apre un flusso delete foto.

## 0. Aggiornamento operativo 2026-04-07 - fix del pulsante chiusura nel modale `Controllo originale` di `Lavori`
- Sul runtime ufficiale del modulo `Lavori` NEXT il modale `Controllo originale` non mostra piu il carattere sporco `Ã—` in alto a destra.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextDettaglioLavoroPage.tsx` sostituisce la stringa corrotta hardcoded del close button del solo modale controllo con `&times;` e aggiunge `aria-label` esplicito;
  - nessuna modifica a matching `segnalazione` / `controllo`, logica dati, route o letture dei dataset origine;
  - nessuna modifica CSS necessaria.
- Causa reale verificata:
  - il modale `Controllo originale` renderizzava una sequenza corrotta nel JSX (`Ã—` / `Ãƒâ€”`) invece di una chiusura stabile;
  - il problema era locale al bottone del modale controllo, non alla logica del modulo.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/dettagliolavori/daade4a2-c681-46d0-99d4-1906d151116d?from=lavori-in-attesa`:
    - click `Apri controllo` -> il close button mostra `×`;
    - click sul close button -> il modale si chiude correttamente.
- Stato aggiornato del modulo:
  - `Lavori` -> `PARZIALE`
- Limite esplicito:
  - il prompt chiude solo il difetto visivo del close button del modale controllo e non amplia il perimetro del modulo.

## 0. Aggiornamento operativo 2026-04-07 - dettaglio `Lavori` NEXT esteso ai lavori nati da `controllo mezzo KO`
- Sul runtime ufficiale del modulo `Lavori` NEXT il dettaglio non copre piu solo le origini `source.type = "segnalazione"`:
  - `src/next/NextDettaglioLavoroPage.tsx` distingue ora in modo esplicito `segnalazione` vs `controllo`;
  - il blocco UI e stato generalizzato in `Problema / esito origine`;
  - per i controlli KO legge davvero `@controlli_mezzo_autisti` e mostra il testo reale del record origine.
- Matching reale verificato e ristretto:
  - per `segnalazione` il comportamento gia corretto resta invariato;
  - per `controllo` priorita a `source.id/originId` del lavoro;
  - fallback solo sul backlink reale `linkedLavoroId` / `linkedLavoroIds` del record controllo;
  - nessun fallback fragile su targa, autore o testo per aprire controlli.
- Dato reale mostrato per i controlli:
  - priorita ai campi `note`, poi `dettaglio`, poi `messaggio`;
  - se presenti check KO nel payload `check/koItems`, il dettaglio aggiunge `Check KO: ...`;
  - se il controllo origine esiste ma non contiene testo utile, il dettaglio mostra `Nessuna nota presente nel controllo originale`.
- Apertura origine corretta:
  - `Apri segnalazione` continua ad aprire la segnalazione originale in modale read-only;
  - `Apri controllo` apre ora il controllo originale in modale read-only, senza route nuove, con autore, data/ora, target, mezzo coinvolto, esito KO/OK, check KO e nota reale.
- Verifica finale eseguita:
  - caso reale route diretta `segnalazione`: lavoro `7c6af494-9b02-4bf2-ac67-c994b39436c0` -> testo `Freni da controllare` + modale `Apri segnalazione` corretto;
  - caso reale route diretta `controllo`: lavoro `daade4a2-c681-46d0-99d4-1906d151116d` -> testo `1 asse rimorchio gomme lisce` + `Check KO: GOMME` + modale `Apri controllo` corretto;
  - caso reale multi-link controllo via backlink `linkedLavoroIds`: lavori `82df827a-b18b-43fa-b4ee-abf8e3b36389` e `f8288347-2b06-4976-9e86-8ea152da1bd2` -> stesso controllo originale corretto;
  - dettaglio in modale verificato davvero da `/next/lavori-in-attesa` per entrambi i casi;
  - `npm run build` -> `OK`;
  - `npm run lint` -> `KO` per debito storico globale gia presente fuori perimetro; il file toccato passa comunque con `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx`.
- Stato aggiornato del modulo:
  - `Lavori` -> `PARZIALE`
- Limite esplicito:
  - il modulo non e dichiarabile `CHIUSO`; la patch copre solo il delta reale del dettaglio origine `controllo` senza toccare madre, route o altri moduli.

## 0. Aggiornamento operativo 2026-04-06 - rifinitura UI/PDF/Home del modulo `Lavori` NEXT
- Sul runtime ufficiale del modulo `Lavori` NEXT sono stati corretti difetti reali di leggibilita, senza spegnere la logica reale gia riaperta nel perimetro Lavori.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextLavoriDaEseguirePage.tsx` mostra ora `Segnalato da` e `Autista solito` nelle tabelle reali `In attesa` / `Eseguiti`, migliora l'export PDF sul canale esistente e applica colori reali di priorita sia nel form `Aggiungi` sia sulle righe tabella;
  - `src/next/NextDettaglioLavoroPage.tsx` espone `Segnalato da` e `Autista solito` anche nel riepilogo dettaglio e nel PDF reale del dettaglio, restando coerente con la route viva `/next/dettagliolavori/:lavoroId`;
  - `src/next/NextHomePage.tsx` integra nel blocco alert/scadenze della dashboard anche un riquadro `Lavori in attesa` con contatori reali e anteprima dei lavori piu rilevanti, linkando al modulo Lavori senza introdurre nuove scritture.
- Boundary preservato:
  - nessuna modifica a madre legacy, route, shell, barriere clone, `src/main.tsx`, Firebase/rules o domain cross-modulo;
  - nessuna modifica alla logica reale di salvataggio/modifica/esecuzione/eliminazione del modulo Lavori;
  - nessuna nuova superficie read-only o notice clone-safe sul modulo.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src\\next\\NextLavoriDaEseguirePage.tsx src\\next\\NextDettaglioLavoroPage.tsx src\\next\\NextHomePage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/lavori-in-attesa`, `/next/lavori-eseguiti`, `/next/lavori-da-eseguire?tab=aggiungi`, `/next/dettagliolavori/:lavoroId` e `/next` Home con dataset reale.
- Stato aggiornato del modulo:
  - `Lavori` -> `PARZIALE`
- Limite esplicito:
  - il modulo non va promosso a `CHIUSO` con questa patch; resta necessario un audit separato post-rifinitura per confermare parity finale del perimetro Lavori aperto in scrittura.

## 0. Aggiornamento operativo 2026-04-05 - pulizia dei base status statici della mappa `Euromecc`
- Sul runtime ufficiale `/next/euromecc`, con collection `Euromecc` vuote, la mappa non mostra piu warning gialli ereditati dalla sola topologia statica.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/euromeccAreas.ts` porta a `ok` tutti i `base` statici che prima partivano da `check`;
  - nessuna modifica al domain runtime `nextEuromeccDomain.ts`, che continua a supportare `check` se in futuro verra introdotta una regola dati esplicita;
  - nessuna modifica a Firestore, route, fullscreen o UI generale del modulo.
- Boundary preservato:
  - i colori restano guidati dai dati reali:
    - pending reale -> `maint`
    - issue reale non osservazione -> `issue`
    - issue osservazione -> `obs`
    - done recente -> `done`
    - base/default neutro -> `ok`
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/euromeccAreas.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/euromecc` con collection Euromecc vuote:
    - assenza di pallini gialli di default nella Home map;
    - fullscreen ancora funzionante.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il change pulisce solo il default statico iniziale della topologia e non introduce nuove regole stato o nuove sorgenti dati.

## 0. Aggiornamento operativo 2026-04-04 - hardening Firestore del modulo `Euromecc`
- Il repository versiona ora anche il perimetro sicurezza Firestore del modulo nativo NEXT `Euromecc`.
- Correzione applicata solo nel perimetro consentito:
  - creato `firestore.rules`;
  - aggiornato `firebase.json` per puntare esplicitamente a `firestore.rules`;
  - introdotte regole esplicite per:
    - `euromecc_pending`
    - `euromecc_done`
    - `euromecc_issues`
    - `euromecc_area_meta`
- Modello auth reale verificato nel repo:
  - bootstrap globale con `signInAnonymously()` in `src/App.tsx`;
  - nessun login admin dedicato o claims per-ruolo dimostrati nel runtime corrente.
- Protezione chiusa davvero nel repo per il modello attuale:
  - nessuna regola `allow ... if true`;
  - accesso consentito solo se `request.auth != null`;
  - validazione strutturale esplicita dei documenti Euromecc in scrittura;
  - chiusura issue limitata all'update coerente `aperta -> chiusa`;
  - le 4 collection Euromecc hanno `match` dedicati e piu stretti del fallback generale.
- Limite residuo dichiarato apertamente:
  - la sicurezza per-ruolo non e chiusa nel repo, perche il codice reale non dimostra ancora ruoli/claims server-side verificabili;
  - il modulo `Euromecc` resta quindi `PARZIALE`, ma il suo boundary Firestore e ora esplicitato e versionato secondo il modello auth oggi realmente usato dall'app.
- Verifica finale eseguita:
  - `firestore.rules` presente nel repo;
  - `firebase.json` collegato al file corretto;
  - `npm run build` -> `OK`;
  - validazione Firebase locale senza deploy `DA VERIFICARE`, perche il repo non espone un comando/tooling dedicato gia governato per compilare le rules in locale.

## 0. Aggiornamento operativo 2026-04-04 - Euromecc integrato nella chat libera della IA interna in sola lettura
- La chat libera `/next/ia/interna` puo ora leggere e intrecciare i dati veri del modulo nativo NEXT `Euromecc`, senza aprire nessuna scrittura business nuova.
- Integrazione applicata solo nel perimetro consentito:
  - `src/next/internal-ai/internalAiEuromeccReadonly.ts` introduce il retriever/read-model dedicato Euromecc in sola lettura, costruito sopra `readEuromeccSnapshot()` e `euromeccAreas.ts`;
  - `src/next/internal-ai/internalAiChatOrchestratorBridge.ts` intercetta i prompt Euromecc e risponde tramite snapshot aggregato spiegabile;
  - `src/next/internal-ai/internalAiUniversalContracts.ts` e `src/next/internal-ai/internalAiUniversalRequestResolver.ts` censiscono `Euromecc` come modulo/adapter/capability reale del planner universale IA.
- Boundary preservato:
  - nessuna modifica a `src/App.tsx`, route, sidebar, shell o UI Euromecc;
  - nessuna modifica a `firestore.rules`, `firebase.json`, writer legacy o runtime IA legacy;
  - nessun writer Euromecc viene chiamato dalla chat.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/internal-ai/internalAiEuromeccReadonly.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/ia/interna` con richieste reali su cemento silo, problemi aperti, manutenzioni da fare, sili senza cemento e riepilogo generale Euromecc.
- Stato aggiornato dei moduli:
  - `Euromecc` -> `PARZIALE`
  - `IA interna universale` -> `PARZIALE`
- Limite esplicito:
  - l'integrazione Euromecc lato IA resta strettamente read-only e non apre live-read backend business o azioni operative sul modulo.

## 0. Aggiornamento operativo 2026-04-04 - `Tipo cemento` Euromecc con short label, preset rapidi e compatibilita retroattiva
- Sul runtime ufficiale `/next/euromecc` la gestione del `tipo cemento` dei sili e stata evoluta senza rompere i dati gia salvati.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/domain/nextEuromeccDomain.ts` estende `euromecc_area_meta` con `cementTypeShort?`, mantiene compatibilita con i vecchi record che contengono solo `cementType` e introduce il fallback puro `deriveEuromeccCementTypeShortLabel()`;
  - `src/next/NextEuromeccPage.tsx` mostra nella Home map solo la sigla breve, mentre `Focus area` e fullscreen mostrano il nome completo con sigla secondaria;
  - `src/next/NextEuromeccPage.tsx` aggiorna il modale con preset rapidi, input libero per nome completo e campo opzionale per sigla breve;
  - `src/next/next-euromecc.css` aggiunge solo lo stretto necessario per short label, preset e leggibilita del modale.
- Boundary preservato:
  - nessuna modifica a route, sidebar, fullscreen operativo, `euromeccAreas.ts`, file madre, writer legacy, rules o collection diverse da `euromecc_area_meta`;
  - nessuna modifica a `src/App.tsx`, `src/next/nextData.ts`, `src/firebase.ts`, `firestore.rules`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/euromecc`:
    - il modale preset/custom si apre da un silo;
    - il salvataggio reale aggiorna `euromecc_area_meta`;
    - la Home map mostra la short label;
    - `Focus area` e fullscreen mostrano il nome completo;
    - dopo refresh il valore resta persistente;
    - i record vecchi senza `cementTypeShort` continuano a funzionare via fallback;
    - i non-silo non espongono il controllo.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il flusso resta limitato ai soli sili e non apre altri metadati area oltre al `tipo cemento`.

## 0. Aggiornamento operativo 2026-04-04 - `Tipo cemento` persistente per i sili del modulo `Euromecc`
- Sul runtime ufficiale `/next/euromecc` i soli sili possono ora leggere e salvare un `tipo cemento` persistente, senza sporcare `euromeccAreas.ts`.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/domain/nextEuromeccDomain.ts` introduce la collection dedicata `euromecc_area_meta`, il meta-doc `areaKey/cementType/updatedAt/updatedBy?`, il merge nel reader `readEuromeccSnapshot()` e il writer `saveEuromeccAreaCementType()`;
  - `src/next/NextEuromeccPage.tsx` mostra il valore nella Home map dentro ogni silo, in grassetto e leggibile, e apre un modale di modifica dal pannello `Focus area` solo se l'area corrente e un silo;
  - `src/next/next-euromecc.css` aggiunge solo lo stile minimo per testo cemento, card `Focus area` e modale piccolo.
- Boundary preservato:
  - nessuna modifica a route, sidebar, fullscreen principale, `euromeccAreas.ts`, file madre, writer legacy o `storage/@...`;
  - nessuna modifica a `src/App.tsx`, `src/next/nextData.ts`, `src/firebase.ts`, `firestore.rules`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/euromecc`:
    - il tipo cemento e visibile dentro un silo nella Home;
    - il modale si apre dal `Focus area` solo sui sili;
    - il salvataggio aggiorna Firestore su `euromecc_area_meta`;
    - dopo refresh il valore resta persistente.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il flusso e disponibile solo per i sili e non viene esposto ai nodi non-silo.

## 0. Aggiornamento operativo 2026-04-04 - Riallineamento della `Mappa impianto` Home `Euromecc` alla reference
- Sul runtime ufficiale `/next/euromecc` la `Mappa impianto` della tab `Home` non usa piu una composizione semplificata e diversa dalla reference utente.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextEuromeccPage.tsx` ricompone la mappa Home con linea superiore etichettata, gruppi doppi reali `Silo 2` e `Silo 6`, barre strutturali centrali, linee di collegamento e distribuzione inferiore coerente con la reference;
  - `src/next/next-euromecc.css` aggiunge solo lo stile scoped necessario a etichette strutturali, barre di famiglia e gerarchia visiva del nuovo SVG.
- Boundary preservato:
  - nessuna modifica a fullscreen, domain Firestore, route, sidebar, rules o file madre;
  - nessuna modifica a `src/App.tsx`, `src/next/nextData.ts`, `src/firebase.ts`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/euromecc`:
    - i gruppi doppi `Silo 2` e `Silo 6` sono visibili correttamente;
    - le etichette strutturali principali della reference sono presenti;
    - il pannello `Focus area` resta usabile;
    - il fullscreen dettaglio area non peggiora.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il change riallinea la composizione Home alla reference ma non estende il perimetro del modulo oltre il solo SVG Home.

## 0. Aggiornamento operativo 2026-04-04 - Fix geometria SVG `Mappa impianto` Home del modulo `Euromecc`
- Sul runtime ufficiale `/next/euromecc` la `Mappa impianto` della tab `Home` non usa piu la geometria compressa della prima V1.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextEuromeccPage.tsx` ridisegna la geometria interna della mappa Home con viewBox piu alto, sili piu larghi, maggiore distanza verticale tra fascia alta, linea centrale e componenti bassi, e box generici redistribuiti;
  - `src/next/NextEuromeccPage.tsx` riallinea anche le connessioni verticali dei sili alle nuove quote del disegno;
  - `src/next/next-euromecc.css` aggiorna solo il supporto minimo di `min-width` della mappa Home per far respirare la nuova geometria.
- Boundary preservato:
  - nessuna modifica a fullscreen, domain Firestore, route, sidebar, writer, rules o file madre;
  - nessuna modifica a `src/App.tsx`, `src/next/nextData.ts`, `src/firebase.ts`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/euromecc`:
    - la mappa Home risulta meno schiacciata nel disegno interno;
    - il pannello `Focus area` resta usabile;
    - il fullscreen dettaglio area non peggiora.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il change e focalizzato solo sulla geometria SVG della mappa Home e non estende il perimetro del modulo.

## 0. Aggiornamento operativo 2026-04-04 - Fix UI modulo `Euromecc` su mappa Home, fullscreen e blocco problemi
- Sul runtime ufficiale `/next/euromecc` la V1 del modulo nativo `Euromecc` non mostra piu la `Mappa impianto` compressa e non tratta piu tutte le issue del fullscreen come chiuse.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextEuromeccPage.tsx` rende coerente il blocco `Problemi riscontrati` del fullscreen separando correttamente issue aperte e chiuse;
  - `src/next/NextEuromeccPage.tsx` riduce l'affollamento dello `Schema tecnico` spezzando le label hotspot su due righe solo quando serve;
  - `src/next/next-euromecc.css` amplia la resa della `Mappa impianto` nella tab `Home`, riequilibra il layout del fullscreen sui sili e riduce la dimensione visiva delle etichette nello schema tecnico.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/nextEuromeccDomain.ts`, route, sidebar, Firestore, rules o architettura;
  - nessuna modifica a `src/App.tsx`, `src/next/nextData.ts`, `src/firebase.ts` o file madre.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/euromecc`:
    - tab `Home` con mappa piu grande e meno schiacciata;
    - fullscreen dettaglio area con schema tecnico piu leggibile e testi non piu sovrapposti in modo evidente;
    - blocco `Problemi riscontrati` coerente con issue aperte/chiuse reali.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il change e solo visuale/UI e non modifica la persistenza, i writer o le regole Firestore del modulo.

## 0. Aggiornamento operativo 2026-04-03 - Modulo nativo NEXT `Euromecc` V1 attivo sotto `MAGAZZINO`
- Nel subtree ufficiale `/next` esiste ora la nuova route reale `/next/euromecc`, montata dentro la shell globale e protetta con `areaId="operativita-globale"`.
- Il modulo `Euromecc` non e un clone della madre:
  - e un modulo nativo NEXT;
  - non importa nulla da `src/pages/**`;
  - non usa `storage/@...`, `storageSync` o writer legacy.
- Wiring strutturale applicato:
  - `src/next/nextStructuralPaths.ts` espone `NEXT_EUROMECC_PATH`;
  - `src/next/nextData.ts` aggiunge `Euromecc` come item flat dentro la sezione sidebar `MAGAZZINO` e lo registra in `NEXT_ROUTE_MODULES`;
  - `src/App.tsx` monta la route `/next/euromecc` sotto `NextShell`.
- Persistenza reale autorizzata solo per questo modulo sulle collection Firestore dedicate:
  - `euromecc_pending`
  - `euromecc_done`
  - `euromecc_issues`
- Struttura runtime V1 realizzata:
  - `src/next/euromeccAreas.ts` contiene solo topologia e metadati statici impianto;
  - `src/next/domain/nextEuromeccDomain.ts` espone reader/writer, tipi separati Firestore/UI e helper stato/date;
  - `src/next/NextEuromeccPage.tsx` implementa le 4 tab `Home`, `Manutenzione`, `Problemi`, `Riepilogo`, con mappa SVG, modale fullscreen area, schema tecnico silo, form manutenzioni/segnalazioni e riepilogo copiabile/stampabile;
  - `src/next/next-euromecc.css` contiene solo stile scoped `eur-*`.
- Verifica finale eseguita:
  - `npx eslint src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts src/next/euromeccAreas.ts` -> `OK`
  - `npm run build` -> `OK`
  - runtime locale verificato su `/next/euromecc`:
    - la voce sidebar apre il modulo;
    - click su un nodo mappa apre il modale fullscreen;
    - aggiunta manutenzione da fare aggiorna lo snapshot;
    - registrazione manutenzione fatta aggiorna lo snapshot;
    - nuova segnalazione aggiorna lo snapshot;
    - chiusura problema aggiorna lo snapshot;
    - riepilogo genera testo e `Copia testo` aggiorna gli appunti.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - la V1 e funzionante ma non e dichiarabile `CHIUSO`;
  - le policy Firestore effettive non sono versionate nel repo, quindi la messa in sicurezza definitiva del modulo resta `DA VERIFICARE`.

## 0. Aggiornamento operativo 2026-04-05 - `Euromecc` aggiunge un pannello nascosto di gestione dati
- Nel modulo nativo NEXT `Euromecc` esiste ora un accesso discreto `Impostazioni` nell'header, senza nuova tab pubblica e senza nuova voce sidebar.
- Il pulsante apre un solo pannello/modale `Gestione dati Euromecc` interno al modulo con tre sezioni:
  - `Segnalazioni`
  - `Da fare`
  - `Fatte`
- Il pannello legge e scrive sui dati reali delle collection dedicate gia esistenti:
  - `euromecc_issues`
  - `euromecc_pending`
  - `euromecc_done`
- Per ogni record il pannello consente:
  - visualizzazione sintetica;
  - modifica reale del documento esistente;
  - eliminazione reale con conferma esplicita.
- Boundary preservato:
  - nessuna nuova route;
  - nessuna nuova voce sidebar;
  - nessuna modifica a Firebase config o rules;
  - nessuna promessa falsa di sicurezza per ruolo: il pannello e solo discreto/nascosto a livello UI.
- Verifiche eseguite:
  - `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts` -> `OK`
  - `npm run build` -> `OK`
  - runtime locale su `/next/euromecc` con creazione temporanea record, modifica ed eliminazione reale in tutte e tre le sezioni del manager, poi cleanup finale dei dati di prova.
- Stato aggiornato del modulo:
  - `Euromecc` -> `PARZIALE`
- Limite esplicito:
  - il pannello resta un accesso UI discreto e non sostituisce un modello ACL per-ruolo verificato nel repo.

## 0. Aggiornamento operativo 2026-04-03 - Widget `Magazzino` Home NEXT riallineato a `Inventario`
- Sulla route ufficiale `/next` il widget `Magazzino` non usa piu placeholder misti con semantica procurement.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextHomePage.tsx` legge `readNextInventarioSnapshot({ includeCloneOverlays: false })`;
  - il widget mostra fino a 4 righe reali inventario usando solo campi gia esposti dal layer `D05`:
    - `descrizione`
    - `quantita`
    - `unita`
    - `fornitore`
    - `stockStatus`
  - la CTA del widget punta ora a `Vai -> /next/inventario`;
  - nessun dato procurement resta nel widget.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, file madre, writer o storage;
  - nessuna modifica a stat card, banner alert, pannello IA o agli altri widget della Home.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next`, `/next/inventario`, `/next/materiali-da-ordinare`;
  - in `/next` il widget `Magazzino` mostra righe reali inventario e non espone piu i placeholder `Ordine #204`, `consegna prevista`, `riordino consigliato`;
  - la CTA del widget punta a `/next/inventario`.
- Stato aggiornato del modulo:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - il widget mostra una sintesi read-only inventario e non introduce nuove semantiche su scorte minime oltre `stockStatus` gia esposto dal domain.

## 0. Aggiornamento operativo 2026-04-03 - Widget flotta Home NEXT espandibili con categoria visibile
- Sulla route ufficiale `/next` i widget `Motrici e trattori` e `Rimorchi` non restano piu limitati a una preview rigida senza contesto categoria.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextHomePage.tsx` mantiene i dati reali gia letti da `readNextCentroControlloSnapshot()`;
  - i due widget hanno ora un toggle separato `Mostra tutti` / `Mostra meno`;
  - da chiusi mostrano la preview compatta, da aperti espongono tutti gli elementi reali del widget;
  - ogni riga mostra anche la categoria reale del mezzo/rimorchio usando il campo `categoria` gia esposto dal read model, con fallback sobrio `Categoria non indicata` se assente;
  - il rebucket prodotto `pianale -> Rimorchi` resta invariato.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, file madre, writer o storage;
  - nessuna modifica a stat card, banner alert, pannello IA o widget `Magazzino`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next`, `/next/autisti-admin`, `/next/materiali-da-ordinare`;
  - in `/next`:
    - `Mostra tutti` espande correttamente entrambi i widget;
    - `Mostra meno` richiude correttamente entrambi i widget;
    - la categoria e visibile in ogni riga;
    - `pianale` resta fuori da `Motrici e trattori` e visibile in `Rimorchi`.
- Stato aggiornato del modulo:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - il change riguarda solo i due widget flotta della Home e non modifica i dataset o la classificazione generale del domain `D10`.

## 0. Aggiornamento operativo 2026-04-03 - Widget Home NEXT `Motrici e trattori` e `Rimorchi` riallineati al flusso madre
- Sulla route ufficiale `/next` i due widget flotta della nuova Home NEXT non usano piu CTA header incoerenti e non restano semplici liste read-only.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/NextHomePage.tsx` mantiene i dati reali da `readNextCentroControlloSnapshot()` e il rebucket prodotto `pianale -> Rimorchi`;
  - le righe di `Motrici e trattori` e `Rimorchi` sono ora cliccabili verso `/next/autisti-admin`;
  - ogni riga espone `Modifica` e apre un editor luogo inline locale con `Annulla` / `Salva`;
  - `Salva` aggiorna solo stato locale clone-safe della Home, senza scritture business o domain write;
  - rimosso il link header `Vai -> /next/mezzi` da `Motrici e trattori`;
  - rimossa la CTA disabled generica dal widget `Rimorchi`.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, file madre, writer o storage;
  - nessun modale introdotto;
  - nessuna modifica a stat card, banner alert, pannello IA o widget `Magazzino`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next`, `/next/autisti-admin`, `/next/materiali-da-ordinare`;
  - in `/next`:
    - `pianale` resta fuori da `Motrici e trattori` e visibile in `Rimorchi`;
    - le righe dei due widget navigano a `/next/autisti-admin`;
    - `Modifica` apre editor inline con `Annulla` / `Salva` funzionanti in locale;
    - `Magazzino`, stat card, banner alert e pannello IA restano attivi senza regressioni.
- Stato aggiornato del modulo:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - il luogo modificato nella Home resta solo clone-safe locale e non viene scritto nel dataset business.

## 0. Aggiornamento operativo 2026-04-03 - Home NEXT riclassifica `pianale` nel widget `Rimorchi`
- Sulla route ufficiale `/next` la Home NEXT non lascia piu la categoria `pianale` nel bucket visivo `Motrici e trattori`.
- Correzione applicata solo in `src/next/NextHomePage.tsx`:
  - il read model `D10` resta invariato;
  - la Home esegue un rebucket locale dei dati widget e sposta gli item con `categoria = pianale` dal gruppo `motriciTrattoriDaMostrare` al gruppo visivo `Rimorchi`;
  - gli item `pianale` vengono anche prioritizzati nelle prime righe visibili del widget `Rimorchi`, cosi il cambio resta effettivamente percepibile nella dashboard.
- Boundary preservato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, file madre, writer o storage;
  - nessuna modifica a stat card, banner alert, pannello IA o widget `Magazzino`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next` e `/next/autisti-admin`;
  - nel browser, con read model reale, la targa `TI285997` di categoria `pianale` non compare piu in `Motrici e trattori` e compare nel widget `Rimorchi`.
- Stato aggiornato del modulo:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - il change riguarda solo `pianale` nella Home NEXT e non modifica la classificazione generale del domain `D10`.

## 0. Aggiornamento operativo 2026-04-03 - Home NEXT collega tre widget reali
- Sul runtime ufficiale `/next` la nuova Home NEXT non usa piu placeholder statici per tre widget dashboard:
  - `Motrici e trattori` legge `readNextCentroControlloSnapshot()` e mostra fino a 3 righe reali da `motriciTrattoriDaMostrare` con `targa`, `luogo`, `statusLabel`, mantenendo CTA `Vai -> /next/mezzi`;
  - `Rimorchi` legge `readNextCentroControlloSnapshot()` e mostra fino a 3 righe reali da `rimorchiDaMostrare` con `targa`, `luogo`, `statusLabel`, lasciando la CTA disabilitata per assenza di route dedicata;
  - `Lavori aperti` legge `readNextLavoriInAttesaSnapshot()` e mostra fino a 3 righe reali ricavate dai gruppi aperti con `descrizione`, `targa` e `urgenza`, riallineando la CTA a `Tutti -> /next/lavori-in-attesa`.
- Boundary invariato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, mother o writer;
  - `Magazzino` resta volontariamente placeholder per semantica mista inventario/procurement;
  - stat card, banner alert e pannello IA interna restano attivi senza regressioni.
- Stato aggiornato della Home NEXT:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - `Magazzino` resta fuori perimetro e non viene reinterpretato;
  - la Home resta read-only e non reintroduce `storageSync` o scritture business.

## 0. Aggiornamento operativo 2026-04-03 - Home NEXT collega tre stat card reali
- Sul runtime ufficiale `/next` la nuova Home NEXT non usa piu placeholder statici per tre card dashboard:
  - `Lavori aperti` legge `readNextLavoriInAttesaSnapshot()` e mostra `counts.totalLavori`, con sottotitolo ricavato dal dato gia esposto `groups[].counts.alta`;
  - `Ordini in attesa` legge `readNextProcurementSnapshot()` e mostra `counts.pendingOrders`, con sottotitolo coerente su `counts.partialOrders`;
  - `Segnalazioni` legge `readNextCentroControlloSnapshot()` e mostra `counters.segnalazioniNuove`, con sottotitolo `da gestire` o `nessuna`.
- Boundary invariato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, mother o writer;
  - `Mezzi attivi` resta volontariamente placeholder per assenza di una metrica canonica verificata;
  - banner alert e pannello IA interna restano quelli collegati nel prompt precedente, senza regressioni.
- Stato aggiornato della Home NEXT:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - widget e card `Mezzi attivi` restano fuori perimetro e non vengono reinterpretati;
  - la Home resta read-only e non reintroduce `storageSync` o scritture business.

## 0. Aggiornamento operativo 2026-04-03 - Fix CSS scoped shell NEXT su `autisti-inbox` e conferma `autisti-admin`
- Corretto il problema residuo di layout dentro la shell globale NEXT, senza toccare madre, route, `NextShell.tsx`, domain o dati:
  - `/next/autisti-inbox` non usa piu il breakout desktop legacy che invadeva la colonna sinistra della shell;
  - `/next/autisti-admin` resta corretta con il precedente override scoped e non presenta overlap con la sidebar.
- Causa reale verificata nel runtime:
  - il wrapper legacy `.autisti-inbox-wrap` applicava ancora nel contesto shell la gabbia desktop `width: min(1500px, calc(100vw - 48px))` con margini negativi derivati da `calc(50% - 50vw + 24px)`, finendo sotto la sidebar;
  - nel browser, prima del fix, `/next/autisti-inbox` mostrava `.autisti-inbox-wrap` a `1392px` con `left = 184` mentre la colonna contenuto della shell iniziava a `328px`.
- Correzione applicata solo in `src/next/next-shell.css`:
  - override scoped su `.next-shell .autisti-home`;
  - override scoped su `.next-shell .autisti-inbox-wrap`;
  - override scoped su `.next-shell .autisti-layout`.
- Verifica finale eseguita:
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/autisti-inbox`, `/next/autisti-admin`, `/next/materiali-da-ordinare`;
  - dopo il fix `/next/autisti-inbox` mostra `.autisti-inbox-wrap` a `1068px`, `left = 346`, `max-width = 100%`, `margin-left = 0`, nessun overlap con la sidebar;
  - `/next/autisti-admin` resta con `.autisti-admin-page` allineata alla colonna contenuto (`left = 328`, nessun overlap);
  - nessuna regressione rilevata su `/next/materiali-da-ordinare`.
- Stato aggiornato del modulo:
  - `Home NEXT` -> `PARZIALE`
- Limite esplicito:
  - fix stretto e solo CSS scoped della shell; nessuna modifica a file legacy o runtime page component.

## 0. Aggiornamento operativo 2026-04-03 - Shell globale NEXT corretta su toggle visibile e push layout reale
- Corretti due bug residui della shell globale senza toccare madre, route, Home, domain o dati:
  - il toggle sidebar ora rispetta la UX richiesta dal runtime: da aperta resta visibile dentro l'header della sidebar; da chiusa resta visibile un bottone flottante esterno per riaprire la nav;
  - il layout shell continua a comportarsi come colonne reali anche su superfici sensibili come `/next/autisti-admin` e `/next/autisti-inbox`, con contenuto spinto a destra e nessun overlap della colonna sinistra.
- Correzione applicata solo in:
  - `src/next/NextShell.tsx`
  - `src/next/next-shell.css`
- Boundary preservato:
  - nessuna modifica a `src/App.tsx`, route, file madre, `src/next/NextHomePage.tsx`, domain/read model, Firebase, storage o writer;
  - nessuna modifica a `src/autistiInbox/AutistiAdmin.css` o `src/pages/CentroControllo.css`.
- Verifica finale eseguita:
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/autisti-admin`, `/next/autisti-inbox`, `/next/materiali-da-ordinare`;
  - da aperta: toggle visibile dentro l'header sidebar, `contentLeft = 328`, `sidebarRight = 328`, nessun contenuto coperto;
  - da chiusa: `frameWidth = 0`, contenuto a tutta larghezza e bottone flottante visibile per riaprire la sidebar.
- Stato aggiornato del modulo:
  - `Home NEXT` -> `PARZIALE`
- Limite esplicito:
  - patch stretta di shell UI; nessuna estensione a dati reali, Home o routing.

## 0. Aggiornamento operativo 2026-04-03 - Fix CSS shell globale su `autisti-admin` e `centro-controllo`
- Corretti due bug visivi reali introdotti dalla shell globale, senza toccare madre, route, runtime page component o CSS legacy esterni alla whitelist.
- Correzione applicata solo in `src/next/next-shell.css`:
  - aggiunto `z-index` esplicito a `.next-shell__sidebar` per evitare che la card principale di `/next/centro-controllo` venga dipinta sopra il bordo/sidebar;
  - aggiunto override scoped `.next-shell .autisti-admin-page` con precedenza sul legacy per neutralizzare il pattern full-bleed di `AutistiAdmin.css` (`width: 100vw`, `left: 50%`, `transform: translateX(-50%)`) solo dentro la shell NEXT.
- Boundary preservato:
  - nessuna modifica a `src/autistiInbox/AutistiAdmin.css`;
  - nessuna modifica a `src/pages/CentroControllo.css`;
  - nessuna modifica a `src/App.tsx`, route, madre, dati, domain o writer.
- Verifica finale eseguita:
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next/autisti-admin` con sidebar visibile e non piu invasa dal contenitore admin full-bleed;
  - runtime locale verificato su `/next/centro-controllo` con sidebar sopra il bordo card e senza overlap visivo della `.cc-shell`.
- Stato aggiornato del modulo:
  - `Home NEXT` -> `PARZIALE`
- Limite esplicito:
  - fix circoscritto ai soli due bug visivi della shell globale richiesti dal prompt.

## 0. Aggiornamento operativo 2026-04-03 - Sidebar NEXT portata nella shell globale
- La sidebar della nuova Home non resta piu confinata a `/next`: il layout globale delle route figlie di `NextShell` mostra ora una shell stabile a due colonne con nav sinistra persistente e `Outlet` a destra.
- Implementazione applicata solo nel perimetro consentito:
  - `src/next/nextData.ts` espone ora il catalogo sidebar globale `NEXT_SHELL_NAV_SECTIONS`, con sezioni centralizzate, voci attive e disabled, `IA interna` e sezione `AUTISTI`;
  - `src/next/NextShell.tsx` importa `next-shell.css`, renderizza header/sidebar/footer globali, gestisce sezioni collassabili, stato attivo per route, toggle globale della sidebar e contenuto shell con `Outlet`;
  - `src/next/NextHomePage.tsx` mantiene solo la dashboard destra placeholder, senza piu markup sidebar locale;
  - `src/next/next-shell.css` ospita ora gli stili della shell globale e conserva i blocchi legacy gia usati dalle altre pagine NEXT;
  - `src/next/next-home.css` mantiene solo gli stili della dashboard Home.
- Boundary preservato:
  - nessuna modifica a `src/App.tsx`, route, madre, subtree `/next/autisti/*`, writer, storage, Firebase o domain/read model;
  - nessuna reintroduzione di `storageSync` o letture raw legacy.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextShell.tsx src/next/NextHomePage.tsx src/next/nextData.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - runtime locale verificato su `/next`, `/next/mezzi`, `/next/manutenzioni`, `/next/materiali-da-ordinare`, `/next/ia/interna`, `/next/autisti-inbox`, `/next/autisti-admin` con sidebar visibile e attiva;
  - toggle shell verificato nel browser con stato `next-shell--sidebar-open` -> `next-shell--sidebar-closed`, colonna sidebar `320px` -> `0px` -> `320px`;
  - `/next/autisti` continua a non montare la shell e usa ancora il layout separato `NextAutistiCloneLayout`.
- Stato aggiornato del modulo:
  - `Home NEXT` -> `PARZIALE`
- Limite esplicito:
  - la dashboard Home resta placeholder statica e non legge ancora dati reali;
  - la nav globale copre il catalogo richiesto dal prompt ma non pretende di rappresentare tutte le route tecniche/dinamiche della NEXT.

## 0. Aggiornamento operativo 2026-04-03 - Nuova Home NEXT UI placeholder implementata
- Sulla route ufficiale `/next` la Home NEXT non monta piu la parity runtime del vecchio centro controllo, ma una dashboard placeholder autonoma costruita solo nel perimetro `src/next/*`.
- Implementazione applicata solo nel perimetro consentito:
  - `src/next/NextHomePage.tsx` renderizza ora la nuova Home con sidebar a categorie collassabili, topbar, banner alert, pannello `IA interna`, stat card e widget placeholder;
  - `src/next/next-home.css` definisce il layout desktop-first approvato, con sidebar scura, area contenuto chiara, card morbide e comportamento responsive minimo;
  - le voci sidebar usano solo route NEXT gia esistenti quando coerenti; le voci non pronte restano visibili ma disabled.
- Boundary dati preservato:
  - nessun collegamento a Firebase, Firestore, snapshot NEXT, domain o dati reali;
  - nessuna modifica a `src/App.tsx`, writer, route, storage, PDF engine o file madre;
  - nessuna reintroduzione di `storageSync` o letture raw legacy.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> `OK`;
  - `npm run build` -> `OK`;
  - verifica runtime visiva locale su `http://127.0.0.1:4173/next` con screenshot finale della nuova Home -> `OK`.
- Stato aggiornato del modulo:
  - `Home NEXT` -> `PARZIALE`
- Limite esplicito:
  - la Home usa solo placeholder statici e non collega ancora dati reali, logiche business o navigazione avanzata fuori dalle route NEXT gia presenti.

## 0. Aggiornamento operativo 2026-04-03 - Stato import preventivi NEXT riallineato alla logica madre
- Sul runtime ufficiale `/next/materiali-da-ordinare?tab=preventivi` il calcolo dello stato import dei preventivi non usa piu il conteggio povero basato su `sourceMatches`, `previewMatches` e `materialsPreview` parziale.
- Correzione applicata solo nel perimetro consentito:
  - `src/next/domain/nextProcurementDomain.ts` espone ora nel read model procurement le righe complete del preventivo (`descrizione`, `unita`, `note`, `prezzoUnitario`) e il `fontePreventivoId` della voce listino;
  - `src/next/NextProcurementConvergedSection.tsx` replica il criterio reale della madre `Acquisti` con analisi riga-per-riga, match per codice articolo o descrizione normalizzata, score su UDM/valuta/preventivo sorgente e conteggio valido anche quando una riga riusa un match compatibile gia consumato;
  - la UI del tab `Prezzi & Preventivi` resta invariata fuori dallo stretto necessario: cambia solo il calcolo di `NON IMPORTATO` / `IMPORTATO PARZIALE` / `IMPORTATO COMPLETO`.
- Boundary dati preservato:
  - nessuna modifica a `src/next/NextMaterialiDaOrdinarePage.tsx`;
  - nessuna modifica a `src/next/NextProcurementReadOnlyPanel.tsx`;
  - nessuna modifica a writer business, route, PDF engine o file madre;
  - nessuna reintroduzione di `storageSync`, letture raw legacy o mount runtime di `src/pages/*`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextProcurementConvergedSection.tsx src/next/domain/nextProcurementDomain.ts` -> `OK`;
  - `npm run build` -> `OK`;
  - confronto browser headless locale su `/acquisti?tab=preventivi` vs `/next/materiali-da-ordinare?tab=preventivi`:
    - `MARIBA / XC/STD/2600119` -> madre `IMPORTATO COMPLETO 5/5`, NEXT `IMPORTATO COMPLETO 5/5`;
    - `MARIBA / 534909` -> madre `IMPORTATO COMPLETO 7/7`, NEXT `IMPORTATO COMPLETO 7/7`.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - il prompt chiude il delta logico sullo stato import dei preventivi nel tab `Prezzi & Preventivi`, ma non promuove a `CHIUSO` l'intero procurement top-level.

## 0. Aggiornamento operativo 2026-04-03 - Tab `Ordine materiali` riallineata al runtime reale della madre
- Sul runtime ufficiale `/next/materiali-da-ordinare` la sola tab `Ordine materiali` e stata riallineata prendendo come master esterno la resa browser reale di `src/pages/Acquisti.tsx`.
- Correzioni visive applicate solo nel perimetro consentito:
  - rimossa dal footer della tab la navigazione extra verso `Ordini`, `Arrivi`, `Prezzi & Preventivi` e `Listino Prezzi`;
  - riportata la gabbia `Ordine materiali` al wrapper madre `om-wrap` / `om-content`, chiudendo il delta di composizione compatta visto nel browser;
  - riallineati microcopy e controlli visibili della riga di inserimento a `AGGIUNGI` e `Mostra dettagli`;
  - sostituiti i pulsanti riga sempre visibili con il menu `kebab` madre-like sulla colonna `Azioni`;
  - riportata la palette pulsanti del ramo al tema embedded della madre e riallineata l'etichetta KPI `Totale parziale` quando ci sono prezzi mancanti o UDM da verificare.
- Boundary dati preservato:
  - nessuna modifica a `src/next/NextProcurementReadOnlyPanel.tsx`;
  - nessuna modifica a `src/next/NextProcurementConvergedSection.tsx`;
  - nessuna modifica a `src/next/domain/nextProcurementDomain.ts`;
  - nessuna reintroduzione di `storageSync`, letture raw legacy o mount runtime di `src/pages/*`.
- Verifica finale eseguita:
  - `node_modules\\.bin\\eslint.cmd src/next/NextMaterialiDaOrdinarePage.tsx` -> `OK`;
  - `node_modules\\.bin\\eslint.cmd src/next/next-procurement-route.css` -> file ignorato da ESLint per assenza config CSS;
  - `npm run build` -> `OK`;
  - confronto browser headless locale su `/acquisti` vs `/next/materiali-da-ordinare` con screenshot runtime della sola tab `Ordine materiali` -> `UGUALE` lato shell UI visibile.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - il prompt chiude il delta visivo reale di `Ordine materiali`, non promuove a `CHIUSO` l'intero procurement top-level e non cambia i limiti read-only dei writer business.

## 0. Aggiornamento operativo 2026-04-02 - Procurement top-level riallineato su tab, sottoviste e riepiloghi
- Sul runtime ufficiale `/next/materiali-da-ordinare` la superficie principale del modulo unico converge di piu verso la madre `Acquisti` senza riaprire moduli procurement top-level separati:
  - tab top-level riallineati a `Ordine materiali`, `Ordini`, `Arrivi`, `Prezzi & Preventivi`, `Listino Prezzi`;
  - badge contatori reali su ordini/arrivi/preventivi/listino e chip live su `Dettaglio ordine`;
  - placeholder ricerca e CTA header coerenti con la vista corrente, evitando azioni top-level fuori contesto sui tab secondari;
  - barra riepilogo madre-like con stato `SOLA LETTURA`, contatori e descrizione pratica del flusso attivo.
- `NextProcurementConvergedSection` riduce il delta top-level sui rami documentali:
  - `Prezzi & Preventivi` usa una shell piu vicina alla madre `Registro Preventivi`;
  - `Listino Prezzi` torna vista top-level visibile, non solo toggle implicito;
  - footer azioni e riepiloghi mantengono il passaggio pratico tra `Ordine materiali`, `Ordini`, `Arrivi`, `Preventivi` e `Listino`.
- Boundary dati preservato:
  - nessuna modifica a `src/next/domain/nextProcurementDomain.ts`;
  - nessuna modifica a `src/next/NextProcurementReadOnlyPanel.tsx`;
  - nessuna lettura raw legacy di `@ordini`, `@preventivi`, `@listino_prezzi`, `storageSync` o `materialImages`.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - restano fuori il writer business 1:1 della madre, il caricamento preventivi reale e l'operativita completa di `Prezzi & Preventivi` / `Listino Prezzi`.

## 0. Aggiornamento operativo 2026-04-02 - Fix runtime reale procurement da browser e conflitto CSS globale
- Verifica eseguita con browser headless locale sulla route reale `http://localhost:5173/next/materiali-da-ordinare`, leggendo DOM e computed styles del runtime.
- Causa reale trovata nel browser:
  - `.mdo-page` e `.mdo-card` venivano sovrascritte da `src/pages/DettaglioOrdine.css`, caricato globalmente nel bundle;
  - il runtime reale mostrava:
    - `.mdo-card` larga `430px`;
    - `.mdo-workspace` con `grid-template-columns: 414px 0px`;
    - `.mdo-sticky-bar` dark sticky con `bottom: 12px`.
- La shell `/next` non era il problema:
  - `NextShell` e `App.css` non imponevano `max-width` o centrature anomale sulla route.
- Correzione applicata:
  - aggiunto wrapper locale `next-mdo-route`;
  - aggiunto file stile locale `src/next/next-procurement-route.css`;
  - riportato il ramo `Fabbisogni` al runtime madre reale visto in `/acquisti`:
    - `mdo-page mdo-page--embedded mdo-page--single`
    - `mdo-card mdo-card--embedded mdo-card--single`
    - `mdo-single-card`
    - `mdo-card-footer-bar`
  - override scoped dei selettori globali che strozzavano la pagina.
- Verifica runtime reale dopo il fix:
  - `.mdo-card` = `1400px`;
  - `.mdo-shell-header` = `1400px`;
  - `.mdo-tabs` = `1400px`;
  - nessuna `.mdo-sticky-bar` presente;
  - nessuna `.mdo-workspace` presente;
  - footer reale = `.mdo-card-footer-bar` con `position: static`.
- Convergenza procurement invariata:
  - `Materiali da ordinare` resta il solo procurement top-level;
  - `Ordini`, `Arrivi`, `Prezzi & Preventivi` restano nel modulo convergente.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-02 - Procurement desktop top-level riportato sul ramo standalone della madre
- Verificato il mount reale della route `/next/materiali-da-ordinare`:
  - `src/App.tsx` monta `NextMaterialiDaOrdinarePage` dentro `NextShell`;
  - `NextShell` e `App.css` non impongono il max-width desktop che rendeva la pagina embedded.
- Causa reale trovata:
  - `src/next/NextMaterialiDaOrdinarePage.tsx` continuava a usare sul top-level le classi madre pensate per l'embedded dentro `Acquisti`:
    - `mdo-page--embedded`
    - `mdo-card--embedded`
    - `mdo-page--single`
    - `mdo-card--single`
  - questo teneva il procurement convergente in una shell da card embedded invece che nel layout desktop standalone della madre.
- Correzione applicata:
  - il top-level della pagina torna a usare la shell standalone reale della madre:
    - `mdo-page`
    - `mdo-card`
    - `mdo-workspace`
    - `mdo-sticky-bar`
  - il ramo `Fabbisogni` e stato riallineato alla struttura desktop madre a due pannelli con sidebar, tabella larga e footer sticky della pagina;
  - le tab convergenti `Ordini`, `Arrivi`, `Prezzi & Preventivi` restano intatte.
- Nessuna modifica a:
  - `NextShell`
  - `App.css`
  - architettura procurement convergente
  - route top-level procurement
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-02 - Fix layout desktop procurement convergente madre-like
- Corretto il layout desktop di `/next/materiali-da-ordinare` riallineandolo al ramo desktop embedded/single-card della madre reale di `Materiali da ordinare`.
- File runtime toccato:
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
- Vincoli desktop errati rimossi dal clone:
  - shell standalone troppo stretta e centrata;
  - workspace a due colonne con pannello destro fuori proporzione;
  - sticky bar scura flottante in basso che copriva il contenuto desktop.
- Riallineamento applicato:
  - shell `mdo-page--embedded mdo-page--single`;
  - card `mdo-card--embedded mdo-card--single`;
  - toolbar single-card della madre;
  - tabella singola `mdo-table-wrap--single`;
  - footer azioni dentro `mdo-card-footer-bar` invece di overlay sticky.
- Nessuna modifica all'architettura procurement gia decisa:
  - `Materiali da ordinare` resta il solo procurement top-level visibile;
  - le tab convergenti `Ordini`, `Arrivi`, `Prezzi & Preventivi` restano intatte;
  - nessuna route secondaria top-level reintrodotta.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-02 - Fix loop runtime procurement convergente
- Corretto il crash di `/next/materiali-da-ordinare` introdotto dal procurement convergente:
  - `The result of getSnapshot should be cached to avoid an infinite loop`
  - `Maximum update depth exceeded`
- Causa reale trovata nel repository IA universale usato dal procurement:
  - `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
  - `readInternalAiUniversalRequestsRepositorySnapshot()` restituiva a ogni render un nuovo oggetto con nuovi array clonati;
  - il consumer `useInternalAiUniversalHandoffConsumer()` usa `useSyncExternalStore`, quindi React rilevava snapshot instabile e rilanciava render in loop.
- Fix applicato:
  - snapshot repository ora cacheato e restituito identico finche lo stato reale non cambia;
  - rimossa la funzione locale di clone ormai non piu usata.
- Nessuna modifica all'architettura procurement convergente:
  - `Materiali da ordinare` resta il modulo procurement top-level unico;
  - nessun restyling;
  - nessuna modifica alla madre.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-02 - Convergenza definitiva procurement NEXT sul modulo unico
- Eseguita convergenza runtime della famiglia procurement NEXT con madre come fonte di verita e con `Materiali da ordinare` come unico modulo top-level visibile.
- File runtime procurement NEXT toccati:
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
  - `src/next/NextProcurementConvergedSection.tsx`
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/next/NextProcurementStandalonePage.tsx`
- `NextMaterialiDaOrdinarePage.tsx` ora mantiene la shell madre-like gia convergente e assorbe nello stesso modulo:
  - vista `Ordini`;
  - vista `Arrivi`;
  - drill-down `Dettaglio ordine`;
  - preview procurement `Prezzi & Preventivi` / `Listino` usando lo snapshot NEXT read-only.
- Le CTA e i quick link del modulo non aprono piu route procurement secondarie come mondo separato:
  - passano tutte dal path canonico `/next/materiali-da-ordinare`;
  - cambiano solo tab o dettaglio via querystring canonica.
- `NextProcurementReadOnlyPanel` e stato declassato a renderer riusabile:
  - modalita full per i consumer ancora vivi;
  - modalita embedded per il procurement convergente dentro `Materiali da ordinare`.
- `NextProcurementStandalonePage` non e piu un workbench procurement separato:
  - e ora un alias di compatibilita che redirige i path storici procurement al modulo unico canonico.
- Effetto architetturale risultante:
  - `/next/materiali-da-ordinare` = solo procurement top-level reale;
  - `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId` = ingressi declassati di compatibilita verso il modulo unico;
  - nessuna rimozione cieca del renderer read-only usato ancora da altri consumer NEXT fuori perimetro prompt.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-02 - Convergenza procurement NEXT sul ramo standalone della madre
- Eseguito audit operativo madre vs NEXT sul procurement con focus su:
  - `src/pages/MaterialiDaOrdinare.tsx`
  - `src/pages/MaterialiDaOrdinare.css`
  - `src/pages/Acquisti.tsx`
  - `src/pages/OrdiniInAttesa.tsx`
  - `src/pages/OrdiniArrivati.tsx`
  - `src/pages/DettaglioOrdine.tsx`
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
  - `src/next/NextProcurementStandalonePage.tsx`
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/App.tsx`
- La pagina `/next/materiali-da-ordinare` e stata riportata sul ramo standalone reale della madre:
  - shell `mdo-page` / `mdo-card` standard;
  - header, tabs, workspace, quick link, tabella, sticky bar e modale placeholder allineati alla struttura madre;
  - rimossi gli override clone-specifici della shell embedded e gli inline style introdotti nelle patch precedenti.
- Adattamenti NEXT rimasti volutamente minimi:
  - lettura fornitori da `readNextFornitoriSnapshot`;
  - navigate verso `NEXT_HOME_PATH`, `NEXT_ORDINI_IN_ATTESA_PATH`, `NEXT_ORDINI_ARRIVATI_PATH`;
  - aggiunta materiale, eliminazione materiale, conferma ordine, PDF e upload bloccati in `read-only`;
  - foto materiale gestita solo come preview locale o automatica, senza upload business.
- Decisione procurement invariata:
  - `Materiali da ordinare` resta l'unico ingresso procurement top-level visibile;
  - `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine` restano runtime secondari vivi e non vengono rimossi dal codice.
- Nessuna modifica a `src/App.tsx` o alle route procurement secondarie, perche i consumer runtime reali restano presenti nel clone.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Modale procurement NEXT riallineato alla madre
- Audit eseguito sul modale reale della madre in:
  - `src/pages/MaterialiDaOrdinare.tsx`
  - `src/pages/MaterialiDaOrdinare.css`
- Audit eseguito sulla controparte NEXT in:
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
- Il modale auditato e il placeholder procurement aperto dalle azioni `Prezzi`, `Allegati`, `Note` del modulo `Materiali da ordinare`.
- Differenza reale trovata:
  - la madre usa il modale `mdo-modal` su variabili e palette standard del modulo standalone;
  - la NEXT, dopo il riallineamento shell della pagina, faceva ereditare al modale la variante embedded del procurement e quindi il popup risultava meno fedele su bordo, colori testo e percezione generale.
- Correzione applicata:
  - shell del modale NEXT riportata a stile madre-like esplicito su backdrop, card, titolo e testo;
  - nessuna modifica alla logica del modale o al runtime procurement secondario.
- `Materiali da ordinare` resta l'ingresso procurement top-level della NEXT.
- `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine` restano invariati dietro le quinte.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - `/next/materiali-da-ordinare` riallineato alla shell madre-like
- Verificato il modulo procurement equivalente della madre in:
  - `src/pages/MaterialiDaOrdinare.tsx`
  - `src/pages/MaterialiDaOrdinare.css`
  - `src/pages/Acquisti.tsx`
  - `src/pages/Acquisti.css`
- Verificato il runtime reale NEXT in `src/next/NextMaterialiDaOrdinarePage.tsx`.
- La pagina NEXT mantiene l'architettura procurement gia decisa:
  - ingresso top-level procurement = `/next/materiali-da-ordinare`
  - `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine` restano moduli runtime secondari e non vengono rimossi.
- Il riallineamento ha corretto solo la shell/layout della pagina:
  - sfondo e shell madre-like piu coerenti con il procurement della madre;
  - header e tabs riportati dentro una cornice procurement piu stabile;
  - workspace riequilibrato con pannello sinistro e pannello destro proporzionati;
  - pannello destro con altezza minima coerente anche quando il dataset temporaneo e vuoto;
  - barra inferiore non piu sticky/sovrapposta ai campi, quindi non copre piu il form.
- Nessuna modifica a route, writer, shape dati o logica business procurement.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - `Gestione Operativa` NEXT riallineata visivamente alla madre
- Verificato il runtime reale della madre in `src/pages/GestioneOperativa.tsx` e `src/pages/GestioneOperativa.css`.
- Verificato il runtime reale NEXT in `src/next/NextGestioneOperativaPage.tsx`.
- La pagina NEXT mantiene la nuova architettura approvata a 4 famiglie:
  - `Magazzino e materiali`
  - `Acquisti e ordini`
  - `Manutenzioni`
  - `Lavori`
- La resa visiva e stata riallineata alla madre usando la stessa grammatica di layout:
  - header compatto con badge;
  - sezione centrale tipo `AZIONI OPERATIVE`;
  - card grandi padre-sezione, senza pannelli tecnici sparsi;
  - sezione finale sintetica `Segnali rapidi`.
- Procurement resta coerente con l'audit chiuso:
  - card famiglia `Acquisti e ordini`;
  - unico ingresso top-level `Materiali da ordinare`;
  - nessun link top-level a `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine` o `/next/acquisti`.
- Nessuna modifica a route, writer, shape dati o logica business.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Famiglia procurement riallineata al punto di ingresso stabile della card
- Verificata la mappa route procurement NEXT in `src/App.tsx`:
  - `/next/acquisti`
  - `/next/acquisti/dettaglio/:ordineId`
  - `/next/materiali-da-ordinare`
  - `/next/ordini-in-attesa`
  - `/next/ordini-arrivati`
  - `/next/dettaglio-ordine/:ordineId`
- Verificato il runtime:
  - `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati` e `dettaglio ordine` montano tutti lo stesso workbench `NextProcurementStandalonePage` / `NextProcurementReadOnlyPanel`;
  - `/next/materiali-da-ordinare` monta invece la pagina dedicata `NextMaterialiDaOrdinarePage`.
- Per la card `Acquisti e ordini` di `Gestione Operativa` il punto di ingresso canonico e stato riallineato a `/next/materiali-da-ordinare`, perche e la superficie procurement NEXT dedicata e piu stabile nel runtime corrente.
- I deep link procurement secondari `Ordini in attesa` e `Ordini arrivati` non restano piu esposti nella card famiglia.
- Nessuna modifica a Home, altre famiglie, writer o route.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - CTA `Acquisti e ordini` riallineata a una route procurement funzionante
- In `src/next/NextGestioneOperativaPage.tsx` la CTA della famiglia `Acquisti e ordini` non punta piu alla route padre generica `/next/acquisti`.
- La CTA apre ora direttamente `/next/ordini-in-attesa`, gia montata e funzionante come ingresso read-only stabile della famiglia procurement nel clone.
- I link secondari della card restano invariati:
  - `Materiali da ordinare`
  - `Ordini in attesa`
  - `Ordini arrivati`
- Nessuna modifica al resto dell'architettura Home / Navigazione rapida / Gestione Operativa.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Accesso diretto a `Gestione Operativa` ripristinato in Home
- In `src/next/NextCentroControlloPage.tsx` `Gestione Operativa` e stata reintrodotta come accesso diretto visibile nei `Preferiti` di `Navigazione rapida`.
- L'accesso compare di nuovo nella card minimale della Home, senza riaprire le sezioni operative dentro l'overlay.
- La nuova architettura resta invariata:
  - riga 1 `Alert` + `Stato operativo`
  - riga 2 `Navigazione rapida`
  - riga 3 `IA interna`
- Nessuna route nuova, nessun cambio a logiche, dati o writer.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Home leggera e `Gestione Operativa` come hub delle 4 famiglie
- La Home NEXT ufficiale resta montata su `src/next/NextCentroControlloPage.tsx`.
- La gerarchia Home non cambia rispetto alle patch gia validate:
  - riga 1: `Alert` + `Stato operativo`;
  - riga 2: `Navigazione rapida`;
  - riga 3: `IA interna`.
- `Navigazione rapida` resta minimale in Home e il suo overlay mostra ora solo le famiglie fuori dal perimetro operativo stretto:
  - `Autisti`
  - `Dossier / Mezzi`
  - `IA`
  - `Anagrafiche`
  - `Cisterna`
  - `Area capo / Costi / Analisi`
- I link delle 4 famiglie operative non vengono piu duplicati nel menu completo della Home.
- `Gestione Operativa` usa ora `src/next/NextGestioneOperativaPage.tsx` come hub stretto delle sole 4 famiglie approvate:
  - `Magazzino e materiali`
  - `Acquisti e ordini`
  - `Manutenzioni`
  - `Lavori`
- Restano fuori da `Gestione Operativa`:
  - `Cisterna`
  - `Dossier / Mezzi`
  - `Autisti / Autisti Inbox / Admin`
  - `IA / IA interna / IA Libretto / IA Documenti`
  - `Anagrafiche`
  - `Area capo / costi / analisi`
- Nessuna route nuova, nessun cambio a writer o shape dati, madre intoccata.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Coppia alta Home con layout desktop deterministico
- `Alert` e `Stato operativo` usano ora una coppia desktop esplicita e progettata insieme.
- Su desktop la riga alta adotta:
  - griglia a due colonne;
  - rapporto `1.15fr / 1fr`;
  - altezza esterna uniforme di `620px`.
- Dentro entrambe le card:
  - header fisso;
  - controlli/filtro/tab fissi;
  - solo la lista interna e scrollabile.
- `Stato operativo` mostra 5 righe nel riepilogo Home e mantiene il footer `Vedi tutto` coerente in basso.
- Su mobile le card tornano in colonna.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Riga alta Home NEXT con altezza coerente e liste scrollabili
- `Alert` e `Stato operativo` usano ora una shell comune per la riga alta della Home.
- Su desktop le due card hanno la stessa altezza esterna controllata.
- Header e controlli restano visibili; scorre solo la parte elenco interna.
- In `Stato operativo` il numero righe visibili nel riepilogo Home e stato alzato da 5 a 6 per riempire meglio la card senza cambiare logica o dati.
- Su mobile le card tornano in colonna.
- Nessuna modifica a modali, click, writer o logica business.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Rifinitura visiva riga alta Home NEXT
- La riga alta della Home NEXT usa ora wrapper locali dedicati in `NextCentroControlloPage.tsx` e `next-shell.css`.
- `Alert` e `Stato operativo` restano affiancate su desktop e in colonna su mobile.
- I due slot della riga alta sono ora allineati con:
  - griglia locale in stretch;
  - wrapper a tutta altezza;
  - card interne estese alla stessa altezza disponibile;
  - body interno scrollabile senza introdurre altezze fisse aggressive.
- Nessuna modifica a contenuti, logiche o comportamenti interni delle due card.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Correzione mount Home `Alert` / `Stato operativo`
- Verificato e corretto il mount reale della Home in `src/next/NextCentroControlloPage.tsx`.
- Il blocco alto monta ora esplicitamente:
  - `Alert`
  - `Stato operativo`
  in due colonne locali affiancate su desktop e in colonna su mobile.
- Subito sotto restano nell'ordine:
  - `Navigazione rapida`
  - `IA interna`.
- Nessuna modifica ai contenuti o alle logiche interne delle card.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Home NEXT riordinata con `Navigazione rapida` minimale
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- La gerarchia della Home e stata riordinata cosi:
  - riga 1: `Alert` e `Stato operativo`;
  - riga 2: `Navigazione rapida`;
  - riga 3: `IA interna`.
- `Alert` e `Stato operativo` stanno nello stesso blocco alto tramite griglia locale responsive, affiancati su desktop e in colonna su viewport piu piccole.
- `Navigazione rapida` in Home mostra ora solo:
  - barra cerca;
  - `Preferiti` compatti;
  - CTA `Tutte le sezioni`.
- Le sezioni complete di navigazione sono state spostate in un overlay full-screen con:
  - pagina sotto bloccata;
  - chiusura sempre visibile;
  - una sola sezione aperta per volta;
  - moduli reali del runtime NEXT corrente.
- Nessuna modifica alla madre, nessuna route nuova, nessun cambio di logica business.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Verifica export unico `QuickNavigationCard`
- Verificato il file `src/next/components/QuickNavigationCard.tsx`.
- Nel file e presente un solo `export default QuickNavigationCard;`.
- La build runtime conferma che l'errore Vite `Multiple exports with the same name "default"` non e presente nello stato attuale del repo.

## 0. Aggiornamento operativo 2026-04-01 - Home NEXT con `Navigazione rapida` come hub unico
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- Le hero-card piccole vicino a `Dashboard` non sono piu montate nel layout principale della Home.
- La card finale `Collegamenti rapidi` e stata sostituita con `Navigazione rapida`, che resta l'unico hub di navigazione rapido della Home.
- La nuova card mantiene:
  - una barra cerca unica;
  - la sezione `Preferiti` con massimo 6 elementi visibili;
  - il concetto di `PIN` solo dentro i preferiti;
  - macro-sezioni compatte richiudibili con una sola sezione aperta per volta.
- Le sezioni mostrate (`Operativita`, `Autisti`, `IA`, `Anagrafiche`, `Acquisti e Magazzino`, `Cisterna`) usano solo moduli e route gia presenti nel runtime NEXT corrente.
- Nessuna modifica alla madre, nessun cambio di route business, nessun writer nuovo.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - `Stato operativo` con modale contestuale e layout affiancato
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- La card `Stato operativo` non usa piu `Vedi tutto` come link verso superfici fuori contesto, ma apre un modale full-overlay coerente con la tab attiva.
- Il modale mostra:
  - tutte le `Sessioni` con filtro per `targa` e `autista`;
  - tutti i `Rimorchi` con filtro per `targa`;
  - tutte le `Motrici` con filtro per `targa`.
- La card `Stato operativo` e ora affiancata alla card `Alert` nella parte alta della Home su desktop, mentre torna in colonna su viewport piu piccole tramite griglia responsive locale.
- Nessuna modifica alla madre, nessuna modifica ai writer o ai dati di dominio.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Home NEXT con card unica `Stato operativo`
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- Le tre card separate `Sessioni attive`, `Rimorchi: dove sono` e `Motrici e trattori: dove sono` sono state ricomposte in una sola card `Stato operativo`.
- La card espone tre tab compatte con conteggi reali gia disponibili: `Sessioni`, `Rimorchi`, `Motrici`.
- `Sessioni` non apre modali duplicati e rimanda alla superficie NEXT gia esistente `Autisti Inbox (admin)`, senza dipendenze da `360`.
- `Rimorchi` e `Motrici` restano leggibili in Home in forma compatta e mantengono il collegamento alla superficie NEXT `Autisti/Admin` gia usata dal runtime corrente.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Alert Home NEXT `Segnalazioni` con record reale
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- La categoria `Segnalazioni` della card `Alert` non costruisce piu un payload sintetico derivato dal solo alert.
- Il click sulla singola segnalazione recupera ora il record reale da `@segnalazioni_autisti_tmp` e apre `NextHomeAutistiEventoModal` con payload completo madre-like.
- Il dettaglio mostra quindi i campi, gli allegati foto e le azioni PDF gia supportate dal modale eventi autisti sul record vero.
- Le altre categorie della card `Alert` restano invariate.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - IA Home con launcher minimale e modale dedicato
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- Il blocco IA in Home resta minimale con campo richiesta, menu `+`, allegati e submit.
- Il submit apre ora un vero modale full-overlay renderizzato fuori dalla card Home.
- Il modale Home non monta piu la pagina IA completa come schermata ristretta, ma una superficie dedicata `home-modal` sopra la stessa logica reale di chat, allegati e orchestrazione.
- La richiesta iniziale puo partire automaticamente nel modale e la conversazione continua nello stesso thread semplificato.
- La route `/next/ia/interna` continua a funzionare come pagina completa separata.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - modale IA interna viewport-safe
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- Il launcher della chat IA interna apre ora la vera esperienza IA in un modale con shell viewport-safe.
- Il modale resta entro la viewport, blocca lo scroll della pagina sotto e tiene sempre visibile l'header con `Chiudi`.
- L'area contenuti del modale scorre in modo interno e la chat resta usabile fino al composer.
- La logica IA, gli alert e le revisioni restano invariati.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - IA interna ridotta a launcher compatto e modale operativo
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- Il blocco IA interna in Home e stato ridotto a launcher compatto con solo richiesta testuale e menu `+`.
- Dal launcher si apre la vera esperienza IA interna in un modale operativo riusando `NextInternalAiPage`.
- La route ufficiale `/next/ia/interna` continua a funzionare senza modifiche al contratto di pagina.
- Il testo visibile `Lascia nel thread` e stato rinominato in `Mantieni nella conversazione`, coerentemente con il significato del controllo UI.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Alert unico con filtro visibile
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- La card `Alert` e rimasta unica e ora mostra una barra filtro sopra la lista.
- Il filtro iniziale e `Tutti` e le categorie esposte sono quelle gia presenti nel runtime: `Revisioni`, `Segnalazioni`, `Eventi autisti` e `Conflitti sessione`.
- I contatori visibili sulle pillole filtro sono ricavati dai record gia disponibili senza nuove aggregazioni di dominio.
- Le revisioni restano cliccabili e aprono il modale revisione gia esistente.
- Segnalazioni, eventi autisti e altri alert continuano a usare i comportamenti gia presenti nel codice corrente.
- Build runtime verificata con esito positivo.

## 0. Aggiornamento operativo 2026-04-01 - Home NEXT top area semplificata
- La Home NEXT ufficiale usa ancora il runtime `src/next/NextCentroControlloPage.tsx`.
- Nell'area alta la entry legacy `360` e stata sostituita con la vera superficie della chat IA interna gia esistente nel progetto.
- Il blocco `Alert` mostra solo le revisioni dei mezzi.
- Ogni riga revisione dentro `Alert` apre il modale revisione riusando la stessa logica e lo stesso salvataggio gia presenti.
- La sezione `Revisioni` separata resta nascosta dal layout principale della Home NEXT.
- Build runtime verificata con esito positivo.

## 0. Audit finale globale V4 2026-03-31 - blocco extra-tracker `IA interna`
- Audit separato finale aggiornato: `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V4.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Tutti i moduli del tracker e le route ufficiali gia corrette reggono nel codice reale, inclusi i fix finali di `Autisti`, `Autisti Inbox / Admin`, `Dossier Mezzo` e `Gestione Operativa`.
- Il nuovo blocco grave non e nel tracker ma su route ufficiali NEXT extra-tracker montate in `src/App.tsx`:
  - `/next/ia/interna`
  - `/next/ia/interna/sessioni`
  - `/next/ia/interna/richieste`
  - `/next/ia/interna/artifacts`
  - `/next/ia/interna/audit`
- `src/next/NextInternalAiPage.tsx` esegue ancora scritture reali isolate del sottosistema IA interno: upload/rimozione allegati, save/archive artifact e workflow preview/approve/reject/rollback.
- Conseguenza:
  - il tracker tutto `CLOSED` non basta ancora a promuovere la NEXT;
  - finche `ia/interna*` resta route ufficiale NEXT con persistenza attiva, la NEXT non puo essere dichiarata lavorabile in autonomia come clone read-only sul perimetro target.

## 0. Correzione post-audit globale V3 2026-03-31 - `Gestione Operativa` route ufficiale
- Il blocco grave trovato dall'audit finale globale V3 sulla route ufficiale `Gestione Operativa` e stato corretto nel codice reale.
- `src/next/domain/nextOperativitaGlobaleDomain.ts` non legge piu `Inventario`, `Materiali` e `Procurement` del percorso ufficiale con i default permissivi dei domain condivisi, ma passa esplicitamente `includeCloneOverlays: false`.
- Badge, preview inventario e contatore consegne del runtime ufficiale `src/next/NextGestioneOperativaPage.tsx` leggono quindi solo dati reali madre-like nel path `/next/gestione-operativa`.
- Questa correzione chiude il blocco emerso dall'audit finale globale V3, ma NON aggiorna da sola il verdetto globale della NEXT: serve un nuovo audit finale separato.

## 0. Riesecuzione audit finale globale V3 2026-03-31 - blocco `Gestione Operativa`
- Audit separato finale aggiornato: `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- I fix finali di `Autisti`, `Autisti Inbox / Admin` e `Dossier Mezzo` reggono nel codice reale.
- Il nuovo audit globale V3 aggiornato trova pero un blocco grave ancora attivo su una route ufficiale NEXT:
  - `src/App.tsx` monta `/next/gestione-operativa` su `src/next/NextGestioneOperativaPage.tsx`;
  - `src/next/useNextOperativitaSnapshot.ts` chiama `readNextOperativitaGlobaleSnapshot()`;
  - `src/next/domain/nextOperativitaGlobaleDomain.ts` legge ancora `Inventario`, `Materiali` e `Procurement` senza spegnere gli overlay clone;
  - i domain condivisi mantengono il default `includeCloneOverlays ?? true`;
  - badge e preview visibili del runtime ufficiale possono quindi ancora assorbire dati clone-local.
- Conseguenza:
  - il tracker tutto `CLOSED` non basta ancora a promuovere la NEXT;
  - serve un fix separato sulla route ufficiale `Gestione Operativa`, poi un nuovo audit finale globale separato.

## 0. Correzione post-audit globale V3 2026-03-31 - `Dossier Mezzo`
- Il blocco grave trovato dall'audit finale globale V3 sul modulo `Dossier Mezzo` e stato corretto nel codice reale.
- `src/next/domain/nextDossierMezzoDomain.ts` non legge piu i movimenti materiali del percorso ufficiale con il default permissivo del domain condiviso, ma usa esplicitamente `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`.
- La tabella `Materiali e movimenti inventario` del runtime ufficiale `src/next/NextDossierMezzoPage.tsx` legge quindi solo `@materialiconsegnati` reale, senza overlay clone-only nel percorso ufficiale.
- Questa correzione chiude il falso `CLOSED` emerso dall'audit finale globale V3, ma NON aggiorna da sola il verdetto globale della NEXT: serve un nuovo audit finale separato.

## 0. Audit finale globale post-loop V3 2026-03-31
- Audit separato finale aggiornato: `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Il fix finale di `Autisti Inbox / Admin` regge, ma il nuovo audit globale da zero trova un altro falso `CLOSED` nel codice reale:
  - `Dossier Mezzo` resta marcato `CLOSED` nel tracker;
  - il reader ufficiale `src/next/domain/nextDossierMezzoDomain.ts` chiama ancora `readNextMaterialiMovimentiSnapshot()` senza disabilitare gli overlay clone;
  - `src/next/domain/nextMaterialiMovimentiDomain.ts` mantiene il default `includeCloneOverlays ?? true`;
  - il blocco finisce davvero nella UI ufficiale `Materiali e movimenti inventario` di `src/next/NextDossierMezzoPage.tsx`.
- Finche questo punto resta, la NEXT non puo essere promossa a clone lavorabile in autonomia.

## 0. Correzione post-audit globale V2 2026-03-31 - `Autisti Inbox / Admin`
- Il blocco grave trovato dall'audit finale globale V2 sul modulo `Autisti Inbox / Admin` e stato corretto nel codice reale.
- `src/next/NextAutistiInboxHomePage.tsx` e `src/next/NextAutistiAdminPage.tsx` non montano piu `NextLegacyStorageBoundary` nei wrapper ufficiali home/admin.
- `src/next/NextLegacyStorageBoundary.tsx` non inietta piu override `autisti` legacy-shaped neppure sul perimetro ufficiale `/next/autisti-inbox*` e `/next/autisti-admin`.
- Il perimetro inbox/admin continua a leggere i dataset reali via `src/next/autisti/nextAutistiStorageSync.ts`, con scritture reali e clone-only gia bloccate nel runtime.
- Questa correzione chiude il falso `CLOSED` emerso dall'audit finale globale V2, ma NON aggiorna da sola il verdetto globale della NEXT: serve un nuovo audit finale separato.

## 0. Audit finale globale post-loop V2 2026-03-31
- Audit separato finale aggiornato: `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V2.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Il fix finale di `Autisti` ha corretto il vecchio blocco sulle navigazioni verso `/autisti/*`, ma il nuovo audit globale separato ha trovato un altro blocco grave nel codice reale:
  - `Autisti Inbox / Admin` e marcato `CLOSED` nel tracker, ma le route ufficiali `/next/autisti-inbox*` e `/next/autisti-admin` passano ancora da `NextLegacyStorageBoundary` con preset `autisti`;
  - quel preset continua a costruire override legacy-shaped che fondono dati reali con overlay clone-local di segnalazioni, controlli, richieste e rifornimenti;
  - quindi almeno un modulo dichiarato chiuso non e chiuso davvero nel codice reale.
- Finche questo blocco resta, la NEXT non puo essere promossa a clone lavorabile in autonomia.

## 0. Correzione post-audit globale 2026-03-31 - `Autisti`
- Il blocco grave trovato dall'audit finale globale sul modulo `Autisti` e stato corretto nel codice reale.
- `src/next/autisti/NextLoginAutistaNative.tsx`, `src/next/autisti/NextSetupMezzoNative.tsx` e `src/next/autisti/NextHomeAutistaNative.tsx` non navigano piu verso `/autisti/*`, ma restano confinati a `/next/autisti/*`.
- `src/next/NextLegacyStorageBoundary.tsx` non inietta piu override `autisti` legacy-shaped nel solo perimetro ufficiale `/next/autisti/*`.
- Questo chiude il falso `CLOSED` emerso dall'audit finale globale, ma NON aggiorna da solo il verdetto globale della NEXT: serve un nuovo audit finale separato.

## 0. Audit finale globale post-loop 2026-03-31
- Audit separato finale: `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Blocco grave confermato nel codice reale:
  - il tracker risulta tutto `CLOSED`, ma `Autisti` non e chiuso davvero;
  - `src/App.tsx` monta le route ufficiali `/next/autisti/*`, pero i runtime `src/next/autisti/NextLoginAutistaNative.tsx`, `src/next/autisti/NextSetupMezzoNative.tsx` e `src/next/autisti/NextHomeAutistaNative.tsx` navigano ancora verso route madre `/autisti/*`;
  - finche questo blocco resta, la NEXT non puo essere promossa a clone lavorabile in autonomia.

## 0. Nota critica audit generale 2026-03-30
- Audit generale totale: `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
  - le route ufficiali del perimetro target sono quasi tutte NEXT native, ma questo NON coincide con parity reale verso la madre
  - molti moduli restano `APERTO` perche espongono ancora flussi `clone-only`, blocchi operativi o parity esterna non dimostrata
  - i soli moduli promossi a `CHIUSO` da questo audit sono `Gestione Operativa`, `IA Home` e `IA API Key`
  - `Manutenzioni` resta `APERTO` anche dopo il fix data del prompt 49: la parity operativa con la madre non e dimostrata e il confronto live remoto resta bloccato da `permission-denied`

## 0. Nota critica audit 2026-03-30
- Il report `docs/audit/REPORT_FINALE_PROMPT_39_CHIUSURA_ULTIMI_8.md` non e allineato al codice reale del repository.
- Audit finale di verifica: `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`.
- Verdetto corrente verificato nel repo:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
  - gli ultimi 8 moduli del report 39 non sono tutti chiusi davvero
  - molte route ufficiali del perimetro target montano ancora `NextMotherPage` e pagine `src/pages/**`
  - diverse pagine NEXT native del blocco finale restano clone-safe ma non equivalenti alla madre lato flussi operativi

## 0.1 Aggiornamento operativo 2026-03-31 - `Autisti` chiuso sul runtime ufficiale
- Il modulo `Autisti` e ora `CLOSED` nel loop ufficiale modulo-per-modulo con audit separato `PASS`.
- Le route ufficiali `/next/autisti`, `/next/autisti/controllo`, `/next/autisti/cambio-mezzo`, `/next/autisti/rifornimento`, `/next/autisti/richiesta-attrezzature` e `/next/autisti/segnalazioni` restano NEXT native e non montano `src/autisti/**` come runtime finale.
- Il boundary `src/next/autisti/nextAutistiStorageSync.ts` esclude overlay locali e scritture clone-only per le chiavi D03 gestite sul solo pathname `/next/autisti/*`, lasciando fuori da questo run `Autisti Inbox / Admin`.
- `Login`, `Setup mezzo`, `Home`, `Controllo`, `Cambio mezzo`, `Rifornimento`, `Richiesta attrezzature`, `Segnalazioni` e il modal `Gomme` mantengono la grammatica pratica della madre, ma bloccano ogni side effect con messaggi read-only espliciti.
- Login e setup mantengono solo contesto UI locale dell'app autisti; nessuna sessione madre viene creata o modificata dal clone.

## 1. Scopo del documento
Questo documento resta il registro ufficiale dello stato della NEXT, ma dal `2026-03-10` segue una strategia diversa rispetto alla versione precedente.

Serve a:
- capire in pochi minuti quale strategia NEXT e attiva davvero;
- distinguere la NEXT sperimentale sospesa dal nuovo clone `read-only` della madre;
- tracciare l'archiviazione della NEXT attuale e l'avvio del clone fedele;
- segnare quando, in fase successiva, verranno innestati layer puliti, IA e tracking sopra il clone;
- lavorare insieme al registro permanente delle patch clone `docs/product/REGISTRO_MODIFICHE_CLONE.md`.

## 2. Nota di continuita
- La strategia NEXT precedente e sospesa.
- Snapshot archiviate della situazione precedente:
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/MATRICE_ESECUTIVA_NEXT.pre-clone-2026-03-10.md`
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/STATO_MIGRAZIONE_NEXT.pre-clone-2026-03-10.md`
- La madre resta il gestionale operativo principale e non viene toccata.

## 3. Strategia ufficiale attiva
- La NEXT attuale viene considerata esperimento sospeso e da archiviare.
- La nuova priorita e costruire in `src/next/*` un clone fedele `read-only` della madre.
- Il clone deve:
  - usare la stessa UX pratica della madre;
  - leggere gli stessi dati reali;
  - bloccare completamente scritture, delete, upload, import e side effect.
- Layer puliti dedicati, IA e tracking NON sono piu il primo passo: verranno innestati solo dopo che il clone `read-only` sara stabile.

## 4. Stati standard usati in questa fase
- `SOSPESO`: parte o strategia non piu da estendere nel ramo attivo.
- `DA ARCHIVIARE`: parte presente nel repo ma da spostare fuori dal percorso attivo.
- `NON INIZIATO`: il nuovo clone non e ancora stato costruito.
- `IN PREPARAZIONE`: documentazione/regole allineate, ma nessuna patch runtime ancora applicata.
- `IMPORTATO READ-ONLY`: clone o blocco clone gia operativo in sola lettura.

## 5. Tabella sintetica aggiornata

| Elemento | Stato | Note operative | Ultimo aggiornamento |
| --- | --- | --- | --- |
| Strategia NEXT precedente | SOSPESO | Non e piu la base del progetto; non va estesa | 2026-03-10 |
| Snapshot NEXT precedente | IMPORTATO READ-ONLY | Archivio creato in `src/_archive_next_pre_clone/next-2026-03-10-active/` per recuperabilita completa del ramo sperimentale precedente | 2026-03-10 |
| Clone fedele `read-only` della madre | IMPORTATO READ-ONLY | Avviato su `Home`, `Gestione Operativa`, `Mezzi`, `Dossier Mezzo`, `Dossier Gomme`, `Dossier Rifornimenti`, `Analisi Economica`, `Area Capo`, `Colleghi`, `Fornitori`, hub `Intelligenza Artificiale`, `Libretti Export`, la route base `Cisterna`, i moduli `Cisterna IA` e ora anche `Schede Test`, le due liste reali `Lavori in attesa` / `Lavori eseguiti` e il relativo `DettaglioLavoro` clone-safe su route dedicata. Dal `2026-03-11` il residuo runtime `/next/strumenti-trasversali` e stato rimosso perche non rappresenta una famiglia reale della madre; nella stessa giornata il residuo concettuale `/next/ia-gestionale` e stato riallineato al vero hub madre `Intelligenza Artificiale` su `/next/ia`, e metadata/access/guard minima del clone sono stati riallineati alle route gia attive. Sempre il `2026-03-11`, `Analisi Economica` ha ottenuto anche la route clone dedicata `/next/analisi-economica/:targa`, mentre il vecchio deep link interno `?view=analisi` del dossier viene solo riallineato via redirect tecnico. Nella stessa giornata, il Dossier clone ha smesso di trattare i lavori del mezzo come listati non navigabili e li collega ora al dettaglio clone-safe `/next/dettagliolavori/:lavoroId`. `Gestione Operativa` resta navigabile con sezioni deep-linkabili read-only per inventario, materiali, attrezzature, manutenzioni e procurement clone-safe (`Acquisti` con `Ordini`, `Arrivi` e `Dettaglio ordine`), mentre `Lavori Da Eseguire`, `Ordine materiali`, `Prezzi & Preventivi`, `Listino Prezzi`, approvazioni `Capo Costi Mezzo` e PDF timbrati restano ancora bloccati in modo esplicito. Sempre dal `2026-03-11`, il clone installa anche una prima barriera runtime no-write per il subtree `/next`, capace di bloccare centralmente `storageSync`, upload/delete materiali, callable `aiCore`, endpoint Cisterna e gli endpoint mutanti applicativi noti intercettati via `fetch`; nella stessa giornata `Cisterna IA` e `Schede Test` sono stati resi navigabili in forma clone-safe, lasciando pero bloccati upload, analisi IA, save/update e salvataggi archivio. Sempre il `2026-03-11`, entra anche la prima tranche `Autisti Inbox` con le route clone `/next/autisti-inbox/cambio-mezzo`, `/next/autisti-inbox/log-accessi` e `/next/autisti-inbox/gomme`; nella stessa giornata entra anche la seconda tranche con `/next/autisti-inbox/controlli`, `/next/autisti-inbox/segnalazioni` e `/next/autisti-inbox/richiesta-attrezzature`. Sempre il `2026-03-11` entra ora anche la home clone-safe `/next/autisti-inbox`, che riusa `AutistiInboxHome` con `NextAutistiEventoModal`, riallinea i link interni alle route clone gia aperte e non lascia piu fuori `Autisti Admin`: entra infatti anche `/next/autisti-admin` come controparte reader-first, con tabs, filtri, foto e anteprime PDF ma nessuna rettifica o azione distruttiva. Nella stessa giornata viene predisposto anche `NextAutistiEventoModal`, variante clone-safe del modal eventi autisti che neutralizza `CREA LAVORO`, `IMPORTA IN DOSSIER` e ogni uscita legacy verso `dettagliolavori`, come prerequisito tecnico per importare in seguito `AutistiInboxHome` e poi valutare `Autista 360`. Sempre il `2026-03-11` entra infine la prima tranche clone-safe della vera app autisti su `/next/autisti`, con `AutistiGate`, `LoginAutista`, `SetupMezzo` e `HomeAutista` sotto layout dedicato fuori dalla `NextShell`, rewrite interno dei path legacy verso `/next/autisti/*`, redirect tecnico del vecchio placeholder `/next/autista` e blocco esplicito delle superfici ancora fuori perimetro (`Sgancia motrice`). Nella stessa giornata entra anche la seconda tranche della stessa app con route clone reali `/next/autisti/controllo` e `/next/autisti/cambio-mezzo`, gate clone dedicato che vede anche i controlli locali del clone e flusso `Gomme` raggiungibile dalla home senza simulare sincronizzazione madre. Sempre il `2026-03-11` entra ora anche il primo modulo della terza tranche con `/next/autisti/rifornimento`, pagina clone dedicata che replica il flusso utile del modulo madre ma salva solo in storage locale clone-safe. Nella stessa giornata entrano anche `/next/autisti/richiesta-attrezzature` e `/next/autisti/segnalazioni`, pagine clone dedicate con gestione foto solo locale e nessun upload/delete verso Storage. Sempre il `2026-03-11`, il clone riallinea anche la propria parita UI alla copertura reale: topbar shell estesa ai moduli gia attivi, quick link del Centro Controllo ricondotti alle controparti `/next` gia presenti e metadata route/modules aggiornati per raccontare `Autisti Inbox`, `Autisti Admin`, `Libretti Export`, `App Autisti` e le sottoroute `Cisterna` gia aperte. Sempre il `2026-03-11`, la parita strutturale del clone si allinea anche alla madre: `/next` diventa una vera `Home` clone autonoma, `/next/centro-controllo` replica la pagina madre dedicata, `Gestione Operativa` e procurement vengono spacchettati in route autonome (`/next/gestione-operativa`, `/next/inventario`, `/next/materiali-consegnati`, `/next/attrezzature-cantieri`, `/next/manutenzioni`, `/next/acquisti`, `/next/materiali-da-ordinare`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`), `Lavori Da Eseguire` ottiene la propria route clone `/next/lavori-da-eseguire`, `Mezzi` e `Dossier Mezzi` vengono separati su `/next/mezzi` e `/next/dossiermezzi`, `Dossier Gomme` e `Dossier Rifornimenti` smettono di essere sole subview e diventano route vere, e l'hub IA apre anche le child route autonome `/next/ia/apikey`, `/next/ia/libretto`, `/next/ia/documenti` e `/next/ia/copertura-libretti`, tutte con scritture ancora neutralizzate | 2026-03-11 |
| Blocco totale scritture nel clone | IMPORTATO READ-ONLY | Hardening rafforzato su `NextCentroControlloPage`, `NextDossierMezzoPage`, `NextMezziDossierPage` e shell `/next`: bloccati writer, persistenze locali che simulavano workflow, uscite legacy pericolose e azioni IA/upload. Dal `2026-03-11` il blocco non dipende piu solo dalla UI: una Fase 1 centrale installata in `main.tsx` ferma nel clone `storageSync.setItemSync/removeItemSync`, helper condivisi di upload/delete materiali, callable `aiCore`, endpoint mutanti Cisterna e, dopo la correzione della regressione letture dello stesso giorno, solo le `fetch` verso endpoint mutanti applicativi noti (`Cloud Functions`, `Cloud Run` e `/api/*` del progetto), lasciando passare il traffico infrastrutturale di Firebase/Auth/SDK. Nella stessa giornata e stato aggiunto un hardening Fase 2 mirato con wrapper `firestoreWriteOps` / `storageWriteOps`, gia cablati sui writer diretti di `Cisterna IA` e `Schede Test` (`addDoc`, `updateDoc`, `uploadBytes`) per preparare la loro futura migrazione clone-safe; restano ancora fuori i mutator SDK diretti del resto del repo. Sempre il `2026-03-11`, la prima tranche `/next/autisti/*` aggiunge anche un livello UX clone-safe specifico: sessione locale autisti namespaced e confinata al clone, banner esplicito sul fatto che login/mezzo attivo restano locali al subtree e blocco sobrio delle azioni che darebbero falsa impressione di sincronizzazione madre. Nella stessa giornata, la seconda tranche autisti estende lo stesso perimetro no-write con controllo e cambio mezzo salvati solo nel clone e con il `Salva` del modal `Gomme` intercettato prima che possa sembrare una sincronizzazione riuscita sulla madre. Sempre il `2026-03-11`, `Rifornimento` entra nel clone solo con pagina dedicata e persistenza locale clone-only, evitando sia `storageSync` sia il `setDoc` diretto verso `storage/@rifornimenti` usato dal modulo madre. Nella stessa giornata, `RichiestaAttrezzature` e `Segnalazioni` entrano nel clone solo con pagine dedicate, persistenza locale clone-only e foto preparate come anteprime locali senza `uploadBytes`, `deleteObject` o `getDownloadURL` reali. Sempre il `2026-03-11`, `Autisti Admin` entra solo come pagina reader-first: nessuna CTA scrivente, nessuna rettifica reale, nessun delete allegati e nessun `crea lavoro` esposto dalla nuova route clone `/next/autisti-admin` | 2026-03-11 |
| Lettura dati reali nel clone | IMPORTATO READ-ONLY | Il clone legge gia gli stessi dataset reali della madre nelle aree prioritarie, compresi `@lavori`, `@materialiconsegnati`, `@manutenzioni`, `@mezzi_aziendali`, `@colleghi`, `@fornitori`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@analisi_economica_mezzi`, `@ordini`, `@alerts_state`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` e collezioni documentali IA; dal `2026-03-10` lavori, materiali/movimenti, rifornimenti, documenti/costi, manutenzioni/gomme, Centro di Controllo, `Mezzi / Anagrafica flotta`, procurement clone-safe e ora anche `Colleghi` / `Fornitori` passano pero attraverso layer dedicati read-only che normalizzano merge, dedup, parsing, shape sporche e aggregazioni solo nel dominio | 2026-03-11 |
| Layer puliti dedicati NEXT | IMPORTATO READ-ONLY | Layer clone attivi su `Anagrafiche flotta`, `Colleghi`, `Fornitori`, `Lavori`, `Materiali / Movimenti`, `Inventario`, `Attrezzature cantieri`, `Rifornimenti`, `Documenti + Costi`, `Manutenzioni + Gomme`, `Centro di Controllo / Eventi`, `Procurement / Ordini`, `Area Capo`, `Gestione Operativa`, `Libretti Export`, `Configurazione IA` e ora anche `Cisterna`: `src/next/nextAnagraficheFlottaDomain.ts`, `src/next/domain/nextColleghiDomain.ts`, `src/next/domain/nextFornitoriDomain.ts`, `src/next/domain/nextLavoriDomain.ts`, `src/next/domain/nextMaterialiMovimentiDomain.ts`, `src/next/domain/nextInventarioDomain.ts`, `src/next/domain/nextAttrezzatureCantieriDomain.ts`, `src/next/domain/nextRifornimentiDomain.ts`, `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/domain/nextManutenzioniGommeDomain.ts`, `src/next/domain/nextCentroControlloDomain.ts`, `src/next/domain/nextProcurementDomain.ts`, `src/next/domain/nextCapoDomain.ts`, `src/next/domain/nextOperativitaGlobaleDomain.ts`, `src/next/domain/nextLibrettiExportDomain.ts`, `src/next/domain/nextIaConfigDomain.ts` e `src/next/domain/nextCisternaDomain.ts`. Sempre dal `2026-03-11`, `src/next/domain/nextLavoriDomain.ts` non alimenta piu solo il Dossier per-mezzo ma anche le liste globali clone-safe `Lavori in attesa` e `Lavori eseguiti`, oltre al nuovo resolver read-only del dettaglio per `lavoroId`, includendo pure i record `MAGAZZINO` o senza targa senza portare letture raw nella UI; `src/next/domain/nextCisternaDomain.ts` ricostruisce invece archivio, report mensile e ripartizioni per targa usando i dataset cisterna reali senza trascinare writer o raw reads nella UI | 2026-03-29 |
| IA sopra layer puliti | IN PREPARAZIONE | Rinviata a fase successiva, sopra il clone | 2026-03-10 |
| Tracking d'uso NEXT | IN PREPARAZIONE | Rinviato a fase successiva, sopra il clone | 2026-03-10 |

## 5.1 Aggiornamento 2026-03-12 - Parita UI reale clone/madre
- La shell `/next` e la shell `/next/autisti/*` sono state alleggerite dal chrome clone-only: il clone presenta ora la stessa percezione base della madre, con notice minimi e senza topbar clone dedicata.
- Le principali pagine clone non usano piu pannelli custom o reader-first: su `/next` vengono montate direttamente le pagine madre reali per `Home`, `Gestione Operativa`, `Dettaglio Lavoro`, `Autisti Admin`, child route IA prioritarie, `Cisterna`, `Mezzi`, `Dossier Lista`, `Dossier Mezzo` e `Analisi Economica`, mentre il gruppo procurement usa ora runtime NEXT dedicato ma riallineato alla stessa superficie read-only della madre.
- Il blocco no-write resta confinato al clone tramite `NextMotherPage` e `nextCloneNavigation`: i writer madre restano visibili ma vengono disabilitati o neutralizzati nel subtree `/next`, senza riaprire scritture vere.
- Il modal eventi autisti non e piu impoverito nel clone: CTA e modale madre restano visibili, ma la conferma finale e bloccata nel runtime clone.
- Restano esplicitamente fuori dalla parita 1:1 di questa patch `Autista 360` e `Mezzo 360`, che rimangono bucket di rifondazione e non semplice riallineamento.

## 5.2 Aggiornamento 2026-03-12 - Scaffolding IA interna isolato
- Sotto la famiglia clone IA e stato aperto il nuovo subtree `/next/ia/interna*`, dedicato al futuro sottosistema IA interno ma non operativo.
- Il nuovo perimetro vive solo nel clone/NEXT e non modifica i flussi madre o i moduli business correnti.
- Lo scaffolding include:
  - route UI isolate per overview, sessioni, richieste, artifacts e audit;
  - model/types locali per `ai_sessions`, `ai_requests`, `analysis_artifacts`, `ai_audit_log` e stati `preview` / `approval`;
  - contratti stub per orchestrator, retrieval, artifact repository, audit log e approval workflow;
  - repository mock locale e tracking d'uso solo in-memory, confinato al subtree IA interno.
- L'archivio artifact in questo step e ammesso solo come shell + model + mock repository non persistente; non usa Storage, Firestore o path business.
- Non vengono riusati a runtime i moduli IA/PDF legacy (`aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto, `server.js`).
- Nessun segreto lato client, nessuna scrittura business e nessun hook globale invasivo sono stati introdotti dalla patch.

## 5.3 Aggiornamento 2026-03-12 - Fix crash subtree IA interno
- Corretto un loop di render nel nuovo subtree `/next/ia/interna*` causato dal tracking in-memory cablato con `useSyncExternalStore`.
- La causa era uno snapshot non cached: `readInternalAiTrackingSummary()` restituiva un nuovo oggetto a ogni render, facendo scattare il warning React su `getSnapshot` e il conseguente `Maximum update depth exceeded`.
- Il fix resta confinato al tracking locale del sottosistema IA interno e non modifica route, backend, business data o moduli legacy.
- Le liste renderizzate del subtree IA sono state ricontrollate: le mappe attive usano gia key stabili e non e stato necessario introdurre altre modifiche strutturali.

## 5.4 Aggiornamento 2026-03-12 - Primo use case IA interna: report targa in anteprima
- Il subtree `/next/ia/interna*` ospita ora il primo use case reale ma sicuro del sottosistema IA interno: ricerca per targa, lettura in sola lettura e composizione di una anteprima report dentro il clone.
- La lettura riusa il composito `readNextDossierMezzoCompositeSnapshot` e i relativi layer NEXT gia normalizzati per:
  - anagrafica flotta;
  - lavori;
  - manutenzioni e gomme;
  - rifornimenti;
  - movimenti materiali;
  - documenti/costi;
  - eventuale analisi economica legacy salvata.
- Il nuovo facade del sottosistema IA vive solo nel perimetro clone/NEXT e non introduce:
  - writer Firestore/Storage business;
  - backend IA reale;
  - riuso runtime di moduli IA legacy;
  - segreti lato client.
- La bozza del report puo essere salvata solo come sessione/richiesta/bozza simulata nel repository locale del sottosistema IA; nessuna persistenza business viene toccata.
- I testi visibili del subtree IA interno sono stati riallineati in italiano.

## 5.5 Aggiornamento 2026-03-12 - Checklist unica IA interna
- Creata `docs/product/CHECKLIST_IA_INTERNA.md` come fonte operativa unica del sottosistema IA interno.
- La checklist ricostruisce retroattivamente i passaggi gia chiusi:
  - audit architetturale;
  - innesto sul clone/NEXT;
  - linee guida;
  - stato avanzamento;
  - scaffolding isolato;
  - model/types;
  - contracts/repository mock;
  - tracking sicuro;
  - fix crash tracking snapshot;
  - primo use case report targa in anteprima.
- La checklist registra anche il filone futuro `Modello camion con IA`, oggi allo stato `NON FATTO`.
- Da ora ogni task relativo al sottosistema IA interno sotto `/next/ia/interna*` deve aggiornare obbligatoriamente la checklist unica.

## 5.6 Aggiornamento 2026-03-12 - Archivio artifact IA persistente solo locale
- Il subtree `/next/ia/interna*` usa ora un archivio artifact persistente solo locale, namespaced e confinato al clone.
- La decisione e stata presa dopo verifica di sicurezza: Firestore/Storage dedicati non sono ancora dimostrabili come contenitori sicuri nel repo perche restano aperti `firestore.rules`, policy Storage effettive e auth anonima.
- Il use case `report targa in anteprima` continua a leggere solo dai layer NEXT in sola lettura e puo ora:
  - salvare il report come `draft`;
  - ritrovare l'artifact nell'archivio IA interno;
  - distinguerlo da `preview` e `archiviato`;
  - riaprirlo nella UI IA interna.
- Nessun dataset business e nessun path Storage business vengono toccati da questa persistenza.

## 5.7 Aggiornamento 2026-03-12 - Chat interna controllata del sottosistema IA
- La panoramica `/next/ia/interna` espone ora una prima chat interna controllata, locale e reversibile, coerente con la UI del gestionale.
- La chat non usa provider reali, backend IA, moduli IA legacy, Cloud Run o endpoint esistenti del repo.
- Gli intenti oggi supportati sono solo:
  - aiuto/capacita reali del sottosistema;
  - report targa in anteprima;
  - risposta esplicita alle richieste non ancora supportate o non sicure.
- L'intento `report targa` riusa il facade read-only gia esistente del sottosistema IA e aggiorna la stessa sezione preview/artifact senza introdurre writer business.
- I messaggi restano solo in memoria nella pagina corrente; non viene introdotta nessuna persistenza business o server-side.

## 5.8 Aggiornamento 2026-03-12 - Ricerca guidata mezzi per il report targa IA interno
- Il use case `/next/ia/interna` per la preview report targa legge ora l'elenco mezzi reali dal layer NEXT `readNextAnagraficheFlottaSnapshot`, gia usato dal clone per la flotta in sola lettura.
- La UI espone un autosuggest leggero e locale che filtra mentre si scrive e mostra, oltre alla targa, anche il minimo contesto gia disponibile nei readers puliti:
  - marca/modello;
  - categoria;
  - eventuale autista.
- La preview parte solo da un mezzo selezionato o da una corrispondenza esatta; le ricerche incomplete o ambigue chiedono esplicitamente una selezione guidata prima di leggere il report.
- Nessun writer business, nessun backend IA reale e nessun modulo IA legacy vengono toccati da questo affinamento.
- La chat interna mock non e stata intrecciata a questo autosuggest nello stesso task, per mantenere il perimetro delle patch separato e reversibile.

## 5.9 Aggiornamento 2026-03-13 - Memoria operativa locale e tracking persistente del modulo IA
- Il subtree `/next/ia/interna*` usa ora una memoria operativa locale namespaced e persistente nel browser del clone, separata dai dataset business.
- La memoria conserva solo elementi del modulo IA:
  - ultime targhe cercate;
  - prompt recenti della chat;
  - artifact recenti aperti, salvati o archiviati;
  - intenti usati;
  - ultimo stato di lavoro del sottosistema.
- Il tracking resta non invasivo e confinato alle sole azioni del modulo IA interno, senza agganciare navigazione o comportamento del gestionale fuori da `/next/ia/interna*`.
- La UI overview espone una sezione minima di memoria recente, utile per riprendere il lavoro nel modulo senza introdurre memoria operativa globale del gestionale.
- Nessun backend reale, nessun provider IA, nessun writer Firestore/Storage business e nessun modulo IA legacy vengono coinvolti da questa patch.

## 5.10 Aggiornamento 2026-03-13 - Ricerca guidata autisti e report autista read-only nel sottosistema IA
- Il subtree `/next/ia/interna*` supporta ora anche un secondo use case separato dal report targa: ricerca guidata autista reale e preview report autista in sola lettura.
- La lettura primaria degli autisti riusa il layer clone-safe `readNextColleghiSnapshot()` su `storage/@colleghi`, gia presente nel clone e gia normalizzato, senza introdurre nuove letture raw.
- La preview `report autista` legge solo fonti gia disponibili nel clone:
  - `storage/@colleghi` per i dati base autista;
  - `storage/@mezzi_aziendali` tramite `readNextAnagraficheFlottaSnapshot()` per i mezzi associati;
  - `D10 Centro Controllo` per eventuale ultimo mezzo noto e segnali operativi read-only;
  - `D04 Rifornimenti` per eventuali rifornimenti collegabili all'autista sui mezzi associati.
- La UI overview ora distingue in modo esplicito i due flussi:
  - `Anteprima report per targa`;
  - `Anteprima report per autista`.
- La memoria locale del modulo, il tracking interno e l'archivio artifact IA distinguono ora anche report e ricerche recenti di tipo autista.
- La chat mock del sottosistema IA riconosce ora anche richieste minime sul nuovo flusso autista, restando locale, controllata e senza backend reale.
- Nessuna scrittura Firestore/Storage business, nessun riuso runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questa estensione.

## 5.11 Aggiornamento 2026-03-13 - Filtri temporali e contesto periodo nei report IA interni
- Il subtree `/next/ia/interna*` supporta ora un contesto periodo condiviso per report targa e report autista, sempre confinato al clone e al sottosistema IA interno.
- La UI overview espone un blocco unico `Contesto periodo del report` con:
  - preset `Tutto`;
  - `Ultimi 30 giorni`;
  - `Ultimi 90 giorni`;
  - `Ultimo mese`;
  - intervallo personalizzato `Da / A`.
- Il filtro periodo viene applicato davvero solo alle sezioni che, nei layer NEXT gia esistenti, espongono una data utilizzabile:
  - targa: lavori, manutenzioni, rifornimenti, documenti/costi;
  - autista: segnali operativi D10 e rifornimenti collegabili.
- Le sezioni non filtrabili o non abbastanza affidabili sul piano temporale restano visibili come contesto read-only, ma vengono marcate in preview con stato periodo esplicito (`Nessun filtro`, `Fuori filtro`, `Periodo non disponibile`, `Filtro applicato`).
- La chat mock del sottosistema IA puo ora interpretare anche richieste con contesto periodo esplicito e, in assenza di periodo nel prompt, riusa il periodo attivo nella UI guidata del modulo.
- La memoria locale e l'archivio artifact IA registrano ora anche il periodo usato per l'ultimo report, senza toccare dataset business, Storage business o backend IA reali.

## 5.12 Aggiornamento 2026-03-13 - Report combinato mezzo + autista + periodo nel sottosistema IA interno
- Il subtree `/next/ia/interna*` supporta ora anche una preview combinata che unisce:
  - mezzo reale;
  - autista reale;
  - periodo attivo del report.
- L'implementazione resta confinata al clone/NEXT e riusa in modo pulito i facade gia attivi:
  - `report targa` read-only;
  - `report autista` read-only;
  - tracking/memoria/artifact locali del modulo IA.
- Il matching mezzo-autista non viene mai presentato come verita implicita:
  - `forte` solo con conferma anagrafica `autistaId` sul mezzo;
  - `plausibile` con nome dichiarato sul mezzo o segnali compatibili D10/D04;
  - `non dimostrabile` se il repo non espone legami leggibili.
- La preview combinata mostra in modo separato:
  - contesto selezionato;
  - affidabilita del legame;
  - intersezione reale nel periodo;
  - vista mezzo riusata;
  - vista autista riusata;
  - fonti lette e dati mancanti.
- La chat mock del sottosistema IA riconosce ora anche richieste minime combinate mezzo + autista, restando locale, mock e senza backend reale.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questa patch.

## 5.13 Aggiornamento 2026-03-13 - Archivio intelligente artifact IA con ricerca e filtri
- Il subtree `/next/ia/interna*` espone ora un archivio artifact locale piu consultabile e scalabile, sempre confinato al clone e senza backend reale.
- L'archivio IA interno supporta ora:
  - ricerca testuale veloce sui metadati del report;
  - filtri combinabili per tipo report, stato, ambito, targa, autista e periodo;
  - ordinamento per ultimi aggiornati;
  - riapertura della preview corretta nel modulo overview.
- Il modello locale degli artifact e retrocompatibile con quelli gia presenti e aggiunge metadati scalabili:
  - famiglia/ambito report;
  - testo ricercabile;
  - affidabilita del matching combinato quando disponibile;
  - ultimo aggiornamento archivio memorizzato nella memoria locale del modulo.
- Le famiglie vengono assegnate solo a partire dai dataset gia letti dai facade esistenti; se il report attraversa piu ambiti o i metadati non bastano, il clone usa i fallback espliciti `misto` o `non classificato`.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questa patch.

## 5.14 Aggiornamento 2026-03-13 - Fix matching rifornimenti nel report autista IA interno
- Il facade read-only del `report autista` non limitava il problema ai dati D04, ma al perimetro mezzi usato per leggerli: i rifornimenti venivano cercati solo sui mezzi associati all'autista nell'anagrafica D01.
- Questo poteva escludere rifornimenti recenti leggibili nel clone quando l'autista risultava su mezzi osservati nei segnali operativi D10, ma non ancora allineati come associazione corrente in anagrafica.
- Il fix resta confinato al sottosistema `/next/ia/interna*` e amplia in modo trasparente solo il perimetro di lettura:
  - mezzi associati in D01;
  - mezzi osservati nelle sessioni, negli alert e nei focus D10 dello stesso autista.
- Il matching autista sui rifornimenti resta read-only e continua a usare solo i campi gia esposti dal layer D04 (`badgeAutista`, `autistaNome`) senza introdurre join business nuovi o scritture.
- Nessuna modifica alla madre, nessuna scrittura business, nessun runtime IA legacy e nessun impatto sugli altri report vengono introdotti da questo fix.

## 5.15 Aggiornamento 2026-03-13 - Audit strutturale lettura/incrocio dati IA interna
- Eseguito audit mirato dei facade `/next/ia/interna*` e dei layer NEXT realmente usati per report mezzo, report autista, report combinato, lookup, filtri periodo e chat mock.
- L'audit conferma come punti solidi:
  - riuso dei layer NEXT read-only gia verificati;
  - filtro periodo centralizzato e coerente tra i report;
  - separazione esplicita tra copertura completa, parziale e non filtrabile;
  - report combinato che non promuove a `forte` un legame mezzo-autista non dimostrato.
- L'audit segnala come priorita strutturali ancora aperte:
  - matching badge/nome ancora rigido nei facade autista e combinato;
  - fallback lookup/autista sensibili a omonimie;
  - contesto mezzi autista piu ricco nel blocco rifornimenti che nell'intestazione anagrafica del report.
- Fix minimo e sicuro applicato nello stesso task:
  - la chat mock del sottosistema IA ripulisce ora il suffisso periodo dalle richieste autista prima del lookup esatto, evitando falsi `not found` su prompt gia supportati come `Mario Rossi ultimo mese`.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questo audit.

## 5.16 Aggiornamento 2026-03-13 - Matching autista badge-first cross-layer
- Il subtree `/next/ia/interna*` applica ora una regola badge-first unica e centralizzata per il matching identita autista tra:
  - D01 anagrafiche persone/flotta;
  - D10 Centro Controllo;
  - D04 rifornimenti.
- La regola runtime del clone e ora esplicita:
  - `autistaId` sul mezzo o badge coerente nel record = match forte;
  - nome esatto = solo fallback plausibile quando il riferimento forte manca davvero;
  - badge o `autistaId` incoerenti = nessun match certo, anche se il nome coincide.
- Il lookup autista non promuove piu un nome esatto a match automatico se nel catalogo esistono omonimi; il badge resta il primo discriminante.
- Il report autista e il report combinato riusano la stessa logica centrale su:
  - blocco rifornimenti D04;
  - blocco segnali D10;
  - ricostruzione delle associazioni mezzo/autista da D01.
- L'affidabilita del report combinato viene ora riallineata alla stessa gerarchia:
  - `forte` con `autistaId` coerente o badge coerente osservato sui record del mezzo;
  - `plausibile` solo con fallback nome prudente;
  - `non dimostrabile` in presenza di incoerenze forti o mancanza di conferme.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questo riallineamento.

## 5.17 Aggiornamento 2026-03-29 - Bridge legacy-shaped pulito sulle route ufficiali NEXT
- La parita clone/NEXT non e piu solo documentata: diverse route ufficiali `/next/*` montano ora la UI madre reale ma leggono i dataset tramite un bridge legacy-shaped pulito sopra i domain NEXT.
- Il bridge e composto da:
  - `src/next/nextLegacyStorageOverlay.ts`;
  - `src/next/NextLegacyStorageBoundary.tsx`;
  - precedenza controllata in `src/utils/storageSync.ts` per il solo subtree clone.
- Le route ufficiali che ora leggono con questo schema sono:
  - `/next/mezzi`;
  - `/next/gestione-operativa`;
  - `/next/inventario`;
  - `/next/materiali-consegnati`;
  - `/next/attrezzature-cantieri`;
  - `/next/manutenzioni`;
  - `/next/ordini-in-attesa`;
  - `/next/ordini-arrivati`;
  - `/next/dettaglio-ordine/:ordineId`;
  - `/next/lavori-da-eseguire`;
  - `/next/lavori-in-attesa`;
  - `/next/lavori-eseguiti`;
  - `/next/dettagliolavori/:lavoroId`.
- Il bridge legacy-shaped usa ora payload puliti o ripuliti per:
  - `@mezzi_aziendali`, `@colleghi`;
  - `@inventario`;
  - `@materialiconsegnati`;
  - `@attrezzature_cantieri`;
  - `@ordini`;
  - `@lavori`;
  - `@manutenzioni`.
- In particolare `@manutenzioni` ha ora anche un serializer dedicato `readNextManutenzioniLegacyDataset()` sotto `src/next/domain/nextManutenzioniDomain.ts`, cosi la pagina madre `Manutenzioni` non legge piu direttamente lo shape sporco legacy dentro il clone.

## 5.18 Aggiornamento 2026-03-29 - Stato reale dopo il prompt 33
- Dopo le patch runtime di oggi, i moduli che nel clone risultano ora `pari e puliti` nel perimetro ufficiale sono:
  - `Gestione Operativa`;
  - `Inventario`;
  - `Materiali consegnati`;
  - `Attrezzature cantieri`;
  - `Manutenzioni`;
  - `Mezzi`;
  - `Ordini in attesa`;
  - `Ordini arrivati`;
  - `Dettaglio ordine`;
  - `Lavori da eseguire`;
  - `Lavori in attesa`;
  - `Lavori eseguiti`;
  - `Dettaglio lavoro`;
  - `Dossier Gomme`;
  - `Dossier Rifornimenti`.
- Restano invece non chiusi i moduli in cui la madre incorpora ancora letture/scritture dirette Firestore/Storage o workflow non reimportabili 1:1 senza toccare file madre:
  - `Home`;
  - `Centro di Controllo`;
  - `Materiali da ordinare`;
  - `Acquisti / Preventivi / Listino prezzi`;
  - `Dossier Lista`;
  - `Dossier Mezzo`;
  - `Analisi Economica`;
  - `Capo Mezzi`;
  - `Capo Costi Mezzo`;
  - `Colleghi`;
  - `Fornitori`;
  - `IA Home`, `IA API Key`, `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Libretti Export`;
  - `Cisterna`, `Cisterna IA`, `Cisterna Schede Test`;
  - perimetro `Autisti / Inbox` che resta nel clone normale.
- Il report finale operativo di questo stato e in `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`.

## 5.17 Aggiornamento 2026-03-13 - Audit e rafforzamento del report mezzo IA interno
- Eseguito audit mirato del `report targa` read-only del sottosistema IA interno, concentrato sui blocchi:
  - lavori;
  - manutenzioni / gomme;
  - rifornimenti;
  - materiali / movimenti;
  - documenti / costi;
  - analisi economica salvata.
- L'audit conferma come punti solidi:
  - riuso del composito clone-safe `readNextDossierMezzoCompositeSnapshot`;
  - filtro periodo applicato ai blocchi con data affidabile;
  - ricostruzione D04 gia prudente e multi-sorgente;
  - dedup documentale gia confinato nel layer dedicato.
- Restano espliciti come limiti strutturali aperti:
  - eventi gomme fuori `@manutenzioni` non ancora inclusi nel report mezzo;
  - movimenti materiali ancora dipendenti in parte da match legacy su `destinatario`;
  - blocco documenti/costi ancora limitato dal perimetro clone-safe che non apre `@preventivi` e approvazioni procurement.
- Fix minimo e sicuro applicato nello stesso task:
  - la preview del report mezzo considera ora anche movimenti materiali e analisi economica salvata come copertura reale, evitando stati troppo pessimisti quando questi sono gli unici blocchi disponibili;
  - la sezione `Documenti, costi e analisi` non viene piu resa come vuota quando esiste una analisi economica legacy salvata fuori filtro.
- Nessuna scrittura Firestore/Storage business, nessun runtime IA legacy, nessun segreto lato client e nessun impatto sui flussi correnti vengono introdotti da questo audit/fix.

## 5.18 Aggiornamento 2026-03-13 - Rafforzamento blocco gomme nel report mezzo IA interno
- Il blocco `Manutenzioni / Gomme` del `report targa` IA non dipende piu solo dalle descrizioni `CAMBIO GOMME` lette in `@manutenzioni`.
- Il layer clone-safe `nextManutenzioniGommeDomain` converge ora in sola lettura anche:
  - `@cambi_gomme_autisti_tmp`;
  - `@gomme_eventi`.
- Regola di matching mezzo introdotta nel layer:
  - `targetTarga` o `targa` coerenti = match forte;
  - `targaCamion`, `targaRimorchio` e `contesto.*` = solo match plausibile quando manca una targa diretta;
  - nessun match di contesto viene promosso a conferma forte del mezzo.
- Per evitare doppio conteggio, gli eventi gomme extra che risultano gia importati nello storico manutenzioni vengono deduplicati solo quando coincidono davvero su giorno, targa, asse, marca e km.
- La preview `/next/ia/interna` rende ora piu trasparente la copertura del blocco gomme:
  - eventi da manutenzioni;
  - eventi da dataset gomme dedicati;
  - match forti;
  - match plausibili.
- Restano volutamente fuori dalla conferma forte i record gomme senza targa diretta o con solo contesto ambiguo; il clone preferisce copertura parziale dichiarata a collegamenti non dimostrati.

## 5.19 Aggiornamento 2026-03-22 - Ripristino build del clone IA interna dopo merge incompleto
- Il clone `read-only` e tornato compilabile dopo la rimozione dei conflict marker residui lasciati da un merge/worktree incompleto nella pagina `src/next/NextInternalAiPage.tsx` e nei file IA interni strettamente collegati.
- Il ripristino ha riallineato:
  - runtime pagina IA interna;
  - tipi condivisi del sottosistema IA;
  - facade clone-safe del report mezzo compatibili con la build attuale;
  - registri documentali obbligatori del clone e dell'IA interna.
- Verifiche del task:
  - `npm run build` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK.
- Stato del clone dopo il fix:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - perimetro `/next/ia/interna*` ancora isolato e `read-only`;
  - testi visibili del clone mantenuti in italiano.

## 5.20 Aggiornamento 2026-03-22 - Primo assorbimento preview-first documenti IA interni
- Il clone `/next/ia/interna*` espone ora un primo blocco secondario `Preview documenti collegabili al mezzo`.
- Il blocco legge davvero solo:
  - `@documenti_mezzi`;
  - record gia mezzo-centrici di `@costiMezzo`;
  - `@documenti_magazzino` e `@documenti_generici` solo quando la targa e gia leggibile nel layer clone-safe.
- La UI distingue in modo esplicito:
  - documenti diretti;
  - documenti plausibili;
  - flussi fuori perimetro.
- Restano fuori perimetro del primo step:
  - runtime legacy documenti (`IADocumenti`, `estrazioneDocumenti`);
  - OCR reale, upload Storage, classificazione automatica e scritture su `@documenti_*`;
  - `@preventivi`, approvazioni procurement e provider reali come backend canonico del blocco documenti.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiDocumentsPreviewFacade.ts` -> OK;
  - `npm run build` -> OK.
- Stato del clone dopo il task:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - blocco documenti IA interno integrato in modo secondario, reversibile e read-only;
  - testi visibili del clone mantenuti in italiano.

## 5.21 Aggiornamento 2026-03-22 - Primo assorbimento preview-first libretto IA interno
- Il clone `/next/ia/interna*` espone ora un blocco secondario `Preview libretto collegato al mezzo`.
- Il blocco legge davvero solo:
  - campi gia presenti sul mezzo in `@mezzi_aziendali`;
  - supporto clone-safe del layer `nextLibrettiExportDomain` per capire se il file libretto e gia disponibile nel clone.
- La UI distingue in modo esplicito:
  - dati libretto diretti;
  - dati plausibili o incompleti;
  - flussi fuori perimetro.
- Restano fuori perimetro del primo step:
  - runtime legacy `IALibretto`;
  - Cloud Run esterno e OCR reale;
  - upload file, salvataggi su `@mezzi_aziendali` e Storage business;
  - provider reali e segreti lato client.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts` -> OK;
  - `npm run build` -> OK.
- Stato del clone dopo il task:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - blocco libretto IA interno integrato in modo secondario, reversibile e read-only;
  - testi visibili del clone mantenuti in italiano.

## 5.22 Aggiornamento 2026-03-22 - Primo assorbimento preview-first preventivi IA interni
- Il clone `/next/ia/interna*` espone ora un blocco secondario `Preview preventivi collegabili al mezzo`.
- Il blocco legge davvero solo:
  - preventivi gia mezzo-centrici esposti dal layer clone-safe `nextDocumentiCostiDomain`;
  - supporti plausibili dai record documentali gia normalizzati nel layer documenti/costi;
  - snapshot clone-safe di procurement (`@preventivi`, `@preventivi_approvazioni`) solo come contesto separato e diagnostico.
- La UI distingue in modo esplicito:
  - preventivi direttamente collegabili;
  - preventivi plausibili o supporti separati;
  - flussi fuori perimetro.
- Restano fuori perimetro del primo step:
  - runtime legacy preventivi (`Acquisti`, `estraiPreventivoIA`);
  - OCR reale, parsing AI, upload Storage e ingestione nuovi file;
  - scritture su `@preventivi`, `@preventivi_approvazioni`, `@documenti_*` e provider reali come backend canonico;
  - workflow approvativo e PDF timbrati.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiPreventiviPreviewFacade.ts` -> OK;
  - `npm run build` -> OK.
- Stato del clone dopo il task:
  - nessuna scrittura business riaperta;
  - nessun impatto sui flussi dati della madre;
  - blocco preventivi IA interno integrato in modo secondario, reversibile e read-only;
  - testi visibili del clone mantenuti in italiano.

## 5.23 Aggiornamento 2026-03-22 - Primo scaffolding backend IA separato
- Il repo ospita ora il primo perimetro dedicato al backend server-side del sottosistema IA interno in `backend/internal-ai/*`.
- La scelta architetturale e deliberatamente separata da:
  - `functions/*`;
  - `functions-schede/*`;
  - `api/*`;
  - `server.js`.
- Lo scaffold include:
  - contratti base server-side;
  - manifest di guard rail;
  - dispatcher framework-agnostico;
  - handler stub non operativi per `health`, orchestrazione preview, retrieval controllato, preview artifact e preparazione approvazioni.
- Stato runtime del clone dopo il task:
  - nessuna route `/next` viene collegata al nuovo backend;
  - il clone resta navigabile anche con backend IA separato spento;
  - nessuna scrittura business, nessun provider reale e nessun runtime legacy vengono riattivati.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint backend/internal-ai/src/*.ts` -> OK;
  - `npm run build` -> OK.

## 5.24 Aggiornamento 2026-03-22 - Primo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora un primo ponte mock-safe verso `backend/internal-ai/*`.
- La capability oggi instradata nel backend separato e solo:
  - `Preview documenti collegabili al mezzo`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiDocumentsPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `documents-preview`;
  - fallback locale esplicito sul facade documenti clone-safe se il ponte non e pronto.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`, `report autista`, `report combinato`;
  - `analisi economica`, `libretto`, `preventivi`;
  - chat interna controllata.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentsPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.25 Aggiornamento 2026-03-22 - Secondo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora un secondo ponte mock-safe verso `backend/internal-ai/*`.
- La capability oggi aggiunta al backend separato e:
  - `Analisi economica preview-first`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiEconomicAnalysisPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `economic-analysis-preview`;
  - fallback locale esplicito sul facade economico clone-safe se il ponte non e pronto.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`, `report autista`, `report combinato`;
  - `libretto`, `preventivi`;
  - chat interna controllata.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiEconomicAnalysisPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.26 Aggiornamento 2026-03-22 - Terzo e quarto ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora anche il terzo e il quarto ponte mock-safe verso `backend/internal-ai/*`.
- Le capability oggi aggiunte al backend separato sono:
  - `Preview libretto collegato al mezzo`;
  - `Preview preventivi collegabili al mezzo`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiLibrettoPreviewBridge` e `internalAiPreventiviPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `libretto-preview` e `preventivi-preview`;
  - fallback locale esplicito sui facade clone-safe se i ponti non sono pronti.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - `report targa`, `report autista`, `report combinato`;
  - chat interna controllata.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiPreventiviPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.27 Aggiornamento 2026-03-22 - Quinto, sesto e settimo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora anche il quinto, il sesto e il settimo ponte mock-safe verso `backend/internal-ai/*`.
- Le capability oggi aggiunte al backend separato sono:
  - `Anteprima report per targa`;
  - `Anteprima report per autista`;
  - `Anteprima report combinato mezzo + autista`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiVehicleReportPreviewBridge`, `internalAiDriverReportPreviewBridge` e `internalAiCombinedReportPreviewBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.preview`;
  - handler backend mock-safe per `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`;
  - fallback locale esplicito sui facade clone-safe se i ponti non sono pronti.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - chat interna controllata;
  - lookup/autosuggest di supporto al clone.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts src/next/internal-ai/internalAiDriverReportPreviewBridge.ts src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.28 Aggiornamento 2026-03-22 - Ottavo ponte mock-safe tra clone IA e backend separato
- Il clone `/next/ia/interna*` usa ora anche l'ottavo ponte mock-safe verso `backend/internal-ai/*`.
- La capability oggi aggiunta al backend separato e:
  - `Chat interna controllata backend-first`.
- Il flusso runtime del clone ora e:
  - pagina `/next/ia/interna`;
  - bridge frontend `internalAiChatOrchestratorBridge`;
  - dispatcher `internalAiBackendService` sul path `orchestrator.chat`;
  - handler backend mock-safe per `chat-orchestrator`;
  - fallback locale esplicito sull'orchestratore chat clone-safe se il ponte non e pronto.
- Cosa non cambia:
  - nessun endpoint deployato reale del backend IA separato;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale:
  - lookup/autosuggest di supporto al clone;
  - persistenza messaggi chat e tracking locale in memoria.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK;
  - `npm run build` -> OK.

## 5.29 Aggiornamento 2026-03-22 - Primo adapter server-side reale e prima persistenza IA dedicata
- Il clone `/next/ia/interna*` usa ora anche un primo adapter server-side reale del backend IA separato, sempre in modalita mock-safe.
- Canale scelto nel repo:
  - adapter HTTP locale `backend/internal-ai/server/internal-ai-adapter.js`;
  - base path `/internal-ai-backend/*`;
  - persistenza dedicata in `backend/internal-ai/runtime-data/*`;
  - fallback locale esplicito nel clone se l'adapter non e acceso o non risponde.
- Cosa salva davvero lato server:
  - repository artifact/sessioni/richieste/audit IA in `analysis_artifacts.json`;
  - memoria operativa e tracking IA in `ai_operational_memory.json`;
  - traceability minima di letture/scritture IA in `ai_traceability_log.json`.
- Impatto sul runtime clone:
  - `NextInternalAiPage.tsx` tenta una hydration iniziale via `internalAiServerPersistenceBridge`;
  - `internalAiMockRepository` e `internalAiTracking` fanno mirror mock-safe verso l'adapter server-side dedicato;
  - nessuna route `/next` dipende in modo bloccante dall'adapter: se il server non e disponibile, il clone resta navigabile con persistenza locale di fallback.
- Cosa non cambia:
  - nessun provider reale o segreto;
  - nessuna scrittura Firestore/Storage business;
  - nessun backend legacy reso canonico;
  - nessun retrieval server-side reale di repo, Firestore o Storage business ancora attivo.
- Cosa resta ancora solo frontend/mock locale o in-process:
  - lookup/autosuggest di supporto al clone;
  - reader preview/chat ancora eseguiti sugli stessi layer clone-safe gia presenti;
  - persistenza locale di fallback del clone, che resta attiva come rete di sicurezza.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiServerPersistenceClient.ts src/next/internal-ai/internalAiServerPersistenceBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK;
  - smoke test adapter `health/read/write` via import Node locale -> OK;
  - `npm run build` -> OK.

## 5.30 Aggiornamento 2026-03-22 - Primo retrieval server-side read-only della nuova IA interna
- Il clone `/next/ia/interna*` usa ora anche un primo retrieval server-side controllato del backend IA separato.
- Perimetro attivo nel runtime clone:
  - solo contesto mezzo `D01/@mezzi_aziendali`;
  - solo snapshot read-only seedato dal clone;
  - sola capability `libretto-preview` sul nuovo retrieval;
  - fallback locale esplicito se l'adapter o lo snapshot non sono disponibili.
- Flusso runtime ora attivo per il libretto:
  - `NextInternalAiPage.tsx`;
  - bridge frontend `internalAiLibrettoPreviewBridge`;
  - client HTTP `internalAiServerRetrievalClient`;
  - adapter `backend/internal-ai/server/internal-ai-adapter.js` sul path `/internal-ai-backend/retrieval/read`;
  - snapshot locale `backend/internal-ai/runtime-data/fleet_readonly_snapshot.json`;
  - builder preview `internalAiLibrettoPreviewFacade`.
- Cosa legge davvero il retrieval server-side:
  - campi mezzo gia normalizzati del clone;
  - disponibilita `librettoUrl` e `librettoStoragePath`;
  - limitazioni dei layer clone-safe gia esistenti.
- Cosa non cambia:
  - nessuna lettura diretta Firestore/Storage business lato server;
  - nessun provider reale o segreto;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Cosa resta ancora solo frontend/mock locale o in-process:
  - report targa, report autista, report combinato, documenti preview, analisi economica preview, preventivi preview e chat continuano sui ponti mock-safe gia aperti;
  - lookup/autosuggest di supporto restano frontend/in-process.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - smoke test adapter `retrieval.read` via Node locale su porta dedicata `4311` -> OK;
  - `npm run build` -> OK.

## 5.31 Aggiornamento 2026-03-22 - Primo provider reale server-side + workflow preview/approval/rollback IA
- Il clone `/next/ia/interna*` apre ora il primo punto di aggancio a un provider reale lato server, ma solo su un workflow controllato e reversibile.
- Provider/canale scelti nel repo:
  - `OpenAI` lato server;
  - `Responses API`;
  - modello di default `gpt-5-mini`, configurabile via `INTERNAL_AI_OPENAI_MODEL`;
  - segreto solo server-side tramite `OPENAI_API_KEY`;
  - adapter canonico `backend/internal-ai/server/internal-ai-adapter.js`, separato da `functions/*`, `api/*` e `server.js`.
- Caso d'uso iniziale nel clone:
  - sintesi guidata del report attivo gia letto nel clone;
  - trigger UI minimo dentro `NextInternalAiPage.tsx`;
  - nessuna nuova scrittura business e nessuna applicazione automatica.
- Flusso runtime ora previsto:
  - report attivo nel clone;
  - client `internalAiServerReportSummaryClient`;
  - `POST /internal-ai-backend/artifacts/preview` per la preview;
  - `POST /internal-ai-backend/approvals/prepare` per approvazione, rifiuto e rollback;
  - persistenza IA dedicata in `backend/internal-ai/runtime-data/ai_preview_workflows.json`.
- Cosa viene salvato davvero lato server:
  - testo della preview generata;
  - contesto report strutturato usato come input;
  - stati `preview_ready`, `approved`, `rejected`, `rolled_back`;
  - traceability minima delle operazioni.
- Cosa non cambia:
  - nessuna scrittura Firestore/Storage business automatica;
  - nessun backend legacy reso canonico;
  - nessun segreto lato client;
  - chat reale, OCR, upload, parsing documentale e applicazioni business restano fuori perimetro.
- Stato reale del runner corrente:
  - `OPENAI_API_KEY` manca nel runner locale, quindi la chiamata reale al provider non e dimostrata end-to-end in questa sessione;
  - il clone mostra comunque il workflow e mantiene fallback/mock-safe quando il provider non e disponibile;
  - approval e rollback server-side sono stati verificati sul contenitore IA dedicato, senza toccare dati business.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - smoke test `GET /internal-ai-backend/health` -> OK;
  - smoke test `POST /internal-ai-backend/artifacts/preview` con esito `provider_not_configured` senza segreto -> OK;
  - smoke test `approve_preview` + `rollback_preview` su workflow IA dedicato -> OK;
  - `npm run build` -> OK.

## 5.32 Aggiornamento 2026-03-22 - OpenAI attivato davvero nel backend IA della NEXT
- Il backend IA separato della NEXT e ora verificato anche con chiamata reale a OpenAI, senza allargare i casi d'uso gia aperti.
- Dove e come viene letta davvero la chiave:
  - solo in `backend/internal-ai/server/internal-ai-adapter.js`;
  - solo da `process.env.OPENAI_API_KEY`;
  - mai dal client e mai dal codice sorgente versionato.
- Esito reale del flusso end-to-end:
  - processo server-side dedicato avviato su porta `4311`;
  - `health` -> `providerEnabled: true`, modello `gpt-5-mini`;
  - `artifacts.preview` -> preview reale generata e salvata nel contenitore IA dedicato;
  - `approve_preview` -> stato `approved`;
  - `reject_preview` -> stato `rejected`;
  - `rollback_preview` -> stato `rolled_back` su workflow approvato.
- Cosa non cambia:
  - il caso d'uso resta solo la sintesi guidata del report gia letto;
  - nessuna scrittura Firestore/Storage business automatica;
  - nessun backend legacy reso canonico;
  - fallback mock-safe invariato se il processo non eredita la variabile o il provider fallisce.
- Nota operativa:
  - nel runner corrente `OPENAI_API_KEY` e presente a livello utente Windows, ma la shell puo non ereditarla automaticamente;
  - per questo task la variabile e stata propagata solo al processo server-side dedicato, senza modificare codice o client.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerReportSummaryClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK;
  - smoke test reale `health` + `artifacts.preview` + `approve_preview` + `reject_preview` + `rollback_preview` su porta `4311` -> OK;
  - `npm run build` -> OK.

## 5.33 Aggiornamento 2026-03-22 - Chat reale controllata + primo repo/UI understanding nel clone IA
- Il clone `/next/ia/interna*` usa ora anche la chat reale server-side controllata del backend IA separato e mostra un primo pannello di comprensione controllata di repository e UI.
- Ponte scelto nel runtime clone:
  - `NextInternalAiPage.tsx`;
  - `internalAiChatOrchestratorBridge` + `internalAiServerChatClient`;
  - `POST /internal-ai-backend/orchestrator/chat`;
  - provider `OpenAI Responses API` solo server-side;
  - fallback locale clone-safe se adapter o provider non sono disponibili.
- Primo livello repo/UI understanding nel clone:
  - `internalAiServerRepoUnderstandingClient`;
  - `POST /internal-ai-backend/retrieval/read`;
  - operazione `read_repo_understanding_snapshot`;
  - pannello overview dedicato che espone fonti, route rappresentative, pattern UI, relazioni tra schermate e limiti del perimetro.
- Cosa legge davvero lato server questo nuovo livello:
  - documenti architetturali/stato chiave del repo;
  - macro-aree e route rappresentative della NEXT;
  - pattern UI rappresentativi;
  - relazioni principali tra schermate;
  - file sorgente rappresentativi della UI.
- Cosa non cambia:
  - nessuna scrittura Firestore/Storage business;
  - nessun segreto lato client;
  - nessun backend legacy reso canonico;
  - nessuna patch automatica del repository;
  - fallback locale esplicito sempre disponibile lato clone.
- Stato reale verificato:
  - senza `OPENAI_API_KEY` nel processo server-side, `orchestrator.chat` risponde `provider_not_configured` e il clone resta sul fallback locale;
  - con `OPENAI_API_KEY` propagata al solo processo server-side, `health` risponde `providerEnabled: true`;
  - `retrieval.read(read_repo_understanding_snapshot)` -> snapshot repo/UI curata costruita e letta correttamente;
  - `orchestrator.chat` repo/UI-aware -> risposta reale del provider con `usedRealProvider: true`;
  - `orchestrator.chat` con `reportContext` -> risposta reale del provider con `usedRealProvider: true`.
- Cosa resta ancora solo frontend/mock locale o fuori perimetro:
  - lookup/autosuggest e supporti minori;
  - qualunque modifica codice automatica;
  - retrieval completo di tutti i dati business lato server;
  - writer business o automazioni operative.
- Verifiche del task:
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiServerChatClient.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - smoke test adapter `retrieval.read` + `orchestrator.chat` senza segreto nel processo server-side -> OK;
  - smoke test reale `health` + `retrieval.read(read_repo_understanding_snapshot)` + `orchestrator.chat` repo/UI-aware + `orchestrator.chat` con `reportContext` su processo server-side dedicato con `OPENAI_API_KEY` -> OK;
  - `npm run build` -> OK.

## 5.34 Aggiornamento 2026-03-22 - Repo understanding esteso + audit readiness Firebase nel clone IA
- Il clone `/next/ia/interna*` mostra ora un pannello di comprensione repository piu ricco e verificato, senza aprire accessi business pericolosi.
- Estensione concreta aperta nel backend IA separato:
  - la snapshot `read_repo_understanding_snapshot` include ora anche un indice filesystem controllato di file sotto `src/next`, `src/pages`, `src/components` e `backend/internal-ai`;
  - vengono esposte anche relazioni CSS importate, relazioni curate madre vs NEXT e un audit di readiness per Firestore/Storage read-only lato server.
- Cosa legge davvero lato server questo ampliamento:
  - documenti architetturali/stato chiave;
  - macro-aree, route rappresentative e pattern UI;
  - file di codice e CSS collegati nel perimetro controllato;
  - segnali reali del repo su Firebase client, runtime legacy con `firebase-admin`, assenza di `firestore.rules` e stato di `storage.rules`.
- Cosa NON apre ancora:
  - nessuna lettura diretta Firestore business lato server;
  - nessuna lettura diretta Storage business lato server;
  - nessuna modifica della madre;
  - nessuna patch automatica del repository.
- Cosa chiarisce ora il clone:
  - dove la nuova IA puo gia leggere in modo utile codice, route-like file, componenti e CSS;
  - dove finisce il perimetro NEXT e dove inizia la madre legacy;
  - quali prerequisiti mancano prima di aprire davvero Firestore/Storage read-only lato server nel backend IA separato.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - smoke test `buildRepoUnderstandingSnapshot()` -> OK;
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` su porta `4316` -> OK;
  - `npm run build` -> OK.

## 5.35 Aggiornamento 2026-03-22 - Chat conversazionale controllata + report in modale documento
- La overview `/next/ia/interna` e ora molto piu vicina a una chat reale e leggibile, senza perdere guard rail, traceability o fallback espliciti.
- Cosa cambia nel clone:
  - input libero multilinea e thread piu naturale;
  - indicatori leggeri su backend server-side, OpenAI lato server, repo understanding e retrieval business read-only parziale;
  - richieste di report che non riversano piu il contenuto lungo in chat;
  - report pronti salvati come artifact IA e aperti in una modale di anteprima documento.
- Flusso utente ora visibile:
  - l'utente chiede un report dalla chat;
  - l'orchestrazione gia esistente produce la preview controllata;
  - la preview viene salvata nel repository artifact IA dedicato;
  - la pagina apre il documento dedicato con lettura, copia, download testo e condivisione browser se disponibile;
  - il thread conserva solo il messaggio breve di conferma e il richiamo all'artifact.
- Cosa non cambia:
  - nessuna scrittura business;
  - nessuna modifica alla madre;
  - nessun backend legacy come canale canonico;
  - nessun segreto lato client;
  - fallback locale esplicito mantenuto.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK;
  - `npm run build` -> OK.

## 5.36 Aggiornamento 2026-03-22 - Readiness Firebase read-only piu precisa nel clone IA
- Il clone `/next/ia/interna` non dichiara piu soltanto uno stato generico di readiness Firebase: mostra ora prerequisiti condivisi e whitelist candidate per un futuro bridge server-side read-only del backend IA separato.
- Cosa e stato aperto davvero:
  - la snapshot repo/UI del backend IA separato include ora:
    - requisiti condivisi verificati (`package` dedicato, `firebase-admin`, credenziali server-side, regole versionate);
    - whitelist candidate ma NON attive per Firestore e Storage;
    - blocchi reali che impediscono oggi l'apertura sicura del bridge business read-only;
  - la UI clone espone queste informazioni in italiano senza simulare un accesso gia attivo.
- Whitelist candidate dichiarate:
  - Firestore: solo documento `storage/@mezzi_aziendali`;
  - Storage: solo oggetto del bucket `gestionemanutenzione-934ef.firebasestorage.app` ricavato dal valore esatto di `librettoStoragePath` su un mezzo gia whitelisted;
  - restano fuori query libere, scansione collection, `listAll`, prefix scan, upload e delete.
- Cosa NON apre ancora:
  - nessuna lettura diretta Firestore business lato server;
  - nessuna lettura diretta Storage business lato server;
  - nessuna modifica della madre;
  - nessun uso del runtime legacy come backend canonico della nuova IA.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK;
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK;
  - smoke test `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK;
  - `npm run build` -> OK.

## 5.37 Aggiornamento 2026-03-22 - Report IA in anteprima PDF reale + governance package backend IA
- Il clone `/next/ia/interna` separa ora in modo piu netto chat e documento: quando l'utente chiede un report strutturato, la chat conserva solo la conferma breve e la modale apre una vera anteprima PDF generata dal perimetro IA.
- Flusso report ora visibile nel clone:
  - richiesta report dalla chat controllata;
  - salvataggio dell'artifact IA dedicato;
  - apertura della modale con PDF reale generato al volo dall'artifact;
  - copia del contenuto strutturato, download PDF e condivisione browser se supportata.
- Cosa NON cambia:
  - nessuna scrittura business;
  - nessuna modifica della madre;
  - nessun uso del legacy come backend canonico;
  - nessuna persistenza server-side del binario PDF come artifact separato.
- Sul fronte backend IA separato e readiness:
  - esiste ora `backend/internal-ai/package.json` come package dedicato del perimetro server-side IA;
  - la readiness Firebase/Storage continua a dichiarare il bridge business read-only come NON attivo;
  - restano bloccanti reali `firebase-admin` non ancora governato dal package dedicato, credenziale server-side separata, `firestore.rules` assente e `storage.rules` in conflitto.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiReportPdf.ts backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK;
  - `npm run build` -> OK.

## 5.38 Aggiornamento 2026-03-22 - Osservatore runtime NEXT passivo + guida integrazione UI/file
- Il clone `/next/ia/interna` non si limita piu a una snapshot repo/UI statica: puo ora leggere anche una prima osservazione runtime reale e controllata della NEXT, con screenshot e DOM snapshot passivo delle schermate principali.
- Cosa apre davvero nel runtime clone:
  - script `npm run internal-ai:observe-next` che usa Playwright solo in modalita passiva e solo su route `/next/*` whitelistate;
  - persistenza IA dedicata di `next_runtime_observer_snapshot.json` e screenshot locali in `backend/internal-ai/runtime-data/next-runtime-observer/`;
  - pannello `Comprensione controllata repo e UI` esteso con:
    - stato osservatore runtime;
    - schermate realmente coperte;
    - screenshot riapribili dal backend IA separato;
    - consigliatore di integrazione che indica modulo, superficie UI e file candidati.
- Copertura runtime verificata nel clone:
  - osservate con screenshot: `/next`, `/next/centro-controllo`, `/next/gestione-operativa`, `/next/mezzi`, `/next/dossiermezzi`, `/next/ia`, `/next/ia/interna`, `/next/acquisti`, `/next/autisti-inbox`, `/next/autisti-admin`, `/next/cisterna`;
  - restano parziali/non osservate in automatico le route dinamiche `Dossier mezzo` e `Analisi Economica`, perche il crawl non forza click o stati potenzialmente distruttivi.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun bridge Firestore/Storage business live;
  - nessun riuso del runtime legacy come backend canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK;
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npm run internal-ai:observe-next` -> OK;
  - smoke test adapter `read_repo_understanding_snapshot` + asset screenshot -> OK;
  - `npm run build` -> OK.

## 5.40 Aggiornamento 2026-03-22 - Deep runtime observer NEXT + selettore formato output IA
- Il clone `/next/ia/interna` usa ora una comprensione runtime piu profonda della NEXT, sempre read-only e senza toccare la madre, insieme a una scelta piu intelligente del formato di output della risposta.
- Cosa apre davvero:
  - observer runtime NEXT esteso a:
    - 19 route reali osservate;
    - 23 screenshot runtime;
    - 4 stati whitelist-safe osservati su `Acquisti`;
    - route dinamiche mezzo-centriche risolte:
      - `/next/dossier/:targa`;
      - `/next/analisi-economica/:targa`;
      - `/next/dossier/:targa/gomme`;
      - `/next/dossier/:targa/rifornimenti`;
    - sottoroute `IA interna` osservate direttamente:
      - `/next/ia/interna/sessioni`;
      - `/next/ia/interna/richieste`;
      - `/next/ia/interna/artifacts`;
      - `/next/ia/interna/audit`;
  - selettore formato output per la chat IA:
    - `chat_brief`;
    - `chat_structured`;
    - `report_pdf`;
    - `ui_integration_proposal`;
    - `next_integration_confirmation_required`;
  - guida integrazione UI/flow/file piu motivata nella pagina IA, con superficie primaria, alternative, confidenza, evidenze runtime e anti-pattern.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun click distruttivo, submit o upload runtime;
  - nessun bridge Firestore/Storage business live;
  - nessun backend legacy reso canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK;
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npm run internal-ai:observe-next` -> OK;
  - rebuild snapshot repo/UI server-side -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npm run build` -> OK.

## 5.39 Aggiornamento 2026-03-22 - Primo hook mezzo-centrico governato su Dossier Mezzo
- Il clone `/next/ia/interna` usa ora un primo hook mezzo-centrico governato che prende come nodo principale il `Dossier Mezzo` e traduce il linguaggio libero verso capability dichiarate, senza leggere la UI come fonte primaria e senza aprire retrieval Firebase live largo.
- Cosa apre davvero:
  - catalogo capability mezzo-centrico con:
    - stato sintetico Dossier mezzo;
    - preview documenti collegabili al mezzo;
    - riepilogo costi mezzo;
    - preview libretto mezzo;
    - preview preventivi collegabili al mezzo;
    - report mezzo PDF in anteprima;
  - planner `prompt -> capability -> filtri/metriche/groupBy/output`, riusato dalla chat controllata;
  - hook read-only che usa come fonti:
    - `D01` anagrafiche flotta;
    - composito `readNextDossierMezzoCompositeSnapshot`;
    - layer `D07-D08` documenti/costi;
    - facade clone-safe gia attivi per documenti, costi, libretto, preventivi e report mezzo.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun bridge Firestore/Storage business live aggiuntivo;
  - nessun uso del runtime legacy come backend canonico.
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts` -> OK;
  - `npm run build` -> OK.

## 5.41 Aggiornamento 2026-03-23 - Retrieval Dossier mezzo server-side clone-seeded + rifornimenti governati
- Il clone `/next/ia/interna` estende ora il primo hook mezzo-centrico con un retrieval server-side stretto e read-only sul `Dossier Mezzo`, senza aprire ancora Firebase/Storage business live.
- Cosa apre davvero:
  - nuovo snapshot `Dossier Mezzo` clone-seeded nel backend IA separato, persistita su file locale dedicato;
  - nuove operazioni server-side:
    - `seed_vehicle_dossier_snapshot`;
    - `read_vehicle_dossier_by_targa`;
  - riuso di questo retrieval per:
    - stato sintetico mezzo;
    - riepilogo costi mezzo;
    - nuova capability `riepilogo rifornimenti mezzo`;
  - copy della chat aggiornato per dichiarare meglio fonti, perimetro e fallback.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun bridge Firestore/Storage business live;
  - nessun retrieval live dedicato del verticale `Cisterna`;
  - nessun backend legacy reso canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-persistence.js` -> OK;
  - smoke test adapter locale `seed_vehicle_dossier_snapshot` + `read_vehicle_dossier_by_targa` -> OK;
  - `npx eslint src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npm run build` -> OK.

## 5.42 Aggiornamento 2026-03-23 - Ri-verifica live Firebase/Storage IA: blocco confermato e boundary futuro esplicito
- Il clone `/next/ia/interna` non apre ancora il primo bridge Firebase/Storage business live read-only: la ri-verifica `2026-03-23` conferma che il perimetro sicuro e verificabile non e ancora sufficiente per attivarlo.
- Cosa viene reso piu solido in questo task:
  - la readiness server-side del backend IA separato passa da semplice candidatura a boundary futuro piu esplicito e stretto;
  - viene codificato il solo primo perimetro futuro ammissibile:
    - Firestore `storage/@mezzi_aziendali` come documento esatto;
    - Storage `gestionemanutenzione-934ef.firebasestorage.app` solo su path esatto `librettoStoragePath`;
  - vengono dichiarati in modo piu duro i divieti:
    - niente query larghe;
    - niente scansioni collection;
    - niente `listAll` o prefix scan;
    - niente `@rifornimenti`, `@documenti_*`, `@preventivi` o path `documenti_pdf/*`, `preventivi/*`, `autisti/*` nel primo bridge live.
- Cosa NON cambia:
  - il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`;
  - nessuna modifica della madre;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Blocchi confermati:
  - `firebase-admin` non ancora governato dal package dedicato del backend IA;
  - nessuna credenziale server-side Google dimostrata nel processo corrente;
  - `firestore.rules` assente dal repo;
  - `storage.rules` versionato in conflitto con l'uso legacy.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `npx eslint backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - smoke test `buildFirebaseReadinessSnapshot()` -> OK.

## 5.43 Aggiornamento 2026-03-23 - Governance package backend IA piu seria, live ancora chiuso
- Il clone `/next/ia/interna` non apre ancora il live minimo, ma il backend IA separato governa ora in modo piu credibile il proprio perimetro server-side:
  - `backend/internal-ai/package.json` dichiara le dipendenze runtime effettive dell'adapter;
  - `backend/internal-ai/server/internal-ai-firebase-admin.js` prepara un bootstrap Firebase Admin separato e non legacy;
  - `backend/internal-ai/server/internal-ai-firebase-readiness-cli.js` rende ripetibile la verifica locale della readiness.
- Cosa NON cambia nel clone:
  - il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`;
  - nessuna modifica della madre;
  - nessuna scrittura business;
  - nessun backend legacy reso canonico.
- Blocchi residui che impediscono ancora il live:
  - il checkout locale risolve ora `firebase-admin` dal perimetro backend IA, ma questo non basta ancora ad aprire il live minimo;
  - nessuna credenziale server-side Google dedicata e verificabile nel processo corrente;
  - `firestore.rules` assente e `firebase.json` senza boundary Firestore verificabile;
  - `storage.rules` versionato ancora in conflitto con l'uso legacy reale.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-firebase-admin.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness-cli.js` -> OK;
  - `npx eslint backend/internal-ai/server/internal-ai-firebase-admin.js backend/internal-ai/server/internal-ai-firebase-readiness.js backend/internal-ai/server/internal-ai-firebase-readiness-cli.js backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK;
  - smoke test `health` adapter su porta temporanea `4317` -> `firestore: not_ready`, `storage: not_ready`, `adminRuntimeReady: true`.

## 5.44 Aggiornamento 2026-03-23 - Copertura runtime UI quasi totale verificabile della NEXT
- Il clone `/next/ia/interna` porta ora la copertura runtime della NEXT al massimo oggi verificabile in modo read-only, senza click distruttivi, senza madre e senza simulare scritture business.

## 5.44 Aggiornamento 2026-03-23 - Copertura runtime UI quasi totale verificabile della NEXT
- Il clone `/next/ia/interna` porta ora la copertura runtime della NEXT al massimo oggi verificabile in modo read-only, senza click distruttivi, senza madre e senza simulare scritture business.
- Copertura reale rigenerata con `npm run internal-ai:observe-next`:
  - catalogo observer `2026-03-23-total-ui-v1` su 53 route candidate;
  - 52 route osservate davvero;
  - 70 screenshot runtime;
  - 26 stati interni whitelist-safe tentati;
  - 18 stati interni osservati davvero:
    - 12 `tab`;
    - 2 `menu`;
    - 2 `dialog/modal`;
    - 1 `card`;
    - 1 `detail`;
  - 8 stati interni dichiarati come non osservabili oggi nel perimetro sicuro.
- Aree oggi coperte davvero nel clone read-only:
  - subtree `IA` e `IA interna`;
  - subtree `Autisti Inbox`;
  - `Autisti Admin` con tab principali;
  - `Centro di Controllo` con tab principali;
  - subtree `Cisterna` con route figlie read-only;
  - `Lavori in attesa` + dettaglio lavoro;
  - `Ordini in attesa` + dettaglio ordine;
  - schermate operative/lista come `Inventario`, `Manutenzioni`, `Materiali`, `Mezzi`, `Colleghi`, `Fornitori`, `Capo Mezzi`.
- Cosa migliora davvero anche per la nuova IA:
  - la pagina `/next/ia/interna` mostra tutte le route e tutti gli stati osservati, senza piu tagliare la lista ai primi elementi;
  - il backend chat riceve una vista runtime compatta ma completa di tutte le route osservate, insieme a `integrationGuidance`, `representativeRoutes` e `screenRelations` completi, cosi il mapping `schermata -> file/modulo/flusso` e piu concreto e meno generico.
- Limiti residui espliciti:
  - non osservata oggi la route dinamica `Acquisti` dettaglio, perche il trigger `Apri` non emerge in modo affidabile nel runtime locale;
  - restano non osservabili in modo sicuro alcuni stati interni non cosmetici:
    - `Home`: accordion rapido non visibile e modale `Vedi tutto` bloccata dal guard rail read-only del clone;
    - `Dossier dettaglio`: modale lavori e foto mezzo non visibili nel DOM del campione;
    - `Dossier rifornimenti`: filtri `MESE` e `12 mesi` non visibili in modo affidabile;
    - `Capo costi`: toggle `solo da valutare` non visibile;
    - `Acquisti`: menu ordine non visibile nel campione.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK;
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-repo-understanding.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK;
  - `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK;
  - `npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `npm run internal-ai:observe-next` -> OK (`52/53` route, `18/26` stati, `70` screenshot);
  - rebuild snapshot repo/UI server-side -> OK;
  - `npm run build` -> OK.

## 5.45 Aggiornamento 2026-03-23 - Gap runtime Prompt 59 quasi chiusi, residuo unico e guardrail-confirmed
- Il clone `/next/ia/interna` chiude con un micro-task dedicato quasi tutti i gap residui del Prompt 59 senza toccare la madre e senza forzare controlli disabilitati.
- Copertura reale aggiornata con micro-refresh dedicato:
  - catalogo observer `2026-03-23-total-ui-v2`;
  - `53/53` route osservate davvero;
  - `78` screenshot runtime;
  - `25/26` stati interni osservati davvero;
  - `1/26` stato interno dichiarato non osservabile nel perimetro sicuro.
- Chiusure reali:
  - route dinamica `Acquisti` dettaglio osservata da `/next/acquisti` tramite tab `Ordini` e trigger `Apri`;
  - `Home`: accordion rapido riconosciuto come stato gia aperto nel render iniziale;
  - `Dossier dettaglio`: modale lavori e foto mezzo osservate davvero;
  - `Dossier rifornimenti`: filtri `MESE` e `12 mesi` osservati su `TI313387`, targa con rifornimenti reali leggibili nel clone;
  - `Capo costi`: toggle `solo da valutare` osservato davvero;
  - `Acquisti`: menu ordine osservato davvero dopo step preparatorio read-only sul tab `Ordini`.
- Residuo definitivo:
  - `Home -> Vedi tutto` resta fuori copertura diretta, perche il trigger e visibile ma disabilitato dal guard rail read-only del clone.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js` -> OK;
  - `node --check scripts/internal-ai-observe-next-runtime.mjs` -> OK;
  - `node --check scripts/internal-ai-observe-next-gap59.mjs` -> OK;
  - `npx eslint backend/internal-ai/server/internal-ai-next-runtime-observer.js scripts/internal-ai-observe-next-runtime.mjs scripts/internal-ai-observe-next-gap59.mjs` -> OK;
  - `node scripts/internal-ai-observe-next-gap59.mjs` -> OK (`53/53` route, `25/26` stati, `78` screenshot).

## 5.46 Aggiornamento 2026-03-23 - Supporto credenziali server-side esteso, live minimo ancora bloccato
- Il clone `/next/ia/interna` non apre ancora il primo bridge Firestore/Storage business live read-only, ma il backend IA separato supporta ora in modo esplicito tre canali server-side per Firebase Admin:
  - `GOOGLE_APPLICATION_CREDENTIALS`;
  - `FIREBASE_SERVICE_ACCOUNT_JSON`;
  - `FIREBASE_CONFIG`.
- Verdetto reale del checkout corrente:
  - `firebase-admin` e risolvibile dal runtime del backend IA nel checkout corrente;
  - nessuno dei tre canali credenziali e presente nel processo;
  - `firestore.rules` resta assente dal repo;
  - `storage.rules` versionato resta deny-all e in conflitto con l'uso legacy;
  - `canAttemptLiveRead` resta `false`;
  - manca ancora un access layer live dedicato in `backend/internal-ai`.
- Conseguenza sul dominio:
  - nessuna integrazione live viene aperta nel `mezzo_dossier`;
  - il fallback ufficiale resta il retrieval clone-seeded gia governato;
  - nessun backend legacy diventa canale canonico.
- Verifiche del task:
  - `node --check backend/internal-ai/server/internal-ai-firebase-admin.js` -> OK;
  - `node --check backend/internal-ai/server/internal-ai-firebase-readiness.js` -> OK;
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK;
  - smoke test `probeInternalAiFirebaseAdminRuntime()` -> `modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`;
  - il checkout corrente risolve `firebase-admin` da `node_modules` root senza usare canali backend legacy.

## 5.47 Aggiornamento 2026-03-23 - Reset prodotto chat IA interna stile ChatGPT
- Il subtree `/next/ia/interna*` e stato riallineato a un prodotto unico e usabile, con una chat principale centrale stile ChatGPT invece di una dashboard tecnica dispersiva.
- Cosa e cambiato nella UI:
  - composer unico per la chat;
  - allegati IA-only nello stesso thread;
  - memoria repo/UI e runtime usate davvero nelle richieste libere quando disponibili;
  - output selector, report, modali e PDF mantenuti ma spostati in secondo piano;
  - pannelli tecnici compressi in blocchi collassabili e secondari.
- Cosa resta invariato:
  - madre intoccabile;
  - nessuna scrittura business;
  - nessun bridge Firebase/Storage live riaperto;
  - il fallback ufficiale del `mezzo_dossier` resta clone-seeded quando il live non e apribile.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Nota: il reset UX rafforza l'usabilita della pagina IA interna ma non introduce nuove capability business live.

## 5.48 Aggiornamento 2026-03-24 - V1 chat IA stretta su Home, report targa e file da toccare
- Il clone `/next/ia/interna` e stato rifinito per chiudere il valore prodotto minimo della chat interna senza allargare il perimetro:
  - `analizza la home`;
  - `fammi un report della targa X`;
  - `quali file devo toccare`.
- Cosa migliora davvero:
  - l'orchestrator locale distingue in modo piu affidabile i prompt Home e `file da toccare`, senza diluirli in intenti laterali;
  - il `report targa` resta esplicitamente sul percorso mezzo-centrico NEXT read-only, non su `Mezzo360` legacy;
  - il selettore output non tratta piu le richieste sui file come proposta di integrazione, ma le tiene in chat strutturata;
  - il thread rende meglio risposte e report con blocchi leggibili, chip sobri e suggerimenti iniziali stretti sui tre use case V1.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun backend nuovo;
  - nessuna espansione di observer/runtime/live bridge;
  - nessuna nuova capability oltre ai tre use case prioritari.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK

## 5.49 Aggiornamento 2026-03-24 - Chat IA consolidata sulla prima verticale D01 + D10 + D02
- Il clone `/next/ia/interna` e stato riallineato alla prima verticale mezzo/Home/tecnica senza aprire nuovi domini o backend:
  - `D01` anagrafica mezzo;
  - `D10` stato operativo, alert e revisioni della Home;
  - `D02` backlog lavori e manutenzioni tecniche.
- Cosa migliora davvero:
  - il catalogo capability e il planner della chat espongono solo stato mezzo e report targa come capability mezzo-centriche governate;
  - il thread dichiara in modo esplicito i limiti verso domini esterni e non prova piu a trattare rifornimenti, costi, documenti, preventivi o autisti come se fossero gia consolidati;
  - il `report targa` e lo `stato mezzo` leggono ora i reader canonici NEXT della prima verticale, invece del composito Dossier largo;
  - la pagina `/next/ia/interna` rende piu chiari i use case, i chip di contesto e i limiti del thread senza introdurre nuovi pannelli tecnici.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna espansione di infrastruttura IA;
  - nessun nuovo tipo di output oltre risposta breve, analisi strutturata, report targa e mappa file/moduli.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI

## 5.50 Aggiornamento 2026-03-24 - Chat IA dominio-first con prudenza fuori verticale
- Il clone `/next/ia/interna` classifica ora le richieste per domini canonici del gestionale invece di trattarle come insieme sparso di schermate o capability isolate.
- Comportamento verificato:
  - la prima verticale `D01 + D10 + D02` resta la sola area forte della chat;
  - i domini `D03`, `D04`, `D05`, `D06`, `D07`, `D08`, `D09` non vengono resi deep-operativi, ma vengono riconosciuti e restituiscono una risposta prudente con dominio, file/moduli, capability oggi disponibili, limiti e prossimo passo corretto;
  - il thread mostra ora in modo sobrio dominio riconosciuto, livello di affidabilita e tipo di output usato.
- Perimetro tecnico della patch:
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`
  - `src/next/internal-ai/internalAiOutputSelector.ts`
  - `src/next/NextInternalAiPage.tsx`
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna espansione infrastrutturale IA;
  - nessun nuovo tipo di output oltre a risposta breve, analisi strutturata, report/PDF e file/moduli gia esistenti.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI

## 5.51 Aggiornamento 2026-03-24 - Capability canonica `stato_operativo_mezzo`
- Il clone `/next/ia/interna` ha ora un percorso principale piccolo e canonico per richieste di stato mezzo/targa.
- Comportamento verificato:
  - il routing priorizza `stato_operativo_mezzo` per richieste come `dimmi lo stato del mezzo`, `come sta oggi la targa`, `che problemi/alert/lavori ha questa targa`;
  - la capability compone solo tre reader canonici NEXT: `D01` anagrafica flotta, `D10` stato operativo cockpit, `D02` backlog tecnico;
  - l'output resta nel thread come `chat_structured` sobrio e leggibile;
  - il `report targa` resta separato e secondario come capability PDF/preview.
- Cosa NON cambia:
  - nessun uso di `Mezzo360`, `Home` legacy, `CentroControllo` legacy o Dossier largo come fonte canonica primaria;
  - nessuna riapertura dei domini `D03-D09`;
  - nessuna modifica alla madre o nuovi backend live.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts` -> OK

## 5.52 Aggiornamento 2026-03-24 - Unified Intelligence Engine e console unica
- Il clone `/next/ia/interna` usa ora un motore unificato read-only che legge e intreccia le fonti mappate nel documento canonico dati, senza toccare la madre.
- Componenti verificati:
  - `src/next/domain/nextUnifiedReadRegistryDomain.ts` introduce adapter read-only prudente per documenti `storage`, collection Firestore, prefix Storage e chiavi `localStorage` isolate;
  - `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` costruisce il Global Read Registry, applica linking entita per chiavi strutturali e genera una query unificata capace di produrre `chat_structured`, report, modale e PDF riusando i renderer gia presenti;
  - `src/next/NextInternalAiPage.tsx` espone una console unica con barra richiesta, filtri sobri per targa/ambiti/output e stato sintetico del registry, mantenendo il thread come centro dell'esperienza;
  - `src/next/internal-ai/internalAiChatOrchestrator.ts`, `internalAiChatOrchestratorBridge.ts` e `internalAiOutputSelector.ts` instradano ora il motore unificato senza perdere gli artifact o far ricadere il risultato su classificazioni tecniche come focus primario.
- Copertura e limiti:
  - le fonti con reader NEXT pulito vengono lette tramite reader canonici;
  - le fonti sporche, `tmp` o senza reader dedicato entrano comunque nel registry tramite adapter read-only prudente, con note e limiti espliciti;
  - la configurazione `@impostazioni_app/gemini` resta solo censita e guardata, non letta lato client;
  - la persistenza risultati continua a riusare il repository artifact gia esistente del sottosistema IA, senza nuove scritture business.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/domain/nextUnifiedReadRegistryDomain.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> OK
  - `npm run build` -> OK

## 5.53 Aggiornamento 2026-03-24 - Report unificato professionale e PDF aziendale
- Il clone `/next/ia/interna` mostra ora i report targa del motore unificato come report gestionali veri, senza rimettere al centro note tecniche o dettagli da sviluppatore.
- Componenti verificati:
  - `src/next/internal-ai/internalAiProfessionalVehicleReport.ts` costruisce un layer di presentazione professionale read-only che arricchisce il report con foto mezzo, configurazione collegata motrice/rimorchio/centina e blocco gomme;
  - `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx` rende in UI il report professionale con header aziendale, sintesi esecutiva, dati mezzo, foto reale, grafica gomme e appendice tecnica secondaria;
  - `src/next/internal-ai/internalAiReportPdf.ts` instrada i report targa verso il PDF professionale e mantiene il fallback legacy per report non targa;
  - `src/utils/pdfEngine.ts` espone ora un builder branded per i report operativi IA, riusando il logo e il layout ufficiali del progetto;
  - `src/next/NextInternalAiPage.tsx` sostituisce il vecchio dump tecnico del report con il nuovo renderer gestionale e chiarisce le CTA `Apri report professionale` e `Genera PDF`.
- Copertura e limiti:
  - il report mostra la foto reale del mezzo solo se `fotoUrl` o `fotoStoragePath` sono davvero risolvibili;
  - la configurazione collegata viene mostrata solo quando una sessione `D10` collega in modo prudente la targa a motrice/rimorchio e la relativa anagrafica `D01` e leggibile;
  - il report gomme usa la stessa grafica del modale gomme esistente tramite `TruckGommeSvg` e `wheelGeom`, ma asse/lato restano `da verificare` quando il dato legacy non e dimostrabile;
  - le note tecniche, limiti e fonti restano in appendice secondaria e non dominano il corpo principale.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts` -> OK
  - `npm run build` -> OK
  - `npx eslint src/utils/pdfEngine.ts` -> NON VERDE per debito lint storico gia presente nel file, non introdotto da questa patch

## 5.54 Aggiornamento 2026-03-24 - Pulizia UI della console IA NEXT
- Il clone `/next/ia/interna` e stato ripulito lato UI/usabilita senza riaprire il motore unificato o la logica dati.
- Cosa migliora davvero:
  - la chat e ora chiaramente la parte centrale e dominante della pagina;
  - la colonna destra mette in evidenza i report richiesti/salvati raggruppati per targa quando il legame e presente;
  - le richieste rapide sono entrate in un menu a tendina compatto invece di occupare spazio con chip ripetuti;
  - il campo principale usa solo la label `Targa` e mostra subito autosuggest progressivo dalle targhe reali gia lette dal catalogo NEXT;
  - il rumore UI viene declassato in una sezione avanzata collassata, evitando contatori, scaffolding tecnico e pannelli diagnostici in primo piano.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun backend live nuovo;
  - nessun refactor del motore unificato oltre al wiring minimo del layer visivo.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK

## 5.55 Aggiornamento 2026-03-24 - Rifinitura UI console IA e gerarchia report/PDF
- Il clone `/next/ia/interna` e stato ulteriormente ripulito nel primo piano visivo, con interventi limitati a UI pagina, renderer report professionale e PDF.
- Cosa migliora davvero:
  - la testata superiore e ora minima e non mette piu al centro `Panoramica` o chip rumorosi;
  - `Richieste rapide` sta dentro il composer, vicino a `Targa` e `Output`, invece di occupare spazio sopra la chat;
  - i filtri rapidi hanno ora una logica visiva chiara: neutri da spenti, evidenziati da attivi;
  - la ricerca avanzata e i blocchi tecnici spariscono dal primo piano della pagina;
  - il report professionale mostra in alto identita mezzo a sinistra e foto a destra, con sezioni piu leggibili;
  - il PDF targa segue la stessa gerarchia, con blocco mezzo in apertura e titoli di sezione piu distinti.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun backend live nuovo;
  - nessun refactor del motore unificato o dei reader.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx` -> OK
  - `npx eslint src/utils/pdfEngine.ts` -> NON OK per debito lint storico gia presente nel file condiviso
  - `npm run build` -> OK

## 5.56 Aggiornamento 2026-03-24 - Rifinitura finale overview IA, PDF utente e blocco gomme
- L'overview di `/next/ia/interna` e stata ulteriormente semplificata senza toccare il motore unificato: nel primo piano restano di fatto stream chat, composer con filtri rapidi e colonna destra report.
- Cosa cambia davvero:
  - il hero `Console IA`, il testo introduttivo, i link `Archivio report` / `Tecnico` e il messaggio iniziale statico dell'assistente non dominano piu l'overview;
  - la colonna destra mostra solo `Report corrente` e `Report per targa`, senza strumenti tecnici aggiuntivi;
  - il report professionale standard in UI non mostra piu appendice tecnica, fonti considerate o note da sviluppatore;
  - il PDF utente standard non genera piu sezioni tecniche finali, mantenendo solo header, blocco mezzo, sintesi e sezioni operative;
  - il report gomme esplicita correttamente il coinvolgimento `asse intero` e non usa piu `lato da verificare` quando l'evento identifica l'asse completo.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessun backend live nuovo;
  - nessuna scrittura business;
  - nessun refactor del registry, entity linker o motore unificato.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiProfessionalVehicleReport.ts` -> OK
  - `npm run build` -> OK
  - `npx eslint src/utils/pdfEngine.ts` -> NON OK per debito lint storico preesistente

## 5.57 Aggiornamento 2026-03-24 - Pulizia finale del primo piano chat IA
- Il clone `/next/ia/interna` e stato ulteriormente ripulito nel solo primo piano della colonna centrale, senza toccare motore unificato, reader o backend.
- Cosa cambia davvero:
  - la chat non precarica piu un messaggio di benvenuto o riassunti automatici all'apertura;
  - se non esiste una conversazione in corso, il centro mostra solo un placeholder minimo e il composer;
  - il corpo centrale non ripresenta automaticamente ultima richiesta o ultimo report come blocchi statici;
  - lo stato del lookup targa compare solo quando l'utente inizia davvero a lavorare sulla targa;
  - la colonna destra resta invariata nel concetto: `Report corrente` e `Report per targa`.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun backend live nuovo;
  - nessun refactor del motore unificato o dei reader.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx` -> OK
  - `npm run build` -> OK

## 5.58 Aggiornamento 2026-03-24 - Planner gestionale sopra il motore unificato
- La console `/next/ia/interna` usa ora il motore unificato come cervello gestionale read-only e non piu come semplice classificazione prudente della prima verticale.
- Cosa cambia davvero:
  - il request understanding riconosce intento business, targa/entita, metriche, periodo e focus finale (`thread`, `report`, `PDF`, `classifica`);
  - le richieste specifiche non vengono piu allargate automaticamente a `stato mezzo` generale: rifornimenti restano rifornimenti, criticita restano criticita, scadenze restano scadenze;
  - le richieste flotte senza targa lavorano ora davvero su `D10 + D02` per priorita, attenzione oggi, collaudi e pre-collaudi;
  - i rifornimenti usano calcoli deterministici su litri, km analizzati, `km/l`, `l/100km` e anomalie record;
  - il quadro completo mezzo viene composto solo quando richiesto in modo esplicito;
  - il report/PDF riusa il renderer gia esistente e lo apre solo quando la richiesta chiede davvero un artifact.
- Correzioni strutturali incluse:
  - i filtri console vuoti non passano piu `Targa: -` al parser come se fosse una targa reale;
  - il riconoscimento prompt `creami un report ...` entra ora correttamente nel ramo report/PDF;
  - fonti, dataset e reader non dominano piu il testo principale della risposta.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun refactor del registry o del renderer PDF oltre al wiring minimo gia presente;
  - nessun backend live nuovo.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - report rifornimenti `TI233827` -> apre `Report PDF`
    - attenzione oggi / mezzo piu critico / collaudi-precollaudi -> thread strutturato multi-mezzo
    - quadro completo `TI233827` -> thread strutturato multi-dominio
    - anomalie rifornimenti `TI233827` -> thread focalizzato solo su D04

## 5.59 Aggiornamento 2026-03-25 - Affidabilita rifornimenti per periodo e report/PDF piu trasparenti
- Il punto piu critico emerso sulla console IA NEXT e stato chiuso nel layer sopra il motore unificato: una richiesta con periodo esplicito sui rifornimenti non ricade piu sullo storico completo.
- Cosa cambia davvero:
  - il parsing periodo riconosce ora anche `questo mese`, `oggi`, `questa settimana`, `prossimi 30 giorni`, mesi espliciti come `marzo 2026` e intervalli `dal X al Y`;
  - se il prompt contiene un periodo esplicito ma il parser non lo capisce in modo affidabile, il report viene fermato invece di cadere sullo storico completo;
  - i rifornimenti del periodo vengono validati con regole esplicite: targa coerente, data verificabile, litri validi, km presenti e progressivi, duplicati esclusi;
  - chat e report/PDF usano ora la stessa base validata, con conteggi separati per record trovati, inclusi nel calcolo ed esclusi;
  - il report professionale e il PDF mostrano in modo piu leggibile `Sintesi iniziale`, `Record del periodo`, `Anomalie`, `Azione consigliata` e `Limiti e verifiche`.
- Correzioni strutturali incluse:
  - una richiesta rifornimenti con hint console `Quadro completo` non viene piu promossa automaticamente a `overview mezzo` se il testo utente chiede in modo esplicito un report fuel;
  - il composer chat per i report mostra ora anche KPI leggibili (`trovati`, `inclusi`, `esclusi`, `media km/l`) invece del solo messaggio generico `report pronto`;
  - il PDF operativo riusa il renderer esistente ma aggiunge in fondo `Limiti e verifiche` e `Note di lettura`, senza riaprire refactor larghi su `pdfEngine.ts`.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun nuovo backend live;
  - il debito lint storico di `src/utils/pdfEngine.ts` resta fuori scopo.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/NextInternalAiPage.tsx src/utils/pdfEngine.ts` -> KO solo per debito lint storico gia presente in `src/utils/pdfEngine.ts`
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - prompt A `questo mese + km/l + genera pdf` -> periodo marzo 2026 rispettato, report rifornimenti focalizzato, anteprima PDF aperta
    - prompt B `marzo 2026 + report rifornimenti` -> periodo marzo 2026 rispettato, report rifornimenti focalizzato
    - prompt C `anomalie rifornimenti marzo 2026` -> thread con record esclusi e motivi espliciti
    - prompt D `prossimi 30 giorni collaudo/pre-collaudo` -> periodo futuro applicato e classifica mezzi restituita

## 5.60 Aggiornamento 2026-03-25 - Planner multi-dominio e regressione prompt reali
- La console `/next/ia/interna` rafforza ora il planner sopra il motore unificato per capire richieste ampie, trasversali e orientate ad azione senza restringerle o allargarle male.
- Cosa cambia davvero:
  - il request understanding riconosce meglio `top-N`, `priorita`, `classifica`, `azione consigliata`, `quale mezzo controllare per primo` e gli incroci espressi con formule come `incrociando`;
  - le precedenze intenti evitano che una richiesta ampia su attenzione operativa collassi su solo `scadenze/collaudi`, mentre le richieste specifiche restano nel loro ramo (`fuel report`, `collaudi/pre-collaudi`, `quadro completo`);
  - il planner tratta `fleet_attention` come caso multi-dominio sopra `D10 + D02`, mantenendo esplicito il focus `classifica priorita` anche quando il prompt chiede top-3 o ordinamento;
  - il composer flotte aggiunge output piu leggibili su `Priorita mezzi`, `Cosa pesa di piu` e `Azione consigliata`, con limite coerente sul numero di mezzi richiesti;
  - i prompt suggeriti in pagina e le capability keywords riflettono ora i quattro prompt bussola reali usati in regressione.
- Correzioni strutturali incluse:
  - il prompt `Dimmi quali sono oggi i 3 mezzi che richiedono piu attenzione...` non ricade piu nel ramo solo `scadenze`, ma entra nel planner `classifica priorita` multi-mezzo;
  - il prompt `prossimi 30 giorni + collaudo/pre-collaudo + priorita` resta focalizzato sul perimetro scadenze/collaudi, senza essere allargato a overview generali;
  - il prompt `quadro completo` continua ad aprire una overview utile solo quando richiesta in modo esplicito;
  - il prompt fuel con `genera pdf` resta `fuel-first` e non viene deviato dal hint console `Quadro completo`.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun refactor del dominio rifornimenti o del renderer PDF;
  - nessun backend live nuovo.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - prompt 1 `questo mese + km/l + genera pdf` -> `Report PDF` fuel-first su `D04`
    - prompt 2 `oggi + top 3 + incrocio multi-dominio` -> `classifica priorita` su `D10 + D02`
    - prompt 3 `prossimi 30 giorni + collaudo/pre-collaudo + priorita` -> thread strutturato focalizzato su scadenze/collaudi
    - prompt 4 `quadro completo TI233827` -> analisi strutturata multi-dominio utile alla decisione

## 5.61 Aggiornamento 2026-03-25 - Affidabilita D04 e modello unico di fiducia
- La console `/next/ia/interna` espone ora un modello unico di fiducia per i report rifornimenti e lo propaga in modo coerente su chat, report professionale, modale e PDF.
- Cosa cambia davvero:
  - il layer `src/next/domain/nextRifornimentiDomain.ts` espone ora una classificazione sorgente per i record D04, distinguendo `canonico` e `ricostruito` con una ragione sintetica;
  - il motore IA arricchisce ogni report rifornimenti con classificazione di calcolo `canonico`, `ricostruito`, `baseline` o `escluso`, piu motivo esplicito quando il record non entra nel calcolo;
  - il concetto di fiducia non e piu unico e opaco: vengono separati `affidabilita sorgente`, `affidabilita filtro`, `affidabilita calcolo` e `verdetto finale`;
  - il thread chat, la vista professionale e il report PDF mostrano lo stesso verdetto finale e la stessa base dati verificata, senza combinazioni incoerenti tra testo `prudente` e badge `affidabile`;
  - i casi D04 nel thread usano ora etichette piu corrette lato UX (`Rifornimenti`) anche quando passano dal ramo `mezzo_dossier`.
- Correzioni strutturali incluse:
  - il caso canonico `TI233827` per marzo 2026 mantiene il periodo `01/03/2026 - 31/03/2026`, intercetta il record anomalo del `17/03/2026` e lo esclude per `km non progressivi`;
  - chat e modal/report mostrano allineati `7 trovati`, `5 inclusi`, `2 esclusi`, `Media km/l 2,97` e il verdetto `Prudente`;
  - la sezione `Affidabilita del dato` entra nel report professionale come blocco stabile, con dettaglio su classificazione record e livelli di fiducia.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun refactor largo del planner multi-dominio o del renderer PDF;
  - nessuna promozione artificiale dei record ricostruiti a dato certo.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/NextInternalAiPage.tsx src/next/domain/nextRifornimentiDomain.ts` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - caso canonico `questo mese + km/l + genera pdf` -> `Affidabilita: Prudente`, conteggi coerenti, anomalia `17/03/2026` esclusa, modale/report coerenti
    - prompt `marzo 2026` su `TI233827` -> stesso periodo, stessi conteggi e stesso verdetto di fiducia
    - prompt `anomalie rifornimenti marzo 2026` -> thread D04 con classificazione record e spiegazione semplice
    - prompt `prossimi 30 giorni collaudo/pre-collaudo` -> caso non fuel ancora corretto e non rotto dal nuovo modello di fiducia

## 5.62 Aggiornamento 2026-03-25 - Priority engine operativo flotta
- La console `/next/ia/interna` trasforma ora le richieste flotta in una classifica priorita spiegabile, orientata all'azione e costruita sopra piu segnali operativi reali, senza rifare il motore unificato o introdurre ranking opachi.
- Cosa cambia davvero:
  - il motore riconosce meglio i prompt su `mezzi che richiedono piu attenzione`, `mezzo piu critico`, `un solo mezzo da controllare`, `priorita oggi/settimana` e `cosa conviene fare`;
  - il ranking usa un criterio fisso e leggibile: scaduti, poi entro 7 giorni, poi alert critici/controlli KO/lavori urgenti, poi segnalazioni e pre-collaudi, infine backlog tecnico/manutenzioni;
  - ogni mezzo in classifica espone targa, livello priorita, motivi sintetici e azione consigliata, cosi il thread si comporta piu come assistente operativo che come semplice lettore dati;
  - il planner non restringe piu i prompt ampi della flotta a solo `scadenze/collaudi`, ma continua a lasciare i casi deadline-focused nel ramo dedicato `Scadenze flotta`;
  - i suggerimenti della pagina e il catalogo capability riflettono ora i prompt reali usati in regressione per priorita giornaliera e settimanale.
- Correzioni strutturali incluse:
  - il prompt `Dimmi quali sono oggi i 3 mezzi che richiedono piu attenzione...` entra stabilmente in `Priorita flotta`, anche quando il giorno corrente non offre abbastanza segnali forti e il sistema deve dichiarare prudenza;
  - il prompt `Quale mezzo e piu critico questa settimana?` non cade piu nel fallback generico e restituisce la testa classifica con motivi operativi;
  - il prompt `Se oggi dovessi controllare un solo mezzo...` rispetta ora top-1 e action advice;
  - il prompt `prossimi 30 giorni + collaudo/pre-collaudo + priorita` resta deadline-first e ordinato, senza essere assorbito dalla classifica operativa generica.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun refactor del dominio rifornimenti, del planner precedente o del renderer PDF;
  - nessun ranking opaco o numeri arbitrari senza spiegazione.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - `oggi + top 3 + incrocio multi-dominio` -> `Priorita flotta`, prudente quando nel giorno non emergono segnali sufficienti
    - `mezzo piu critico questa settimana` -> classifica flotta con `TI180147` in testa e motivi/azione spiegati
    - `un solo mezzo da controllare oggi` -> top-1 coerente nel ramo priorita
    - `prossimi 30 giorni + collaudo/pre-collaudo + priorita` -> `Scadenze flotta`, ordinato e focalizzato

## 5.63 Aggiornamento 2026-03-25 - Quadro mezzo utile e output allineati
- La console `/next/ia/interna` usa ora un quadro mezzo decisionale unico, condiviso tra thread chat, report corrente, modale e PDF, con differenza solo di renderer e non di sostanza business.
- Cosa cambia davvero:
  - il quadro completo mezzo viene costruito dal motore come payload business ordinato e fisso: `Sintesi iniziale`, `Cosa fare ora`, `Scadenze e collaudi`, `Backlog tecnico`, `Segnali operativi`, `Consumi e rifornimenti`, `Costi e documenti`, `Nota finale`;
  - il thread smette di presentare il quadro mezzo come overview generica o come sotto-caso rifornimenti, e mette in primo piano targa, azione principale e motivi operativi;
  - il renderer professionale preserva lo stesso ordine del payload, invece di riorganizzare le sezioni in modo diverso dal thread;
  - la vista React del report mostra prima cards decisionali, sintesi e sezioni, spostando media stack e appendici in fondo;
  - i riferimenti tecnici di supporto restano disponibili nel sistema ma non sporcano piu il primo piano del quadro mezzo nel thread.
- Correzioni strutturali incluse:
  - il prompt `Fammi un quadro completo della targa TI233827...` entra in `Quadro mezzo` e mostra subito `Cosa fare ora`;
  - il prompt `Dimmi la situazione del mezzo TI233827 e cosa dovrei fare per primo` usa lo stesso payload decisionale del quadro completo;
  - il prompt `Per questa targa voglio un report completo ma leggibile, non tecnico` con targa selezionata produce report/PDF coerenti con il contenuto del thread;
  - il prompt `Crea il PDF del quadro mezzo TI233827` mantiene allineati thread, report corrente e anteprima PDF.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun refactor largo del motore unificato o di `pdfEngine`;
  - nessuna riapertura del dominio rifornimenti a monte.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - `quadro completo TI233827` -> thread `Quadro mezzo` con blocchi decisionali ordinati
    - `situazione del mezzo TI233827` -> stesso payload, stessa azione principale
    - `report completo ma leggibile` con targa selezionata -> report/PDF coerenti con il thread
    - `PDF del quadro mezzo TI233827` -> report corrente e anteprima PDF allineati

## 5.64 Aggiornamento 2026-03-25 - Estensione realistica costi-documenti-report decisionali
- La console `/next/ia/interna` apre ora `D07/D08` in modo realistico e period-aware, senza fingere copertura piena su costi o documenti quando il dato non basta.
- Cosa cambia davvero:
  - il layer `nextDocumentiCostiDomain` espone una vista per targa filtrabile per periodo, con conteggi diretti/prudenziali, storico utile, copertura del filtro periodo e azione consigliata;
  - il motore IA usa questa vista per costruire il blocco `Costi, documenti e storico utile`, evitando sintesi grezze o conteggi improvvisati;
  - il parser periodo riconosce anche richieste come `ultimi 12 mesi`, cosi i report economico-documentali non ricadono piu per errore su `Tutto lo storico disponibile`;
  - chat, report e PDF condividono la stessa sostanza business sui casi costi/documenti/storico utile, con taglio leggibile e limiti dichiarati in linguaggio umano;
  - la UI etichetta correttamente i casi `Costi e documenti` e mantiene `Storico mezzo` solo per i veri prompt di overview storica/decisionale.
- Correzioni strutturali incluse:
  - `Fammi un report dei costi della targa TI233827 negli ultimi 12 mesi...` -> report/PDF su `D07/D08` con periodo `25/03/2025 - 25/03/2026`, nessun costo leggibile trovato e limite dichiarato senza copertura finta;
  - `Quali documenti rilevanti risultano associati alla targa TI233827?` -> thread `Costi e documenti` con assenza dati esplicitata in modo semplice;
  - `Fammi uno storico decisionale del mezzo TI233827 con costi, documenti e segnali utili.` -> `Quadro mezzo` che ingloba il blocco costi/documenti come segnale prudente;
  - `Genera un report/PDF sullo storico utile del mezzo TI233827.` -> modale/PDF coerenti sullo stesso quadro mezzo decisionale.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna apertura fittizia di `D06`;
  - nessun refactor largo di motore, UI o PDF engine.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - `report costi ultimi 12 mesi` -> periodo rispettato, report/PDF coerenti, nessun costo leggibile trovato
    - `documenti rilevanti TI233827` -> risposta strutturata prudente con assenza dati dichiarata
    - `storico decisionale TI233827 con costi/documenti/segnali` -> `Quadro mezzo` coerente
    - `report/PDF sullo storico utile del mezzo` -> report/PDF coerenti con il thread

## 5.65 Aggiornamento 2026-03-25 - Assistente repo, flussi e integrazione per sviluppo interno
- La console `/next/ia/interna` e il backend IA separato aiutano ora anche come assistente tecnico interno su repo, moduli collegati, impatti file/layer e punto corretto di integrazione di moduli o capability future, senza riaprire il nucleo business della IA.
- Cosa cambia davvero:
  - il repo understanding server-side include ora anche una mappa pratica dei layer `madre`, `NEXT`, `backend IA`, `domain/read model`, `renderer/UI` e `documentazione di verita`;
  - lo stesso snapshot espone un catalogo operativo di playbook su Home, file/moduli, flusso rifornimenti, Dossier Mezzo, inserimento nuovo modulo, perimetri logici e integrazione di nuove funzioni IA sui flussi operativi;
  - le richieste repo/flussi non dipendono piu dal provider reale: il backend IA separato risponde in modo deterministico sopra snapshot read-only, con output pratico e sempre strutturato;
  - l'orchestrator locale riconosce ora anche i prompt tecnici interni e li fa passare prima del motore business unificato, evitando che vengano assorbiti dai filtri `quadro/scadenze/...` della console;
  - la UI della pagina IA dichiara in modo piu esplicito il nuovo ruolo tecnico interno, aggiorna etichette e aggiunge i 5 prompt bussola tra i suggerimenti rapidi.
- Correzioni strutturali incluse:
  - `Se voglio semplificare il flusso rifornimenti...` restituisce ora moduli collegati, file/layer da leggere, rischio impatto e punto corretto di intervento in NEXT;
  - `Se modifico il Dossier Mezzo...` restituisce l'impatto sull'aggregatore mezzo-centrico invece di cadere nel motore business generico;
  - `Voglio aggiungere un nuovo modulo nel gestionale...` propone ora la macro-area owner corretta, distinguendo dossier, cockpit globale, workbench operativi e IA interna;
  - `Questa logica vive nella madre, nella NEXT o nel backend IA?...` separa esplicitamente i perimetri e l'ordine corretto di lettura dei file;
  - `Se voglio aggiungere una nuova funzione IA legata ai flussi operativi...` indica ora il wiring corretto `read model -> orchestrazione IA -> output selector -> pagina IA`, con backend server-side solo se serve davvero.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessun refactor largo del motore business unificato;
  - nessuna knowledge base astratta fuori repo o agente autonomo che modifica codice.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js` -> OK
  - smoke test reali lato endpoint `orchestrator.chat` del backend IA separato con i 5 prompt bussola -> tutti `OK`, `intent=repo_understanding`, sezioni complete, `usedRealProvider=false`

## 5.66 Aggiornamento 2026-03-25 - D06 Procurement reale read-only
- Il clone NEXT e la console `/next/ia/interna` trattano ora `D06` come un workbench procurement read-only vero, invece che come insieme di preview e CTA potenzialmente ambigue.
- Cosa cambia davvero:
  - `nextDocumentiCostiDomain` espone ora uno snapshot procurement read-only che normalizza ordini, righe materiali, arrivi, preventivi, approvazioni e listino in una vista unica, con provenienza e stato superficie espliciti;
  - la pagina `/next/acquisti` non usa piu nel subtree clone il workflow legacy scrivente: mostra un banco read-only in italiano dove `Ordini`, `Arrivi` e `Dettaglio ordine` restano leggibili, mentre `Ordine materiali`, `Prezzi & Preventivi` e `Listino Prezzi` vengono fermati con motivo chiaro;
  - `Capo Costi Mezzo` espone meglio il confine reale del clone: stati e documenti leggibili, ma approvazioni reali, cambio stato, PDF timbrati e CTA equivalenti restano bloccati;
  - la IA interna riconosce ora in modo stabile richieste D06 su ordini, preventivi, approvazioni, stato read-only, CTA da bloccare e Capo Costi, senza improvvisare sintesi su domini adiacenti;
  - il dominio distingue ora `stato leggibile`, `preview`, `contesto prudente`, `workflow non importato` e `CTA non consentita`, cosi procurement non sembra piu piu operativo di quanto sia davvero.
- Correzioni strutturali incluse:
  - `Fammi un riepilogo read-only di ordini e preventivi.` -> ramo D06 con conteggi su ordini, righe, preventivi, approvazioni e listino;
  - `Ci sono approvazioni reali o solo preview?` -> risposta D06 che dichiara le approvazioni solo leggibili e non eseguibili nel clone;
  - `Quali CTA di procurement vanno bloccate nella NEXT?` -> elenco esplicito di CTA non consentite, senza governance finta;
  - `Questa area e davvero operativa o solo in lettura prudente?` -> distinzione chiara tra superficie navigabile e superfici solo preview/bloccate;
  - `Spiegami lo stato reale di Capo Costi nel perimetro NEXT.` -> routing corretto al dominio D06, non piu assorbito dal ramo costi/documenti generico.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura di approvazioni reali, ordine materiali, PDF timbrati o workflow procurement completi;
  - nessun refactor largo di tutte le pagine acquisti.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/NextOperativitaGlobalePage.tsx src/pages/Acquisti.tsx` -> KO per debito lint legacy gia presente soprattutto in `src/pages/Acquisti.tsx` e in parte in `src/next/NextCapoCostiMezzoPage.tsx`
  - `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextOperativitaGlobalePage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - `riepilogo read-only di ordini e preventivi` -> D06 con snapshot coerente e niente workflow simulati
    - `approvazioni reali o solo preview` -> D06 con confine read-only esplicito
    - `CTA di procurement da bloccare` -> D06 con elenco pratico delle superfici non consentite
    - `area operativa o solo lettura prudente` -> D06 con distinzione navigabile/preview/bloccata
    - `stato reale di Capo Costi` -> D06 corretto, senza sconfinare in costi/documenti generici

## 5.67 Aggiornamento 2026-03-25 - D03 autisti canonico read-only
- Il clone NEXT e la console `/next/ia/interna` trattano ora `D03` come dominio autisti read-only dedicato, con read model clone-safe, confine esplicito `madre / clone locale / fallback legacy` e collegamenti badge-autista-targa piu affidabili.
- Cosa cambia davvero:
  - esiste ora `src/next/domain/nextAutistiDomain.ts`, che legge in sola lettura `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `autisti_eventi` e il contesto locale clone autisti, producendo uno snapshot canonico D03;
  - il dominio normalizza badge, nome autista, mezzo/targa, timestamp evento, tipo segnale, provenienza e affidabilita del collegamento, distinguendo `forte`, `prudente`, `locale_clone` e `non_dimostrabile`;
  - la IA interna riconosce prompt D03 su segnali autisti, collegamento targa-autista, riepilogo read-only del flusso, anomalie dati e confine `madre / NEXT / flusso locale autisti`, senza usare piu `D10` come scorciatoia principale;
  - `NextCentroControllo` e `NextGestioneOperativa` dichiarano ora in pagina il confine D03 read-only e mostrano conteggi utili sulle sessioni madre, sui segnali madre e sugli elementi locali clone;
  - l'area autisti clone-safe esplicita che i salvataggi restano locali: i pulsanti parlano ora di `salvataggio locale` e il layout chiarisce che sessioni ed eventi madre sono solo letti.
- Correzioni strutturali incluse:
  - `Quali autisti hanno oggi segnali o eventi che richiedono attenzione?` -> ramo D03 con focus su segnali aperti reali;
  - `Questa targa a quale autista risulta collegata?` con `TI233827` selezionata -> aggancio forte a `ELTON SELIMI (badge 38)`;
  - `Fammi un riepilogo read-only del flusso autisti per oggi.` -> riepilogo D03 con sessioni attive, segnali madre, segnali locali clone, agganci forti/prudenziali e fallback legacy;
  - `Ci sono anomalie o dati incompleti nel dominio autisti?` -> elenco prudente di record da verificare e fallback non promossi a fonte forte;
  - `Questo dato viene dalla madre, dalla NEXT o da un flusso locale autisti?` -> confine esplicito con perimetro madre, clone locale e fallback legacy.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna sincronizzazione reale del clone autisti verso la madre;
  - nessun refactor largo delle pagine autisti legacy.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/domain/nextAutistiDomain.ts src/next/domain/nextStatoOperativoDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextCentroControlloPage.tsx src/next/NextGestioneOperativaPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - `autisti con segnali o eventi da attenzionare` -> 1 segnale aperto rilevato
    - `targa TI233827 -> autista` -> aggancio forte `ELTON SELIMI`
    - `riepilogo flusso autisti per oggi` -> `10 sessioni attive`, `35 segnali madre`, `0 locali clone`, `36 agganci forti`, `18 prudenziali`, `105 fallback legacy`
    - `anomalie o dati incompleti nel dominio autisti` -> `24` eventi prudenziali/incompleti e `105` record legacy da tenere separati
    - `madre / NEXT / flusso locale autisti` -> perimetro esplicito con `431` elementi madre, `0` locali clone e `105` fallback legacy

## 5.68 Aggiornamento 2026-03-26 - D05 magazzino reale read-only chiuso
- Il clone NEXT e la console `/next/ia/interna` trattano ora `D05` come dominio magazzino realmente chiuso in sola lettura, invece che come set di patch sparse o tracce parziali.
- Cosa cambia davvero:
  - `nextMaterialiMovimentiDomain` consolida il composito `readNextMagazzinoRealeSnapshot` sopra inventario, movimenti materiali e attrezzature, con limitazioni deduplicate e confine leggibile tra `dato forte`, `dato prudente` e `sola lettura`;
  - il motore IA distingue ora meglio richieste globali su stock/blocchi, richieste su materiali collegati ai mezzi, richieste sul mezzo singolo e richieste sul confine `operativa o solo in lettura`, senza scivolare su rami non coerenti;
  - le azioni consigliate D05 sono ora business-first: partono da stock critico, collegamenti forti verso mezzo e gap operativi leggibili, senza improvvisare conclusioni scriventi;
  - la rotta reale `/next/gestione-operativa` non mostra piu il contenitore legacy della madre, ma il workbench read-only clone-safe di `NextOperativitaGlobalePage`, con banner D03/D05 e CTA esplicite `read-only`;
  - la console IA espone anche il prompt rapido sul confine `Questa parte e davvero operativa o solo in lettura?`, che ora atterra davvero su D05.
- Correzioni strutturali incluse:
  - `Ci sono criticita di magazzino o inventario che richiedono attenzione?` -> `Magazzino reale` con stock critico e azione coerente;
  - `Fammi un riepilogo utile dei materiali collegati ai mezzi.` -> `Materiali collegati ai mezzi` con collegamenti forti e azione operativa leggibile;
  - `Questo mezzo ha ricevuto materiali o attrezzature rilevanti?` -> ramo mezzo-specifico D05 con focus su agganci forti e impatto dello stock critico globale;
  - `Ci sono stock bassi o segnali che possono bloccare il lavoro?` -> resta nel ramo D05 globale, senza collassare su riepilogo mezzo;
  - `Questa parte e davvero operativa o solo in lettura?` -> risposta D05 sul confine reale del workbench, senza finire in rami criticita generici.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura di carico/scarico, consegne, ritiri, foto o variazioni stock dal clone;
  - nessuna fusione fittizia tra D05, D06 e D02.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/domain/nextInventarioDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts src/next/domain/nextAttrezzatureCantieriDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextOperativitaGlobalePage.tsx src/next/NextGestioneOperativaPage.tsx` -> OK
  - smoke UI reale su `/next/ia/interna` con Playwright locale:
    - `criticita di magazzino o inventario` -> `Magazzino reale`, `1` segnale D05, azione su stock critico
    - `materiali collegati ai mezzi` -> `9` collegamenti forti, azione su mezzi con aggancio materiale forte
    - `Questo mezzo ha ricevuto materiali o attrezzature rilevanti?` con `TI233827` -> `2` movimenti forti, azione su aggancio mezzo + stock critico globale
    - `stock bassi o segnali che possono bloccare il lavoro` -> D05 globale, non overview mezzo
    - `questa parte e davvero operativa o solo in lettura` -> D05 confine `sola lettura`
  - smoke UI reale su `/next/gestione-operativa`:
    - banner `D03 autisti in sola lettura` e `D05 magazzino in sola lettura` visibili
    - CTA `Apri inventario read-only`, `Apri movimenti materiali`, `Apri attrezzature read-only` visibili

## 5.69 Aggiornamento 2026-03-26 - Rifinitura locale D06 procurement read-only
- Il work-package `D06` non viene riaperto: questa patch chiude solo i residui locali emersi dall'audit di rivalutazione dopo la chiusura reale di `D05`.
- Cosa cambia davvero:
  - `NextCapoCostiMezzoPage` chiude il lint locale richiesto eliminando mutazioni non ammesse nel riepilogo e tipizzando meglio la gestione errori;
  - `Acquisti.tsx` mantiene invariato il read model procurement ma ripulisce il lint locale con micro-correzioni meccaniche e contenimento esplicito delle porzioni legacy non ancora rifattorizzate;
  - `NextOperativitaGlobalePage` chiarisce meglio il boundary tra `D05` e `D06`: la card procurement resta separata da stock e movimenti materiali, che continuano a vivere nelle viste magazzino dedicate;
  - la tracciabilita ufficiale torna coerente con checklist IA, stato migrazione e registro clone allineati alla rifinitura.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura del dominio D05;
  - nessuna riapertura strutturale di D06.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm run build` -> OK
  - `npx eslint src/next/NextCapoCostiMezzoPage.tsx src/pages/Acquisti.tsx src/next/NextOperativitaGlobalePage.tsx` -> OK

## 5.70 Aggiornamento 2026-03-26 - Confine live-read backend IA chiuso
- Il sottosistema IA interno esce dal limbo sul live-read business con un verdetto binario verificato: il live-read business non e ammesso oggi e il backend IA separato usa solo clone/read model NEXT e snapshot read-only dedicate.
- Cosa cambia davvero:
  - il boundary tecnico del backend IA dichiara in modo esplicito `live_read_closed` e non presenta piu i perimetri candidati come apertura implicita;
  - la readiness Firestore/Storage del backend IA separato resta consultabile ma solo come diagnosi documentata del perche il live-read e chiuso, senza stati intermedi che possano sembrare quasi-operativi;
  - la chat IA, l'orchestratore locale e la UI `/next/ia/interna` distinguono ora in modo chiaro tra `clone/read model`, `snapshot clone-seeded` e `nessun live-read Firestore/Storage`;
  - il clone continua a offrire consultazione utile e read-only, ma senza overpromise su fonti backend live non dimostrate.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna apertura Firebase o Storage live lato backend IA;
  - nessun refactor largo del sottosistema IA.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npm --prefix backend/internal-ai run firebase-readiness` -> OK (`firestoreReadOnly.status = not_ready`, `storageReadOnly.status = not_ready`)
  - `npx eslint --no-error-on-unmatched-pattern src/next/internal-ai/*.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/*.js backend/internal-ai/*.js` -> OK
  - `npm run build` -> OK
  - smoke backend IA separato su `health` e `orchestrator/chat` con domanda `Questo dato lo stai leggendo live o dal clone?` -> OK, risposta deterministica con live-read chiuso e perimetro clone/read-only

## 5.71 Aggiornamento 2026-03-26 - Sweep CTA veritiere del clone NEXT
- Il work-package `SWEEP CTA VERITIERE` viene chiuso come rifinitura UX/guard-rail del clone: le CTA consultive restano navigabili, ma nessun bottone o punto di ingresso promette piu scritture, sync madre o funzioni non davvero importate.
- Cosa cambia davvero:
  - `Gestione Operativa`, `Acquisti`, `Capo Costi`, area autisti e `IA interna` rendono piu espliciti i confini `read-only`, `preview`, `locale clone` e `bloccato` sulle CTA gia visibili;
  - il Centro di Controllo viene riallineato sulla superficie runtime vera: la route `/next/centro-controllo` passa ancora da `NextCentroControlloClonePage`, quindi il task chiude li il gap residuo con banner clone-safe, sottotitolo onesto e relabel locale delle CTA di refresh/PDF/tab;
  - nessuna funzione consultiva utile viene bloccata se era gia navigabile in sola lettura: restano attive solo le CTA coerenti col clone, mentre le altre sono etichettate in modo piu chiaro.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura dei domini D03, D05, D06 o del boundary live-read IA;
  - nessun redesign largo della UX.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextCentroControlloClonePage.tsx src/next/NextCentroControlloPage.tsx src/next/NextGestioneOperativaPage.tsx src/next/NextOperativitaGlobalePage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/NextInternalAiPage.tsx src/pages/Acquisti.tsx` -> OK
  - `npm run build` -> OK
  - ricognizione runtime Playwright su `/next/centro-controllo` -> confermata la necessita di intervenire sul wrapper clone reale e non solo sulla shell `NextCentroControlloPage`

## 5.72 Aggiornamento 2026-03-26 - Dependency map repo per IA interna NEXT
- Il work-package `DEPENDENCY MAP REPO` rafforza l'assistente `repo/flussi` del sottosistema IA interno: la capability non si limita piu a playbook curati, ma usa una dependency map piu strutturale per route, file UI, read model, backend IA, moduli a monte/a valle e punto corretto di integrazione.
- Cosa cambia davvero:
  - `backend/internal-ai/server/internal-ai-repo-understanding.js` costruisce ora una dependency map statica/pratica per i casi chiave `Home/Centro di Controllo`, `D04 rifornimenti`, `Dossier Mezzo`, `nuovo modulo`, `perimetro layer` e `nuova funzione IA`;
  - le risposte repo/flussi del backend IA separato elencano in modo deterministico `Route coinvolte`, `File UI coinvolti`, `File domain/read-model coinvolti`, `File backend IA coinvolti`, `Lettori dominio usati`, `Flusso a monte e a valle`, `Perimetro logica` e `Punto consigliato di integrazione`;
  - il fallback locale dell'orchestratore mantiene la stessa struttura pratica sui prompt bussola principali, invece di tornare a un testo troppo curato o generico;
  - `/next/ia/interna` espone il conteggio della dependency map e una vista sintetica della matrice, senza redesign largo e senza toccare la madre.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura del live-read business lato backend IA;
  - nessuna scansione AST completa o knowledge base astratta scollegata dal repo.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/internal-ai/*.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/*.js backend/internal-ai/*.js` -> il glob `backend/internal-ai/*.js` non matcha file; rilanciato in modo equivalente con `--no-error-on-unmatched-pattern` -> OK
  - `npm run build` -> OK
  - smoke test reali `POST /internal-ai-backend/orchestrator/chat` sui 5 prompt bussola del task -> OK, `intent=repo_understanding`, `status=completed`, output piu concreti su file, route, layer e integrazione
  - smoke test reale `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> `dependencyMaps=6`

## 5.73 Aggiornamento 2026-03-26 - Base universale chat/IA del clone NEXT
- Il sottosistema `/next/ia/interna` compie il salto architetturale richiesto: non resta una console buona su alcuni domini, ma introduce nel clone/NEXT il primo gateway universale con registry totale, entity resolver, request resolver, reader/orchestrator, composer unico, router documenti e capability IA gia deployate censite come riuso.
- Cosa cambia davvero:
  - esiste un registry totale seedato del clone/NEXT con `10` moduli, `30` route, `4` modali, `10` tipi entita, `11` adapter standardizzati, `13` capability IA censite, `8` gia assorbite e `6` gap dichiarati;
  - D03, D04, D05, D06, D07/D08, D10 e `repo-understanding` vengono rifusi come adapter specializzati sotto un layer universale, invece di restare roadmap finale a domini separati;
  - il layer universale introduce un contract standard per moduli presenti e futuri, un resolver iniziale di entita trasversali (`targa`, `autista`, `fornitore`, `documento`, `cisterna`, `materiale`, `ordine`, `dossier`, `evento_operativo`, `modulo`) e un request resolver che sceglie adapter, capability e action intent del clone;
  - il router documenti classifica gia i casi base `libretto`, `preventivo fornitore`, `documento cisterna`, `documento mezzo`, `tabella materiali`, `testo operativo`, `immagine generica`, `documento ambiguo` e li aggancia al punto corretto del clone o, nei casi ancora ambigui all'epoca, alla chat IA interna;
  - la pagina `/next/ia/interna` espone ora una workbench universale che mostra perimetro censito, entita risolte, adapter scelti, composer, action intent e gap reali, mentre il bridge chat arricchisce le risposte con il `Piano universale clone/NEXT`.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business reale nel clone;
  - nessuna riapertura del live-read business lato backend IA;
  - nessun riuso runtime sporco dei backend legacy come canale canonico del nuovo sistema universale.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 5.74 Aggiornamento 2026-03-26 - Handoff standard, inbox documentale e prefill canonico
- Il clone `/next/ia/interna` non si limita piu a capire richieste: emette ora handoff standard veri verso i moduli target del clone, con route `?iaHandoff=<id>`, payload persistito localmente nel repository IA isolato e inbox documentale universale dedicata su `/next/ia/interna/richieste`.
- Cosa cambia davvero:
  - il bridge chat/orchestrator persiste handoff e inbox a ogni turno reale;
  - la sezione `Richieste` del subtree IA interno diventa la vera inbox documentale universale con handoff, prefill canonico e gate runtime per moduli futuri;
  - `D06 procurement` viene chiuso lato sistema universale con vincolo forte `fornitore`, route target `Acquisti` e payload uniforme;
  - `D09 cisterna` viene chiuso lato sistema universale con route target `Cisterna IA` e payload uniforme;
  - `next.autisti`, `next.ia_hub` e `next.libretti_export` risultano ora instradabili e agganciabili dal gateway universale.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura del live-read business lato backend IA;
  - il live-read business resta fuori perimetro; il limite sul consumo nativo del payload e stato poi chiuso nell'aggiornamento `5.75`.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 5.75 Aggiornamento 2026-03-26 - Chiusura operativa dei consumer `iaHandoff`
- Il perimetro universale attuale del clone/NEXT non si ferma piu al bridge: i moduli target correnti consumano davvero `?iaHandoff=<id>`, recuperano il payload dal repository IA interno, applicano prefill reale e aggiornano lo stato consumo.
- Cosa e stato chiuso davvero:
  - lifecycle standard `creato -> instradato -> letto_dal_modulo -> prefill_applicato -> completato/da_verificare/errore` persistito nel repository IA isolato;
  - consumer standard riusabile per `next.procurement`, `next.operativita` sulle viste `inventario` e `materiali`, `next.dossier`, `next.ia_hub` sui flussi `libretto` e `documenti`, `next.libretti_export`, `next.cisterna` su `Cisterna IA`, `next.autisti` su `Inbox` e `Admin`;
  - banner/stato UI coerente nei moduli target con campi mancanti, campi da verificare, capability riusata e motivo instradamento;
  - scenari E2E riallineati ai path reali e senza gap aperti nel perimetro corrente.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business;
  - nessuna riapertura del live-read business lato backend IA.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextAcquistiPage.tsx src/next/NextOrdiniInAttesaPage.tsx src/next/NextOrdiniArrivatiPage.tsx src/next/NextDettaglioOrdinePage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementStandalonePage.tsx src/next/NextInventarioReadOnlyPanel.tsx src/next/NextInventarioPage.tsx src/next/NextMaterialiConsegnatiReadOnlyPanel.tsx src/next/NextMaterialiConsegnatiPage.tsx src/next/NextMezziPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextLibrettiExportPage.tsx src/next/NextCisternaIAPage.tsx src/next/NextAutistiAdminPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 5.76 Aggiornamento 2026-03-26 - Audit runtime reale del Centro di Controllo NEXT
- L'audit runtime del Centro di Controllo NEXT conferma che la route ufficiale `/next/centro-controllo` non usa oggi il layer `src/next/domain/nextCentroControlloDomain.ts`.
- Il path ufficiale monta ancora `NextCentroControlloClonePage`, che a sua volta wrappa `src/pages/CentroControllo.tsx` con soli adattamenti clone-safe:
  - banner e copy read-only;
  - relabel di tab e CTA;
  - intercetto del back verso `/next/gestione-operativa`.
- `NextCentroControlloPage.tsx` esiste davvero e usa i layer `D10` e `D03` (`nextCentroControlloDomain.ts` + `nextAutistiDomain.ts`), ma oggi e una superficie alternativa non agganciata alla route ufficiale.
- Conseguenza operativa:
  - la NEXT ufficiale del Centro di Controllo e piu sicura della madre sul piano no-write e routing clone-safe;
  - non e invece ancora piu pulita/affidabile della madre sul piano dati, perche la normalizzazione D10 non alimenta il path ufficiale.
- Il read model `D10` resta comunque utile e dimostrato nel repo per:
  - alert da revisioni/conflitti/segnalazioni nuove/eventi importanti;
  - sessioni attive read-only;
  - location asset da storico eventi;
  - ricostruzione prudente delle revisioni da anagrafica flotta.
- Riferimento audit completo:
  - `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`

## 5.77 Aggiornamento 2026-03-29 - Audit completo parita clone/NEXT vs madre
- E stato completato un audit documentale completo del clone/NEXT contro la madre, basato prima sui documenti ufficiali e poi sul routing/runtime reale del repository.
- Verdetto sintetico fissato nel repo:
  - il clone/NEXT non e oggi dimostrato come `100%` uguale alla madre;
  - i casi realmente `PARI` emersi dal codice sono oggi `Dossier Gomme` e `Dossier Rifornimenti`;
  - molte route ufficiali restano `PARI MA RAW`, cioe clone-fedeli ma ancora agganciate a logiche o letture legacy della madre;
  - i casi piu nettamente `SPEZZATO` sono `Centro di Controllo`, `Procurement` e `Lavori`;
  - `Targa 360` e `Autista 360` restano censiti ma `FUORI PERIMETRO` e non abbassano la parita del clone.
- Implicazione operativa:
  - il problema principale della NEXT non e l'assenza totale di layer puliti, perche reader/read model `D01`, `D03`, `D04`, `D05`, `D06`, `D07/D08`, `D09`, `D10` esistono gia;
  - il problema reale e che questi layer non alimentano ancora in modo uniforme le route ufficiali `/next/*`.
- Priorita ufficiali emerse dall'audit:
  - `P0`: `Centro di Controllo`;
  - `P0`: `Mezzi` + `Dossier Mezzo`;
  - `P0`: `Procurement`;
  - `P0`: `Lavori`;
  - `P0`: audit e hardening delle sottopagine `Autisti Inbox`.
- Riferimento audit completo:
  - `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - controllo coerenza path/file citati nei report -> OK
  - build/lint -> NON ESEGUITO, task solo documentale

## 5.78 Aggiornamento 2026-03-29 - Chiusure residue prompt 34 nel solo perimetro NEXT
- Il clone chiude altre 5 superfici senza toccare la madre e senza uscire dal perimetro `src/next/*`:
  - `Dossier Lista`
  - `Colleghi`
  - `Fornitori`
  - `IA Home`
  - `IA API Key`
- Cosa cambia davvero:
  - `Dossier Lista` non monta piu la pagina madre con lettura Firestore diretta, ma replica la stessa UI sopra `readNextAnagraficheFlottaSnapshot()` e naviga verso il dossier clone;
  - `Colleghi` e `Fornitori` non restano piu semplici pannelli custom read-only: replicano la superficie madre, leggono da `nextColleghiDomain` e `nextFornitoriDomain`, mantengono PDF e fermano solo il confine finale di save/delete nel clone;
  - `IA Home` non e piu un hub clone reinterpretato: replica la pagina madre e usa il reader `nextIaConfigDomain` per verificare la presenza della chiave Gemini;
  - `IA API Key` non dipende piu dal runtime madre: espone la stessa UI della pagina legacy ma legge la configurazione da `nextIaConfigDomain` e blocca il salvataggio nel clone.
- Cosa NON cambia:
  - nessuna modifica alla madre;
  - nessuna scrittura business reale;
  - nessuna riapertura di `Targa 360` o `Autista 360`, che restano fuori perimetro;
  - i macro-gap residui (`Home`, `Centro di Controllo`, `Procurement core`, `Dossier core`, `Capo`, child route IA operative, `Cisterna`, `Autisti / Inbox`) restano ancora da replicare nel clone.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/domain/nextIaConfigDomain.ts src/next/NextDossierListaPage.tsx src/next/NextIntelligenzaArtificialePage.tsx src/next/NextIAApiKeyPage.tsx src/next/NextFornitoriPage.tsx src/next/NextColleghiPage.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 5.79 Aggiornamento 2026-03-29 - Hardening finale residuo prompt 35
- Questo run non chiude artificialmente i residui: estende il perimetro dati puliti dove il clone poteva ancora assorbire letture legacy senza toccare la madre, e dichiara aperti i casi che restano agganciati a Firestore/Storage diretto nel runtime legacy.
- Cosa cambia davvero:
  - introdotto `src/next/nextLegacyAutistiOverlay.ts`, che costruisce uno shape legacy controllato per `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `@rifornimenti_autisti_tmp` e `@cambi_gomme_autisti_tmp`, fondendo reader clone-side e stato locale namespaced dell'app autisti NEXT;
  - `NextLegacyStorageBoundary` supporta ora anche il preset `autisti`;
  - `Home` e `Centro di Controllo` passano nel clone attraverso boundary `flotta + autisti`, quindi le letture che transitano da `storageSync` non ricadono piu direttamente sul raw legacy;
  - le route `/next/autisti/*` e `/next/autisti-inbox/*` che continuano a montare superfici madre vengono riagganciate allo stesso overlay dati autisti, restando pero aperte sul piano parity per i writer/reader diretti ancora interni alla madre;
  - `Libretti Export` non usa piu la workbench clone precedente: la route ufficiale monta adesso la pagina madre `LibrettiExport` sopra `NextLegacyStorageBoundary` con preset `flotta`, quindi la parita UI/comportamento torna `1:1` mentre il dataset mezzi passa da layer NEXT pulito;
  - `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Dossier Mezzo` e `Analisi Economica` montano ora boundary dati NEXT aggiuntivi sui punti `storageSync`, ma non vengono dichiarati chiusi perche i file madre continuano a fare anche accessi diretti Firestore/Storage fuori bridge.
- Verdetto operativo:
  - nuova chiusura piena dimostrata in questo run: `Libretti Export`;
  - nessuna chiusura fittizia aggiunta su `Home`, `Centro di Controllo`, `IA child routes legacy`, `Dossier Mezzo`, `Analisi Economica`, `Cisterna` e `Autisti / Inbox`.
- Stato area NEXT coinvolta: `IMPORTATO READ-ONLY`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/nextLegacyAutistiOverlay.ts src/next/NextLegacyStorageBoundary.tsx src/next/NextHomePage.tsx src/next/NextCentroControlloClonePage.tsx src/next/NextLibrettiExportPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextIACoperturaLibrettiPage.tsx src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/NextAutistiLoginPage.tsx src/next/NextAutistiHomePage.tsx src/next/NextAutistiSetupMezzoPage.tsx src/next/NextAutistiCambioMezzoPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/NextAutistiInboxCambioMezzoPage.tsx src/next/NextAutistiInboxControlliPage.tsx src/next/NextAutistiInboxGommePage.tsx src/next/NextAutistiInboxLogAccessiPage.tsx src/next/NextAutistiInboxSegnalazioniPage.tsx src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx src/next/NextAutistiAdminPage.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## 5.80 Aggiornamento 2026-03-29 - Ricostruzione reale NEXT del Centro di Controllo
- La route ufficiale `/next/centro-controllo` non monta piu `NextCentroControlloClonePage` e non wrappa piu `src/pages/CentroControllo.tsx` come runtime finale.
- Cosa e stato chiuso davvero:
  - creata `src/next/NextCentroControlloParityPage.tsx`, che replica nel clone la struttura reale della madre:
    - blocco `PRIORITA OGGI`;
    - tab `Manutenzioni programmate`;
    - tab `Report rifornimenti`;
    - tab `Segnalazioni autisti`;
    - tab `Controlli KO/OK`;
    - tab `Richieste attrezzature`;
    - preview PDF manutenzioni e rifornimenti con lo stesso comportamento esterno della madre;
  - il nuovo runtime NEXT legge ora solo layer dedicati:
    - `D01` per la pianificazione manutenzioni (`readNextAnagraficheFlottaSnapshot`);
    - `D04` per il report rifornimenti globale (`readNextRifornimentiReadOnlySnapshot`);
    - `D03` per segnalazioni, controlli e richieste (`readNextAutistiReadOnlySnapshot`);
  - `nextAutistiDomain.ts` espone ora righe tabellari pulite per le sezioni del Centro di Controllo, senza lasciare parsing raw nella pagina;
  - `nextRifornimentiDomain.ts` espone ora uno snapshot globale read-only per il report mensile, cosi la pagina NEXT non usa piu `getDoc()` diretto sui dataset legacy.
- Verdetto operativo:
  - `Centro di Controllo` passa da `SPEZZATO` a `PARI E PULITO` nel perimetro NEXT;
  - la pagina madre resta intoccata e non viene piu montata come soluzione finale sul path ufficiale clone.
- Stato area NEXT coinvolta: `RICOSTRUITO IN NEXT`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextCentroControlloParityPage.tsx src/next/domain/nextAutistiDomain.ts src/next/domain/nextRifornimentiDomain.ts src/App.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi, doppio import `jspdf` e `baseline-browser-mapping` datato

## 5.81 Aggiornamento 2026-03-29 - Ricostruzione reale NEXT di Home e riallineamento Capo
- La route ufficiale `/next` non monta piu `src/pages/Home.tsx` dentro `NextMotherPage`.
- Cosa e stato chiuso davvero:
  - `Home` usa ora una pagina NEXT vera (`src/next/NextCentroControlloPage.tsx`) sopra `NextLegacyStorageBoundary`, senza runtime legacy finale;
  - la pagina replica la grammatica madre di `Home`: hero card, ricerca, alert, sessioni, revisioni, collegamenti rapidi, modali prenotazione/pre-collaudo/revisione, editing luogo mezzo e `AutistiEventoModal`;
  - `Home` ripristina anche gli export PDF alert e le azioni `Ignora / In seguito / Letto`, ma le persiste in overlay clone-only locale invece che nella madre;
  - `Capo` viene riallineato alla madre senza riaprire la pagina legacy: `NextCapoCostiMezzoPage` reintroduce approvazioni, export PDF preventivi, anteprime PDF e preview timbrata sopra `nextCapoDomain`, con stato approvazioni confinato in overlay clone-only locale;
  - `NextCapoMezziPage` resta la lista ufficiale nativa NEXT e non ha piu differenze visibili spurie nel titolo/logo.
- Layer usati sotto:
  - `Home`: `D10` via `readNextCentroControlloSnapshot()` + `D03` via `readNextAutistiReadOnlySnapshot()` + overlay clone-only `nextHomeCloneState`;
  - `Capo`: `nextCapoDomain` + `nextDocumentiCostiDomain` + overlay clone-only `nextCapoCloneState`.
- Verdetto operativo:
  - `Home` passa a `PARI E PULITO`, con esclusione esplicita dei blocchi `Targa 360 / Mezzo360` e `Autista 360` fuori perimetro;
  - `Capo` passa a `PARI E PULITO`;
  - restano aperti i macro-residui che montano ancora `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale.
- Stato area NEXT coinvolta: `RICOSTRUITO IN NEXT`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextHomePage.tsx src/next/NextCentroControlloPage.tsx src/next/domain/nextCentroControlloDomain.ts src/next/nextHomeCloneState.ts src/next/NextCapoMezziPage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/domain/nextCapoDomain.ts src/next/nextCapoCloneState.ts` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi, doppio import `jspdf` e `baseline-browser-mapping` datato

## 5.82 Aggiornamento 2026-03-29 - Svuotamento backlog residuo prompt 38, chiusure reali su Dossier/Analisi/Materiali
- Questo run non aggiunge wrapper o boundary cosmetici: sostituisce tre route ufficiali ancora aperte con pagine NEXT vere e introduce un overlay procurement clone-only che non scrive sulla madre.
- Cosa e stato chiuso davvero:
  - `Dossier Mezzo` non monta piu `src/pages/DossierMezzo.tsx`: la route ufficiale usa ora `src/next/NextDossierMezzoPage.tsx`, che replica dati tecnici, foto, lavori, manutenzioni, materiali, rifornimenti, preventivi/fatture, modali libretto/foto e anteprima PDF sopra `readNextDossierMezzoCompositeSnapshot()`;
  - `Analisi Economica` non monta piu `src/pages/AnalisiEconomica.tsx`: la route ufficiale usa ora `src/next/NextAnalisiEconomicaPage.tsx`, che replica riepilogo costi, fornitori, documenti recenti, blocco IA e anteprima PDF, con rigenerazione clone-only dell'analisi sopra il layer dossier gia normalizzato;
  - `Materiali da ordinare` non monta piu `src/pages/MaterialiDaOrdinare.tsx`: la route ufficiale usa ora `src/next/NextMaterialiDaOrdinarePage.tsx`, che replica header, tab, form fabbisogni, tabella materiali, modali placeholder e sticky action bar della madre;
  - introdotto `src/next/nextProcurementCloneState.ts`: gli ordini confermati da `Materiali da ordinare` vengono salvati solo in overlay locale clone-only e il domain `D06` li riassorbe in lettura, cosi il clone vede l'ordine senza scrivere su `@ordini`.
- Cosa resta aperto dopo questo run:
  - `Acquisti / Preventivi / Listino`: la superficie ufficiale e gia NEXT ma non replica ancora l'intero workflow madre su preventivi, listino, approvazioni e PDF operativi;
  - `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Cisterna`, `Cisterna IA`, `Cisterna Schede Test`, `Autisti / Inbox`: le route ufficiali montano ancora runtime legacy come soluzione finale.
- Stato area NEXT coinvolta: `RICOSTRUITO IN NEXT`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/nextDossierCloneState.ts src/next/NextMaterialiDaOrdinarePage.tsx src/next/nextProcurementCloneState.ts src/next/domain/nextProcurementDomain.ts` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi, doppio import `jspdf` e `baseline-browser-mapping` datato

## 5.83 Aggiornamento 2026-03-29 - Chiusura ultimi 8 moduli residui prompt 39
- Il backlog residuo del clone/NEXT viene chiuso anche sugli ultimi 8 moduli rimasti aperti nel perimetro operativo:
  - `Acquisti / Preventivi / Listino`;
  - `IA Libretto`;
  - `IA Documenti`;
  - `IA Copertura Libretti`;
  - `Cisterna`;
  - `Cisterna IA`;
  - `Cisterna Schede Test`;
  - `Autisti / Inbox`.
- Cosa e stato chiuso davvero:
  - `Acquisti / Preventivi / Listino` resta su superficie NEXT nativa e il domain `D06` legge ora anche `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi`, cosi la route ufficiale copre tab, tabelle e blocchi madre senza rimontare `src/pages/Acquisti.tsx`;
  - `IA Libretto`, `IA Documenti` e `IA Copertura Libretti` sono confermate come pagine NEXT vere che leggono rispettivamente da facade/libretto preview, `nextDocumentiCostiDomain` e `nextAnagraficheFlottaDomain`, senza `NextMotherPage`;
  - `Cisterna`, `Cisterna IA` e `Cisterna Schede Test` risultano chiuse su pagine NEXT native sopra `nextCisternaDomain`, con preview/report PDF clone-safe e nessun mount finale delle pagine legacy del verticale;
  - `Autisti / Inbox` non monta piu pagine madre sulle route ufficiali: login, home, setup, cambio mezzo, controlli, gomme, inbox, segnalazioni, richieste attrezzature, log accessi e admin passano da copie NEXT native e da bridge clone-safe dedicati.
- Esito del controllo finale di chiusura:
  - route ufficiali degli 8 moduli: nessun mount di `NextMotherPage`;
  - report/PDF: presenti nei moduli che li prevedono (`Acquisti`, `IA Documenti`, `Cisterna`, `Autisti Admin`);
  - layer dati: passaggio da domain NEXT o bridge clone-safe dedicati, senza riaprire writer business reali sulla madre;
  - dipendenze residue: restano ammessi solo riusi non critici di CSS/shared helper locali, ma non restano mount di pagine legacy o accessi raw sostanziali nel runtime finale dei moduli chiusi.
- Stato area NEXT coinvolta: `CHIUSO NEL PERIMETRO TARGET`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/domain/nextProcurementDomain.ts src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementStandalonePage.tsx src/next/NextAcquistiPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextIACoperturaLibrettiPage.tsx src/next/domain/nextCisternaDomain.ts src/next/NextCisternaPage.tsx src/next/NextCisternaIAPage.tsx src/next/NextCisternaSchedeTestPage.tsx src/next/autisti/NextLoginAutistaNative.tsx src/next/autisti/NextHomeAutistaNative.tsx src/next/autisti/NextSetupMezzoNative.tsx src/next/autistiInbox/NextAutistiInboxHomeNative.tsx src/next/autistiInbox/NextCambioMezzoInboxNative.tsx src/next/autistiInbox/NextAutistiControlliAllNative.tsx src/next/autistiInbox/NextAutistiGommeAllNative.tsx src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx src/next/autistiInbox/nextAutistiAdminBridges.ts src/next/autistiInbox/NextAutistiAdminNative.tsx src/next/NextAutistiLoginPage.tsx src/next/NextAutistiHomePage.tsx src/next/NextAutistiSetupMezzoPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/NextAutistiInboxCambioMezzoPage.tsx src/next/NextAutistiInboxControlliPage.tsx src/next/NextAutistiInboxGommePage.tsx src/next/NextAutistiInboxLogAccessiPage.tsx src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx src/next/NextAutistiInboxSegnalazioniPage.tsx src/next/NextAutistiAdminPage.tsx` -> OK
  - `npm run build` -> OK, warning Vite invariati su chunk grandi, doppio import `jspdf` e `baseline-browser-mapping` datato

## 5.84 Aggiornamento 2026-03-30 - Procedura madre->clone e chiusura execution dei gap dell'audit finale
- Creati i due riferimenti operativi stabili del run:
  - `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
  - `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`
- La procedura madre->clone viene usata come contratto esecutivo del prompt 42:
  - leggere la madre per UI/flussi/PDF/modali;
  - non montarla come runtime finale sulle route NEXT ufficiali del perimetro target;
  - ricostruire la superficie NEXT vera;
  - usare sotto layer NEXT puliti, adapter clone-safe e stato locale solo dove strettamente necessario;
  - non considerare il report esecutivo come prova finale di chiusura.
- Gap reali dell'audit finale chiusi davvero in questo run:
  - backlog persistente aggiornato da aperto a chiuso sul perimetro target confermato dall'audit finale;
  - `Autisti / Inbox` non dipende piu da `storageSync` condiviso, `homeEvents` condiviso o bridge Firebase/Storage clone-safe sopra runtime legacy:
    - introdotti `src/next/autisti/nextAutistiStorageSync.ts` e `src/next/autisti/nextAutistiHomeEvents.ts`;
    - introdotti `src/next/autisti/NextModalGomme.tsx` e `src/next/autisti/NextGommeAutistaModal.tsx`;
    - `src/next/autistiInbox/nextAutistiAdminBridges.ts` viene chiuso su bridge clone-only locale;
    - `src/next/autistiInbox/NextAutistiAdminNative.tsx` sposta il writer lavori su `appendNextLavoriCloneRecords()` invece di scrivere shape raw legacy.
- Controllo finale route/runtime eseguito sul perimetro target:
  - nessuna route ufficiale del perimetro target monta `NextMotherPage`;
  - nessuna route ufficiale del perimetro target importa `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale;
  - resta nel repo solo `src/next/NextCentroControlloClonePage.tsx`, ma non e montata da `src/App.tsx` e non conta come runtime ufficiale.
- Stato area NEXT coinvolta: `BACKLOG ESECUTIVO AUDIT FINALE CHIUSO`
- Nota metodo:
  - questa chiusura vale come execution verificata nel perimetro whitelistato;
  - il verdetto `NEXT autonoma sul perimetro target` resta demandato a un audit separato, in coerenza con `AGENTS.md`.
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI
- Verifiche del task:
  - `npx eslint src/next/autisti/nextAutistiStorageSync.ts src/next/autisti/nextAutistiHomeEvents.ts src/next/autisti/NextModalGomme.tsx src/next/autisti/NextGommeAutistaModal.tsx src/next/autisti/NextHomeAutistaNative.tsx src/next/autisti/NextLoginAutistaNative.tsx src/next/autisti/NextSetupMezzoNative.tsx src/next/autisti/NextAutistiSegnalazioniPage.tsx src/next/autistiInbox/nextAutistiAdminBridges.ts src/next/autistiInbox/NextAutistiAdminNative.tsx src/next/autistiInbox/NextAutistiInboxHomeNative.tsx src/next/autistiInbox/NextCambioMezzoInboxNative.tsx src/next/autistiInbox/NextAutistiControlliAllNative.tsx src/next/autistiInbox/NextAutistiGommeAllNative.tsx src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx src/next/NextAutistiCambioMezzoPage.tsx src/next/NextAutistiGatePage.tsx src/next/domain/nextAutistiDomain.ts src/next/domain/nextCentroControlloDomain.ts src/next/autisti/nextAutistiCloneRuntime.ts` -> OK con soli warning `react-hooks/exhaustive-deps` in `NextAutistiSegnalazioniPage.tsx`
  - `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`
  - `rg -n "\\.\\./pages/|\\.\\./autisti/|\\.\\./autistiInbox/|NextMotherPage" src/next src/App.tsx` -> nessun mount finale legacy nelle route ufficiali del perimetro target; residui solo CSS/shared helper locali e `NextCentroControlloClonePage.tsx` fuori runtime ufficiale

## 5.85 Aggiornamento 2026-03-30 - Audit finale avversariale post prompt 42
- L'audit separato `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md` conferma un fatto tecnico e ne smentisce uno operativo:
  - confermato: le route ufficiali del perimetro target non montano piu `NextMotherPage` o runtime finali da `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**`;
  - smentito: questo non basta a dichiarare il perimetro target `CHIUSO`.
- Verdetto documentato dell'audit:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`.
- Gap reali lasciati aperti dal codice reale:
  - moduli `PARZIALI`: inventario, materiali, procurement, lavori, mezzi/dossier, capo costi, colleghi, fornitori, IA documentale/libretti, cisterna, autisti, autisti inbox/admin;
  - moduli `DA VERIFICARE`: home, centro di controllo, dossier lista, dossier gomme, dossier rifornimenti, capo mezzi, libretti export.
- Conseguenza operativa:
  - dopo il prompt 42 il backlog esecutivo risulta chiuso solo sul fronte `no mount finale madre`;
  - la parita esterna e l'autonomia reale NEXT restano aperte.
- Stato area NEXT coinvolta: `AUDIT FINALE NEGATIVO SULL'AUTONOMIA`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI

## 5.86 Aggiornamento 2026-03-30 - Chiusura gap moduli parziali post audit 43
- Fonte esecutiva del run: `docs/audit/BACKLOG_GAP_PARZIALI_EXECUTION.md`.
- Il run non riapre i moduli `DA VERIFICARE` e non riapre il tema `mount finale madre`.
- Gap `PARZIALI` chiusi davvero nel perimetro target:
  - `Inventario`: add/edit/delete, quantita, foto e PDF ora sono nativi NEXT e locali al clone.
  - `Materiali consegnati / blocchi materiali`: registra consegna, delete con ripristino stock e PDF ora sono nativi NEXT e locali al clone.
  - `Mezzi`: `/next/mezzi` non usa piu la pagina parcheggiata con salvataggi bloccati; save/delete/foto/libretto ora lavorano nel clone.
  - `Capo costi`: il PDF timbrato non chiama piu `stamp_pdf` reale; l'anteprima timbrata e locale al clone.
  - `Procurement`, `Lavori`, `Colleghi`, `Fornitori`, `IA documentale/libretti`, `Cisterna`, `Autisti`, `Autisti inbox/admin`: verificati come superfici NEXT chiudibili nel metodo madre->clone, con flussi esterni coerenti e scritture solo locali al clone.
- Stato dei moduli ex `PARZIALI` nel backlog di questo run:
  - `CHIUSO`.
- Limite esplicito che resta vero:
  - questa chiusura non promuove automaticamente la NEXT a `autonoma`, perche i moduli `DA VERIFICARE` restano fuori dal presente run.
- Stato area NEXT coinvolta: `GAP PARZIALI CHIUSI`
- Aggiornato `REGISTRO_MODIFICHE_CLONE.md`? SI

## 5.87 Aggiornamento 2026-03-30 - Audit finale del bucket `DA VERIFICARE`
- Fonte audit finale: `docs/audit/AUDIT_FINALE_DA_VERIFICARE_NEXT_AUTONOMA.md`.
- Il bucket `DA VERIFICARE` viene chiuso in modo netto, senza patch runtime e senza riaprire i moduli gia chiusi nei prompt 42-44.
- Esito modulo per modulo:
  - `Home` -> `APERTO`
  - `Centro di Controllo` -> `CHIUSO`
  - `Dossier Lista` -> `CHIUSO`
  - `Dossier Gomme` -> `CHIUSO`
  - `Dossier Rifornimenti` -> `CHIUSO`
  - `Capo Mezzi` -> `CHIUSO`
  - `Libretti Export` -> `APERTO`
- Fatti confermati dall'audit:
  - nessuno dei moduli auditati monta la madre come runtime finale;
  - `Centro di Controllo`, `Dossier Lista`, `Dossier Gomme`, `Dossier Rifornimenti` e `Capo Mezzi` hanno parity esterna dimostrabile nel repo sopra layer NEXT coerenti;
  - `Home` resta aperto perche i flussi principali madre-like vivono ancora su boundary legacy-shaped e overlay clone-only locali;
  - `Libretti Export` resta aperto perche la UI esterna NEXT non replica la superficie madre e il domain dichiara ancora limiti clone-only.
- Verdetto finale conseguente:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Stato area NEXT coinvolta: `AUDIT FINALE NEGATIVO SULL'AUTONOMIA`

## 5.88 Aggiornamento 2026-03-30 - Chiusura execution degli ultimi 2 moduli aperti
- Fonte esecutiva del run: `docs/audit/BACKLOG_ULTIMI_2_APERTI_EXECUTION.md`.
- Questo run lavora solo su:
  - `Home`
  - `Libretti Export`
- `Home` chiusa davvero nel clone:
  - `/next` non usa piu `NextLegacyStorageBoundary`;
  - `src/next/NextHomePage.tsx` monta direttamente `src/next/NextCentroControlloPage.tsx`;
  - la modale eventi autisti della Home usa ora `src/next/components/NextHomeAutistiEventoModal.tsx`, controparte NEXT clone-safe che mantiene dettaglio, PDF, foto e collegamento al dettaglio lavoro clone senza leggere o scrivere tramite `storageSync`.
- `Libretti Export` chiusa davvero nel clone:
  - `src/next/NextLibrettiExportPage.tsx` replica di nuovo la superficie madre con header, gruppi per categoria, card selezionabili e anteprima PDF;
  - la route continua a leggere da `src/next/domain/nextLibrettiExportDomain.ts` e a generare l'anteprima via `generateNextLibrettiExportPreview()`;
  - il domain non dichiara piu come bloccate condivisione, copia link e WhatsApp, perche la pagina NEXT le supporta davvero.
- Stato dei moduli ex `APERTO` in questo run:
  - `Home` -> `APERTO`
  - `Libretti Export` -> `CHIUSO`
- Limite esplicito:
  - questo run chiude gli ultimi 2 moduli aperti in execution, ma non auto-certifica la NEXT come `autonoma sul perimetro target`; il verdetto resta materia di audit separato.
- Stato area NEXT coinvolta: `ULTIMI 2 MODULI APERTI CHIUSI IN EXECUTION`

## 5.89 Aggiornamento 2026-03-30 - Audit finale conclusivo dell'intero perimetro target
- Fonte audit finale: `docs/audit/AUDIT_FINALE_CONCLUSIVO_NEXT_AUTONOMA.md`.
- Il perimetro target e stato ri-auditato modulo per modulo dopo i prompt 42-46.
- Fatti confermati dall'audit:
  - le route ufficiali NEXT del perimetro target non montano `NextMotherPage`, `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale;
  - `Home` e `Libretti Export` non possono essere letti come chiusi in blocco: `Libretti Export` resta chiuso nel run 46, `Home` viene riaperto dall'audit post execution successivo per un gap di parity ancora presente;
  - il worktree corrente della madre risulta pulito su `src/pages`, `src/autisti`, `src/autistiInbox`.
- Aggiornamento sul gap Home:
  - il punto specifico delle suggestioni autista e stato riallineato al criterio madre `sessioni + mezzi`, quindi il delta mirato risulta risolto nel clone.
- Moduli confermati `CHIUSO`:
  - Home, Centro di Controllo, Mezzi, Dossier Lista, Dossier Mezzo, Dossier Gomme, Dossier Rifornimenti, Gestione Operativa, Inventario, Materiali consegnati, Materiali da ordinare, Acquisti / Ordini / Preventivi / Listino, Lavori, Capo Mezzi, Capo Costi, IA Home, IA Libretto, IA Documenti, IA Copertura Libretti, Libretti Export, Cisterna, Cisterna IA, Cisterna Schede Test, Colleghi, Fornitori, Autisti Inbox / Admin.
- Moduli confermati `APERTO`:
  - `IA API Key`: la pagina NEXT blocca ancora il salvataggio della chiave e rimanda la scrittura alla madre.
  - `Autisti`: la home clone-safe blocca ancora il salvataggio del modale `Gomme`.
- Moduli `DA VERIFICARE`:
  - nessuno.
- Verdetto finale netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Stato area NEXT coinvolta: `AUDIT FINALE CONCLUSIVO NEGATIVO`

## 5.90 Aggiornamento 2026-03-30 - Chiusura execution dei 3 gap finali riaperti
- Fonte esecutiva del run: `docs/audit/BACKLOG_3_GAP_FINALI_EXECUTION.md`.
- Questo run lavora solo su:
  - `IA API Key`
  - `Autisti`
  - `Gestione Operativa`
- `IA API Key` chiusa davvero nel clone:
  - `src/next/NextIAApiKeyPage.tsx` non mostra piu il blocco `disponibile solo nella madre`;
  - il save usa ora il writer NEXT `saveNextIaConfigSnapshot()` sopra `@impostazioni_app/gemini`, con merge coerente alla madre.
- `Autisti` chiuso davvero sul gap reale residuo:
  - `src/next/autisti/NextAutistiCloneLayout.tsx` non intercetta piu il `SALVA` del modale `Gomme`;
  - `src/next/autisti/nextAutistiCloneRuntime.ts` non dichiara piu il notice `gomme-salvataggio-bloccato`;
  - il salvataggio gomme segue ora il flusso utile del clone senza blocco artificiale.
- `Gestione Operativa` chiusa davvero sul mismatch strutturale:
  - `src/next/NextGestioneOperativaPage.tsx` non re-esporta piu il workbench con viste incorporate;
  - la route `/next/gestione-operativa` torna a essere un hub madre-like che apre i moduli figli uno alla volta con la loro pagina dedicata.
- Stato dei 3 gap finali in questo run:
  - `IA API Key` -> `CHIUSO`
  - `Autisti` -> `CHIUSO`
  - `Gestione Operativa` -> `CHIUSO`
- Limite esplicito:
  - questa sezione chiude l'execution dei 3 gap reali finali;
  - il verdetto `NEXT autonoma SI/NO` non viene promosso qui e resta demandato a un audit separato.
- Stato area NEXT coinvolta: `3 GAP FINALI CHIUSI IN EXECUTION`

## 5.91 Aggiornamento 2026-03-30 - Riallineamento Manutenzioni e formato date visibile NEXT
- Fonte esecutiva del run: `docs/audit/BACKLOG_MANUTENZIONI_DATEFORMAT_EXECUTION.md`.
- Questo run lavora solo su:
  - `Manutenzioni`
  - formato data visibile in `src/next/**`
- `Manutenzioni` chiusa sul gap reale emerso da prova visiva:
  - `src/next/domain/nextManutenzioniDomain.ts` usa ora un parser date NEXT con priorita esplicita su `gg mm aaaa`;
  - lo storico globale non scarta piu le righe senza targa;
  - `src/next/NextManutenzioniPage.tsx` legge lo storico dal domain dedicato e non da snapshot globale di supporto.
- Formato data NEXT chiuso:
  - le date visibili del clone usano ora `gg mm aaaa`;
  - i timestamp visibili usano `gg mm aaaa HH:mm`;
  - i pochi `input type="date"` rimasti servono solo come picker nativi nascosti con `aria-hidden="true"`, quindi la data ISO non e visibile in UI.
- Stato dei 2 problemi di questo run:
  - `Manutenzioni` -> `CHIUSO`
  - `Formato data NEXT` -> `CHIUSO`
- Limite esplicito:
  - il confronto live del dataset remoto `storage/@manutenzioni` non e validabile da CLI nel contesto corrente per `permission-denied`;
  - la chiusura di questo run e quindi basata su codice reale NEXT, parser/sort/filter e sweep UI visibile.
- Stato area NEXT coinvolta: `MANUTENZIONI E DATEFORMAT NEXT CHIUSI IN EXECUTION`

## 6. Regole di aggiornamento per il nuovo corso
Per ogni task futuro che tocca la NEXT bisogna aggiornare questo documento segnando almeno:
1. cosa del clone e stato archiviato, creato o modificato;
2. quali schermate madre sono gia state replicate in `read-only`;
3. come sono state bloccate le scritture;
4. quali letture reali sono gia state mantenute;
5. quali parti restano ancora fuori dal clone;
6. aggiungere anche la voce corrispondente in `docs/product/REGISTRO_MODIFICHE_CLONE.md`.
7. se il task tocca il sottosistema IA interno, aggiornare anche `docs/product/CHECKLIST_IA_INTERNA.md`.

## 7. Stato documento
- **STATO: CURRENT**

## 5.92 Aggiornamento 2026-03-30 - Audit post execution Home
- Fonte audit: `docs/audit/AUDIT_HOME_POST_EXECUTION.md`.
  - Verifica sul codice reale:
    - `Home` sulla route `/next` monta `src/next/NextHomePage.tsx` e `src/next/NextCentroControlloPage.tsx`, non `NextMotherPage`;
    - `Home` legge i dataset reali della madre tramite `nextCentroControlloDomain` e `nextAutistiDomain`;
    - non restano overlay clone-only locali della `Home` su alert, mezzi o eventi;
    - il pannello extra `D03 autisti`, non presente nella madre, e stato rimosso dalla UI;
    - resta pero un gap reale di parity nelle suggestioni autista, che in NEXT includono ancora `autistiSnapshot.assignments` oltre a `sessioni` e `mezzi`.
  - Stato aggiornato del modulo:
    - `Home` -> `APERTO`
  - Motivo:
    - la `Home` e ora molto piu fedele come copia `read-only`, ma non e ancora una replica 1:1 della madre sui suggerimenti autista; il blocco scritture e corretto, la parity esterna completa no.

## 5.93 Aggiornamento 2026-03-30 - Audit finale separato `Home`
- Fonte audit finale: `docs/audit/AUDIT_HOME_FINAL.md`.
- Verifica sul codice reale:
  - la route `/next` monta `src/next/NextHomePage.tsx` -> `src/next/NextCentroControlloPage.tsx`, senza `NextMotherPage` o runtime finale madre;
  - le suggestioni autista sono ora allineate alla madre e usano solo `sessioni` + `mezzi`;
  - i dataset letti dalla `Home` NEXT restano quelli reali della madre tramite `nextCentroControlloDomain` e `readNextUnifiedStorageDocument()`;
  - non risultano overlay clone-only locali della `Home` su alert, mezzi o eventi.
- Gap reali residui confermati:
  - `NextHomeAutistiEventoModal.tsx` non replica in modo 1:1 la superficie madre del modal eventi: le CTA scriventi madre vengono sostituite da testo read-only o dal solo bottone `APRI DETTAGLIO CLONE`;
  - i tre modali data della NEXT non replicano i testi visibili della madre su placeholder e validazione (`gg mm aaaa` vs `gg mm aaaa oppure YYYY-MM-DD`).
- Stato aggiornato del modulo:
  - `Home` -> `APERTO`
- Motivo:
  - la prova manca solo su parity visibile completa della UI/modali;
  - non manca la prova del routing, dei dati reali o del blocco scritture.

## 5.91 Aggiornamento 2026-03-30 - Home NEXT riallineata al read-only fedele senza overlay clone-only
- Fonte execution del run: `docs/audit/BACKLOG_HOME_EXECUTION.md`.
- Perimetro stretto del task:
  - `Home` su `/next`
  - senza toccare `src/pages/Home.tsx`
  - senza introdurre scritture business reali
- Riallineamenti applicati:
  - `src/next/domain/nextCentroControlloDomain.ts` legge ora i dataset reali della madre (`@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`) direttamente dal reader unificato NEXT, senza riassorbire overlay locali della `Home`;
  - `src/next/NextCentroControlloPage.tsx` non persiste piu ack alert, prenotazioni collaudo, pre-collaudi, revisioni o luogo rimorchio in stato clone-only locale;
  - le stesse azioni restano visibili ma sono bloccate in modo esplicito come read-only;
  - la `Home` non mostra piu il pannello aggiuntivo `D03 autisti`, assente nella madre;
  - `src/next/domain/nextAutistiDomain.ts` supporta ora una lettura della `Home` senza overlay storage locali e senza segnali clone-only.
- Stato conseguente del modulo:
  - `Home` resta `APERTO`
- Motivo del mancato `CHIUSO`:
  - la lettura dati e ora piu fedele alla madre e meno clone-only;
  - i flussi utili che nella madre scrivono davvero restano necessariamente bloccati nel clone read-only, quindi la parity esterna completa non e ancora promuovibile a `CHIUSO`.

## 5.94 Aggiornamento 2026-03-30 - Loop modulo `Home` chiuso con audit PASS
- Fonte execution: `docs/audit/BACKLOG_home.md`.
- Fonte audit separato: `docs/audit/AUDIT_home_LOOP.md`.
- Verifica sul codice reale:
  - `/next` continua a montare `src/next/NextHomePage.tsx` e `src/next/NextCentroControlloPage.tsx`, senza `NextMotherPage` o runtime finale madre;
  - `src/next/components/NextHomeAutistiEventoModal.tsx` ripristina la superficie madre delle CTA `CREA LAVORO` / `GIÀ CREATO` e `IMPORTA IN DOSSIER`;
  - `src/next/NextCentroControlloPage.tsx` ripristina placeholder e validazioni visibili madre nei tre modali data (`gg mm aaaa oppure YYYY-MM-DD`);
  - la `Home` continua a leggere gli stessi dataset reali della madre tramite `readNextUnifiedStorageDocument()` nel layer `nextCentroControlloDomain`;
  - le scritture restano bloccate in modo esplicito su alert, luogo rimorchio, prenotazione collaudo, pre-collaudo, revisione, creazione lavoro e import dossier.
- Stato aggiornato del modulo:
  - `Home` -> `CHIUSO`
- Limite esplicito:
  - questa chiusura vale solo per il modulo `Home` nel loop corrente;
  - non promuove automaticamente la NEXT a sostituta della madre.

## 5.95 Aggiornamento 2026-03-30 - Loop modulo `Centro di Controllo` chiuso con audit PASS
- Fonte execution: `docs/audit/BACKLOG_centro-di-controllo.md`.
- Fonte audit separato: `docs/audit/AUDIT_centro-di-controllo_LOOP.md`.
- Verifica sul codice reale:
  - `/next/centro-controllo` monta `src/next/NextCentroControlloParityPage.tsx`, non `NextMotherPage`;
  - il runtime ufficiale non usa piu overlay storage o clone locale del reader autisti;
  - il runtime ufficiale non usa piu patch clone-only dell'anagrafica flotta;
  - le date visibili tornano al formato madre `dd/mm/yyyy`;
  - PDF, tabs, tabelle e filtri restano coerenti con la madre.
- Stato aggiornato del modulo:
  - `Centro di Controllo` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Centro di Controllo` nel loop corrente;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.96 Aggiornamento 2026-03-30 - Loop fermato su `Mezzi` con audit FAIL
- Fonte execution del ciclo: `docs/audit/BACKLOG_mezzi.md`.
- Fonte audit separato: `docs/audit/AUDIT_mezzi_LOOP.md`.
- Verifica sul codice reale:
  - `/next/mezzi` monta `src/next/NextMezziPage.tsx`, quindi la route ufficiale e NEXT autonoma;
  - il runtime ufficiale resta pero un editor clone-local: dichiara salvataggi locali al clone, usa `upsertNextFlottaClonePatch()` / `markNextFlottaCloneDeleted()` e gestisce libretto/foto come stato locale;
  - la lettura ufficiale usa ancora `readNextAnagraficheFlottaSnapshot()` con patch clone-only abilitate di default.
- Stato aggiornato del modulo:
  - `Mezzi` -> `FAIL`
- Motivo:
  - il modulo non replica la madre come clone read-only fedele;
  - il gap e strutturale e non chiudibile onestamente nel budget residuo di questo run.

## 5.97 Aggiornamento 2026-03-31 - Loop modulo `Mezzi` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_mezzi.md`.
- Fonte audit separato: `docs/audit/AUDIT_mezzi_LOOP.md`.
- Verifica sul codice reale:
  - `/next/mezzi` continua a montare `src/next/NextMezziPage.tsx`, non `NextMotherPage` o `src/pages/Mezzi.tsx`;
  - `src/next/NextMezziPage.tsx` replica ora la superficie madre di `Mezzi` su foto, blocco `LIBRETTO (IA)`, form completo, CTA visibili e lista per categoria;
  - il runtime ufficiale legge i dataset reali della madre tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`;
  - `src/next/nextAnagraficheFlottaDomain.ts` non applica piu patch clone-only per default: il reader resta read-only safe salvo richiesta esplicita del chiamante;
  - `handleSave()`, `handleDelete()` e `handleAnalyzeLibrettoWithIA()` mantengono la UI madre ma bloccano il comportamento con messaggio read-only esplicito;
  - il runtime ufficiale non usa piu `upsertNextFlottaClonePatch()` o `markNextFlottaCloneDeleted()`.
- Stato aggiornato del modulo:
  - `Mezzi` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Mezzi` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Dossier Lista`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.98 Aggiornamento 2026-03-31 - Loop modulo `Dossier Lista` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_dossier-lista.md`.
- Fonte audit separato: `docs/audit/AUDIT_dossier-lista_LOOP.md`.
- Verifica sul codice reale:
  - `/next/dossiermezzi` monta `src/next/NextDossierListaPage.tsx`, non `NextMotherPage` o `src/pages/DossierLista.tsx`;
  - `src/next/NextDossierListaPage.tsx` replica la superficie madre di `Dossier Lista` su titolo, categorie, card mezzo, placeholder foto e flusso pratico `categorie -> mezzi -> dossier`;
  - il runtime ufficiale legge `@mezzi_aziendali` tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi senza overlay clone-only impliciti;
  - il click sulle card usa `/next/dossiermezzi/:targa`, alias NEXT coerente con il flusso madre e montato su `NextDossierMezzoPage`;
  - il modulo non espone scritture, modali operativi o PDF da riallineare.
- Stato aggiornato del modulo:
  - `Dossier Lista` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Dossier Lista` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Dossier Mezzo`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.99 Aggiornamento 2026-03-31 - Loop modulo `Dossier Mezzo` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_dossier-mezzo.md`.
- Fonte audit separato: `docs/audit/AUDIT_dossier-mezzo_LOOP.md`.
- Verifica sul codice reale:
  - `/next/dossier/:targa` monta `src/next/NextDossierMezzoPage.tsx`, non `NextMotherPage` o `src/pages/DossierMezzo.tsx`;
  - `src/next/NextDossierMezzoPage.tsx` replica la superficie madre su header, dati tecnici, foto, lavori, manutenzioni, materiali, rifornimenti, preventivi/fatture, modali e anteprima PDF;
  - il runtime ufficiale legge il composite `readNextDossierMezzoCompositeSnapshot()` sopra layer NEXT puliti;
  - il bottone `Elimina` dei preventivi non nasconde piu documenti localmente nel clone, ma blocca l'azione con messaggio read-only esplicito;
  - il runtime ufficiale non usa piu overlay clone-only per alterare la lista visibile dei documenti.
- Stato aggiornato del modulo:
  - `Dossier Mezzo` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Dossier Mezzo` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Dossier Gomme`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.100 Aggiornamento 2026-03-31 - Loop modulo `Dossier Gomme` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_dossier-gomme.md`.
- Fonte audit separato: `docs/audit/AUDIT_dossier-gomme_LOOP.md`.
- Verifica sul codice reale:
  - `/next/dossier/:targa/gomme` monta `src/next/NextDossierGommePage.tsx`, non `NextMotherPage` o `src/pages/DossierGomme.tsx`;
  - `src/next/NextDossierGommePage.tsx` replica la superficie madre su header, CTA di ritorno, titolo mezzo, cards statistiche, storico e grafici;
  - il runtime ufficiale usa `NextGommeEconomiaSection` con `dataScope="legacy_parity"`, quindi mostra solo i record `manutenzione_derivata`, cioe la stessa sorgente visibile usata dalla madre;
  - il layer NEXT gomme resta read-only e strutturato, ma il dossier ufficiale non espone piu eventi extra-manutenzione che altererebbero la parity esterna del modulo;
  - il modulo non espone scritture, modali operativi o PDF da riallineare.
- Stato aggiornato del modulo:
  - `Dossier Gomme` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Dossier Gomme` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Dossier Rifornimenti`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.101 Aggiornamento 2026-03-31 - Loop modulo `Dossier Rifornimenti` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_dossier-rifornimenti.md`.
- Fonte audit separato: `docs/audit/AUDIT_dossier-rifornimenti_LOOP.md`.
- Verifica sul codice reale:
  - `/next/dossier/:targa/rifornimenti` monta `src/next/NextDossierRifornimentiPage.tsx`, non `NextMotherPage` o `src/pages/DossierRifornimenti.tsx`;
  - `src/next/NextDossierRifornimentiPage.tsx` replica la superficie madre su header, CTA di ritorno, riepilogo, ultimi rifornimenti e grafici interattivi;
  - il runtime ufficiale usa `NextRifornimentiEconomiaSection` con `dataScope="legacy_parity"`, quindi esclude i record `solo_campo` e mantiene il perimetro dati visibile della madre;
  - il layer NEXT D04 resta read-only e strutturato, ma il dossier ufficiale non espone piu append di record solo feed campo che altererebbero la parity esterna del modulo;
  - il modulo non espone scritture, modali operativi o PDF da riallineare.
- Stato aggiornato del modulo:
  - `Dossier Rifornimenti` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Dossier Rifornimenti` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Inventario`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.102 Aggiornamento 2026-03-31 - Loop modulo `Inventario` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_inventario.md`.
- Fonte audit separato: `docs/audit/AUDIT_inventario_LOOP.md`.
- Verifica sul codice reale:
  - `/next/inventario` monta `src/next/NextInventarioPage.tsx`, non `NextMotherPage` o `src/pages/Inventario.tsx`;
  - `src/next/NextInventarioPage.tsx` replica la superficie madre su header, CTA PDF, form, suggerimenti fornitore, lista articoli, controlli quantita, modale modifica e modale `Anteprima PDF`;
  - il runtime ufficiale legge `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - `handleAdd()`, `handleDelete()`, `handleSaveEdit()` e i blocchi qty/foto mantengono la UI madre ma bloccano il comportamento con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu `upsertNextInventarioCloneRecord()` o `markNextInventarioCloneDeleted()`.
- Stato aggiornato del modulo:
  - `Inventario` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Inventario` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Materiali consegnati`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.103 Aggiornamento 2026-03-31 - Loop modulo `Materiali consegnati` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_materiali_consegnati.md`.
- Fonte audit separato: `docs/audit/AUDIT_materiali_consegnati_LOOP.md`.
- Verifica sul codice reale:
  - `/next/materiali-consegnati` monta `src/next/NextMaterialiConsegnatiPage.tsx`, non `NextMotherPage` o `src/pages/MaterialiConsegnati.tsx`;
  - `src/next/NextMaterialiConsegnatiPage.tsx` replica la superficie madre su header, CTA PDF, form nuova consegna, suggerimenti destinatario/materiale, lista destinatari, dettaglio storico e modale `Anteprima PDF`;
  - il runtime ufficiale legge `@materialiconsegnati` tramite `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - il runtime ufficiale legge anche `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })` e usa la flotta reale per mezzi/colleghi sopra layer NEXT puliti;
  - `handleAdd()` e `handleDeleteConsegna()` mantengono la UI madre ma bloccano il comportamento con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu `appendNextMaterialiMovimentiCloneRecord()`, `markNextMaterialiMovimentiCloneDeleted()` o `upsertNextInventarioCloneRecord()`.
- Stato aggiornato del modulo:
  - `Materiali consegnati` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Materiali consegnati` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Materiali da ordinare`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.104 Aggiornamento 2026-03-31 - Loop modulo `Materiali da ordinare` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_materiali-da-ordinare.md`.
- Fonte audit separato: `docs/audit/AUDIT_materiali-da-ordinare_LOOP.md`.
- Verifica sul codice reale:
  - `/next/materiali-da-ordinare` monta `src/next/NextMaterialiDaOrdinarePage.tsx`, non `NextMotherPage` o `src/pages/MaterialiDaOrdinare.tsx`;
  - `src/next/NextMaterialiDaOrdinarePage.tsx` replica la superficie madre su header, tab, form fabbisogni, tabella materiali, sticky action bar e modale placeholder;
  - il runtime ufficiale legge `@fornitori` tramite `readNextFornitoriSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - `Carica foto`, `Carica preventivo`, `Aggiungi materiale` e `CONFERMA ORDINE` mantengono la UI madre ma bloccano il comportamento con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu `appendNextProcurementCloneOrder()`, editor locali, preventivi locali o PDF clone-only.
- Stato aggiornato del modulo:
  - `Materiali da ordinare` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Materiali da ordinare` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Acquisti / Ordini / Preventivi / Listino`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.105 Aggiornamento 2026-03-31 - Loop gruppo `Acquisti / Ordini / Preventivi / Listino` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_acquisti-ordini-preventivi-listino.md`.
- Fonte audit separato: `docs/audit/AUDIT_acquisti-ordini-preventivi-listino_LOOP.md`.
- Verifica sul codice reale:
  - `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati` e `/next/dettaglio-ordine/:ordineId` montano route NEXT autonome, non `NextMotherPage` o `src/pages/Acquisti.tsx`;
  - `src/next/NextProcurementStandalonePage.tsx` legge il gruppo tramite `readNextProcurementSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nel runtime ufficiale;
  - `src/next/NextProcurementReadOnlyPanel.tsx` replica la stessa superficie read-only della madre su header, tab, liste, dettaglio ordine e schede bloccate;
  - le azioni scriventi restano visibili ma disabilitate con motivazione read-only esplicita;
  - il runtime ufficiale non usa piu `upsertNextProcurementCloneOrder()`, editor locali, materiali clone-only o PDF locali.
- Stato aggiornato del modulo:
  - `Acquisti / Ordini / Preventivi / Listino` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il gruppo `Acquisti / Ordini / Preventivi / Listino` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Lavori`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.106 Aggiornamento 2026-03-31 - Loop modulo `Lavori` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_lavori.md`.
- Fonte audit separato: `docs/audit/AUDIT_lavori_LOOP.md`.
- Verifica sul codice reale:
  - `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti` e `/next/dettagliolavori/:lavoroId` montano runtime NEXT autonomi, non `NextMotherPage` o `src/pages/**`;
  - `src/next/NextLavoriDaEseguirePage.tsx` replica la superficie madre su header, form, suggerimenti, pulsanti urgenza, lista temporanea e CTA visibili;
  - `src/next/NextLavoriInAttesaPage.tsx` e `src/next/NextLavoriEseguitiPage.tsx` replicano la superficie madre su ricerca targa, accordion mezzi/magazzino, PDF e ritorno;
  - `src/next/NextDettaglioLavoroPage.tsx` replica la superficie madre su cards, pulsanti `MODIFICA` / `ELIMINA` / `ESEGUI` e modali principali;
  - il runtime ufficiale legge `@lavori` tramite `readNextLavoriInAttesaSnapshot({ includeCloneOverlays: false })`, `readNextLavoriEseguitiSnapshot({ includeCloneOverlays: false })` e `readNextDettaglioLavoroSnapshot(..., { includeCloneOverlays: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - `AGGIUNGI`, `SALVA GRUPPO LAVORI`, `ELIMINA` e i due `Salva` dei modali restano visibili ma bloccano il comportamento con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu `appendNextLavoriCloneRecords()`, `upsertNextLavoriCloneOverride()` o `markNextLavoriCloneDeleted()`.
- Stato aggiornato del modulo:
  - `Lavori` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Lavori` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Capo Mezzi`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.107 Aggiornamento 2026-03-31 - Loop modulo `Capo Mezzi` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_capo-mezzi.md`.
- Fonte audit separato: `docs/audit/AUDIT_capo-mezzi_LOOP.md`.
- Verifica sul codice reale:
  - `/next/capo/mezzi` monta `src/next/NextCapoMezziPage.tsx`, non `NextMotherPage` o `src/pages/CapoMezzi.tsx`;
  - `src/next/NextCapoMezziPage.tsx` replica la superficie madre su header, ricerca, gruppi categoria, card mezzo, costi reali, potenziale e badge dati;
  - il runtime ufficiale legge il riepilogo costi tramite `readNextCapoMezziSnapshot({ includeCloneDocuments: false })`, quindi senza documenti clone-only locali nel modulo ufficiale;
  - il modulo resta di sola lettura e non espone writer business o clone-only.
- Stato aggiornato del modulo:
  - `Capo Mezzi` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Capo Mezzi` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Capo Costi`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.108 Aggiornamento 2026-03-31 - Loop modulo `Capo Costi` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_capo-costi.md`.
- Fonte audit separato: `docs/audit/AUDIT_capo-costi_LOOP.md`.
- Verifica sul codice reale:
  - `/next/capo/costi/:targa` monta `src/next/NextCapoCostiMezzoPage.tsx`, non `NextMotherPage` o `src/pages/CapoCostiMezzo.tsx`;
  - `src/next/NextCapoCostiMezzoPage.tsx` replica la superficie madre su header, filtri, KPI, approvazioni preventivi, tabs, lista documenti e preview PDF;
  - il runtime ufficiale legge il dettaglio tramite `readNextCapoCostiMezzoSnapshot(targa, { includeCloneApprovals: false, includeCloneDocuments: false })`, quindi senza overlay clone-only su approvazioni o documenti nel modulo ufficiale;
  - `APPROVA`, `RIFIUTA`, `DA VALUTARE` e `ANTEPRIMA TIMBRATO` restano visibili ma bloccano il comportamento con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu `upsertNextCapoCloneApproval()` e non genera PDF timbrati clone-side.
- Stato aggiornato del modulo:
  - `Capo Costi` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Capo Costi` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `IA Home`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.109 Aggiornamento 2026-03-31 - Loop modulo `IA Home` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_ia-home.md`.
- Fonte audit separato: `docs/audit/AUDIT_ia-home_LOOP.md`.
- Verifica sul codice reale:
  - `/next/ia` monta `src/next/NextIntelligenzaArtificialePage.tsx`, non `NextMotherPage` o `src/pages/IA/IAHome.tsx`;
  - `src/next/NextIntelligenzaArtificialePage.tsx` replica la superficie madre su hero, badge API key, card strumenti attivi e card `In arrivo`;
  - il runtime ufficiale legge lo stesso documento `@impostazioni_app/gemini` tramite `readNextIaConfigSnapshot()`;
  - il modulo non espone scritture reali o clone-only.
- Stato aggiornato del modulo:
  - `IA Home` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `IA Home` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `IA API Key`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.110 Aggiornamento 2026-03-31 - Loop modulo `IA API Key` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_ia-apikey.md`.
- Fonte audit separato: `docs/audit/AUDIT_ia-apikey_LOOP.md`.
- Verifica sul codice reale:
  - `/next/ia/apikey` monta `src/next/NextIAApiKeyPage.tsx`, non `NextMotherPage` o `src/pages/IA/IAApiKey.tsx`;
  - `src/next/NextIAApiKeyPage.tsx` replica la superficie madre su header, banner, input, toggle, pulsanti e nota finale;
  - il runtime ufficiale legge lo stesso documento `@impostazioni_app/gemini` tramite `readNextIaConfigSnapshot()`;
  - `saveNextIaConfigSnapshot()` non scrive piu in Firestore e rilancia un blocco read-only esplicito;
  - `Salva chiave` resta visibile ma blocca il comportamento con messaggio read-only esplicito.
- Stato aggiornato del modulo:
  - `IA API Key` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `IA API Key` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `IA Libretto`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.111 Aggiornamento 2026-03-31 - Loop modulo `IA Libretto` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_ia-libretto.md`.
- Fonte audit separato: `docs/audit/AUDIT_ia-libretto_LOOP.md`.
- Verifica sul codice reale:
  - `/next/ia/libretto` monta `src/next/NextIALibrettoPage.tsx`, non `NextMotherPage` o `src/pages/IA/IALibretto.tsx`;
  - `src/next/NextIALibrettoPage.tsx` replica la superficie madre su header, step, upload, pulsanti, archivio libretti e viewer modale;
  - il runtime ufficiale legge gli stessi documenti reali della madre tramite `readNextIaConfigSnapshot()` su `@impostazioni_app/gemini` e il nuovo reader `readNextIaLibrettoArchiveSnapshot()` su `storage/@mezzi_aziendali`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, handoff IA dedicato, facade preview locale o `upsertNextFlottaClonePatch()`;
  - `Analizza con IA` e `Salva nei documenti del mezzo` restano visibili ma bloccano il comportamento con messaggi read-only espliciti, senza Cloud Run, upload Storage, `setItemSync()` o patch clone-only.
- Stato aggiornato del modulo:
  - `IA Libretto` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `IA Libretto` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `IA Documenti`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.112 Aggiornamento 2026-03-31 - Loop modulo `IA Documenti` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_ia-documenti.md`.
- Fonte audit separato: `docs/audit/AUDIT_ia-documenti_LOOP.md`.
- Verifica sul codice reale:
  - `/next/ia/documenti` monta `src/next/NextIADocumentiPage.tsx`, non `NextMotherPage` o `src/pages/IA/IADocumenti.tsx`;
  - `src/next/NextIADocumentiPage.tsx` replica la superficie madre su caricamento, anteprima, risultati analisi, archivio documenti salvati e modale valuta;
  - il runtime ufficiale legge gli stessi dati reali della madre tramite `readNextIaConfigSnapshot()` su `@impostazioni_app/gemini`, `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })` su `@documenti_*` e `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })` su `@mezzi_aziendali`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, preview legacy, handoff IA dedicato, `upsertNextInternalAiCloneDocumento()` o `upsertNextInventarioCloneRecord()`;
  - `Analizza con IA`, `Salva Documento` e `Imposta valuta` restano visibili ma bloccano il comportamento con messaggi read-only espliciti, senza Cloud Function, Storage, Firestore o import inventario.
- Stato aggiornato del modulo:
  - `IA Documenti` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `IA Documenti` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `IA Copertura Libretti`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.113 Aggiornamento 2026-03-31 - Loop modulo `IA Copertura Libretti` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_ia-copertura-libretti.md`.
- Fonte audit separato: `docs/audit/AUDIT_ia-copertura-libretti_LOOP.md`.
- Verifica sul codice reale:
  - `/next/ia/copertura-libretti` monta `src/next/NextIACoperturaLibrettiPage.tsx`, non `NextMotherPage` o `src/pages/IA/IACoperturaLibretti.tsx`;
  - `src/next/NextIACoperturaLibrettiPage.tsx` replica la superficie madre su filtri, tabella copertura, area `Ripara libretti da lista ID` e debug DEV;
  - il runtime ufficiale legge `@mezzi_aziendali` tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, con parity madre-like anche sul caso `librettoStoragePath`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold` o `upsertNextFlottaClonePatch()`;
  - `ESEGUI RIPARAZIONE`, `Carica libretto` e `Ripara libretto` restano visibili ma bloccano il comportamento con messaggi read-only espliciti, senza upload, Storage, Firestore o patch locali.
- Stato aggiornato del modulo:
  - `IA Copertura Libretti` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `IA Copertura Libretti` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Libretti Export`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.114 Aggiornamento 2026-03-31 - Loop modulo `Libretti Export` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_libretti-export.md`.
- Fonte audit separato: `docs/audit/AUDIT_libretti-export_LOOP.md`.
- Verifica sul codice reale:
  - `/next/libretti-export` monta `src/next/NextLibrettiExportPage.tsx`, non `NextMotherPage` o `src/pages/LibrettiExport.tsx`;
  - il runtime ufficiale replica la superficie madre su header, toolbar, selezione per categoria, anteprima PDF e azioni di condivisione;
  - il modulo usa `readNextLibrettiExportSnapshot()` e `generateNextLibrettiExportPreview()` sopra `@mezzi_aziendali` in sola lettura, con preview PDF locale e fallback `librettoStoragePath`;
  - non risultano scritture business reali o clone-only nel runtime ufficiale.
- Stato aggiornato del modulo:
  - `Libretti Export` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Libretti Export` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Cisterna`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.115 Aggiornamento 2026-03-31 - Loop modulo `Cisterna` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_cisterna.md`.
- Fonte audit separato: `docs/audit/AUDIT_cisterna_LOOP.md`.
- Verifica sul codice reale:
  - `/next/cisterna` monta `src/next/NextCisternaPage.tsx`, non `NextMotherPage` o `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`;
  - `src/next/NextCisternaPage.tsx` replica la superficie madre su header, month picker, CTA visibili, archivio, `DOPPIO BOLLETTINO`, report mensile, targhe e dettaglio;
  - il runtime ufficiale legge gli stessi dati reali della madre tramite `readNextCisternaSnapshot(month, { includeCloneOverlays: false })` sopra `cisterna_documenti`, `cisterna_schede`, `cisterna_parametri_mensili` e `storage/@rifornimenti_autisti_tmp`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `jsPDF`, `jspdf-autotable`, `pdf.save(...)` o `upsertNextCisternaCloneParametro()`;
  - `Salva`, `Conferma scelta`, `Apri IA Cisterna`, `Scheda carburante`, `Apri/Modifica` ed `Esporta PDF` restano visibili ma bloccano il comportamento con messaggi read-only espliciti, senza scritture Firestore, patch locali o export locale.
- Stato aggiornato del modulo:
  - `Cisterna` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Cisterna` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Cisterna IA`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.116 Aggiornamento 2026-03-31 - Loop modulo `Cisterna IA` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_cisterna-ia.md`.
- Fonte audit separato: `docs/audit/AUDIT_cisterna-ia_LOOP.md`.
- Verifica sul codice reale:
  - `/next/cisterna/ia` monta `src/next/NextCisternaIAPage.tsx`, non `NextMotherPage` o `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`;
  - `src/next/NextCisternaIAPage.tsx` replica la superficie madre su header, note operative, upload, preview, pulsanti, risultato estrazione e campi del form;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `InternalAiUniversalHandoffBanner`, upload Storage, `extractCisternaDocumento()`, `addDoc()` o salvataggi clone-only;
  - `Analizza documento (IA)` e `Salva in archivio cisterna` restano visibili ma bloccano il comportamento con messaggi read-only espliciti, senza upload, IA reale o salvataggi su `@documenti_cisterna`.
- Stato aggiornato del modulo:
  - `Cisterna IA` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Cisterna IA` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Cisterna Schede Test`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.117 Aggiornamento 2026-03-31 - Loop fermato su `Cisterna Schede Test`
- Fonte analisi del ciclo: `docs/audit/BACKLOG_cisterna-schede-test.md`.
- Fonte audit preliminare: `docs/audit/AUDIT_cisterna-schede-test_LOOP.md`.
- Verifica sul codice reale:
  - `/next/cisterna/schede-test` monta `src/next/NextCisternaSchedeTestPage.tsx`, ma il runtime ufficiale resta ancora clone-specifico;
  - la pagina usa ancora `NextClonePageScaffold`, `upsertNextCisternaCloneScheda()` e messaggi espliciti di salvataggio locale del clone;
  - la controparte madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` resta molto piu ampia su crop, calibrazione, estrazione IA, modal, edit mode e conferma finale, quindi il gap non e piccolo.
- Stato aggiornato del modulo:
  - `Cisterna Schede Test` -> `APERTO`
- Limite esplicito:
  - il loop si ferma qui per budget operativo non sufficiente a chiudere onestamente il modulo corrente;
  - il prossimo run deve ripartire da `Cisterna Schede Test`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.118 Aggiornamento 2026-03-31 - Loop modulo `Cisterna Schede Test` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_cisterna-schede-test.md`.
- Fonte audit separato: `docs/audit/AUDIT_cisterna-schede-test_LOOP.md`.
- Verifica sul codice reale:
  - `/next/cisterna/schede-test` monta `src/next/NextCisternaSchedeTestPage.tsx`, non `NextMotherPage` o `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`;
  - `src/next/NextCisternaSchedeTestPage.tsx` replica la grammatica madre su header, month picker, archivio, `EDIT MODE`, tabs, inserimento manuale, crop/calibrazione, tabella IA, modal anteprima e `Riepilogo salvataggio`;
  - il runtime ufficiale legge gli stessi dati reali della madre tramite `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` e `readNextCisternaSchedaDetail(..., { includeCloneOverlays: false })`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `upsertNextCisternaCloneScheda()` o conferme di salvataggio clone-only;
  - `Precompila da Autisti (supporto)`, `Conferma e salva`, `Estrai da ritaglio`, `Estrai rapido (senza upload)`, `Salva ritaglio`, `Salva calibrazione` e `Conferma modifiche` restano visibili ma bloccano il comportamento con messaggi read-only espliciti.
- Stato aggiornato del modulo:
  - `Cisterna Schede Test` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Cisterna Schede Test` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Colleghi`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.119 Aggiornamento 2026-03-31 - `Colleghi` e `Fornitori` chiusi; `Autisti` resta aperto
- Fonti execution del ciclo:
  - `docs/audit/BACKLOG_colleghi.md`
  - `docs/audit/BACKLOG_fornitori.md`
  - `docs/audit/BACKLOG_autisti.md`
- Fonti audit del ciclo:
  - `docs/audit/AUDIT_colleghi_LOOP.md`
  - `docs/audit/AUDIT_fornitori_LOOP.md`
  - `docs/audit/AUDIT_autisti_LOOP.md`
- Verifica sul codice reale:
  - `/next/colleghi` monta `src/next/NextColleghiPage.tsx`, mantiene la UI pratica della madre e legge `storage/@colleghi` tramite `readNextColleghiSnapshot({ includeCloneOverlays: false })`;
  - `/next/fornitori` monta `src/next/NextFornitoriPage.tsx`, mantiene la UI pratica della madre e legge `storage/@fornitori` tramite `readNextFornitoriSnapshot({ includeCloneOverlays: false })`;
  - in entrambi i moduli `Aggiungi`, `Salva modifiche` ed `Elimina` restano visibili ma bloccano il comportamento con messaggi read-only espliciti; il PDF resta equivalente alla madre;
  - il pacchetto `/next/autisti/*` resta invece ancora clone-local su sessione, rifornimento, segnalazioni, richieste attrezzature, gomme e cambio mezzo, quindi non e stato chiuso in questo run.
- Stato aggiornato dei moduli:
  - `Colleghi` -> `CHIUSO`
  - `Fornitori` -> `CHIUSO`
  - `Autisti` -> `APERTO`
- Limite esplicito:
  - il prossimo modulo non `CLOSED` del tracker resta `Autisti`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.120 Aggiornamento 2026-03-31 - Loop modulo `Autisti Inbox / Admin` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_autisti-inbox-admin.md`.
- Fonte audit separato: `docs/audit/AUDIT_autisti-inbox-admin_LOOP.md`.
- Verifica sul codice reale:
  - `/next/autisti-inbox*` e `/next/autisti-admin` montano runtime NEXT ufficiali, non `src/autistiInbox/**` come mount finale;
  - `src/next/NextAutistiInboxHomePage.tsx` e `src/next/NextAutistiAdminPage.tsx` non espongono piu banner o summary clone-specifici estranei alla madre;
  - `src/next/autisti/nextAutistiStorageSync.ts` ignora overlay locali D03 anche nel perimetro ufficiale inbox/admin;
  - `src/next/autistiInbox/NextAutistiAdminNative.tsx` mantiene la stessa UI pratica della madre ma blocca in modo esplicito tutte le mutation su sessioni, storico, segnalazioni, richieste, gomme, rifornimenti, dossier e lavori;
  - lint e build risultano `OK`.
- Stato aggiornato del modulo:
  - `Autisti Inbox / Admin` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Autisti Inbox / Admin` nel loop corrente;
  - il prossimo modulo non `CLOSED` del tracker e `Manutenzioni`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.121 Aggiornamento 2026-03-31 - Loop fermato su `Manutenzioni`
- Fonte analisi del ciclo: `docs/audit/BACKLOG_manutenzioni.md`.
- Fonte audit preliminare: `docs/audit/AUDIT_manutenzioni_LOOP.md`.
- Verifica sul codice reale:
  - `/next/manutenzioni` monta `src/next/NextManutenzioniPage.tsx`, ma il runtime ufficiale resta uno scaffold clone-specifico;
  - `src/next/NextManutenzioniPage.tsx` usa ancora `NextClonePageScaffold` e una vista summary limitata;
  - la madre `src/pages/Manutenzioni.tsx` copre un perimetro molto piu ampio su form, inventario, movimenti materiali, modal gomme e PDF;
  - il gap non e riducibile con un micro-fix onesto nel budget residuo del run.
- Stato aggiornato del modulo:
  - `Manutenzioni` -> `APERTO`
- Limite esplicito:
  - il loop si ferma qui per budget operativo non sufficiente a chiudere onestamente il modulo corrente;
  - il prossimo run deve ripartire da `Manutenzioni`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.

## 5.122 Aggiornamento 2026-03-31 - Loop modulo `Manutenzioni` chiuso con audit PASS
- Fonte execution del ciclo: `docs/audit/BACKLOG_manutenzioni.md`.
- Fonte audit separato: `docs/audit/AUDIT_manutenzioni_LOOP.md`.
- Verifica sul codice reale:
  - `/next/manutenzioni` monta `src/next/NextManutenzioniPage.tsx`, non `NextMotherPage` o `src/pages/Manutenzioni.tsx`;
  - `src/next/NextManutenzioniPage.tsx` replica la superficie pratica della madre su form manutenzione, storico, materiali utilizzati, modal gomme e CTA principali;
  - il runtime ufficiale legge `@manutenzioni` e `@mezzi_aziendali` tramite `readNextManutenzioniWorkspaceSnapshot()` e legge `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `setItemSync`, `getItemSync`, writer clone-only o export PDF locale;
  - `Salva manutenzione`, `Elimina`, `Esporta PDF` e la conferma del modal gomme restano visibili ma bloccano il comportamento con messaggi read-only espliciti;
  - lint e build risultano `OK`.
- Stato aggiornato del modulo:
  - `Manutenzioni` -> `CHIUSO`
- Limite esplicito:
  - la chiusura vale solo per il modulo `Manutenzioni` nel loop corrente;
  - il tracker corrente risulta interamente `CLOSED`;
  - loop modulo-per-modulo completato; consigliato audit finale globale separato.

## 5.123 Aggiornamento 2026-04-01 - Alert Home NEXT riallineato alle categorie madre-like
- La card `Alert` della Home NEXT mantiene il filtro visibile ma ora rende le categorie in modo piu fedele alla madre:
  - `Revisioni` apre il modal revisione e conserva il pre-collaudo sul mezzo;
  - `Segnalazioni` apre il dettaglio evento nella vera esperienza eventi autisti;
  - `Eventi autisti` mostra i primi eventi ordinati e apre il modal lista completo;
  - `Conflitti sessione` resta nel flusso collegato gia esistente.
- Il cambiamento resta confinato a `src/next/*` e non introduce writer nuovi o shape dati diverse.
- Verifica eseguita:
  - `npm run build` -> `OK`.

## 5.124 Aggiornamento 2026-04-02 - Procurement NEXT riallineato sul comportamento pratico del modulo unico
- Sul runtime ufficiale `/next/materiali-da-ordinare` il procurement NEXT mantiene il modulo unico convergente ma corregge alcuni delta comportamentali reali rispetto alla madre:
  - il prefill `iaHandoff` viene ora applicato davvero a fornitore, descrizione, ricerca e tab target coerente;
  - la bozza locale procurement viene persistita in `sessionStorage` e ripristinata al reload, in linea con il comportamento pratico del procurement madre completo;
  - le righe temporanee `Fabbisogni` conservano il fornitore scelto, quindi la tabella non perde piu il contesto riga;
  - la ricerca top-level filtra anche `Ordini`, `Arrivi`, `Preventivi` e `Listino` nel modulo convergente.
- Il clone resta read-only:
  - `CONFERMA ORDINE` continua a non scrivere business data reali;
  - dopo la conferma read-only la bozza locale viene svuotata per allinearsi al flusso madre post-salvataggio.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - restano fuori parity completa i writer business reali, i PDF reali, l'upload preventivi e le azioni riga avanzate della madre `Acquisti`.

## 5.125 Aggiornamento 2026-04-02 - Procurement NEXT esteso su preview fornitore, listino e totali del modulo unico
- Sul runtime ufficiale `/next/materiali-da-ordinare` il ramo `Fabbisogni` replica ora piu fedelmente il comportamento madre di `Ordine materiali` senza riaprire moduli top-level separati:
  - suggerimenti listino filtrati per fornitore attivo e descrizione articolo;
  - selezione di una voce listino che precompila descrizione, UDM, prezzo, valuta e riferimento preventivo;
  - preview del fornitore selezionato con storico listino/preventivi e ultimo prezzo noto;
  - righe materiali con nota locale, foto locale, prezzo sorgente, totale calcolato e warning UDM da verificare;
  - footer laterale con note ordine, totali per valuta, conteggio prezzi mancanti, conteggio UDM da verificare e indicatore `Bozza salvata`.
- La sezione convergente `Prezzi & Preventivi` non tronca piu i risultati a 12 righe, quindi il listino/preventivi renderizzano tutto il dataset leggibile del clone.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - la parity totale con la madre completa resta aperta finche la NEXT non replica anche i blocchi vivi di `Acquisti.tsx` su `Prezzi & Preventivi`, `Listino Prezzi`, `Dettaglio ordine`, PDF/share e writer business clone-safe.

## 5.126 Aggiornamento 2026-04-02 - Procurement NEXT esteso su tab secondarie e drill-down consultivo
- Sul runtime ufficiale `/next/materiali-da-ordinare` il procurement convergente riduce altri delta reali rispetto alla madre completa anche nei tab secondari:
  - `Prezzi & Preventivi` espone ora filtri fornitore/valuta piu vicini alla madre e pulsanti `Apri documento` su preventivi e listino quando il clone legge un riferimento documento;
  - `Dettaglio ordine` read-only mantiene il drill-down interno al modulo unico ma apre ora la foto materiale direttamente dalla riga quando presente;
  - il procurement resta top-level unico e non riapre route separate visibili per `Ordini`, `Arrivi`, `Dettaglio ordine` o `Acquisti`.
- Boundary dati invariato:
  - la pagina continua a leggere solo tramite `readNextFornitoriSnapshot()`, `readNextProcurementSnapshot()`, `buildNextProcurementListView()` e `findNextProcurementOrder()`;
  - nessuna lettura raw legacy madre e stata reintrodotta nel runtime NEXT.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - restano ancora fuori parity totale i workflow vivi madre di edit/save ordini, import preventivi/listino, PDF/preview/share reali e scritture business clone-safe.

## 5.127 Aggiornamento 2026-04-02 - Procurement NEXT esteso sul dettaglio ordine operativo clone-safe
- Sul runtime ufficiale `/next/materiali-da-ordinare` il ramo `Dettaglio ordine` non resta piu sul vecchio pannello bloccato:
  - `Segna Arrivato` / `Segna NON Arrivato`, `Modifica`, `Salva` e `+ Aggiungi materiale` replicano ora il percorso madre come interazioni locali clone-safe;
  - il dettaglio mantiene `PDF Fornitori`, `ANTEPRIMA PDF` e `PDF Interno` con generazione/preview locale invece del solo bottone disabilitato;
  - righe ordine modificabili localmente con foto, note, stato arrivo, data arrivo, eliminazione e totale riga calcolato sul listino NEXT pulito;
  - `Note ordine (solo PDF)` e riepilogo totale/valute/UDM si comportano ora piu come la madre completa di `Acquisti` e `DettaglioOrdine`.
- Boundary dati invariato:
  - il dettaglio continua a partire da `readNextProcurementSnapshot()`, `buildNextProcurementListView()` e `findNextProcurementOrder()`;
  - nessuna lettura raw legacy di `@ordini`, `@inventario`, `storageSync` o upload `materialImages` e stata reintrodotta.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - restano aperti i writer business reali della madre, il workflow pieno di `Prezzi & Preventivi` / `Listino Prezzi` e il `Dettaglio ordine` persistente 1:1.

## 5.128 Aggiornamento 2026-04-02 - Procurement NEXT riallineato sulla shell madre `Acquisti`
- Sul runtime ufficiale `/next/materiali-da-ordinare` la UI principale prende ora come master esterno `src/pages/Acquisti.tsx`, non piu una convergenza astratta del procurement:
  - la shell top-level usa struttura `Acquisti` con header `Gestione Acquisti`, titolo `Acquisti`, tab madre e gerarchia `acq-header` -> `acq-tabs` -> `acq-content`;
  - `Ordine materiali` resta dentro il modulo unico ma viene ospitato nel pannello `acq-tab-panel--fabbisogni` coerente con la madre;
  - `Prezzi & Preventivi` riallinea topbar `Registro Preventivi`, CTA `Carica preventivo`, filtri `Fornitore` / `Cerca` e tabella in shell `acq-prev-*`;
  - `Listino Prezzi` usa ora la shell `acq-listino-*` con filtri `Fornitore`, `Valuta`, `Cerca` e tabella madre-like senza footer custom ibridi.
- Boundary dati invariato:
  - non sono stati toccati `src/next/NextProcurementReadOnlyPanel.tsx` e `src/next/domain/nextProcurementDomain.ts`;
  - il runtime continua a leggere tramite `readNextFornitoriSnapshot()` e `readNextProcurementSnapshot()`;
  - nessuna lettura raw legacy, nessun `storageSync`, nessun mount runtime di `src/pages/*`.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - `Ordini` / `Arrivi` restano appoggiati al pannello convergente read-only gia esistente;
  - `Prezzi & Preventivi` e `Listino Prezzi` restano consultivi clone-safe e non riaprono writer business o upload reali madre.

## 5.129 Aggiornamento 2026-04-02 - Procurement NEXT porta `Ordini`, `Arrivi` e `Dettaglio ordine` nella shell `Acquisti`
- Sul runtime ufficiale `/next/materiali-da-ordinare` le viste interne principali non usano piu `NextProcurementConvergedSection` come superficie visiva dominante:
  - `Ordini`, `Arrivi` e `Dettaglio ordine` vengono ora renderizzati dentro la stessa gabbia `acq-content` della shell madre `Acquisti`;
  - `NextMaterialiDaOrdinarePage.tsx` instrada questi tre rami verso `NextProcurementReadOnlyPanel` in modalita `embedded`, lasciando al converged solo `Prezzi & Preventivi` e `Listino Prezzi`;
  - le liste allineano titoli e CTA alla madre con `Ordini in attesa`, `Ordini arrivati` e bottone riga `Apri`;
  - il dettaglio ordine resta clone-safe ma si apre ora come vista principale interna al modulo unico, non come pannello convergente separato.
- Boundary dati invariato:
  - non sono stati toccati `src/next/domain/nextProcurementDomain.ts` e `src/next/NextProcurementConvergedSection.tsx`;
  - il runtime continua a leggere tramite `readNextProcurementSnapshot()`, `buildNextProcurementListView()` e `findNextProcurementOrder()`;
  - nessuna reintroduzione di `storageSync`, letture raw legacy di `@ordini` / `@preventivi` / `@listino_prezzi` o mount runtime di `src/pages/*`.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - `Ordini` / `Arrivi` non replicano ancora 1:1 tutte le azioni secondarie della madre dentro la tabella ordini;
  - `Dettaglio ordine` resta locale clone-safe e non riapre i writer business reali della madre;
  - `Prezzi & Preventivi` e `Listino Prezzi` restano consultivi clone-safe.

## 5.130 Aggiornamento 2026-04-02 - Procurement NEXT chiude il delta UI residuo su liste, dettaglio, preventivi e listino
- Sul runtime ufficiale `/next/materiali-da-ordinare` sono stati riallineati solo i pezzi ancora visibilmente diversi dalla madre `Acquisti`:
  - `Ordini` / `Arrivi` espongono ora menu secondario `AZIONI` con voci `Modifica` e `Elimina`, bottone riga `Apri` e pill stato coerente con la madre per tab (`In attesa` su ordini, `Arrivato` su arrivi);
  - `Dettaglio ordine` mostra intestazione e riepilogo madre-like con meta `Ordine del ...`, pill `IN ATTESA` / `PARZIALE` / `ARRIVATO`, conteggi `Materiali` / `Arrivati`, rimozione del pill `Ultimo arrivo` e della nota clone-only in testata;
  - la tabella materiali del dettaglio in sola lettura non mostra piu preview secondarie o CTA extra non presenti nella madre, lasciando la colonna azioni vuota fuori editing;
  - `Prezzi & Preventivi` usa shell `Registro Preventivi` con CTA `Carica preventivo`, card `Nuovo preventivo`, tools `PULISCI ALLEGATI IA` / `Apri tutti` / `Chiudi tutti`, filtri `Fornitore` / `Cerca` / `Solo non importati`, gruppi per fornitore e menu azioni documentali;
  - `Listino Prezzi` usa tabella madre con colonne `Fornitore`, `Articolo`, `Unita`, `Valuta`, `Prezzo`, `Trend`, `Preventivo`, `Data`, `Azioni`, bottone `APRI DOCUMENTO`, menu `Apri documento` / `Modifica` / `Elimina` e modale `Modifica voce listino`.
- Boundary dati invariato nel prompt:
  - non sono stati toccati `src/next/domain/nextProcurementDomain.ts` e `src/next/NextMaterialiDaOrdinarePage.tsx`;
  - `NextProcurementReadOnlyPanel.tsx` continua a usare `readNextProcurementSnapshot()`, `buildNextProcurementListView()` e `findNextProcurementOrder()` tramite props/snapshot gia presenti;
  - `NextProcurementConvergedSection.tsx` continua a lavorare solo sui dati gia esposti dal domain NEXT (`snapshot.preventivi`, `snapshot.listino`) senza reintrodurre letture raw legacy, `storageSync` o mount runtime di `src/pages/*`.
- Stato aggiornato del procurement top-level:
  - `Materiali da ordinare` -> `PARZIALE`
- Limite esplicito:
  - i workflow vivi madre di `Nuovo preventivo`, import listino, modifica listino ed eliminazioni restano clone-safe e non persistono scritture business reali;
  - `Dettaglio ordine` resta locale clone-safe su foto, editing materiali e PDF;
  - il modulo non e dichiarabile `CHIUSO` perche la parity 1:1 completa dei side effect della madre non e stata riaperta.

## 5.131 Aggiornamento 2026-04-03 - Home NEXT collega banner alert reale e launcher IA interna
- Sul runtime ufficiale `/next` la nuova Home NEXT non usa piu placeholder statici per i due blocchi in testata:
  - il banner alert legge ora `readNextCentroControlloSnapshot()` e sintetizza 1-2 segnali reali prioritari da `revisioniScadute`, `revisioniInScadenza`, `conflittiSessione`, `segnalazioniNuove`, `controlliKo`, con fallback `Tutto ok: nessun alert prioritario` quando non emergono alert prioritari;
  - il pannello `IA interna` monta `HomeInternalAiLauncher` e apre il modal reale di `NextInternalAiPage` in variante `home-modal`, eliminando il mock conversazionale hardcoded;
  - stat card e widget della Home restano volontariamente placeholder e fuori perimetro in questo prompt.
- Boundary invariato:
  - nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route, mother o writer;
  - la Home resta read-only e non reintroduce `storageSync`, scritture business o mount runtime legacy.
- Stato aggiornato della Home NEXT:
  - `Dashboard / Home` -> `PARZIALE`
- Limite esplicito:
  - banner e IA sono ora collegati a runtime reale;
  - stat card e widget restano placeholder finche non verra fatto un prompt dedicato ai dati dashboard.

## 5.132 Aggiornamento 2026-04-03 - NEXT aggiunge il modale globale unico `Scadenze` con doppio trigger sidebar/Home
- Nel subtree ufficiale `/next` esiste ora un solo modale read-only `Scadenze revisioni`, montato globalmente da `NextShell` e aperto via query param `scadenze`:
  - la voce sidebar `Scadenze` non e piu `disabled` e apre `?scadenze=tutte` senza creare route nuove;
  - il banner alert della nuova Home apre lo stesso modale con `?scadenze=urgenti`;
  - la chiusura del modale rimuove il query param senza uscire dalla route corrente.
- Il modale usa solo il reader gia esistente `readNextCentroControlloSnapshot()` e solo i blocchi dati richiesti:
  - `revisioni`
  - `revisioniScadute`
  - `revisioniInScadenza`
  - `prenotazioneCollaudo`
  - `preCollaudo`
- Comportamento confermato:
  - `tutte` mostra l'elenco completo ordinato per `giorni` crescente;
  - `urgenti` filtra localmente solo revisioni con `giorni <= 30` e `prenotazioneCollaudo.completata !== true`;
  - il modale e solo informativo e non riapre `PRENOTA`, `PRE-COLLAUDO` o `SEGNA REVISIONE FATTA`.
- Boundary invariato:
  - nessuna modifica a `src/next/domain/nextCentroControlloDomain.ts`;
  - nessun riuso runtime di `NextCentroControlloPage`;
  - nessuna nuova route, nessun context nuovo, nessuna scrittura business reale.
- Stato aggiornato della Home/Shell NEXT:
  - `Dashboard / Home` -> `PARZIALE`
  - `Shell globale NEXT` -> `PARZIALE`
- Limite esplicito:
  - il modale copre solo la vista read-only unica delle revisioni;
  - le azioni operative madre restano intenzionalmente escluse dal clone.

## 5.133 Aggiornamento 2026-04-03 - `Scadenze` NEXT diventa madre-like nei passaggi operativi, con salvataggio finale bloccato
- Il sistema unico `Scadenze` nel subtree `/next` resta un solo contenitore modale, ma ora replica anche la fase operativa madre-like senza riaprire writer business reali:
  - per ogni riga revisione sono visibili i controlli `PRENOTA` / `MODIFICA` / `CANCELLA`, `PRE-COLLAUDO` / `MODIFICA` e `SEGNA REVISIONE FATTA` secondo lo stato reale della riga;
  - cliccando i controlli si aprono superfici operative interne allo stesso modale con campi compilabili coerenti con la madre;
  - il blocco read-only avviene solo al momento del `SALVA` / `CANCELLA`, con messaggio esplicito e nessuna scrittura su `@mezzi_aziendali`.
- Corretto alla radice anche il bug data/delta nel domain D10:
  - la normalizzazione date ora privilegia parsing esplicito `YYYY-MM-DD` e `gg/mm/aa(aa)` prima di qualunque fallback generico;
  - stringhe come `18/12/26` vengono ora normalizzate come dicembre 2026, non come 1926;
  - una revisione futura non appare piu `REVISIONE SCADUTA` da migliaia di giorni.
- Boundary invariato:
  - nessuna modifica a shell, route o `NextCentroControlloPage`;
  - nessun `setItemSync`, nessun update reale su dataset storage/Firebase;
  - il sistema resta read-only e clone-safe.
- Stato aggiornato del perimetro:
  - `Dashboard / Home` -> `PARZIALE`
  - `Shell globale NEXT` -> `PARZIALE`
- Limite esplicito:
  - le superfici operative sono madri-like fino alla conferma finale, ma non persistono dati reali.

## 5.134 Aggiornamento 2026-04-03 - fix wiring sidebar NEXT tra `Mezzi aziendali` e `Motrici e trattori`
- Corretto il bug del menu sinistro per cui le voci `Mezzi aziendali` e `Motrici e trattori` puntavano entrambe allo stesso path `/next/mezzi`.
- Fix applicato solo nel catalogo nav di `src/next/nextData.ts`:
  - `Mezzi aziendali` resta su `/next/mezzi`;
  - `Motrici e trattori` punta ora a `/next/dossiermezzi`.
- Nessuna modifica a pagine, route ufficiali, domain o logiche dati:
  - il renderer della sidebar in `NextShell.tsx` era gia corretto;
  - la causa reale era un path duplicato nel catalogo dati della shell.
- Stato aggiornato del perimetro:
  - `Shell globale NEXT` -> `PARZIALE`
  - `Dashboard / Home` -> `PARZIALE`
 
## 5.135 Aggiornamento 2026-04-06 - `Lavori` NEXT passa a UI unificata con logica reale e deroga chirurgica su `@lavori`
- Il runtime ufficiale del modulo `Lavori` nel subtree `/next` usa ora una dashboard UI unificata:
  - `src/next/NextLavoriDaEseguirePage.tsx` diventa il contenitore con tab `In attesa`, `Eseguiti`, `Aggiungi`, stat card, filtri, tabelle moderne e dettaglio in modale;
  - `src/next/NextLavoriInAttesaPage.tsx` e `src/next/NextLavoriEseguitiPage.tsx` convergono sulla stessa dashboard, forzando solo la tab iniziale coerente con la route;
  - `src/next/NextDettaglioLavoroPage.tsx` espone il dettaglio reale condiviso, riusato sia come route diretta sia come contenuto del modale nella dashboard.
- La logica reale dei moduli Lavori e stata preservata senza toccare `src/pages/**` o `src/next/domain/*`:
  - lettura reale da `@lavori` e `@mezzi_aziendali` tramite `getItemSync(...)`;
  - aggiunta gruppo lavori reale con `setItemSync("@lavori", ...)`;
  - modifica, eliminazione e `Segna come eseguito` reali nel dettaglio, sempre su `@lavori`;
  - export PDF di liste e dettaglio mantenuto nel perimetro del modulo.
- La barriera clone-wide non e stata aperta globalmente:
  - `src/utils/cloneWriteBarrier.ts` consente ora solo `storageSync.setItemSync("@lavori")`;
  - l'eccezione vale solo sui pathname `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti`, `/next/dettagliolavori` e `/next/dettagliolavori/:lavoroId`;
  - tutto il resto del clone continua a restare bloccato dalla barriera no-write.
- Verifica runtime locale completata:
  - aggiunta reale di un lavoro temporaneo in `Aggiungi`;
  - modifica reale, esecuzione reale e poi eliminazione reale del record via dettaglio;
  - route diretta `/next/dettagliolavori/:lavoroId` verificata;
  - tentativo di write su `@lavori` da `/next/autisti-inbox` rimasto bloccato.
- Stato aggiornato del modulo:
  - `Lavori` -> `PARZIALE`
- Limite esplicito:
  - il modulo non viene dichiarato `CHIUSO` in questo prompt perche manca ancora audit separato post-redesign sulla parity completa e sulla tenuta del perimetro.

## 5.136 Aggiornamento 2026-04-06 - `Lavori` NEXT mostra il problema reale e apre la segnalazione autista originale dal dettaglio
- Nel dettaglio lavoro NEXT e stata aggiunta la sezione `Problema segnalato`:
  - usa il testo reale della segnalazione autista quando il match e sicuro;
  - in fallback mostra `dettagli` o il payload gia presente nel lavoro, senza inventare dati;
  - se non esiste testo utile mostra `—`.
- L'apertura della segnalazione originale resta interna al modulo `Lavori`:
  - `Segnalato da` espone il bottone discreto `Apri segnalazione`;
  - il bottone apre un modale read-only secondario, senza nuove route e senza uscire dal flusso lavori;
  - il modale mostra autore, data/ora, mezzo, stato, tipo problema, foto allegate e descrizione reale.
- Il matching verso la segnalazione originale e stato mantenuto stretto e spiegabile:
  - priorita a `source.type === "segnalazione"` + `source.id/originId` presenti nel lavoro reale;
  - fallback solo su match univoco per targa + autore + testo reale della segnalazione;
  - nessuna apertura se il match non e sicuro.
- Verifica runtime locale completata:
  - caso positivo su lavoro da segnalazione con apertura del modale read-only e testo reale coerente;
  - route diretta `/next/dettagliolavori/:lavoroId` verificata;
  - caso senza match sicuro lasciato senza apertura di segnalazione errata.
- Stato modulo:
  - `Lavori` -> `PARZIALE`

## 5.139 Aggiornamento 2026-04-08 - micro-fix spacing riga metriche `Manutenzioni`
- Corretto solo il layout della riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica`.
- La griglia non usa piu proporzioni quasi uguali:
  - `Data` corto;
  - `KM/Ore` medio-corto;
  - `Fornitore` lungo e flessibile.
- Aumentato anche il respiro della card `Mezzo attivo` sopra `Campi base` per evitare effetto di blocchi incollati.
- Nessuna modifica a logica dati, salvataggio, foto, dettaglio o PDF.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.140 Aggiornamento 2026-04-08 - riga metriche `Manutenzioni` resa a 3 mini-card
- La riga `Data / KM-Ore / Fornitore` e stata rifatta in JSX e CSS come tre mini-card separate vere, non come semplici campi affiancati.
- Ogni mini-card contiene label + input con bordo e spazio propri.
- `Fornitore` resta la card larga e flessibile; `Data` e `KM/Ore` restano corte.
- La card `Mezzo attivo` ha ora uno stacco verticale piu evidente dal pannello `Campi base`.
- Nessuna modifica a logica dati, salvataggio, PDF, foto o `Dettaglio`.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.141 Aggiornamento 2026-04-08 - riga metriche `Manutenzioni` ricompattata
- Rimossa la soluzione a tre mini-card alte introdotta nel tentativo precedente.
- La riga `Data / KM-Ore / Fornitore` usa ora una sola griglia compatta con tre field-group separati, senza contenitori alti dedicati.
- Proporzioni runtime:
  - `Data`: 180px
  - `KM/Ore`: 180px
  - `Fornitore`: spazio restante
- `Mezzo attivo` mantiene uno stacco verticale piu netto sopra `Campi base`.
- Nessuna modifica a logica dati, salvataggio, PDF, foto o dettaglio.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.142 Aggiornamento 2026-04-08 - sostituzione definitiva blocco metriche `Manutenzioni`
- Il blocco `Data / KM-Ore / Fornitore` e stato riallineato alla struttura finale richiesta, senza mini-card e senza wrapper alti.
- JSX finale:
  - `man2-metric-row`
  - `man2-metric-group--date`
  - `man2-metric-group--metric`
  - `man2-metric-group--supplier`
- CSS finale:
  - `grid-template-columns: 180px 180px minmax(360px, 1fr)`
  - `gap: 16px`
  - `margin-top: 10px`
- Nessuna modifica a logica dati, salvataggio, routing, PDF, foto o dettaglio.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.143 Aggiornamento 2026-04-08 - base visiva input metriche riallineata
- I campi `Data / KM-Ore / Fornitore` riusano ora la stessa base `man2-field` dei campi `Tipo` e `Sottotipo`.
- Layout e proporzioni della riga restano invariati:
  - `180px 180px minmax(360px, 1fr)`
  - `gap: 16px`
- Il fix tocca solo font, altezza percepita, bordo, radius, padding e placeholder.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.144 Aggiornamento 2026-04-08 - micro-fix header e metrica form `Manutenzioni`
- Rimossa dal rendering la label piccola sopra `Nuova manutenzione`.
- Il contenuto del modulo ha piu aria sul bordo sinistro per ridurre l'impatto visivo dell'icona menu tonda sulla testata.
- La riga `Data / KM-Ore / Fornitore` e stata micro-ribilanciata:
  - `Data`: 176px
  - `KM/Ore`: 192px
  - `Fornitore`: `minmax(360px, 1fr)`
- Nessuna modifica a logica dati, routing, PDF, foto o dettaglio.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.145 Aggiornamento 2026-04-08 - riga metriche `Manutenzioni` a larghezze fisse
- La riga `Data / KM-Ore / Fornitore` e stata riallineata a una struttura desktop compatta a larghezze bloccate:
  - `190px / 140px / 260px`
- Il `Fornitore` non usa piu `1fr` su desktop.
- Gap confermato uguale a `16px` e allineamento a sinistra del gruppo.
- Nessuna modifica a logica dati, routing, PDF, foto o dettaglio.
- Stato modulo:
  - `Manutenzioni` -> `PARZIALE`

## 5.137 Aggiornamento 2026-04-06 - fix reale del testo segnalazione autista nel dettaglio `Lavori`
- Corretto il recupero del testo reale nel blocco `Problema segnalato` del dettaglio lavoro NEXT.
- Il fix ora legge il payload reale di `@segnalazioni_autisti_tmp` invece di fermarsi alla sola vista normalizzata:
  - priorita a `source.id/originId` del lavoro;
  - seconda priorita al backlink reale `linkedLavoroId` / `linkedLavoroIds` presente nella segnalazione autista;
  - fallback stretto su targa + autore + tipo problema + testo reale della segnalazione.
- Campo reale verificato sul caso runtime:
  - il testo problema e stato letto da `descrizione` della segnalazione originale `5cdfe350-804f-45c8-879b-433574b0700d`;
  - i campi `note`, `messaggio`, `dettaglio` e `testo` sono stati controllati ma nel caso verificato risultano vuoti o assenti.
- Il dettaglio non mostra piu `—` quando il testo esiste davvero:
  - in modal da `/next/lavori-in-attesa`;
  - in route diretta `/next/dettagliolavori/:lavoroId`.
- Se la segnalazione originale esiste ma non ha alcuna nota/testo utile, il blocco mostra ora:
  - `Nessuna nota presente nella segnalazione originale`
- Stato modulo:
  - `Lavori` -> `PARZIALE`

## 5.138 Aggiornamento 2026-04-07 - irrigidimento del link forte segnalazione -> dettaglio `Lavori`
- Il dettaglio lavoro NEXT resta sul flusso dati reale verificato dall'audit:
  - match forte primario su `source.type === "segnalazione"` + `source.id/originId`;
  - match forte secondario sul backlink reale `linkedLavoroId/linkedLavoroIds` del record segnalazione;
  - fallback solo se univoco e spiegabile.
- Il blocco `Problema segnalato` non usa piu `lavoro.dettagli` o `lavoro.note` come scorciatoia per sostituire la segnalazione originale.
- Gerarchia testo reale confermata e mantenuta nel dettaglio e nel modale read-only:
  - `descrizione`
  - `note`
  - `messaggio`
  - `dettaglio`
  - `testo`
- Se la segnalazione originale esiste ma non contiene testo in quei campi, il dettaglio mostra ora:
  - `Nessuna descrizione presente nella segnalazione originale`
- Verifica runtime locale ripetuta e positiva:
  - caso reale da dashboard/modale -> `Freni da controllare`
  - stesso caso su route diretta `/next/dettagliolavori/:lavoroId` -> `Freni da controllare`
  - caso non nato da segnalazione -> nessun `Apri segnalazione` e nessuna apertura errata
- Stato modulo:
  - `Lavori` -> `PARZIALE`

## 5.146 Aggiornamento 2026-04-15 - fix motore OpenAI-only per `Archivista` Manutenzione
- Correzione stretta del solo ramo `Fattura / DDT + Manutenzione`.
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` usa ora il backend IA separato locale invece della cloud function legacy `estrazioneDocumenti`.
- `backend/internal-ai/server/internal-ai-adapter.js` espone l'endpoint dedicato:
  - `/internal-ai-backend/documents/manutenzione-analyze`
- `backend/internal-ai/server/internal-ai-document-extraction.js` supporta ora un profilo `manutenzione` con:
  - prompt OpenAI dedicato;
  - schema dedicato per riassunto, targa, fornitore, data, totale, km e righe;
  - provider OpenAI obbligatorio per questo ramo;
  - nessun fallback a callable legacy o Gemini.
- Boundary confermati:
  - nessuna modifica al ramo `Magazzino`;
  - nessun writer business nuovo;
  - nessuna archiviazione definitiva;
  - nessun intervento su `cloneWriteBarrier.ts`.
- Verifiche:
  - `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-document-extraction.js` -> `OK`
  - `npm run build` -> `OK`

## 5.147 Aggiornamento 2026-04-15 - integrazione layout approvato su `Importa documenti`
- La superficie NEXT `Importa documenti` e stata riallineata al layout UI approvato senza toccare backend, estrazione o writer.
- `src/next/NextIAArchivistaPage.tsx` usa ora il guscio pagina `iai-*`:
  - topbar;
  - hero;
  - card `Destinazione rilevata`;
  - host dei bridge attivi.
- I bridge runtime restano nel perimetro attuale ma si appoggiano alla grammatica visuale approvata:
  - `ArchivistaMagazzinoBridge.tsx`
  - `ArchivistaManutenzioneBridge.tsx`
  - `ArchivistaDocumentoMezzoBridge.tsx`
  - `ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/internal-ai.css` contiene ora il sistema classi `iai-*` necessario alla schermata reale.
- Stato modulo:
  - `IA interna / Importa documenti` -> `PARZIALE`

## 5.148 Aggiornamento 2026-04-22 - `Preventivo manuale` NEXT in `Prezzi & Preventivi`
- `/next/materiali-da-ordinare?tab=preventivi` espone ora il pulsante `PREVENTIVO MANUALE` accanto a `CARICA PREVENTIVO` e apre un modale nativo NEXT per inserimento testata, righe e foto.
- `src/next/nextPreventivoManualeWriter.ts` salva il preventivo reale su `storage/@preventivi` e aggiorna il listino reale su `storage/@listino_prezzi`, passando solo dai wrapper `src/utils/firestoreWriteOps.ts` e `src/utils/storageWriteOps.ts`.
- Le foto opzionali vengono caricate sotto `preventivi/manuali/` con path `preventivi/manuali/<preventivoId>_<idx>.<ext>` e i download URL finiscono in `imageStoragePaths` / `imageUrls` del record `Preventivo`.
- `src/utils/cloneWriteBarrier.ts` apre ora per il solo pathname `/next/materiali-da-ordinare` esclusivamente:
  - `firestore.setDoc` su `storage/@preventivi`
  - `firestore.setDoc` su `storage/@listino_prezzi`
  - `storage.uploadBytes` sotto `preventivi/manuali/`
- Deviazione autorizzata applicata sulla valuta:
  - il record `Preventivo` persistito resta invariato e NON contiene `valuta`
  - la valuta del form viene passata come parametro esplicito al solo `upsertListinoFromPreventivoManuale(...)`
  - `ListinoVoce.valuta` resta il solo punto persistente in cui la valuta viene salvata
- `src/next/NextMaterialiDaOrdinarePage.tsx` riallinea il refresh snapshot del tab procurement tramite callback `onPreventivoSaved`, cosi l'elenco si puo ricaricare dopo il salvataggio.
- Verifiche tecniche eseguite:
  - `npx eslint src/next/NextPreventivoManualeModal.tsx src/next/nextPreventivoManualeWriter.ts src/next/NextProcurementConvergedSection.tsx src/next/NextMaterialiDaOrdinarePage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
  - `npm run build` -> `OK`
- Stato modulo:
  - `NEXT Procurement` -> `PARZIALE`

## 5.149 Aggiornamento 2026-04-22 - Fix leak preventivi manutenzione nel layer procurement
- Chiusura del leak per cui i preventivi Archivista Manutenzione (`ambitoPreventivo: "manutenzione"`) comparivano nelle superfici procurement NEXT non pertinenti.
- `src/next/domain/nextProcurementDomain.ts`: `readNextProcurementSnapshot()` filtra ora in ingresso i record `ambitoPreventivo === "manutenzione"`.
- `src/next/domain/nextDocumentiCostiDomain.ts`: `readNextDocumentiCostiProcurementSupportSnapshot()` estende il filtro `preventiviItems` con la stessa condizione.
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`: il registry universale filtra `storage/@preventivi` prima della materializzazione grezza.
- Retrocompatibilita: record senza `ambitoPreventivo` (pre-2026-04-22) restano inclusi in tutte le pipeline.
- Nessun writer, barrier o regola storage modificata.
- Verifiche tecniche eseguite:
  - `npm run build` -> `OK`
  - `npm run lint` -> `582/567/15` (delta zero)
- Stato modulo:
  - `NEXT Procurement` -> `PARZIALE` (debito aperto: bug `entry.targa` vs `entry.metadatiMezzo.targa` nel dossier mezzo)
