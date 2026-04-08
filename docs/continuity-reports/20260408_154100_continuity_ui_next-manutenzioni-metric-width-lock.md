# Continuity Report - 2026-04-08 15:41

## Contesto
Micro-fix mirato alla riga metriche della tab `Nuova / Modifica` di `Manutenzioni` NEXT.

## Stato prima
- Il gruppo `Data / KM-Ore / Fornitore` era ancora troppo elastico, soprattutto sul campo `Fornitore`.

## Stato dopo
- La riga usa larghezze fisse `190px / 140px / 260px`.
- Il gruppo resta compatto, allineato a sinistra e con gap uniforme di `16px`.
- `Fornitore` non si allunga piu per riempire lo spazio residuo.

## Confini rispettati
- Nessuna modifica a JSX, business, Firestore, domain, PDF, foto, dettaglio o routing.
- Solo `src/next/next-mappa-storico.css` toccato sul runtime.

## Stato modulo
- `Manutenzioni`: `PARZIALE`
