# Change Report - 2026-04-03 17:12 - Next shell visual bugs admin centro controllo

## Scope
- `src/next/next-shell.css`
- documentazione clone obbligatoria

## Obiettivo
- Correggere in modo chirurgico i due bug visivi della shell globale su `/next/autisti-admin` e `/next/centro-controllo`, senza toccare CSS legacy, route o runtime component.

## Modifiche applicate
- aggiunto `z-index: 30` a `.next-shell__sidebar`;
- aggiunto override scoped `.next-shell .autisti-admin-page` con:
  - `width: 100% !important`
  - `max-width: 100% !important`
  - `left: auto !important`
  - `transform: none !important`

## Vincoli preservati
- nessuna modifica a `src/autistiInbox/AutistiAdmin.css`;
- nessuna modifica a `src/pages/CentroControllo.css`;
- nessuna modifica a `src/App.tsx`, route, madre, dati o domain.

## Verifiche
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4174`
- verifica browser locale su `/next/autisti-admin` e `/next/centro-controllo`
