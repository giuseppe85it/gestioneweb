# CHANGE REPORT - 2026-04-16 19:34 - audit postpatch next libretto verifica

## Tipo intervento

Audit in sola lettura con verifica tecnica e browser del modulo `/next/ia/libretto`.

## File creati

- `docs/audit/AUDIT_POSTPATCH_NEXT_LIBRETTO_VERIFICA_2026-04-16_1934.md`

## Verifiche eseguite

- lettura del codice reale NEXT, legacy, barrier, downstream e rules
- `npx eslint src/next/NextIALibrettoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`
- prova browser reale su `/next/ia/libretto`

## Esito sintetico

Verdetto audit:

`PATCH NEXT LIBRETTO NON ALLINEATA ALLA MADRE`

## Motivo tecnico principale

La pagina NEXT contiene il codice applicativo di analyze e save allineato alla madre, ma il barrier blocca ancora `Analyze` in runtime.

La causa dimostrata e il confronto endpoint in `cloneWriteBarrier.ts`:

- costante barrier: `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`
- URL normalizzato runtime: `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app/`

Il mismatch impedisce la deroga `fetch.runtime`.

## Impatto

- runtime: nessuna patch
- madre: intoccata
- rischio introdotto: nullo
