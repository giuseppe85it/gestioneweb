# Continuity Report - Prompt 38 - Svuotamento backlog residuo NEXT

Data: 2026-03-29 18:17

## Contesto lasciato al prossimo run
- `Dossier Mezzo`, `Analisi Economica` e `Materiali da ordinare` sono ora route ufficiali NEXT native.
- `nextDossierCloneState.ts` gestisce:
  - documenti nascosti localmente nel dossier;
  - analisi economica clone-only.
- `nextProcurementCloneState.ts` gestisce ordini materiali clone-only confermati dalla pagina NEXT.
- `nextProcurementDomain.ts` riassorbe gli ordini clone-only in lettura.

## Residui ancora aperti
- `Acquisti / Preventivi / Listino`
- `IA Libretto`
- `IA Documenti`
- `IA Copertura Libretti`
- `Cisterna`
- `Cisterna IA`
- `Cisterna Schede Test`
- `Autisti / Inbox`

## Punto di leva migliore
- `Acquisti / Preventivi / Listino`:
  - la superficie ufficiale e gia NEXT;
  - il domain `readNextProcurementReadOnlySnapshot()` legge gia `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi`;
  - manca soprattutto la replica madre-like di preview, liste, PDF e approvazioni, non il reader di base.

## Verifiche gia passate
- `npx eslint src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/nextDossierCloneState.ts`
- `npx eslint src/next/NextMaterialiDaOrdinarePage.tsx src/next/nextProcurementCloneState.ts src/next/domain/nextProcurementDomain.ts`
- `npm run build`

## Nota operativa
- Nessun `SERVE FILE EXTRA` e stato dimostrato in questo run.
- I residui sono ancora lavorabili dentro la whitelist, ma non sono stati chiusi tutti nel prompt 38.
