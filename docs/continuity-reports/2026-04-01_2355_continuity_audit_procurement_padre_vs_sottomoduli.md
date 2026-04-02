# Continuity Report - 2026-04-01 23:55

## Contesto
Audit-only sulla famiglia procurement richiesto per decidere se `Materiali da ordinare` abbia sostituito il flusso composto da `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine`.

## Continuita garantita
- nessun impatto sul runtime;
- nessuna patch su madre o NEXT;
- decisione architetturale tracciata con distinzione esplicita tra fatti di codice e raccomandazione prodotto.

## Esito sintetico
- madre: padre reale `Acquisti`, non `Materiali da ordinare`;
- NEXT: ingresso top-level consigliato `Materiali da ordinare`, ma workbench ordini/arrivi/dettaglio ancora separato e secondario.
