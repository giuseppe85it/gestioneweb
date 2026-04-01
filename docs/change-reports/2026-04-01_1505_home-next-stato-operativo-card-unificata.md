# Change Report - 2026-04-01 15:05

## Contesto
- Prompt 7 in `MODE = OPERAIO`.
- Perimetro ammesso: `src/next/NextCentroControlloPage.tsx`, nuovi componenti `src/next/components/*` e documentazione clone.
- Obiettivo: unificare le card `Sessioni attive`, `Rimorchi: dove sono` e `Motrici e trattori: dove sono` in una sola card `Stato operativo`.

## Verifica preliminare nel codice
- Runtime NEXT letto:
  - `src/next/NextCentroControlloPage.tsx`
- Madre letta senza modifiche:
  - `src/pages/Home.tsx`
- Fatti verificati:
  - `Sessioni attive` in NEXT usa gia `sessioniAttive = sessioni` e porta a `NEXT_AUTISTI_INBOX_PATH`, non a `360`;
  - `Rimorchi` e `Motrici` leggono gia da `snapshot.rimorchiDaMostrare` e `snapshot.motriciTrattoriDaMostrare`;
  - i due blocchi asset usano gia `NEXT_AUTISTI_ADMIN_PATH` come superficie NEXT corrente per il dettaglio operativo.

## Modifica applicata
- Creato `src/next/components/StatoOperativoCard.tsx`.
- In `src/next/NextCentroControlloPage.tsx`:
  - montata la nuova card `Stato operativo` al posto della card separata `Sessioni attive`;
  - passati alla card i tre dataset gia presenti nel runtime (`sessioni`, `rimorchiDaMostrare`, `motriciTrattoriDaMostrare`);
  - mantenuti i collegamenti NEXT esistenti:
    - `Sessioni` -> `Autisti Inbox (admin)`
    - `Rimorchi` / `Motrici` -> `Autisti/Admin`
  - nascosti i due blocchi separati `Rimorchi` e `Motrici` dal layout principale.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/StatoOperativoCard.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-04-01_1505_home-next-stato-operativo-card-unificata.md`
- `docs/continuity-reports/2026-04-01_1505_continuity_home-next-stato-operativo-card-unificata.md`

## Esito verifica
- Build eseguita con `npm run build`: OK.
- Warning residui preesistenti: `jspdf` e chunk size Vite.

## Limiti residui
- `Rimorchi` e `Motrici` mantengono per ora la superficie completa su `Autisti/Admin` gia in uso nel runtime NEXT; non e stato introdotto un dettaglio dedicato nuovo per evitare refactor fuori scopo.
