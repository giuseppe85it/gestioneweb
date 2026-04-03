# Change Report - 2026-04-03 14:48 - Next Home UI placeholder layout

## Scope
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`
- documentazione clone obbligatoria

## Obiettivo
- Implementare la nuova Home NEXT secondo il layout approvato, con soli placeholder statici e senza collegare dati reali o logiche business.

## Modifiche applicate
- sostituita la vecchia Home `/next` che montava la parity del centro controllo con una dashboard dedicata;
- introdotta sidebar scura con categorie collassabili e voci NEXT o disabled;
- introdotti topbar, banner alert, pannello `IA interna`, stat card e widget statici coerenti con lo screenshot;
- aggiunto CSS locale `next-home.css` per il layout desktop-first e responsive minimo.

## Vincoli preservati
- nessuna modifica a madre, `src/pages/*`, routing, writer, storage, PDF engine o domain NEXT;
- nessun dato reale, snapshot o Firebase;
- nessuna route nuova.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4173`
- screenshot runtime di `http://127.0.0.1:4173/next`
