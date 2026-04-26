# VERDETTO ATTREZZATURE CANTIERI NEXT

Data riferimento: 2026-04-24  
Audit eseguito da: Codex, primo audit statico  
Modulo: Attrezzature Cantieri NEXT  
SPEC di riferimento secondario: `docs/product/SPEC_ATTREZZATURE_CANTIERI_NEXT.md`  
Fonte primaria: codice reale del repository

## Tabella riassuntiva

| Punto | Descrizione breve | Verdetto | Note |
|---|---|---|---|
| 1 | Zero pulsanti disabled senza motivo business | PASS | `disabled` solo su salvataggi async: `saving` / `editSaving`. |
| 2 | Zero alert o badge read-only attivi | PASS | Badge scaffold resta globale ma viene nascosto su Attrezzature con prop dedicata. |
| 3 | Zero scritture solo in React state | PASS | Create/edit/delete passano dai writer; reset form e PDF sono UI-only. |
| 4 | Writer via wrapper Firestore/Storage | PASS | Scritture via `firestoreWriteOps` e `storageWriteOps`; import Firebase dinamici solo per ref/read/download URL. |
| 5 | Barrier con deroghe esplicite | PASS | Route, doc Firestore e prefisso Storage autorizzati in `cloneWriteBarrier.ts`. |
| 6 | Storage rules presenti/deployate | PASS | Regola `attrezzature/` presente; deploy manuale confermato da Giuseppe il 2026-04-24. |
| 7 | Test browser end-to-end | PASS | Verificato manualmente da Giuseppe il 2026-04-24. |
| 8 | Autonomia dalla madre | PASS | Nessun import runtime di pagina madre, `storageSync` o `materialImages`; nota su CSS legacy condiviso. |
| 9 | Audit incrociato Codex + Claude Code | PARZIALE | Questo e' il primo audit; manca secondo audit indipendente Claude Code. |
| 10 | Confronto comportamentale 1:1 con madre | FAIL | Divergenza non dichiarata: madre chiede conferma su delete, NEXT elimina direttamente. |

## Punto 1 - Zero pulsanti disabled senza motivo business

Metodo verifica: grep `disabled` in `src/next/NextAttrezzatureCantieriWritePanel.tsx`.

Risultato:
- `src/next/NextAttrezzatureCantieriWritePanel.tsx:976` disabilita `Salva movimento` durante `saving`.
- `src/next/NextAttrezzatureCantieriWritePanel.tsx:979` disabilita `Elimina` del form durante `saving`; il pulsante e' reset form, non delete dati.
- `src/next/NextAttrezzatureCantieriWritePanel.tsx:1431` disabilita `Salva modifiche` durante `editSaving`.

Verdetto: PASS.

## Punto 2 - Zero alert read-only nel codice attivo

Metodo verifica: grep `read.only|readonly|sola lettura|Sola lettura|read-only|CLONE READ-ONLY`.

Risultato:
- `src/next/NextAttrezzatureCantieriWritePanel.tsx:99` e `src/next/NextAttrezzatureCantieriWritePanel.tsx:137` sono usi TypeScript legittimi di `readonly`.
- `src/next/NextClonePageScaffold.tsx:14` espone `hideCloneReadOnlyBadge`.
- `src/next/NextClonePageScaffold.tsx:43` rende il badge solo se `!hideCloneReadOnlyBadge`.
- `src/next/NextAttrezzatureCantieriPage.tsx:15` passa `hideCloneReadOnlyBadge` alla route Attrezzature.

Verdetto: PASS.

## Punto 3 - Zero scritture solo in React state

Metodo verifica: lettura handler + grep `setMovimenti|setRecords|setLista`.

Risultato:
- Nessun match per `setMovimenti|setRecords|setLista` nel pannello NEXT.
- `handleSave` chiama `createMovimentoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:411`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:423`.
- `handleDelete` chiama `deleteMovimentoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:450`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:453`.
- `handleEditRemovePhoto` chiama `removeEditFotoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:480`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:483`.
- `handleEditSave` chiama `editMovimentoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:491`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:505`.
- `handleResetForm` modifica solo stato form per design: `src/next/NextAttrezzatureCantieriWritePanel.tsx:405`.
- `handleExportPdf` modifica solo stato preview PDF per design: `src/next/NextAttrezzatureCantieriWritePanel.tsx:625`.

Verdetto: PASS.

## Punto 4 - Writer via firestoreWriteOps/storageWriteOps

Metodo verifica: grep import Firebase e lettura writer.

Risultato:
- Il pannello non importa direttamente `firebase/firestore` o `firebase/storage`.
- Il writer importa `setDoc` da wrapper: `src/next/nextAttrezzatureCantieriWriter.ts:14`.
- Il writer importa `deleteObject` e `uploadBytes` da wrapper: `src/next/nextAttrezzatureCantieriWriter.ts:15`.
- `writeMovimenti` usa `setDoc` wrapper: `src/next/nextAttrezzatureCantieriWriter.ts:236`.
- Upload foto usa `uploadBytes` wrapper: `src/next/nextAttrezzatureCantieriWriter.ts:251`.
- Delete foto usa `deleteObject` wrapper: `src/next/nextAttrezzatureCantieriWriter.ts:263`.
- Import dinamici Firebase nel writer sono per `collection/doc/getDoc`, `ref`, `getDownloadURL`: `src/next/nextAttrezzatureCantieriWriter.ts:225`, `src/next/nextAttrezzatureCantieriWriter.ts:230`, `src/next/nextAttrezzatureCantieriWriter.ts:246`, `src/next/nextAttrezzatureCantieriWriter.ts:262`.

