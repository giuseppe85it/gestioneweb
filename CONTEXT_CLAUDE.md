# CONTEXT_CLAUDE

## 1. STACK TECNICO
- Frontend: React 19.2, React DOM 19.2, TypeScript 5.9, Vite 7.2, React Router DOM 7.9.
- Data layer client: Firebase Web SDK 12.6 (`firestore`, `storage`, `functions`, `auth`).
- Auth attuale: bootstrap con `signInAnonymously()` in `src/App.tsx`; nessun login admin dedicato nel frontend principale.
- Backend e servizi server-side nel repo: Express 5, `body-parser`, `dotenv`, `firebase-admin`, `node-fetch`, OpenAI SDK 6.
- PDF e documenti: `jspdf`, `jspdf-autotable`, `pdf-lib`, `sharp`.
- UI/analisi: `recharts`, `react-easy-crop`.
- Audit/runtime: `playwright`.
- Script root disponibili: `dev`, `build`, `lint`, `preview`, `internal-ai-backend:start`, `internal-ai:observe-next`.
- Script test automatici dedicati: assenti nel `package.json` root.

### Struttura cartelle principali
- `src/pages/*`: app legacy admin/madre.
- `src/next/*`: clone NEXT read-only, shell separata, pages, domini read-only, IA interna, bridge clone-safe.
- `src/next/domain/*`: read model NEXT e accesso dati normalizzato per il clone.
- `src/autisti/*`: app autisti legacy.
- `src/autistiInbox/*`: inbox/admin autisti legacy.
- `src/components/*`: componenti UI condivisi legacy.
- `src/utils/*`: helper condivisi, storage sync, PDF, barrier clone, formattazioni.
- `backend/internal-ai/*`: backend IA separato del sottosistema `/next/ia/interna`.
- `functions/*`: Cloud Functions Firebase legacy.
- `functions-schede/*`: Functions legacy dedicate alla verticale cisterna/schede.
- `api/*`: endpoint edge/serverless separati dal backend IA interno.
- `docs/*`: stato, architettura, dati, audit, change report, continuity report.

## 2. MODULI ESISTENTI
| Modulo | Cosa fa | Stato |
|---|---|---|
| Legacy admin shell | Monta tutte le route principali a `/` e resta la madre operativa di riferimento. | completo |
| Home + Centro di Controllo legacy | Dashboard, alert, priorita, ingressi rapidi ai moduli. | completo |
| Mezzi + Dossier + Analisi legacy | Lista mezzi, dossier per targa, gomme, rifornimenti, analisi economica. | completo |
| Operativita + Lavori legacy | Liste lavori, dettaglio lavoro, workbench operativo globale. | completo |
| Procurement + Magazzino legacy | `Acquisti`, `MaterialiDaOrdinare`, `Ordini`, `DettaglioOrdine`, `Inventario`, `MaterialiConsegnati`, `AttrezzatureCantieri`. | completo |
| Area Capo legacy | Overview mezzi e costi per targa. | completo |
| Anagrafiche legacy | `Colleghi`, `Fornitori`, `Mezzi`. | completo |
| IA legacy | `IAHome`, `IAApiKey`, `IALibretto`, `IADocumenti`, `IACoperturaLibretti`, `LibrettiExport`. | completo |
| Cisterna legacy | Archivio cisterna, IA cisterna, schede test, report mensili. | completo |
| App Autisti legacy | Login, gate, home, setup mezzo, cambio mezzo, controllo, rifornimento, segnalazioni, richiesta attrezzature. | completo |
| Autisti Inbox/Admin legacy | Inbox admin, listati controlli/segnalazioni/gomme/log/richieste e rettifiche. | completo |
| Shell NEXT | Route sotto `/next/*`, shell separata, role preset frontend, redirect tecnici. | in sviluppo |
| NEXT Home + Centro di Controllo | Controparti clone read-only di Home e Centro di Controllo. | in sviluppo |
| NEXT Mezzi + Dossier | Controparti clone di `Mezzi`, `DossierLista`, `DossierMezzo`, `DossierGomme`, `DossierRifornimenti`, `AnalisiEconomica`. | in sviluppo |
| NEXT Operativita globale | Controparti NEXT di `Gestione Operativa`, `Inventario`, `MaterialiConsegnati`, `AttrezzatureCantieri`, con `Lavori` gia scrivente via deroga chirurgica e `Manutenzioni` ora scrivente con vista interna `Mappa storico`. | in sviluppo |
| NEXT Procurement | Modulo unico clone su `/next/materiali-da-ordinare` con tab ordini/arrivi/dettaglio/prezzi/listino. | in sviluppo |
| NEXT Euromecc | Modulo nativo NEXT su `/next/euromecc` con mappa impianto, manutenzioni, problemi, riepilogo, fullscreen area e scrittura reale solo su collection dedicate, inclusa meta area per `tipo cemento` dei sili con nome completo e short label. | in sviluppo |
| NEXT Area Capo + Anagrafiche | Controparti clone di `Capo`, `Colleghi`, `Fornitori`. | in sviluppo |
| NEXT IA hub | Controparti clone di `IA`, `apikey`, `libretto`, `documenti`, `copertura-libretti`, `libretti-export`. | in sviluppo |
| NEXT IA interna universale | Chat controllata, richieste, sessioni, artifacts, audit, registry universale, handoff IA e retriever Euromecc read-only. | in sviluppo |
| NEXT Cisterna | Controparti clone di archivio cisterna, IA cisterna e schede test. | in sviluppo |
| NEXT Autisti + Inbox/Admin | Esperienza autista separata sotto `/next/autisti` e controparti clone di inbox/admin. | in sviluppo |
| Functions/API legacy | Endpoint Firebase/Node/Vercel per IA documentale, PDF e verticale cisterna. | in sviluppo |
| Backend IA separato | Backend server-side dedicato all'IA interna con persistenza locale e provider OpenAI solo server-side. | in sviluppo |

