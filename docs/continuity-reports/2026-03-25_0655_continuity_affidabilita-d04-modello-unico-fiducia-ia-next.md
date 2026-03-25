# CONTINUITY REPORT - IA interna NEXT / affidabilita D04 e fiducia unificata

## Contesto generale
- il clone NEXT resta `read-only` e la console `/next/ia/interna` continua a lavorare sopra il motore unificato gia consolidato nei task del `2026-03-24` e del `2026-03-25`.
- questo step non riapre planner o PDF engine: chiude il punto residuo della fiducia del dato sui rifornimenti `D04` e allinea la resa tra thread, modale, report professionale e PDF.

## Modulo/area su cui si stava lavorando
- dominio `D04 Rifornimenti`
- motore IA per classificazione record e verdetto di affidabilita
- consegna trust model nella console `/next/ia/interna`

## Stato attuale
- il dominio `D04` distingue ora `canonico` e `ricostruito` a livello sorgente.
- il motore IA classifica i record del calcolo come `canonico`, `ricostruito`, `baseline` o `escluso`.
- il report rifornimenti espone un contratto unico di fiducia su `sorgente`, `filtro`, `calcolo` e `verdetto finale`.
- il caso canonico `TI233827` di marzo 2026 e coerente su chat, modale e report: `Prudente`, `7 trovati`, `5 inclusi`, `2 esclusi`, `17/03/2026` escluso per `km non progressivi`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- console IA unica
- planner multi-dominio
- controllo periodo/calcolo rifornimenti
- fiducia unificata D04 tra chat/report/PDF

## Prossimo step di migrazione
- chiudere il priority engine operativo multi-dominio e portare lo stesso rigore di fiducia sui report non fuel ad alto valore decisionale.

## Moduli impattati
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `storage/@rifornimenti`
- `storage/@rifornimenti_autisti_tmp`
- contratto read-only `NextMezzoRifornimentiSnapshot`
- summary fuel del motore unificato IA

## Ultime modifiche eseguite
- aggiunta classificazione sorgente `canonico/ricostruito` nel layer D04.
- aggiunta classificazione record `canonico/ricostruito/baseline/escluso` nel summary fuel.
- introdotti i livelli di fiducia `sorgente`, `filtro`, `calcolo` e `verdetto finale`.
- riallineati thread, report professionale e modale sullo stesso verdetto e sulla stessa sintesi.
- corretta etichetta chat dei casi fuel-first che transitano da `mezzo_dossier`.

## File coinvolti
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- meglio dichiarare `Prudente` quando la sorgente e ricostruita, anche se filtro e conteggi sono coerenti.
- meglio classificare esplicitamente i record che nascondere `baseline` ed `esclusi` in una media apparentemente pulita.
- il motore deve restare trasparente sui limiti del dato, non cosmetico.

## Vincoli da non rompere
- madre intoccabile.
- nessuna scrittura business o segreto lato client.
- nessun refactor largo del planner multi-dominio o del renderer PDF.
- nessuna promozione artificiale del dato prudenziale a dato certo.

## Parti da verificare
- eventuali report non fuel ad alta rilevanza decisionale non usano ancora lo stesso livello di trust model dettagliato del fuel report.
- D04 resta sensibile finche le sorgenti a monte non espongono piu record canonici.

## Rischi aperti
- il sistema ora e trasparente, ma non rende `affidabile` un dominio che a monte resta ancora parzialmente ricostruito.
- l'utente puo continuare a vedere molti casi `Prudente` su D04 finche la sorgente reale non migliora.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- estendere il modello unico di fiducia ai casi multi-dominio e chiudere il priority engine operativo, senza riaprire il dominio rifornimenti a monte in modo largo.

## Cosa NON fare nel prossimo task
- non rifare il motore unificato.
- non rifare la UI generale o il PDF engine.
- non trasformare il trust model in un badge cosmetico scollegato dai dati.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
