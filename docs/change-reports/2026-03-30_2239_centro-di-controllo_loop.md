# Change Report - 2026-03-30 22:39 - centro-di-controllo loop

- modulo: `Centro di Controllo`
- obiettivo: chiudere il runtime ufficiale `/next/centro-controllo` come clone read-only fedele della madre.

## Gap reali trattati
- overlay storage/clone locale ancora attivi nel reader autisti usato dalla route ufficiale;
- patch clone-only ancora attive nel reader flotta usato dalla route ufficiale;
- formato data visibile diverso dalla madre.

## Patch applicate
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`

## Verifiche
- `npx eslint src/next/NextCentroControlloParityPage.tsx src/next/nextAnagraficheFlottaDomain.ts` -> `OK`
- `npm run build` -> `OK`

## Audit separato
- `docs/audit/AUDIT_centro-di-controllo_LOOP.md`
- esito: `PASS`
- stato modulo nel tracker: `CLOSED`
