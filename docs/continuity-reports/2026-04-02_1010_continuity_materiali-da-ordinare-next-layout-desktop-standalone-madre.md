# Continuity Report

- Data: 2026-04-02
- Modulo: procurement NEXT
- Pagina: `/next/materiali-da-ordinare`

## Stato iniziale
- Top-level procurement su shell embedded/single-card.
- Resa desktop stretta, centrata e non coerente con la madre standalone.

## Stato finale
- Top-level procurement riportato su shell standalone desktop della madre.
- Tab convergenti mantenute.
- Nessuna modifica a route o architettura procurement.

## Continuita funzionale
- Restano invariati:
  - modulo top-level unico `Materiali da ordinare`
  - tab `Ordini`, `Arrivi`, `Prezzi & Preventivi`
  - modale placeholder
  - blocchi read-only

## Verifica eseguita
- `npm run build` OK

