# CHANGE REPORT - Quadro mezzo utile e output allineati IA NEXT

## Data
- 2026-03-25 10:28

## Tipo task
- patch

## Obiettivo
- Rendere il quadro completo mezzo davvero decisionale e riallineare chat, report, modale e PDF sullo stesso payload business verificato.

## File modificati
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-25_1028_quadro-mezzo-utile-output-allineati-ia-next.md`
- `docs/continuity-reports/2026-03-25_1028_continuity_quadro-mezzo-utile-output-allineati-ia-next.md`

## Riassunto modifiche
- Il motore unificato costruisce ora il quadro mezzo con blocchi decisionali fissi e ordinati, invece di una overview piu generica.
- La chat usa lo stesso payload business del report e del PDF, con etichetta `Quadro mezzo` corretta e senza riferimenti tecnici del motore nel primo piano.
- Il renderer professionale preserva ordine e contenuti del quadro mezzo decisionale, mentre la vista React mostra prima cards, sintesi e sezioni e solo dopo media o appendici.
- La normalizzazione finale del testo business ripulisce note e limiti secondari che arrivavano con wording sporco.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- L'utente vede subito targa, stato, azione principale e blocchi utili alla decisione.
- Thread, report corrente, modale e PDF restano coerenti sul contenuto sostanziale del quadro mezzo.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- report professionale mezzo
- rendering chat della console unificata

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Costi e documenti restano visibili solo quando il payload li considera abbastanza leggibili e agganciati.
- Il formato `report completo` puo ancora usare il percorso report/PDF della console quando la richiesta punta a un artifact lungo.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/NextInternalAiPage.tsx` -> OK
- smoke UI reale su `/next/ia/interna` via Playwright locale con 4 prompt bussola quadro mezzo -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
