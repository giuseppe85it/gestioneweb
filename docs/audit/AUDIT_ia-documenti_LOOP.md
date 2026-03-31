# AUDIT LOOP - `IA Documenti`

- Timestamp audit: `2026-03-31 11:16 Europe/Rome`
- Modulo: `IA Documenti`
- Route verificata:
  - `/next/ia/documenti`
- Fonti runtime verificate:
  - `src/next/NextIADocumentiPage.tsx`
  - `src/next/domain/nextDocumentiCostiDomain.ts`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/next/nextAnagraficheFlottaDomain.ts`
  - `src/pages/IA/IADocumenti.tsx`

## Esito audit finale

- Verdetto: `PASS`
- Verifiche confermate sul codice reale:
  - la route ufficiale monta `src/next/NextIADocumentiPage.tsx`, non `NextMotherPage` o `src/pages/IA/IADocumenti.tsx`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `readInternalAiDocumentsPreview()`, `useInternalAiUniversalHandoffConsumer()`, `upsertNextInternalAiCloneDocumento()` o `upsertNextInventarioCloneRecord()`;
  - l'archivio ufficiale legge solo documenti reali tramite `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`, senza overlay clone-only;
  - il modulo legge anche gli stessi dati reali di supporto della madre tramite `readNextIaConfigSnapshot()` su `@impostazioni_app/gemini` e `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })` su `@mezzi_aziendali`;
  - `Analizza con IA`, `Salva Documento` e il modale `Imposta valuta` restano visibili come nella madre, ma bloccano il comportamento con messaggi read-only espliciti senza Cloud Function, Storage, Firestore o import inventario;
  - verifiche tecniche eseguite: `npx eslint src/next/NextIADocumentiPage.tsx src/next/domain/nextDocumentiCostiDomain.ts` e `npm run build`, entrambe `OK`.

## Limiti residui

- La selezione del file resta solo locale come affordance UI e non attiva upload reali o clone-only.
- La chiusura vale solo per il modulo `IA Documenti` nel loop corrente e non promuove la NEXT a sostituta della madre.

## Prossimo passo

- Il prossimo modulo del tracker e `IA Copertura Libretti`.
