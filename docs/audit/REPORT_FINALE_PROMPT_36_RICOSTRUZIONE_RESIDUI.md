# Report Finale - Prompt 36 - Ricostruzione residui clone/NEXT

## Obiettivo
Smettere di usare wrapper cosmetici della madre sui moduli residui e ricostruire davvero nel clone/NEXT almeno il primo blocco obbligatorio: `Centro di Controllo`.

## Modulo chiuso davvero in questo run

### Centro di Controllo
- Stato iniziale: `SPEZZATO`
- Stato finale: `PARI E PULITO`
- La pagina madre era ancora montata prima? `SI`
- La pagina madre e stata sostituita nel clone? `SI`
- File ufficiale nuovo: `src/next/NextCentroControlloParityPage.tsx`

### Verifica avversariale
- La pagina NEXT usa ancora runtime madre? `NO`
- La UI esterna e equivalente? `SI`
- I flussi principali sono equivalenti? `SI`
- I modali principali sono equivalenti? `SI`
- I report/PDF principali sono equivalenti? `SI`
- Sotto legge layer NEXT puliti? `SI`
- Restano accessi diretti legacy critici nella pagina clone? `NO`

### Layer usati sotto
- `D01` tramite `readNextAnagraficheFlottaSnapshot()` per manutenzioni programmate
- `D04` tramite `readNextRifornimentiReadOnlySnapshot()` per rifornimenti mensili
- `D03` tramite `readNextAutistiReadOnlySnapshot()` per segnalazioni, controlli e richieste

### Chiusure tecniche effettive
- rimossa la route ufficiale da `NextCentroControlloClonePage`
- ricostruita la pagina clone con i cinque tab reali della madre
- ripristinata la preview PDF su manutenzioni e rifornimenti
- spostato il parsing tabellare autisti nel domain `D03`
- aggiunto snapshot globale rifornimenti nel domain `D04`

## Moduli residui ancora non chiusi

| Modulo | Stato | Motivo tecnico reale | Dipendenza legacy ancora non eliminata |
| --- | --- | --- | --- |
| `Home` | Aperto | La route ufficiale monta ancora `src/pages/Home.tsx` dentro `NextMotherPage` | runtime legacy in [src/next/NextHomePage.tsx](/g:/gestione-web/src/next/NextHomePage.tsx) -> [src/pages/Home.tsx](/g:/gestione-web/src/pages/Home.tsx) |
| `Materiali da ordinare` | Aperto | Il clone continua a usare la pagina legacy | route in [src/next/NextMaterialiDaOrdinarePage.tsx](/g:/gestione-web/src/next/NextMaterialiDaOrdinarePage.tsx) che monta [src/pages/MaterialiDaOrdinare.tsx](/g:/gestione-web/src/pages/MaterialiDaOrdinare.tsx) |
| `Acquisti / Preventivi / Listino` | Aperto | La parity madre vive ancora nella pagina legacy e non in una pagina NEXT ricostruita | [src/next/NextAcquistiPage.tsx](/g:/gestione-web/src/next/NextAcquistiPage.tsx) -> [src/pages/Acquisti.tsx](/g:/gestione-web/src/pages/Acquisti.tsx) |
| `Dossier Mezzo` | Aperto | Il clone usa ancora la pagina madre sul path ufficiale | [src/next/NextDossierMezzoPage.tsx](/g:/gestione-web/src/next/NextDossierMezzoPage.tsx) -> [src/pages/DossierMezzo.tsx](/g:/gestione-web/src/pages/DossierMezzo.tsx) |
| `Analisi Economica` | Aperto | La surface ufficiale resta legacy-wrapper | [src/next/NextAnalisiEconomicaPage.tsx](/g:/gestione-web/src/next/NextAnalisiEconomicaPage.tsx) -> [src/pages/AnalisiEconomica.tsx](/g:/gestione-web/src/pages/AnalisiEconomica.tsx) |
| `Capo` | Aperto | Le route ufficiali non sono ancora ricostruite come copie pure nel clone | dipendenze legacy in [src/pages/CapoMezzi.tsx](/g:/gestione-web/src/pages/CapoMezzi.tsx) e [src/pages/CapoCostiMezzo.tsx](/g:/gestione-web/src/pages/CapoCostiMezzo.tsx) |
| `IA Libretto` | Aperto | La route clone monta ancora il runtime madre | [src/next/NextIALibrettoPage.tsx](/g:/gestione-web/src/next/NextIALibrettoPage.tsx) -> [src/pages/IA/IALibretto.tsx](/g:/gestione-web/src/pages/IA/IALibretto.tsx) |
| `IA Documenti` | Aperto | La route clone monta ancora il runtime madre | [src/next/NextIADocumentiPage.tsx](/g:/gestione-web/src/next/NextIADocumentiPage.tsx) -> [src/pages/IA/IADocumenti.tsx](/g:/gestione-web/src/pages/IA/IADocumenti.tsx) |
| `IA Copertura Libretti` | Aperto | La route clone monta ancora il runtime madre | [src/next/NextIACoperturaLibrettiPage.tsx](/g:/gestione-web/src/next/NextIACoperturaLibrettiPage.tsx) -> [src/pages/IA/IACoperturaLibretti.tsx](/g:/gestione-web/src/pages/IA/IACoperturaLibretti.tsx) |
| `Cisterna / IA / Schede Test` | Aperto | Le route ufficiali restano wrapper della madre | [src/next/NextCisternaPage.tsx](/g:/gestione-web/src/next/NextCisternaPage.tsx), [src/next/NextCisternaIAPage.tsx](/g:/gestione-web/src/next/NextCisternaIAPage.tsx), [src/next/NextCisternaSchedeTestPage.tsx](/g:/gestione-web/src/next/NextCisternaSchedeTestPage.tsx) |
| `Autisti / Inbox` | Aperto | I percorsi ufficiali NEXT montano ancora schermate legacy campo/inbox | wrapper in `src/next/NextAutisti*Page.tsx` e `src/next/NextAutistiInbox*Page.tsx` verso `src/autisti/**` e `src/autistiInbox/**` |

## Fuori perimetro
- `Targa 360 / Mezzo360`
- `Autista 360`

## Verifiche
- `npx eslint src/next/NextCentroControlloParityPage.tsx src/next/domain/nextAutistiDomain.ts src/next/domain/nextRifornimentiDomain.ts src/App.tsx` -> OK
- `npm run build` -> OK

## Verdetto finale del run
- Chiusura reale ottenuta: `Centro di Controllo`
- Nessun altro modulo residuo viene dichiarato chiuso in questo report
- Il clone resta non completo sul perimetro totale finche `Home`, `Procurement`, `Dossier Mezzo`, `Analisi Economica`, `Capo`, `IA child routes`, `Cisterna` e `Autisti / Inbox` non smettono di montare il runtime madre
