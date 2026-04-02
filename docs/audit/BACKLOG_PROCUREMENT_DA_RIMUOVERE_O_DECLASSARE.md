# Backlog procurement - da rimuovere o declassare

## Moduli da togliere dalla UI top-level
- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`

## Moduli da declassare a supporto tecnico
- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`

## Moduli candidati a rimozione codice
- Nessuno, nello stato attuale del runtime NEXT

## Punti DA VERIFICARE
- Verificare se esistono consumer esterni al perimetro NEXT che aprono ancora direttamente le route procurement secondarie.
- Verificare se il registry IA universale procurement potra convergere in futuro su un solo ingresso `Materiali da ordinare`.
- Verificare se una futura evoluzione di `Materiali da ordinare` assorbira davvero liste ordini/arrivi e dettaglio, rendendo poi rimovibili le superfici secondarie anche lato codice.
