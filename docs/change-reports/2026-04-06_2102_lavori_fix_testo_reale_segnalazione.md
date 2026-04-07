# Change Report - 2026-04-06 21:02

## Modulo
- `Lavori` NEXT

## Obiettivo
- Correggere il recupero del testo reale della segnalazione autista nel dettaglio lavoro, eliminando il caso runtime in cui `Problema segnalato` restava `—`.

## File toccati
- `src/next/NextDettaglioLavoroPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Fix applicato
- Il dettaglio non si affida piu solo alla vista normalizzata del reader segnalazioni.
- Legge ora anche il payload reale del dataset `@segnalazioni_autisti_tmp`.
- Ordine di match:
  1. `source.id/originId`
  2. `linkedLavoroId/linkedLavoroIds`
  3. fallback stretto e univoco su targa + autore + tipo + testo reale

## Campo reale usato
- Caso verificato: `descrizione`
- Campi controllati in fallback:
  - `note`
  - `messaggio`
  - `dettaglio`
  - `testo`

## Perche prima usciva `—`
- Il resolver precedente non sfruttava il backlink reale `linkedLavoroId/linkedLavoroIds`.
- Quando il match non passava dalla vista normalizzata o dal solo `source.id`, il blocco ricadeva su `dettagli` del lavoro, che in questi casi era nullo.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx`
- `npm run build`
- verifica runtime reale su:
  - `/next/lavori-in-attesa`
  - `/next/dettagliolavori/7c6af494-9b02-4bf2-ac67-c994b39436c0?from=lavori-in-attesa`
