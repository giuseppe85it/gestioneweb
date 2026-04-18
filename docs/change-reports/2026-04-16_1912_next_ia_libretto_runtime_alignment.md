# CHANGE REPORT - 2026-04-16 19:12 - next ia libretto runtime alignment

## Tipo intervento

Patch runtime + barrier + documentazione obbligatoria.

## File runtime toccati

- `src/next/NextIALibrettoPage.tsx`
- `src/utils/cloneWriteBarrier.ts`

## File documentali toccati

- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Obiettivo

Riallineare `/next/ia/libretto` alla stessa logica reale della madre per:

- analisi del libretto;
- salvataggio del libretto;
- dataset finale;
- path Storage finale;
- campi downstream letti dai reader esistenti.

## Modifiche reali

- `NextIALibrettoPage.tsx`
  - sostituito il ramo read-only di `handleAnalyze` con la chiamata reale a `estrazione-libretto`;
  - sostituito il ramo read-only di `handleSave` con la stessa pipeline dati della madre;
  - mantenuti i campi risultati editabili prima del salvataggio;
  - mantenuto il dataset finale `storage/@mezzi_aziendali`;
  - mantenuto il path Storage finale `mezzi_aziendali/<mezzoId>/libretto.jpg`.

- `cloneWriteBarrier.ts`
  - aperta solo l'eccezione stretta per `/next/ia/libretto`;
  - consentiti solo:
    - `POST` a `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`
    - `storage.uploadString` sotto `mezzi_aziendali/`
    - `setItemSync("@mezzi_aziendali")`

## Verifiche eseguite

- `npx eslint src/next/NextIALibrettoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`

## Impatto

- madre: non toccata
- dataset finale: invariato rispetto alla madre
- path Storage finale: invariato rispetto alla madre
- rischio: `EXTRA ELEVATO`
