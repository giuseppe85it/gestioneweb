# Change Report - 2026-04-04 10:12

## Modifica
- Fix mirato della geometria SVG della `Mappa impianto` nella tab `Home` di `Euromecc`.

## Obiettivo
- Correggere il problema residuo di compressione del disegno interno, senza alterare il layout pagina o il fullscreen.

## File toccati
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Dettaglio
- ampliata la geometria interna dei sili;
- ridistribuiti i box delle aree centrali e basse;
- aumentato il respiro verticale della mappa;
- riallineate le linee di collegamento alle nuove quote del disegno;
- aggiornato solo il supporto minimo di larghezza per la mappa Home.

## Impatto
- solo resa visiva della tab `Home` di `Euromecc`;
- nessun cambio a domain, Firestore, route, sidebar o fullscreen.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx`
- `npm run build`
- verifica runtime locale su `/next/euromecc`

