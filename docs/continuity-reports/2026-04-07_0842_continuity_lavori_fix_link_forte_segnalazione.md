# Continuity Report - 2026-04-07 08:42

## Contesto
- Modulo: `Lavori` NEXT
- Stato modulo: `PARZIALE`
- Madre legacy: non toccata

## Continuita preservata
- Nessuna route nuova.
- Nessuna modifica a shell, clone barrier, Firebase o file legacy.
- Nessuna nuova scrittura.
- Il modale della segnalazione originale resta secondario e read-only.

## Flusso dati confermato
- Collegamento primario:
  - `source.type === "segnalazione"`
  - `source.id/originId`
- Collegamento secondario:
  - `linkedLavoroId`
  - `linkedLavoroIds`
- Il testo problema proviene solo dal record segnalazione origine e non piu da campi del lavoro.

## Verifica operativa
- Caso positivo verificato:
  - lavoro `7c6af494-9b02-4bf2-ac67-c994b39436c0`
  - testo reale mostrato: `Freni da controllare`
  - stesso risultato da modale dashboard e da route diretta
- Caso negativo verificato:
  - lavoro `daade4a2-c681-46d0-99d4-1906d151116d`
  - nessun `Apri segnalazione`
  - nessuna apertura errata
