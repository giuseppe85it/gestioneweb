# Change Report

- Data: 2026-04-03
- Titolo: Home NEXT riclassifica `pianale` nel widget `Rimorchi`
- Obiettivo: spostare solo nella Home NEXT la categoria `pianale` dal widget `Motrici e trattori` al widget `Rimorchi`, senza toccare domain, shell, route o madre.

## File toccati
- `src/next/NextHomePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifica applicata
- aggiunto rebucket locale dei dati widget Home usando `D10AssetLocationItem.categoria`;
- gli item con `categoria = pianale` vengono rimossi dal bucket visivo `Motrici e trattori` e aggiunti a `Rimorchi`;
- nel bucket `Rimorchi` gli item `pianale` vengono ordinati davanti agli altri per restare visibili nel limite a 3 righe del widget.

## Boundary preservato
- nessuna modifica a `src/next/domain/*`
- nessuna modifica a `src/next/NextShell.tsx`
- nessuna modifica a route, mother, writer, storage o shell CSS
- nessuna modifica a stat card, banner alert, pannello IA o widget `Magazzino`

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale su `/next` con read model reale:
  - `pianale` presente nel domain come `TI285997`, `TI88499`, `TI89021`
  - `TI285997` non compare in `Motrici e trattori`
  - `TI285997` compare in `Rimorchi`
- runtime locale su `/next/autisti-admin` -> nessuna regressione visibile
