# Change Report

- Data: 2026-04-03
- Titolo: Home NEXT aggiunge espansione e categoria ai widget flotta
- Obiettivo: migliorare solo i widget `Motrici e trattori` e `Rimorchi` della Home NEXT, mostrando la categoria per riga e consentendo di vedere tutti gli elementi reali con toggle separato.

## File toccati
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifica applicata
- aggiunti toggle separati `Mostra tutti / Mostra meno` per i due widget flotta;
- i widget mostrano preview compatta da chiusi e tutti gli elementi reali da aperti;
- ogni riga mostra la categoria reale del record usando il campo `categoria`;
- mantenuti il rebucket `pianale -> Rimorchi`, il click verso `/next/autisti-admin` e l'editor inline clone-safe del luogo.

## Boundary preservato
- nessuna modifica a `src/next/domain/*`
- nessuna modifica a `src/next/NextShell.tsx` o `src/next/next-shell.css`
- nessuna modifica a route, writer, storage o file madre
- nessuna modifica a `Magazzino`, stat card, banner alert o pannello IA

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale:
  - `/next`:
    - `Mostra tutti` / `Mostra meno` funzionano per entrambi i widget
    - categoria visibile per ogni riga
    - `pianale` resta solo in `Rimorchi`
    - editor inline e click verso `/next/autisti-admin` ancora funzionanti
  - `/next/autisti-admin` -> nessuna regressione visibile
  - `/next/materiali-da-ordinare` -> nessuna regressione visibile