Verdetto: PASS.

## Punto 5 - Barrier con deroghe esplicite

Metodo verifica: lettura `src/utils/cloneWriteBarrier.ts`.

Risultato:
- Route ammessa: `ATTREZZATURE_CANTIERI_ALLOWED_WRITE_PATHS` in `src/utils/cloneWriteBarrier.ts:35`.
- Doc Firestore ammesso: `ATTREZZATURE_CANTIERI_ALLOWED_FIRESTORE_DOC_PATHS` in `src/utils/cloneWriteBarrier.ts:36`.
- Prefisso Storage ammesso: `ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES` in `src/utils/cloneWriteBarrier.ts:39`.
- Helper dedicato: `isAllowedAttrezzatureCantieriCloneWritePath` in `src/utils/cloneWriteBarrier.ts:179`.
- Ramo `firestore.setDoc`: `src/utils/cloneWriteBarrier.ts:460` e `src/utils/cloneWriteBarrier.ts:461`.
- Ramo `storage.uploadBytes`: `src/utils/cloneWriteBarrier.ts:464`.
- Ramo `storage.deleteObject`: `src/utils/cloneWriteBarrier.ts:470`.

Verdetto: PASS.

## Punto 6 - Storage rules presenti/deployate

Metodo verifica: lettura `storage.rules` + dichiarazione manuale deploy.

Risultato:
- Regola `materiali/` precedente: `storage.rules:26`.
- Regola `attrezzature/`: `storage.rules:29`.
- Allow read/write autenticato: `storage.rules:30`.
- Deploy manuale produzione confermato da Giuseppe il 2026-04-24 con esito `Deploy complete!`.

Verdetto: PASS.

## Punto 7 - Test browser end-to-end

Metodo verifica: input utente, non riesecuzione automatica.

Risultato:
- PASS - verificato manualmente da Giuseppe il 2026-04-24.
- Scenari testati e confermati funzionanti: creazione movimento con e senza foto, modifica movimento, modifica con sostituzione foto, eliminazione movimento, refresh pagina con persistenza dati, esportazione PDF con anteprima.

Verdetto: PASS.

## Punto 8 - Tolgo la madre, il modulo funziona da solo

Metodo verifica: grep su `src/next/NextAttrezzatureCantieriWritePanel.tsx` e `src/next/nextAttrezzatureCantieriWriter.ts` per import runtime di madre, `materialImages`, `storageSync`.

Risultato:
- Nessun match per `from ['"].*pages/AttrezzatureCantieri['"]|from ['"].*materialImages['"]|from ['"].*storageSync['"]`.
- La route monta il pannello scrivente NEXT: `src/next/NextAttrezzatureCantieriPage.tsx:30`.
- Il pannello legge snapshot NEXT: `src/next/NextAttrezzatureCantieriPage.tsx:6`.
- Il pannello read-only non e' piu montato dalla pagina; esiste solo come file storico: `src/next/NextAttrezzatureCantieriReadOnlyPanel.tsx:15`.
- Nota: `src/next/NextAttrezzatureCantieriWritePanel.tsx:34` importa `../pages/AttrezzatureCantieri.css` per parita visuale. Non e' una dipendenza runtime della pagina madre TSX, ma resta un riuso CSS legacy da considerare in un eventuale hardening di autonomia completa.

Verdetto: PASS.

## Punto 9 - Audit incrociato Codex + Claude Code

Metodo verifica: stato processo.

Risultato:
- Questo documento e' il primo audit Codex.
- Il secondo audit indipendente Claude Code non e' ancora stato eseguito.

Verdetto: PARZIALE.

## Punto 10 - Confronto comportamentale 1:1 con madre

Metodo verifica: confronto `src/pages/AttrezzatureCantieri.tsx` vs NEXT.

