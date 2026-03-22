# CHANGE REPORT - Preview preventivi IA interna

## Data
- 2026-03-22 10:20

## Tipo task
- feature

## Obiettivo
- Aprire il primo assorbimento sicuro della capability legacy `preventivi IA` nel sottosistema IA interna del clone, in modalita preview-first e senza riuso runtime del backend legacy.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiPreventiviPreviewFacade.ts
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-22_1020_preview-preventivi-ia-interna.md
- docs/continuity-reports/2026-03-22_1020_continuity_preview-preventivi-ia-interna.md

## Riassunto modifiche
- Aggiunta la facciata `internalAiPreventiviPreviewFacade` sopra i layer clone-safe gia esistenti per documenti/costi e procurement.
- Aggiunto il contratto stub `preventivi-preview` nel catalogo del sottosistema IA interno.
- Integrata nella home `/next/ia/interna` una preview preventivi secondaria che dichiara:
  - preventivi direttamente collegabili;
  - preventivi plausibili o supporti separati;
  - flussi fuori perimetro.
- Aggiornata la documentazione architetturale e operativa del clone e della IA interna.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone IA interno espone un primo blocco preventivi utile e leggibile senza riattivare parsing IA reale, upload o scritture business.
- Nessun impatto sui flussi correnti della madre e nessun backend legacy riusato come canale canonico.

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT / IA interna
- Documentazione architetturale e operativa clone

## Contratti dati toccati?
- SI
- Solo contratti interni del sottosistema IA (`preventivi-preview`) e tipi preview read-only; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Resta aperto il rifacimento futuro del parsing preventivi su backend dedicato e del perimetro approvativo separato.

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
- Il blocco preventivi iniziale non apre ancora filtro periodo dedicato, artifact specifico o revisione umana approvativa.
- Il procurement globale resta volutamente supporto separato e non va promosso a base diretta senza un layer mezzo-centrico dedicato.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiPreventiviPreviewFacade.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