## 3. STATO ATTUALE
- Ultimo task completato: fix mirato della riga `Data / KM-Ore / Fornitore` su `/next/manutenzioni`; il form usa ora una griglia desktop piu pulita con `Data` corta, `KM/Ore` medio-corto e `Fornitore` flessibile, senza toccare logica dati, routing, writer/domain o altre aree del modulo.
- Stato app legacy: attiva e fonte di verita operativa.
- Stato NEXT: perimetro ancora non chiuso come nuova madre, ma non piu interamente read-only; oggi esistono deroghe chirurgiche reali su `Lavori` e `Manutenzioni`.
- Stato build root: `npm run build` = OK.
- Stato lint root: `npm run lint` = KO con 584 problemi totali (568 errori, 16 warning).
- Aree con piu errori lint verificati: `src/autistiInbox/*`, `src/autisti/*`, `src/pages/*`, `src/utils/*`, `api/pdf-ai-enhance.ts`, `pdfEngine.ts`.
- Warning build verificati: bundle client molto grande e doppio uso di `jspdf`.

### In sospeso
- Chiusura reale del perimetro NEXT ancora aperto; il repo non dimostra autonomia completa del clone.
- Matrice permessi reale non definita; il NEXT usa ancora preset frontend simulati via `role`.
- Bridge live Firebase/Storage del backend IA separato ancora chiuso.
- Standardizzazione finale di eventi autisti, allegati preventivi, policy Firestore/Storage e canale backend IA/PDF.

### Cosa e rotto o critico
- `npm run lint` globale fallisce.
- `firestore.rules` e ora presente nel repo e copre esplicitamente il perimetro `Euromecc`, ma la matrice sicurezza per-ruolo dell'app non e ancora dimostrata da claims o login admin dedicati.
- `storage.rules` nel repo e deny-all, ma il codice usa upload/download/listing su molti path Storage reali.
- Esistono piu canali backend per IA/PDF: `functions/*`, `functions-schede/*`, `api/pdf-ai-enhance.ts`, `server.js`, `backend/internal-ai/*`.
- Stream eventi autisti doppio: `@storico_eventi_operativi` e `autisti_eventi`.
- Contratto allegati preventivi non unico: `preventivi/ia/*` e `preventivi/<id>.pdf`.

