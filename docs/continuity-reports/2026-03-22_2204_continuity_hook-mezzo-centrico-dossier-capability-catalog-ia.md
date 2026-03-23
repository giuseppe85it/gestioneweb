# CONTINUITY REPORT - IA interna NEXT / hook mezzo-centrico Dossier

## Contesto generale
- Il sottosistema `/next/ia/interna*` e gia attivo con chat controllata, artifact/report PDF, repo understanding, observer runtime NEXT e backend IA separato.
- Firestore/Storage business read-only lato server NON sono ancora attivi.

## Modulo/area su cui si stava lavorando
- IA interna NEXT
- chat controllata
- primo hook mezzo-centrico governato

## Stato attuale
- Stabile:
  - catalogo capability mezzo-centrico dichiarativo;
  - planner `prompt -> capability` per richieste su singola targa;
  - hook Dossier read-only per stato mezzo, documenti, costi, libretto, preventivi e report PDF;
  - flusso report invariato su artifact + modale PDF.
- In corso:
  - eventuale promozione futura del Dossier a snapshot/retrieval server-side dedicato;
  - apertura futura dei bridge Firebase/Storage read-only solo dopo prerequisiti reali.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- capability chat/report governate nel perimetro mezzo-centrico
- riuso del composito Dossier e dei facade clone-safe gia esistenti

## Prossimo step di migrazione
- Portare lo stesso catalogo capability su un futuro retrieval dossier server-side seedato o dedicato, senza aprire Firestore/Storage live largo.

## Moduli impattati
- IA interna NEXT
- Dossier mezzo come sorgente read-only
- artifact/report preview

## Contratti dati coinvolti
- catalogo capability mezzo-centrico
- planner capability
- read model D01 + Dossier + D07-D08

## Ultime modifiche eseguite
- Creato `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`.
- Creato `src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts`.
- Creato `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`.
- Aggiornato `internalAiChatOrchestrator.ts` per usare il planner sul perimetro mezzo-centrico.
- Aggiornata `/next/ia/interna` con suggerimenti e testi coerenti col nuovo hook.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts
- src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts
- src/next/internal-ai/internalAiVehicleDossierHookFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- Il primo hook mezzo-centrico usa come fonte primaria i read model NEXT, non la UI.
- Nessun bridge Firebase/Storage business live viene aperto in questo step.
- Le capability mezzo-centriche devono restare governate, spiegabili e con limiti espliciti.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun backend legacy come canale canonico.
- Nessun segreto lato client.

## Parti da verificare
- Quale porzione del Dossier convenga promuovere per prima a retrieval server-side dedicato.
- Se il catalogo capability debba essere esposto anche nel backend IA separato come envelope tipizzato, oltre all'uso locale attuale nella chat.

## Rischi aperti
- Il planner non deve trasformarsi in un layer euristico opaco non tracciabile.
- Il riepilogo costi non deve essere percepito come contabilita ufficiale o procurement live.
- Il hook attuale non va raccontato come bridge Firebase/Storage business read-only gia attivo.

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- Riutilizzare il catalogo capability per un futuro hook dossier server-side dedicato, mantenendo sempre `single targa`, fonti dichiarate, fallback locale e nessuna scrittura business.

## Cosa NON fare nel prossimo task
- Non aprire live retrieval Firebase/Storage largo.
- Non spostare la logica nel layer pagina.
- Non usare il procurement globale o backend legacy come sorgente canonica del hook mezzo-centrico.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
