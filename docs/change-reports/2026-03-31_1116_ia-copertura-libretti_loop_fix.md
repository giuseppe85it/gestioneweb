# Change Report - 2026-03-31 11:16 - IA Copertura Libretti loop fix

## Obiettivo

Chiudere il modulo `IA Copertura Libretti` della NEXT come clone fedele read-only della madre su `/next/ia/copertura-libretti`, senza upload o patch locali nel runtime ufficiale.

## Perimetro

- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- documentazione loop/audit/stato clone collegata al modulo

## Modifiche eseguite

- riscritta `src/next/NextIACoperturaLibrettiPage.tsx` sulla superficie pratica della madre: filtri, tabella copertura, debug DEV e area `Ripara libretti da lista ID`;
- rimosse dal runtime ufficiale tutte le dipendenze clone-specifiche:
  - `NextClonePageScaffold`
  - `upsertNextFlottaClonePatch()`
  - upload e repair locali
- esteso `src/next/nextAnagraficheFlottaDomain.ts` per esporre anche `librettoStoragePath` reale, necessario per una parity madre-like sulla copertura libretti;
- mantenute visibili le CTA madre `ESEGUI RIPARAZIONE`, `Carica libretto` e `Ripara libretto`, ma con blocco read-only esplicito.

## Dati letti davvero

- `@mezzi_aziendali` tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`

## Verifiche

- `npx eslint src/next/NextIACoperturaLibrettiPage.tsx src/next/nextAnagraficheFlottaDomain.ts`
- `npm run build`

Esito: `OK`, con warning preesistenti su `baseline-browser-mapping`, `jspdf` e chunk size.

## Esito modulo

- Audit separato: `PASS`
- Tracker: `IA Copertura Libretti` marcato `CLOSED`
- Prossimo modulo del loop: `Libretti Export`
