# Change Report - 2026-04-07 20:05

## Obiettivo
Riallineare solo la UI del tab `Quadro manutenzioni PDF` di `/next/manutenzioni` da struttura a card/quadro a struttura elenco filtrabile ed esportabile.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- Mantenuti i 2 step filtro `Soggetto` e `Periodo`.
- Sostituita la struttura principale del tab con un elenco di righe esportabili.
- Ogni riga mostra foto mezzo, targa, modello/compressore, autista solito, `Km ultimo rifornimento`, data manutenzione, tipo/manutenzione e azioni `PDF` + `Apri dettaglio`.
- Riepilogo rapido e cronologia spostati sotto come supporto secondario.
- Aggiornato il CSS scoped `.mx-*` per una resa elenco-first coerente con il tono tecnico del modulo.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx` -> OK
- `npm run build` -> OK
- Runtime locale su `http://127.0.0.1:4173/next/manutenzioni`:
  - `Step 1` presente
  - `Step 2` presente
  - elenco risultati presente
  - vecchia struttura principale `.mx-pdf-result-card` assente
  - azioni `PDF mezzo` / `PDF compressore` e `Apri dettaglio` presenti

## Limiti
- Nessuna modifica a business, writer, domain business, `cloneWriteBarrier.ts`, route o PDF engine.
