# Change Report - 2026-04-02 07:00

## Obiettivo
Portare `/next/materiali-da-ordinare` sul ramo standalone reale della madre, mantenendo `Materiali da ordinare` come unico ingresso procurement top-level visibile e lasciando intatti i runtime procurement secondari ancora vivi.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-04-02_0700_procurement-convergenza-madre-like-materiali-da-ordinare.md`
- `docs/continuity-reports/2026-04-02_0700_continuity_procurement-convergenza-madre-like-materiali-da-ordinare.md`

## Audit usato per decidere
- Madre: `src/pages/MaterialiDaOrdinare.tsx`, `src/pages/MaterialiDaOrdinare.css`, `src/pages/Acquisti.tsx`, `src/pages/OrdiniInAttesa.tsx`, `src/pages/OrdiniArrivati.tsx`, `src/pages/DettaglioOrdine.tsx`
- NEXT: `src/next/NextMaterialiDaOrdinarePage.tsx`, `src/next/NextProcurementStandalonePage.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx`
- Routing/consumer: `src/App.tsx`, `src/next/nextCloneNavigation.ts`, `src/next/nextStructuralPaths.ts`, `src/next/internal-ai/internalAiUniversalContracts.ts`

## Modifica applicata
- Rimossa la shell custom clone-specifica costruita nelle patch precedenti.
- Ripristinata nella NEXT la struttura standalone madre su:
  - header;
  - tabs;
  - workspace a due pannelli;
  - quick link;
  - tabella fabbisogni;
  - sticky bar;
  - modale placeholder.
- Mantenuti solo gli adattamenti minimi NEXT:
  - lettura fornitori tramite `readNextFornitoriSnapshot`;
  - navigate ai path `/next/*`;
  - blocchi read-only su aggiunta/eliminazione materiale, conferma ordine, upload foto, preventivo e PDF.

## Cosa non e stato cambiato
- Nessuna modifica a `src/App.tsx`.
- Nessuna rimozione di `NextProcurementStandalonePage`, `NextProcurementReadOnlyPanel`, `NextOrdiniInAttesaPage`, `NextOrdiniArrivatiPage`, `NextDettaglioOrdinePage`.
- Nessuna reintroduzione di ingressi procurement top-level secondari.

## Impatto
- Parity esterna di `Materiali da ordinare` piu vicina alla madre.
- `Materiali da ordinare` resta il solo procurement top-level visibile.
- Il runtime secondario procurement continua a funzionare dietro le quinte e non viene rotto.

## Verifica
- `npm run build` eseguito con esito positivo.

## Rischi residui
- I moduli secondari procurement restano ancora necessari per i consumer runtime gia presenti, quindi non sono ancora candidati a rimozione nel perimetro di questa patch.
