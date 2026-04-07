# Continuity Report - 2026-04-06 21:02

## Contesto
- Modulo: `Lavori` NEXT
- Stato modulo: `PARZIALE`
- Madre legacy: non toccata

## Continuita preservata
- Nessuna route nuova.
- Nessuna modifica a shell, barriere clone, Firebase o file legacy.
- Nessuna nuova scrittura.
- Il modale segnalazione resta secondario e read-only.

## Correzione dati
- Il dettaglio legge ora direttamente il payload reale di `@segnalazioni_autisti_tmp`.
- Il resolver sfrutta il legame forte gia esistente nel dato autista:
  - `linkedLavoroId`
  - `linkedLavoroIds`

## Contratto utente preservato
- Il dettaglio continua a vivere:
  - come modale dalla dashboard `Lavori`
  - come route diretta `/next/dettagliolavori/:lavoroId`
- Nei casi senza match sicuro non apre segnalazioni sbagliate.

## Verifica operativa
- Caso positivo verificato:
  - lavoro `7c6af494-9b02-4bf2-ac67-c994b39436c0`
  - testo reale mostrato: `Freni da controllare`
  - stesso risultato da modale e da route diretta
