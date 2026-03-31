# BACKLOG `Gestione Operativa` route ufficiale

- Modulo: `Gestione Operativa` (`route ufficiale`)
- Route: `/next/gestione-operativa`
- Stato iniziale nel run: `BLOCCO GRAVE` emerso dall'audit finale globale V3
- Stato finale nel run: `PASS` sulla route ufficiale
- Ciclo nel loop: `fuori tracker`, correzione post-audit globale
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/domain/nextOperativitaGlobaleDomain.ts` non legge piu `Inventario`, `Materiali` e `Procurement` con i default permissivi dei domain condivisi.
- Il percorso ufficiale `/next/gestione-operativa` passa ora esplicitamente:
  - `readNextInventarioSnapshot({ includeCloneOverlays: false })`
  - `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`
  - `readNextProcurementSnapshot({ includeCloneOverlays: false })`
- Badge, preview inventario e contatore consegne della route ufficiale non possono piu assorbire overlay clone-only.

## Nessun gap aperto nel perimetro della route ufficiale
- Runtime finale NEXT autonomo, senza mount madre come runtime finale.
- UI pratica della madre conservata su header hub, badge, preview e navigazione verso i moduli figli.
- Nessuna scrittura reale attiva e nessuna scrittura clone-only attiva sulla route ufficiale.
- Nessun cambio ai default condivisi oltre il path ufficiale corretto.

## File coinvolti
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/useNextOperativitaSnapshot.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/pages/GestioneOperativa.tsx`

## Decisione del run
- Correzione minima applicata solo al composite ufficiale della route.
- Default condivisi non toccati per non allargare il perimetro senza prova.
- Audit separato eseguito con esito `PASS`.
- Serve comunque un nuovo audit finale globale separato per aggiornare il verdetto complessivo della NEXT.
