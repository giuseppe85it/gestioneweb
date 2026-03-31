# Change Report

- Timestamp: `2026-03-31 18:10 Europe/Rome`
- Tipo: `final fix post audit globale`
- Modulo: `Gestione Operativa` (`route ufficiale`)
- Route: `/next/gestione-operativa`

## File toccati
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_gestione-operativa-route.md`
- `docs/audit/AUDIT_gestione-operativa-route_LOOP.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Patch
- Il composite ufficiale della route passa ora `includeCloneOverlays: false` a:
  - `readNextInventarioSnapshot`
  - `readNextMaterialiMovimentiSnapshot`
  - `readNextProcurementSnapshot`
- Nessun cambio di UI.
- Nessun cambio ai default condivisi dei domain.

## Esito
- Audit separato route ufficiale: `PASS`
- La route `/next/gestione-operativa` non puo piu mostrare badge o preview contaminati da overlay clone-only nel percorso ufficiale.
