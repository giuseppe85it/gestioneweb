# Change Report

- DATA: 2026-04-09
- TASK: audit strutturale profondo `Inventario` + `MaterialiConsegnati` legacy vs `NextMagazzinoPage`
- TIPO: solo documentazione / audit

## File toccati
- `docs/audit/AUDIT_MAGAZZINO_NEXT_VS_MADRE_LOGICA_DOMINIO_2026-04-09.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- `docs/fonti-pronte/STATO_ATTUALE_PROGETTO.md`
- `docs/fonti-pronte/STATO_MIGRAZIONE_NEXT.md`
- `docs/fonti-pronte/REGISTRO_MODIFICHE_CLONE.md`
- `docs/fonti-pronte/CONTEXT_CLAUDE.md`
- `docs/change-reports/20260409_221500_audit_magazzino_next_vs_madre_logica_dominio.md`
- `docs/continuity-reports/20260409_221500_continuity_audit_magazzino_next_vs_madre_logica_dominio.md`

## Obiettivo
Formalizzare un audit strutturale sul dominio `Magazzino`, distinguendo logica reale della madre, dataset realmente coinvolti, collegamenti cross-modulo e copertura effettiva del nuovo modulo `NextMagazzinoPage`.

## Risultato
- Nessun file runtime toccato.
- Audit dedicato creato con mappa verificata di:
  - dataset `@inventario`, `@materialiconsegnati`, `@documenti_magazzino`
  - writer reali legacy e NEXT
  - lettori reali legacy e NEXT
  - collegamenti verso `Dossier`, `Mezzo360`, `GestioneOperativa`, `Acquisti`, `DettaglioOrdine`, `IADocumenti`, `Manutenzioni`
- Stato documentale aggiornato:
  - `Magazzino NEXT` resta `PARZIALE`
  - dominio legacy `Magazzino` confermato come multi-writer e non transazionale
  - `@documenti_magazzino` confermato come archivio documentale/costi, non ledger canonico di stock

## Rischi residui evidenziati
- drift cross-modulo alto su `@inventario` e `@materialiconsegnati`
- contratto writer `@materialiconsegnati` non uniforme
- costi materiali ancora derivati dai documenti
- possibile rischio di doppio decremento in `Acquisti` / `DettaglioOrdine` da verificare separatamente

## Verifiche eseguite
- Nessun build
- Nessun test
- Motivo: task audit-only
