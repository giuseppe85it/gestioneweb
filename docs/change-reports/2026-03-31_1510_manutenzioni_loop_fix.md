# Change Report - Manutenzioni Loop Fix

- Timestamp: `2026-03-31 15:10 Europe/Rome`
- Modulo: `Manutenzioni`
- Obiettivo: chiudere `/next/manutenzioni` come clone fedele read-only della madre.

## Runtime
- `src/next/NextManutenzioniPage.tsx`
  - rimosso `NextClonePageScaffold`;
  - introdotta una superficie madre-like su form manutenzione, materiali utilizzati, storico, filtri e modal gomme;
  - mantenute visibili le CTA della madre, con blocco read-only esplicito su salvataggio, delete, PDF e conferma modal gomme;
  - eliminati i percorsi runtime che potevano falsare la parity con summary clone-specifici.

## Domain
- `src/next/domain/nextManutenzioniDomain.ts`
  - aggiunto `readNextManutenzioniWorkspaceSnapshot()` per leggere storico reale `@manutenzioni` e mezzi reali `@mezzi_aziendali`;
  - aggiunti i tipi `NextManutenzioniMezzoOption` e `NextManutenzioniWorkspaceSnapshot`.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts` -> `OK`
- `npm run build` -> `OK`

## Esito
- Modulo `Manutenzioni`: `PASS`
- Tracker loop: `Manutenzioni = CLOSED`
- Nota finale: loop modulo-per-modulo completato; consigliato audit finale globale separato.
