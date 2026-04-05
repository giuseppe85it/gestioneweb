# Change Report - 2026-04-04 12:22

## Modifica
- Gestione del `tipo cemento` persistente per i sili del modulo `Euromecc`.

## Obiettivo
- Rendere il `tipo cemento` dinamico, persistente e modificabile via modale, visibile nella Home map solo per i sili.

## File toccati
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Dettaglio
- introdotta la collection Firestore `euromecc_area_meta`;
- esteso lo snapshot UI con `areaMeta` e `cementTypesByArea`;
- aggiunto writer `saveEuromeccAreaCementType()` su doc per area;
- visualizzato il valore dentro i sili nella Home;
- aggiunto modale di modifica dal `Focus area`.

## Impatto
- nuova persistenza reale limitata al perimetro `Euromecc`;
- nessun tocco a `euromeccAreas.ts`, route, sidebar o writer legacy.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts`
- `npm run build`
- verifica runtime locale con salvataggio e refresh su `/next/euromecc`

