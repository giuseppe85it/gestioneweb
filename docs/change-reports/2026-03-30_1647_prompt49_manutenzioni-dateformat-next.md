# Change Report - Prompt 49

## Obiettivo
Chiudere due problemi reali emersi fuori dai report precedenti:
- `Manutenzioni` NEXT non allineato alla madre su storico/ordinamento date/record visibili;
- formato data visibile non uniforme in tutta la NEXT.

## File toccati
- `src/next/nextDateFormat.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/autistiInbox/NextAutistiControlliAllNative.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/autistiInbox/NextAutistiGommeAllNative.tsx`
- `src/next/autistiInbox/components/NextRifornimentiCard.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`
- `src/next/autistiInbox/components/NextSessioniAttiveCard.tsx`
- `src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx`
- `src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx`
- `src/next/autistiInbox/NextCambioMezzoInboxNative.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/nextRifornimentiConsumiDomain.ts`
- `src/next/NextRifornimentiEconomiaSection.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/internal-ai/internalAiReportPeriod.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/internal-ai/InternalAiUniversalRequestsPanel.tsx`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `docs/audit/BACKLOG_MANUTENZIONI_DATEFORMAT_EXECUTION.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche eseguite
- `Manutenzioni`
  - introdotto formatter/parser NEXT dedicato in `src/next/nextDateFormat.ts` con priorita esplicita sul formato `gg mm aaaa`;
  - `src/next/domain/nextManutenzioniDomain.ts` non prova piu a parsare prima con `Date.parse()` stringhe legacy a spazi;
  - `src/next/domain/nextManutenzioniDomain.ts` non scarta piu le righe senza targa dal dataset storico globale;
  - `src/next/NextManutenzioniPage.tsx` legge lo storico dal domain manutenzioni dedicato e non dalla snapshot globale di supporto.
- Formato date NEXT
  - uniformate le date visibili della NEXT a `gg mm aaaa`;
  - uniformati i timestamp visibili a `gg mm aaaa HH:mm`;
  - convertiti a formato visibile NEXT i campi testo data dove la UI mostrava ancora date miste o esempi con slash;
  - lasciati `type="date"` solo i picker nativi nascosti (`aria-hidden="true"`), senza data ISO visibile all'utente.

## Verifiche richieste
- `eslint` sui file NEXT toccati dal prompt 49 -> `OK` con 2 warning preesistenti `react-hooks/exhaustive-deps` in `src/next/NextMezziDossierPage.tsx`
- `npm run build` -> `OK`
- `rg -n --glob 'src/next/**' '01/03/2026|31/03/2026|gg/mm/aaaa|dd/mm|DD/MM|YYYY-MM-DD|yyyy-mm-dd|dd-mm-yyyy|gg-mm-aaaa'` -> nessun match
- verifica dei `type="date"` residui -> presenti solo su picker nativi nascosti con `aria-hidden="true"`
- controllo parser manutenzioni su casi campione -> il vecchio parser sbagliava `05 03 2026`, il nuovo parser NEXT lo interpreta correttamente come `gg mm aaaa`

## Esito
- `Manutenzioni` -> `CHIUSO`
- controllo formato data visibile NEXT -> `CHIUSO`

## Limite esplicito
La CLI non puo validare live il dataset Firestore `@manutenzioni` nel contesto corrente per `permission-denied`; il confronto finale con la madre e quindi chiuso a livello di codice NEXT, parser/sort/filter e sweep UI visibile, non come audit live del dataset remoto.
