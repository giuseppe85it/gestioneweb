# CHANGE REPORT - Base universale IA clone/NEXT

## Data
- 2026-03-26 19:21

## Tipo task
- patch

## Obiettivo
- costruire la base reale del sistema universale chat/IA nel clone/NEXT, con registry totale, resolver, orchestrator, router documenti, riuso capability gia deployate e tracciabilita documentale coerente

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiChatOrchestratorBridge.ts
- src/next/internal-ai/InternalAiUniversalWorkbench.tsx
- src/next/internal-ai/internalAiUniversalComposer.ts
- src/next/internal-ai/internalAiUniversalContracts.ts
- src/next/internal-ai/internalAiUniversalDocumentRouter.ts
- src/next/internal-ai/internalAiUniversalEntityResolver.ts
- src/next/internal-ai/internalAiUniversalOrchestrator.ts
- src/next/internal-ai/internalAiUniversalRegistry.ts
- src/next/internal-ai/internalAiUniversalRequestResolver.ts
- src/next/internal-ai/internalAiUniversalTypes.ts
- docs/product/REGISTRY_TOTALE_CLONE_NEXT.md
- docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md
- docs/architecture/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md
- docs/architecture/ENTITY_MODEL_RESOLVER_UNIVERSALE_IA_NEXT.md
- docs/product/PIANO_ASSORBIMENTO_MODULI_RESIDUI_IA_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-26_1921_patch_base-universale-ia-clone-next.md
- docs/continuity-reports/2026-03-26_1921_continuity_base-universale-ia-clone-next.md

## Riassunto modifiche
- introdotto un seed reale del registry universale del clone/NEXT con moduli, route, modali, entita, adapter, capability IA e gap
- introdotti entity resolver, request resolver, document router, composer e orchestrator universali nel perimetro `src/next/internal-ai/*`
- agganciato il layer universale alla pagina `/next/ia/interna` e al bridge chat, cosi il thread espone ora piano universale, action intent e routing allegati
- censite e riassorbite come capability le funzioni IA gia deployate coerenti con il clone/NEXT, evitando di trattarle come prodotto finale separato
- aggiunti documenti permanenti di registry, matrice copertura, contract standard, entity model e piano residui
- aggiornati stato progetto, stato migrazione NEXT, stato avanzamento IA, checklist IA e registro modifiche clone

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- la chat `/next/ia/interna` smette di essere solo console verticale e diventa gateway universale iniziale del clone/NEXT
- i domini gia chiusi non sono piu presentati come obiettivo finale ma come adapter sotto il layer universale
- il clone/NEXT dispone ora di una base documentale e runtime coerente per assorbire moduli futuri tramite contract standard

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna universale
- Dossier / mezzi
- Centro di Controllo
- Operativita / magazzino
- Procurement
- Autisti
- Cisterna
- Hub IA documenti/libretti

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: governance endpoint IA multipli, contratto finale allegati preventivi, stream eventi autisti canonico, gate moduli futuri

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- ia interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- il routing documentale produce oggi handoff e staging, ma non un prefill end-to-end uniforme dei moduli target
- il verticale cisterna e censito ma ancora non pienamente fuso nel planner generico
- il live-read business resta chiuso e deve restare tale finche non esistono prerequisiti reali verificati

## Build/Test eseguiti
- npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx -> OK
- npm run build -> OK, con warning Vite preesistente su chunk grandi e doppio import `jspdf`

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
