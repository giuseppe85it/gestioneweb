# Continuity Report

## Data
2026-04-01

## Tipo intervento
Fix UI del modale procurement NEXT.

## Continuita garantita
- `Materiali da ordinare` resta l'unico ingresso procurement top-level in NEXT
- `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine` restano invariati
- nessuna route procurement modificata
- nessuna logica business modificata
- nessun writer o shape dati modificato

## Esito
Il modale procurement NEXT usa ora una shell visiva piu fedele alla madre pur restando nel runtime NEXT corrente.

## Verifica eseguita
- `npm run build` completato con esito positivo
