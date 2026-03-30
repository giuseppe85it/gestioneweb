# Change Report - Prompt 39 - Chiusura ultimi 8 moduli NEXT

Data: 2026-03-29 21:27  
Prompt: 39  
Rischio: EXTRA ELEVATO

## Obiettivo
Svuotare il backlog residuo del clone/NEXT chiudendo gli ultimi 8 moduli ancora aperti senza montare il runtime madre come soluzione finale.

## File toccati
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `src/next/autisti/NextLoginAutistaNative.tsx`
- `src/next/autisti/NextHomeAutistaNative.tsx`
- `src/next/autisti/NextSetupMezzoNative.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`
- `src/next/autistiInbox/NextCambioMezzoInboxNative.tsx`
- `src/next/autistiInbox/NextAutistiControlliAllNative.tsx`
- `src/next/autistiInbox/NextAutistiGommeAllNative.tsx`
- `src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx`
- `src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx`
- `src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx`
- `src/next/autistiInbox/nextAutistiAdminBridges.ts`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/NextAutistiLoginPage.tsx`
- `src/next/NextAutistiHomePage.tsx`
- `src/next/NextAutistiSetupMezzoPage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextAutistiInboxCambioMezzoPage.tsx`
- `src/next/NextAutistiInboxControlliPage.tsx`
- `src/next/NextAutistiInboxGommePage.tsx`
- `src/next/NextAutistiInboxLogAccessiPage.tsx`
- `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`
- `src/next/NextAutistiInboxSegnalazioniPage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/BACKLOG_ULTIMI_8_EXECUTION.md`
- `docs/audit/REPORT_FINALE_PROMPT_39_CHIUSURA_ULTIMI_8.md`

## Cambiamenti runtime
- `Acquisti / Preventivi / Listino` chiuso su surface NEXT nativa, con estensione del domain procurement ai dataset `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi`.
- `IA Libretto`, `IA Documenti` e `IA Copertura Libretti` confermati come pagine NEXT native senza wrapper finale della madre.
- `Cisterna`, `Cisterna IA` e `Cisterna Schede Test` confermati come pagine NEXT native sopra `nextCisternaDomain`.
- `Autisti / Inbox` portato fuori dai wrapper finali madre tramite copie NEXT native e bridge clone-safe per `Autisti Admin`.

## Impatto
- UI:
  - le route ufficiali degli ultimi 8 moduli non montano piu pagine legacy finali.
- Dati:
  - letture confermate su domain NEXT o bridge clone-safe dedicati.
- Scritture:
  - nessuna scrittura business reale riaperta;
  - bridge clone-safe autisti admin neutralizza `setDoc` e `deleteObject`.

## Verifiche
- `npx eslint src/next/domain/nextProcurementDomain.ts src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementStandalonePage.tsx src/next/NextAcquistiPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextIACoperturaLibrettiPage.tsx src/next/domain/nextCisternaDomain.ts src/next/NextCisternaPage.tsx src/next/NextCisternaIAPage.tsx src/next/NextCisternaSchedeTestPage.tsx src/next/autisti/NextLoginAutistaNative.tsx src/next/autisti/NextHomeAutistaNative.tsx src/next/autisti/NextSetupMezzoNative.tsx src/next/autistiInbox/NextAutistiInboxHomeNative.tsx src/next/autistiInbox/NextCambioMezzoInboxNative.tsx src/next/autistiInbox/NextAutistiControlliAllNative.tsx src/next/autistiInbox/NextAutistiGommeAllNative.tsx src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx src/next/autistiInbox/nextAutistiAdminBridges.ts src/next/autistiInbox/NextAutistiAdminNative.tsx src/next/NextAutistiLoginPage.tsx src/next/NextAutistiHomePage.tsx src/next/NextAutistiSetupMezzoPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/NextAutistiInboxCambioMezzoPage.tsx src/next/NextAutistiInboxControlliPage.tsx src/next/NextAutistiInboxGommePage.tsx src/next/NextAutistiInboxLogAccessiPage.tsx src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx src/next/NextAutistiInboxSegnalazioniPage.tsx src/next/NextAutistiAdminPage.tsx`
- `npm run build`

## Esito
- `OK`

## Limiti residui
- nessun modulo residuo aperto nel backlog target del prompt 39;
- restano solo riusi non critici di CSS/shared helper locali, senza mount finale di pagine madre.
