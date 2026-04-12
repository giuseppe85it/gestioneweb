# Continuity Report - 2026-04-12 14:13:06

## Contesto
Il task parteva dall'audit `20260412_133832` che aveva dimostrato un solo blocco reale su `Analizza`: il `POST` legacy verso `estrazioneDocumenti` veniva fermato dal `cloneWriteBarrier` come `fetch.runtime` prima della rete.

## Cosa e stato fatto
- applicata la patch minima solo in `src/utils/cloneWriteBarrier.ts`
- autorizzato esclusivamente il caso:
  - route `/next/ia/interna`
  - metodo `POST`
  - endpoint `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`
- nessun altro modulo, writer o endpoint e stato aperto

## Verifica reale
- `npx eslint src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`
- browser reale su `/next/ia/interna` con `audit-fattura-mariba.pdf`
- `Analizza` invia davvero il `POST` in network con `200`
- la review documento si apre correttamente dopo la risposta

## Stato attuale
- `Analizza` nel clone non e piu bloccato dal barrier sulla route `/next/ia/interna`
- `home sporca` resta `NON RIPRODOTTA` nel runtime corrente
- restano separati e non corretti in questo task:
  - listing Storage Firebase `403`
  - `Maximum update depth exceeded` durante la review

## Prossimo punto utile
- audit separato dei residui console solo se diventano bloccanti o se il prompt li include esplicitamente
