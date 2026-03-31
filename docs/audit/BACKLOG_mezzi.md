# BACKLOG `Mezzi`

- Modulo: `Mezzi`
- Route: `/next/mezzi`
- Stato iniziale nel run: `FAIL`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `2/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextMezziPage.tsx` non espone piu testi clone-only (`salvataggi locali al clone`, `IA locale`, `Nessun mezzo registrato nel clone`) e riallinea la superficie madre di form, CTA, foto, libretto IA e lista mezzi.
- `src/next/NextMezziPage.tsx` non usa piu `upsertNextFlottaClonePatch()` o `markNextFlottaCloneDeleted()`: `SALVA` ed `ELIMINA` restano visibili ma sono bloccati con messaggio read-only esplicito.
- `src/next/nextAnagraficheFlottaDomain.ts` non applica piu patch clone-only per default: il reader ufficiale di `Mezzi` e read-only safe salvo richiesta esplicita del chiamante.
- Foto e libretto mantengono la superficie madre, ma nessun upload Storage, nessuna chiamata IA remota e nessuna scrittura dati reali vengono eseguiti nel clone.

## Nessun gap aperto nel perimetro `Mezzi`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica, CTA, testi, placeholder e validazioni visibili riallineati alla madre nel perimetro modulo.
- Lettura degli stessi dataset reali della madre senza overlay clone-only nel runtime ufficiale.
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only attiva nel runtime ufficiale.

## File coinvolti
- `src/next/NextMezziPage.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/pages/Mezzi.tsx`

## Decisione del loop
- Patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Dossier Lista`.
