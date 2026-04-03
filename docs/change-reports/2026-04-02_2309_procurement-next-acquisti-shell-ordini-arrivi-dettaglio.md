# Change Report - 2026-04-02 23:09

## Obiettivo
Ricostruire `Ordini`, `Arrivi` e `Dettaglio ordine` direttamente nella shell visiva di `src/pages/Acquisti.tsx` su `/next/materiali-da-ordinare`, senza lasciare `NextProcurementConvergedSection` come superficie principale di queste viste e senza sporcare il layer dati NEXT.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche runtime
- `NextMaterialiDaOrdinarePage.tsx`
  - il branching top-level manda ora `Ordini`, `Arrivi` e `Dettaglio ordine` su `NextProcurementReadOnlyPanel` in modalita `embedded`, dentro la shell `acq-page` / `acq-shell` / `acq-content` gia riallineata alla madre;
  - `NextProcurementConvergedSection` resta consumato solo da `Prezzi & Preventivi` e `Listino Prezzi`;
  - aggiunti placeholder di loading, errore e snapshot mancante coerenti con la grammatica `Acquisti`.
- `NextProcurementReadOnlyPanel.tsx`
  - le liste ordini/arrivi usano ora titoli madre senza sottotitoli clone-specifici;
  - il bottone riga e stato riallineato da `Apri dettaglio` a `Apri`;
  - il messaggio di dettaglio mancante e stato reso neutro (`Ordine non trovato.`);
  - rimosso il reset stato via `useEffect`; il pannello dettaglio viene ora resettato tramite `key` sul remount, evitando l'errore lint `react-hooks/set-state-in-effect`.

## Layer dati preservato
- Non toccati:
  - `src/next/domain/nextProcurementDomain.ts`
  - `src/next/NextProcurementConvergedSection.tsx`
- Confermate come uniche sorgenti dati:
  - `readNextProcurementSnapshot()`
  - `buildNextProcurementListView()`
  - `findNextProcurementOrder()`
- Non reintrodotti:
  - `storageSync`
  - letture raw legacy di `@ordini`, `@preventivi`, `@listino_prezzi`
  - mount runtime di `src/pages/*`

## Limiti residui
- `PATCH PARZIALE`: il procurement top-level resta `PARZIALE`, non `CHIUSO`.
- Restano aperti:
  - le tabelle `Ordini` / `Arrivi` non replicano ancora 1:1 le azioni secondarie della madre (`Modifica`, `Elimina`) dentro la lista;
  - `Dettaglio ordine` resta clone-safe locale e non riapre i writer business reali della madre;
  - `Prezzi & Preventivi` e `Listino Prezzi` restano consultivi clone-safe.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementReadOnlyPanel.tsx` -> `OK`
- `npm run build` -> `OK`
- `npm run lint` -> `KO` con errori diffusi preesistenti fuori scope (`api/*`, `src/autisti*`, `src/pages/*`, `src/utils/*`); nessun errore residuo sui due file toccati dal prompt.
