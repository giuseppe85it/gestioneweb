# Change Report - 2026-04-02 15:05

## Scope
- Prompt 30
- Perimetro runtime: `src/next/NextProcurementConvergedSection.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx`

## Modifiche eseguite
- Estesa la vista convergente `Prezzi & Preventivi` con filtri locali:
  - `Fornitore`
  - `Valuta` per `Listino`
- Aggiunta l'azione `Apri documento` su:
  - preventivi con `pdfUrl` o immagini collegate;
  - listino con `pdfUrl` o immagini collegate.
- Esteso il `Dettaglio ordine` read-only con azione `Apri foto` sulla riga materiale quando il clone legge `photoUrl`.

## Boundary dati
- Nessuna lettura raw legacy madre reintrodotta.
- Restano in uso:
  - `readNextProcurementSnapshot()`
  - `buildNextProcurementListView()`
  - `findNextProcurementOrder()`

## Limiti espliciti
- Parity totale NON chiusa.
- Restano aperti rispetto alla madre completa:
  - workflow operativo completo di `Prezzi & Preventivi`;
  - `Listino Prezzi` live;
  - `Dettaglio ordine` con edit/save;
  - PDF/share generati dal clone;
  - writer business reali clone-safe.

## Verifica
- `npm run build` -> `OK`
