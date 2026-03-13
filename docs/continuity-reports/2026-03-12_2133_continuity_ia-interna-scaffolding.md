# CONTINUITY REPORT - IA interna scaffolding

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre sotto `/next`.
- La nuova IA interna puo nascere solo dentro il clone e solo come perimetro isolato, senza backend business attivi.

## Modulo/area su cui si stava lavorando
- IA clone
- primo scaffolding del sottosistema IA interna sotto `/next/ia/interna*`

## Stato attuale
- Esiste un subtree IA interno isolato, non operativo e preview-first.
- Esistono solo route UI, model/types locali, contratti stub, repository mock e tracking in-memory.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell UI locale
- routing dedicato
- model/types locali
- repository mock
- tracking uso isolato in-memory

## Prossimo step di migrazione
- Definire il contratto del backend IA dedicato lato server, senza ancora attivare runtime o persistenza business.

## Moduli impattati
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/*`

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- Creato subtree `/next/ia/interna*` con cinque schermate isolate.
- Predisposti contratti stub per orchestrator, retrieval, artifact repository, audit log e approval workflow.
- Limitato archivio artifact e tracking a repository mock e memoria locale del modulo.

## File coinvolti
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`

## Decisioni gia prese
- Nessun riuso runtime dei moduli IA/PDF legacy.
- Nessuna persistenza reale per artifact o tracking in questo step.
- Nessun hook globale o effetto collaterale fuori dal subtree IA interno.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura su dataset business.
- Nessun segreto lato client.
- Nessuna attivazione di backend IA reale dal clone.

## Parti da verificare
- Ownership del backend IA dedicato.
- Policy Firestore effettive.
- Policy Storage effettive.
- Contratto futuro di persistenza per artifact, audit log e tracking.

## Rischi aperti
- Estendere troppo presto il mock artifact verso Storage o dataset reali.
- Riutilizzare per comodita backend IA legacy invece di mantenere il nuovo perimetro separato.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Aprire un task separato solo documentale/architetturale per definire backend IA dedicato, repository persistenti isolati e matrice sicurezza server-side.

## Cosa NON fare nel prossimo task
- Non collegare `/next/ia/interna*` a Firestore/Storage business.
- Non riusare `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf` o Cloud Run libretto come backend del nuovo sottosistema.
- Non introdurre segreti provider nel frontend.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
