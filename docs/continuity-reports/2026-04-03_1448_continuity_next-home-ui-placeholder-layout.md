# Continuity Report - 2026-04-03 14:48 - Next Home UI placeholder layout

## Stato consegna
- Patch UI completata nel solo perimetro Home NEXT.

## File runtime
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`

## Boundary confermati
- nessuna modifica a `NextShell.tsx`;
- nessuna modifica a `src/App.tsx`;
- nessuna modifica a domain/read model/Firebase/storageSync;
- nessuna modifica a route o writer business;
- nessun mount runtime di file madre.

## Runtime atteso
- `/next` mostra sidebar collassabile, dashboard placeholder, banner alert, pannello `IA interna`, stat card e widget;
- le voci senza route NEXT coerente restano disabled.

## Verifiche richieste per continuita
- `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4173`
- controllo visivo finale della route `/next`
