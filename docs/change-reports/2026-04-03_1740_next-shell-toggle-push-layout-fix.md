# Change Report - 2026-04-03 1740

## Titolo
Fix shell globale NEXT su toggle sidebar visibile e push layout reale

## Obiettivo
Correggere due bug visivi reali della shell globale:
- toggle hamburger non percepibile / non riapribile correttamente;
- sidebar ancora percepita come overlay sul contenuto in alcune route shell.

## File toccati
- `src/next/NextShell.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche applicate
- spostato il toggle di chiusura dentro l'header/sidebar in stato aperto;
- aggiunto bottone flottante esterno di riapertura in stato chiuso;
- mantenuto il layout shell a due colonne reali con contenuto che occupa lo spazio residuo;
- rimosso il gap shell dedicato solo al vecchio hamburger in topbar.

## Verifica
- `npm run build` -> OK
- verifica runtime locale su:
  - `/next/autisti-admin`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- esito runtime:
  - open state -> toggle visibile nell'header sidebar, contenuto spinto a destra, nessun overlap;
  - closed state -> bottone flottante visibile, sidebar a `0px`, contenuto a tutta larghezza.

## Limiti
- patch stretta solo sulla shell globale NEXT;
- nessuna modifica a Home, route, file madre, domain, dati o writer.
