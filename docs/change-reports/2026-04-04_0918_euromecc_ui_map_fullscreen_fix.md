# Change Report - 2026-04-04 09:18

## Modifica
- Fix UI mirato del modulo `Euromecc` su `/next/euromecc`.

## Obiettivo
- Rendere la `Mappa impianto` della tab `Home` piu grande e meno schiacciata.
- Rendere piu leggibile lo `Schema tecnico` del fullscreen.
- Correggere il blocco `Problemi riscontrati` nel fullscreen per distinguere issue aperte e chiuse.

## File toccati
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Dettaglio
- aggiunta classe dedicata alla mappa Home per aumentare area utile e ridurre la compressione laterale;
- riequilibrato il layout fullscreen dei sili con piu spazio allo schema tecnico;
- ridotte e spezzate su piu righe le label hotspot del diagramma tecnico;
- separato il rendering di issue aperte e chiuse nel blocco `Problemi riscontrati`.

## Impatto
- solo UI/resa visiva del modulo `Euromecc`;
- nessuna modifica a route, sidebar, dominio Firestore, persistenza o regole di sicurezza.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx`
- `npm run build`
- verifica runtime locale su `/next/euromecc`

