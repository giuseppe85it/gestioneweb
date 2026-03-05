# UI Redesign Pack - GestioneManutenzione

Questa cartella contiene la base tecnica per rifare la UI senza toccare la logica dati.

## File
- `docs/ui-redesign/ui_inventory.md`
  Inventario completo pagine/route con scopo, componenti, azioni, dipendenze dati e pain point.
- `docs/ui-redesign/user_journeys.mmd`
  Journey principali (end-to-end) tra UI e dati.
- `docs/ui-redesign/sitemap_current.md`
  Mappa route attuale (as-is) per macro-modulo.
- `docs/ui-redesign/sitemap_proposed.md`
  Proposta struttura menu/aree piu lineare, con separazione Admin vs Autisti.
- `docs/ui-redesign/ui_issues_and_opportunities.md`
  Problemi UX strutturali e opportunita di semplificazione.

## Come usare questi documenti nel redesign
1. Leggere `sitemap_current.md` per capire il perimetro reale.
2. Passare a `ui_inventory.md` per ogni pagina target del redesign.
3. Usare `user_journeys.mmd` per validare i task critici (non solo la grafica).
4. Definire la nuova IA in base a `sitemap_proposed.md`.
5. Validare che le proposte risolvano i punti in `ui_issues_and_opportunities.md`.
6. Cross-check finale con `docs/diagrams/flows_data_contract.md` per evitare regressioni dati.

## Regole operative per la fase di redesign
- Non cambiare chiavi dati (`@...`) finche la nuova UI non e stabilizzata.
- Ridurre duplicazioni route prima di introdurre nuove pagine.
- Mantenere i flussi principali in massimo 3-4 step visivi.
- Esporre chiaramente gli stati record (`nuovo`, `letto`, `rettificato`, `importato`).

## Checklist di handoff (design -> sviluppo)
- Journey coperti: inserimento lavoro, esecuzione lavoro, ordini, consegne, eventi autisti, IA documenti, export PDF.
- Ruoli separati: shell Admin distinta da shell Autisti.
- Azioni critiche visibili: import, approvazione, export, rettifica.
- Tutti i punti `DA VERIFICARE` tracciati e confermati prima della patch UI.
