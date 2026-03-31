# AUDIT LOOP `Materiali da ordinare`

- Data audit: `2026-03-31 09:09 Europe/Rome`
- Route ufficiale verificata: `/next/materiali-da-ordinare`
- Runtime ufficiale verificato: `src/next/NextMaterialiDaOrdinarePage.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- La route ufficiale `/next/materiali-da-ordinare` monta `NextMaterialiDaOrdinarePage`, non `NextMotherPage` o `src/pages/MaterialiDaOrdinare.tsx`.
- Il runtime ufficiale replica ora la superficie madre su header, tab, form fabbisogni, tabella materiali, placeholder panel, sticky action bar e modale placeholder.
- `NextMaterialiDaOrdinarePage` legge i fornitori reali tramite `readNextFornitoriSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.
- `NextMaterialiDaOrdinarePage` non usa piu `appendNextProcurementCloneOrder()`, upload locali, editor locali o PDF clone-only: `Carica foto`, `Carica preventivo`, `Aggiungi materiale` e `CONFERMA ORDINE` restano visibili ma bloccano il comportamento con messaggi read-only espliciti.
- La madre resta distinta e intoccata: `src/pages/MaterialiDaOrdinare.tsx` continua a usare upload immagini, `setDoc` su `@ordini` e stato locale di composizione ordine, mentre il clone ufficiale usa solo il layer fornitori in lettura e non esegue side effect persistenti.

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
- Il modulo `Materiali da ordinare` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il modulo `Materiali da ordinare`.
- Il prossimo modulo non `CLOSED` del tracker e `Acquisti / Ordini / Preventivi / Listino`.
