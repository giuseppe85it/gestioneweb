# CONTINUITY REPORT - IA interna NEXT / retrieval Dossier mezzo clone-seeded

## Contesto generale
- Il sottosistema `/next/ia/interna*` e gia attivo con chat controllata, artifact/report PDF, repo understanding, observer runtime NEXT e backend IA separato.
- Firestore/Storage business read-only lato server NON sono ancora attivi.

## Modulo/area su cui si stava lavorando
- backend IA separato
- hook mezzo-centrico Dossier
- retrieval server-side read-only

## Stato attuale
- Stabile:
  - retrieval D01 server-side gia attivo per il contesto mezzo/libretto;
  - nuovo retrieval server-side `Dossier Mezzo` clone-seeded per singola targa;
  - hook mezzo-centrico che prova prima il retrieval server-side per stato mezzo, costi e rifornimenti;
  - nuova capability governata `Riepilogo rifornimenti mezzo`.
- In corso:
  - eventuale promozione futura a veri adapter Firebase/Storage read-only;
  - eventuale verticalizzazione specialistica `Cisterna` solo dopo prerequisiti dati e boundary piu solidi.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- hook mezzo-centrico governato sul Dossier
- retrieval D01 clone-seeded
- retrieval Dossier clone-seeded
- capability rifornimenti sopra layer D04

## Prossimo step di migrazione
- Scegliere se il prossimo accesso reale debba restare mezzo-centrico su documenti/costi oppure aprire un adapter Firebase/Storage read-only vero solo dopo `firebase-admin` governato, credenziali server-side dedicate e policy verificabili.

## Moduli impattati
- backend/internal-ai
- IA interna NEXT
- Dossier mezzo
- rifornimenti D04

## Contratti dati coinvolti
- `retrieval.read`
- snapshot `Dossier Mezzo` clone-seeded
- catalogo capability mezzo-centrico
- hook `mezzo_dossier`

## Ultime modifiche eseguite
- Esteso `retrieval.read` con `seed_vehicle_dossier_snapshot` e `read_vehicle_dossier_by_targa`.
- Aggiunta persistenza dedicata `vehicle_dossier_readonly_snapshot.json`.
- Aggiunto il client frontend per seed/lettura Dossier server-side.
- Esteso il catalogo capability con `Riepilogo rifornimenti mezzo`.
- Aggiornato il hook Dossier per usare prima il retrieval server-side clone-seeded e poi il fallback locale.

## File coinvolti
- backend/internal-ai/README.md
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/server/internal-ai-persistence.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiLibrettoPreviewBridge.ts
- src/next/internal-ai/internalAiServerRetrievalClient.ts
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts
- src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts
- src/next/internal-ai/internalAiVehicleDossierHookFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- Nessun bridge Firebase/Storage business live viene aperto in questo task.
- Il primo blocco dati reale serio passa da snapshot clone-seeded nel backend IA separato.
- `Rifornimenti` entra ora come capability governata e spiegabile.
- `Cisterna` resta verticale specialistico e non viene forzata dentro il retrieval live.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun backend legacy come canale canonico.
- Nessun segreto lato client.

## Parti da verificare
- Se il prossimo dataset reale debba essere documenti/costi mezzo-centrici o solo file/libretto puntuale.
- Se esistono prerequisiti reali sufficienti per `firebase-admin` nel package `backend/internal-ai`.
- Quale boundary stabile serva prima di aprire un retrieval specialistico `Cisterna`.

## Rischi aperti
- Il nuovo retrieval Dossier potrebbe essere percepito come bridge Firebase live, ma non lo e.
- Il perimetro rifornimenti non deve essere scambiato per un motore di contabilita o controllo carburante live.
- La verticalizzazione `Cisterna` va tenuta separata finche non esistono sorgenti e limiti piu puliti.

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- Consolidare il boundary dati reali del backend IA separato con un adapter read-only vero ma strettissimo, partendo solo se esistono `firebase-admin` governato, credenziale server-side dedicata, `firestore.rules` o policy equivalenti verificabili e whitelist runtime esplicite.

## Cosa NON fare nel prossimo task
- Non aprire query libere o scansioni bucket/collection.
- Non usare il legacy come backend canonico.
- Non trasformare `Cisterna` in dominio live della IA senza boundary specialistico dedicato.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
