# CHANGE REPORT - Estensione realistica costi-documenti-report decisionali IA NEXT

## Data
- 2026-03-25 11:25

## Tipo task
- patch

## Obiettivo
- Aprire in modo realistico `D07/D08` per costi, documenti e storico utile del mezzo, rispettando il periodo richiesto e senza fingere copertura piena dove il dato resta parziale.

## File modificati
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Aggiunta nel dominio `D07/D08` una vista period-aware per targa, con conteggi utili al business, separazione tra collegamenti diretti e prudenziali, storico rilevante e azione consigliata.
- Il motore IA usa ora questa vista per costruire la sezione costi/documenti e il report storico, invece di derivare sintesi grezze dal solo snapshot completo.
- Il parser periodo riconosce anche `ultimi N mesi`, chiudendo il fallback implicito allo storico completo sui prompt economici/documentali come `ultimi 12 mesi`.
- Chat, report e PDF condividono la stessa sostanza business su costi/documenti/storico utile, con titolo, cards e sezione dedicata piu coerenti.
- La UI etichetta correttamente i casi `Costi e documenti` e distingue i veri `Storico mezzo` dai report costi/documenti che contengono solo una riga `storico utile`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Le richieste su costi/documenti/storico mezzo diventano period-aware e spiegabili.
- I report possono dichiarare anche assenza dati o match prudenziale senza apparire incompleti o falsamente certi.
- Il quadro mezzo continua a usare lo stesso payload decisionale, ma ora integra meglio i limiti e i segnali economico-documentali disponibili.

## Rischio modifica
- ELEVATO

## Moduli impattati
- dominio NEXT `D07/D08`
- motore unificato IA read-only
- renderer report professionale
- thread della console `/next/ia/interna`

## Contratti dati toccati?
- SI
- esteso il contratto read-only del layer `D07/D08` con una vista period-aware business-first per la targa

## Punto aperto collegato?
- SI
- roadmap step `Estensione realistica costi-documenti-report decisionali`

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
- Sulla targa `TI233827`, nel clone letto durante il task, non emergono costi/documenti leggibili nel perimetro corrente: il sistema ora lo dichiara esplicitamente, ma non puo creare copertura dove il dato manca davvero.
- Lo step non apre `D06` e non promuove procurement separato a fonte documentale/costi diretta.
- Lo storico utile economico-documentale resta tanto forte quanto il dato normalizzato disponibile nel layer `D07/D08`.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK
- smoke UI `/next/ia/interna` via Playwright locale:
  - `Fammi un report dei costi della targa TI233827 negli ultimi 12 mesi, in modo semplice e utile.` -> report/PDF con periodo `25/03/2025 - 25/03/2026`, nessun costo leggibile trovato, limite dichiarato
  - `Quali documenti rilevanti risultano associati alla targa TI233827?` -> thread strutturato `Costi e documenti`, nessun documento utile forte nel perimetro letto
  - `Fammi uno storico decisionale del mezzo TI233827 con costi, documenti e segnali utili.` -> `Quadro mezzo` coerente col payload decisionale multi-dominio
  - `Genera un report/PDF sullo storico utile del mezzo TI233827.` -> modale/PDF coerenti sullo stesso quadro mezzo

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
