# Continuity Report

- DATA: 2026-04-09
- TASK: audit strutturale `Magazzino` legacy vs NEXT
- STATO TASK: completato
- TIPO: audit-only

## Contesto
L'audit e stato richiesto per capire la logica reale del dominio `Magazzino` oltre la sola UI e verificare se il nuovo modulo `src/next/NextMagazzinoPage.tsx` copre davvero i comportamenti della madre e i collegamenti cross-modulo.

## Cosa e stato fatto
- Ricostruita la logica reale della madre per:
  - `Inventario`
  - `MaterialiConsegnati`
- Mappati dataset, writer, lettori e flussi cross-modulo su:
  - `@inventario`
  - `@materialiconsegnati`
  - `@documenti_magazzino`
- Confrontata la copertura reale del nuovo `NextMagazzinoPage.tsx` senza usare la UI come prova di parity.

## Verdetto sintetico
- `Inventario logica madre` -> `COPERTO`
- `Materiali consegnati logica madre` -> `COPERTO`
- `Cross-modulo magazzino` -> `PARZIALE`
- `Nuovo Magazzino NEXT` -> `PARZIALE`
- `Compatibilita con Dossier / IA / costi / documenti` -> `PARZIALE`

## Punti chiave emersi
- La madre usa un dominio magazzino multi-writer e non transazionale.
- `NextMagazzinoPage.tsx` copre bene il core storage di `@inventario` e `@materialiconsegnati`.
- Il nuovo modulo non copre `@documenti_magazzino`, costi materiali, integrazione applicativa con `IADocumenti`, `Acquisti` e `DettaglioOrdine`.
- Dossier e Mezzo360 restano compatibili solo tramite dataset condivisi e matching fragili sul destinatario.

## File guida per riprendere il contesto
- `docs/audit/AUDIT_MAGAZZINO_NEXT_VS_MADRE_LOGICA_DOMINIO_2026-04-09.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Build / test
- Non eseguiti
- Motivo: task audit-only
