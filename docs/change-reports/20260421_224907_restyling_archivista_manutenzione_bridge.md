# Change Report

## Timestamp
- `2026-04-21 22:49:07`

## Obiettivo
- Riallineare la UI di `ArchivistaManutenzioneBridge` al mockup approvato con struttura a step 1-5, senza modificare handler, writer o logica business.

## File toccati
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Modifiche reali
- refactor del solo JSX del bridge manutenzione in 5 card step numerate;
- aggiunti i toggle UI:
  - `showMateriali` default `true`
  - `showAvvisi` default `false`
- mantenuti invariati:
  - `handleAnalyze`
  - `handleCheckDuplicates`
  - `handleArchive`
  - `handleCreateMaintenance`
  - writer e contratti dati;
- esteso `internal-ai.css` con classi dedicate a:
  - header step
  - thumbnails pagine
  - griglia campi estratti
  - sezioni collassabili
  - barra verde archivio
  - form step 5

## Verifiche tecniche
- `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
- `npm run build` -> `OK`

## Stato onesto
- Patch runtime: `COMPLETATA`
- Verifica browser del mockup live: `DA VERIFICARE`

## Rischi residui
- il mockup e stato implementato nel solo perimetro JSX/CSS, ma manca ancora la verifica browser completa dei 5 step e dei toggle nel runtime reale `/next/ia/archivista`.
