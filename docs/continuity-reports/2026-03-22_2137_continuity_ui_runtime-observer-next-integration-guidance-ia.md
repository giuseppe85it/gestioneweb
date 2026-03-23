# CONTINUITY REPORT - IA interna NEXT / observer runtime e guida integrazione

## Contesto generale
- Il sottosistema `/next/ia/interna*` e gia attivo con chat controllata, artifact/report PDF, repo understanding curato e backend IA separato.
- Il bridge Firebase/Storage business read-only NON e ancora attivo.

## Modulo/area su cui si stava lavorando
- IA interna NEXT
- observer runtime passivo della NEXT
- guida strutturale per integrazioni future UI/file

## Stato attuale
- Stabile:
  - observer Playwright passivo su route `/next/*` whitelistate;
  - screenshot locali e snapshot runtime nel contenitore IA dedicato;
  - rendering della copertura runtime in `/next/ia/interna`;
  - matrice di integrazione `dominio -> modulo -> superficie -> file candidati`.
- In corso:
  - estensione della copertura runtime a route dinamiche osservabili senza interazioni rischiose;
  - futuro bridge read-only Firebase/Storage lato server.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- repo understanding curato
- observer runtime read-only
- UI clone per mostrare screenshot e consigli d’integrazione

## Prossimo step di migrazione
- Migliorare la copertura runtime delle route dinamiche mezzo-centriche senza introdurre click o submit distruttivi.

## Moduli impattati
- IA interna NEXT
- backend IA separato
- shell NEXT read-only

## Contratti dati coinvolti
- snapshot repo/UI del backend IA separato
- snapshot runtime observer NEXT

## Ultime modifiche eseguite
- Creato `scripts/internal-ai-observe-next-runtime.mjs`.
- Creato `backend/internal-ai/server/internal-ai-next-runtime-observer.js`.
- Estesa la snapshot repo/UI con runtime observer e integration guidance.
- Aggiornata la pagina `/next/ia/interna` con copertura runtime e consigliatore integrazione UI/file.

## File coinvolti
- package.json
- package-lock.json
- backend/internal-ai/runtime-data/.gitignore
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/server/internal-ai-next-runtime-observer.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- scripts/internal-ai-observe-next-runtime.mjs
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css
- src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- L’osservazione runtime resta confinata a `/next/*` e solo in modalita passiva.
- Nessun click generico, submit, upload o bridge business live viene aperto in questo step.
- La guida d’integrazione deve dire chiaramente dove conviene integrare e dove non conviene integrare.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun backend legacy come canale canonico.
- Nessun segreto lato client.

## Parti da verificare
- Copertura dinamica di `Dossier mezzo` e `Analisi Economica` senza interazioni potenzialmente mutanti.
- Eventuale raffinamento delle regole per distinguere card/tab/modali in alcune schermate wrapper della madre.

## Rischi aperti
- L’observer potrebbe essere frainteso come copertura completa del runtime: non lo e.
- Playwright non deve evolvere in automazione applicativa libera o in canale di patch indiretta.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Usare la nuova copertura runtime per rafforzare la chat repo/UI-aware e per decidere il primo dominio business live piu stabile da collegare in futuro tramite adapter read-only dedicato.

## Cosa NON fare nel prossimo task
- Non aprire click operativi o crawl indiscriminati della NEXT.
- Non dichiarare attivo un bridge Firestore/Storage business finche non esistono adapter, credenziali e policy verificabili.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
