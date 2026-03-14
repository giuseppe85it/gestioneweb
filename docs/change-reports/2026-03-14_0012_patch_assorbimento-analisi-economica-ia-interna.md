# CHANGE REPORT - Assorbimento iniziale analisi economica IA interna

## Data
- 2026-03-14 00:12

## Tipo task
- patch

## Obiettivo
- Aprire il primo blocco reale di assorbimento di una capability legacy ad alta priorita nel sottosistema IA interno, scegliendo `Analisi economica mezzo` in forma preview-first, read-only e senza backend legacy canonico.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-14_0012_patch_assorbimento-analisi-economica-ia-interna.md`
- `docs/continuity-reports/2026-03-14_0012_continuity_assorbimento-analisi-economica-ia-interna.md`

## Riassunto modifiche
- Scelta e fissata come prima capability da assorbire `Analisi economica mezzo`, perche oggi e la piu sicura da aprire nel clone con valore business alto e layer gia pronti.
- Creato un facade read-only dedicato che compone una preview economica spiegabile usando solo documenti/costi diretti gia normalizzati e lo snapshot legacy gia salvato.
- Estesa la home IA con una preview separata di analisi economica, distinta dal report mezzo e con perimetro dichiarato in modo esplicito.
- Aggiornati mappa capability legacy, linee guida IA, checklist, stato avanzamento, stato migrazione NEXT e registro clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il sottosistema IA interno apre il primo assorbimento legacy reale senza riattivare moduli legacy come backend canonico.
- Nessun impatto su madre, dataset business, facade/domain madre o flussi correnti.

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna NEXT
- documentazione architetturale/stato IA

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: contratto finale capability IA alta priorita da assorbire progressivamente nel clone

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- analisi

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- La capability non rigenera IA: oggi legge base diretta e snapshot legacy gia salvato.
- Procurement e approvazioni restano fuori dal blocco economico diretto anche in questa prima wave.
- `libretto`, `documenti` e `preventivi` restano ancora da assorbire con task separati.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiEconomicAnalysisFacade.ts src/next/internal-ai/internalAiChatOrchestrator.ts` -> OK
- `npm run build` -> OK
- Note residue: warning esterno su `baseline-browser-mapping` non aggiornato e warning Vite sui chunk grandi.

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
