# CHANGE REPORT - Archivio artifact IA locale

## Data
- 2026-03-12 22:32

## Tipo task
- code

## Obiettivo
- introdurre una persistenza minima, isolata e sicura per gli artifact/report preview del sottosistema IA interno, senza toccare dataset business, path Storage business o moduli IA legacy

## File modificati
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiMockRepository.ts
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css
- src/next/NextIntelligenzaArtificialePage.tsx
- src/next/nextData.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-12_2232_patch_archivio-artifact-ia-locale.md
- docs/continuity-reports/2026-03-12_2232_continuity_archivio-artifact-ia-locale.md

## Riassunto modifiche
- verificata come non sicura una persistenza Firestore/Storage dedicata allo stato attuale del repo
- scelta e implementata la soluzione piu isolata: archivio artifact persistente solo locale, namespaced e confinato al clone
- esteso il modello artifact con metadati minimi, payload preview, fonti lette, tag e versionamento
- collegato il use case `report targa in anteprima` al nuovo archivio locale
- aggiornata la UI IA interna per vedere, aprire e archiviare localmente gli artifact
- aggiornata la checklist unica IA e i registri clone/NEXT

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- disponibilita di un primo archivio artifact realmente persistente ma solo sul dispositivo clone
- nessun impatto su madre, business data, backend IA legacy o provider esterni
- riduzione del rischio rispetto a Firestore/Storage grazie al confinamento locale

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna clone
- documentazione di stato IA/NEXT

## Contratti dati toccati?
- SI, solo contratti locali del sottosistema IA interno

## Punto aperto collegato?
- SI: Policy Firestore effettive; Policy Storage effettive; Governance endpoint IA/PDF multipli

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- `/next/ia/interna*`

## Stato migrazione prima
- archivio artifact solo mock/in-memory

## Stato migrazione dopo
- archivio artifact persistente solo locale, isolato e reversibile

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI, da valutare: il sottosistema IA interno ha ora un archivio artifact persistente locale di primo livello

## Rischi / attenzione
- la persistenza e solo locale e per-dispositivo; non e una persistenza server-side condivisa
- non forzare Firestore o Storage dedicati finche policy e identity non sono chiuse

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/NextIntelligenzaArtificialePage.tsx src/next/nextData.ts src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts`
- `npm run build`

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

