# Change Report - 2026-03-31 11:16 - IA Documenti loop fix

## Obiettivo

Chiudere il modulo `IA Documenti` della NEXT come clone fedele read-only della madre su `/next/ia/documenti`, eliminando preview e writer clone-only dal runtime ufficiale.

## Perimetro

- `src/next/NextIADocumentiPage.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- documentazione loop/audit/stato clone collegata al modulo

## Modifiche eseguite

- riscritta `src/next/NextIADocumentiPage.tsx` sulla grammatica pratica madre-like: caricamento, anteprima, risultati analisi, archivio documenti salvati e modale valuta;
- rimosse dal runtime ufficiale le dipendenze clone-only:
  - `NextClonePageScaffold`
  - `readInternalAiDocumentsPreview()`
  - `useInternalAiUniversalHandoffConsumer()`
  - `upsertNextInternalAiCloneDocumento()`
  - `upsertNextInventarioCloneRecord()`
- introdotto in `src/next/domain/nextDocumentiCostiDomain.ts` il reader `readNextIADocumentiArchiveSnapshot()` per leggere solo `@documenti_mezzi`, `@documenti_magazzino` e `@documenti_generici` reali;
- mantenute visibili le CTA madre `Analizza con IA`, `Salva Documento` e il modale `Imposta valuta`, ma con blocco read-only esplicito e senza side effect.

## Dati letti davvero

- `@impostazioni_app/gemini` tramite `readNextIaConfigSnapshot()`
- `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` tramite `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`
- `@mezzi_aziendali` tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`

## Verifiche

- `npx eslint src/next/NextIADocumentiPage.tsx src/next/domain/nextDocumentiCostiDomain.ts`
- `npm run build`

Esito: `OK`, con warning preesistenti su `baseline-browser-mapping`, `jspdf` e chunk size.

## Esito modulo

- Audit separato: `PASS`
- Tracker: `IA Documenti` marcato `CLOSED`
- Prossimo modulo del loop: `IA Copertura Libretti`
