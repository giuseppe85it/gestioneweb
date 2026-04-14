# Change Report - IA interna multi-file documento logico unico

Data: 2026-04-14  
Tipo: execution runtime NEXT + documentazione  
Rischio: ELEVATO

## Obiettivo
Permettere alla IA interna NEXT di ricevere 2 o piu allegati riferiti alla stessa manutenzione e produrre un solo riepilogo finale unificato, senza cambiare upload, extraction o comportamento del caso singolo.

## File runtime toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/`

## Modifiche runtime
1. UI e stato chat
- aggiunto nel composer allegati il toggle `Tratta questi file come un unico documento`;
- il toggle si attiva automaticamente solo quando gli allegati sono almeno 2;
- tornando a 0/1 allegato il flag si azzera da solo, cosi il caso singolo non cambia.

2. Aggregazione prudente sopra l'analisi esistente
- `internalAiDocumentAnalysis.ts` aggrega solo i dati gia estratti dai singoli allegati;
- header, righe e testo breve vengono uniti quando coerenti;
- se piu allegati portano valori in conflitto, il dato non viene inventato: resta vuoto o viene segnalato `da verificare`.

3. Orchestrazione e handoff
- l'orchestratore riceve il flag logico multi-file;
- router e handoff trattano il gruppo come un solo documento logico, mantenendo pero gli allegati separati a livello tecnico;
- gli action intent duplicati verso lo stesso target vengono collassati nel solo caso multi-file unificato.

4. Risultato utente finale
- la proposal automatica mostra un solo riepilogo finale;
- la review full screen mostra un unico riepilogo aggregato;
- i singoli file restano consultabili come preview/tab separati.

## Vincoli rispettati
- extraction del singolo file invariata;
- upload attachment invariato;
- caso singolo invariato;
- nessun merge PDF fisico obbligatorio;
- madre non toccata;
- nessun file backend IA separato modificato.

## Verifiche
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatAttachmentsClient.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalOrchestrator.ts src/next/internal-ai/internalAiDocumentAnalysis.ts` -> OK
- `npm run build` -> OK

## Esito
Patch completata nel perimetro richiesto: 1 file continua a comportarsi come prima, 2 o piu file possono essere trattati come un unico documento logico con riepilogo finale unificato.
