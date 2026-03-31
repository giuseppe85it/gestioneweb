# AUDIT LOOP `Dossier Lista`

- Data audit: `2026-03-31 08:00 Europe/Rome`
- Route ufficiale verificata: `/next/dossiermezzi`
- Runtime ufficiale verificato: `src/next/NextDossierListaPage.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- La route ufficiale `/next/dossiermezzi` monta `NextDossierListaPage`, non `NextMotherPage` o `src/pages/DossierLista.tsx`.
- Il runtime ufficiale replica la stessa superficie pratica della madre: titolo `Dossier Mezzi`, griglia categorie, bottone ritorno categorie, card mezzo con foto/placeholder e ingresso al dettaglio dossier.
- `NextDossierListaPage` legge lo stesso dataset reale della madre (`storage/@mezzi_aziendali`) tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi sopra il layer D01 pulito e senza overlay clone-only impliciti.
- Il click sulle card porta a `/next/dossiermezzi/:targa`, alias NEXT coerente con il flusso madre `lista -> dettaglio`; nel routing ufficiale questa route monta `NextDossierMezzoPage`.
- Il modulo non espone scritture, modali operativi, PDF o side effect business: il perimetro resta integralmente read-only senza workaround clone-only.
- La madre resta distinta e intoccata: `src/pages/DossierLista.tsx` continua a leggere Firestore diretto con `getDoc()`, mentre il clone usa solo il layer NEXT.

## Criteri PASS/FAIL
- Route NEXT autonoma senza runtime finale madre: `PASS`
- UI pratica equivalente alla madre: `PASS`
- Flusso categorie -> mezzi -> dossier equivalente: `PASS`
- Modali principali equivalenti: `PASS` (`N/A`, il modulo non ne prevede)
- Report/PDF principali equivalenti: `PASS` (`N/A`, il modulo non ne prevede)
- Testi, CTA e placeholder visibili equivalenti: `PASS`
- Lettura degli stessi dati reali senza overlay clone-only: `PASS`
- Nessuna scrittura reale attiva e nessuna scrittura locale clone-only nel runtime ufficiale: `PASS`
- Layer NEXT puliti usati davvero sotto: `PASS`
- Lint: `PASS`

## Verdetto
- Il modulo `Dossier Lista` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il modulo `Dossier Lista`.
- Il prossimo modulo non `CLOSED` del tracker e `Dossier Mezzo`.
