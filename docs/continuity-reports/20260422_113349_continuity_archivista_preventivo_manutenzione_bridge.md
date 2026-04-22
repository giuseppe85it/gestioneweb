# Continuity Report

## Scope
- `Archivista documenti -> Preventivo -> Manutenzione`

## Continuita preservata
- nessun cambio a `ArchivistaManutenzioneBridge.tsx`;
- nessuna write in `@manutenzioni`;
- nessuna write in `@documenti_mezzi`;
- nessun cambio a `cloneWriteBarrier.ts`;
- nessun cambio a writer, domain o barrier fuori dal perimetro autorizzato.

## Continuita dati
- la destinazione dati resta `storage/@preventivi`;
- la family resta `preventivo_magazzino`;
- la shape del preventivo archivista resta invariata salvo estensione additiva `metadatiMezzo`.

## Continuita UI
- il dispatcher Archivista mantiene i rami gia attivi esistenti;
- `Preventivo -> Manutenzione` passa da `out_of_scope` a ramo attivo;
- la UI del nuovo bridge segue la stessa grammatica step-based del ramo manutenzione:
  - `Step 1` upload
  - `Step 2` review analisi
  - `Step 3` duplicati
  - `Step 4` archivio completato

## Verifiche eseguite
- `npx eslint src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts src/next/NextIAArchivistaPage.tsx` -> `OK`
- `npm run build` -> `OK`
- `npm run lint` -> `KO` per errori globali preesistenti fuori perimetro

## Da verificare
- mount reale del nuovo ramo su `/next/ia/archivista`;
- blocco archiviazione senza `targa`;
- scrittura finale del record in `storage/@preventivi` con `metadatiMezzo`;
- assenza di scritture in `@manutenzioni` e `@documenti_mezzi`.
