# CHANGE REPORT - Preview documenti IA interna

## Data
- 2026-03-22 09:45

## Tipo task
- feature

## Obiettivo
- Aprire il primo assorbimento sicuro della capability legacy `documenti IA` nel sottosistema IA interna del clone, in modalita preview-first e senza riuso runtime del backend legacy.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiDocumentsPreviewFacade.ts
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-22_0945_preview-documenti-ia-interna.md
- docs/continuity-reports/2026-03-22_0945_continuity_preview-documenti-ia-interna.md

## Riassunto modifiche
- Aggiunta la facciata `internalAiDocumentsPreviewFacade` sopra il layer clone-safe gia esistente per documenti/costi mezzo.
- Aggiunto il contratto stub `documents-preview` nel catalogo del sottosistema IA interno.
- Integrata nella home `/next/ia/interna` una preview documenti secondaria che dichiara:
  - documenti diretti;
  - documenti plausibili;
  - flussi fuori perimetro.
- Aggiornata la documentazione architetturale e operativa del clone e della IA interna.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone IA interno espone un primo blocco documenti utile e leggibile senza riattivare OCR, upload o scritture business.
- Nessun impatto sui flussi correnti della madre e nessun backend legacy riusato come canale canonico.

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT / IA interna
- Documentazione architetturale e operativa clone

## Contratti dati toccati?
- SI
- Solo contratti interni del sottosistema IA (`documents-preview`) e tipi preview read-only; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Resta aperto il rifacimento futuro di OCR/upload/classificazione documenti su backend dedicato.

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna / home `/next/ia/interna`

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il blocco documenti iniziale non apre ancora filtro periodo dedicato o workflow artifact dedicato.
- Procurement globale e approvazioni restano volutamente fuori dal backend canonico del blocco documenti.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiDocumentsPreviewFacade.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
