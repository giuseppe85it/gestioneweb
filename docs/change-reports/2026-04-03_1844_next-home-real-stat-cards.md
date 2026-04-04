# Change Report - 2026-04-03 1844

## Titolo
Home NEXT collega tre stat card reali con read model NEXT gia esistenti

## Obiettivo
Sostituire nella Home NEXT solo le tre stat card con metrica gia verificata (`Lavori aperti`, `Ordini in attesa`, `Segnalazioni`), lasciando invariata `Mezzi attivi` e senza toccare widget, banner, IA, route, shell o domain.

## File toccati
- `src/next/NextHomePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche applicate
- `NextHomePage.tsx` legge ora in parallelo:
  - `readNextLavoriInAttesaSnapshot()`
  - `readNextProcurementSnapshot()`
  - `readNextCentroControlloSnapshot()`
- `Lavori aperti` usa `counts.totalLavori` e come sottotitolo somma `groups[].counts.alta`;
- `Ordini in attesa` usa `counts.pendingOrders` e come sottotitolo `counts.partialOrders`;
- `Segnalazioni` usa `counters.segnalazioniNuove` e mostra `da gestire` oppure `nessuna`;
- `Mezzi attivi` resta invariata come placeholder, senza introdurre metriche non canoniche.

## Verifica
- `node_modules\.bin\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- risultati su `/next`:
  - `Mezzi attivi` -> `12` / `su 15 totali`
  - `Lavori aperti` -> `4` / `1 urgente`
  - `Ordini in attesa` -> `3` / `nessuno parziale`
  - `Segnalazioni` -> `8` / `da gestire`
  - banner alert ancora attivo
  - modal IA ancora apribile da `Apri IA`

## Limiti
- widget invariati e ancora placeholder;
- nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, `next-home.css`, route o file madre;
- la card `Mezzi attivi` resta placeholder finche non esistera una metrica canonica verificata.
