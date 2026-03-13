# CHANGE REPORT - Fix crash IA interna clone

## Data
- 2026-03-12 21:48

## Tipo task
- fix

## Obiettivo
- Correggere il crash della pagina IA interna clone eliminando il loop di render e i warning direttamente collegati al tracking locale.

## File modificati
- `src/next/internal-ai/internalAiTracking.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Corretto `getSnapshot` del tracking IA interno per restituire un valore cached e stabile.
- Aggiornato lo snapshot solo quando il tracking cambia davvero tramite `emitChange()`.
- Verificate le liste renderizzate del subtree IA: non sono emerse key mancanti da correggere nel perimetro del fix.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La pagina `/next/ia/interna*` non entra piu in loop.
- Nessun impatto sui moduli business o IA legacy.

## Rischio modifica
- BASSO

## Moduli impattati
- IA clone interna

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il tracking resta intenzionalmente solo in-memory e confinato al subtree IA.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiMockRepository.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