## 4. DECISIONI ARCHITETTURALI
1. La madre resta l'app operativa a `/`; `src/App.tsx` continua a montare tutte le route legacy.
2. Il clone NEXT vive sotto `/next/*` per coesistere con la madre senza sostituirla.
3. Il clone NEXT resta per default read-only; le scritture sono bloccate da `src/utils/cloneWriteBarrier.ts` salvo deroghe chirurgiche esplicite e motivate.
4. Il clone legge i dati tramite reader dedicati in `src/next/domain/*` e non usa i writer business come canale canonico.
5. L'esperienza autista resta separata dall'admin shell sia in legacy sia in NEXT.
6. L'IA interna del clone e isolata in due perimetri: UI `src/next/internal-ai/*` e backend `backend/internal-ai/*`.
7. Il backend IA separato puo usare provider reali solo lato server e non apre scritture business.
8. Il bridge live del backend IA separato resta chiuso finche credenziali server-side e policy Firestore/Storage non sono verificabili.
9. Il motore PDF condiviso resta `src/utils/pdfEngine.ts`; i moduli generano PDF sopra lo stesso asse comune.
10. Il routing NEXT usa guard frontend (`NextRoleGuard`) e preset `admin/gestionale/autista`; non esiste ancora auth/ACL reale lato prodotto.
11. La route `/next/materiali-da-ordinare` e il modulo procurement canonico del clone; ordini/arrivi/dettaglio/preventivi/listino passano da li.
12. `Euromecc` e un modulo nativo NEXT, non clone della madre, e puo scrivere solo su collection Firestore dedicate.
13. Le collection canoniche del modulo `Euromecc` sono `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`; non usa `storage/@...`.
14. In `euromecc_area_meta` il contratto corrente per i sili supporta `cementType` e `cementTypeShort?`; se la short label manca, il reader NEXT la deriva in fallback senza migrazione distruttiva.
15. In `Euromecc` i dati statici impianto stanno in `src/next/euromeccAreas.ts`; i dati dinamici stanno solo in Firestore.
16. In `Euromecc` le date business usano ISO `yyyy-mm-dd`; `createdAt` / `updatedAt` restano `Timestamp` Firestore.
17. La chat libera `/next/ia/interna` puo leggere `Euromecc` solo tramite il retriever `src/next/internal-ai/internalAiEuromeccReadonly.ts`; nessun writer Euromecc e esposto alla IA.
18. Il boundary Firestore del modulo `Euromecc` e versionato in `firestore.rules`: le collection `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta` hanno `match` espliciti con `request.auth != null` e validazione shape; il fallback del resto Firestore resta sul modello auth attuale e non esiste ancora una chiusura per-ruolo verificabile nel repo.
19. La topologia statica di `Euromecc` in `src/next/euromeccAreas.ts` parte ora neutra (`base: ok`); i warning gialli non devono comparire senza dati reali.
20. `Euromecc` include un pannello discreto `Gestione dati Euromecc` aperto da `Impostazioni` nell'header del modulo; il pannello permette edit/delete reale su `euromecc_issues`, `euromecc_pending`, `euromecc_done`, ma non equivale a sicurezza per-ruolo.
21. Il modulo `Lavori` nel clone NEXT non e piu read-only: usa una dashboard UI unificata sopra il motore reale `@lavori`, ma la deroga al blocco clone-wide e chirurgica e limitata al solo `storageSync.setItemSync("@lavori")` sui pathname Lavori/dettaglio; stato corretto del modulo: `PARZIALE` finche non passa audit separato.
22. Il modulo `Manutenzioni` nel clone NEXT non e piu read-only: `/next/manutenzioni` scrive ora in modo compatibile su `@manutenzioni`, `@inventario` e `@materialiconsegnati`, riusa la convergenza gomme gia verificata e apre solo metadati visuali separati su `@mezzi_foto_viste`, `@mezzi_hotspot_mapping` e Storage `mezzi_foto/...`; stato corretto del modulo: `PARZIALE` finche non passa audit separato.
23. La deroga clone-wide per `Manutenzioni` e limitata al pathname `/next/manutenzioni` e alle sole operazioni `storageSync.setItemSync` sulle 5 chiavi verificate (`@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`) piu `storage.uploadBytes` su `mezzi_foto/...`.
24. `NextMappaStoricoPage` supporta ora due rami dedicati a `/next/manutenzioni`: un ramo `embedded` allineato al mockup con layout a 2 card, card sinistra per vista/hotspot/KPI e card destra per riepilogo mezzo, ultime manutenzioni e azioni rapide, piu un ramo `photoManager` che espone nel form i 4 upload reali `Fronte / Sinistra / Destra / Retro` con preview/placeholder coerenti; upload foto, hotspot e calcoli business restano invariati.
25. L'inferenza zona della `Mappa storico` di `Manutenzioni` non usa piu match generici non pesati per gomme/assi: i termini `gomma/gomme/pneumatico/pneumatici/ruota/ruote/asse/assale` passano prima da un ramo prioritario per `fronte/sinistra/destra/retro`, mentre `fronte-fanali` non usa piu `anteriore` come keyword autonoma; se la direzione non e affidabile, la mappa restituisce `Zona non deducibile`.
26. In `/next/manutenzioni` la UI resta allineata al riferimento approvato ma con perimetro piu corretto: shell esterna e tab scuri, fascia dati chiara a 5 blocchi, dashboard con 4 KPI + 4 pulsanti + `Ultimi interventi`, form grande per `Nuova / Modifica`, dettaglio a 2 card e tab finale `Quadro manutenzioni PDF` su superfici operative chiare; la riga `Data / KM-Ore / Fornitore` usa ora proporzioni desktop stabili `corta / medio-corta / flessibile`, l'autosuggest inventario mette la descrizione materiale davanti al fornitore e la gestione foto non compare piu nel form ma solo in `Dettaglio`.
27. Nel perimetro `Lavori` NEXT la UI mostra ora anche `Segnalato da` e `Autista solito` nelle liste/dettaglio/PDF, l'export PDF resta sul canale condiviso `src/utils/pdfEngine.ts` con layout piu leggibile e la Home `/next` integra un riquadro `Lavori in attesa` nello stesso blocco alert/scadenze, senza aprire nuove scritture fuori dal modulo.
28. `src/next/NextDettaglioLavoroPage.tsx` arricchisce ora il dettaglio con `Problema segnalato` e con il modale read-only della segnalazione autista originale: prima prova `source.type === "segnalazione"` + `source.id/originId`, poi fallback solo su match univoco targa + autore + descrizione; se il match non e sicuro non apre nulla.
29. Il fix successivo sul dettaglio `Lavori` non usa piu solo la vista normalizzata delle segnalazioni: legge anche il payload reale di `@segnalazioni_autisti_tmp` e sfrutta il backlink `linkedLavoroId/linkedLavoroIds`, cosi il blocco `Problema segnalato` mostra davvero il testo reale (`descrizione`, poi `note`, `messaggio`, `dettaglio`, `testo`) quando esiste.
30. Nel dettaglio `Lavori` NEXT il testo della segnalazione origine non deve piu appoggiarsi a `lavoro.dettagli` o `lavoro.note`: il percorso corretto e match forte su `source.id/originId`, poi backlink `linkedLavoroId/linkedLavoroIds`, con messaggio esplicito `Nessuna descrizione presente nella segnalazione originale` se il record trovato non contiene testo.
31. Nel dettaglio `Lavori` NEXT esiste ora anche il ramo `source.type = "controllo"`: il resolver legge `@controlli_mezzo_autisti`, usa come collegamento forte `source.id/originId`, poi solo il backlink reale `linkedLavoroId/linkedLavoroIds`, e mostra il testo origine del controllo con priorita `note`, poi `dettaglio`, poi `messaggio`, piu i KO reali da `check/koItems`; nessun fallback fragile su targa/autore/testo e autorizzato per aprire controlli.
32. Nel modale `Controllo originale` di `Lavori` il close button non deve usare caratteri hardcoded corrotti: il fix corrente usa `&times;` nel JSX con `aria-label` esplicito, cosi il rendering resta stabile e il click continua a chiudere il modale senza toccare la logica.
33. Nel tab `Quadro manutenzioni PDF` di `/next/manutenzioni` la struttura principale non e piu un insieme di card riepilogative: dopo `Step 1` (`Mezzo` / `Compressore`) e `Step 2` (`Ultimo mese`, mesi disponibili, `Tutto`) il runtime mostra un elenco operativo di risultati con foto, targa, modello/compressore, autista solito, `Km ultimo rifornimento`, data manutenzione, tipo/manutenzione e azioni `PDF mezzo` / `PDF compressore` + `Apri dettaglio`; riepilogo rapido e cronologia restano secondari sotto l'elenco.
34. In `/next/manutenzioni` non esistono piu shell legacy o blocchi principali derivati dal canvas sbagliato: header, fascia dati e tab governano tutta la pagina; la `Dashboard` non usa piu card laterali o wrapper extra oltre a 4 KPI, 4 pulsanti e lista finale, mentre il dettaglio embedded mantiene il 2-card specialistico e il quadro PDF resta su step + righe operative.

