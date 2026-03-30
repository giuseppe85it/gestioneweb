# Change Report - Prompt 38 - Svuotamento backlog residuo NEXT

Data: 2026-03-29 18:17  
Prompt: 38  
Rischio: EXTRA ELEVATO

## Obiettivo
Sostituire i wrapper finali della madre sui residui chiudibili nel solo perimetro `src/next/*`, mantenendo la madre intoccabile.

## File toccati
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/nextDossierCloneState.ts`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/nextProcurementCloneState.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/BACKLOG_RESIDUO_NEXT_EXECUTION.md`
- `docs/audit/REPORT_FINALE_PROMPT_38_SVUOTAMENTO_BACKLOG_NEXT.md`

## Cambiamenti runtime
- `Dossier Mezzo` ricostruito come pagina NEXT nativa sopra `readNextDossierMezzoCompositeSnapshot()`.
- `Analisi Economica` ricostruita come pagina NEXT nativa sopra il composite dossier, con overlay IA clone-only.
- `Materiali da ordinare` ricostruito come pagina NEXT nativa sopra `nextFornitoriDomain`, con conferma ordine clone-only.
- Aggiunto overlay `nextProcurementCloneState` e merge in `nextProcurementDomain` per far leggere al clone gli ordini confermati localmente senza scrivere sulla madre.

## Impatto
- UI:
  - tre route ufficiali NEXT non montano piu `src/pages/*` come runtime finale.
- Dati:
  - letture su layer NEXT puliti per dossier e fornitori;
  - overlay locale esplicito per analisi IA e ordini materiali.
- Scritture:
  - nessuna scrittura business reale;
  - solo `localStorage` clone-only.

## Verifiche
- `npx eslint src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/nextDossierCloneState.ts`
- `npx eslint src/next/NextMaterialiDaOrdinarePage.tsx src/next/nextProcurementCloneState.ts src/next/domain/nextProcurementDomain.ts`
- `npm run build`

## Esito
- `OK`

## Limiti residui
- `Acquisti / Preventivi / Listino` non ancora equivalente alla madre.
- `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Cisterna`, `Cisterna IA`, `Cisterna Schede Test`, `Autisti / Inbox` montano ancora runtime legacy.
