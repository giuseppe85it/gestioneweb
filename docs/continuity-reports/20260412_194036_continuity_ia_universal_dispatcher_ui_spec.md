# Continuity Report - 2026-04-12 19:40:36

## Contesto
Il task ha applicato la UI della spec `IA Universal Dispatcher` solo nel perimetro autorizzato del clone, senza toccare domain, orchestrator, writer, barrier o motori legacy.

## Stato lasciato
- Home `/next`:
  - card `Assistente IA` unica
  - prompt -> `/next/ia/interna` con `initialPrompt`
  - menu `+` -> `triggerUpload`
- `/next/ia/interna`:
  - shell dispatcher nuova
  - ingresso pulito senza reidratazione automatica degli allegati IA-only persistiti
  - review interna su motore documentale esistente
- `/next/ia/documenti`:
  - storico ufficiale read-only basato solo su `readNextIADocumentiArchiveSnapshot()`
  - filtri/sezioni reali limitati ai dati che il domain espone davvero

## Punto aperto reale
- Il task non puo essere dichiarato completo per la spec finche `src/next/domain/nextDocumentiCostiDomain.ts` non espone anche le sezioni storiche richieste dalla spec:
  - `Libretti`
  - `Cisterna`
  - `Manutenzioni`

## Prossimo step corretto
- Se si vuole chiudere la spec al 100%, serve un task separato che apra esplicitamente il domain read-only o un domain dedicato per estendere lo storico ufficiale.
- Se il domain non va aperto, la UI deve restare dichiarata `PARZIALE` in modo onesto.

## Verifiche gia eseguite
- `npm run build` -> `OK`
- Browser verificato davvero su `/next`, `/next/ia/interna`, `/next/ia/documenti`
- `Apri originale` e `Riapri review` verificati
- Nessun `Maximum update depth exceeded` osservato durante queste verifiche
