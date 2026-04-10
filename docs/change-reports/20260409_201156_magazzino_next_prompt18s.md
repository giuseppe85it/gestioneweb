# Change Report - 2026-04-09 20:11:56

## Contesto
- Prompt: `PROMPT18S`
- Modulo: `Magazzino NEXT`
- Ambito: implementazione nativa di `/next/magazzino` da spec `docs/product/spec-magazzino-next-corretta.md`
- Rischio: `ELEVATO`

## Obiettivo
Creare un modulo NEXT unico per `Inventario`, `Materiali consegnati` e `Cisterne AdBlue`, mantenendo la madre intoccabile, usando persistenza storage-style reale e trattando `@cisterne_adblue` come dataset `getItemSync/setItemSync`.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/next-magazzino.css`
- `src/App.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- creata la nuova route `/next/magazzino` nella shell NEXT;
- implementata `NextMagazzinoPage` come pagina unica con switcher interno e tre sezioni:
  - `Inventario`
  - `Materiali consegnati`
  - `Cisterne AdBlue`
- introdotta persistenza reale su:
  - `@inventario`
  - `@materialiconsegnati`
  - `@cisterne_adblue`
- aggiunto upload immagini inventario su Storage con path `inventario/*`;
- esteso `cloneWriteBarrier.ts` al solo pathname `/next/magazzino` per autorizzare:
  - `storageSync.setItemSync` su `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`
  - `storage.uploadBytes` su `inventario/*`
- applicati i fix richiesti dalla spec nella sezione `Materiali consegnati`:
  - blocco stock insufficiente
  - rollback se fallisce la seconda scrittura
  - warning prima del ripristino di un articolo orfano
- `@cisterne_adblue` trattato solo come dataset storage-style, senza collection Firestore dedicata.

## Verifiche eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/App.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`

## Esito
- `PATCH COMPLETATA`
- modulo `/next/magazzino` montato davvero nella shell NEXT
- persistenza coerente con il barrier clone-safe
- nessuna modifica a `src/pages/Inventario.tsx` o `src/pages/MaterialiConsegnati.tsx`
