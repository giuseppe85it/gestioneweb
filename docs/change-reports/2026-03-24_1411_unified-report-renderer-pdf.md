# CHANGE REPORT - Report unificato professionale e PDF aziendale

## Data
- 2026-03-24 14:11

## Tipo task
- patch

## Obiettivo
- Rifare solo il layer output/rendering del report unificato della console IA NEXT, senza riaprire il motore di lettura/incrocio e senza toccare la madre.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/internal-ai/internal-ai.css`
- `src/utils/pdfEngine.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_1411_unified-report-renderer-pdf.md`
- `docs/continuity-reports/2026-03-24_1411_continuity_unified-report-renderer-pdf.md`

## Riassunto modifiche
- Introdotto un layer di presentazione professionale per i report targa del motore unificato.
- Sostituito il renderer tecnico del report in `NextInternalAiPage.tsx` con una vista gestionale ordinata: header aziendale, sintesi esecutiva, dati mezzo, foto reale, sezioni operative e appendice tecnica secondaria.
- Riutilizzata per i report gomme la stessa grafica stilizzata del modale gomme esistente tramite `TruckGommeSvg` e `wheelGeom`.
- Agganciato il PDF dei report targa al `pdfEngine` ufficiale del progetto con logo aziendale, impaginazione pulita e blocco gomme dedicato quando pertinente.
- Lasciato invariato il motore unificato di lettura/incrocio, salvo wiring minimo per foto/configurazione collegata e blocco gomme.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il risultato utente e ora un report gestionale professionale, non un dump tecnico.
- Il PDF e coerente con lo stile aziendale gia in uso nel progetto.
- La console IA continua a restare read-only e non introduce scritture business o backend live.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Console IA interna NEXT
- Renderer report/modale
- PDF engine condiviso

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- `/next/ia/interna`

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Le foto reali dipendono dalla disponibilita effettiva di `fotoUrl` o `fotoStoragePath`.
- L'aggancio motrice/rimorchio/centina resta prudente: viene mostrato solo se D10 e D01 lo dimostrano.
- Nei report gomme il lato coinvolto resta `da verificare` quando i record non lo espongono davvero.
- `src/utils/pdfEngine.ts` ha debito lint storico preesistente (`no-explicit-any` e altri punti non legati a questa patch); non e stato rifattorizzato fuori perimetro.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiProfessionalVehicleReport.ts src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx src/next/internal-ai/internalAiReportPdf.ts` -> OK
- `npm run build` -> OK
- `npx eslint src/utils/pdfEngine.ts` -> NON OK per debito lint storico gia presente nel file condiviso

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
