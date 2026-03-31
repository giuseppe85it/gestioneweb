# BACKLOG `Materiali da ordinare`

- Modulo: `Materiali da ordinare`
- Route: `/next/materiali-da-ordinare`
- Stato iniziale nel run: `NOT_STARTED`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `1/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextMaterialiDaOrdinarePage.tsx` non usa piu `appendNextProcurementCloneOrder()` ne writer locali su preventivi, righe materiali o note: la superficie madre resta intatta ma il runtime ufficiale non simula piu workflow clone-only.
- Il runtime ufficiale ha rimosso upload foto, upload preventivi, PDF clone-only, editor locali e conferma ordine clone-only che falsavano la parity esterna del modulo.
- `src/next/domain/nextFornitoriDomain.ts` supporta ora `includeCloneOverlays: false`, e la route ufficiale legge `@fornitori` senza overlay clone-only.
- Le tab non `Fabbisogni` tornano placeholder madre-like; i pulsanti scriventi restano visibili ma bloccati in read-only esplicito.

## Nessun gap aperto nel perimetro `Materiali da ordinare`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica, CTA, tab, placeholder e modale equivalenti alla madre.
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.
- Lettura dei dati reali sopra layer NEXT puliti, con opt-out esplicito degli overlay locali sui fornitori.

## File verificati nel run
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/pages/MaterialiDaOrdinare.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Acquisti / Ordini / Preventivi / Listino`.
