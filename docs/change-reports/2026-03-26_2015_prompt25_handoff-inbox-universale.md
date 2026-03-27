# CHANGE REPORT - Prompt 25 handoff e inbox universale

## Data
- 2026-03-26 20:15

## Tipo task
- patch

## Obiettivo
- chiudere i gap operativi residui del gateway universale NEXT introducendo handoff standard, prefill canonico, inbox documentale universale, enforcement runtime per moduli futuri e scenari E2E tracciabili

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/InternalAiUniversalWorkbench.tsx`
- `src/next/internal-ai/InternalAiUniversalRequestsPanel.tsx`
- `src/next/internal-ai/internalAiUniversalConformance.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `src/next/internal-ai/internalAiUniversalTypes.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalEntityResolver.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalComposer.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/REGISTRY_TOTALE_CLONE_NEXT.md`
- `docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md`
- `docs/architecture/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md`
- `docs/architecture/ENTITY_MODEL_RESOLVER_UNIVERSALE_IA_NEXT.md`
- `docs/product/PIANO_ASSORBIMENTO_MODULI_RESIDUI_IA_NEXT.md`
- `docs/product/SCENARI_E2E_IA_UNIVERSALE_NEXT.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- introdotto il payload standard `iaHandoff` con route target uniformi, prefill canonico, stato richiesta, capability riusata e campi da verificare
- trasformata `/next/ia/interna/richieste` in inbox documentale universale reale con documenti ambigui, motivi classificazione, azioni possibili e handoff tracciato
- persistiti handoff e inbox nel repository locale isolato del sottosistema IA a ogni turno chat reale
- chiusi lato sistema universale i flussi D06 procurement, D09 cisterna, next.autisti, next.ia_hub e next.libretti_export con instradamento e payload uniforme
- attivato un gate runtime per moduli futuri tramite conformance summary e documentati gli scenari E2E minimi

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la chat universale non si limita piu a suggerire un modulo: emette un handoff standard riusabile verso il target corretto del clone
- la classificazione documentale ambigua non cade piu nello staging generico ma in una inbox documentale esplicita e tracciata
- la documentazione ufficiale del progetto viene riallineata al nuovo stato reale della base universale

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna universale
- procurement
- cisterna
- autisti
- hub IA clone
- libretti export

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: governance moduli futuri e consumo nativo del payload `iaHandoff` nei moduli target

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- i moduli target non consumano ancora tutti in autonomia il payload `iaHandoff`
- il live-read business resta correttamente chiuso e non va riaperto in task collaterali

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
- `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
