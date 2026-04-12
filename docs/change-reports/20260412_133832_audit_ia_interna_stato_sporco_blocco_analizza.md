# CHANGE REPORT - AUDIT IA INTERNA DOCUMENTALE `HOME SPORCA` / `ANALIZZA BLOCCATO`

Data: 2026-04-12  
Tipo: audit tecnico solo diagnostico  
Perimetro runtime: nessuna patch applicata

## Obiettivo
- ricostruire il wiring reale di `/next/ia/interna`;
- verificare se la home si apra davvero sporca nel worktree/runtime corrente;
- riprodurre il blocco di `Analizza` e attribuirlo a file, funzione e guard reali;
- produrre una patch minima consigliata senza applicarla.

## File letti piu rilevanti
- `src/App.tsx`
- `src/main.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiServerPersistenceBridge.ts`
- documentazione di stato e report `20260412_115351_*`, `20260412_125333_*`

## Verifiche runtime eseguite davvero
- apertura diretta di `http://localhost:5173/next/ia/interna`
- apertura della preview su `http://127.0.0.1:4174/next/ia/interna`
- ispezione browser di `location.search`, `localStorage`, `sessionStorage`
- apertura di `http://localhost:5173/next/ia/documenti`
- click reale su `Riapri review`
- upload reale di un PDF di test e click reale su `Analizza`
- raccolta console browser e traccia network dopo il click

## Causa reale `home sporca`
- Nel worktree/runtime corrente il problema non e riproducibile.
- `src/next/NextInternalAiPage.tsx` parte con:
  - `documentWorkspaceTab = "inbox"`
  - `openedHistoryDocumentId = null`
- La sola auto-riapertura documentale dimostrata nel codice passa da:
  - `reviewDocumentId`
  - `reviewSourceKey`
  letti da `location.search`.
- La query di review e costruita in `src/next/NextIADocumentiPage.tsx` da `buildInternalAiHistoryReviewPath(item)` e consumata da `NextInternalAiPage.tsx`, che poi la rimuove subito con `navigate(..., { replace: true })`.
- Non emerge nessun uso di `sessionStorage` nel flusso documentale e non emerge nessun `localStorage` documentale che riapra la review.
- In browser:
  - `/next/ia/interna` apre la home pulita;
  - `location.search` e vuota;
  - compare `Nessun documento in review`;
  - `localStorage` contiene solo `@next_internal_ai:universal_requests_v1`, `@next_internal_ai:tracking_memory_v1`, `@next_internal_ai:artifact_archive_v1`;
  - nessuna di queste chiavi contiene `reviewDocumentId`.
- Conclusione verificata:
  - nel repository corrente la `home sporca` non dipende da hook condivisi, stato React iniziale del motore, `localStorage` o `sessionStorage`;
  - la sola riapertura automatica oggi dimostrata e un ingresso esplicito con query `reviewDocumentId` / `reviewSourceKey`.
- Stato onesto:
  - bug non riprodotto nel worktree/runtime correnti;
  - se il sintomo compare ancora altrove, la causa aggiuntiva resta `DA VERIFICARE` finche non viene mostrato un chiamante o una build diversa che lo riattiva.

## Causa reale `Analizza bloccato`
- Il bottone non e bloccato da `disabled` nel caso provato:
  - dopo upload reale del PDF il bottone si abilita.
- Il click arriva davvero a:
  - `NextInternalAiPage.handleUnifiedDocumentAnalyze()`
  - `useIADocumentiEngine().handleAnalyze()`
  - `analyzeDocumentoConIA()`
- `src/pages/IA/IADocumenti.tsx` prova poi a fare:
  - `fetch POST https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`
- `src/main.tsx` installa globalmente `installCloneFetchBarrier()`.
- `src/utils/cloneWriteBarrier.ts`:
  - tratta `cloudfunctions.net/estrazionedocumenti` come mutating fetch;
  - in clone chiama `assertCloneWriteAllowed("fetch.runtime", { method, url })`;
  - lancia `CloneWriteBlockedError` perche `/next/ia/interna` non ha alcuna eccezione che permetta quel `POST`.
- Prova runtime:
  - warning browser `[CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`
  - stack reale fino a `cloneWriteBarrier.ts` -> `IADocumenti.tsx` -> `NextInternalAiPage.tsx`
  - nessun `POST` a `estrazioneDocumenti` visibile nella rete browser
  - inline error UI con `[CLONE_NO_WRITE] Tentativo bloccato nel clone: fetch.runtime`
  - alert runtime `Errore nell'analisi del documento.`

## Clone barrier
- Coinvolto: si
- Guard reale che scatta: `fetch.runtime`
- Operazione bloccata: `POST` verso `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`
- Motivo: il fetch barrier globale installato in `src/main.tsx` considera quell'endpoint una mutazione non ammessa nel clone

## Patch minima consigliata
- `home sporca`:
  - nessuna patch runtime immediata nel worktree corrente;
  - se il bug riappare, il follow-up minimo va fatto sul chiamante che entra con query di review sporca, non sul motore `IADocumenti`.
- `Analizza bloccato`:
  - opzione clone-safe minima: toccare `src/pages/IA/IADocumenti.tsx` e `src/next/NextInternalAiPage.tsx` per non invocare il `POST` legacy nel clone e mostrare un blocco onesto;
  - opzione per riattivare davvero l'analisi: richiede decisione esplicita su `src/utils/cloneWriteBarrier.ts` e/o su un backend/trasporto consentito diverso dal `POST` legacy attuale.

## Rischio
- `ELEVATO`
- Motivo: il fix reale di `Analizza` tocca il confine tra IA interna, clone barrier globale e trasporto verso backend legacy; un intervento scorretto riaprirebbe un write/fetch boundary del clone.

## Esito finale audit
- `home sporca`: `NON RIPRODOTTA` nel worktree/runtime correnti
- `Analizza`: `BLOCCATO` dal `cloneWriteBarrier` globale
- patch runtime applicate: nessuna
