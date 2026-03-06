# VERIFICA ALLINEAMENTO REPO E DOCUMENTI

## Scopo audit
Verificare l'allineamento tra codice reale del repository e documentazione ufficiale di progetto, identificando differenze, omissioni, incoerenze e punti ancora aperti con prove fino a file/funzione/linee.

## Metodo usato
- Lettura integrale dei documenti ufficiali indicati nel task.
- Inventario route/pagine da `src/App.tsx`.
- Estrazione evidence su chiavi dati, collection Firestore, path Storage, PDF/IA, sicurezza/permessi con ricerca testuale (`rg`) e lettura file con numerazione linee.
- Confronto puntuale docs vs codice con classificazione per severita e azione consigliata.

## Documenti confrontati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/architecture/DIAGRAMMA_STRUTTURA_NUOVA_APP.mmd`
- `docs/architecture/FUNZIONI_TRASVERSALI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `AGENTS.md`
- `docs/product/REGOLE_LAVORO_CODEX.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`

## Aree verificate
- Centro di Controllo
- Flotta / Dossier
- Operativita
- Magazzino
- Analisi
- Autisti
- Dati
- PDF
- IA
- Sicurezza / Permessi
- Legacy / Supporto

---

## Differenze trovate (raggruppate per macro-area)

### Centro di Controllo
#### AUD-006
- Categoria: `NON ALLINEATO`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/STATO_ATTUALE_PROGETTO.md:15`
  - `docs/product/STORICO_DECISIONI_PROGETTO.md:17`
- File codice coinvolto:
  - `src/App.tsx`
- Funzione/componente/blocco coinvolto:
  - Router principale (`App`)
- Range linee:
  - `src/App.tsx:95` (Home), `src/App.tsx:141` (CentroControllo)
- Descrizione precisa della differenza:
  - La decisione documentale "Home = Centro di Controllo" risulta non riflessa nel routing corrente: restano due entrypoint separati (`/` e `/centro-controllo`) con componenti distinti.
- Impatto possibile:
  - UX e navigazione frammentate rispetto al target; rischio duplicazione KPI/azioni tra due pagine.
- Azione consigliata:
  - `decidere architettura` (canonico/alias) e `aggiornare docs` con stato di transizione esplicito.

