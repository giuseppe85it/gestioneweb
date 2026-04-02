# Change Report - 2026-04-02 12:15

## Obiettivo
Ridurre i delta comportamentali reali del procurement convergente NEXT su `/next/materiali-da-ordinare` senza riaprire moduli top-level secondari e senza introdurre scritture business.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche applicate
- Prefill `iaHandoff` applicato davvero a fornitore, descrizione, ricerca e tab procurement coerente.
- Bozza locale procurement salvata e ripristinata via `sessionStorage`.
- Righello `Fabbisogni` corretto: il materiale temporaneo conserva il fornitore selezionato.
- Ricerca top-level estesa alle viste convergenti `Ordini`, `Arrivi`, `Preventivi` e `Listino`.
- `CONFERMA ORDINE` resta read-only ma pulisce la bozza locale come nel post-salvataggio della madre.

## Verifica
- `npm run build` -> `OK`

## Limiti
- Writer business, upload preventivi, PDF reali e azioni riga avanzate della madre restano fuori perimetro.
