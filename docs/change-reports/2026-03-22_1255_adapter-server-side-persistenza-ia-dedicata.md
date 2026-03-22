# CHANGE REPORT - Primo adapter server-side e persistenza IA dedicata

## Data
- 2026-03-22 12:55

## Tipo task
- patch

## Obiettivo
- portare il sottosistema IA interna dal solo backend mock-safe in-process a un primo adapter server-side reale, mantenendo fallback locale e senza aprire provider reali o scritture business

## File modificati
- `backend/internal-ai/README.md`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-persistence.js`
- `backend/internal-ai/runtime-data/.gitignore`
- `backend/internal-ai/runtime-data/.gitkeep`
- `backend/internal-ai/src/internalAiBackendContracts.ts`
- `backend/internal-ai/src/internalAiBackendService.ts`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `backend/internal-ai/src/index.ts`
- `package.json`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiServerPersistenceClient.ts`
- `src/next/internal-ai/internalAiServerPersistenceBridge.ts`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`

## Riassunto modifiche
- aperto un adapter HTTP locale reale e separato per il backend IA interno su `backend/internal-ai/server/internal-ai-adapter.js`
- introdotta una persistenza IA dedicata e isolata su file JSON locali in `backend/internal-ai/runtime-data/*` per artifact, memoria operativa e traceability minima
- collegato il frontend `/next/ia/interna*` a hydration e mirror mock-safe server-side, mantenendo fallback locale esplicito
- aggiornati contratti, catalogo capability e documentazione di stato per dichiarare che il backend IA separato non e piu solo scaffold

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- il clone IA interno puo usare un contenitore server-side dedicato e separato dai dataset business
- nessuna route legacy o business data viene toccata; preview e chat restano sugli stessi layer clone-safe gia attivi

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- `/next/ia/interna*`
- documentazione IA/NEXT/stato progetto

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: policy Firestore effettive; governance finale endpoint IA multipli

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro: sottosistema IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- l'adapter resta locale e mock-safe; non e ancora il deployment condiviso finale
- retrieval server-side di repo, Firestore o Storage business non e ancora attivo
- provider reali, segreti e policy infrastrutturali restano da chiudere in task separati

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiServerPersistenceClient.ts src/next/internal-ai/internalAiServerPersistenceBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
- smoke test adapter `health/read/write` via import Node locale -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
