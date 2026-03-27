# CHANGE REPORT - Chiusura finale consumer iaHandoff NEXT

## Data
- 2026-03-26 22:40

## Tipo task
- patch

## Obiettivo
- chiudere il perimetro operativo corrente della chat/IA universale del clone/NEXT portando i moduli target al consumo reale di `iaHandoff`, con prefill UI e stato consumo tracciato

## File modificati
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextInventarioReadOnlyPanel.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiReadOnlyPanel.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/internal-ai/internalAiUniversalTypes.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalHandoffLifecycle.ts`
- `src/next/internal-ai/internalAiUniversalHandoffConsumer.ts`
- `src/next/internal-ai/InternalAiUniversalHandoffBanner.tsx`
- `src/next/internal-ai/InternalAiUniversalRequestsPanel.tsx`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRY_TOTALE_CLONE_NEXT.md`
- `docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md`
- `docs/product/PIANO_ASSORBIMENTO_MODULI_RESIDUI_IA_NEXT.md`
- `docs/product/SCENARI_E2E_IA_UNIVERSALE_NEXT.md`
- `docs/architecture/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md`
- `docs/architecture/ENTITY_MODEL_RESOLVER_UNIVERSALE_IA_NEXT.md`

## Riassunto modifiche
- introdotto lifecycle completo del payload `iaHandoff` con persistenza, cronologia consumo e sincronizzazione sugli item della inbox documentale
- aggiunto consumer standard riusabile nei moduli target del clone con validazione payload, banner UI e prefill reale
- chiusa anche la route inbox documentale come consumer della query `?iaHandoff=<id>` con evidenza del payload selezionato
- chiusi procurement, inventario/materiali, mezzi/dossier, IA libretto/documenti, libretti export, cisterna IA e autisti inbox/admin come consumer effettivi del payload
- riallineati registry, matrice, scenari E2E e stato progetto a `nessun gap aperto nel perimetro operativo corrente`

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la chat universale del clone/NEXT non si limita piu a instradare: i moduli target reagiscono davvero al payload e al prefill
- il repository IA interno traccia l'avanzamento reale del consumo handoff senza riaprire live-read business o scritture madre

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna universale
- procurement
- operativita / inventario / materiali
- mezzi / dossier
- IA hub documentale
- libretti export
- cisterna
- autisti

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- i moduli chiusi restano correttamente read-only: eventuali writer futuri non devono bypassare il contract universale
- il live-read business resta fuori perimetro e non va riaperto per compensare futuri gap UI

## Build/Test eseguiti
- `npx eslint src/next/NextAcquistiPage.tsx src/next/NextOrdiniInAttesaPage.tsx src/next/NextOrdiniArrivatiPage.tsx src/next/NextDettaglioOrdinePage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementStandalonePage.tsx src/next/NextInventarioReadOnlyPanel.tsx src/next/NextInventarioPage.tsx src/next/NextMaterialiConsegnatiReadOnlyPanel.tsx src/next/NextMaterialiConsegnatiPage.tsx src/next/NextMezziPage.tsx src/next/NextIALibrettoPage.tsx src/next/NextIADocumentiPage.tsx src/next/NextLibrettiExportPage.tsx src/next/NextCisternaIAPage.tsx src/next/NextAutistiAdminPage.tsx src/next/NextAutistiInboxHomePage.tsx src/next/internal-ai/*.ts src/next/internal-ai/*.tsx` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
