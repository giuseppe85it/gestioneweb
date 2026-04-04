# Change Report

- Data: 2026-04-03 22:29
- Ambito: shell globale NEXT
- Task: separare i collegamenti sidebar `Mezzi aziendali` e `Motrici e trattori`

## File toccati
- `src/next/nextData.ts`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Causa reale
- Nel catalogo nav `NEXT_SHELL_NAV_SECTIONS` entrambe le voci usavano lo stesso path `NEXT_MEZZI_PATH`.
- Il renderer di `NextShell.tsx` era gia corretto e non forzava alias o redirect aggiuntivi.

## Fix applicato
- `Mezzi aziendali` resta su `/next/mezzi`.
- `Motrici e trattori` usa ora `/next/dossiermezzi`.
- Nessuna modifica a route, pagine o domain.

## Verifica
- `node_modules\\.bin\\eslint.cmd src/next/nextData.ts src/next/NextShell.tsx`
- `npm run build`
- Esito: `OK`
