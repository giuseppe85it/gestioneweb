# CHANGE REPORT - Estensione hook Dossier con retrieval server-side e rifornimenti

## Data
- 2026-03-23 06:59

## Tipo task
- runtime

## Obiettivo
- Estendere il primo hook IA mezzo-centrico del clone con un retrieval server-side serio ma ancora controllato, senza aprire Firebase/Storage business live e aggiungendo una capability governata sui rifornimenti.

## File modificati
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

## Riassunto modifiche
- Esteso `retrieval.read` con un nuovo snapshot `Dossier Mezzo` clone-seeded:
  - `seed_vehicle_dossier_snapshot`
  - `read_vehicle_dossier_by_targa`
- Aggiunta persistenza dedicata `vehicle_dossier_readonly_snapshot.json` nel contenitore IA separato.
- Esteso il client frontend del retrieval server-side per seed e lettura del Dossier mezzo per singola targa.
- Esteso il catalogo capability mezzo-centrico con `Riepilogo rifornimenti mezzo`.
- Aggiornato il hook `mezzo_dossier` per usare prima il retrieval server-side clone-seeded su:
  - stato sintetico mezzo;
  - riepilogo costi;
  - riepilogo rifornimenti;
  - fallback locale clone-safe se l'adapter o il seed non sono disponibili.
- Aggiornati copy e suggerimenti della chat per dichiarare meglio fonti, rifornimenti e fallback.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La nuova IA ha ora un primo blocco serio di visione dati mezzo-centrici anche lato server, ma senza aprire ancora live retrieval business da Firebase/Storage.
- Il hook mezzo-centrico resta governato e spiegabile, ma meno dipendente dal solo runtime locale della pagina.
- I rifornimenti entrano nel catalogo capability come perimetro stabile e leggibile, usando il layer D04 gia normalizzato.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- retrieval server-side read-only
- hook mezzo-centrico Dossier
- chat `/next/ia/interna`

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: bridge Firebase/Storage business live ancora non attivo; verticale `Cisterna` ancora solo specialistico e non live

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il nuovo retrieval Dossier e clone-seeded e non va raccontato come accesso business live a Firebase/Storage.
- I rifornimenti restano spiegabili ma non diventano contabilita o fuel control live.
- `Cisterna` viene solo dichiarata come verticale specialistico, senza retrieval live dedicato in questo step.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-adapter.js -> OK
- node --check backend/internal-ai/server/internal-ai-persistence.js -> OK
- smoke test adapter locale `seed_vehicle_dossier_snapshot` + `read_vehicle_dossier_by_targa` -> OK
- npx eslint src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiServerRetrievalClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
