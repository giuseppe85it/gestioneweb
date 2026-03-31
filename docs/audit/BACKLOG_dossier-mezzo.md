# BACKLOG `Dossier Mezzo`

- Modulo: `Dossier Mezzo`
- Route: `/next/dossiermezzi/:targa` (`/next/dossier/:targa` alias tecnico)
- Stato iniziale nel run: `CLOSED` da tracker ma `FALSO CLOSED` nel codice reale
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `2/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextDossierMezzoPage.tsx` non legge piu `nextDossierCloneState` e non nasconde piu i documenti in overlay locale del clone.
- Il bottone madre `Elimina` dei preventivi resta visibile ma blocca l'azione con messaggio read-only esplicito, invece di simulare una cancellazione locale.
- `src/next/domain/nextDossierMezzoDomain.ts` legge ora i movimenti materiali del percorso ufficiale con `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`.
- La tabella `Materiali e movimenti inventario` del runtime ufficiale usa quindi solo `@materialiconsegnati` reale, senza record o hide locali del clone.

## Nessun gap aperto nel perimetro `Dossier Mezzo`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica, modali principali e anteprima PDF equivalenti alla madre nel perimetro modulo.
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale.
- Lettura dei dati sopra layer NEXT puliti e composite dossier dedicato, inclusi ora i movimenti materiali senza overlay clone-only nel percorso ufficiale.

## File coinvolti
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/pages/DossierMezzo.tsx`
- `src/App.tsx`

## Decisione del loop
- Riapertura tecnica del modulo dopo il falso `CLOSED` emerso da `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md`.
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Tutti i moduli del tracker risultano di nuovo `CLOSED`, ma serve un nuovo audit finale globale separato.
