# Continuity Report - 2026-03-29 1825 - Prompt 37 Home e Capo NEXT

## Stato raggiunto
- `Home` e chiusa nel clone come pagina NEXT autonoma.
- `Capo` e chiuso nel clone come blocco NEXT autonomo, con approvazioni e PDF riallineati.
- Le route ufficiali chiuse non montano piu runtime madre come soluzione finale.

## Decisione operativa da portare avanti
- Continuare solo con lo stesso criterio: pagina NEXT vera, nessun mount finale della madre, layer puliti sotto.
- Il prossimo fronte residuo reale e composto da:
  - `Materiali da ordinare`
  - `Acquisti / Preventivi / Listino`
  - `Dossier Mezzo`
  - `Analisi Economica`
  - `IA Libretto / IA Documenti / IA Copertura Libretti`
  - `Cisterna / Cisterna IA / Cisterna Schede Test`
  - `Autisti / Inbox`

## Regola da non rompere
- Gli overlay introdotti (`nextHomeCloneState`, `nextCapoCloneState`) devono restare clone-only e non vanno trasformati in writer business verso la madre.
- `Targa 360 / Mezzo360` e `Autista 360` restano fuori perimetro e non devono essere usati per abbassare la parity dei moduli gia chiusi.

## File guida per il prossimo passo
- `docs/audit/REPORT_FINALE_PROMPT_37_RICOSTRUZIONE_NEXT_COMPLETA.md`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`

## Verifiche gia chiuse
- Lint sui file toccati: OK
- Build completa: OK
