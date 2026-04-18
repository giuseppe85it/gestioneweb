# CONTINUITY REPORT - 2026-04-16 19:12 - next ia libretto runtime alignment

## Stato iniziale

`/next/ia/libretto` era ancora read-only:

- `Analizza con IA` non chiamava il backend reale;
- `Salva nei documenti del mezzo` non eseguiva scritture;
- il barrier non apriva il perimetro `/next/ia/libretto`.

## Continuita garantita

- madre legacy intoccata;
- nessun dataset alternativo introdotto;
- nessun path Storage alternativo introdotto;
- nessun reader downstream cambiato.

## Stato finale

`/next/ia/libretto` segue ora la stessa pipeline pratica della madre:

1. analisi reale via `estrazione-libretto`
2. match mezzo per targa normalizzata
3. eventuale fallback mezzo
4. upload preview su `mezzi_aziendali/<mezzoId>/libretto.jpg`
5. `getDownloadURL`
6. update record mezzo
7. `setItemSync("@mezzi_aziendali", mezzi)`

## Barrier

`cloneWriteBarrier.ts` apre ora solo il minimo necessario a `/next/ia/libretto`:

- `POST` verso `estrazione-libretto`
- `storage.uploadString` sotto `mezzi_aziendali/`
- `setItemSync("@mezzi_aziendali")`

## Verifiche

- `npx eslint src/next/NextIALibrettoPage.tsx src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`
