# CONTINUITY REPORT - IA interna NEXT / deep runtime observer e output selector

## Contesto generale
- Il sottosistema `/next/ia/interna*` e gia attivo con chat controllata, artifact/report PDF, repo understanding, hook mezzo-centrico Dossier e backend IA separato.
- Firestore/Storage business read-only lato server NON sono ancora attivi.

## Modulo/area su cui si stava lavorando
- observer runtime NEXT
- output selector della chat IA
- guida integrazione moduli/UI/flow/file

## Stato attuale
- Stabile:
  - observer runtime read-only su 19 route reali;
  - 23 screenshot runtime salvati nel contenitore IA;
  - 4 stati whitelist-safe osservati su `Acquisti`;
  - route dinamiche mezzo-centriche risolte:
    - dossier dettaglio;
    - analisi economica;
    - gomme;
    - rifornimenti;
  - route figlie `IA interna` osservate direttamente;
  - selettore formato output con motivazione visibile in chat;
  - guida integrazione con superficie primaria, alternative, confidenza, evidenze runtime e anti-pattern.
- In corso:
  - eventuale estensione futura ad altri stati/modali read-only della NEXT;
  - eventuale endpoint dedicato al solo runtime observer se il repo understanding diventasse troppo pesante;
  - futuro bridge Firestore/Storage read-only solo dopo prerequisiti reali.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- observer runtime Playwright read-only nel backend IA separato
- mappatura integrazione UI/flow/file guidata da evidenze runtime
- selettore formato output nella chat `/next/ia/interna`

## Prossimo step di migrazione
- Espandere solo se serve la copertura runtime con altri stati whitelist-safe ad alto valore, senza introdurre click mutanti o copertura artificiale.

## Moduli impattati
- IA interna NEXT
- backend IA separato
- observer runtime NEXT

## Contratti dati coinvolti
- `InternalAiServerRuntimeObserverRouteObservation`
- `InternalAiServerRuntimeObserverStateObservation`
- `InternalAiServerUiIntegrationGuidanceEntry`
- `InternalAiOutputMode`

## Ultime modifiche eseguite
- Esteso `internal-ai-next-runtime-observer.js` con route figlie, route dinamiche e stati whitelist-safe.
- Esteso `internal-ai-observe-next-runtime.mjs` con discovery governata e raccolta `surfaceEntries` / `stateObservations`.
- Aggiornata `NextInternalAiPage.tsx` per esporre formato output, motivazione, route/stati/superfici runtime e guida integrazione piu ricca.
- Rafforzato `internal-ai-adapter.js` per rigenerare la snapshot repo/UI se i campi runtime nuovi non sono presenti.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiOutputSelector.ts
- src/next/internal-ai/internal-ai.css
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- backend/internal-ai/server/internal-ai-next-runtime-observer.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/server/internal-ai-adapter.js
- scripts/internal-ai-observe-next-runtime.mjs
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- Nessun click generico: solo interazioni read-only whitelist-safe e dimostrate.
- Nessuna estensione alla madre.
- Nessuna scrittura business, nessun bridge Firebase/Storage live.
- Il selettore output puo proporre integrazioni, non applicarle.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun segreto lato client.
- Nessun backend legacy come canale canonico.
- Tutti i testi visibili in UI devono restare in italiano.

## Parti da verificare
- Se convenga aggiungere copertura runtime a modali documentali specifiche gia dimostrate come non mutanti.
- Se serva esporre anche `stateCount` e `coverageLevel` nei meta backend dedicati oltre alla snapshot completa.
- Se valga la pena introdurre un endpoint dedicato al solo runtime observer invece di passare sempre dal repo understanding.

## Rischi aperti
- La copertura runtime potrebbe diventare fragile se basata su testi troppo volatili; servono sempre selector o percorsi whitelist-safe.
- Il selettore output non deve scivolare verso logiche opache o autonome di modifica strutturale.
- L'osservazione runtime non deve essere raccontata come copertura totale della NEXT.

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- Riutilizzare la copertura runtime e la guida integrazione per agganciare i prossimi hook IA dove il flusso reale e piu stabile, senza aggiungere codice dispersivo pagina-per-pagina.

## Cosa NON fare nel prossimo task
- Non aprire bridge Firestore/Storage business live senza prerequisiti.
- Non estendere l'observer a click mutanti o a route madre.
- Non usare il selettore output per applicare da solo integrazioni nella NEXT.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/change-reports/2026-03-22_2303_deep-runtime-observer-output-selector-next-ia.md`
