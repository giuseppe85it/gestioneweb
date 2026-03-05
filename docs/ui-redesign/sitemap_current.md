# Sitemap Attuale (As-Is)

Fonte: `src/App.tsx` + componenti referenziati.

## 1) Home / Dashboard
- `/` -> `Home` (admin hub con alert, quick link, ingressi moduli)

## 2) Lavori
- `/lavori-da-eseguire` -> `LavoriDaEseguire`
- `/lavori-in-attesa` -> `LavoriInAttesa`
- `/lavori-eseguiti` -> `LavoriEseguiti`
- `/dettagliolavori` -> `DettaglioLavoro`

## 3) Dossier / Flotta / Capo
- `/dossiermezzi` -> `DossierLista`
- `/dossiermezzi/:targa` -> `DossierMezzo`
- `/dossier/:targa` -> `DossierMezzo` (alias)
- `/dossier/:targa/gomme` -> `DossierGomme`
- `/dossier/:targa/rifornimenti` -> `DossierRifornimenti`
- `/mezzo-360/:targa` -> `Mezzo360`
- `/autista-360` -> `Autista360`
- `/autista-360/:badge` -> `Autista360`
- `/analisi-economica/:targa` -> `AnalisiEconomica`
- `/capo/mezzi` -> `CapoMezzi`
- `/capo/costi/:targa` -> `CapoCostiMezzo`
- `/mezzi` -> `Mezzi`
- `/manutenzioni` -> `Manutenzioni`

## 4) Operativa / Magazzino / Acquisti
- `/gestione-operativa` -> `GestioneOperativa`
- `/centro-controllo` -> `CentroControllo`
- `/acquisti` -> `Acquisti`
- `/acquisti/dettaglio/:ordineId` -> `Acquisti` (variante tab/dettaglio)
- `/materiali-da-ordinare` -> `MaterialiDaOrdinare`
- `/materiali-consegnati` -> `MaterialiConsegnati`
- `/inventario` -> `Inventario`
- `/attrezzature-cantieri` -> `AttrezzatureCantieri`
- `/ordini-in-attesa` -> `OrdiniInAttesa`
- `/ordini-arrivati` -> `OrdiniArrivati`
- `/dettaglio-ordine/:ordineId` -> `DettaglioOrdine`

## 5) Anagrafiche
- `/colleghi` -> `Colleghi`
- `/fornitori` -> `Fornitori`

## 6) IA / Documenti / Cisterna
- `/ia` -> `IAHome`
- `/ia/apikey` -> `IAApiKey`
- `/ia/libretto` -> `IALibretto`
- `/ia/documenti` -> `IADocumenti`
- `/ia/copertura-libretti` -> `IACoperturaLibretti`
- `/libretti-export` -> `LibrettiExport`
- `/cisterna` -> `CisternaCaravatePage`
- `/cisterna/ia` -> `CisternaCaravateIA`
- `/cisterna/schede-test` -> `CisternaSchedeTest`

## 7) App Autisti (mobile web)
- `/autisti` -> `AutistiGate` (router decisionale login/setup/controllo/home)
- `/autisti/login` -> `LoginAutista`
- `/autisti/home` -> `HomeAutista`
- `/autisti/setup-mezzo` -> `SetupMezzo`
- `/autisti/cambio-mezzo` -> `CambioMezzoAutista`
- `/autisti/rifornimento` -> `Rifornimento`
- `/autisti/controllo` -> `ControlloMezzo`
- `/autisti/segnalazioni` -> `Segnalazioni`
- `/autisti/richiesta-attrezzature` -> `RichiestaAttrezzature`

## 8) Inbox Autisti + Rettifica Admin
- `/autisti-inbox` -> `AutistiInboxHome`
- `/autisti-inbox/cambio-mezzo` -> `CambioMezzoInbox`
- `/autisti-inbox/controlli` -> `AutistiControlliAll`
- `/autisti-inbox/segnalazioni` -> `AutistiSegnalazioniAll`
- `/autisti-inbox/log-accessi` -> `AutistiLogAccessiAll`
- `/autisti-inbox/richiesta-attrezzature` -> `RichiestaAttrezzatureAll`
- `/autisti-inbox/gomme` -> `AutistiGommeAll`
- `/autisti-admin` -> `AutistiAdmin`

## Osservazioni As-Is
- Duplicazione di percorsi/concetti:
  - `DossierMezzo` raggiungibile sia da `/dossiermezzi/:targa` sia da `/dossier/:targa`.
  - Flusso ordini presente sia in `Acquisti` sia nelle pagine dedicate `Ordini*` + `DettaglioOrdine`.
- Separazione ruoli non sempre esplicita in menu: Admin, Capo e IA convivono sulla stessa shell principale.
