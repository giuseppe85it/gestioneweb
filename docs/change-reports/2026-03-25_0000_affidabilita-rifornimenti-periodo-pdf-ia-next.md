# CHANGE REPORT - Affidabilita rifornimenti periodo + report/PDF IA NEXT

## Data
- 2026-03-25 00:00

## Tipo task
- patch

## Obiettivo
- chiudere il rischio di report rifornimenti apparentemente corretti ma costruiti sul periodo sbagliato o su calcoli km/l non affidabili, migliorando anche leggibilita chat e PDF.

## File modificati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/utils/pdfEngine.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- parsing periodo esteso a `questo mese`, `oggi`, `questa settimana`, `prossimi 30 giorni`, mesi espliciti e intervalli personalizzati.
- introdotto guard-rail che ferma il report se il prompt chiede un periodo esplicito ma il periodo non e interpretabile in modo affidabile.
- sostituito il summary rifornimenti con una validazione che separa record trovati, inclusi nel calcolo, esclusi e motivo di esclusione.
- calcolo `km/l` e `l/100km` eseguito solo su sequenze con km progressivi e litri validi.
- report professionale, chat report-ready e PDF riallineati a sezioni business-first con anomalie, azione consigliata e limiti leggibili.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- le richieste fuel con periodo esplicito non ricadono piu sullo storico completo.
- chat e report/PDF condividono la stessa base dati verificata.
- i report risultano piu trasparenti su cosa entra o non entra nel calcolo.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- console `/next/ia/interna`
- motore unificato IA read-only
- report professionale mezzo
- PDF operativo IA

## Contratti dati toccati?
- NO

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
- NO

## Rischi / attenzione
- il comando eslint completo resta rosso per debito storico gia presente in `src/utils/pdfEngine.ts`.
- i domini fuori dal perimetro rifornimenti/scadenze/criticita restano prudenti e non diventano automaticamente deep-operativi.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/NextInternalAiPage.tsx src/utils/pdfEngine.ts` -> KO solo per debito lint storico di `src/utils/pdfEngine.ts`
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/NextInternalAiPage.tsx` -> OK
- smoke UI `/next/ia/interna` via Playwright locale con i prompt A/B/C/D del task -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

