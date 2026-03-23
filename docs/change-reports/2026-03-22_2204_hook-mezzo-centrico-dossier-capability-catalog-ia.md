# CHANGE REPORT - Hook mezzo-centrico Dossier e catalogo capability IA

## Data
- 2026-03-22 22:04

## Tipo task
- runtime

## Obiettivo
- Aprire il primo hook reale e stabile dell'integrazione totale IA in chiave mezzo-centrica, usando il Dossier Mezzo come nodo principale e introducendo un catalogo capability governato sopra i read model NEXT gia esistenti.

## File modificati
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

## Riassunto modifiche
- Introdotto un catalogo capability mezzo-centrico con struttura dichiarativa su dominio, filtri, metriche, `groupBy`, output e limiti.
- Introdotto un planner che traduce linguaggio libero verso capability governate senza aggiungere un nuovo blocco hardcoded per ogni frase utente.
- Introdotto un hook Dossier mezzo read-only che riusa solo layer NEXT clone-safe per:
  - stato sintetico mezzo;
  - documenti collegabili;
  - riepilogo costi;
  - libretto;
  - preventivi;
  - report mezzo PDF in anteprima.
- Aggiornata la chat `/next/ia/interna` con copy e suggerimenti coerenti col nuovo perimetro mezzo-centrico.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La nuova IA puo rispondere in modo piu stabile a richieste libere su singola targa senza dipendere solo da intent frase-per-frase.
- Il primo hook mezzo-centrico riusa il Dossier come fonte primaria logica e riduce il rischio di logica sparsa nella pagina.
- Nessun impatto su madre, dati business o bridge Firebase/Storage live.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- chat controllata
- Dossier mezzo come sorgente read-only

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: futuro retrieval dossier server-side dedicato e bridge Firebase/Storage read-only ancora non attivi

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
- Il nuovo hook mezzo-centrico non e ancora un retrieval dossier server-side dedicato: continua a basarsi su read model NEXT clone-safe.
- Il riepilogo costi resta documentale e spiegabile, ma non sostituisce procurement o contabilita live.
- Firestore/Storage business read-only lato server restano fuori perimetro e non vanno raccontati come attivi.

## Build/Test eseguiti
- npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
