# Continuity Report - IA interna multi-file documento logico unico

Data: 2026-04-14  
Task: riepilogo unico multi-file per `/next/ia/interna`

## Cosa e stato fatto
- aggiunto il toggle `Tratta questi file come un unico documento` nel flusso allegati della IA interna;
- introdotta un'aggregazione prudente sopra `documentAnalysis`, senza toccare l'estrazione del singolo file;
- passato il flag logico all'orchestratore, che ora costruisce routing/handoff coerenti per un documento logico unico;
- resa unica la proposal finale e la review utente, mantenendo le preview attachment-by-attachment.

## File runtime chiave
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`

## Comportamento runtime attuale
- 1 allegato:
  - nessun cambiamento rispetto a prima;
  - nessun flag visibile o attivo.
- 2 o piu allegati:
  - il toggle e visibile e parte attivo di default;
  - la IA considera il gruppo come un documento logico unico;
  - proposal e review mostrano un solo riepilogo finale;
  - i file restano separati solo come preview/tab allegato.

## Guard rail attivi
- nessun merge PDF obbligatorio;
- nessuna modifica alla pipeline di extraction per-file;
- i campi in conflitto tra allegati restano vuoti o `DA VERIFICARE`.

## Verifiche gia eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts src/next/internal-ai/internalAiDocumentAnalysis.ts` -> OK
- `npm run build` -> OK

## Rischi residui
- gruppi multi-file molto eterogenei possono portare piu campi header/totali a `DA VERIFICARE`;
- la logica e prudente per scelta: non forza dati quando gli allegati non concordano.

## Prossimo punto sensato
- rivalidare il comportamento su allegati reali multi-file della stessa manutenzione, soprattutto nei casi in cui un allegato contiene solo header e un altro contiene solo dettaglio righe.