## 5. CONVENZIONI
### Dati e chiavi
- Collection key-value principale: `storage/<key>`.
- Le chiavi business principali su `storage` usano prefisso `@`, per esempio `@mezzi_aziendali`, `@lavori`, `@manutenzioni`, `@rifornimenti`, `@inventario`, `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, `@colleghi`.
- `@mezzi_aziendali` ha merge speciale in `setItemSync()`; le altre key vengono sovrascritte in blocco.
- Collection dedicate verificate: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@impostazioni_app/gemini`, `@analisi_economica_mezzi`, `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`.
- Collection dedicate modulo nativo NEXT `Euromecc`: `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`.
- Collection visuali NEXT `Manutenzioni`: `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`.
- Local storage autisti verificato: `@autista_attivo_local`, `@mezzo_attivo_autista_local`.

### Date e formati
- Formato data UI canonico: `dd/mm/yyyy`.
- Formato data+ora UI canonico: `dd/mm/yyyy hh:mm`.
- Formato input HTML date: `yyyy-mm-dd`.
- Parser date accetta stringhe UI, ISO, `number`, oggetti con `toDate()` e oggetti con `seconds`.

### Routing e naming
- Legacy admin: route root `/...`.
- Clone NEXT: route `/next/...`.
- App autisti legacy: `/autisti/...`.
- App autisti clone: `/next/autisti/...`.
- Pagine routed NEXT: `src/next/Next*Page.tsx`.
- Reader/domain NEXT: `src/next/domain/next*Domain.ts`.
- Clone state locale NEXT: file `next*CloneState.ts`.
- Path builder NEXT: `src/next/nextStructuralPaths.ts`.

