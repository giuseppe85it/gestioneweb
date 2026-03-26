# Change Report - 2026-03-26 09:37

## Titolo
Confine live-read backend IA chiuso per NEXT e IA interna

## Obiettivo
Chiudere in modo definitivo il confine tra IA interna NEXT, backend IA separato, letture clone/read-only gia esistenti ed eventuale live-read business, uscendo dal limbo con un verdetto binario verificato.

## File toccati
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`
- `backend/internal-ai/server/internal-ai-firebase-readiness.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cosa cambia davvero
- Il backend IA separato dichiara ora un boundary operativo esplicito: `live_read_closed`.
- La readiness Firebase/Storage espone solo diagnosi e blocker coerenti col verdetto binario, senza far sembrare attivo un perimetro quasi-live.
- L'orchestratore locale, il repo-understanding server-side e la chat controllata dichiarano in modo deterministico che `retrieval server-side` significa snapshot read-only dedicata o repo/UI snapshot curata, non live-read business.
- La UI `/next/ia/interna` mostra il confine reale con copy sobrio: `Lettura business live` chiusa, `Fonte business` basata su clone/read model e snapshot.

## Impatto
- IA/NEXT: il sottosistema esce dal limbo e smette di suggerire letture live non dimostrate.
- Backend IA: nessun bridge Firestore/Storage viene aperto; il fallback resta clone/read-only.
- Sicurezza: nessuna scrittura business, nessuna modifica alla madre, nessuna apertura insicura di Firebase/Storage.

## Verifiche
- `npm --prefix backend/internal-ai run firebase-readiness` -> OK
- `npx eslint --no-error-on-unmatched-pattern src/next/internal-ai/*.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/*.js backend/internal-ai/*.js` -> OK
- `npm run build` -> OK
- smoke backend `health` + `orchestrator/chat` su domanda live-vs-clone -> OK
- smoke Playwright su `/next/ia/interna` -> route caricata; suggestion live-vs-clone visibile; DOM renderizzato con badge `Lettura business live` e `Fonte business`

## Rischi residui
- I perimetri Firebase/Storage candidati restano documentati ma non attivi: una futura riapertura richiedera un task separato con access layer dedicato, credenziali server-side e policy verificabili.
- La UI puo dichiarare solo cio che il clone/read model e le snapshot curate rendono davvero disponibile; nessun dominio fuori questo perimetro diventa live per implicazione.
- I pannelli Firestore/Storage della console restano legati alla snapshot repo/UI del backend IA: se la snapshot non viene aggiornata, il verdetto resta comunque chiaro via badge e risposta chat, ma il dettaglio tecnico puo non essere il primo elemento visibile.
