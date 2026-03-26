# Change Report - 2026-03-26 09:02

## Titolo
Rifinitura locale D06 procurement read-only per NEXT e IA interna

## Obiettivo
Chiudere i residui emersi dall'audit di rivalutazione del Prompt 14 senza riaprire D06: lint locale sui file shared, header checklist coerente e confine descrittivo D05/D06 piu esplicito nel contenitore operativo globale.

## File toccati
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/pages/Acquisti.tsx`
- `src/next/NextOperativitaGlobalePage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cosa cambia davvero
- `NextCapoCostiMezzoPage` chiude il debito lint locale evitando mutazioni nel riepilogo e gestendo gli errori con `unknown` invece di `any`.
- `Acquisti.tsx` mantiene il workbench procurement read-only ma ripulisce il lint richiesto con micro-fix meccanici e con contenimento esplicito delle aree legacy non rifattorizzate.
- `NextOperativitaGlobalePage` chiarisce meglio che D06 resta separato da D05: ordini e procurement stanno nella loro card, mentre stock e movimenti materiali continuano nelle viste magazzino dedicate.
- La checklist IA e i registri clone/NEXT risultano di nuovo coerenti con lo stato reale del work-package.

## Impatto
- UI: nessuna nuova funzione, ma copy e segnali piu chiari sul confine D05/D06.
- IA/NEXT: D06 resta valido, read-only e separato da D05/D07/D08.
- Sicurezza: nessuna scrittura business riaperta, nessun impatto sulla madre.

## Verifiche
- `npm run build` -> OK
- `npx eslint src/next/NextCapoCostiMezzoPage.tsx src/pages/Acquisti.tsx src/next/NextOperativitaGlobalePage.tsx` -> OK

## Rischi residui
- `src/pages/Acquisti.tsx` resta un modulo legacy ampio: il task chiude il lint locale richiesto, ma non sostituisce un refactor tipizzato del file.
- Il confine D05/D06 e stato chiarito a livello di copy e tracciabilita, non con una riprogettazione del contenitore operativo.
