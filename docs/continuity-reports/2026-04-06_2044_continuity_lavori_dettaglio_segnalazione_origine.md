# Continuity Report - 2026-04-06 20:44

## Contesto
- Modulo: `Lavori` NEXT
- Stato modulo: `PARZIALE`
- Madre legacy: non toccata

## Continuita preservata
- Nessuna route nuova.
- Nessuna modifica a `src/pages/**`, shell, barriere clone o Firebase.
- Dettaglio lavoro sempre nello stesso flusso:
  - modale dalla dashboard unificata
  - route diretta `/next/dettagliolavori/:lavoroId`
- Nessuna nuova scrittura: la segnalazione originale si apre solo in read-only.

## Punto di integrazione reale
- `src/next/NextDettaglioLavoroPage.tsx` usa il reader NEXT esistente:
  - `readNextAutistiReadOnlySnapshot(...)`

## Logica di sicurezza applicata
- Priorita al riferimento esplicito `source.id/originId`.
- Fallback solo su match stretto e univoco.
- Se il match non e sicuro:
  - nessuna apertura del modale segnalazione
  - nota chiara `Segnalazione originale non trovata` solo per i lavori nati da segnalazione.

## Verifica operativa
- Caso positivo verificato:
  - lavoro da segnalazione con testo reale `Freni da controllare`
  - apertura modale segnalazione originale con dati reali coerenti
- Caso negativo verificato:
  - lavoro senza match/autore origine apribile non espone aperture errate
