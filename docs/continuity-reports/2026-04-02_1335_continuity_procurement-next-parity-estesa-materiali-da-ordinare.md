# Continuity Report - 2026-04-02 13:35

## Stato iniziale
- Procurement NEXT convergente gia attivo su `/next/materiali-da-ordinare`
- Parity grafica migliorata ma comportamento ancora distante dalla madre completa
- Delta principali aperti:
  - preview fornitore selezionato assente;
  - suggerimenti listino assenti;
  - prezzi/totali riga non allineati al ramo `Ordine materiali` della madre;
  - `Prezzi & Preventivi` troncato a 12 righe.

## Stato finale
- `/next/materiali-da-ordinare` replica piu fedelmente il ramo `Ordine materiali` della madre su:
  - suggerimenti listino per fornitore;
  - preview fornitore;
  - prezzo/totale riga;
  - note ordine e note riga;
  - warning prezzi mancanti / UDM da verificare;
  - risultati completi di preventivi/listino senza troncatura.

## File da considerare nel prossimo step
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/pages/Acquisti.tsx` come fonte di verita read-only
- `src/pages/DettaglioOrdine.tsx` come fonte di verita read-only

## Debito residuo reale
- Portare nel modulo unico anche il comportamento vivo madre di:
  - `Prezzi & Preventivi`
  - `Listino Prezzi`
  - `Dettaglio ordine`
  - PDF/preview/share
- Verificare se le route procurement secondarie possono ridursi a sola compatibilita una volta raggiunta parity funzionale completa.

## Verifica eseguita
- `npm run build` -> `OK`
