# AUDIT PRE SPEC FINALE IA2

## 1. Scopo del documento

Questo documento serve a chiarire cosa manca ancora sapere, in modo verificato, prima di congelare la SPEC finale della nuova IA 2 Archivista.

Base usata:
- codice reale del repo;
- documenti ufficiali di stato;
- audit precedenti solo come contesto, mai come prova finale se il codice dice altro.

Nota pratica:
- nel prompt alcuni audit erano indicati sotto `docs/audit/`, ma nel repo reale `AUDIT_ULTIMI_5_BUCHI_PRE_IA2.md`, `AUDIT_CAMPI_REALI_PER_TEMPLATE_IA2.md`, `AUDIT_BUCHI_COSTIMEZZO_E_DOCUMENTI_MEZZO.md` e `AUDIT_TOTALE_IA_E_DOCUMENTI_MADRE_NEXT.md` esistono in `docs/product/`.

Regola usata qui:
- `FATTO VERIFICATO` = supportato direttamente dal codice.
- `DEDUZIONE PRUDENTE` = conclusione stretta che il codice suggerisce, senza inventare.
- `DECISIONE CONSIGLIATA` = scelta piu sicura e pulita, coerente con il repo e con la direzione desiderata dall’utente.

## 2. Decisioni già abbastanza chiare

- `FATTO VERIFICATO` Oggi il repo non ha ancora due strumenti davvero separati. `/next/ia/interna` mescola chat, allegati, orchestrazione e vecchio motore documentale `useIADocumentiEngine()` (`src/next/NextInternalAiPage.tsx:4242-4247`, `:4445-4446`, `:7583-7898`, `:8429-8447`).
- `FATTO VERIFICATO` Il backend OpenAI nuovo non e ancora un archivista universale: il prompt attuale e centrato su “review Magazzino” (`backend/internal-ai/server/internal-ai-document-extraction.js:782-843`).
- `FATTO VERIFICATO` Il motore legacy Gemini e ancora vivo e usato dal flusso documentale storico (`functions/estrazioneDocumenti.js:28-54`; `src/pages/IA/IADocumenti.tsx:381-411`).
- `FATTO VERIFICATO` L’unico archivio documentale generale gia esistente e davvero scrivente nel repo e il trittico `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, alimentato da `IADocumenti` (`src/pages/IA/IADocumenti.tsx:498-537`).
- `FATTO VERIFICATO` `@costiMezzo` viene letto in piu moduli ma nel runtime letto non mostra un writer additivo; emerge solo una cancellazione con riscrittura filtrata (`src/pages/DossierMezzo.tsx:741-748`).
- `FATTO VERIFICATO` I documenti mezzo oggi vivono soprattutto dentro il record `@mezzi_aziendali`: assicurazione, revisione, collaudo, libretto, foto (`src/pages/Mezzi.tsx:696-787`; `src/pages/Home.tsx:1177-1317`; `src/pages/IA/IALibretto.tsx:398-473`; `src/pages/IA/IACoperturaLibretti.tsx:425-450`, `:510-526`).
- `FATTO VERIFICATO` La gestione duplicati non esiste in modo generale. Esiste davvero solo in due posti: cisterna con scelta tra documenti duplicati (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:739-963`) e sostituzione PDF di un preventivo (`src/pages/Acquisti.tsx:4030-4050`, `:5154`).
- `FATTO VERIFICATO` Sul path `/next/ia/interna` la barrier apre in modo esplicito solo il `POST` a `estrazioneDocumenti` e uno scope inline su `@inventario`; non apre in modo esplicito `@documenti_*`, `@manutenzioni`, `@costiMezzo`, `@mezzi_aziendali`, `@preventivi` (`src/utils/cloneWriteBarrier.ts:43-46`, `:145-154`, `:171-199`, `:193-278`).
- `DEDUZIONE PRUDENTE` Prima della SPEC finale non manca piu la mappa dei pezzi. Manca invece la scelta di quali collezioni devono diventare “archivio primario” per ogni famiglia e di quali scritture business devono restare fuori da IA 2.

## 3. Punti ancora da chiarire prima della SPEC finale

