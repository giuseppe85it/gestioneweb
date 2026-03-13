# CHANGE REPORT - Chat interna controllata

- Data: 2026-03-12 22:44
- Tipo: code
- Area: sottosistema IA interno clone `/next/ia/interna*`

## Obiettivo
Introdurre la prima chat interna controllata del sottosistema IA, senza collegare un vero LLM o backend IA, ma con una UI coerente col gestionale e un orchestratore locale/mock capace di instradare richieste sicure verso il use case gia esistente del report targa in anteprima.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internal-ai.css`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/nextData.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-12_2244_patch_chat-interna-controllata.md`
- `docs/continuity-reports/2026-03-12_2244_continuity_chat-interna-controllata.md`

## Sintesi tecnica
- Aggiunta una sezione chat interna nella panoramica `/next/ia/interna`, con suggerimenti iniziali, messaggi utente/assistente, input controllato e stato di elaborazione semplice.
- Definiti model locali per messaggi chat, intenti, stato esecuzione e riferimenti a preview/artifact.
- Creato un orchestratore locale/mock che gestisce solo:
  - aiuto/capacita del modulo;
  - report targa in anteprima;
  - richieste non ancora supportate.
- L'intento `report targa` riusa il facade read-only gia introdotto dal sottosistema IA interno e aggiorna la stessa preview targa della pagina.
- I messaggi restano solo in memoria nella pagina corrente; non viene introdotta persistenza business o server-side.
- Aggiornati checklist e registri documentali obbligatori del clone/NEXT.

## Sicurezza e perimetro
- Nessuna scrittura su dataset business.
- Nessun riuso runtime di `aiCore`, Cloud Functions IA legacy, Cloud Run, `server.js` o altri backend IA esistenti.
- Nessun segreto lato client.
- Nessun impatto sui flussi correnti fuori dal subtree clone `/next/ia/interna*`.

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/NextIntelligenzaArtificialePage.tsx src/next/nextData.ts src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiTracking.ts`
- `npm run build`

## Esito finale
- Stato: `FATTO`
- Rischio: `NORMALE`
- Note residue:
  - la chat non ha ancora persistenza locale dei messaggi;
  - nessun provider IA reale o backend dedicato e stato introdotto in questo step.
