# Change Report - 2026-04-05 08:35 - Euromecc hidden data manager

## Perimetro
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Obiettivo
- Aggiungere nel modulo Euromecc un pannello discreto `Gestione dati Euromecc` per visualizzare, modificare ed eliminare record di:
  - `euromecc_issues`
  - `euromecc_pending`
  - `euromecc_done`

## Modifiche applicate
- Domain:
  - aggiunti `updateEuromeccPendingTask`, `updateEuromeccDoneTask`, `updateEuromeccIssue`;
  - aggiunti `deleteEuromeccDoneTask`, `deleteEuromeccIssue`;
  - mantenuto invariato il perimetro Firestore e la shape dei documenti esistenti.
- UI:
  - aggiunto bottone discreto `Impostazioni` nell'header Euromecc;
  - introdotto modale `Gestione dati Euromecc` con tre sezioni `Segnalazioni`, `Da fare`, `Fatte`;
  - aggiunti ricerca testuale e filtro area;
  - aggiunti form di modifica inline nel manager e conferma delete obbligatoria.
- CSS:
  - aggiunti stili scoped `eur-*` per toolbar, filtri, card manager, form edit e modal width dedicata.

## Vincoli rispettati
- nessuna nuova route;
- nessuna nuova tab pubblica;
- nessuna modifica a `src/App.tsx`, `nextData.ts`, `nextStructuralPaths.ts`, `firebase.json`, `firestore.rules`;
- nessun file `src/pages/**` toccato.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts` -> `OK`
- `npm run build` -> `OK`
- runtime locale su `/next/euromecc`:
  - pannello nascosto apribile;
  - tre sezioni visibili;
  - modifica reale verificata su segnalazione, manutenzione da fare, manutenzione fatta;
  - eliminazione reale verificata sulle stesse tre famiglie;
  - cleanup finale dei record temporanei di test.
