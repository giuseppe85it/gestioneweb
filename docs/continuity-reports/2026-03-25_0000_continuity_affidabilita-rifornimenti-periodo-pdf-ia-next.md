# CONTINUITY REPORT - IA interna NEXT / affidabilita rifornimenti

## Contesto generale
- il clone NEXT resta `read-only` e la console `/next/ia/interna` lavora sopra il motore unificato gia introdotto il `2026-03-24`.
- la fase attuale non rifonda motore o UI: chiude il rischio operativo sui report rifornimenti con periodo esplicito e migliora la leggibilita del report/PDF.

## Modulo/area su cui si stava lavorando
- console IA interna `/next/ia/interna`
- orchestrazione periodo + planner fuel
- report professionale mezzo e PDF operativo

## Stato attuale
- il parser periodo riconosce `questo mese`, `oggi`, `questa settimana`, `prossimi 30 giorni`, mesi espliciti e intervalli `dal X al Y`.
- una richiesta fuel con periodo esplicito non cade piu sullo storico completo.
- chat, report e PDF usano la stessa base validata per i rifornimenti.
- il comando eslint completo resta rosso solo per debito storico di `src/utils/pdfEngine.ts`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- console IA unica
- motore unificato read-only
- renderer report professionale
- PDF operativo IA
- controlli periodo/calcolo rifornimenti

## Prossimo step di migrazione
- estendere lo stesso livello di affidabilita deterministica ai domini `costi/documenti` e agli altri ambiti ancora prudenti, senza allargare ogni richiesta a overview mezzo.

## Moduli impattati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/utils/pdfEngine.ts`

## Contratti dati coinvolti
- `storage/@rifornimenti`
- `storage/@rifornimenti_autisti_tmp`
- readers NEXT D10 per collaudi / pre-collaudi

## Ultime modifiche eseguite
- aggiunto guard-rail anti fallback allo storico completo sui prompt con periodo esplicito.
- introdotta validazione rifornimenti con record trovati/inclusi/esclusi e motivi di esclusione.
- riallineati chat report-ready, report professionale e PDF a un output business-first piu trasparente.

## File coinvolti
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/utils/pdfEngine.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- meglio fermare il report che usare uno storico completo non richiesto.
- meglio dichiarare `media non calcolabile` che esporre un numero non affidabile.
- il PDF resta sul renderer esistente con wiring mirato, senza refactor largo del motore PDF.

## Vincoli da non rompere
- madre intoccabile.
- nessuna scrittura business o segreto lato client.
- niente refactor generale fuori whitelist.

## Parti da verificare
- eventuali soglie business piu ricche per identificare salti km davvero anomali non sono ancora formalizzate nei documenti.
- i domini fuori rifornimenti/scadenze/criticita restano piu prudenti del primo asse forte.

## Rischi aperti
- `src/utils/pdfEngine.ts` continua a portare debito lint storico che impedisce il verde del comando eslint completo richiesto.
- alcuni prompt report vengono ancora etichettati in chat con il use-case label generico `Report mezzo`, anche se il corpo e ora specifico sui rifornimenti.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- chiudere in un task separato la consegna chat dei report non-fuel e definire regole business documentate per eventuali anomalie chilometriche piu sofisticate.

## Cosa NON fare nel prossimo task
- non riaprire refactor largo di `pdfEngine.ts`.
- non rifare il motore unificato o la console da zero.
- non reintrodurre fallback automatici a `overview mezzo` quando il prompt e specifico.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

