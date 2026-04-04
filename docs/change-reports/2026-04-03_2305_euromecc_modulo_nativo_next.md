# Change Report - 2026-04-03 23:05 - Euromecc modulo nativo NEXT

## Obiettivo
Costruire la V1 del nuovo modulo nativo NEXT `Euromecc` dentro `/next`, con route reale, voce sidebar sotto `MAGAZZINO`, UI a 4 tab e persistenza Firestore dedicata.

## File toccati
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextData.ts`
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/euromeccAreas.ts`
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Cosa cambia
- Nuova route `/next/euromecc` montata sotto `NextShell` con guard `operativita-globale`.
- Nuovo item sidebar `Euromecc` nella sezione `MAGAZZINO`.
- Nuovo domain `nextEuromeccDomain.ts` con:
  - collection dedicate `euromecc_pending`, `euromecc_done`, `euromecc_issues`
  - reader `readEuromeccSnapshot()`
  - writer reali `addEuromeccPendingTask`, `deleteEuromeccPendingTask`, `closeEuromeccPendingByAreaSub`, `addEuromeccDoneTask`, `addEuromeccIssue`, `closeEuromeccIssue`
  - helper stato `getSubStatus`, `getAreaStatus`, `daysAgo`, `withinRange`
- Nuovo file statico `euromeccAreas.ts` con topologia impianto e componenti, senza dati manutentivi dinamici.
- Nuova pagina `NextEuromeccPage.tsx` con:
  - tab `Home`, `Manutenzione`, `Problemi`, `Riepilogo`
  - mappa SVG cliccabile
  - modale fullscreen dettaglio area
  - schema tecnico silo con hotspot
  - form manutenzione da fare / fatta
  - form nuova segnalazione e chiusura problema
  - riepilogo testuale copiabile e stampabile
- Nuovo CSS scoped `eur-*` senza dipendenze da CSS legacy della madre.

## Boundary preservato
- Nessun import da `src/pages/**`.
- Nessun uso di `storage/@...`, `storageSync`, `cloneWriteBarrier` o writer legacy.
- Nessuna modifica a `NextShell.tsx`, `nextAccess.ts` o altri domain esistenti.
- Modulo dichiarato come nativo NEXT e non clone della madre.

## Verifiche
- `npx eslint src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts src/next/euromeccAreas.ts` -> `OK`
- `npm run build` -> `OK`
- Runtime locale:
  - sidebar `Euromecc` apre `/next/euromecc`
  - click nodo mappa apre modale fullscreen
  - add pending -> snapshot aggiornato
  - add done -> snapshot aggiornato
  - add issue -> snapshot aggiornato
  - close issue -> snapshot aggiornato
  - riepilogo generato e copiato negli appunti

## Stato modulo
- `Euromecc` -> `PARZIALE`
