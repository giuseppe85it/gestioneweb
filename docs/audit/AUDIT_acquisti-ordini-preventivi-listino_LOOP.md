# AUDIT LOOP `Acquisti / Ordini / Preventivi / Listino`

- Data audit: `2026-03-31 09:30 Europe/Rome`
- Route ufficiali verificate: `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId`
- Runtime ufficiale verificato: `src/next/NextProcurementStandalonePage.tsx`, `src/next/NextProcurementReadOnlyPanel.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- Le route ufficiali del gruppo montano solo wrapper NEXT (`NextAcquistiPage`, `NextOrdiniInAttesaPage`, `NextOrdiniArrivatiPage`, `NextDettaglioOrdinePage`) che delegano a `NextProcurementStandalonePage`, non `NextMotherPage` o `src/pages/Acquisti.tsx`.
- `NextProcurementStandalonePage` legge il dataset reale del gruppo tramite `readNextProcurementSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nella route ufficiale.
- `NextProcurementReadOnlyPanel` riallinea la superficie della madre sul ramo procurement read-only: header `Acquisti`, badge `SOLA LETTURA`, tab, liste `Ordini`/`Arrivi`, dettaglio ordine, placeholder e testi delle schede bloccate.
- `NextProcurementReadOnlyPanel` non importa piu `generateSmartPDF`, non usa `upsertNextProcurementCloneOrder()`, non espone piu modali di edit/add materiale e non rigenera PDF locali: i pulsanti restano visibili ma disabilitati con reason read-only esplicita.
- `nextProcurementDomain` continua a supportare overlay opzionali solo per consumer legacy espliciti, ma il runtime ufficiale del gruppo li spegne; `@ordini`, `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi` restano letti tramite il layer D06 pulito.
- La madre resta distinta e intoccata: `src/pages/Acquisti.tsx`, `src/pages/OrdiniInAttesa.tsx`, `src/pages/OrdiniArrivati.tsx` e `src/pages/DettaglioOrdine.tsx` mantengono writer, upload foto e PDF attivi, mentre il clone ufficiale li mostra solo come superficie read-only coerente.

## Criteri PASS/FAIL
- Route NEXT autonome senza runtime finale madre: `PASS`
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
- Il gruppo `Acquisti / Ordini / Preventivi / Listino` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il gruppo `Acquisti / Ordini / Preventivi / Listino`.
- Il prossimo modulo non `CLOSED` del tracker e `Lavori`.
