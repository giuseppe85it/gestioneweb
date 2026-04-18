# CHANGE REPORT - 2026-04-16 19:47 - fix clonewritebarrier next ia libretto

## Tipo intervento

Patch runtime chirurgica su `src/utils/cloneWriteBarrier.ts` + audit barrier in sola lettura.

## File runtime toccati

- `src/utils/cloneWriteBarrier.ts`

## Obiettivo

Sbloccare davvero `Analyze` di `/next/ia/libretto` senza allargare il barrier oltre il minimo necessario.

## Modifica reale

- corretto il confronto dell'endpoint `estrazione-libretto` nel check `isAllowedIaLibrettoAnalyzeFetch()`;
- il confronto ora normalizza sia l'URL runtime sia la costante ammessa rimuovendo gli slash finali;
- l'eccezione resta limitata a:
  - route `/next/ia/libretto`
  - metodo `POST`
  - endpoint `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app` con o senza slash finale

## Perimetro invariato

- nessun altro endpoint aperto
- nessun altro modulo aperto
- nessuna apertura generica di `fetch.runtime`
- `storage.uploadString` resta limitato a `mezzi_aziendali/`
- `setItemSync("@mezzi_aziendali")` resta limitato al perimetro libretto

## Verifiche eseguite

- `npx eslint src/utils/cloneWriteBarrier.ts src/next/NextIALibrettoPage.tsx` -> `OK`
- `npm run build` -> `OK`
- prova browser reale su `/next/ia/libretto`:
  - upload file -> `OK`
  - click `Analizza` -> `POST` reale partita verso `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app/`
  - risposta `200` e risultati estratti visibili
  - nessun `[CLONE_NO_WRITE] ... fetch.runtime`

## Esito

`Analyze` di `/next/ia/libretto` risulta sbloccato davvero.
