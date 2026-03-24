# CONTINUITY REPORT - IA interna chat-first

## Contesto generale
- Il progetto continua nella fase di consolidamento della NEXT e del sottosistema IA interna, con madre intoccabile, clone read-only e nessun bridge business live riaperto.

## Modulo/area su cui si stava lavorando
- `IA interna` del clone `/next`
- reset della pagina `/next/ia/interna`

## Stato attuale
- La pagina IA interna e ora centrata su una chat unica leggibile.
- La memoria repo/UI viene riusata davvero nelle richieste libere quando disponibile.
- Gli allegati IA-only stanno nello stesso thread/composer.
- I pannelli tecnici sono secondari e collassabili.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Chat principale unica stile ChatGPT.
- Wiring memoria repo/UI/runtime piu esplicito e usabile.
- Allegati IA-only con apertura/rimozione e fallback locale.
- Output selector e report/PDF mantenuti ma spostati in secondo piano.
- Stato tecnico compatto e secondario.

## Prossimo step di migrazione
- Rifinire la profondita di analisi degli allegati IA-only e verificare se la memoria osservata puo essere ulteriormente arricchita senza riaprire bridge live non dimostrati.

## Moduli impattati
- IA interna
- backend IA separato

## Contratti dati coinvolti
- `InternalAiChatMemoryHints`
- `InternalAiChatAttachment`
- `attachments.repository`
- `run_controlled_chat`

## Ultime modifiche eseguite
- Reset della pagina IA interna a chat-first.
- Aggiunto flusso allegati IA-only nello stesso composer.
- Reso piu esplicito l'uso della memoria osservata nelle richieste libere.

## File coinvolti
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

## Decisioni gia prese
- La madre non si tocca.
- Nessuna scrittura business.
- Nessun segreto lato client.
- Nessun live Firebase/Storage riaperto.
- La UI della IA deve sembrare una chat vera, non una dashboard tecnica.

## Vincoli da non rompere
- Mantenere il perimetro IA-only.
- Restare in italiano per tutti i testi visibili.
- Conservare fallback locale quando il backend non e disponibile.

## Parti da verificare
- La profondita futura di parsing degli allegati.
- Eventuali ulteriori aggiornamenti della memoria repo/UI osservata.

## Rischi aperti
- Gli allegati non hanno ancora parsing profondo per ogni formato.
- Il backend IA separato resta mock-safe per la parte live business non aperta.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Consolidare il nuovo layout chat-first e, se serve, aggiungere una lettura piu ricca ma sempre read-only degli allegati IA-only.

## Cosa NON fare nel prossimo task
- Non riaprire bridge Firebase/Storage.
- Non riportare la pagina IA a un layout da dashboard tecnica.
- Non introdurre scritture business.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
