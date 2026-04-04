# Change Report

- Data: 2026-04-03
- Titolo: Home NEXT riallinea i widget flotta al flusso madre
- Obiettivo: adeguare solo i widget `Motrici e trattori` e `Rimorchi` della Home NEXT al comportamento reale della madre, mantenendo il rebucket prodotto `pianale -> Rimorchi`.

## File toccati
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifica applicata
- rimosse le CTA header non coerenti dai due widget flotta;
- le righe dei due widget sono ora cliccabili verso `/next/autisti-admin`;
- ogni riga espone `Modifica`;
- `Modifica` apre un editor inline con input luogo, `Annulla` e `Salva`;
- `Salva` aggiorna solo stato locale della Home, senza scrivere sul backend o sul domain;
- mantenuto il rebucket locale che lascia `pianale` nel widget `Rimorchi`.

## Boundary preservato
- nessuna modifica a `src/next/domain/*`
- nessuna modifica a `src/next/NextShell.tsx` o `src/next/next-shell.css`
- nessuna modifica a route, writer, storage o file madre
- nessun modale introdotto
- nessuna modifica a stat card, banner alert, pannello IA o widget `Magazzino`

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale:
  - `/next`:
    - `Motrici e trattori` senza header CTA e con righe cliccabili
    - `Rimorchi` senza CTA disabled e con righe cliccabili
    - `Modifica` apre editor inline
    - `Salva` aggiorna il luogo in locale
    - `Annulla` chiude l'editor
    - `TI285997` resta nel widget `Rimorchi` e non in `Motrici e trattori`
  - `/next/autisti-admin` -> nessuna regressione visibile
  - `/next/materiali-da-ordinare` -> nessuna regressione visibile