- Va deciso se `@preventivi` deve essere trattato come archivio valido anche per i preventivi manutenzione, oppure se i preventivi manutenzione devono prima passare da archivio documento mezzo.
- Va deciso se una fattura manutenzione, dopo archiviazione, debba solo proporre una manutenzione oppure possa crearla davvero su conferma.
- Va deciso se `@costiMezzo` debba restare un dataset derivato/legacy oppure diventare un target esplicito della nuova IA. Oggi il repo non lo prova.
- Va deciso se i documenti mezzo debbano continuare a vivere solo nel record mezzo, oppure se l’originale debba sempre essere archiviato e poi collegato al mezzo.
- Va deciso se `Cisterna`, `Euromecc` e `Carburante` rientrano davvero nella prima SPEC di IA 2, oppure restano verticali separati.
- Va deciso se la logica “archivia prima, azione business dopo” debba valere sempre o solo per alcune famiglie. Il repo oggi e misto.
- Va deciso se il futuro archivista debba parlare solo con collezioni archivio e lasciare tutte le scritture business ai moduli target, oppure se debba avere alcune conferme scriventi dirette e strette.

## 4. Blocco 1 — destinazione reale delle 8 famiglie documentali

### 4.1 Fattura/DDT magazzino

- `Cosa vuole l’utente` Caricare il documento, vedere i dati letti, confermare l’archiviazione e solo dopo decidere se collegarlo allo stock.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Il file originale viene caricato in Storage sotto `documenti_pdf/<timestamp>_<nomefile>` e il record viene scritto in `@documenti_magazzino` quando la categoria finale e `MAGAZZINO` (`src/pages/IA/IADocumenti.tsx:498-537`). Nel NEXT la vista Magazzino tratta queste fatture solo come documenti supporto e puo proporre due sole azioni controllate: `riconcilia senza carico` oppure `carica stock AdBlue` (`src/next/NextMagazzinoPage.tsx:4438-4485`; `src/next/internal-ai/internalAiUniversalHandoff.ts:577-630`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi finisce in `documenti_pdf/...` (`src/pages/IA/IADocumenti.tsx:498-504`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi finiscono in `@documenti_magazzino` (`src/pages/IA/IADocumenti.tsx:529-537`).
- `Effetto business eventuale` `FATTO VERIFICATO` Nel vecchio motore esiste anche import in `@inventario` (`src/pages/IA/IADocumenti.tsx:604-731`). Nel NEXT esiste un effetto business piu stretto nel modulo Magazzino, non nella chat libera (`src/next/NextMagazzinoPage.tsx:4438-4562`; `src/next/internal-ai/internalAiMagazzinoControlledActions.ts:917-987`).
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` se la SPEC finale debba mantenere un import diretto inventario dall’archivista oppure obbligare sempre il passaggio dal modulo Magazzino.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Per questa famiglia la base piu sicura e gia pronta: archivio primario `@documenti_magazzino`, poi eventuale azione business solo dopo conferma e dentro il perimetro Magazzino.

### 4.2 Fattura manutenzione

- `Cosa vuole l’utente` Archiviare una fattura officina riferita a un mezzo e, solo se conferma, creare o aggiornare il fatto manutentivo giusto.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Il motore legacy puo salvare il documento come `@documenti_mezzi` quando la categoria e `MEZZO` (`src/pages/IA/IADocumenti.tsx:529-537`). Il writer manutenzioni e separato e scrive `@manutenzioni` (`src/pages/Manutenzioni.tsx:345-362`; `src/next/domain/nextManutenzioniDomain.ts:910-924`). Nel NEXT esiste un ponte manuale da fattura dossier a manutenzione con `sourceDocumentId` (`src/next/NextDossierFatturaToManutenzioneModal.tsx:238-248`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi, se passa dal motore documentale, il file originale finisce in `documenti_pdf/...` (`src/pages/IA/IADocumenti.tsx:498-504`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi i dati estratti finiscono in `@documenti_mezzi` (`src/pages/IA/IADocumenti.tsx:529-537`). `DEDUZIONE PRUDENTE` Il record manutenzione nasce solo in un secondo momento e con un altro writer.
- `Effetto business eventuale` `FATTO VERIFICATO` Oggi non esiste un automatismo generale documento -> manutenzione. Esiste il writer manutenzione, ed esiste un caso dossier che passa `sourceDocumentId`, ma non un flusso IA 2 gia pronto (`src/next/NextDossierFatturaToManutenzioneModal.tsx:238-248`; `src/next/domain/nextManutenzioniDomain.ts:781`, `:910-924`).
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` se una fattura manutenzione debba sempre produrre anche un costo mezzo, e se questo debba accadere sempre o solo su conferma.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Archivio primario `@documenti_mezzi`; eventuale creazione di `@manutenzioni` solo su conferma esplicita, con legame `sourceDocumentId`; nessun uso di `@costiMezzo` come destinazione primaria finche il writer additivo non e dimostrato.

### 4.3 Preventivo magazzino

- `Cosa vuole l’utente` Caricare il preventivo, rivedere righe e fornitore, confermare e farlo diventare una base ufficiale per procurement e listino.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Il flusso preventivi usa percorsi Storage dedicati `preventivi/ia/...` per l’estrazione e `preventivi/<id>.pdf` per il file finale (`src/pages/Acquisti.tsx:3458-3496`, `:3665-3695`, `:4030-4050`). Il record ufficiale viene scritto in `@preventivi` (`src/pages/Acquisti.tsx:2723-2729`, `:3665-3701`). Il listino puo essere aggiornato in `@listino_prezzi` (`src/pages/Acquisti.tsx:2734-2740`, `:3927-3965`, `:5362-5373`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi il file finisce in `preventivi/ia/...` nella fase estrazione e poi in `preventivi/<id>.pdf` nel salvataggio finale (`src/pages/Acquisti.tsx:3458-3496`, `:3665-3668`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi finiscono in `@preventivi`; parte del valore business puo riflettersi in `@listino_prezzi` (`src/pages/Acquisti.tsx:2723-2740`, `:3665-3701`, `:3927-3965`).
- `Effetto business eventuale` `FATTO VERIFICATO` Il preventivo non e solo archivio: alimenta procurement e listino (`src/pages/Acquisti.tsx:3927-3965`).
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` se, nel disegno futuro “archivia prima”, `@preventivi` debba essere considerato archivio sufficiente oppure se serva prima un archivio documento separato.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Se questa famiglia entra in IA 2, la scelta piu pulita senza inventare nuovi posti e usare `@preventivi` come record confermato della famiglia e lasciare l’eventuale aggiornamento del listino come secondo passo separato.

### 4.4 Preventivo manutenzione

- `Cosa vuole l’utente` Caricare un preventivo officina riferito a un mezzo e decidere poi se usarlo come riferimento costo o approvazione.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Il repo ha `@preventivi`, `@preventivi_approvazioni` e `@listino_prezzi`, ma il ciclo completo e molto centrato su procurement (`src/pages/Acquisti.tsx:2723-2740`, `:3665-3701`; `src/pages/CapoCostiMezzo.tsx:635-648`). `DEDUZIONE PRUDENTE` Il dossier e il capo leggono questi dati, ma non emerge un writer pulito e dedicato al “preventivo manutenzione” come famiglia autonoma.
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi, se passa da Acquisti, il file vive sotto `preventivi/...` (`src/pages/Acquisti.tsx:3458-3496`, `:3665-3668`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi i dati business veri stanno in `@preventivi`; l’esito approvativo sta in `@preventivi_approvazioni` (`src/pages/Acquisti.tsx:2723-2729`; `src/pages/CapoCostiMezzo.tsx:635-648`).
- `Effetto business eventuale` `FATTO VERIFICATO` Oggi puo esserci approvazione, ma non emerge una strada uniforme e dedicata al caso manutenzione (`src/pages/CapoCostiMezzo.tsx:635-648`).
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` quale debba essere il target canonico della famiglia: `@preventivi`, archivio mezzo, oppure doppio livello archivio + approvazione.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Questa e ancora una famiglia da chiarire prima della SPEC finale. Il repo non offre ancora un target manutenzione abbastanza netto da congelare senza rischio.

### 4.5 Documento mezzo

- `Cosa vuole l’utente` Archiviare libretto, assicurazione, revisione o collaudo di un mezzo e poi aggiornare il mezzo con i dati confermati.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Oggi questi dati vivono soprattutto nel record `@mezzi_aziendali`. Foto mezzo: `mezzi/<targa>_<ts>.jpg`; libretto: `mezzi_aziendali/<mezzoId>/libretto.jpg`; campi come `assicurazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `librettoUrl`, `librettoStoragePath` stanno sul mezzo (`src/pages/Mezzi.tsx:679-787`; `src/pages/Home.tsx:1177-1317`; `src/pages/IA/IALibretto.tsx:398-473`; `src/pages/IA/IACoperturaLibretti.tsx:425-450`, `:510-526`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Libretto e foto hanno path Storage propri (`src/pages/Mezzi.tsx:679-689`; `src/pages/IA/IALibretto.tsx:435-440`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi finiscono dentro `@mezzi_aziendali`, non in una collection archivio dedicata (`src/pages/Mezzi.tsx:696-787`; `src/pages/Home.tsx:1177-1317`; `src/pages/IA/IALibretto.tsx:437-473`).
- `Effetto business eventuale` `FATTO VERIFICATO` Il mezzo viene aggiornato direttamente. Nel NEXT equivalente le modali scadenze sono ancora read-only (`src/next/components/NextScadenzeModal.tsx:311-351`).
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` se il futuro archivista debba accettare che questi documenti restino solo “dentro il mezzo”, oppure se debba introdurre anche un vero archivio degli originali.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Per coerenza con “archivia prima”, la scelta piu pulita e `archivio documento + link al mezzo + aggiornamento campi mezzo su conferma`. Restare “solo record mezzo” replica il presente ma non un vero archivio documentale.

### 4.6 Cisterna AdBlue

- `Cosa vuole l’utente` Caricare fatture o bollettini cisterna, archiviare il documento giusto e poi usarlo nel verticale cisterna.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Il verticale legacy `CisternaCaravateIA` carica il file in `documenti_pdf/cisterna/<anno>/<mese>/...` e salva un documento in `@documenti_cisterna` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:257-355`). Il verticale cisterna ha anche una gestione reale dei duplicati bollettini con `dupChosen` e `dupIgnored` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:739-963`). Nel NEXT la pagina `NextCisternaIAPage` dichiara il salvataggio bloccato (`src/next/NextCisternaIAPage.tsx:164-177`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi in `documenti_pdf/cisterna/...` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:257`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi in `@documenti_cisterna` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:354-355`).
- `Effetto business eventuale` `DEDUZIONE PRUDENTE` Il documento resta soprattutto nel verticale cisterna; non emerge qui un writer business generale fuori dal verticale.
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` se questa famiglia debba entrare davvero nella prima IA 2 o restare verticale separato.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Se la si include, la strada meno rischiosa e mantenerla specialistica: archivio `@documenti_cisterna`, non forzarla dentro il trittico generale.

### 4.7 Euromecc

- `Cosa vuole l’utente` Caricare un documento tecnico Euromecc, archiviarlo, e solo dopo decidere se creare ordine o aggiungere componenti.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` `NextEuromeccPage` salva relazioni in `euromecc_relazioni`, puo caricare l’originale in `euromecc/relazioni/...`, puo creare ordini in `@ordini` e componenti extra in `euromecc_extra_components` (`src/next/NextEuromeccPage.tsx:2976-3033`, `:3079-3181`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi in `euromecc/relazioni/<id>/<timestamp>_<nomefile>` (`src/next/NextEuromeccPage.tsx:3163-3174`).
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi in `euromecc_relazioni`, piu eventualmente `euromecc_extra_components` (`src/next/NextEuromeccPage.tsx:2980-3033`, `:3116`, `:3181`).
- `Effetto business eventuale` `FATTO VERIFICATO` Può creare un ordine in `@ordini` (`src/next/NextEuromeccPage.tsx:2992-3023`).
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` se Euromecc debba rientrare nell’archivista generale o restare un verticale con ingresso e regole proprie.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Trattarlo come verticale separato e non come famiglia standard della prima IA 2. Qui il repo ha gia un suo mondo chiaro.

### 4.8 Carburante

- `Cosa vuole l’utente` Archiviare eventuali documenti carburante e collegarli ai rifornimenti del mezzo.
- `Cosa esiste oggi davvero` `FATTO VERIFICATO` Il repo mostra dataset dati `@rifornimenti` e `@rifornimenti_autisti_tmp`, ma non mostra un archivio documentale o un path Storage dedicato ai file carburante (`src/pages/RifornimentiEconomiaSection.tsx:197-198`; ricerche repo mirate senza match su path file carburante). La pagina NEXT autisti di rifornimento e ancora read-only (`src/next/autisti/NextAutistiRifornimentoPage.tsx:118-149`).
- `Dove finirebbe il file` `FATTO VERIFICATO` Oggi non emerge un posto ufficiale dove finirlo.
- `Dove finirebbero i dati` `FATTO VERIFICATO` Oggi esistono solo dataset rifornimenti, non un archivio documento carburante verificato.
- `Effetto business eventuale` `DEDUZIONE PRUDENTE` Il dominio carburante esiste come dati operativi, ma non come archivio documentale.
- `Cosa non è ancora abbastanza chiaro` `NON DETERMINABILE` la destinazione futura del file originale e il rapporto tra documento carburante e record rifornimento.
- `Decisione consigliata` `DECISIONE CONSIGLIATA` Questa famiglia non e pronta per entrare nella SPEC finale senza una decisione esplicita sulla sua destinazione archivio.

## 5. Blocco 2 — costo mezzo

- `FATTO VERIFICATO` Nel runtime letto non emerge un writer additivo che crei nuovi record in `@costiMezzo`. Emerge solo una cancellazione con riscrittura filtrata in `DossierMezzo` (`src/pages/DossierMezzo.tsx:741-748`).
- `FATTO VERIFICATO` `@costiMezzo` viene letto da dossier, capo, analisi economica e layer NEXT documenti/costi (`src/pages/DossierMezzo.tsx:550-565`; `src/pages/CapoMezzi.tsx:273-328`; `src/pages/CapoCostiMezzo.tsx:307-323`; `src/pages/AnalisiEconomica.tsx:377-391`; `src/next/domain/nextDocumentiCostiDomain.ts:1514-1718`).
- `FATTO VERIFICATO` Il contratto universale del dossier NEXT dichiara `writers: ["nessuno business"]` (`src/next/internal-ai/internalAiUniversalContracts.ts:131`).
- `DEDUZIONE PRUDENTE` Oggi `@costiMezzo` sembra piu un dataset storico/derivato da lettura che un target business ben governato.
- `FATTO VERIFICATO` Esiste invece un collegamento chiaro documento -> manutenzione tramite `sourceDocumentId` nel dominio NEXT manutenzioni (`src/next/NextDossierFatturaToManutenzioneModal.tsx:238-248`; `src/next/domain/nextManutenzioniDomain.ts:781`, `:910-924`).
- `NON DETERMINABILE` dal repo se una fattura manutenzione debba sempre generare anche un costo mezzo.
- `DECISIONE CONSIGLIATA` La scelta piu sicura e: archivio documento separato prima, costo mezzo eventualmente derivato o scritto solo dal modulo destinazione dopo conferma. La scelta meno sicura, oggi, e fare di `@costiMezzo` il target diretto dell’archivista.
- `DECISIONE CONSIGLIATA` Se il caso d’uso richiede costo mezzo, il passaggio corretto da fissare in SPEC e “solo su conferma”, non automatico, perche il repo non dimostra alcun automatismo gia stabile.

## 6. Blocco 3 — documenti mezzo

- `FATTO VERIFICATO` Assicurazione, revisione e collaudo oggi vivono come campi del record mezzo (`src/pages/Mezzi.tsx:721-724`; `src/pages/Home.tsx:1177-1317`).
- `FATTO VERIFICATO` Il libretto ha anche un originale in Storage e due campi di collegamento sul mezzo: `librettoUrl`, `librettoStoragePath` (`src/pages/IA/IALibretto.tsx:435-440`; `src/pages/IA/IACoperturaLibretti.tsx:425-432`, `:510-522`).
- `FATTO VERIFICATO` Non emerge, per assicurazione/revisione/collaudo, una collection archivio dedicata paragonabile a `@documenti_mezzi`.
- `FATTO VERIFICATO` Nel NEXT le superfici scadenze equivalenti non salvano davvero su `@mezzi_aziendali` (`src/next/components/NextScadenzeModal.tsx:311-351`).
- `DEDUZIONE PRUDENTE` Oggi la struttura reale e “record mezzo prima, archivio originale solo in alcuni casi”.
- `DECISIONE CONSIGLIATA` Tra le tre opzioni:
  - `solo record mezzo` = replica il presente, ma non crea un vero archivio;
  - `archivio documento + link al mezzo` = crea archivio, ma lascia fuori l’aggiornamento operativo;
  - `archivio documento + aggiornamento campi mezzo su conferma` = e la piu pulita e la piu coerente con la direzione desiderata.
- `DECISIONE CONSIGLIATA` La terza opzione e la piu sicura: prima salvi l’originale, poi aggiorni il mezzo solo se l’utente conferma che i campi letti sono giusti.

## 7. Blocco 4 — duplicati, versioni, sostituzioni

- `FATTO VERIFICATO` Nel flusso documentale generale `IADocumenti` non c’e alcun controllo prima del `addDoc(...)`: se il file viene ricaricato, il codice salva comunque (`src/pages/IA/IADocumenti.tsx:509-537`).
- `FATTO VERIFICATO` Nel flusso generale non esistono hash, checksum o fingerprint documento rilevati dal repo.
- `FATTO VERIFICATO` Per i preventivi esiste una sostituzione reale del PDF migliore: il record resta lo stesso e il PDF puo essere ricaricato sul path `preventivi/<id>.pdf` (`src/pages/Acquisti.tsx:4030-4050`, `:5154`).
- `FATTO VERIFICATO` Per cisterna esiste una vera gestione duplicati dei bollettini, con scelta del documento valido e marcatura `dupChosen` / `dupIgnored` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:739-963`).
- `FATTO VERIFICATO` In `CapoMezzi` esiste una deduplica solo di lettura tra costi manuali e costi IA, basata su `sourceKey:docId`; non e una regola di ingestione archivio (`src/pages/CapoMezzi.tsx:326-334`).
- `DEDUZIONE PRUDENTE` Il repo non offre oggi una soluzione generale per:
  - doppio caricamento dello stesso documento;
  - foto + PDF dello stesso documento;
  - sostituzione di un originale con versione migliore;
  - ricaricamento di un documento gia archiviato.
- `DECISIONE CONSIGLIATA` Regola semplice e prudente per IA 2:
  - confronta solo pochi campi forti: famiglia, contesto, fornitore, numero documento, data, totale, targa;
  - se il match e forte, non salvare in automatico un nuovo record;
  - chiedi all’utente una scelta secca: `nuova versione`, `stesso documento con secondo originale`, `documento diverso`;
  - non unire da solo foto e PDF;
  - mantieni una sola copia “principale” e, solo se l’utente lo chiede, conserva gli altri originali come versioni o allegati secondari.

## 8. Blocco 5 — confine di scrittura sicuro per IA 2

- `FATTO VERIFICATO` La barrier del clone apre in modo esplicito:
  - su `/next/ia/interna`, solo il `POST` a `estrazioneDocumenti` e uno scope inline su `@inventario` (`src/utils/cloneWriteBarrier.ts:43-46`, `:145-154`, `:171-199`);
  - su `/next/magazzino`, `@inventario`, `@materialiconsegnati`, `@cisterne_adblue` e upload sotto `inventario/` (`src/utils/cloneWriteBarrier.ts:9-14`, `:241-250`);
  - su `/next/manutenzioni`, `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping` e upload `mezzi_foto/` (`src/utils/cloneWriteBarrier.ts:16-23`, `:255-273`);
  - su `/next/euromecc`, `@ordini`, upload `euromecc/relazioni/` e API PDF analyze (`src/utils/cloneWriteBarrier.ts:35`, `:213-239`).
- `FATTO VERIFICATO` La stessa route `/next/ia/interna` riusa pero un motore legacy che contiene ancora scritture dirette: upload `documenti_pdf/...`, `addDoc` su `@documenti_*`, `updateDoc` sul documento e import inventario (`src/pages/IA/IADocumenti.tsx:498-537`, `:604-731`, `:773`; `src/next/NextInternalAiPage.tsx:4247`, `:8447`).
- `DEDUZIONE PRUDENTE` Quindi il confine scritture di oggi non e ancora pulito per una IA 2 finale: una parte e stretta e dichiarata nella barrier, una parte arriva dal riuso del motore legacy.

### Aperture strette consigliate

- `DECISIONE CONSIGLIATA` Apertura stretta 1: upload originale solo sui path archivio della famiglia, non su path business generici.
- `DECISIONE CONSIGLIATA` Apertura stretta 2: scrittura del solo record archivio confermato della famiglia scelta dall’utente.
- `DECISIONE CONSIGLIATA` Apertura stretta 3: eventuale secondo passo business solo nel modulo target o tramite azione dedicata e confermata, non dalla chat libera.

### Aperture da non fare

- `DECISIONE CONSIGLIATA` Non aprire in modo generico da IA 2: `@costiMezzo`, `@ordini`, `@preventivi_approvazioni`, `@mezzi_aziendali`, `@manutenzioni`, `@inventario` come perimetro libero e universale.
- `DECISIONE CONSIGLIATA` Non tenere la forma attuale “chat + archivio + scrittura business” come specifica finale di IA 2: il repo la mostra come stato ibrido, non come confine pulito.
- `DECISIONE CONSIGLIATA` Non usare `@costiMezzo` come collezione da aprire “perche serve ai costi”: oggi il repo non dimostra chi la costruisce.

### Perimetro minimo per far funzionare IA 2 senza rompere la filosofia clone/NEXT

- `DECISIONE CONSIGLIATA` Il perimetro minimo e:
  - scelta guidata utente di famiglia e contesto;
  - upload originale;
  - estrazione;
  - review;
  - salvataggio archivio confermato;
  - proposta di azione business separata e non obbligatoria.

## 9. Decisioni consigliate prima di scrivere la SPEC finale

- Decidere una tabella canonica famiglia -> archivio primario.
- Decidere se `preventivo manutenzione` entra nella prima versione oppure resta fuori finche non ha un target pulito.
- Decidere che `@costiMezzo` non e fonte di verita da scrivere finche non compare un writer additivo reale o una decisione ufficiale alternativa.
- Decidere che i documenti mezzo non resteranno “solo nel record mezzo”, ma avranno anche un archivio originale.
- Decidere che `Cisterna`, `Euromecc` e `Carburante` sono o dentro o fuori dalla prima IA 2, senza mezze inclusioni implicite.
- Decidere che la conferma utente separa sempre archiviazione e azione business.

## 10. Domande residue da chiarire ancora

- Il preventivo manutenzione deve avere come record finale `@preventivi`, archivio mezzo, o un doppio livello?
- Una fattura manutenzione confermata deve creare solo archivio documento o anche manutenzione?
- Se crea manutenzione, deve creare anche costo mezzo o no?
- Per i documenti mezzo, l’originale deve sempre essere archiviato oppure solo per il libretto?
- Carburante entra davvero nella prima IA 2 oppure va rimandato, perche oggi non ha archivio file dimostrato?
- `Cisterna` ed `Euromecc` devono restare verticali specialistici o diventare famiglie della stessa IA 2?

## 11. Verdetto finale: cosa è pronto, cosa non è pronto

### PRONTO

- La distinzione concettuale tra “archivio documento” e “azione business” e ormai visibile nel repo.
- Esiste gia un archivio generale vero per molte famiglie: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
- Esistono gia i target business principali del mondo NEXT: Magazzino, Manutenzioni, Euromecc.
- Il punto debole maggiore non e piu “capire dove stanno i dati”, ma “scegliere quali sink diventano canonici per IA 2”.

### NON ANCORA PRONTO

- Il confine finale di `preventivo manutenzione`.
- Il ruolo finale di `@costiMezzo`.
- Il destino archivistico dei documenti mezzo diversi dal libretto.
- Una regola generale su duplicati, versioni e originali multipli.
- Una destinazione archivio vera per `Carburante`.
- Una separazione runtime gia pulita tra IA 1 assistente e IA 2 archivista.

### SERVE CHIARIRE PRIMA

- quali famiglie entrano davvero nella prima SPEC di IA 2;
- quale archivio primario vale per ogni famiglia;
- quali scritture business restano fuori da IA 2;
- se `archiviazione prima, azione dopo` vale sempre o con eccezioni esplicite;
- se i verticali specialistici vanno integrati subito oppure lasciati separati.
