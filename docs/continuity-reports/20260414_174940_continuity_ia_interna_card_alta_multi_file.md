# CONTINUITY REPORT

- Data: 2026-04-14
- Timestamp: 20260414_174940
- Titolo: continuita operativa IA interna card alta multi-file

## Contesto
- La capability multi-file era gia presente nel flusso chat/allegati di `/next/ia/interna`.
- L'ingresso usato davvero dall'utente restava pero la card alta `Documento + Analizza`, ancora limitata al file singolo.

## Stato dopo la patch
- La card alta accetta ora anche `2 o piu file`.
- Il toggle `Tratta questi file come un unico documento` compare nella card alta ed e attivo di default solo nel ramo multi-file.
- Il caso `1 file` continua a usare il motore documentale esistente senza regressioni intenzionali.
- Il ramo multi-file della card alta non introduce un secondo motore: riusa il percorso allegati/orchestrazione gia approvato.

## File di riferimento
- `src/next/NextInternalAiPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`

## Verifiche gia eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentAnalysis.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts` -> OK
- `npm run build` -> OK

## Attenzioni residue
- Il caso in cui l'utente alterna card alta multi-file e composer chat nella stessa sessione resta da trattare con prudenza, perche la card alta sostituisce il contesto allegati corrente per mantenere un solo percorso coerente.
