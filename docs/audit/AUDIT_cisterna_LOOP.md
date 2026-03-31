# AUDIT LOOP - `Cisterna`

- Timestamp audit: `2026-03-31 12:00 Europe/Rome`
- Modulo: `Cisterna`
- Route verificata:
  - `/next/cisterna`
- Fonti runtime verificate:
  - `src/App.tsx`
  - `src/next/NextCisternaPage.tsx`
  - `src/next/domain/nextCisternaDomain.ts`
  - `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`

## Esito audit finale

- Verdetto: `PASS`
- Verifiche confermate sul codice reale:
  - la route ufficiale monta `src/next/NextCisternaPage.tsx`, non `NextMotherPage` o `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `jsPDF`, `jspdf-autotable`, `pdf.save(...)` o `upsertNextCisternaCloneParametro()`;
  - la pagina replica la superficie madre su header, month picker, CTA visibili, blocco `DOPPIO BOLLETTINO`, archivio documenti, schede carburante, report mensile e tabella targhe/dettaglio;
  - il reader ufficiale usa `readNextCisternaSnapshot(month, { includeCloneOverlays: false })`, quindi legge gli stessi dataset reali della madre su `cisterna_documenti`, `cisterna_schede`, `cisterna_parametri_mensili` e `storage/@rifornimenti_autisti_tmp` senza documenti, schede o parametri clone-only;
  - `Salva`, `Conferma scelta`, `Apri IA Cisterna`, `Scheda carburante`, `Apri/Modifica` ed `Esporta PDF` restano visibili come nella madre ma bloccano il comportamento con messaggi read-only espliciti, senza scritture Firestore, patch locali o export locale;
  - verifiche tecniche eseguite: `npx eslint src/next/NextCisternaPage.tsx src/next/domain/nextCisternaDomain.ts` e `npm run build`, entrambe `OK`.

## Limiti residui

- La chiusura vale solo per il modulo `Cisterna` nel loop corrente e non promuove la NEXT a sostituta della madre.
- `Cisterna IA` e `Cisterna Schede Test` restano fuori da questa chiusura e vanno valutati come moduli successivi del tracker.

## Prossimo passo

- Il prossimo run deve ripartire da `Cisterna IA`.
