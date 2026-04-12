# Change Report - 2026-04-12 14:13:06

## Titolo
Fix mirato `Analizza` IA interna via deroga stretta del clone barrier

## Obiettivo
Sbloccare davvero `Analizza` su `/next/ia/interna` autorizzando solo il `POST` gia esistente verso `estrazioneDocumenti`, senza widening generico del barrier e senza toccare UI, motore documentale o writer business.

## File toccati
- `src/utils/cloneWriteBarrier.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/fonti-pronte/STATO_ATTUALE_PROGETTO.md`
- `docs/fonti-pronte/CONTEXT_CLAUDE.md`
- `docs/fonti-pronte/STATO_MIGRAZIONE_NEXT.md`
- `docs/fonti-pronte/REGISTRO_MODIFICHE_CLONE.md`
- `docs/fonti-pronte/CHECKLIST_IA_INTERNA.md`
- `docs/fonti-pronte/STATO_AVANZAMENTO_IA_INTERNA.md`

## Modifica applicata
- aggiunta una sola eccezione in `src/utils/cloneWriteBarrier.ts` per `fetch.runtime` quando tutte le condizioni sono vere:
  - pathname corrente esatto `/next/ia/interna`
  - metodo esatto `POST`
  - endpoint esatto `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`
- nessuna wildcard nuova
- nessuna apertura per altre route `/next/*`
- nessuna apertura per altri endpoint Cloud Functions
- nessuna nuova deroga su storage, Firestore o writer business

## Verifiche eseguite
- `npx eslint src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`
- browser reale su `http://localhost:5173/next/ia/interna`:
  - upload `audit-fattura-mariba.pdf`
  - click `Analizza`
  - `POST` verso `estrazioneDocumenti` partito davvero in network con `200`
  - review documento aperta correttamente con CTA `Apri originale`, `Vai a Inventario`, `Torna alla home documentale`

## Residui osservati
- richieste di listing Storage Firebase `403` gia presenti nel runtime
- ricorrenze `Maximum update depth exceeded` durante la review
- nessuno di questi residui blocca piu `Analizza`

## Esito
- `Analizza` su `/next/ia/interna` -> `SBLOCCATO`
- capability documentale IA interna -> `PARZIALE`
