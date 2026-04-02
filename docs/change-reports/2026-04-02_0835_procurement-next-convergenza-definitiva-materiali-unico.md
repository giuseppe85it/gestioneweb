# Change Report - 2026-04-02 08:35

## Scopo
Chiudere la convergenza della famiglia procurement NEXT facendo di `Materiali da ordinare` il solo modulo top-level visibile e declassando i path secondari a compatibilita.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche eseguite
- `NextMaterialiDaOrdinarePage` ora usa un path canonico unico e assorbe ordini, arrivi, dettaglio ordine e preview prezzi/preventivi dentro la stessa pagina.
- `NextProcurementConvergedSection` concentra le viste secondarie procurement senza creare nuove route top-level.
- `NextProcurementReadOnlyPanel` e stato reso riusabile anche in modalita embedded.
- `NextProcurementStandalonePage` e stato ridotto a redirect di compatibilita dai vecchi path procurement al modulo unico `/next/materiali-da-ordinare`.

## Impatto
- UI procurement top-level unificata.
- Nessuna scrittura business riaperta.
- Compatibilita preservata per i consumer che puntano ancora ai path storici procurement.

## Verifica
- `npm run build`
