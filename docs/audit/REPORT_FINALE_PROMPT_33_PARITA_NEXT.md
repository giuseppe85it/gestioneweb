# REPORT FINALE PROMPT 33 - PARITA NEXT VS MADRE

Data: 2026-03-29  
Stato: CURRENT

## 1. Scopo
Questo report chiude il prompt 33 sul piano reale del repo: indica cosa e stato portato davvero a `pari e pulito`, cosa resta non chiuso e quali file extra servono per arrivare al `100%` senza violare il vincolo `madre intoccabile`.

## 2. Base reale usata
- Audit di partenza:
  - `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`
  - `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_NEXT.md`
- Registri progetto:
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- Runtime verificato:
  - `src/App.tsx`
  - `src/next/**`
  - `src/pages/**`
  - `src/autisti/**`
  - `src/autistiInbox/**`
  - `src/utils/storageSync.ts`

## 3. Chiusure runtime eseguite davvero
- Introdotto overlay clone-only `storageSync` che fa prevalere nel subtree `/next` dataset legacy-shaped costruiti dai domain NEXT.
- Convertite a `UI madre fuori + layer pulito sotto` le route ufficiali:
  - `/next/mezzi`
  - `/next/gestione-operativa`
  - `/next/inventario`
  - `/next/materiali-consegnati`
  - `/next/attrezzature-cantieri`
  - `/next/manutenzioni`
  - `/next/ordini-in-attesa`
  - `/next/ordini-arrivati`
  - `/next/dettaglio-ordine/:ordineId`
  - `/next/lavori-da-eseguire`
  - `/next/lavori-in-attesa`
  - `/next/lavori-eseguiti`
  - `/next/dettagliolavori/:lavoroId`
- Ripuliti e serializzati nel bridge i dataset:
  - `@mezzi_aziendali`
  - `@colleghi`
  - `@inventario`
  - `@materialiconsegnati`
  - `@attrezzature_cantieri`
  - `@ordini`
  - `@lavori`
  - `@manutenzioni`

## 4. Moduli ora pari e puliti

| Modulo / Blocco | Stato finale | UI ufficiale NEXT | Layer dati finale | Note |
| --- | --- | --- | --- | --- |
| Mezzi | PARI | Pagina madre `Mezzi` | Bridge D01 su `@mezzi_aziendali` + `@colleghi` | Route ufficiale chiusa |
| Gestione Operativa | PARI | Pagina madre `GestioneOperativa` | Bridge D05/D02 su inventario, movimenti, manutenzioni | Route ufficiale chiusa |
| Inventario | PARI | Pagina madre `Inventario` | Bridge D05 su `@inventario` | Route ufficiale chiusa |
| Materiali consegnati | PARI | Pagina madre `MaterialiConsegnati` | Bridge D05 + D01 | Route ufficiale chiusa |
| Attrezzature cantieri | PARI | Pagina madre `AttrezzatureCantieri` | Bridge D05 attrezzature | Route ufficiale chiusa |
| Manutenzioni | PARI | Pagina madre `Manutenzioni` | Serializer D02 su `@manutenzioni` + bridge D01/D05 | Route ufficiale chiusa |
| Ordini in attesa | PARI | Pagina madre `OrdiniInAttesa` | Bridge D06 su `@ordini` | Route ufficiale chiusa |
| Ordini arrivati | PARI | Pagina madre `OrdiniArrivati` | Bridge D06 su `@ordini` | Route ufficiale chiusa |
| Dettaglio ordine | PARI | Pagina madre `DettaglioOrdine` | Bridge D06 + D05 | Route ufficiale chiusa |
| Lavori da eseguire | PARI | Pagina madre `LavoriDaEseguire` | Bridge D02 + D01 | Route ufficiale chiusa |
| Lavori in attesa | PARI | Pagina madre `LavoriInAttesa` | Bridge D02 + D01 | Route ufficiale chiusa |
| Lavori eseguiti | PARI | Pagina madre `LavoriEseguiti` | Bridge D02 + D01 | Route ufficiale chiusa |
| Dettaglio lavoro | PARI | Pagina madre `DettaglioLavoro` | Bridge D02 | Route ufficiale chiusa |
| Dossier Gomme | PARI | Route clone dedicata gia esistente | Layer NEXT dedicato | Gia chiuso prima del prompt 33 |
| Dossier Rifornimenti | PARI | Route clone dedicata gia esistente | Layer NEXT dedicato | Gia chiuso prima del prompt 33 |

## 5. Moduli ancora non chiusi

