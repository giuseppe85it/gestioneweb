# Continuity Report - 2026-04-03 23:05 - Euromecc modulo nativo NEXT

## Stato finale
- Route reale attiva: `/next/euromecc`
- Sidebar: item flat `Euromecc` nella sezione `MAGAZZINO`
- Modulo: nativo NEXT, non clone della madre
- Persistenza: Firestore diretto sulle collection dedicate:
  - `euromecc_pending`
  - `euromecc_done`
  - `euromecc_issues`
- Stato documentale corretto dopo la V1: `PARZIALE`

## File principali
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/euromeccAreas.ts`
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextData.ts`

## Contratti confermati
- Date business: ISO `yyyy-mm-dd`
- Metadati Firestore: `Timestamp` per `createdAt` / `updatedAt`
- `EuromeccIssue` usa `type`, non `priority`
- Dati statici impianto separati dai dati dinamici Firestore
- Nessun uso di `storage/@euromecc_*`

## Verifiche eseguite
- `npx eslint src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts src/next/euromeccAreas.ts` -> `OK`
- `npm run build` -> `OK`
- Runtime locale verificato su `/next/euromecc` con:
  - apertura da sidebar
  - modale fullscreen da click mappa
  - scrittura reale pending/done/issues
  - chiusura issue
  - generazione e copia riepilogo

## Rischi residui
- Le policy Firestore effettive non sono verificabili dal repo per assenza di `firestore.rules` versionato.
- Il modulo e V1: non va marcato `CHIUSO` senza audit dedicato successivo.
