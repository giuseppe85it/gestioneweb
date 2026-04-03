# Change Report - 2026-04-02 22:47

## Obiettivo
Riallineare `/next/materiali-da-ordinare` sulla UI esterna della madre `src/pages/Acquisti.tsx`, rendendo la shell principale, la gerarchia visiva e i rami `Prezzi & Preventivi` / `Listino Prezzi` il piu possibile coerenti con `Gestione Acquisti` senza sporcare il layer dati NEXT.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche runtime
- `NextMaterialiDaOrdinarePage.tsx`
  - sostituita la shell esterna `mdo-*` con struttura madre `acq-page` / `acq-shell` / `acq-header` / `acq-tabs` / `acq-content`;
  - copiati header e naming madre: `Gestione Acquisti`, titolo `Acquisti`, subtitle del modulo unico;
  - rimosse dalla testata top-level le aggiunte che non esistono nella madre, come badge tab e riepilogo read-only separato;
  - `Ordine materiali` resta nel modulo unico ma dentro `acq-tab-panel--fabbisogni`, coerente con `Acquisti.tsx`.
- `NextProcurementConvergedSection.tsx`
  - `Ordini` / `Arrivi` restano dentro il pannello convergente gia esistente, senza guscio esterno extra;
  - `Prezzi & Preventivi` usa shell madre-like `acq-prev-shell`, topbar `Registro Preventivi`, bottone `Carica preventivo`, filtri `Fornitore` / `Cerca` e tabella `acq-prev-table`;
  - `Listino Prezzi` usa shell `acq-listino-shell`, filtri `Fornitore` / `Valuta` / `Cerca` e tabella `acq-prev-table`;
  - rimossi footer e pulsanti di navigazione interni che non appartengono alla shell top-level di `Acquisti`.

## Layer dati preservato
- Non toccati:
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/next/domain/nextProcurementDomain.ts`
- Confermate come uniche sorgenti dati:
  - `readNextFornitoriSnapshot()`
  - `readNextProcurementSnapshot()`
- Non reintrodotti:
  - `storageSync`
  - letture raw legacy di `@ordini`, `@preventivi`, `@listino_prezzi`
  - mount runtime di `src/pages/*`

## Limiti residui
- `PATCH PARZIALE`: il modulo procurement top-level resta `PARZIALE`, non `CHIUSO`.
- Restano aperti:
  - `Ordini` / `Arrivi` ancora dipendenti dal pannello convergente read-only;
  - `Prezzi & Preventivi` e `Listino Prezzi` solo consultivi, senza writer business o upload reali;
  - `CONFERMA ORDINE` e `Carica preventivo` ancora clone-safe e non business-real.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementConvergedSection.tsx` -> `OK`
- `npm run build` -> `OK`
