# Continuity Report - 2026-04-07 09:27

## Obiettivo chiuso
Il dettaglio `Lavori` NEXT supporta ora anche i lavori nati da `controllo mezzo KO`, senza rompere il flusso gia corretto dei lavori nati da `segnalazione`.

## Stato finale verificato
- `src/next/NextDettaglioLavoroPage.tsx` distingue davvero:
  - `source.type = "segnalazione"`
  - `source.type = "controllo"`
- Il blocco UI e ora `Problema / esito origine`.
- Il lavoro da controllo mostra il testo reale dell'origine:
  - priorita `note`
  - fallback `dettaglio`
  - fallback `messaggio`
  - append `Check KO: ...` dai KO reali del payload controllo
- Il bottone origine e contestuale:
  - `Apri segnalazione`
  - `Apri controllo`
- Entrambe le aperture restano in modale read-only, senza route nuove.

## Collegamenti dati canonici usati
- Lavoro -> controllo:
  - forte: `lavoro.source.id/originId` -> `controllo.id`
  - fallback reale: `controllo.linkedLavoroId/linkedLavoroIds`
- Lavoro -> segnalazione:
  - invariato rispetto al fix precedente

## Guard rail confermati
- Nessun fallback fragile su targa/autore/testo per aprire controlli.
- Se il match controllo non e sicuro, il dettaglio non apre nulla e mostra messaggio esplicito.
- Nessuna nuova scrittura, nessuna route nuova, nessun file fuori whitelist runtime.

## Verifiche gia eseguite
- `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx` -> OK
- `npm run build` -> OK
- `npm run lint` -> KO per problemi storici del repo fuori perimetro
- Runtime reale verificato:
  - modale dettaglio da `/next/lavori-in-attesa` per caso segnalazione
  - modale dettaglio da `/next/lavori-in-attesa` per caso controllo
  - route diretta caso segnalazione
  - route diretta caso controllo
  - controllo multi-link via `linkedLavoroIds`
  - replay locale anti-match fragile senza `source.id` e senza backlink -> nessuna apertura

## Dati reali usati nei test
- Segnalazione:
  - lavoro `7c6af494-9b02-4bf2-ac67-c994b39436c0`
  - origine `5cdfe350-804f-45c8-879b-433574b0700d`
- Controllo:
  - lavoro `daade4a2-c681-46d0-99d4-1906d151116d`
  - origine `1667f266-5160-4163-a5a3-14796034b1c6`
- Multi-link controllo:
  - controllo `44ebe449-2750-45e6-add6-4d5c8ef9a8d3`
  - lavori `82df827a-b18b-43fa-b4ee-abf8e3b36389` e `f8288347-2b06-4976-9e86-8ea152da1bd2`

## Prossimo punto se si riapre il modulo
- Audit separato del modulo `Lavori` per verificare lo stato finale `PARZIALE` dopo:
  - redesign unificato
  - deroga chirurgica scrittura `@lavori`
  - fix segnalazione origine
  - fix controllo origine
