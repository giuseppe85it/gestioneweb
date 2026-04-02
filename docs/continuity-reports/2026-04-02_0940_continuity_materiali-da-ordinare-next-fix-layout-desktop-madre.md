# Continuity Report

- Data: 2026-04-02
- Modulo: procurement NEXT
- Pagina: `/next/materiali-da-ordinare`

## Stato iniziale
- Layout desktop ancora su shell standalone stretta e centrata.
- Pannello destro fuori proporzione.
- Sticky bar scura overlay in basso.

## Stato finale
- Layout desktop riallineato al ramo embedded/single-card della madre.
- Tabella larga dentro card unica.
- Footer azioni interno alla card.
- Nessuna sticky bar overlay desktop.

## Continuita funzionale
- Nessuna modifica a:
  - architettura procurement convergente
  - tab `Ordini`, `Arrivi`, `Prezzi & Preventivi`
  - route top-level procurement
  - blocchi read-only

## Verifica eseguita
- `npm run build` OK

