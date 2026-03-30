# Change Report - 2026-03-29 1149 - Prompt 34 chiusura residui clone NEXT

## Obiettivo
Chiudere altre superfici residue del clone/NEXT usando solo `src/next/*`, portandole a UI madre-like sopra readers/domain NEXT puliti e senza toccare la madre.

## File toccati
- `src/next/domain/nextIaConfigDomain.ts`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextColleghiPage.tsx`
- `src/next/NextFornitoriPage.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextIAApiKeyPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/REPORT_FINALE_PROMPT_34_PARITA_NEXT.md`
- `docs/change-reports/2026-03-29_1149_prompt34_chiusura-residui-clone-next.md`
- `docs/continuity-reports/2026-03-29_1149_continuity_prompt34_chiusura-residui-clone-next.md`

## Sintesi tecnica
- Creato `nextIaConfigDomain` come reader clone-safe per `@impostazioni_app/gemini`.
- Riallineato `Dossier Lista` a una replica clone della madre sopra `D01`.
- Riallineati `Colleghi` e `Fornitori` a una replica clone della madre sopra `nextColleghiDomain` e `nextFornitoriDomain`.
- Riallineati `IA Home` e `IA API Key` a una replica clone della madre sopra `D11`.
- Aggiornati report e registri permanenti con il nuovo stato di parita.

## Verifiche
- `npx eslint src/next/domain/nextIaConfigDomain.ts src/next/NextDossierListaPage.tsx src/next/NextIntelligenzaArtificialePage.tsx src/next/NextIAApiKeyPage.tsx src/next/NextFornitoriPage.tsx src/next/NextColleghiPage.tsx` -> OK
- `npm run build` -> OK

## Impatto
- Riduce il residuo clone non chiuso su anagrafiche e hub IA.
- Sposta altre superfici fuori da runtime madre/raw verso readers NEXT dedicati.
- Mantiene invariato il blocco scritture del clone.

## Rischi residui
- Restano aperti i macro-blocchi piu grandi: `Home`, `Centro di Controllo`, `Procurement core`, `Dossier core`, `Capo`, child route IA operative, `Cisterna`, `Autisti / Inbox`.
