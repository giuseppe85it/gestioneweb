# Continuity Report

## Scope
- `Archivista documenti -> Fattura / DDT + Manutenzione`

## Continuita preservata
- nessun cambio a backend IA;
- nessun cambio a writer manutenzioni;
- nessun cambio a `cloneWriteBarrier.ts`;
- nessun cambio a handler o validazioni esistenti;
- nessun cambio a contratti dati o payload.

## Continuita UI
- `Step 1` resta il punto di ingresso sempre visibile;
- `Step 2` continua a dipendere da `analysis !== null`;
- `Step 3` continua a dipendere dal controllo duplicati;
- `Step 4` continua a dipendere da `archiveStatus === "success"`;
- `Step 5` continua a dipendere da `maintenanceCreateStatus`.

## Verifiche eseguite
- `npx eslint src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
- `npm run build` -> `OK`

## Da verificare
- comparsa corretta step-by-step in browser;
- toggle `showMateriali` funzionante e aperto di default;
- toggle `showAvvisi` funzionante e chiuso di default;
- nessuna regressione visuale sul ramo manutenzione in `/next/ia/archivista`.
