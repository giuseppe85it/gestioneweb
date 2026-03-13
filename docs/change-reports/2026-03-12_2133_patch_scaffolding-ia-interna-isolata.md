# CHANGE REPORT - Scaffolding IA interna isolata

## Data
- 2026-03-12 21:33

## Tipo task
- patch

## Obiettivo
- Avviare il primo scaffolding non operativo del nuovo sottosistema IA interna dentro `/next`, in modo isolato, preview-first e senza impatto sui moduli business o IA legacy.

## File modificati
- `src/App.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`

## Riassunto modifiche
- Creato il subtree `/next/ia/interna*` con entry UI isolate per overview, sessioni, richieste, artifacts e audit.
- Aggiunti model/types locali e contratti stub per sessioni, richieste, artifact, audit log, preview/approval workflow e adapter futuri.
- Aggiunto un repository mock locale e un tracking solo in-memory, confinati al nuovo perimetro IA interno.
- Aggiornato l'hub `/next/ia` per esporre lo scaffolding interno senza collegamenti runtime ai moduli IA legacy.
- Aggiornata la documentazione tecnica e di stato del clone/NEXT/IA interna.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il clone espone una base UI sicura e reversibile per la futura IA interna senza toccare la madre.
- Nessuna scrittura su dataset business, nessun backend reale e nessun provider segreto vengono introdotti.

## Rischio modifica
- NORMALE

## Moduli impattati
- IA clone `/next`
- Routing NEXT
- Documentazione IA interna

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: ownership backend IA dedicato, policy Firestore/Storage effettive, strategia persistenza artifact/tracking da `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- L'archivio artifact resta intenzionalmente mock-only: nessuna persistenza reale va introdotta senza step dedicato.
- Il tracking resta solo in-memory: non va esteso a localStorage o a eventi globali nel prossimo task senza nuova verifica.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/App.tsx src/next/NextIntelligenzaArtificialePage.tsx src/next/NextInternalAiPage.tsx src/next/nextStructuralPaths.ts src/next/nextData.ts src/next/nextAccess.ts src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts` -> OK
- `npm run lint` -> FALLISCE per debito storico fuori perimetro su legacy, autisti, utils e backend gia presenti nel repository

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
