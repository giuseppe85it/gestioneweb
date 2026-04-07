# Change Report - 2026-04-07 09:41

## Task
Correzione del rendering del pulsante di chiusura nel modale `Controllo originale` del modulo `Lavori` NEXT.

## Perimetro
- `src/next/NextDettaglioLavoroPage.tsx`
- documentazione di stato/tracciabilita del clone

## Causa reale
- Nel JSX del solo modale `Controllo originale` era hardcodata una sequenza corrotta (`Ã—` / `Ãƒâ€”`) al posto della chiusura corretta.
- Il problema non era nel CSS, nel routing o nel match `lavoro -> controllo`.

## Modifica applicata
- Sostituito il contenuto del bottone `nl-modal__close` del modale controllo con `&times;`.
- Aggiunto `aria-label="Chiudi modale controllo originale"` allo stesso bottone.
- Nessuna modifica a logica dati, resolver o altri modali del file.

## Verifiche eseguite
- `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx` -> OK
- `npm run build` -> OK
- Verifica runtime reale su `/next/dettagliolavori/daade4a2-c681-46d0-99d4-1906d151116d?from=lavori-in-attesa`:
  - click `Apri controllo` -> il bottone mostra `×`
  - click sul bottone -> il modale si chiude correttamente

## Esito
- Fix chiuso nel perimetro richiesto.
- Nessun file fuori whitelist toccato.
