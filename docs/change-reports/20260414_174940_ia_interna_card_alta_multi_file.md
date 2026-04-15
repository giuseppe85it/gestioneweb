# CHANGE REPORT

- Data: 2026-04-14
- Timestamp: 20260414_174940
- Titolo: IA interna card alta `Documento + Analizza` abilitata al multi-file
- Rischio: ELEVATO

## Obiettivo
- Estendere alla card alta reale di `/next/ia/interna` la stessa capability multi-file gia approvata nel flusso chat/allegati, senza cambiare il caso singolo e senza toccare backend o madre.

## File toccati
- `src/next/NextInternalAiPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- La card alta `Tipo atteso / Documento / Analizza` accetta ora selezione multipla.
- Con `1 file` resta attivo il flusso invariato basato su `useIADocumentiEngine()`.
- Con `2 o piu file` compare il toggle `Tratta questi file come un unico documento`, attivo di default.
- Il click su `Analizza` nel ramo multi-file riusa il percorso allegati/orchestrazione gia esistente.
- La classificazione multi-file della card alta usa prompt neutro, cosi non dipende dal draft del composer.

## Impatto
- UI: la card alta reale supporta finalmente il multi-file nell'ingresso usato davvero dall'utente.
- Lettura: l'estrazione del file singolo non cambia; il multi-file continua a costruire un solo riepilogo aggregato.
- Scritture: nessun writer nuovo, nessuna modifica al backend IA, nessun cambio a barrier o madre.

## Verifiche
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentAnalysis.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts` -> OK
- `npm run build` -> OK

## Stato onesto
- Patch completata nel perimetro richiesto.
- Rischio residuo: la card alta multi-file sostituisce il contesto allegati corrente per evitare due implementazioni divergenti nella stessa pagina.
