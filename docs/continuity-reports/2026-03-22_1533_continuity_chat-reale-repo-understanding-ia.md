# CONTINUITY REPORT - Chat reale e repo understanding IA interna

## Contesto generale
- Il progetto resta nella fase di clone NEXT `read-only` della madre con innesto progressivo di layer IA isolati sopra `/next/ia/interna*`.
- Il backend IA separato esiste gia con adapter server-side, persistenza dedicata, retrieval read-only iniziali e primo provider reale lato server.

## Modulo/area su cui si stava lavorando
- Sottosistema `IA interna` della NEXT.
- Perimetro recente: chat interna controllata, retrieval repo/UI read-only, documentazione di stato e tracciatura clone.

## Stato attuale
- La chat interna puo usare `OpenAI` solo lato server tramite `orchestrator.chat`, con fallback locale clone-safe.
- Esiste un primo livello di comprensione controllata repo/UI tramite snapshot curata `read_repo_understanding_snapshot`.
- La UI `/next/ia/interna` mostra anche un pannello overview con fonti, route rappresentative, pattern UI e limiti della snapshot.
- Nessuna scrittura business e nessuna patch automatica del repository sono state aperte.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Chat interna backend-first con provider reale server-side controllato.
- Retrieval repo/UI read-only e curato.
- Persistenza IA dedicata, artifact, memoria operativa e workflow preview/approval/rollback gia aperti.

## Prossimo step di migrazione
- Estendere il retrieval server-side a nuovi perimetri business sicuri o migliorare l'auth/policy del backend IA separato prima di avvicinarsi a capability piu sensibili.

## Moduli impattati
- `backend/internal-ai/*`
- `src/next/internal-ai/*`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- envelope `orchestrator.chat`
- envelope `retrieval.read`
- snapshot repo/UI curata
- `process.env.OPENAI_API_KEY` solo lato server

## Ultime modifiche eseguite
- Collegata la chat interna al provider reale server-side con fallback locale esplicito.
- Aperta una snapshot repo/UI curata e read-only per spiegazioni controllate del gestionale.
- Aggiornati stato progetto, checklist IA, stato avanzamento IA, stato migrazione NEXT e registro modifiche clone.

## File coinvolti
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/README.md`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`

## Decisioni gia prese
- `OpenAI` resta ammesso solo lato server nel backend IA separato.
- La chat reale non puo applicare modifiche business o patch al repository.
- La comprensione repo/UI deve restare curata, limitata, read-only e spiegabile.
- I backend IA legacy non possono diventare canale canonico della nuova IA interna.

## Vincoli da non rompere
- Nessuna scrittura Firestore/Storage business.
- Nessun segreto lato client.
- Nessuna automazione che modifichi codice o dati business senza task esplicito.
- Aggiornare sempre `STATO_MIGRAZIONE_NEXT.md` e `REGISTRO_MODIFICHE_CLONE.md` quando si tocca il clone.

## Parti da verificare
- Estensione futura della snapshot repo/UI a ulteriori aree senza trasformarla in scansione indiscriminata.
- Strategia auth/policy del backend IA separato oltre il localhost.
- Eventuale persistenza server-side strutturata delle conversazioni chat, oggi ancora soprattutto lato UI/processo.

## Rischi aperti
- La shell locale puo non ereditare automaticamente `OPENAI_API_KEY` a livello utente Windows.
- Il retrieval repo/UI non e una mappa completa del repository e puo richiedere estensioni curate per task futuri.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Consolidare auth, policy e retrieval server-side aggiuntivi del backend IA separato prima di aprire capability piu vicine ai dataset business reali.

## Cosa NON fare nel prossimo task
- Non trasformare la IA in un agente che patcha il repository da sola.
- Non agganciare backend IA legacy come canale canonico.
- Non aprire scritture business automatiche o segreti lato client.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
