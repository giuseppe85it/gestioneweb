# AUDIT LOOP `Inventario`

- Data audit: `2026-03-31 08:43 Europe/Rome`
- Route ufficiale verificata: `/next/inventario`
- Runtime ufficiale verificato: `src/next/NextInventarioPage.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- La route ufficiale `/next/inventario` monta `NextInventarioPage`, non `NextMotherPage` o `src/pages/Inventario.tsx`.
- Il runtime ufficiale replica ora la superficie madre su header, pulsanti PDF, form inserimento, suggerimenti fornitore, lista articoli, controlli quantita, bottoni `Elimina` / `Modifica`, modale modifica e modale `Anteprima PDF`.
- `NextInventarioPage` legge `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.
- `NextInventarioPage` non usa piu `upsertNextInventarioCloneRecord()` o `markNextInventarioCloneDeleted()`: add/edit/delete/qty/foto restano visibili ma bloccati con messaggio read-only esplicito.
- La madre resta distinta e intoccata: `src/pages/Inventario.tsx` continua a usare `getItemSync/setItemSync`, upload foto su Storage e PDF reale, mentre il clone ufficiale usa il layer D05 solo in lettura e non esegue side effect locali persistenti.

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
- Il modulo `Inventario` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il modulo `Inventario`.
- Il prossimo modulo non `CLOSED` del tracker e `Materiali consegnati`.
