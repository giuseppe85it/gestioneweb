# BACKLOG `Materiali consegnati`

- Modulo: `Materiali consegnati`
- Route: `/next/materiali-consegnati`
- Stato iniziale nel run: `NOT_STARTED`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `1/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextMaterialiConsegnatiPage.tsx` non usa piu `NextClonePageScaffold`: replica ora la superficie madre con header, form, suggerimenti destinatario/materiale, lista destinatari, dettaglio storico e modale PDF.
- Il runtime ufficiale non usa piu `appendNextMaterialiMovimentiCloneRecord()`, `markNextMaterialiMovimentiCloneDeleted()` o `upsertNextInventarioCloneRecord()`: `Registra consegna` ed `Elimina` restano visibili ma bloccati con messaggio read-only esplicito.
- `src/next/domain/nextMaterialiMovimentiDomain.ts` supporta ora `includeCloneOverlays: false`, e la route ufficiale legge `@materialiconsegnati` senza overlay clone-only.
- Anteprima/scarico PDF restano disponibili sopra i dati reali letti dal reader D05, senza riaprire scritture business o locali.

## Nessun gap aperto nel perimetro `Materiali consegnati`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica, CTA, placeholder e validazioni visibili equivalenti alla madre.
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.
- Lettura dei dati reali sopra layer NEXT puliti, con opt-out esplicito degli overlay locali solo sulla route ufficiale.

## File verificati nel run
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/pages/MaterialiConsegnati.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Materiali da ordinare`.