| Modulo / Blocco | Stato finale | Motivo reale del blocco | SERVE FILE EXTRA |
| --- | --- | --- | --- |
| Home | NON CHIUSO | UI madre attiva, ma legge ancora autisti/eventi/alert da chiavi raw e contiene writer diretti su `@mezzi_aziendali` e `@storico_eventi_operativi` | `src/pages/Home.tsx` |
| Centro di Controllo | NON CHIUSO | La pagina madre usa ancora `getDoc` diretto per rifornimenti e chiavi autisti raw fuori bridge completo | `src/pages/CentroControllo.tsx` |
| Materiali da ordinare | NON CHIUSO | La pagina madre accede a `@fornitori` e `@ordini` con Firestore diretto e salva ordini dentro la stessa superficie | `src/pages/MaterialiDaOrdinare.tsx` |
| Acquisti / Preventivi / Listino prezzi | NON CHIUSO | Il core procurement madre miscela `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, upload/download Storage e writer nella stessa pagina | `src/pages/Acquisti.tsx` |
| Dossier Lista | NON CHIUSO | La lista madre legge ancora `@mezzi_aziendali` via Firestore diretto | `src/pages/DossierLista.tsx` |
| Dossier Mezzo | NON CHIUSO | Il backbone madre miscela `getDoc/getDocs/setDoc/deleteDoc` su mezzi, lavori, movimenti, costi e collezioni documentali | `src/pages/DossierMezzo.tsx` |
| Analisi Economica | NON CHIUSO | La pagina madre usa Firestore diretto su mezzi, costi, collezioni documentali e salvataggio analisi | `src/pages/AnalisiEconomica.tsx` |
| Capo Mezzi | NON CHIUSO | La pagina madre aggrega mezzi, costi e collezioni documentali via Firestore diretto | `src/pages/CapoMezzi.tsx` |
| Capo Costi Mezzo | NON CHIUSO | La pagina madre legge collezioni documento e approvazioni, poi aggiorna stati reali | `src/pages/CapoCostiMezzo.tsx` |
| Colleghi | NON CHIUSO | La parity esterna richiede la pagina madre, che usa Firestore diretto e writer nella stessa UI | `src/pages/Colleghi.tsx` |
| Fornitori | NON CHIUSO | La parity esterna richiede la pagina madre, che usa Firestore diretto e writer nella stessa UI | `src/pages/Fornitori.tsx` |
| IA Home | NON CHIUSO | L'hub NEXT e ancora una superficie custom, non la pagina madre reale | `src/pages/IA/IAHome.tsx` |
| IA API Key | NON CHIUSO | La pagina madre legge e salva configurazione sensibile via Firestore diretto | `src/pages/IA/IAApiKey.tsx` |
| IA Libretto | NON CHIUSO | La pagina madre usa Firestore diretto e Storage sul perimetro libretto | `src/pages/IA/IALibretto.tsx` |
| IA Documenti | NON CHIUSO | La pagina madre miscela upload Storage, analisi, `addDoc/updateDoc` e salvataggio inventario | `src/pages/IA/IADocumenti.tsx` |
| IA Copertura Libretti | NON CHIUSO | La pagina madre usa Firestore e Storage diretto per repair/upload | `src/pages/IA/IACoperturaLibretti.tsx` |
| Libretti Export | NON CHIUSO | La pagina NEXT e pulita ma non 1:1 con la madre; per parity esatta serve la pagina madre | `src/pages/LibrettiExport.tsx` |
| Cisterna | NON CHIUSO | Il verticale madre usa Firestore diretto su documenti, parametri e dataset cisterna | `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` |
| Cisterna IA | NON CHIUSO | Il verticale IA madre resta montato con banner clone, non chiuso 1:1 sotto layer pulito | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx` |
| Cisterna Schede Test | NON CHIUSO | La pagina madre usa letture Firestore dirette e writer `addDoc/updateDoc/uploadBytes` | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` |
| Autisti / Inbox | NON CHIUSO | Il perimetro usa ancora moduli legacy con Storage/Firestore diretto, foto/upload e logiche locali non unificate sotto un bridge pulito unico | `src/autisti/LoginAutista.tsx`, `src/autisti/HomeAutista.tsx`, `src/autisti/SetupMezzo.tsx`, `src/autisti/CambioMezzoAutista.tsx`, `src/autisti/ControlloMezzo.tsx`, `src/autisti/Segnalazioni.tsx`, `src/autisti/RichiestaAttrezzature.tsx`, `src/autisti/Rifornimento.tsx`, `src/autistiInbox/AutistiAdmin.tsx`, `src/autistiInbox/AutistiInboxHome.tsx` |

## 6. Fuori perimetro
- `Targa 360 / Mezzo360`
- `Autista 360`

Questi blocchi restano esclusi dal conteggio di parita e non abbassano il risultato finale.

## 7. Verifiche eseguite
- `npx eslint src/next/domain/nextManutenzioniDomain.ts src/next/NextLegacyStorageBoundary.tsx src/next/NextManutenzioniPage.tsx src/next/NextGestioneOperativaPage.tsx src/next/NextHomePage.tsx src/next/NextCentroControlloClonePage.tsx src/utils/storageSync.ts src/next/NextInventarioPage.tsx src/next/NextMaterialiConsegnatiPage.tsx src/next/NextOrdiniInAttesaPage.tsx src/next/NextOrdiniArrivatiPage.tsx src/next/NextDettaglioOrdinePage.tsx src/next/NextMezziPage.tsx src/next/NextLavoriDaEseguirePage.tsx src/next/NextLavoriInAttesaPage.tsx src/next/NextLavoriEseguitiPage.tsx src/next/NextDettaglioLavoroPage.tsx src/next/NextAttrezzatureCantieriPage.tsx src/next/NextMotherPage.tsx src/next/nextLegacyStorageOverlay.ts`
- `npm run build`

Entrambe le verifiche risultano `OK`.

## 8. Verdetto finale
- Il prompt 33 non arriva al `100%` del perimetro target.
- Arriva pero alla massima chiusura realistica ottenibile oggi senza toccare la madre:
  - le route ufficiali convertibili sono ora davvero `pari e pulite`;
  - il residuo vero e concentrato in pagine madre che incorporano ancora Firestore/Storage o writer non separabili dal solo `src/next/*`.
- Il prossimo passo non e un altro audit: e autorizzare i file madre elencati in sezione 5 come `SERVE FILE EXTRA` oppure accettare che il clone resti parziale su quei blocchi.
