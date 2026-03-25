# CONTINUITY REPORT - Console IA gestionale NEXT

## Contesto generale
- il clone NEXT resta in fase `IMPORTATO READ-ONLY`.
- la UI della console `/next/ia/interna`, il report professionale e il motore unificato erano gia presenti; mancava il cervello gestionale sopra il motore.

## Modulo/area su cui si stava lavorando
- IA interna NEXT
- orchestrazione chat business-first sopra unified intelligence engine

## Stato attuale
- la console capisce richieste su rifornimenti, criticita/priorita, scadenze/collaudi/pre-collaudi e quadro completo mezzo.
- le query specifiche non vengono piu allargate automaticamente a `stato mezzo` generico.
- il report/PDF esistente viene riusato correttamente quando il prompt chiede un report.
- i domini fuori asse forte `D10 + D02` restano prudenziali e vanno dichiarati come limite quando il dato non basta.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- console unica `/next/ia/interna`
- unified intelligence engine read-only con registry globale, entity linking e preview report/PDF
- planner gestionale e composer business-first lato chat

## Prossimo step di migrazione
- irrobustire le query flotte su `oggi` e i domini esterni a `D10 + D02` con criteri business e copertura dati piu ricca, senza allargare il perimetro.

## Moduli impattati
- src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts
- src/next/NextInternalAiPage.tsx

## Contratti dati coinvolti
- `@rifornimenti`
- `@alerts_state`
- `@storico_eventi_operativi`
- `@lavori`
- `@manutenzioni`

## Ultime modifiche eseguite
- parsing di output/periodi/filtri console e sanificazione del placeholder `-`
- planner domini e output business-first
- calcoli deterministici su consumi, criticita e scadenze
- aggiornamento suggerimenti UI e catalogo capability

## File coinvolti
- src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts
- src/next/NextInternalAiPage.tsx
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- non rifare il motore unificato, la UI o il renderer PDF.
- usare il motore esistente come base e completare solo il layer interpretativo/orchestrativo.
- mantenere sempre il clone in sola lettura e senza scritture business.
- non aprire automaticamente il quadro completo mezzo quando la richiesta e specifica.

## Vincoli da non rompere
- madre intoccabile.
- nessuna scrittura business o side effect dal clone.
- IA interna isolata dentro `src/next/internal-ai/*`.
- testi UI in italiano.
- niente refactor largo di `src/utils/pdfEngine.ts`.

## Parti da verificare
- copertura e utilita delle query flotte con finestra `oggi`, che dipendono dal volume segnali del giorno corrente.
- profondita reale dei domini fuori asse forte `D10 + D02` quando vengono chiesti in quadro completo.

## Rischi aperti
- i domini esterni possono ancora produrre limiti frequenti o copertura parziale.
- la priorita flotte usa regole deterministiche ma non ancora un set ampio di segnali cross-dominio oltre `D10 + D02`.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- consolidare una seconda fascia di planner business per domini costi/documenti/procurement, sempre senza degradare il focus delle query specifiche.

## Cosa NON fare nel prossimo task
- non riportare la chat a fallback sistematico su `stato mezzo`.
- non introdurre score opachi o numeri inventati.
- non aprire refactor di backend live, Storage o `pdfEngine.ts` fuori necessità esplicita.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`

