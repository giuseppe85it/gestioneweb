# CHANGE REPORT - Memoria operativa locale IA

- Data: 2026-03-13 00:18
- Tipo: code
- Area: sottosistema IA interno clone `/next/ia/interna*`

## Obiettivo
Introdurre la prima memoria operativa locale e il primo tracking persistente del sottosistema IA interna, ma solo nel perimetro IA del clone e senza toccare i flussi business del gestionale.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-13_0018_patch_memoria-operativa-locale-ia.md`
- `docs/continuity-reports/2026-03-13_0018_continuity_memoria-operativa-locale-ia.md`

## Sintesi tecnica
- Introdotto uno store locale namespaced per tracking e memoria del solo modulo IA interno.
- Il sottosistema memorizza:
  - ultime targhe cercate;
  - prompt recenti della chat;
  - artifact recenti aperti, salvati o archiviati;
  - intenti usati;
  - ultimo stato di lavoro del modulo.
- Il tracking registra solo eventi del subtree IA:
  - aperture sezione;
  - selezione targa;
  - esecuzione report;
  - prompt chat;
  - azioni artifact.
- L'overview di `/next/ia/interna` mostra ora una sezione minima di memoria recente.

## Sicurezza e perimetro
- Nessuna scrittura su dataset business.
- Nessun riuso runtime di moduli IA legacy.
- Nessun segreto lato client.
- Nessun tracking globale di pagine o flussi fuori da `/next/ia/interna*`.

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiMockRepository.ts`
- `npm run build`

## Esito finale
- Stato: `FATTO`
- Rischio: `NORMALE`
- Note residue:
  - la memoria resta solo locale al browser/dispositivo;
  - non sostituisce una futura memoria operativa completa lato backend o gestionale.
