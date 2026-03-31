# BACKLOG `Dossier Rifornimenti`

- Modulo: `Dossier Rifornimenti`
- Route: `/next/dossier/:targa/rifornimenti`
- Stato iniziale nel run: `NOT_STARTED`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `1/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextDossierRifornimentiPage.tsx` riallinea il CTA di ritorno alla madre con etichetta `← Dossier`, mantenendo il navigate clone-safe verso il dossier NEXT.
- `src/next/NextRifornimentiEconomiaSection.tsx` supporta ora uno scope dati esplicito: sulla route ufficiale `Dossier Rifornimenti` mostra solo i record business o ricostruiti dal business, escludendo i `solo_campo` che la madre non appende in UI.
- Il layer D04 resta disponibile per altri consumer con lo scope esteso, ma il runtime ufficiale del dossier non espone piu record extra rispetto alla madre.

## Nessun gap aperto nel perimetro `Dossier Rifornimenti`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica equivalente alla madre su header, CTA di ritorno, riepilogo, ultimi rifornimenti e grafici interattivi.
- Nessuna scrittura reale attiva nel modulo.
- Lettura dati sopra layer NEXT puliti, ma con vista ufficiale riallineata alla stessa base dati visibile della madre.

## File coinvolti
- `src/next/NextDossierRifornimentiPage.tsx`
- `src/next/NextRifornimentiEconomiaSection.tsx`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/pages/DossierRifornimenti.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Inventario`.
