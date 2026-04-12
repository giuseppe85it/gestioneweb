# Change Report - 2026-04-12 19:40:36

## Titolo
UI `IA Universal Dispatcher` applicata nel clone con esito parziale ma verificato

## Obiettivo
Riallineare Home launcher, pagina `/next/ia/interna` e storico `/next/ia/documenti` alla spec `docs/product/SPEC_IA_UNIVERSAL_DISPATCHER.md` senza toccare domain, orchestrator, writer, barrier o motori legacy.

## File runtime toccati
- `src/next/components/HomeInternalAiLauncher.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Cosa cambia davvero
- La Home mostra una card unica `Assistente IA` con prompt, menu `+`, voci attive/in arrivo e link `Storico`.
- Il submit della card naviga a `/next/ia/interna` con `initialPrompt`.
- Il menu `+` usa `triggerUpload` e non apre modali custom.
- `/next/ia/interna` espone una shell dispatcher nuova con header, composer, colonna destra funzioni, handoff banner compatto e review interna a due colonne.
- L'ingresso reale `/next/ia/interna` non reidrata piu automaticamente gli allegati IA-only persistiti, quindi non mostra piu `fattura mariba.jpeg` o banner sporchi di default.
- `/next/ia/documenti` e stato riscritto come storico ufficiale read-only usando solo il domain `readNextIADocumentiArchiveSnapshot()`.

## Limite reale che rende il task parziale
- Il domain read-only `src/next/domain/nextDocumentiCostiDomain.ts` non espone ancora sezioni dedicate `Libretti`, `Cisterna`, `Manutenzioni`.
- Per questo lo storico puo rispettare solo in parte la spec: oggi mostra solo cio che il domain fornisce davvero (`Fatture/DDT`, `Preventivi`, `Da verificare`).

## Verifiche eseguite
- `npm run build` -> `OK`
- Browser verificato davvero su:
  - `http://localhost:5173/next`
  - `http://localhost:5173/next/ia/interna`
  - `http://localhost:5173/next/ia/documenti`
- Esiti runtime verificati:
  - prompt Home -> `/next/ia/interna` con testo precaricato
  - menu `+` aperto con voci corrette
  - voce `Libretto mezzo` -> `/next/ia/libretto`
  - `/next/ia/interna` pulita senza banner/review sporchi di default
  - `Riapri review` funzionante da storico
  - `Apri originale` funzionante in nuova tab
- Errori residui osservati:
  - `403` sui listing Storage Firebase
  - nessun `Maximum update depth exceeded` osservato in queste verifiche

## Stato onesto
- Home launcher spec: `FATTO`
- Pagina dispatcher spec: `FATTO`
- Storico spec al 100%: `NON FATTO`
- Esito complessivo task: `PATCH PARZIALE`
