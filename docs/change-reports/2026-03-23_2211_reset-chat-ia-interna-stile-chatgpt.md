# CHANGE REPORT - Reset chat IA interna stile ChatGPT

## Data
- 2026-03-23 22:11

## Tipo task
- UI

## Obiettivo
- Trasformare `/next/ia/interna` in una chat unica usabile, con memoria repo/UI attiva nelle richieste libere quando disponibile, allegati IA-only nello stesso composer e pannelli tecnici secondari.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-chat-attachments.js`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- La pagina IA interna e stata ripulita in una chat centrale unica, con composer dedicato e suggerimenti iniziali piu utili.
- Le richieste libere UI/flussi/repo ora usano davvero la memoria osservata quando c'e un contesto fresco o parziale, invece di ricadere sempre nel perimetro base.
- E stato introdotto un flusso allegati IA-only con apertura/rimozione/preview e fallback locale controllato.
- I blocchi tecnici restano visibili ma collassati e secondari.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La pagina IA smette di sembrare una dashboard di debug e diventa un assistente unico piu chiaro.
- La nuova IA interna legge meglio il contesto osservato e puo rispondere in modo piu coerente alle richieste libere.
- Nessuna scrittura business viene attivata.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna
- backend IA separato

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il fallback locale degli allegati resta necessario quando il backend IA separato non e disponibile.
- La profondita di parsing per alcuni tipi file non e ancora completa.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiChatOrchestrator.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-chat-attachments.js backend/internal-ai/src/internalAiServerPersistenceContracts.ts` -> OK
- `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
- `node --check backend/internal-ai/server/internal-ai-chat-attachments.js` -> OK
- `npm --prefix backend/internal-ai run typecheck` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
