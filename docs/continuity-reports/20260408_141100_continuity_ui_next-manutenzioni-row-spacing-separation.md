# Continuity Report - 2026-04-08 14:11

## Contesto
Micro-fix mirato sul modulo NEXT `Manutenzioni`, limitato alla tab `Nuova / Modifica`.

## Stato prima
- La riga `Data / KM-Ore / Fornitore` risultava ancora visivamente troppo tirata.
- `Mezzo attivo` appariva troppo vicino al blocco `Campi base`.

## Stato dopo
- I tre campi usano ora larghezze piu leggibili e un gap reale visibile.
- `Fornitore` riceve la maggior parte dello spazio disponibile.
- `Mezzo attivo` ha piu aria prima del pannello sottostante.

## Confini rispettati
- Nessuna modifica a runtime business.
- Nessuna modifica a domain, Firestore, routing, PDF, foto o hotspot.
- Nessun file fuori whitelist toccato.

## Stato modulo
- `Manutenzioni`: `PARZIALE`
