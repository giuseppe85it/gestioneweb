# CONTINUITY REPORT - Report unificato professionale e PDF aziendale

## Contesto generale
- Il progetto resta nel perimetro clone NEXT read-only con madre intoccabile.
- Il motore unificato di lettura/incrocio della console IA era gia presente e funzionante; questo task ha toccato solo output, renderer e PDF del report targa.

## Modulo/area su cui si stava lavorando
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/utils/pdfEngine.ts`

## Stato attuale
- I report targa della console IA vengono mostrati in UI come report gestionali professionali.
- Il corpo principale del report espone sintesi, dati mezzo, foto reale, configurazione collegata e sezioni operative, spostando fonti/limiti in appendice secondaria.
- I report gomme riusano la stessa grafica stilizzata del modale gomme esistente.
- Il PDF dei report targa passa dal `pdfEngine` ufficiale e usa il logo aziendale.
- Build completa verde.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- renderer professionale del report targa;
- layer di presentazione read-only per foto mezzo, asset collegato e schema gomme;
- PDF branded del report operativo mezzo;
- CTA pagina IA allineate a `Apri report professionale` e `Genera PDF`.

## Prossimo step di migrazione
- Solo se richiesto, affinare in un task dedicato la qualita visiva o la densita informativa di singole sezioni del report senza riaprire il motore unificato.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/utils/pdfEngine.ts`

## Contratti dati coinvolti
- Nessun contratto dati nuovo.
- Riutilizzo read-only di `D01` per foto/anagrafica mezzo.
- Riutilizzo prudente di `D10` per configurazione motrice/rimorchio.
- Riutilizzo `D02` gomme per blocco grafico e dettagli asse/lato quando dimostrabili.

## Ultime modifiche eseguite
- creato il layer di presentazione professionale del report targa;
- rimpiazzato il vecchio renderer tecnico nel modal report;
- collegato il PDF IA targa al `pdfEngine` ufficiale;
- aggiunte classi CSS dedicate al layout del report.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/internal-ai/internal-ai.css`
- `src/utils/pdfEngine.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Non rifare il motore unificato.
- Non esporre nomi reader, dataset o storage keys nel corpo principale del report.
- Mostrare foto/configurazione solo se davvero leggibili e dimostrabili.
- Nei report gomme riusare la grafica esistente invece di crearne una nuova.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun backend live nuovo.
- Nessun segreto lato client.
- Nessun redesign tecnico invasivo della console oltre il report.

## Parti da verificare
- Da verificare se valga la pena aggiungere in futuro il recupero di ulteriori foto configurazione quando l'anagrafica espone piu immagini.
- Da verificare se rendere piu ricca la sezione `azioni consigliate` senza introdurre inferenze non dimostrate.

## Rischi aperti
- Le fonti fotografiche possono essere mancanti o non risolvibili.
- Alcuni eventi gomme espongono asse ma non lato, quindi il report resta prudente.
- `src/utils/pdfEngine.ts` mantiene debito lint storico fuori dal perimetro di bonifica di questo task.

## Punti da verificare collegati
- Nessun file extra richiesto.

## Prossimo passo consigliato
- Task piccolo su una singola sezione del report se serve aumentare la densita operativa, senza cambiare il perimetro dati.

## Cosa NON fare nel prossimo task
- Non rifare il motore unificato.
- Non spostare di nuovo il corpo principale del report su linguaggio tecnico.
- Non aprire backend live o scritture business per migliorare il renderer.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_1128_unified-intelligence-engine-console.md`
- `docs/continuity-reports/2026-03-24_1128_continuity_unified-intelligence-engine-console.md`
