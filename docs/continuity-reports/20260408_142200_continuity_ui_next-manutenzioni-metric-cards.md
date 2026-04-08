# Continuity Report - 2026-04-08 14:22

## Contesto
Fix mirato alla tab `Nuova / Modifica` del modulo NEXT `Manutenzioni`.

## Stato prima
- La riga `Data / KM-Ore / Fornitore` restava percepita come tre input quasi attaccati.
- `Mezzo attivo` risultava ancora troppo vicino a `Campi base`.

## Stato dopo
- I tre campi sono ora contenuti in mini-card separate vere, con bordo, fondo e gap autonomi.
- `Fornitore` resta la card lunga; `Data` e `KM/Ore` restano corte.
- `Mezzo attivo` ha piu aria e una posizione piu alta rispetto al blocco sottostante.

## Confini rispettati
- Nessuna modifica a business, Firestore, domain, PDF, foto, dettaglio o routing.
- Solo `src/next/NextManutenzioniPage.tsx` e `src/next/next-mappa-storico.css` toccati sul runtime.

## Stato modulo
- `Manutenzioni`: `PARZIALE`