### Flotta / Dossier
#### AUD-008
- Categoria: `NON ALLINEATO`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md:44`
  - `docs/product/STORICO_DECISIONI_PROGETTO.md:22`
- File codice coinvolto:
  - `src/App.tsx`
  - `src/pages/DossierLista.tsx`
  - `src/pages/Mezzo360.tsx`
  - `src/pages/Mezzi.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/Manutenzioni.tsx`
  - `src/pages/DossierMezzo.tsx`
- Funzione/componente/blocco coinvolto:
  - Route alias dossier + link interni
- Range linee:
  - `src/App.tsx:105-106`
  - `src/pages/DossierLista.tsx:137`
  - `src/pages/Mezzo360.tsx:782,1161`
  - `src/pages/Mezzi.tsx:1797`
  - `src/pages/Home.tsx:2872,3379`
  - `src/pages/Manutenzioni.tsx:89`
  - `src/pages/DossierMezzo.tsx:1163,1171`
- Descrizione precisa della differenza:
  - Alias dossier ancora attivo e uso misto nei link (`/dossiermezzi/:targa` prevalente, `/dossier/:targa/*` usato nei tab secondari).
- Impatto possibile:
  - Deep-link/bookmark incoerenti e maggiore complessita in redesign/migrazione route.
- Azione consigliata:
  - `decidere architettura` (route canonica + alias temporaneo) e `aggiornare docs` con piano di deprecazione.

### Operativita
#### AUD-007
- Categoria: `NON ALLINEATO`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md:44`
  - `docs/product/STORICO_DECISIONI_PROGETTO.md:22`
- File codice coinvolto:
  - `src/App.tsx`
  - `src/pages/Acquisti.tsx`
  - `src/pages/OrdiniInAttesa.tsx`
  - `src/pages/OrdiniArrivati.tsx`
- Funzione/componente/blocco coinvolto:
  - Route dettaglio ordine e navigator caller
- Range linee:
  - `src/App.tsx:120,139`
  - `src/pages/Acquisti.tsx:6271-6274`
  - `src/pages/OrdiniInAttesa.tsx:61-62`
  - `src/pages/OrdiniArrivati.tsx:61-62`
- Descrizione precisa della differenza:
  - Due route attive per dettaglio ordine con chiamanti diversi (`/acquisti/dettaglio/:ordineId` vs `/dettaglio-ordine/:ordineId`).
- Impatto possibile:
  - Flusso spezzato e costi manutentivi piu alti su UI/redirect/focus tab.
- Azione consigliata:
  - `decidere architettura` e `aggiornare docs` con route canonica ufficiale.

### Magazzino
- Nessuna differenza critica nuova rispetto ai documenti ufficiali.
- Nota: le principali entita (`@inventario`, `@materialiconsegnati`, `@attrezzature_cantieri`) risultano coerenti a livello macro con il perimetro documentato.

### Analisi
#### AUD-003
- Categoria: `NON ALLINEATO`
- Severita: `ALTA`
- Documento docs coinvolto:
  - `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md:104`
  - `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md:14`
- File codice coinvolto:
  - `src/pages/AnalisiEconomica.tsx`
  - `src/pages/IA/IADocumenti.tsx`
  - `src/pages/CapoCostiMezzo.tsx`
  - `src/cisterna/iaClient.ts`
  - `src/utils/aiCore.ts`
- Funzione/componente/blocco coinvolto:
  - Chiamate backend IA/PDF con endpoint hardcoded e regioni diverse
- Range linee:
  - `src/pages/AnalisiEconomica.tsx:750-752`
  - `src/pages/IA/IADocumenti.tsx:366-368`
  - `src/pages/CapoCostiMezzo.tsx:705-707`
  - `src/cisterna/iaClient.ts:8-12`
  - `src/utils/aiCore.ts:4,8-10`
- Descrizione precisa della differenza:
  - Coesistono endpoint hardcoded `us-central1` e callable configurato `europe-west3`, senza strato canonico unico.
- Impatto possibile:
  - Rischi di portabilita/migrazione ambiente, governance frammentata, debugging piu complesso.
- Azione consigliata:
  - `decidere architettura` endpoint canonico e `aggiornare docs` con mappa completa per regione/owner.

### Autisti
#### AUD-010
- Categoria: `MANCANTE NEI DOCS`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/data/MAPPA_COMPLETA_DATI.md:89-94`
- File codice coinvolto:
  - `src/autisti/autistiStorage.ts`
  - `src/autisti/AutistiGate.tsx`
- Funzione/componente/blocco coinvolto:
  - Gestione revoca sessione locale autista
- Range linee:
  - `src/autisti/autistiStorage.ts:5,33-58,61-78`
  - `src/autisti/AutistiGate.tsx:31-39,64-77`
- Descrizione precisa della differenza:
  - La chiave locale `@autista_revoca_local` e la relativa logica di revoca non sono esplicitate nella tabella chiavi locali ufficiale.
- Impatto possibile:
  - Gap documentale su flusso revoca/autista; rischio redesign incompleto dell'area autisti.
- Azione consigliata:
  - `aggiornare docs` (DATA master map + regole flusso autisti).

#### AUD-011
- Categoria: `AMBIGUO`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/data/MAPPA_COMPLETA_DATI.md:68`
  - `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md:10`
- File codice coinvolto:
  - `src/utils/homeEvents.ts`
- Funzione/componente/blocco coinvolto:
  - `loadFirestoreAutistiEventi`
- Range linee:
  - `src/utils/homeEvents.ts:270-326`
  - ricerca utilizzi: solo definizione (`src/utils/homeEvents.ts:270`)
- Descrizione precisa della differenza:
  - Il fallback su collection `autisti_eventi` e presente ma non risulta invocato dal runtime corrente.
- Impatto possibile:
  - Ambiguita su stream canonico effettivo per eventi autisti e rischi nei futuri refactor/report.
- Azione consigliata:
  - `verificare codice` + `decidere architettura` (deprecare fallback o riattivarlo in modo esplicito).

### Dati
#### AUD-009
- Categoria: `MANCANTE NEI DOCS`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/data/MAPPA_COMPLETA_DATI.md:21-22,89-94`
- File codice coinvolto:
  - `src/pages/Acquisti.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
  - `src/pages/ModalGomme.tsx`
  - `src/autisti/autistiStorage.ts`
- Funzione/componente/blocco coinvolto:
  - Persistenze local/session non censite in tabella ufficiale
- Range linee:
  - `src/pages/Acquisti.tsx:203,600,657,841`
  - `src/pages/Home.tsx:40-41,302,314,333,345`
  - `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:73,1124,1481,1518`
  - `src/pages/ModalGomme.tsx:25,266,331`
  - `src/autisti/autistiStorage.ts:5`
- Descrizione precisa della differenza:
  - La mappa dati non elenca esplicitamente varie chiavi locali/session (`acquisti_draft_ordine_materiali_v1`, `gm_quicklinks_favs_v1`, `gm_dossier_missing_alert_v1`, `cisterna_schede_calib_v1`, `@wheelGeom_override_v1`, `@autista_revoca_local`).
- Impatto possibile:
  - Perdita di contesto nei passaggi tra chat/task e rischio regressioni su stati UI persistenti.
- Azione consigliata:
  - `aggiornare docs` (sezione chiavi locali/session con distinzione business vs UI-tech).

#### AUD-012
- Categoria: `MANCANTE NEI DOCS`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/data/MAPPA_COMPLETA_DATI.md:33-34`
- File codice coinvolto:
  - `src/pages/RifornimentiEconomiaSection.tsx`
- Funzione/componente/blocco coinvolto:
  - Merge rifornimenti canonico/tmp (match litri+prossimita timestamp)
- Range linee:
  - `src/pages/RifornimentiEconomiaSection.tsx:197-306`
- Descrizione precisa della differenza:
  - Il criterio reale di merge tra `@rifornimenti` e `@rifornimenti_autisti_tmp` e implementato ma non descritto nel contratto dati ufficiale.
- Impatto possibile:
  - Rischio di interpretazioni diverse nei futuri redesign/reporting su consumi e km.
- Azione consigliata:
  - `aggiornare docs` con algoritmo di merge e limiti noti.

### PDF
#### AUD-002
- Categoria: `MANCANTE NEI DOCS`
- Severita: `ALTA`
- Documento docs coinvolto:
  - `docs/data/MAPPA_COMPLETA_DATI.md`
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- File codice coinvolto:
  - `functions/index.js`
  - `src/pages/Acquisti.tsx`
  - `src/pages/CapoCostiMezzo.tsx`
- Funzione/componente/blocco coinvolto:
  - `estraiPreventivoIA` (onCall), `stamp_pdf` (onRequest), uso in UI acquisti/capo
- Range linee:
  - `functions/index.js:529-734`
  - `src/pages/Acquisti.tsx:2329-2330,3149`
  - `src/pages/CapoCostiMezzo.tsx:705-725`
- Descrizione precisa della differenza:
  - Flusso PDF/preventivi con timbro server e extraction onCall e attivo ma non mappato esplicitamente nei documenti ufficiali come contratto endpoint.
- Impatto possibile:
  - Gap architetturale su funzionalita critiche (approvazioni preventivi e import listino).
- Azione consigliata:
  - `aggiornare docs` (mappa endpoint PDF/IA con ownership e dipendenze).

### IA
#### AUD-001
- Categoria: `NON ALLINEATO`
- Severita: `ALTA`
- Documento docs coinvolto:
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md:123`
  - `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md:90,104`
- File codice coinvolto:
  - `src/utils/aiCore.ts`
  - `src/utils/pdfEngine.ts`
  - `functions/index.js`
  - `functions-schede/index.js`
- Funzione/componente/blocco coinvolto:
  - `callAICore`, `generaPDFconIA`, `enhancePDFTextFull`
- Range linee:
  - `src/utils/aiCore.ts:7-10,20-24`
  - `src/utils/pdfEngine.ts:313-321`
  - `functions/index.js:526-529` (export presenti, `aiCore` assente)
  - `functions-schede/index.js:5-12` (nessun `aiCore`)
- Descrizione precisa della differenza:
  - I documenti citano supporto Functions `aiCore` come componente confermato, ma nel backend repository non risulta export della function `aiCore`.
- Impatto possibile:
  - Possibile fallback silenzioso nella generazione PDF IA e confusione sulla capability canonica.
- Azione consigliata:
  - `verificare codice` + `aggiornare docs` + `decidere architettura` endpoint IA canonico.

### Sicurezza / Permessi
#### AUD-004
- Categoria: `NON ALLINEATO`
- Severita: `CRITICA`
- Documento docs coinvolto:
  - `docs/security/SICUREZZA_E_PERMESSI.md:16`
  - `docs/STATO_ATTUALE_PROGETTO.md:4`
- File codice coinvolto:
  - `storage.rules`
  - `src/autisti/Segnalazioni.tsx`
  - `src/autisti/RichiestaAttrezzature.tsx`
  - `src/pages/Acquisti.tsx`
  - `src/pages/IA/IALibretto.tsx` (pattern analogo)
- Funzione/componente/blocco coinvolto:
  - Upload/download/delete su Firebase Storage lato client
- Range linee:
  - `storage.rules:9`
  - `src/autisti/Segnalazioni.tsx:279-281`
  - `src/autisti/RichiestaAttrezzature.tsx:83-85,100`
  - `src/pages/Acquisti.tsx:3098,3128,3673`
- Descrizione precisa della differenza:
  - Nel repo le Storage Rules negano ogni read/write, mentre il codice client usa Storage in molti flussi operativi.
- Impatto possibile:
  - Rischio blocco totale funzionalita file se le regole deployate coincidono con il repo; stato reale `DA VERIFICARE`.
- Azione consigliata:
  - `verificare codice`/infra (regole deployate) e `decidere architettura` policy Storage ufficiale.

#### AUD-005
- Categoria: `DA VERIFICARE`
- Severita: `ALTA`
- Documento docs coinvolto:
  - `docs/security/SICUREZZA_E_PERMESSI.md:17`
  - `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md:13`
- File codice coinvolto:
  - `firebase.json`
  - root repository (assenza `firestore.rules`)
- Funzione/componente/blocco coinvolto:
  - Configurazione regole Firestore
- Range linee:
  - `firebase.json:1-31`
- Descrizione precisa della differenza:
  - Policy Firestore effettive non versionate nel repo (file `firestore.rules` assente).
- Impatto possibile:
  - Impossibile validare enforcement permessi lato dati; alto rischio su sicurezza futura.
- Azione consigliata:
  - `decidere architettura` e `aggiornare docs`/repo con policy ufficiali.

#### AUD-013
- Categoria: `MANCANTE NEI DOCS`
- Severita: `ALTA`
- Documento docs coinvolto:
  - `docs/security/SICUREZZA_E_PERMESSI.md`
- File codice coinvolto:
  - `functions/estrazioneDocumenti.js`
  - `functions/analisiEconomica.js`
  - `functions/iaCisternaExtract.js`
  - `functions/index.js`
- Funzione/componente/blocco coinvolto:
  - Endpoint HTTP Functions con CORS wildcard
- Range linee:
  - `functions/estrazioneDocumenti.js:76-84`
  - `functions/analisiEconomica.js:21-29`
  - `functions/iaCisternaExtract.js:129-137`
  - `functions/index.js:633-640,738-745`
- Descrizione precisa della differenza:
  - CORS `*` e diffuso sulle funzioni HTTP, ma non e tracciato come rischio specifico nel blueprint sicurezza.
- Impatto possibile:
  - Superficie di esposizione API piu ampia del previsto.
- Azione consigliata:
  - `aggiornare docs` con baseline CORS corrente e target restrittivo.

### Legacy / Supporto
#### AUD-014
- Categoria: `LEGACY`
- Severita: `BASSA`
- Documento docs coinvolto:
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md` (sezione legacy/supporto, livello macro)
- File codice coinvolto:
  - `src/autistiInbox/AutistiInboxHome.tsx.bak2`
- Funzione/componente/blocco coinvolto:
  - File backup in `src/` non parte del routing attivo
- Range linee:
  - `n/a` (asset file)
- Descrizione precisa della differenza:
  - Presenza di artefatto backup nel codice sorgente non censito esplicitamente nei documenti ufficiali.
- Impatto possibile:
  - Rumore tecnico e possibile confusione durante audit/refactor.
- Azione consigliata:
  - `lasciare legacy` oppure pianificare cleanup controllato in task dedicato.

#### AUD-015
- Categoria: `SUPPORTO TECNICO`
- Severita: `MEDIA`
- Documento docs coinvolto:
  - `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
  - `docs/architecture/FUNZIONI_TRASVERSALI.md`
- File codice coinvolto:
  - `functions-schede/estrazioneSchedaCisterna.js`
  - `functions-schede/index.js`
- Funzione/componente/blocco coinvolto:
  - Export handler cisterna v1/v2 misti
- Range linee:
  - `functions-schede/estrazioneSchedaCisterna.js:495-496`
  - `functions-schede/index.js:5-12`
- Descrizione precisa della differenza:
  - Nel codebase `functions-schede` coesistono export v1 (`functions.https.onRequest`) e v2 (`firebase-functions/v2/https`) per lo stesso handler/logica.
- Impatto possibile:
  - Ambiguita tecnica su deployment e ownership runtime delle funzioni schede.
- Azione consigliata:
  - `verificare codice` e `aggiornare docs` con contratto runtime univoco.

---

## Sezione finale

### Differenze critiche
- `AUD-004` (Storage rules deny-all vs uso Storage diffuso lato client).

### Differenze ad alta priorita
- `AUD-001`, `AUD-002`, `AUD-003`, `AUD-005`, `AUD-013`.

### Differenze solo documentali
- `AUD-009`, `AUD-010`, `AUD-012`, `AUD-014`, `AUD-015` (prevalentemente gap di mappatura/esplicitazione).

### Differenze che bloccano la progettazione futura
- `AUD-001`: endpoint IA canonico (`aiCore`) non dimostrato nel backend.
- `AUD-003`: governance endpoint/regione non unificata.
- `AUD-004`: stato effettivo policy Storage non chiaro rispetto al runtime.
- `AUD-005`: assenza policy Firestore versionata.
