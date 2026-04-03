# Continuity Report - 2026-04-02 15:05

## Stato iniziale
- `/next/materiali-da-ordinare` era gia convergente sul modulo procurement unico, ma i tab secondari restavano piu poveri della madre completa:
  - nessun filtro consultivo per fornitore/valuta;
  - nessuna apertura diretta di documenti nelle tabelle secondarie;
  - nessuna apertura diretta della foto materiale nel dettaglio ordine.

## Stato finale
- Il modulo unico mantiene la stessa architettura top-level ma estende la consultazione secondaria:
  - filtri fornitore/valuta in `Prezzi & Preventivi`;
  - `Apri documento` su preventivi e listino quando esistono allegati;
  - `Apri foto` nel drill-down ordine read-only.

## File runtime coinvolti
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`

## Debito residuo
- `Materiali da ordinare` resta `PARZIALE`:
  - mancano ancora i workflow live madre di `Acquisti.tsx`, `DettaglioOrdine.tsx`, PDF/share reali e writer business.

## Verifica eseguita
- `npm run build` -> `OK`
