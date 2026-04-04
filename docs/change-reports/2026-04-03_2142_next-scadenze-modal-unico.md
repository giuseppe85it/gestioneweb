# Change Report - 2026-04-03 21:42

## Obiettivo
Implementare nel subtree `/next` un solo modale read-only `Scadenze` per revisioni / collaudi / pre-collaudi, aperto sia dalla sidebar sia dal banner alert della nuova Home tramite query param, senza nuove route e senza writer reali.

## File Toccati
- `src/next/components/NextScadenzeModal.tsx`
- `src/next/NextShell.tsx`
- `src/next/nextData.ts`
- `src/next/NextHomePage.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche Applicate
- Creato `NextScadenzeModal` come modale unico, read-only, alimentato da `readNextCentroControlloSnapshot()`.
- `NextShell` ora osserva il query param `scadenze` (`tutte` / `urgenti`), monta lo stesso modale e ne gestisce la chiusura rimuovendo il parametro.
- `nextData.ts` espone la voce sidebar `Scadenze` come trigger query-param invece che come item disabled.
- `NextHomePage.tsx` rende cliccabile il banner alert esistente e apre lo stesso modale con stato iniziale `urgenti`.
- `next-shell.css` aggiunge gli stili scoped del modale globale e del trigger query-param senza importare CSS legacy.

## Verifiche
- `node_modules\.bin\eslint.cmd src/next/components/NextScadenzeModal.tsx src/next/NextShell.tsx src/next/nextData.ts src/next/NextHomePage.tsx` -> `OK`
- `npm run build` -> `OK`
- Runtime locale:
  - `/next` -> click sul banner alert apre `?scadenze=urgenti`
  - `/next/materiali-da-ordinare` -> click su sidebar `Scadenze` apre `?scadenze=tutte`
  - chiusura modale -> query param rimosso
  - stesso selettore modale `.next-shell__modal--scadenze` usato in entrambi i casi

## Boundary
- Nessuna nuova route.
- Nessun context nuovo.
- Nessuna modifica al domain D10.
- Nessuna scrittura business reale riaperta.
