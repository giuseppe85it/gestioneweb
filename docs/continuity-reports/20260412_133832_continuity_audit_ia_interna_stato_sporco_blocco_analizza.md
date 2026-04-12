# CONTINUITY REPORT - AUDIT IA INTERNA DOCUMENTALE `HOME SPORCA` / `ANALIZZA BLOCCATO`

Data: 2026-04-12

## Stato lasciato
- nessun file runtime modificato;
- documentazione di stato aggiornata con esito audit;
- report di audit creato in `docs/change-reports/20260412_133832_audit_ia_interna_stato_sporco_blocco_analizza.md`.

## Fatti chiusi
- `/next/ia/interna` nel worktree/runtime correnti non apre una review sporca di default;
- la sola auto-riapertura documentale dimostrata passa da `reviewDocumentId` / `reviewSourceKey`;
- `Analizza` nel clone non fallisce per `disabled` o per handler assente;
- il click arriva al `fetch POST` legacy di `IADocumenti`, ma viene bloccato prima della rete da `cloneWriteBarrier.ts` come `fetch.runtime`.

## Fatti da non perdere
- browser verificato davvero su:
  - `http://localhost:5173/next/ia/interna`
  - `http://127.0.0.1:4174/next/ia/interna`
  - `http://localhost:5173/next/ia/documenti`
- `localStorage` presente ma non usato per riaprire review documentali:
  - `@next_internal_ai:universal_requests_v1`
  - `@next_internal_ai:tracking_memory_v1`
  - `@next_internal_ai:artifact_archive_v1`
- `sessionStorage` non usato nel flusso documentale verificato.

## Se si riapre il follow-up
- per la `home sporca`, partire dai chiamanti che navigano a `/next/ia/interna` e verificare se qualcuno aggiunge query di review o usa una build stale; nel worktree corrente non c'e una causa runtime riproducibile oltre alla query esplicita;
- per `Analizza`, decidere prima il modello:
  - blocco UI onesto nel clone senza invocare il `POST` legacy
  - oppure riattivazione vera con decisione esplicita su barrier / backend consentito
- non toccare il barrier alla cieca: il guard che blocca oggi e `fetch.runtime` sul `POST` verso `estrazioneDocumenti`.
