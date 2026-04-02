# Change Report - 2026-04-02 13:35

## Scope
- Prompt 29
- Perimetro runtime: `src/next/NextMaterialiDaOrdinarePage.tsx`, `src/next/NextProcurementConvergedSection.tsx`

## Modifiche eseguite
- Estesa la bozza locale di `/next/materiali-da-ordinare` con:
  - `noteByMaterialeId`
  - `ordineNote`
  - `newMaterialeNota`
  - `conversionFactorInput`
  - `draftSavedAt`
- Portati nel ramo `Fabbisogni` comportamenti madre utili di `Ordine materiali`:
  - suggerimenti listino filtrati per fornitore attivo;
  - selezione listino con prefill di descrizione, UDM, prezzo, valuta e riferimento preventivo;
  - preview sintetica del fornitore selezionato;
  - calcolo totale riga con warning UDM da verificare;
  - footer laterale con totali per valuta, prezzi mancanti, note ordine e `Bozza salvata`.
- Sostituite le azioni riga placeholder con azioni clone-safe piu vicine alla madre:
  - `Foto`
  - `Documento`
  - `Nota`
  - `+ Listino`
  - `Rimuovi foto`
  - `Elimina`
- Rimossa nella vista convergente `Prezzi & Preventivi` la troncatura artificiale a 12 righe su preventivi e listino.

## Limiti espliciti
- Parity totale NON chiusa.
- Restano aperti rispetto alla madre completa:
  - `Prezzi & Preventivi` operativo completo;
  - `Listino Prezzi` operativo completo;
  - `Dettaglio ordine` live/edit;
  - PDF/share reali;
  - writer business reali clone-safe.

## Verifica
- `npm run build` -> `OK`
