# AUDIT LOOP `Materiali consegnati`

- Data audit: `2026-03-31 09:00 Europe/Rome`
- Route ufficiale verificata: `/next/materiali-consegnati`
- Runtime ufficiale verificato: `src/next/NextMaterialiConsegnatiPage.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- La route ufficiale `/next/materiali-consegnati` monta `NextMaterialiConsegnatiPage`, non `NextMotherPage` o `src/pages/MaterialiConsegnati.tsx`.
- Il runtime ufficiale replica ora la superficie madre su header, pulsanti PDF, form nuova consegna, suggerimenti destinatario/materiale, lista destinatari, dettaglio storico e modale `Anteprima PDF`.
- `NextMaterialiConsegnatiPage` legge `@materialiconsegnati` tramite `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.
- La stessa route legge `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })` e usa `readNextAnagraficheFlottaSnapshot()` per mezzi e colleghi reali senza patch clone richieste.
- `NextMaterialiConsegnatiPage` non usa piu `appendNextMaterialiMovimentiCloneRecord()`, `markNextMaterialiMovimentiCloneDeleted()` o `upsertNextInventarioCloneRecord()`: `Registra consegna` ed `Elimina` restano visibili ma bloccati con messaggio read-only esplicito.
- La madre resta distinta e intoccata: `src/pages/MaterialiConsegnati.tsx` continua a usare `getItemSync/setItemSync`, scala/ripristino inventario e PDF reale, mentre il clone ufficiale usa i layer D05/D01 solo in lettura e non esegue side effect locali persistenti.

## Criteri PASS/FAIL
- Route NEXT autonoma senza runtime finale madre: `PASS`
- UI pratica equivalente alla madre: `PASS`
- Flussi visibili utili equivalenti: `PASS`
- Modali principali equivalenti: `PASS`
- Report/PDF principali equivalenti: `PASS`
- Testi, CTA, placeholder e validazioni visibili equivalenti: `PASS`
- Lettura degli stessi dati reali senza overlay clone-only: `PASS`
- Nessuna scrittura reale attiva: `PASS`
- Nessuna scrittura locale clone-only attiva nel runtime ufficiale: `PASS`
- Layer NEXT puliti usati davvero sotto: `PASS`
- Lint e build: `PASS`

## Verdetto
- Il modulo `Materiali consegnati` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il modulo `Materiali consegnati`.
- Il prossimo modulo non `CLOSED` del tracker e `Materiali da ordinare`.
