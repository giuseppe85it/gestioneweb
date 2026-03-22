# CHANGE REPORT - Preview libretto IA interna

## Data
- 2026-03-22 10:03

## Tipo task
- feature

## Obiettivo
- Aprire il primo assorbimento sicuro della capability legacy `libretto IA` nel sottosistema IA interna del clone, in modalita preview-first e senza riuso runtime del backend legacy.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiLibrettoPreviewFacade.ts
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-22_1003_preview-libretto-ia-interna.md
- docs/continuity-reports/2026-03-22_1003_continuity_preview-libretto-ia-interna.md

## Riassunto modifiche
- Aggiunta la facciata `internalAiLibrettoPreviewFacade` sopra i layer clone-safe gia esistenti per mezzi e libretti.
- Aggiunto il contratto stub `libretto-preview` nel catalogo del sottosistema IA interno.
- Integrata nella home `/next/ia/interna` una preview libretto secondaria che dichiara:
  - dati libretto diretti;
  - dati plausibili o incompleti;
  - flussi fuori perimetro.
- Aggiornata la documentazione architetturale e operativa del clone e della IA interna.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone IA interno espone un primo blocco libretto utile e leggibile senza riattivare OCR, Cloud Run, upload o scritture business.
- Nessun impatto sui flussi correnti della madre e nessun backend legacy riusato come canale canonico.

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT / IA interna
- Documentazione architetturale e operativa clone

## Contratti dati toccati?
- SI
- Solo contratti interni del sottosistema IA (`libretto-preview`) e tipi preview read-only; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Resta aperto il rifacimento futuro di OCR/upload/estrazione libretto su backend dedicato.

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
- Il blocco libretto iniziale non apre ancora viewer/artifact dedicato o OCR.
- La preview usa solo dati gia presenti sui reader clone-safe: non colma automaticamente i buchi del mezzo.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewFacade.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
