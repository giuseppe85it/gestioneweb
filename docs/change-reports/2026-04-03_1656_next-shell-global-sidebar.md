# Change Report - 2026-04-03 16:56 - Next shell global sidebar

## Scope
- `src/next/NextShell.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/next-shell.css`
- `src/next/next-home.css`
- `src/next/nextData.ts`
- documentazione clone obbligatoria

## Obiettivo
- Spostare la sidebar dalla sola Home a `NextShell`, rendendola la shell globale di tutte le route figlie di `/next` senza toccare `/next/autisti/*`.

## Modifiche applicate
- centralizzato in `nextData.ts` il catalogo sidebar globale `NEXT_SHELL_NAV_SECTIONS`;
- introdotti in `NextShell.tsx` layout a due colonne, sidebar persistente, categorie collassabili, stato attivo route e toggle globale;
- rimossa la sidebar da `NextHomePage.tsx`, lasciando solo dashboard destra placeholder;
- separati gli stili tra `next-shell.css` e `next-home.css`, senza perdere i blocchi legacy gia usati dalle altre pagine NEXT.

## Vincoli preservati
- nessuna modifica a `src/App.tsx`, route, madre, subtree `/next/autisti/*`, domain, Firebase, writer o storage;
- nessuna reintroduzione di `storageSync` o letture raw legacy;
- nessuna route nuova.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextShell.tsx src/next/NextHomePage.tsx src/next/nextData.ts`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4174`
- verifica browser locale su `/next`, `/next/mezzi`, `/next/manutenzioni`, `/next/materiali-da-ordinare`, `/next/ia/interna`, `/next/autisti-inbox`, `/next/autisti-admin`, piu controllo toggle e conferma che `/next/autisti` resti fuori shell
