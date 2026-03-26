# CHANGE REPORT - D06 procurement reale read-only per NEXT e IA interna

## Data
- 2026-03-25 21:38

## Tipo task
- patch

## Obiettivo
- chiudere `D06` come dominio procurement read-only vero per NEXT e IA interna, distinguendo in modo onesto tra superfici navigabili, preview, workflow non importati e CTA da bloccare.

## File modificati
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/pages/Acquisti.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- aggiunto uno snapshot procurement read-only che unisce ordini, arrivi, preventivi, approvazioni e listino con conteggi business, provenienza e stato superficie;
- il motore IA riconosce ora il ramo `procurement_readonly` e risponde su stato reale di ordini/preventivi/approvazioni/Capo Costi senza improvvisare sopra `D07/D08`;
- la pagina `/next/acquisti` nel clone mostra un workbench procurement read-only in italiano, con tabs navigabili dove il dato e davvero leggibile e blocchi espliciti sulle superfici non ancora coperte;
- `Capo Costi Mezzo` dichiara meglio il confine clone-safe e rende esplicite le CTA bloccate;
- aggiornati suggerimenti rapidi e capability IA per rendere testabile anche `D06` dalla console `/next/ia/interna`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- procurement non sembra piu un workflow operativo completo dove oggi e solo preview o stato parziale;
- la IA interna sa spiegare il perimetro reale di ordini, preventivi, approvazioni e Capo Costi;
- il clone rende piu chiaro cosa e leggibile davvero e cosa resta volutamente bloccato.

## Rischio modifica
- ELEVATO

## Moduli impattati
- dominio NEXT `D06 Procurement`
- console `/next/ia/interna`
- workbench clone `/next/acquisti`
- pagina `Capo Costi Mezzo`

## Contratti dati toccati?
- SI
- esteso `nextDocumentiCostiDomain` con uno snapshot procurement read-only derivato da `@ordini`, `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi`

## Punto aperto collegato?
- SI
- work-package `D06 PROCUREMENT REALE`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- procurement / area capo / IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- il clone continua a leggere un perimetro procurement parziale: ordini e arrivi sono i segnali piu forti, mentre preventivi, approvazioni e listino restano in parte preview o contesto prudente;
- `src/pages/Acquisti.tsx` e `src/next/NextCapoCostiMezzoPage.tsx` portano ancora debito lint legacy che fa fallire il comando eslint completo richiesto;
- il task non simula governance o approvazioni: se il dato o il workflow non sono importati, la UI e la IA lo dichiarano.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/NextOperativitaGlobalePage.tsx src/pages/Acquisti.tsx` -> KO per debito lint legacy gia presente soprattutto in `src/pages/Acquisti.tsx` e in parte in `src/next/NextCapoCostiMezzoPage.tsx`
- `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextOperativitaGlobalePage.tsx` -> OK
- smoke UI reali:
  - `/next/ia/interna` -> `Fammi un riepilogo read-only di ordini e preventivi.` -> ramo D06 con conteggi coerenti
  - `/next/ia/interna` -> `Ci sono approvazioni reali o solo preview?` -> D06 con confine read-only esplicito
  - `/next/ia/interna` -> `Quali CTA di procurement vanno bloccate nella NEXT?` -> D06 con CTA bloccate elencate
  - `/next/ia/interna` -> `Questa area e davvero operativa o solo in lettura prudente?` -> D06 con distinzione navigabile/preview/bloccata
  - `/next/ia/interna` -> `Spiegami lo stato reale di Capo Costi nel perimetro NEXT.` -> routing D06 corretto
  - `/next/acquisti` -> badge `SOLA LETTURA`, `Ordini`/`Arrivi` navigabili, `Prezzi & Preventivi` e `Listino Prezzi` bloccati
  - `/next/capo/costi/TI233827` -> warning clone-safe e CTA bloccate visibili

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
