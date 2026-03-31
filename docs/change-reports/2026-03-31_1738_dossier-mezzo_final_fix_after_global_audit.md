# Change Report - Dossier Mezzo final fix after global audit

- Timestamp: `2026-03-31 17:38 Europe/Rome`
- Tipo intervento: `execution` con audit separato sul modulo
- Prompt: `PROMPT 25`

## Obiettivo
- Correggere il falso `CLOSED` di `Dossier Mezzo` emerso dall'audit finale globale V3.

## File aggiornati
- `src/next/domain/nextDossierMezzoDomain.ts`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_dossier-mezzo.md`
- `docs/audit/AUDIT_dossier-mezzo_LOOP.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Patch applicata
- Il composite ufficiale del dossier chiama ora `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`.
- La tabella `Materiali e movimenti inventario` del runtime ufficiale non puo piu mostrare record o hide clone-only.

## Esito modulo
- Audit separato modulo: `PASS`
- Tracker modulo: `CLOSED`, riallineato al codice reale dopo il falso `CLOSED` emerso dall'audit globale V3.

## Note
- Il default del domain materiali condiviso non e stato cambiato in questo run.
- Serve un nuovo audit finale globale separato per aggiornare il verdetto complessivo della NEXT.
