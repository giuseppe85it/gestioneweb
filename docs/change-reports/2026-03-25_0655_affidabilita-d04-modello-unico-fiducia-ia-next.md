# CHANGE REPORT - Affidabilita D04 e modello unico di fiducia IA NEXT

## Data
- 2026-03-25 06:55

## Tipo task
- patch

## Obiettivo
- chiudere il punto piu delicato della fiducia del dato sul dominio rifornimenti `D04` e rendere coerente il concetto di affidabilita tra chat, report professionale, modale e PDF.

## File modificati
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- il layer `D04` espone ora una classificazione sorgente per i rifornimenti, distinguendo `canonico` e `ricostruito` con motivo e livello di fiducia.
- il motore IA classifica i record del calcolo come `canonico`, `ricostruito`, `baseline` o `escluso` e produce un contratto unico di fiducia su `sorgente`, `filtro`, `calcolo` e `verdetto finale`.
- il report rifornimenti aggiunge una sezione `Affidabilita del dato` condivisa tra thread, modale e report professionale.
- il thread chat espone `Verdetto fiducia` coerente con card, summary e riferimenti, senza mismatch tra testo `prudente` e badge `affidabile`.
- i casi fuel-first instradati da `mezzo_dossier` vengono etichettati come `Rifornimenti` e non piu come `Quadro mezzo`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- il caso canonico `TI233827` di marzo 2026 risulta trasparente sui limiti del dato: record `17/03/2026` escluso, `7 trovati`, `5 inclusi`, `2 esclusi`, media `2,97 km/l`, verdetto finale `Prudente`.
- chat, report professionale, modale e PDF condividono la stessa base dati e lo stesso giudizio di affidabilita.
- il sistema protegge la fiducia dell'utente esplicitando il perimetro prudente invece di nasconderlo dietro un output elegante.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- dominio NEXT `D04 Rifornimenti`
- motore unificato IA read-only
- report professionale mezzo
- thread e report-ready della console `/next/ia/interna`

## Contratti dati toccati?
- SI
- contratto read-only del layer `D04` esteso con metadati di trust per record e snapshot rifornimenti

## Punto aperto collegato?
- SI
- audit validazione `2026-03-25`
- audit pianificazione finale `2026-03-25`

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
- i record del caso canonico restano classificati come `ricostruiti` a livello sorgente, quindi il verdetto finale corretto resta `Prudente`.
- questo step non rifonda il dominio a monte: rende esplicita la fiducia del dato e blocca la promozione cosmetica dei record prudenziali.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/NextInternalAiPage.tsx src/next/domain/nextRifornimentiDomain.ts` -> OK
- smoke UI `/next/ia/interna` via Playwright locale:
  - caso canonico `questo mese + km/l + genera pdf` su `TI233827` -> `Affidabilita: Prudente`, `7 trovati`, `5 inclusi`, `2 esclusi`, `17/03/2026` escluso, sezione `Affidabilita del dato` presente nel modale/report
  - `marzo 2026` su `TI233827` -> stesso periodo, stessi conteggi e stesso verdetto
  - `anomalie rifornimenti marzo 2026` -> thread D04 con classificazione record e spiegazione semplice
  - `prossimi 30 giorni collaudo/pre-collaudo` -> caso non fuel ancora corretto

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
