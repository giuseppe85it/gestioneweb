# BACKLOG `Inventario`

- Modulo: `Inventario`
- Route: `/next/inventario`
- Stato iniziale nel run: `FAIL`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `2/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextInventarioPage.tsx` non usa piu `NextClonePageScaffold`: replica ora la superficie madre con header, form, suggerimenti fornitore, lista, modale modifica e modale PDF.
- Il runtime ufficiale non usa piu `upsertNextInventarioCloneRecord()` o `markNextInventarioCloneDeleted()`: add/edit/delete/qty/foto restano visibili ma bloccati con messaggio read-only esplicito.
- `src/next/domain/nextInventarioDomain.ts` supporta ora `includeCloneOverlays: false`, e la route ufficiale legge `@inventario` senza overlay clone-only.
- Anteprima/scarico PDF restano disponibili sopra i dati reali letti dal reader D05, senza riaprire scritture business o locali.

## Nessun gap aperto nel perimetro `Inventario`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica, CTA, modale modifica, placeholder e validazioni visibili equivalenti alla madre.
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.
- Lettura dei dati reali sopra layer NEXT puliti, con opt-out esplicito degli overlay locali solo sulla route ufficiale.

## File verificati nel run
- `src/next/NextInventarioPage.tsx`
- `src/next/domain/nextInventarioDomain.ts`
- `src/pages/Inventario.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Materiali consegnati`.
