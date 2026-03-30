# Change Report - 2026-03-29 1246 - Prompt 35 hardening finale residuo NEXT

## Obiettivo
Chiudere il residuo clone-side realmente assorbibile senza toccare la madre, estendendo i boundary dati NEXT ai flussi autisti/IA/dossier e portando `Libretti Export` a parita piena.

## File toccati
- `src/next/nextLegacyAutistiOverlay.ts`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextMotherPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/NextAutistiLoginPage.tsx`
- `src/next/NextAutistiHomePage.tsx`
- `src/next/NextAutistiSetupMezzoPage.tsx`
- `src/next/NextAutistiCambioMezzoPage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextAutistiInboxCambioMezzoPage.tsx`
- `src/next/NextAutistiInboxControlliPage.tsx`
- `src/next/NextAutistiInboxGommePage.tsx`
- `src/next/NextAutistiInboxLogAccessiPage.tsx`
- `src/next/NextAutistiInboxSegnalazioniPage.tsx`
- `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/REPORT_FINALE_PROMPT_35_PARITA_NEXT.md`
- `docs/change-reports/2026-03-29_1246_prompt35_hardening-finale-residuo-next.md`
- `docs/continuity-reports/2026-03-29_1246_continuity_prompt35_hardening-finale-residuo-next.md`

## Sintesi tecnica
- Introdotto un overlay autisti legacy-shaped per far prevalere nel clone i dati NEXT puliti quando le pagine legacy leggono ancora `storageSync`.
- Estesi i boundary `autisti`, `flotta` e `inventario` a `Home`, `Centro di Controllo`, child route IA legacy, dossier/analisi e route autisti/inbox ancora wrapperizzate.
- Riallineata `/next/libretti-export` alla pagina madre reale sopra boundary `flotta`.
- Aggiornati registri e report con verdetto duro: `Libretti Export` chiuso, resto del backlog residuo ancora aperto.

## Verifiche
- `npx eslint src/next/nextLegacyAutistiOverlay.ts src/next/NextLegacyStorageBoundary.tsx src/next/NextHomePage.tsx src/next/NextCentroControlloClonePage.tsx src/next/NextLibrettiExportPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextIACoperturaLibrettiPage.tsx src/next/NextDossierMezzoPage.tsx src/next/NextAnalisiEconomicaPage.tsx src/next/NextAutistiLoginPage.tsx src/next/NextAutistiHomePage.tsx src/next/NextAutistiSetupMezzoPage.tsx src/next/NextAutistiCambioMezzoPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/NextAutistiInboxCambioMezzoPage.tsx src/next/NextAutistiInboxControlliPage.tsx src/next/NextAutistiInboxGommePage.tsx src/next/NextAutistiInboxLogAccessiPage.tsx src/next/NextAutistiInboxSegnalazioniPage.tsx src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx src/next/NextAutistiAdminPage.tsx` -> OK
- `npm run build` -> OK

## Impatto
- Aumenta la quota di letture legacy del clone che passano da layer NEXT puliti.
- Chiude davvero `Libretti Export`.
- Non riapre scritture business e non tocca la madre.

## Rischi residui
- `Home`, `Centro di Controllo`, child route IA legacy, `Dossier Mezzo`, `Analisi Economica`, `Cisterna` e parte di `Autisti / Inbox` restano aperti perche la madre contiene ancora accessi diretti Firestore/Storage non sostituiti dal clone.
