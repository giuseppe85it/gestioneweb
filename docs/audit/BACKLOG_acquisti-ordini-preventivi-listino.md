# BACKLOG `Acquisti / Ordini / Preventivi / Listino`

- Modulo: `Acquisti / Ordini / Preventivi / Listino`
- Route: `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`
- Stato iniziale nel run: `NOT_STARTED`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `1/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextProcurementStandalonePage.tsx` non usa piu scaffold clone-only o snapshot operativita globale: la route ufficiale legge `readNextProcurementSnapshot({ includeCloneOverlays: false })` e riallinea il routing delle tab alle route ufficiali del gruppo.
- `src/next/NextProcurementReadOnlyPanel.tsx` non usa piu `upsertNextProcurementCloneOrder()`, modali di edit, aggiunta materiale, PDF locali o notice clone-only: replica ora il pannello read-only della madre su header, tab, liste, dettaglio e schede bloccate.
- `src/next/domain/nextProcurementDomain.ts` supporta la lettura ufficiale senza overlay clone-only; la route ufficiale la usa con `includeCloneOverlays: false`, mentre i reason di navigabilita e le limitations tornano coerenti al perimetro read-only della madre.
- Le CTA scriventi (`Segna arrivato`, `Modifica`, `+ Aggiungi materiale`, `PDF`) restano visivamente coerenti alla madre ma bloccate sotto con comportamento read-only esplicito.

## Nessun gap aperto nel perimetro `Acquisti / Ordini / Preventivi / Listino`
- Route ufficiali NEXT autonome senza runtime finale madre.
- UI pratica, CTA, placeholder e superfici esterne equivalenti alla madre nel suo ramo procurement read-only.
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.
- Lettura dei dati reali sopra layer NEXT pulito D06, con opt-out esplicito degli overlay locali sugli ordini.

## File verificati nel run
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/domain/nextProcurementDomain.ts`
- `src/pages/Acquisti.tsx`
- `src/pages/OrdiniInAttesa.tsx`
- `src/pages/OrdiniArrivati.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Lavori`.
