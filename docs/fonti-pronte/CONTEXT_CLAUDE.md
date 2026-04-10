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
- `src/next/*`: nuova app NEXT, shell separata, pages, domini, IA interna e bridge clone-safe.
- `src/next/domain/*`: read model NEXT e accesso dati normalizzato per la nuova app.
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
| NEXT Operativita globale | Controparti NEXT di `Gestione Operativa`, `Magazzino` (inventario, materiali consegnati, cisterne AdBlue, documenti e costi read-only) come ingresso pubblico unificato, compat redirect da `Inventario` e `MaterialiConsegnati`, `AttrezzatureCantieri`, con `Lavori` gia scrivente via deroga chirurgica e `Manutenzioni` ora scrivente con vista interna `Mappa storico`. | in sviluppo |
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
- Ultimo task completato: patch strutturale del dominio allargato `Magazzino` NEXT, con tracciabilita documentale completata il `2026-04-10`. `NextMagazzinoPage.tsx` resta il centro operativo unico del dominio su `/next/magazzino`, preserva shape e wrapper reali di `@inventario`, `@materialiconsegnati` e `@cisterne_adblue`, scrive consegne con payload piu compatibile (`inventarioRefId`, `materialeLabel`, `direzione`, `tipo`, `origine`, `targa/mezzoTarga`) e aggiunge una quarta vista `Documenti e costi` in sola lettura con archivio `@documenti_magazzino`, supporto costi materiali, preview procurement e link verso dossier/analisi. I vecchi path `/next/inventario` e `/next/materiali-consegnati` restano solo redirect canonici verso `/next/magazzino?tab=...`. Verifiche runtime gia eseguite nel task precedente: lint mirato `OK`, build `OK`, preview verificata su `/next/magazzino`, `/next/inventario`, `/next/materiali-consegnati` e `?tab=documenti-costi`. Stato modulo: `PARZIALE`.
- Ultimo audit completato: audit strutturale profondo `Magazzino` legacy vs NEXT. Il repo conferma che il dominio reale `Magazzino` della madre e multi-writer e non transazionale: `@inventario` e `@materialiconsegnati` sono dataset storage-style condivisi da piu moduli, mentre `@documenti_magazzino` resta una collection documentale/costi e non il ledger canonico di stock. La nuova vista `Documenti e costi` migliora la copertura del modulo ma non cambia il verdetto finale del dominio, che resta `PARZIALE` fino ad audit separato.
- Ultimo task completato: PROMPT37B - creata la cartella stabile `docs/fonti-pronte/` con copie aggiornate delle fonti chiave del progetto e un indice/overview sintetici. Da ora i documenti sorgente mirrorati in quella cartella vanno sincronizzati nello stesso task quando cambiano. Nessun file runtime toccato.
- Ultimo task completato: PROMPT35 - correzione `Quadro manutenzioni PDF` per il ramo `Compressore`. In `NextManutenzioniPage.tsx` il quadro e l'export PDF locale separano ora davvero le metriche per filtro: `Mezzo` usa `km`, `Compressore` usa `ore`, `Attrezzature` non forza una misura di default ma mostra solo quella presente nel record. Build OK.
- Ultimo task completato: PROMPT34 - fix cross-modulo `Manutenzioni` NEXT. Il bug reale del writer materiali su `@materialiconsegnati` e stato corretto eliminando la doppia scrittura consecutiva e sostituendola con un record unificato per i materiali scaricati da manutenzione; `nextManutenzioniGommeDomain.ts`, `NextGommeEconomiaSection.tsx`, `nextDossierMezzoDomain.ts`, `NextDossierMezzoPage.tsx` e `nextOperativitaGlobaleDomain.ts` valorizzano ora i campi gomme strutturati (`gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`) prima del parsing legacy. Build OK.
- Ultimo task completato: PROMPT33 — Feature A (upload documento originale su Firebase Storage + "Apri documento" nello storico Euromecc) + Feature B (selettore tipo documento, flusso AI lista ricambi, writer ordine su `@ordini`, badge ordine nello storico). Deroghe barrier aggiunte in `cloneWriteBarrier.ts` per `storage.uploadBytes` (euromecc/relazioni/) e `storageSync.setItemSync` (@ordini). Regola aggiunta in `storage.rules` per euromecc/relazioni. Build OK, zero errori TypeScript.
- Stato app legacy: attiva e fonte di verita operativa.
- Stato NEXT: nuovo perimetro applicativo non ancora chiuso come nuova madre; le scritture reali non sono globali ma si aprono modulo per modulo, e oggi esistono moduli gia promossi come `Lavori`, `Manutenzioni`, `Magazzino` ed `Euromecc`.
- Stato build root: `npm run build` = OK.
- Stato lint root: `npm run lint` = KO con 584 problemi totali (568 errori, 16 warning).
- Aree con piu errori lint verificati: `src/autistiInbox/*`, `src/autisti/*`, `src/pages/*`, `src/utils/*`, `api/pdf-ai-enhance.ts`, `pdfEngine.ts`.
- Warning build verificati: bundle client molto grande e doppio uso di `jspdf`.
- In `Manutenzioni` NEXT il km corrente di riferimento per il `Dettaglio` continua a derivare dal reader canonico rifornimenti `readNextRifornimentiReadOnlySnapshot()` gia usato nella pagina parent.
- In `Manutenzioni` NEXT il `Dettaglio` embedded mostra ora solo le viste tecniche `Sinistra / Destra` del mezzo e un box `Manutenzione selezionata`; nessun controllo di calibrazione, marker o overlay tecnico resta visibile nel runtime del modulo.
- In `Manutenzioni` NEXT l'export locale del `Quadro manutenzioni PDF` usa `jsPDF` + `jspdf-autotable` nel modulo stesso e, per export a targa singola, inserisce in testata la foto reale del mezzo presa da `mezzoPreview.fotoUrl`; se la foto manca, usa un fallback neutro senza inventare immagini.
- In `Manutenzioni` NEXT il quadro, il Dossier principale, il Dossier Gomme e `Operativita` leggono ora in modo piu coerente i campi strutturati gomme (`gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`), ma il modulo resta `PARZIALE` perche la parity complessiva con madre/PDF e i boundary cross-modulo richiedono ancora verifica separata.

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
2. La NEXT vive sotto `/next/*` per coesistere con la madre senza sostituirla.
3. La NEXT non e globalmente `read-only`: le scritture reali si aprono modulo per modulo, solo quando il perimetro dati e dichiarato e il controllo e allineato nel barrier.
4. `src/utils/cloneWriteBarrier.ts` e il punto di controllo esplicito per abilitare o negare le scritture della NEXT; non esiste alcun widening globale.
5. La NEXT legge i dati tramite reader e domain dedicati in `src/next/domain/*` e apre writer solo quando il modulo e promosso in modo esplicito.
6. L'esperienza autista resta separata dall'admin shell sia in legacy sia in NEXT.
7. L'IA interna della NEXT e isolata in due perimetri: UI `src/next/internal-ai/*` e backend `backend/internal-ai/*`.
8. Il backend IA separato puo usare provider reali solo lato server e non apre scritture business.
9. Il bridge live del backend IA separato resta chiuso finche credenziali server-side e policy Firestore/Storage non sono verificabili.
10. Il motore PDF condiviso resta `src/utils/pdfEngine.ts`; i moduli generano PDF sopra lo stesso asse comune.
11. Il routing NEXT usa guard frontend (`NextRoleGuard`) e preset `admin/gestionale/autista`; non esiste ancora auth/ACL reale lato prodotto.
12. La route `/next/materiali-da-ordinare` e il modulo procurement canonico della NEXT; ordini/arrivi/dettaglio/preventivi/listino passano da li.
13. `Euromecc` e un modulo nativo NEXT, non clone della madre, e puo scrivere solo su collection Firestore dedicate.
14. Le collection canoniche del modulo `Euromecc` sono `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`; non usa `storage/@...`.
15. In `euromecc_area_meta` il contratto corrente per i sili supporta `cementType` e `cementTypeShort?`; se la short label manca, il reader NEXT la deriva in fallback senza migrazione distruttiva.
16. In `Euromecc` i dati statici impianto stanno in `src/next/euromeccAreas.ts`; i dati dinamici stanno solo in Firestore.
17. In `Euromecc` le date business usano ISO `yyyy-mm-dd`; `createdAt` / `updatedAt` restano `Timestamp` Firestore.
18. La chat libera `/next/ia/interna` puo leggere `Euromecc` solo tramite il retriever `src/next/internal-ai/internalAiEuromeccReadonly.ts`; nessun writer Euromecc e esposto alla IA.
19. Il boundary Firestore del modulo `Euromecc` e versionato in `firestore.rules`: le collection `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta` hanno `match` espliciti con `request.auth != null` e validazione shape; il fallback del resto Firestore resta sul modello auth attuale e non esiste ancora una chiusura per-ruolo verificabile nel repo.
20. La topologia statica di `Euromecc` in `src/next/euromeccAreas.ts` parte ora neutra (`base: ok`); i warning gialli non devono comparire senza dati reali.
21. `Euromecc` include un pannello discreto `Gestione dati Euromecc` aperto da `Impostazioni` nell'header del modulo; il pannello permette edit/delete reale su `euromecc_issues`, `euromecc_pending`, `euromecc_done`, ma non equivale a sicurezza per-ruolo.
22. Il modulo `Lavori` nel clone NEXT non e piu read-only: usa una dashboard UI unificata sopra il motore reale `@lavori`, ma la deroga al blocco clone-wide e chirurgica e limitata al solo `storageSync.setItemSync("@lavori")` sui pathname Lavori/dettaglio; stato corretto del modulo: `PARZIALE` finche non passa audit separato.
23. Il modulo `Manutenzioni` nel clone NEXT non e piu read-only: `/next/manutenzioni` scrive ora in modo compatibile su `@manutenzioni`, `@inventario` e `@materialiconsegnati`, riusa la convergenza gomme gia verificata, salva `assiCoinvolti?: string[]`, `gommePerAsse?: { asseId; dataCambio; kmCambio }[]`, `gommeInterventoTipo?: "ordinario" | "straordinario"` e `gommeStraordinario?: { asseId; quantita; motivo }` in modo clone-side retrocompatibile, esclude gli eventi straordinari dal calcolo dello stato gomme per asse e, dopo PROMPT34, usa un solo writer coerente per `@materialiconsegnati` senza sovrascrivere il primo payload; apre solo metadati visuali separati su `@mezzi_foto_viste`, `@mezzi_hotspot_mapping` e Storage `mezzi_foto/...`; stato corretto del modulo: `PARZIALE` finche non passa audit separato.
24. La deroga clone-wide per `Manutenzioni` e limitata al pathname `/next/manutenzioni` e alle sole operazioni `storageSync.setItemSync` sulle 5 chiavi verificate (`@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`) piu `storage.uploadBytes` su `mezzi_foto/...`.
25. Il modulo `/next/magazzino` e una pagina NEXT nativa con 4 viste interne `Inventario` / `Materiali consegnati` / `Cisterne AdBlue` / `Documenti e costi`; preserva shape e wrapper reali dei dataset storage-style `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, espone costi/documenti/procurement solo in sola lettura e usa una deroga chirurgica di `cloneWriteBarrier.ts` limitata al pathname `/next/magazzino` e agli upload su `inventario/*`.
26. Nel dominio `Magazzino` della NEXT l'ingresso pubblico principale e ora solo `/next/magazzino`; i vecchi path `/next/inventario` e `/next/materiali-consegnati` restano attivi solo come redirect `replace` di compatibilita verso il modulo unificato con `?tab=...`, senza montare piu i moduli separati come entrypoint runtime principali.
27. `NextMappaStoricoPage` supporta ora due rami dedicati a `/next/manutenzioni`: un ramo `embedded` con layout a 2 card, card sinistra per viste tecniche `Sinistra / Destra` da `public/gomme/*` (fallback foto solo se manca la tavola tecnica) + riepilogo manutenzione selezionata e card destra per riepilogo mezzo, ultime manutenzioni e azioni rapide, piu il ramo standalone della mappa che mantiene gestione hotspot/foto fuori da questo task.
28. L'inferenza zona della `Mappa storico` di `Manutenzioni` non usa piu match generici non pesati per gomme/assi: i termini `gomma/gomme/pneumatico/pneumatici/ruota/ruote/asse/assale` passano prima da un ramo prioritario per `fronte/sinistra/destra/retro`, mentre `fronte-fanali` non usa piu `anteriore` come keyword autonoma; se la direzione non e affidabile, la mappa restituisce `Zona non deducibile`.
29. In `/next/manutenzioni` la UI resta allineata al riferimento approvato ma con perimetro piu corretto: shell esterna e tab scuri, fascia dati chiara a 5 blocchi, dashboard con 4 KPI + 4 pulsanti + `Ultimi interventi`, form grande per `Nuova / Modifica`, dettaglio a 2 card e tab finale `Quadro manutenzioni PDF` su superfici operative chiare; la riga `Data / KM-Ore / Fornitore` usa proporzioni desktop stabili, l'autosuggest inventario mette la descrizione materiale davanti al fornitore, il `Dettaglio` embedded mostra solo viste tecniche `Sinistra / Destra` pulite con riepilogo del record selezionato e il quadro espone una ricerca rapida visibile per `targa / autista`.
30. Nel perimetro `Lavori` NEXT la UI mostra ora anche `Segnalato da` e `Autista solito` nelle liste/dettaglio/PDF, l'export PDF resta sul canale condiviso `src/utils/pdfEngine.ts` con layout piu leggibile e la Home `/next` integra un riquadro `Lavori in attesa` nello stesso blocco alert/scadenze, senza aprire nuove scritture fuori dal modulo.
31. `src/next/NextDettaglioLavoroPage.tsx` arricchisce ora il dettaglio con `Problema segnalato` e con il modale read-only della segnalazione autista originale: prima prova `source.type === "segnalazione"` + `source.id/originId`, poi fallback solo su match univoco targa + autore + descrizione; se il match non e sicuro non apre nulla.
32. Il fix successivo sul dettaglio `Lavori` non usa piu solo la vista normalizzata delle segnalazioni: legge anche il payload reale di `@segnalazioni_autisti_tmp` e sfrutta il backlink `linkedLavoroId/linkedLavoroIds`, cosi il blocco `Problema segnalato` mostra davvero il testo reale (`descrizione`, poi `note`, `messaggio`, `dettaglio`, `testo`) quando esiste.
33. Nel dettaglio `Lavori` NEXT il testo della segnalazione origine non deve piu appoggiarsi a `lavoro.dettagli` o `lavoro.note`: il percorso corretto e match forte su `source.id/originId`, poi backlink `linkedLavoroId/linkedLavoroIds`, con messaggio esplicito `Nessuna descrizione presente nella segnalazione originale` se il record trovato non contiene testo.
34. Nel dettaglio `Lavori` NEXT esiste ora anche il ramo `source.type = "controllo"`: il resolver legge `@controlli_mezzo_autisti`, usa come collegamento forte `source.id/originId`, poi solo il backlink reale `linkedLavoroId/linkedLavoroIds`, e mostra il testo origine del controllo con priorita `note`, poi `dettaglio`, poi `messaggio`, piu i KO reali da `check/koItems`; nessun fallback fragile su targa/autore/testo e autorizzato per aprire controlli.
35. Nel modale `Controllo originale` di `Lavori` il close button non deve usare caratteri hardcoded corrotti: il fix corrente usa `&times;` nel JSX con `aria-label` esplicito, cosi il rendering resta stabile e il click continua a chiudere il modale senza toccare la logica.
36. Nel tab `Quadro manutenzioni PDF` di `/next/manutenzioni` la struttura principale non e piu un insieme di card riepilogative: dopo `Step 1` (`Mezzo` / `Compressore` / `Attrezzature`) e `Step 2` (`Ultimo mese`, mesi disponibili, `Tutto`) il runtime mostra un elenco operativo di risultati con foto, targa, modello/compressore, autista solito, `Km ultimo rifornimento`, data manutenzione, tipo/manutenzione e azioni `PDF mezzo` / `PDF compressore` + `Apri dettaglio`; per i risultati `Mezzo` espone anche lo stato gomme finale per asse, con focus su data e km percorsi per i mezzi motorizzati e focus sulla data per rimorchi/semirimorchi.
37. In `/next/manutenzioni` non esistono piu shell legacy o blocchi principali derivati dal canvas sbagliato: header, fascia dati e tab governano tutta la pagina; la `Dashboard` non usa piu card laterali o wrapper extra oltre a 4 KPI, 4 pulsanti e lista finale, mentre il dettaglio embedded mantiene il 2-card specialistico e il quadro PDF resta su step + righe operative.
38. In `/next/manutenzioni` il tab `Dettaglio` embedded non mostra piu `Calibra`, marker, hotspot o overlay nel viewer principale: la superficie visiva del mezzo usa la tavola tecnica da `public/gomme/*` sulle sole viste `Sinistra / Destra`, con fallback alla foto solo se necessario.
39. In `/next/manutenzioni` il binding del viewer tecnico e ora esplicito: `NextManutenzioniPage` mantiene `selectedDetailRecordId`, passa a `NextMappaStoricoPage` il record selezionato e aggiorna il dettaglio da `Dashboard`, `Quadro manutenzioni PDF` e liste storico laterali, senza fallback alla "ultima manutenzione con assi".
40. Nel `Quadro manutenzioni PDF` di `/next/manutenzioni` le metriche sono ora filtro-dipendenti: `Mezzo` usa `km`, `Compressore` usa `ore`, `Attrezzature` non forza `km/ore` se il record non le contiene; anche l'export locale PDF allinea l'intestazione misura al filtro attivo.
41. In `/next/manutenzioni` il form `Nuova / Modifica` espone ora davvero 3 tipi intervento (`Mezzo`, `Compressore`, `Attrezzature`) e `src/next/domain/nextManutenzioniDomain.ts` accetta in modo retrocompatibile il nuovo valore `attrezzature`.
42. In `/next/manutenzioni` il comando `Calibra` e tutta la UI collegata sono stati rimossi dal ramo `embedded` del tab `Dettaglio`.
43. In `/next/domain/nextMappaStoricoDomain.ts` non esistono piu read/write degli override tecnici clone-side usati solo dal vecchio viewer `Calibra`; per `Manutenzioni` restano solo foto vista e hotspot del ramo mappa standalone.
44. In `/next/manutenzioni` il sottotipo gomme non e piu unico: `Gomme ordinarie per asse` aggiorna solo lo stato gomme leggibile per asse, mentre `Gomme straordinarie` salva un evento puntuale con motivo esplicito e compare nel quadro PDF in una sezione separata, senza essere assorbito nel rinnovo ordinario.
45. In `/next/manutenzioni` la microcopy fissa di dashboard, form, quadro e dettaglio e stata ridotta al minimo operativo; le spiegazioni residue passano da `title` / `aria-label` sui controlli principali, con supporto hover/focus senza pannelli guida permanenti.
46. Nel dominio `Magazzino` reale non esiste ancora un modello transazionale condiviso: `@inventario` e `@materialiconsegnati` restano dataset storage-style multi-writer, con writer legacy/NEXT multipli e matching non uniformi tra i moduli.
47. `@documenti_magazzino` non e il ledger canonico del magazzino: nel repo e usato come archivio documentale e come supporto alla ricostruzione costi materiali in `Dossier` e analisi; `NextMagazzinoPage.tsx` lo espone ora in sola lettura nella vista `Documenti e costi`, ma non apre writer nuovi e non lo trasforma in sorgente transazionale canonica.

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

### Documentazione pronta
- `docs/fonti-pronte/` raccoglie copie aggiornate delle fonti chiave da usare nelle nuove chat.
- Se un file sorgente gia mirrorato viene aggiornato, la sua copia in `docs/fonti-pronte/` va aggiornata nello stesso task.

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

### Aggiornamento rapido 2026-04-08 octies
- Il viewer tecnico di `Manutenzioni` NEXT usa ora `mezziHotspotAreas.ts` come tassonomia reale dei target (`assi`, `fanali_specchi`, `attrezzature`).
- In vista normale non compaiono piu cerchi neutrali permanenti; `Calibra` mostra invece preview asse e grammatica target solo quando richiesto.
- `Fronte/Retro` restano invariati sul fallback foto/hotspot.

### Aggiornamento rapido 2026-04-08 nonies
- Il tab `Dettaglio` di `Manutenzioni` NEXT non pesca piu gli assi da una manutenzione implicita del mezzo.
- Il parent mantiene ora un `selectedDetailRecordId` esplicito e il viewer tecnico legge solo il record aperto.
- Se il record aperto non ha `assiCoinvolti`, il viewer resta pulito.
