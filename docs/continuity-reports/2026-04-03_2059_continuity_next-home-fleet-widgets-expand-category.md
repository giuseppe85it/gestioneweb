# Continuity Report

- Data: 2026-04-03
- Ambito: Home NEXT
- Task: aggiungere espansione e categoria ai widget `Motrici e trattori` e `Rimorchi`

## Stato finale
- patch completata
- modifica confinata a `NextHomePage.tsx` e `next-home.css`
- nessun impatto su domain, shell, route o madre

## Decisione implementativa
- i dati reali flotta restano quelli letti da `readNextCentroControlloSnapshot()`
- il toggle di espansione e locale e separato per i due widget
- la categoria mostrata e il valore reale gia esposto dal read model, con fallback sobrio se manca
- il rebucket `pianale -> Rimorchi` resta invariato

## Verifica operativa
- lint file TS toccato: OK
- build: OK
- runtime `/next`:
  - categorie visibili per ogni riga
  - `Mostra tutti` espande correttamente i due widget
  - `Mostra meno` richiude correttamente i due widget
  - `pianale` resta visibile solo in `Rimorchi`
  - editor inline e click verso `/next/autisti-admin` restano funzionanti
- runtime `/next/autisti-admin`: nessuna regressione
- runtime `/next/materiali-da-ordinare`: nessuna regressione

## Residui
- nessuno nel perimetro del prompt
