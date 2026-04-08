# Continuity Report - 2026-04-08 14:42

## Contesto
Sostituzione definitiva del blocco metriche nella tab `Nuova / Modifica` di `Manutenzioni` NEXT.

## Stato prima
- Il blocco risultava ancora ambiguo: troppo forzato o troppo alto a seconda del tentativo applicato.

## Stato dopo
- Il blocco usa una sola riga compatta.
- I tre gruppi `Data`, `KM/Ore`, `Fornitore` sono separati da gap reale.
- Non esistono piu mini-card o wrapper beige alti per singolo campo.

## Confini rispettati
- Nessuna modifica a business, Firestore, domain, PDF, foto, dettaglio o routing.
- Solo `src/next/NextManutenzioniPage.tsx` e `src/next/next-mappa-storico.css` toccati sul runtime.

## Stato modulo
- `Manutenzioni`: `PARZIALE`
