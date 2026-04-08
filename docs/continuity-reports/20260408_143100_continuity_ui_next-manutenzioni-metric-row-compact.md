# Continuity Report - 2026-04-08 14:31

## Contesto
Correzione mirata della tab `Nuova / Modifica` di `Manutenzioni` NEXT.

## Stato prima
- La riga `Data / KM-Ore / Fornitore` usava tre box alti, percepiti come troppo pesanti.

## Stato dopo
- I tre campi vivono in una sola riga compatta.
- Restano separati da gap reale e bordi indipendenti, senza wrapper beige alti.
- `Mezzo attivo` mantiene uno stacco piu evidente da `Campi base`.

## Confini rispettati
- Nessuna modifica a business, Firestore, domain, PDF, foto, dettaglio o routing.
- Solo `src/next/NextManutenzioniPage.tsx` e `src/next/next-mappa-storico.css` toccati sul runtime.

## Stato modulo
- `Manutenzioni`: `PARZIALE`
