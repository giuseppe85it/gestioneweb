# Change Report - 2026-04-02 09:15

## Scopo
Correggere il loop infinito introdotto nel procurement convergente NEXT su `/next/materiali-da-ordinare`.

## File toccati
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Causa reale
- `readInternalAiUniversalRequestsRepositorySnapshot()` restituiva un nuovo oggetto snapshot a ogni chiamata.
- Lo snapshot conteneva nuovi array clonati ad ogni render.
- Il consumer `useInternalAiUniversalHandoffConsumer()` usa `useSyncExternalStore`, quindi React rilevava snapshot instabile e innescava il loop `getSnapshot should be cached` / `Maximum update depth exceeded`.

## Fix applicato
- Snapshot repository cacheato per identita di stato.
- Ritorno dello stesso oggetto snapshot finche `state` non cambia davvero.
- Rimossa la funzione `cloneState` non piu necessaria.

## Verifica
- `npm run build`