### UI e lingua
- Lingua UI: italiana.
- La madre resta la sorgente di verita della UI; il clone replica la superficie ma non deve aprire side effect business.
- Il clone rileva il runtime tramite path `/next` e blocca fetch mutanti noti (`/api/*`, cloudfunctions write-heavy, extraction libretto).

### Storage path verificati
- `materiali/<materialId>-<timestamp>.<ext>`
- `inventario/<itemId>/foto.jpg`
- `autisti/segnalazioni/<recordId>/<timestamp>_<n>.<ext>`
- `autisti/richieste-attrezzature/<recordId>/<timestamp>.<ext>`
- `mezzi_foto/<targa>/<vista>_<timestamp>.<ext>`
- `mezzi_aziendali/<mezzoId>/libretto.jpg`
- `documenti_pdf/<...>`
- `documenti_pdf/cisterna/<YYYY>/<MM>/<...>`
- `documenti_pdf/cisterna_schede/<YYYY>/<MM>/<...>_crop.jpg`
- `preventivi/ia/<...>`
- `preventivi/<id>.pdf`

## 6. PROSSIMI TASK
0. Fare audit separato del modulo `Manutenzioni` dopo la riapertura in scrittura e la nuova vista `Mappa storico`; oggi non va promosso a `CHIUSO` senza prova extra.
1. Fare audit separato del modulo `Lavori` dopo il redesign unificato e la deroga chirurgica su `cloneWriteBarrier.ts`; oggi non va promosso a `CHIUSO` senza prova extra.
2. Ridurre il debito lint globale; oggi e il problema tecnico piu chiaramente verificabile e diffuso.
3. Estendere oltre `Euromecc` la versione verificabile delle policy Firestore effettive e riallinearle al codice.
4. Riallineare `storage.rules` al perimetro reale usato dai moduli e dai backend.
5. Chiudere il modello sicurezza per-ruolo reale oltre l'attuale bootstrap con auth anonima globale.
6. Fare audit V1 del modulo `Euromecc` prima di promuoverlo oltre `PARZIALE`.
7. Canonicalizzare il flusso eventi autisti scegliendo una sola sorgente tra `@storico_eventi_operativi` e `autisti_eventi`.
8. Canonicalizzare il contratto allegati preventivi e i path Storage del procurement.
9. Continuare l'hardening del clone NEXT sui moduli ancora `ACTIVE_PARTIAL`, soprattutto procurement, area capo, cisterna, autisti admin e IA legacy clone.
10. Chiudere la matrice ruoli/permessi reale oltre ai preset frontend `role`.
11. Consolidare i canali server-side IA/PDF; oggi il repo ha backend multipli concorrenti.
12. Aprire il live-read del backend IA separato solo dopo credenziali server-side dedicate e boundary whitelisted verificati.
13. Ridurre il peso del bundle client e la duplicazione `jspdf` se si apre un task performance.