| Azione | Madre | NEXT | Verdetto |
|---|---|---|---|
| Crea movimento | `handleSave` valida e salva: `src/pages/AttrezzatureCantieri.tsx:387` | `handleSave` chiama `createMovimentoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:411`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:423` | PASS |
| Delete movimento | Madre chiede conferma: `src/pages/AttrezzatureCantieri.tsx:465`, `src/pages/AttrezzatureCantieri.tsx:466` | NEXT chiama delete diretto: `src/next/NextAttrezzatureCantieriWritePanel.tsx:450`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:453` | FAIL |
| Delete movimento con foto | Madre rimuove record senza cancellare Storage: `src/pages/AttrezzatureCantieri.tsx:469`, `src/pages/AttrezzatureCantieri.tsx:470` | NEXT cancella foto prima del record: `src/next/nextAttrezzatureCantieriWriter.ts:356`, `src/next/nextAttrezzatureCantieriWriter.ts:365` | PASS con D8 intenzionale |
| Edit movimento | Madre `handleEditSave`: `src/pages/AttrezzatureCantieri.tsx:528` | NEXT `editMovimentoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:491`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:505` | PASS |
| Sostituzione foto | Madre delete-before-upload: `src/pages/AttrezzatureCantieri.tsx:563`, `src/pages/AttrezzatureCantieri.tsx:567` | NEXT upload-before-delete: `src/next/nextAttrezzatureCantieriWriter.ts:322`, `src/next/nextAttrezzatureCantieriWriter.ts:336` | PASS con D9 intenzionale |
| Rimuovi foto in edit | Madre `handleEditRemovePhoto`: `src/pages/AttrezzatureCantieri.tsx:509` | NEXT `removeEditFotoAttrezzatura`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:480`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:483` | PASS |
| Record legacy senza id | Madre usa `editForm.id || buildId()`: `src/pages/AttrezzatureCantieri.tsx:567`, `src/pages/AttrezzatureCantieri.tsx:573` | NEXT risolve id in writer: `src/next/nextAttrezzatureCantieriWriter.ts:318` | PASS |
| Export PDF | Madre `handleExportPdf`: `src/pages/AttrezzatureCantieri.tsx:716`, `src/pages/AttrezzatureCantieri.tsx:733` | NEXT `handleExportPdf`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:625`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:641` | PASS |
| Label PDF | Madre `Anteprima PDF`: `src/pages/AttrezzatureCantieri.tsx:785`, `src/pages/AttrezzatureCantieri.tsx:786` | NEXT `Esporta PDF`: `src/next/NextAttrezzatureCantieriWritePanel.tsx:681`, `src/next/NextAttrezzatureCantieriWritePanel.tsx:682` | PASS con differenza intenzionale |
| Filtri lista/PDF | Madre filtri testo/tipo/categoria: `src/pages/AttrezzatureCantieri.tsx:621`, `src/pages/AttrezzatureCantieri.tsx:624`, `src/pages/AttrezzatureCantieri.tsx:625` | NEXT filtri testo/tipo/categoria: `src/next/domain/nextAttrezzatureCantieriDomain.ts:447`, `src/next/domain/nextAttrezzatureCantieriDomain.ts:456`, `src/next/domain/nextAttrezzatureCantieriDomain.ts:457` | PASS |

Risultato: il punto 10 non passa per una divergenza UI non dichiarata come intenzionale: la madre mostra `window.confirm("Eliminare questo movimento?")`, il NEXT elimina direttamente al click.

Verdetto: FAIL.

## Divergenze intenzionali vs madre

- D8 - Delete movimento con foto: il NEXT cancella anche il file Storage per evitare file orfani. Madre: rimozione record senza delete Storage (`src/pages/AttrezzatureCantieri.tsx:469`, `src/pages/AttrezzatureCantieri.tsx:470`). NEXT: `src/next/nextAttrezzatureCantieriWriter.ts:356`, `src/next/nextAttrezzatureCantieriWriter.ts:357`.
- D9 - Sostituzione foto: il NEXT esegue upload-before-delete. Madre: delete-before-upload (`src/pages/AttrezzatureCantieri.tsx:563`, `src/pages/AttrezzatureCantieri.tsx:567`). NEXT: upload a `src/next/nextAttrezzatureCantieriWriter.ts:322`, delete vecchia a `src/next/nextAttrezzatureCantieriWriter.ts:336`.
- PDF label: il NEXT usa `Esporta PDF` invece di `Anteprima PDF`, decisione Giuseppe 2026-04-24. Madre: `src/pages/AttrezzatureCantieri.tsx:785`. NEXT: `src/next/NextAttrezzatureCantieriWritePanel.tsx:681`.

## Divergenza non intenzionale rilevata

- Delete riga: la madre apre conferma prima di cancellare (`src/pages/AttrezzatureCantieri.tsx:466`), mentre il NEXT invoca subito `deleteMovimentoAttrezzatura` (`src/next/NextAttrezzatureCantieriWritePanel.tsx:453`). Questa divergenza impedisce il verdetto `CHIUSO AL 100%`.

## Sintesi

Risultato complessivo: NON CHIUSO AL 100%.

Stato punti:
- PASS: 1, 2, 3, 4, 5, 6, 7, 8.
- PARZIALE: 9.
- FAIL: 10.

Il modulo e' funzionale e testato manualmente, ma il verdetto finale resta bloccato da:
1. punto 10 FAIL per divergenza delete-confirm madre vs NEXT;
2. punto 9 PARZIALE per secondo audit Claude Code non ancora eseguito.

## Prossimi passi

1. Decisione umana su conferma delete: allineare NEXT alla madre oppure dichiarare formalmente la divergenza come intenzionale.
2. Eseguire secondo audit indipendente Claude Code.
3. Ripetere il verdetto finale dopo la decisione sul punto 10 e il completamento del punto 9.
