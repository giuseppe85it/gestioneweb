# Continuity Report - 2026-04-03 17:12 - Next shell visual bugs admin centro controllo

## Stato consegna
- Fix CSS shell completato nel solo perimetro consentito.

## File runtime
- `src/next/next-shell.css`

## Boundary confermati
- nessuna modifica a `src/autistiInbox/AutistiAdmin.css`;
- nessuna modifica a `src/pages/CentroControllo.css`;
- nessuna modifica a `src/App.tsx`, route, dati, domain o writer;
- nessuna modifica a `NextShell.tsx`.

## Runtime atteso
- `/next/autisti-admin` mostra sidebar visibile e non coperta;
- `/next/centro-controllo` mostra sidebar sopra la card principale.

## Verifiche richieste per continuita
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4174`
- controllo runtime reale su `/next/autisti-admin` e `/next/centro-controllo`