## 7. FILE CHIAVE
### Routing e bootstrap
- `src/App.tsx`
- `src/main.tsx`
- `src/firebase.ts`

### Legacy madre
- `src/pages/Home.tsx`
- `src/pages/CentroControllo.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/MaterialiDaOrdinare.tsx`
- `src/pages/DettaglioOrdine.tsx`

### Legacy autisti
- `src/autisti/AutistiGate.tsx`
- `src/autisti/HomeAutista.tsx`
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiInboxHome.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`

### Shell NEXT
- `src/next/NextShell.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `src/next/nextStructuralPaths.ts`

### NEXT mezzi e dossier
- `src/next/NextMezziPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`

### NEXT operativita e procurement
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/next-lavori.css`

### NEXT Euromecc
- `src/next/NextEuromeccPage.tsx`
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/euromeccAreas.ts`
- `src/next/next-euromecc.css`

### NEXT home e centro controllo
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextStatoOperativoDomain.ts`

### NEXT IA e IA interna
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiUniversalRegistry.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`

### Shared data, barrier e PDF
- `src/utils/storageSync.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/dateFormat.ts`
- `src/utils/pdfEngine.ts`
- `src/components/PdfPreviewModal.tsx`

### Functions e API
- `functions/index.js`
- `functions/analisiEconomica.js`
- `functions/estrazioneDocumenti.js`
- `functions/iaCisternaExtract.js`
- `functions-schede/index.js`
- `api/pdf-ai-enhance.ts`
- `server.js`

### Documenti sorgente piu utili
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

### Aggiornamento rapido 2026-04-08
- `Manutenzioni` NEXT resta `PARZIALE`.
- Ultimo micro-fix solo UI/CSS sulla tab `Nuova / Modifica`:
  - riga `Data / KM-Ore / Fornitore` resa piu separata e proporzionata;
  - card `Mezzo attivo` con piu stacco verticale dal blocco `Campi base`.
- Nessuna modifica a logica dati, routing, PDF, foto o dominio.

### Aggiornamento rapido 2026-04-08 bis
- La riga `Data / KM-Ore / Fornitore` in `Manutenzioni` NEXT e ora composta da 3 mini-card separate vere nel JSX, non piu da tre soli input affiancati.
- `Mezzo attivo` ha uno stacco verticale piu evidente sopra `Campi base`.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 ter
- Il tentativo a 3 mini-card alte per `Data / KM-Ore / Fornitore` e stato rimosso.
- La riga usa ora 3 field-group compatti e separati, con `Fornitore` flessibile e altezza ridotta.
- `Mezzo attivo` resta rialzato e separato da `Campi base`.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 quater
- Il blocco `Data / KM-Ore / Fornitore` in `Manutenzioni` NEXT e ora fissato nella struttura finale:
  - `man2-metric-row`
  - tre `man2-metric-group` semplici
  - colonne `180px / 180px / minmax(360px, 1fr)`
- Nessuna mini-card e nessun wrapper alto per singolo campo.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 quinquies
- I campi `Data / KM-Ore / Fornitore` riusano ora la stessa base visiva dei controlli corretti del form (`Tipo`, `Sottotipo`).
- Layout e proporzioni della riga restano invariati.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 sexies
- Micro-fix UI su `Manutenzioni` NEXT:
  - rimossa la label sbiadita sopra `Nuova manutenzione`;
  - testata con piu aria a sinistra per ridurre l'impatto del menu flottante;
  - riga `Data / KM-Ore / Fornitore` leggermente ribilanciata a favore del campo centrale.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.

### Aggiornamento rapido 2026-04-08 septies
- La riga `Data / KM-Ore / Fornitore` di `Manutenzioni` NEXT usa ora larghezze fisse desktop `190px / 140px / 260px`.
- `Fornitore` non usa piu `1fr` su desktop.
- Nessuna modifica a logica dati, foto, PDF, `Dettaglio`, routing o dominio.
