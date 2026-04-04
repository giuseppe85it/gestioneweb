# Continuity Report

- Data: 2026-04-03
- Ambito: Home NEXT
- Task: riallineare i widget `Motrici e trattori` e `Rimorchi` al flusso madre

## Stato finale
- patch completata
- modifica confinata a `NextHomePage.tsx` e `next-home.css`
- nessun impatto su domain, shell, route o madre

## Decisione implementativa
- mantenuti i dati reali gia letti da `readNextCentroControlloSnapshot()`
- mantenuto il rebucket locale `pianale -> Rimorchi`
- aggiunto solo stato locale clone-safe per il luogo modificato nella Home
- nessun modale: editor inline nella stessa riga/widget

## Verifica operativa
- lint file TS toccato: OK
- build: OK
- runtime `/next`:
  - righe cliccabili verso `/next/autisti-admin`
  - `Modifica` apre editor inline
  - `Salva` / `Annulla` funzionano in locale
  - `pianale` resta nel widget `Rimorchi`
- runtime `/next/autisti-admin`: nessuna regressione
- runtime `/next/materiali-da-ordinare`: nessuna regressione

## Residui
- il luogo salvato dai widget Home resta solo locale alla sessione/pagina e non viene scritto sul dataset business
