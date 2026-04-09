# Continuity Report - 2026-04-08 22:15

## Stato iniziale
- Il pannello destro del `Dettaglio` mostrava due volte lo stesso record mezzo: una nel box riepilogo e una come primo elemento della lista.
- `Calibra` non spostava davvero nulla: permetteva solo preview/selezione di marker gia esistenti.

## Stato finale
- Il box `Ultimo intervento mezzo` resta invariato, ma la lista `Ultime manutenzioni mezzo` non ripete piu lo stesso record.
- `Calibra` permette ora:
  - selezione target;
  - click per posizionare;
  - drag per riposizionare marker esistenti;
  - salvataggio clone-side;
  - rilettura successiva della posizione salvata.

## Boundary rispettati
- Nessuna patch alla madre legacy.
- Nessuna modifica a Firestore/rules/backend.
- Nessuna modifica a PDF o moduli non collegati.

## Verifica consigliata
1. Aprire un mezzo con storico e confermare che il primo record non sia duplicato tra box riepilogo e lista.
2. Entrare in `Calibra` in `Sinistra` o `Destra`.
3. Selezionare un target dalla palette e cliccare sul disegno per salvarlo.
4. Trascinare un marker esistente, rilasciare e verificare che la posizione venga mantenuta.
