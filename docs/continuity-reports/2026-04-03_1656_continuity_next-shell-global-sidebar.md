# Continuity Report - 2026-04-03 16:56 - Next shell global sidebar

## Stato consegna
- Patch shell globale completata nel solo perimetro `src/next/*`.

## File runtime
- `src/next/NextShell.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/next-shell.css`
- `src/next/next-home.css`
- `src/next/nextData.ts`

## Boundary confermati
- nessuna modifica a `src/App.tsx`;
- nessuna modifica a subtree `/next/autisti/*` o `NextAutistiCloneLayout`;
- nessuna modifica a madre, domain/read model, writer, storage o Firebase;
- nessuna route nuova o alterata.

## Runtime atteso
- tutte le route figlie di `NextShell` mostrano sidebar globale con header, footer, sezioni collassabili e voci attive/disabled;
- `NextHomePage` mostra solo la dashboard destra;
- `/next/autisti` resta esperienza separata, fuori shell.

## Verifiche richieste per continuita
- `node_modules\\.bin\\eslint.cmd src/next/NextShell.tsx src/next/NextHomePage.tsx src/next/nextData.ts`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4174`
- controllo runtime su `/next`, `/next/mezzi`, `/next/manutenzioni`, `/next/materiali-da-ordinare`, `/next/ia/interna`, `/next/autisti-inbox`, `/next/autisti-admin`
- controllo toggle shell aperto/chiuso e conferma che `/next/autisti` non mostri la sidebar globale
