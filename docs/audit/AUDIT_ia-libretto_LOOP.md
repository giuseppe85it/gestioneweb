# AUDIT LOOP - `IA Libretto`

- Timestamp audit: `2026-03-31 10:55 Europe/Rome`
- Modulo: `IA Libretto`
- Route verificata:
  - `/next/ia/libretto`
- Fonti runtime verificate:
  - `src/next/NextIALibrettoPage.tsx`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/next/domain/nextIaLibrettoDomain.ts`
  - `src/pages/IA/IALibretto.tsx`

## Esito audit finale

- Verdetto: `PASS`
- Verifiche confermate sul codice reale:
  - la route ufficiale monta `src/next/NextIALibrettoPage.tsx`, non `NextMotherPage` o `src/pages/IA/IALibretto.tsx`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, handoff IA dedicato, `readInternalAiLibrettoPreview()`, `readNextMezzoByTarga()` o `upsertNextFlottaClonePatch()`;
  - il modulo legge gli stessi documenti reali della madre tramite `readNextIaConfigSnapshot()` su `@impostazioni_app/gemini` e `readNextIaLibrettoArchiveSnapshot()` su `storage/@mezzi_aziendali`;
  - `Analizza con IA` e `Salva nei documenti del mezzo` restano visibili come nella madre, ma bloccano il comportamento con messaggi read-only espliciti senza chiamate Cloud Run, upload Storage, `setItemSync()` o patch clone-only;
  - archivio, filtro per targa e viewer libretto restano presenti e madre-like sopra il dataset reale;
  - verifiche tecniche eseguite: `npx eslint src/next/NextIALibrettoPage.tsx src/next/domain/nextIaLibrettoDomain.ts src/next/domain/nextIaConfigDomain.ts` e `npm run build`, entrambe `OK`.

## Limiti residui

- Il file selezionato viene usato solo per l'anteprima locale della UI, come affordance visiva del modulo; non parte nessun upload o side effect reale/clone-only.
- La chiusura vale solo per il modulo `IA Libretto` nel loop corrente e non promuove la NEXT a sostituta della madre.

## Prossimo passo

- Il prossimo run deve ripartire da `IA Documenti`.
