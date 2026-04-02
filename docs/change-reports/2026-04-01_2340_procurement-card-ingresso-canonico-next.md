# Change Report - 2026-04-01 23:40

## Obiettivo
Chiudere il problema reale della famiglia procurement nella card `Acquisti e ordini` di `Gestione Operativa`, mantenendo solo ingressi NEXT stabili e non bianchi.

## File toccati
- `src/next/NextGestioneOperativaPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Causa reale trovata
- In `src/App.tsx` la famiglia procurement ha piu route attive:
  - `/next/acquisti`
  - `/next/acquisti/dettaglio/:ordineId`
  - `/next/materiali-da-ordinare`
  - `/next/ordini-in-attesa`
  - `/next/ordini-arrivati`
  - `/next/dettaglio-ordine/:ordineId`
- Le route `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati` e `dettaglio ordine` montano tutte lo stesso workbench `NextProcurementStandalonePage` / `NextProcurementReadOnlyPanel`.
- La route `/next/materiali-da-ordinare` monta invece la pagina dedicata `NextMaterialiDaOrdinarePage`.
- Dai test runtime riportati e dalla struttura corrente, la card famiglia non deve piu esporre i deep link procurement instabili; il punto di ingresso prudente e dedicato e `Materiali da ordinare`.

## Fix applicato
- `Acquisti e ordini` usa ora `NEXT_MATERIALI_DA_ORDINARE_PATH` come CTA principale.
- I secondari `Ordini in attesa` e `Ordini arrivati` sono stati rimossi dalla card.
- Resta solo `Materiali da ordinare` come accesso secondario coerente.

## Verifiche
- `npm run build` -> OK
- Restano solo warning preesistenti su `jspdf` e chunk size.
