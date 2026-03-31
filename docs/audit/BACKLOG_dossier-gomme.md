# BACKLOG `Dossier Gomme`

- Modulo: `Dossier Gomme`
- Route: `/next/dossier/:targa/gomme`
- Stato iniziale nel run: `NOT_STARTED`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `1/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextDossierGommePage.tsx` riallinea il CTA di ritorno alla madre con etichetta `← Dossier`, mantenendo il navigate clone-safe verso il dossier NEXT.
- `src/next/NextGommeEconomiaSection.tsx` supporta ora uno scope dati esplicito: sulla route ufficiale `Dossier Gomme` mostra solo le sostituzioni derivate da `@manutenzioni`, che sono la stessa sorgente visibile usata dalla madre.
- Il layer NEXT gomme resta disponibile per altri moduli con lo scope esteso, ma il runtime ufficiale del dossier non espone piu eventi extra che la madre non mostra.

## Nessun gap aperto nel perimetro `Dossier Gomme`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica equivalente alla madre su header, CTA di ritorno, cards statistiche, storico e grafici.
- Nessuna scrittura reale attiva e nessun bottone operativo di inserimento/modifica nel modulo.
- Lettura dati sopra layer NEXT puliti, ma con vista ufficiale riallineata alla stessa base dati visibile della madre.

## File coinvolti
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/pages/DossierGomme.tsx`
- `src/pages/GommeEconomiaSection.tsx`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Dossier Rifornimenti`.
