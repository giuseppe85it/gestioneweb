# CHANGE REPORT - Report IA in anteprima PDF reale + governance readiness backend IA

## Data
- 2026-03-22 20:13

## Tipo task
- patch
- ux
- readiness

## Obiettivo
- chiudere il flusso report della nuova IA interna come output separato dalla chat con una anteprima PDF reale nel perimetro IA, e preparare meglio i prerequisiti del futuro bridge Firebase/Storage read-only senza attivarlo.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiReportPdf.ts
- src/next/internal-ai/internal-ai.css
- backend/internal-ai/package.json
- backend/internal-ai/README.md
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- La modale report di `/next/ia/interna` genera ora un PDF reale on demand dal contenuto gia verificato dell'artifact IA, mantenendo la chat breve e conversazionale.
- Il flusso utente ora distingue chiaramente `chat` e `report`, con anteprima PDF inline, copia contenuto, download PDF e condivisione browser quando disponibile.
- Il backend IA separato ha ora un `package.json` dedicato; la readiness Firebase/Storage distingue meglio tra package presente e `firebase-admin` ancora non governato dal backend IA.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il report IA e percepito come documento separato dalla chat e non come muro di testo.
- La readiness backend IA diventa piu credibile e reviewable, senza dichiarare attivo il bridge Firebase/Storage.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- overview `/next/ia/interna`
- artifact/report IA
- backend IA separato

## Contratti dati toccati?
- NO sui contratti business
- SI sul perimetro di readiness server-side del backend IA separato

## Punto aperto collegato?
- SI: persistenza server-side del PDF come binario dedicato; `firebase-admin` nel package del backend IA; credenziali e policy Firebase/Storage

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il PDF e reale ma generato lato client dal perimetro IA; non esiste ancora come binario persistito lato server.
- Il bridge Firebase/Storage business read-only NON e stato aperto.
- `firebase-admin`, credenziale server-side dedicata, `firestore.rules` e chiarimento delle policy Storage restano blocchi reali.

## Build/Test eseguiti
- npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiReportPdf.ts backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- node --check backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- smoke test buildFirebaseReadinessSnapshot() -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
