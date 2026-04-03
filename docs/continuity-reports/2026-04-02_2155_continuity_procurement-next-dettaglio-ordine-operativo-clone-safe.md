# Continuity Report - 2026-04-02 21:55

## Stato iniziale
- `/next/materiali-da-ordinare` aveva gia parity grafica piu stretta e parte della convergenza su `Fabbisogni`, `Ordini`, `Arrivi`, `Prezzi & Preventivi`.
- Il delta principale aperto era il ramo `Dettaglio ordine`, ancora fermo su UI bloccata e poco aderente al comportamento operativo madre.

## Intervento eseguito
- Portato il comportamento operativo di dettaglio dentro `src/next/NextProcurementReadOnlyPanel.tsx` senza riaprire route procurement top-level separate.
- Le azioni visibili del dettaglio ora seguono la sequenza madre, ma restano clone-safe sui side effect finali.

## Stato finale
- `Materiali da ordinare` resta il solo procurement top-level NEXT.
- Il drill-down `Ordini` / `Arrivi` -> `Dettaglio ordine` e ora piu vicino alla madre su:
  - stato ordine
  - modifica locale
  - aggiunta materiale
  - gestione foto
  - note ordine
  - PDF / anteprima / condivisione locali
- Stato modulo: `PARZIALE`

## Boundary preservati
- Dati letti solo dal domain NEXT procurement.
- Nessuna reintroduzione di runtime madre.
- Nessuna scrittura business reale.

## Prossimo delta aperto
- `src/next/NextMaterialiDaOrdinarePage.tsx`
  - workflow operativo completo di `Acquisti` non ancora 1:1
- `src/next/NextProcurementConvergedSection.tsx`
  - `Prezzi & Preventivi` e `Listino` ancora non equivalenti al 100%
- `src/next/NextProcurementReadOnlyPanel.tsx`
  - dettaglio ordine non persistente come la madre; resta locale clone-safe

## Verifica eseguita
- `npm run build` -> `OK`
