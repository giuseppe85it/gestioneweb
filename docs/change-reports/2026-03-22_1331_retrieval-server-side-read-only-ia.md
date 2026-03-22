# CHANGE REPORT - Primo retrieval server-side read-only IA

## Data
- 2026-03-22 13:31

## Tipo task
- patch

## Obiettivo
- aprire il primo retrieval server-side controllato del backend IA separato, in sola lettura e senza usare backend legacy, provider reali o scritture business

## File modificati
- `backend/internal-ai/README.md`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-persistence.js`
- `backend/internal-ai/src/internalAiBackendContracts.ts`
- `backend/internal-ai/src/internalAiBackendHandlers.ts`
- `backend/internal-ai/src/internalAiBackendService.ts`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
- `backend/internal-ai/src/index.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
- `src/next/internal-ai/internalAiServerRetrievalClient.ts`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`

## Riassunto modifiche
- aperto l'endpoint `POST /internal-ai-backend/retrieval/read` sull'adapter server-side locale del backend IA separato
- introdotto il contenitore IA dedicato `fleet_readonly_snapshot.json` per il primo retrieval read-only mezzo-centrico
- creati i contratti TS del retrieval server-side e il client frontend per il seed/read dello snapshot
- collegata `libretto-preview` al retrieval server-side con fallback esplicito verso il bridge mock-safe o il facade locale
- aggiornati documenti di stato per chiarire che il retrieval attivo e ancora limitato a uno snapshot seedato dal clone

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- il backend IA separato puo iniziare a servire una prima lettura server-side controllata senza dipendere solo dalla logica frontend
- il clone mantiene i fallback esistenti e non tocca direttamente Firestore/Storage business dal lato server

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- capability `libretto-preview`
- `/next/ia/interna*`
- documentazione IA/NEXT/stato progetto

## Contratti dati toccati?
- SI

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
- il retrieval attivo non e ancora un business retrieval completo: legge uno snapshot seedato dal clone, non Firestore/Storage business diretti
- solo `libretto-preview` usa oggi questo canale server-side reale; il resto resta su ponti mock-safe o fallback locale
- disponibilita e freschezza dello snapshot dipendono dal seed lato clone nella sessione corrente

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts backend/internal-ai/src/internalAiServerPersistenceContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts` -> OK
- `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
- smoke test adapter `retrieval.read` via Node locale su porta dedicata `4311` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
