# CHANGE REPORT - Matching autista badge-first cross-layer

## Data
- 2026-03-13 15:15

## Tipo task
- patch

## Obiettivo
- Correggere in modo strutturale il matching identita autista nel sottosistema IA interno, dando priorita al badge tra D01, D04 e D10 e riducendo i match fragili basati solo sul nome.

## File modificati
- `src/next/internal-ai/internalAiDriverIdentity.ts`
- `src/next/internal-ai/internalAiDriverLookup.ts`
- `src/next/internal-ai/internalAiDriverReportFacade.ts`
- `src/next/internal-ai/internalAiCombinedReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Introdotto un helper centrale clone-only per normalizzazione e matching autista cross-layer, riusato nei punti critici del sottosistema IA.
- Riallineato il lookup autista:
  - badge esatto prima;
  - nome esatto solo se univoco;
  - niente auto-match arbitrario sugli omonimi.
- Riallineato il report autista:
  - associazioni mezzo/autista da D01 con priorita `autistaId`;
  - segnali D10 badge-first;
  - rifornimenti D04 badge-first;
  - conteggi espliciti di conferme badge e fallback nome prudente.
- Riallineato il report combinato:
  - affidabilita `forte` con `autistaId` coerente o badge coerente nei record del mezzo;
  - `plausibile` solo con fallback nome prudente;
  - `non dimostrabile` in presenza di conflitti forti o mancanza di conferme.
- Aggiornate checklist IA, stato avanzamento IA, stato migrazione NEXT e registro modifiche clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Meno falsi positivi nei casi in cui nome e badge non sono coerenti tra i layer.
- Meno falsi negativi nei casi in cui il badge conferma davvero lo stesso autista su D10 o D04.
- Lookup autista piu prudente e prevedibile nei casi di omonimia.

## Rischio modifica
- ELEVATO

## Moduli impattati
- sottosistema IA interna NEXT
- lookup autista IA interna
- report autista IA interna
- report combinato IA interna

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI
- audit strutturale matching autista badge/nome cross-layer emerso nel task precedente

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- `/next/ia/interna*`

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il fallback per nome resta volutamente prudente e non gestisce ancora omonimie complesse.
- I record D10 o D04 privi sia di badge sia di nome coerente restano non dimostrabili per scelta di sicurezza.
- Il report combinato puo dichiarare un legame forte da badge nel periodo anche quando D01 corrente non e allineato; questa scelta e esplicitata nelle note del report e non va confusa con una assegnazione anagrafica corrente.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/internalAiDriverIdentity.ts src/next/internal-ai/internalAiDriverLookup.ts src/next/internal-ai/internalAiDriverReportFacade.ts src/next/internal-ai/internalAiCombinedReportFacade.ts` - OK
- `npm run build` - OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
