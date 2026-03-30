# Report Finale - Prompt 37 - Ricostruzione Home e Capo nel clone/NEXT

## Obiettivo
Applicare il metodo gia validato su `Centro di Controllo` anche agli altri residui con il massimo avanzamento reale possibile nel solo perimetro consentito, senza usare wrapper finali della madre come soluzione chiusa.

## Moduli chiusi davvero in questo run

### Home
- Stato iniziale: `APERTO`
- Stato finale: `PARI E PULITO`
- La pagina madre era montata prima? `SI`
- La pagina madre e stata sostituita nel clone? `SI`
- File ufficiali:
  - `src/next/NextHomePage.tsx`
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/domain/nextCentroControlloDomain.ts`
  - `src/next/nextHomeCloneState.ts`

#### Verifica avversariale
- La route NEXT usa ancora runtime madre? `NO`
- La UI esterna e equivalente? `SI`, esclusi i blocchi `Targa 360 / Mezzo360` e `Autista 360` fuori perimetro
- I flussi principali sono equivalenti? `SI`
- I modali principali sono equivalenti? `SI`
- I report/PDF principali sono equivalenti? `SI`
- Sotto legge layer NEXT puliti? `SI`
- Restano accessi legacy critici nella pagina clone? `NO`

#### Layer usati sotto
- `D10` tramite `readNextCentroControlloSnapshot()`
- `D03` tramite `readNextAutistiReadOnlySnapshot()`
- overlay clone-only `nextHomeCloneState` per ack alert e modifiche locali UI

#### Chiusure tecniche effettive
- rimossa la dipendenza finale da `src/pages/Home.tsx`
- ripristinati:
  - export PDF alert
  - azioni `Ignora / In seguito / Letto`
  - modali `Prenotazione collaudo`, `Programmazione Pre-collaudo`, `Segna revisione fatta`
  - `AutistiEventoModal`
  - quick links con pin e usage locali
- riattivati gli edit locali di luogo mezzo e prenotazioni nel solo overlay clone

### Capo
- Stato iniziale: `APERTO`
- Stato finale: `PARI E PULITO`
- La pagina madre era montata prima? `NO`, ma la parity era incompleta
- La pagina madre e stata sostituita nel clone? `GIA NEXT`, riallineata a parity completa
- File ufficiali:
  - `src/next/NextCapoMezziPage.tsx`
  - `src/next/NextCapoCostiMezzoPage.tsx`
  - `src/next/domain/nextCapoDomain.ts`
  - `src/next/nextCapoCloneState.ts`

#### Verifica avversariale
- La route NEXT usa ancora runtime madre? `NO`
- La UI esterna e equivalente? `SI`
- I flussi principali sono equivalenti? `SI`
- I modali principali sono equivalenti? `SI`
- I report/PDF principali sono equivalenti? `SI`
- Sotto legge layer NEXT puliti? `SI`
- Restano accessi legacy critici nella pagina clone? `NO`

#### Layer usati sotto
- `nextCapoDomain`
- `nextDocumentiCostiDomain`
- overlay clone-only `nextCapoCloneState` per stati approvazione

#### Chiusure tecniche effettive
- riattivati:
  - `APPROVA / RIFIUTA / DA VALUTARE`
  - `ANTEPRIMA PDF PREVENTIVI`
  - `ANTEPRIMA PDF`
  - `ANTEPRIMA TIMBRATO`
  - `PdfPreviewModal` con share/copy/WhatsApp
- nessuna scrittura business reale riaperta

## Moduli residui ancora non chiusi

| Modulo | Stato iniziale | Stato finale | La madre era montata prima? | La madre e stata sostituita ora? | Parity UI | Parity flussi | Parity modali | Parity PDF/report | Stato dati/layer sotto | Motivo tecnico reale / dipendenza legacy ancora attiva |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Materiali da ordinare` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Boundary assente, runtime legacy` | `src/next/NextMaterialiDaOrdinarePage.tsx` monta ancora `src/pages/MaterialiDaOrdinare.tsx` |
| `Acquisti / Preventivi / Listino` | `APERTO` | `APERTO` | `NO` sulla pagina NEXT, ma parity incompleta | `NO` | `PARZIALE` | `NO` | `PARZIALE` | `NO` | `nextProcurementDomain` pulito ma copertura incompleta | `NextProcurementStandalonePage` e `NextProcurementReadOnlyPanel` lasciano ancora bloccati preventivi, listino e PDF operativi |
| `Dossier Mezzo` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Boundary solo parziale` | `src/next/NextDossierMezzoPage.tsx` monta ancora `src/pages/DossierMezzo.tsx` |
| `Analisi Economica` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `N/A` | `NO` | `Boundary solo parziale` | `src/next/NextAnalisiEconomicaPage.tsx` monta ancora `src/pages/AnalisiEconomica.tsx` |
| `IA Libretto` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Boundary flotta ma runtime legacy` | `src/next/NextIALibrettoPage.tsx` monta ancora `src/pages/IA/IALibretto.tsx` |
| `IA Documenti` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Boundary parziale ma runtime legacy` | `src/next/NextIADocumentiPage.tsx` monta ancora `src/pages/IA/IADocumenti.tsx` |
| `IA Copertura Libretti` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Boundary flotta ma runtime legacy` | `src/next/NextIACoperturaLibrettiPage.tsx` monta ancora `src/pages/IA/IACoperturaLibretti.tsx` |
| `Cisterna` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Runtime legacy` | `src/next/NextCisternaPage.tsx` monta ancora `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` |
| `Cisterna IA` | `APERTO` | `APERTO` | `SI` | `NO` | `PARZIALE` | `PARZIALE` | `N/A` | `N/A` | `nextCisternaDomain` presente ma runtime legacy finale | `src/next/NextCisternaIAPage.tsx` monta ancora `src/pages/CisternaCaravate/CisternaCaravateIA.tsx` |
| `Cisterna Schede Test` | `APERTO` | `APERTO` | `SI` | `NO` | `NO` | `NO` | `NO` | `NO` | `Runtime legacy` | `src/next/NextCisternaSchedeTestPage.tsx` monta ancora `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` |
| `Autisti / Inbox` | `APERTO` | `APERTO` | `SI` su parte ampia del perimetro | `NO` | `PARZIALE` | `PARZIALE` | `PARZIALE` | `N/A` | `D03 + overlay autisti, ma runtime legacy finale su molte route` | wrapper ufficiali in `src/next/NextAutisti*Page.tsx` e `src/next/NextAutistiInbox*Page.tsx` continuano a montare `src/autisti/**` e `src/autistiInbox/**` |

## Fuori perimetro
- `Targa 360 / Mezzo360`
- `Autista 360`

## Verifiche
- `npx eslint src/next/NextHomePage.tsx src/next/NextCentroControlloPage.tsx src/next/domain/nextCentroControlloDomain.ts src/next/nextHomeCloneState.ts src/next/NextCapoMezziPage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/domain/nextCapoDomain.ts src/next/nextCapoCloneState.ts` -> `OK`
- `npm run build` -> `OK`

## Verdetto finale del run
- Chiusure reali ottenute: `Home`, `Capo`
- Chiusure gia presenti e confermate: `Centro di Controllo` e tutti i moduli gia segnati `PARI E PULITO` nei report precedenti
- Residui ancora aperti: `Materiali da ordinare`, `Acquisti / Preventivi / Listino`, `Dossier Mezzo`, `Analisi Economica`, `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Cisterna`, `Cisterna IA`, `Cisterna Schede Test`, `Autisti / Inbox`
- Nessun `SERVE FILE EXTRA` dimostrato in questo run: i residui restano tecnicamente ancora affrontabili dentro la whitelist, ma non sono stati chiusi davvero in questo prompt
