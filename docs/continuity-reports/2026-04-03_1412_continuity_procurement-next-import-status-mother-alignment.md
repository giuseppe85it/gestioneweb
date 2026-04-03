# Continuity Report - 2026-04-03 14:12

## Stato iniziale
- Il clone NEXT mostrava un delta logico reale sullo stato import dei preventivi:
  - `MARIBA / XC/STD/2600119` -> `IMPORTATO PARZIALE 4/5`
  - `MARIBA / 534909` -> `IMPORTATO PARZIALE 6/7`
- La causa verificata era la logica semplificata del clone basata su `sourceMatches`, `previewMatches` e `materialsPreview`.

## Stato finale
- Il clone NEXT usa ora un calcolo riga-per-riga allineato alla madre e i due casi reali verificati coincidono con il runtime madre:
  - `XC/STD/2600119` -> `IMPORTATO COMPLETO 5/5`
  - `534909` -> `IMPORTATO COMPLETO 7/7`

## Rischi residui
- Il fix resta confinato al tab `Prezzi & Preventivi`; non modifica writer, import business, upload o workflow pieni del procurement.
- L'intero procurement top-level resta `PARZIALE`; questa patch chiude solo il delta logico del badge stato import preventivi.
