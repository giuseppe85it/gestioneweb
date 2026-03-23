# CHANGE REPORT - Copertura runtime UI quasi totale verificabile della NEXT

## Data
- 2026-03-23 12:49

## Tipo task
- ui

## Obiettivo
- Portare l'osservatore runtime della nuova IA alla massima copertura UI verificabile della NEXT nel perimetro read-only, rendendo completa anche la vista compatta che arriva alla chat server-side.

## File modificati
- backend/internal-ai/server/internal-ai-next-runtime-observer.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- scripts/internal-ai-observe-next-runtime.mjs
- src/next/NextInternalAiPage.tsx
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Esteso il catalogo runtime NEXT a 53 route candidate con piu route annidate, dinamiche e stati interni whitelist-safe.
- Rigenerata la copertura reale del clone con esito verificato: 52 route osservate, 70 screenshot, 26 stati tentati e 18 stati osservati.
- Aggiornata `/next/ia/interna` per mostrare tutte le route e tutti gli stati osservati, con breakdown per tipo di stato e requested path vs final path.
- Estesa la snapshot repo/UI compatta usata dalla chat server-side, cosi la nuova IA riceve tutte le route runtime osservate e non solo un piccolo campione iniziale.
- Aggiornati stato progetto, stato NEXT, checklist IA e registro clone con limiti residui dichiarati in modo esplicito.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La nuova IA vede quasi tutta la NEXT osservabile in modo sicuro e puo motivare meglio dove integrare modali, tab, card, pagine e file.
- La guida `schermata -> file/modulo/flusso` diventa piu concreta perche si appoggia a tutta la copertura runtime osservata e non a un sottoinsieme ridotto.
- Nessun impatto su madre, scritture business, segreti lato client o bridge Firestore/Storage business live.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna NEXT
- backend IA separato
- observer runtime NEXT
- mapping integrazione UI/file/flusso

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: copertura runtime residua ancora dipendente da trigger visibili nel clone e blocchi gia aperti su policy Firestore/Storage effettive

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Resta non osservata oggi la route dinamica `Acquisti` dettaglio per assenza affidabile del trigger `Apri` nel runtime locale.
- Restano 8 stati interni non osservabili in modo sicuro per controlli nascosti, data-dependent o disabilitati dal guard rail read-only del clone.
- L'osservatore resta governato e read-only: non va trasformato in un crawler libero con click generici.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js -> OK
- node --check scripts/internal-ai-observe-next-runtime.mjs -> OK
- node --check backend/internal-ai/server/internal-ai-repo-understanding.js -> OK
- node --check backend/internal-ai/server/internal-ai-adapter.js -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs -> OK
- npm run internal-ai:observe-next -> OK (`52/53` route, `18/26` stati, `70` screenshot)
- rebuild snapshot repo/UI server-side -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
