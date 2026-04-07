# Change Report - 2026-04-07 08:42

## Modulo
- `Lavori` NEXT

## Obiettivo
- Allineare `NextDettaglioLavoroPage.tsx` al flusso dati reale verificato dall'audit, evitando fallback fragili nel recupero della segnalazione autista origine.

## File toccati
- `src/next/NextDettaglioLavoroPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Fix applicato
- Il dettaglio mantiene il match forte su `source.type === "segnalazione"` + `source.id/originId`.
- Se il link diretto non basta, usa il backlink reale `linkedLavoroId/linkedLavoroIds` del record segnalazione.
- Il blocco `Problema segnalato` non usa piu `lavoro.dettagli` o `lavoro.note` come sostituto della segnalazione originale.
- Il testo reale viene letto solo dal record segnalazione matchato in quest'ordine:
  1. `descrizione`
  2. `note`
  3. `messaggio`
  4. `dettaglio`
  5. `testo`
- Se il record origine esiste ma non contiene testo, il messaggio mostrato e:
  - `Nessuna descrizione presente nella segnalazione originale`

## Verifiche
- `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx`
- `npm run build`
- verifica runtime reale su:
  - `/next/lavori-in-attesa` -> dettaglio modale del lavoro `7c6af494-9b02-4bf2-ac67-c994b39436c0`
  - `/next/dettagliolavori/7c6af494-9b02-4bf2-ac67-c994b39436c0?from=lavori-in-attesa`
  - `/next/dettagliolavori/daade4a2-c681-46d0-99d4-1906d151116d?from=lavori-in-attesa`
