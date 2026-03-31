# AUDIT LOOP - `Lavori`

- Timestamp audit: `2026-03-31 10:14 Europe/Rome`
- Modulo: `Lavori`
- Route verificate:
  - `/next/lavori-da-eseguire`
  - `/next/lavori-in-attesa`
  - `/next/lavori-eseguiti`
  - `/next/dettagliolavori/:lavoroId`
- Fonti runtime verificate:
  - `src/next/NextLavoriDaEseguirePage.tsx`
  - `src/next/NextLavoriInAttesaPage.tsx`
  - `src/next/NextLavoriEseguitiPage.tsx`
  - `src/next/NextDettaglioLavoroPage.tsx`
  - `src/next/domain/nextLavoriDomain.ts`
  - `src/pages/LavoriDaEseguire.tsx`
  - `src/pages/LavoriInAttesa.tsx`
  - `src/pages/LavoriEseguiti.tsx`
  - `src/pages/DettaglioLavoro.tsx`

## Verifiche

- Route ufficiali NEXT autonome:
  - `PASS`
  - Le route ufficiali montano runtime `src/next/*` e non `NextMotherPage` o `src/pages/**` come runtime finale.

- UI pratica madre-like:
  - `PASS`
  - `NextLavoriDaEseguirePage` replica header, form, suggerimenti, urgenze, lista temporanea e CTA visibili della madre.
  - `NextLavoriInAttesaPage` e `NextLavoriEseguitiPage` replicano ricerca targa, accordion per mezzo/magazzino, CTA `Anteprima PDF` e ritorno.
  - `NextDettaglioLavoroPage` replica cards, pulsanti `MODIFICA` / `ELIMINA` / `ESEGUI` e modali visibili della madre.

- Dati reali della madre:
  - `PASS`
  - Il runtime ufficiale usa `readNextLavoriInAttesaSnapshot({ includeCloneOverlays: false })`, `readNextLavoriEseguitiSnapshot({ includeCloneOverlays: false })` e `readNextDettaglioLavoroSnapshot(..., { includeCloneOverlays: false })`.
  - Il dominio legge quindi `@lavori` senza merge impliciti di record/override clone-only nel modulo ufficiale.

- Scritture reali e clone-only:
  - `PASS`
  - `AGGIUNGI`, `SALVA GRUPPO LAVORI`, `ELIMINA`, `Salva` modale esecuzione e `Salva` modale modifica restano visibili ma bloccate con messaggi read-only espliciti.
  - Il runtime ufficiale non usa piu `appendNextLavoriCloneRecords`, `upsertNextLavoriCloneOverride` o `markNextLavoriCloneDeleted`.

- PDF e dettaglio:
  - `PASS`
  - `Lavori in attesa` e `Lavori eseguiti` ripristinano l'anteprima PDF della madre sopra utilita condivise gia esistenti.
  - Il dettaglio lavoro resta consultabile e madre-like, ma senza side effect.

- Lint e build:
  - `PASS`
  - `npx eslint src/next/NextLavoriDaEseguirePage.tsx src/next/NextLavoriInAttesaPage.tsx src/next/NextLavoriEseguitiPage.tsx src/next/NextDettaglioLavoroPage.tsx src/next/domain/nextLavoriDomain.ts`
  - `npm run build`

## Esito audit

- Verdetto: `PASS`
- Stato modulo nel tracker: `CLOSED`
- Gap aperti nel perimetro `Lavori`: nessuno
- Prossimo modulo del loop: `Capo Mezzi`
