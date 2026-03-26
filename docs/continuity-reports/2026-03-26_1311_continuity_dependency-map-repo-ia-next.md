# CONTINUITY REPORT - IA interna NEXT / dependency map repo

## Contesto generale
- il progetto resta nella fase di clone `read-only` della madre, con NEXT come unico perimetro di evoluzione e backend IA separato per retrieval/orchestrazione controllata;
- il live-read business e gia stato chiuso in modo binario e l'assistente `repo/flussi` esisteva gia in forma curata; questo task lo ha reso piu strutturale tramite dependency map.

## Modulo/area su cui si stava lavorando
- backend IA separato
- IA interna NEXT
- repo understanding / mappa dipendenze repo-moduli-route-layer

## Stato attuale
- stabile la risposta deterministica server-side sui prompt repo/flussi, ora alimentata da dependency map con route, file UI, read model, backend IA, monte/valle e punto di integrazione;
- stabile anche il fallback locale dell'orchestratore sui casi bussola principali, con struttura pratica coerente col backend;
- `/next/ia/interna` mostra il conteggio della dependency map e una vista sintetica della matrice, oltre alla snapshot repo/UI gia presente.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- snapshot repo/UI curata server-side
- risposta deterministica `repo_understanding`
- dependency map strutturale per 6 casi chiave
- wiring UI minimale nella console IA interna

## Prossimo step di migrazione
- se richiesto, ampliare la dependency map a domini aggiuntivi mantenendo la stessa struttura pratica e senza trasformarla in una knowledge base infinita.

## Moduli impattati
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- aggiunta dependency map statica/pratica per 6 casi chiave del repo assistant;
- rafforzate le risposte repo/flussi con sezioni strutturate su route, file, layer e integrazione;
- resa visibile la dependency map nella console `/next/ia/interna`.

## File coinvolti
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- la dependency map resta metadata-driven, spiegabile e confinata al backend IA separato e alla console NEXT;
- le risposte repo/flussi devono continuare a distinguere madre, NEXT, backend IA, read model e renderer/UI;
- nessuna capability repo-aware puo aprire patch automatiche o letture business live.

## Vincoli da non rompere
- madre intoccabile;
- nessuna scrittura business o live-read Firestore/Storage;
- nessun refactor largo del motore business o della console IA;
- nessun file fuori whitelist senza nuova autorizzazione.

## Parti da verificare
- eventuale estensione della dependency map a D03, D05, D06 o altre verticali, se richiesta in un task dedicato;
- eventuale esposizione tipizzata della dependency map nei contratti shared del backend, oggi non necessaria perche la UI la legge in modo opzionale.

## Rischi aperti
- la dependency map non sostituisce una analisi runtime completa del legacy e non copre ogni edge case;
- il lint richiesto va eseguito con `--no-error-on-unmatched-pattern` finche `backend/internal-ai/*.js` non matcha file nel repo.

## Punti da verificare collegati
- nessun nuovo punto aperto formalizzato in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- aprire solo task mirati su una singola verticale o su un singolo pattern di integrazione se si vuole estendere la dependency map oltre i 6 casi attuali.

## Cosa NON fare nel prossimo task
- non trasformare la dependency map in una scansione infinita del repo;
- non spostare logica business nel backend IA solo per ottenere risposte piu ricche;
- non riaprire il live-read business o la madre per facilitare il repo understanding.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
