# Change Report - Loop `Inventario` Fix (`2026-03-31 08:43`)

## Obiettivo
Chiudere il modulo `Inventario` della NEXT sulla route `/next/inventario` come clone fedele read-only della madre, senza toccare la madre e senza degradare il layer D05 esistente.

## File letti
- `src/next/NextInventarioPage.tsx`
- `src/next/domain/nextInventarioDomain.ts`
- `src/pages/Inventario.tsx`
- `src/next/domain/nextFornitoriDomain.ts`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_inventario.md`
- `docs/audit/AUDIT_inventario_LOOP.md`

## Patch applicate
- `nextInventarioDomain` accetta ora `includeCloneOverlays`; la route ufficiale puo leggere `@inventario` senza integrare record o delete locali del clone.
- `NextInventarioPage` non usa piu `NextClonePageScaffold` e replica la superficie madre con CSS e blocchi visivi equivalenti.
- Rimossi dal runtime ufficiale i writer clone-only su add/edit/delete/qty/foto.
- Le azioni scriventi restano visibili ma bloccate con messaggi read-only espliciti.
- Anteprima/scarico PDF restano disponibili sopra i dati reali letti dal reader D05.

## Verifiche eseguite
- `npx eslint src/next/NextInventarioPage.tsx src/next/domain/nextInventarioDomain.ts` -> OK
- `npm run build` -> OK

## Esito operativo
- Il modulo `Inventario` passa da `FAIL` a `CLOSED` nel tracker.
- L'audit separato del modulo risulta `PASS`.
- Il prossimo modulo non `CLOSED` del loop diventa `Materiali consegnati`.
