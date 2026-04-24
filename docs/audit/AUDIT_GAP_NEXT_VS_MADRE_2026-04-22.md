# AUDIT GAP NEXT vs MADRE — Verdetto di Promozione

**Data:** 2026-04-22
**Scopo:** Rispondere in modo ancorato al codice reale a una sola domanda: "Cosa manca alla NEXT per poter sostituire la madre e diventare la nuova applicazione ufficiale?"
**Metodo:** Census completo `src/pages/**`, `src/next/**`, `src/utils/cloneWriteBarrier.ts`, `src/App.tsx`, `CONTEXT_CLAUDE.md`, `STATO_MIGRAZIONE_NEXT.md`. Zero inferenza speculativa.

---

## 1. VERDETTO DI PROMOZIONE

> **NEXT NON è pronta per sostituire la madre.**
> Bloccanti: 7 moduli scriventi senza deroga, 2 pagine completamente mancanti, auth stub (`signInAnonymously`), `storage.rules` deny-all incompatibile con il codice, lint globale rotto.
> Stima distanza: con focus e senza refactor architetturale, i soli gap scriventi richiedono ancora 8–12 sessioni di lavoro; i gap infrastrutturali (auth, rules) sono prerequisiti di sicurezza indipendenti.

---

## 2. MATRICE COMPLETA MADRE → NEXT

Legenda stato: ✅ OK (scrivente + verificato) | 🟡 PARZIALE (scrivente + "DA VERIFICARE") | 🔵 READ-ONLY (nessuna write-authorization nel barrier) | ❌ MANCANTE (nessun componente NEXT)

### 2.1 Operatività lavori

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| LavoriDaEseguire | `/lavori-da-eseguire` | NextLavoriDaEseguirePage | `/next/lavori-da-eseguire` | `@lavori` | 🟡 PARZIALE |
| LavoriInAttesa | `/lavori-in-attesa` | NextLavoriInAttesaPage | `/next/lavori-in-attesa` | `@lavori` | 🟡 PARZIALE |
| LavoriEseguiti | `/lavori-eseguiti` | NextLavoriEseguitiPage | `/next/lavori-eseguiti` | `@lavori` | 🟡 PARZIALE |
| DettaglioLavoro | `/dettagliolavori/:id` | NextDettaglioLavoroPage | `/next/dettagliolavori/:id` | `@lavori` | 🟡 PARZIALE |

### 2.2 Manutenzioni

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| Manutenzioni | `/manutenzioni` | NextManutenzioniPage | `/next/manutenzioni` | `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `mezzi_foto/` | 🟡 PARZIALE |

### 2.3 Magazzino / Procurement

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| Inventario | `/inventario` | redirect → NextMagazzinoPage | `/next/inventario` → `/next/magazzino?tab=inventario` | `@inventario`, `inventario/` | 🟡 PARZIALE |
| MaterialiConsegnati | `/materiali-consegnati` | redirect → NextMagazzinoPage | `/next/materiali-consegnati` → `/next/magazzino?tab=materiali-consegnati` | `@materialiconsegnati` (via magazzino) | 🟡 PARZIALE |
| MaterialiDaOrdinare | `/materiali-da-ordinare` | NextMaterialiDaOrdinarePage | `/next/materiali-da-ordinare` | `storage/@preventivi`, `storage/@listino_prezzi`, `preventivi/manuali/`, `preventivi/ia/` | 🟡 PARZIALE |
| **Acquisti** | `/acquisti`, `/acquisti/dettaglio/:id` | NextAcquistiPage → NextProcurementStandalonePage (mode="acquisti") | `/next/acquisti` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |
| **OrdiniInAttesa** | `/ordini-in-attesa` | NextOrdiniInAttesaPage | `/next/ordini-in-attesa` | **NESSUNA** | 🔵 READ-ONLY (madre: read-only) |
| **OrdiniArrivati** | `/ordini-arrivati` | NextOrdiniArrivatiPage | `/next/ordini-arrivati` | **NESSUNA** | 🔵 READ-ONLY (madre: read-only) |
| **DettaglioOrdine** | `/dettaglio-ordine/:id` | NextDettaglioOrdinePage | `/next/dettaglio-ordine/:id` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |
| **AttrezzatureCantieri** | `/attrezzature-cantieri` | NextAttrezzatureCantieriPage | `/next/attrezzature-cantieri` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |

**Evidenza Acquisti madre scrivente** (`src/pages/Acquisti.tsx`):
- riga 2186: `await setItemSync("@ordini", updated)` — crea/aggiorna ordini
- riga 6315–6346: `await setItemSync("@inventario", inv)` + `@ordini` — carica stock da arrivo
- righe 3459, 3489, 3667, 4035: `uploadBytes` — PDF ordine, immagini, IA PDF
- righe 1363, 2727, 2738, 5365: `setDoc` — documenti Firestore ordine

**Evidenza DettaglioOrdine madre scrivente** (`src/pages/DettaglioOrdine.tsx`):
- riga 215: `await setItemSync("@inventario", inv)` — carico articoli su arrivo
- riga 227: `await setItemSync("@ordini", arr)` — aggiorna stato ordine

**Evidenza AttrezzatureCantieri madre scrivente** (`src/pages/AttrezzatureCantieri.tsx`):
- riga 454, 470, 596: `await setItemSync(KEY_ATTREZZATURE, next)` — CRUD attrezzature

### 2.4 Anagrafiche

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| **Mezzi** | `/mezzi` | NextMezziPage | `/next/mezzi` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |
| **Colleghi** | `/colleghi` | NextColleghiPage | `/next/colleghi` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |
| **Fornitori** | `/fornitori` | NextFornitoriPage | `/next/fornitori` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |

**Evidenza Mezzi madre scrivente** (`src/pages/Mezzi.tsx`):
- riga 787: `await setItemSync(MEZZI_KEY, currentMezzi)` — aggiorna flotta
- riga 808: `await setItemSync(MEZZI_KEY, updated, {...})` — merge mezzo

**Evidenza Colleghi madre scrivente** (`src/pages/Colleghi.tsx`):
- riga 103: `await setDoc(ref, { value: lista }, { merge: true })` — salva registro colleghi

**Evidenza Fornitori madre scrivente** (`src/pages/Fornitori.tsx`):
- riga 73: `await setDoc(ref, { value: lista }, { merge: true })` — salva registro fornitori

### 2.5 Dossier Mezzo

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| DossierLista | `/dossiermezzi` | NextDossierListaPage | `/next/dossiermezzi` | `@costiMezzo` (via dossier path) | 🟡 PARZIALE |
| DossierMezzo | `/dossier/:targa`, `/dossiermezzi/:targa` | NextDossierMezzoPage | `/next/dossier/:targa` | `firestore.deleteDoc` su `@documenti_mezzi/`, `@costiMezzo` | 🟡 PARZIALE |
| DossierGomme | `/dossier/:targa/gomme` | NextDossierGommePage | `/next/dossier/:targa/gomme` | via dossier path | 🟡 PARZIALE |
| DossierRifornimenti | `/dossier/:targa/rifornimenti` | NextDossierRifornimentiPage | `/next/dossier/:targa/rifornimenti` | via dossier path | 🟡 PARZIALE |
| AnalisiEconomica | `/analisi-economica/:targa` | NextAnalisiEconomicaPage | `/next/analisi-economica/:targa` | nessuna (read-only in madre) | 🔵 READ-ONLY (OK: madre read-only) |
| **Mezzo360** | `/mezzo-360/:targa` | — | — | — | ❌ **MANCANTE** |

### 2.6 Area Capo

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| CapoMezzi | `/capo/mezzi` | NextCapoMezziPage | `/next/capo/mezzi` | nessuna (read-only in madre) | 🔵 READ-ONLY (OK) |
| CapoCostiMezzo | `/capo/costi/:targa` | NextCapoCostiMezzoPage | `/next/capo/costi/:targa` | nessuna (read-only in madre) | 🔵 READ-ONLY (OK) |

### 2.7 Centro Controllo / Home

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| Home | `/` | NextHomePage | `/next` | nessuna | 🔵 READ-ONLY (OK: dashboard) |
| CentroControllo | n.d. | NextCentroControlloParityPage | `/next/centro-controllo` | nessuna | 🔵 READ-ONLY (madre: verifica write) |
| GestioneOperativa | n.d. | NextGestioneOperativaPage | `/next/gestione-operativa` | nessuna | 🔵 READ-ONLY (hub navigazione) |
| OperativitaGlobale | — | NextOperativitaGlobalePage | `/next/operativita-globale` | nessuna | 🔵 READ-ONLY (pannelli read-only) |

### 2.8 IA

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| IAHome | `/ia` | NextIntelligenzaArtificialePage | `/next/ia` | nessuna | 🔵 READ-ONLY (hub) |
| IAApiKey | `/ia/apikey` | NextIAApiKeyPage | `/next/ia/apikey` | nessuna | 🔵 READ-ONLY |
| IALibretto | `/ia/libretto` | NextIALibrettoPage | `/next/ia/libretto` | `storage.uploadString mezzi_aziendali/`, `@mezzi_aziendali` | 🟡 PARZIALE |
| IADocumenti | `/ia/documenti` | NextIADocumentiPage | `/next/ia/documenti` | `firestore.deleteDoc @documenti_mezzi/`, `firestore.updateDoc` | 🟡 PARZIALE |
| IACoperturaLibretti | `/ia/copertura-libretti` | NextIACoperturaLibrettiPage | `/next/ia/copertura-libretti` | nessuna | 🔵 READ-ONLY (OK) |
| LibrettiExport | `/libretti-export` | NextLibrettiExportPage | `/next/libretti-export` | nessuna | 🔵 READ-ONLY |
| — | — | NextIAArchivistaPage | `/next/ia/archivista` | `firestore.addDoc @documenti_*`, `storage.uploadBytes documenti_pdf/`, `@preventivi` | 🟡 PARZIALE |
| — | — | NextInternalAiPage | `/next/ia/interna` | `fetch.runtime → estrazioneDocumenti` | 🟡 PARZIALE |

### 2.9 Cisterna

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| **CisternaCaravatePage** | `/cisterna` | NextCisternaPage | `/next/cisterna` | **NESSUNA** | 🔵 **READ-ONLY — GAP CRITICO** |
| CisternaCaravateIA | `/cisterna/ia` | NextCisternaIAPage | `/next/cisterna/ia` | nessuna | 🔵 READ-ONLY |
| CisternaSchedeTest | `/cisterna/schede-test` | NextCisternaSchedeTestPage | `/next/cisterna/schede-test` | nessuna | 🔵 READ-ONLY |

**Evidenza Cisterna madre scrivente** (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx`):
- riga 949: `updateDoc(...)` — aggiornamento documento cisterna
- riga 1100: `setDoc(...)` — inserimento nuovo documento cisterna

### 2.10 Autisti (separato dall'admin shell)

| Modulo madre | Route madre | Modulo NEXT | Route NEXT | Barrier | Stato |
|---|---|---|---|---|---|
| App autisti (home, login, gate, …) | `/autisti/*` | NextAutistiGatePage + ... | `/next/autisti/*` | separato | 🟡 PARZIALE |
| Autisti Inbox/Admin | `/autisti-inbox/*` | NextAutistiInbox*Page | `/next/autisti-inbox/*` | nessuna | 🟡 PARZIALE |
| **Autista360** | `/autista-360`, `/autista-360/:badge` | **NextDriverExperiencePage (STUB)** | **non routed** | — | ❌ **MANCANTE** |

**Nota `NextDriverExperiencePage`:** il file `src/next/NextDriverExperiencePage.tsx` esiste ma non è montato in `src/App.tsx` ed è un placeholder che dice solo "Area Autista → torna alla Home clone". Non è un equivalente funzionale di `Autista360`.

### 2.11 Euromecc (modulo nativo NEXT, nessun equivalente madre)

| Modulo | Route NEXT | Barrier | Stato |
|---|---|---|---|
| NextEuromeccPage | `/next/euromecc` | `storage.uploadBytes euromecc/relazioni/`, `@ordini`, fetch `/api/pdf-ai-enhance`, backend locale `euromecc/pdf-analyze` | 🟡 PARZIALE |

---

## 3. GAP SCRIVENTI — MODULI DA SBLOCCARE NEL BARRIER

Per promuovere NEXT occorre abilitare nel `cloneWriteBarrier.ts` (e nel codice dei moduli) le seguenti operazioni, oggi assenti o non implementate:

| Priorità | Modulo | Write ops mancanti | Chiave / path target |
|---|---|---|---|
| 🔴 ALTA | **Mezzi** (NextMezziPage) | `setItemSync` create/edit mezzo | `@mezzi_aziendali` |
| 🔴 ALTA | **Colleghi** (NextColleghiPage) | `setDoc` create/edit collega | `storage/@colleghi` |
| 🔴 ALTA | **Fornitori** (NextFornitoriPage) | `setDoc` create/edit fornitore | `storage/@fornitori` |
| 🔴 ALTA | **Acquisti** (NextAcquistiPage) | `setItemSync @ordini`, `setItemSync @inventario`, `setDoc` docs ordine, `uploadBytes` PDF | `@ordini`, `@inventario`, `@ordini_approvazioni`, Storage |
| 🔴 ALTA | **DettaglioOrdine** (NextDettaglioOrdinePage) | `setItemSync @inventario`, `setItemSync @ordini` on arrivo | `@inventario`, `@ordini` |
| 🟠 MEDIA | **AttrezzatureCantieri** (NextAttrezzatureCantieriPage) | `setItemSync` CRUD | `@attrezzature_cantieri` |
| 🟠 MEDIA | **Cisterna** (NextCisternaPage) | `setDoc`, `updateDoc` documenti cisterna | `@documenti_cisterna` |

**Nota metodologica:** per ognuno di questi moduli non basta aprire il barrier — occorre implementare (o portare dal codice madre) i writer NEXT in stile clone-safe con i wrapper `firestoreWriteOps.ts` / `storageWriteOps.ts`.

---

## 4. MODULI MANCANTI — NESSUN EQUIVALENTE NEXT

| Pagina madre | Route madre | Stato NEXT | Impatto |
|---|---|---|---|
| **Mezzo360** (`src/pages/Mezzo360.tsx`) | `/mezzo-360/:targa` | ❌ NESSUNA pagina NEXT routed | CRITICO: vista 360° del mezzo, storico visivo, utilizzata dal flusso Dossier e mappa |
| **Autista360** (`src/pages/Autista360.tsx`) | `/autista-360`, `/autista-360/:badge` | ❌ `NextDriverExperiencePage` è stub non-funzionale, non routed | MEDIO: vista completa autista per il capo, utilizzata da Colleghi e Inbox |

---

## 5. GAP INFRASTRUTTURALI

### 5.1 Autenticazione (BLOCCANTE)

**File:** `src/App.tsx`
**Stato attuale:** `signInAnonymously()` — ogni utente ottiene un UID anonimo, nessuna verifica identità.
**Gap:** nessun login admin dedicato, nessun JWT con claims di ruolo, nessuna distinzione autenticata admin/capo/autista. `NextRoleGuard` è un guard frontend basato su `role` preset simulato — non su claims reali.
**Impatto promozione:** BLOCCANTE. In produzione, qualunque utente anonimo con URL `/next/*` ha accesso completo alla shell NEXT.

### 5.2 Storage Rules (BLOCCANTE)

**File:** `storage.rules`
**Stato attuale (per CONTEXT_CLAUDE §3):** deny-all. Aggiunto solo il match `preventivi/{allPaths=**}` (task 2026-04-22).
**Gap:** il codice NEXT scrive su: `inventario/`, `mezzi_foto/`, `mezzi_aziendali/`, `documenti_pdf/`, `preventivi/manuali/`, `preventivi/ia/`, `euromecc/relazioni/`. La maggior parte di questi path non ha regola `allow write` esplicita → tutti gli upload NEXT vanno in errore `storage/unauthorized` in produzione.
**Impatto promozione:** BLOCCANTE. I moduli write-authorized nel barrier lancierebbero errori runtime su ogni upload in produzione.

### 5.3 Firestore Rules (PARZIALE)

**File:** `firestore.rules`
**Stato attuale (per CONTEXT_CLAUDE §3):** copre `Euromecc` con validazione shape. Il fallback del resto Firestore si appoggia al solo `request.auth != null` — qualunque utente anonimo autenticato può leggere e scrivere.
**Gap:** nessuna matrice per-ruolo verificabile nel repo. `Colleghi`, `Fornitori`, `@documenti_*`, `@manutenzioni`, `@inventario` non hanno restrizioni per ruolo.

### 5.4 Lint globale (NON BLOCCANTE ma obbligatorio pre-promozione)

**Stato:** `npm run lint` = KO con 584 problemi totali (568 errori, 16 warning). Baseline fissato su questo numero; i file NEXT hanno delta zero ma il globale include `src/autistiInbox/*`, `src/autisti/*`, `src/pages/*`, `src/utils/*`, `api/pdf-ai-enhance.ts`, `pdfEngine.ts`. Prima di promuovere, il lint deve almeno raggiungere 0 errori sul perimetro NEXT.

### 5.5 Backend IA frammentato (NON BLOCCANTE ma rischio operativo)

5 canali distinti non unificati:
- `functions/*` — Cloud Functions Firebase legacy
- `functions-schede/*` — verticale cisterna
- `api/pdf-ai-enhance.ts` — edge serverless Vercel/Node
- `server.js` (root) — Express entry point
- `backend/internal-ai/*` — backend IA separato locale (porta 4310)

La NEXT usa `localhost:4310` per `preventivo-extract` e `euromecc/pdf-analyze`. Non esiste un piano di deploy del backend IA separato.

### 5.6 Double autisti events stream

**Stato (per CONTEXT_CLAUDE §3):** due stream paralleli `@storico_eventi_operativi` e `autisti_eventi`. Le inbox NEXT leggono da entrambi ma il contratto non è unificato, portando a deduplication fragile.

### 5.7 Contratto allegati preventivi doppio

`preventivi/manuali/<id>.pdf` (writer manuale) vs `preventivi/ia/<uuid>.<ext>` (writer IA). Il reader procurement lato NEXT deve gestire entrambi i pattern Storage key.

---

## 6. MODULI IN STATO "DA VERIFICARE" (rischio launch)

I task più recenti (2026-04-22/23) hanno build OK ma verifica browser live marcata `DA VERIFICARE`:

| Modulo | Cosa manca di verifica |
|---|---|
| Manutenzioni — bottone Elimina | Verifica browser live con delete reale |
| Manutenzioni — fix duplicato modifica | Cleanup duplicati già creati nel dataset |
| Manutenzioni — restyling tab Dettaglio | Verifica browser live finale |
| Manutenzioni — fix runtime foto PDF | Verifica browser/PDF finale |
| Manutenzioni — fix Dossier → dettaglio manutenzione | Verifica browser live finale |
| Acquisti — Preventivo manuale (WhatsApp/Email checkbox) | Verifica browser con save reale + controllo Firestore |
| Acquisti — Preventivo IA | Verifica end-to-end con file reali e salvataggio IA |
| IA Archivista — 5 rami attivi | Verifica browser su `/next/ia/archivista` |
| IA Libretto | Upload e Salva live non eseguiti in sessione |
| Stub Archivista rimossi | Verifica browser con 5 rami attivi |

---

## 7. RIEPILOGO NUMERICO

| Categoria | Numero | Bloccante? |
|---|---|---|
| Moduli madre coperti in NEXT (inclusi read-only) | ~34 su 36 | — |
| Moduli NEXT con write authorization attiva | 10 | — |
| Moduli NEXT read-only dove madre scrive | **7** | ✅ SÌ |
| Pagine madre senza alcun equivalente NEXT | **2** | ✅ SÌ |
| Gap infrastrutturali bloccanti | **2** (auth, storage.rules) | ✅ SÌ |
| Moduli "DA VERIFICARE" browser live | **10+** | Rischio |

---

## 8. ROADMAP MINIMA PER PROMOZIONE

Sequenza consigliata, in ordine di impatto:

1. **[AUTH]** Sostituire `signInAnonymously` con autenticazione reale (Google/email) + claims di ruolo; aggiornare `NextRoleGuard` a claims-based.
2. **[STORAGE RULES]** Scrivere regole esplicite per tutti i path Storage già autorizzati nel barrier (`inventario/`, `mezzi_foto/`, `mezzi_aziendali/`, `documenti_pdf/`, `preventivi/`, `euromecc/`).
3. **[FIRESTORE RULES]** Matrice per-ruolo per le collection business (`@manutenzioni`, `@ordini`, `@inventario`, `@colleghi`, `@fornitori`, `@mezzi_aziendali`, `@documenti_*`).
4. **[MEZZI]** Implementare writer NEXT clone-safe per `@mezzi_aziendali` (create/edit/delete mezzo) + apertura barrier per `/next/mezzi`.
5. **[ANAGRAFICHE]** Implementare writer NEXT per `@colleghi` e `@fornitori` (Firestore) + apertura barrier per `/next/colleghi` e `/next/fornitori`.
6. **[ACQUISTI + DETTAGLIO ORDINE]** Portare la logica ordini/arrivi/approvals dalla madre a writer NEXT clone-safe; sbloccare barrier per `/next/acquisti` e `/next/dettaglio-ordine/:id`.
7. **[ATTREZZATURE]** Implementare writer NEXT per `@attrezzature_cantieri` + apertura barrier per `/next/attrezzature-cantieri`.
8. **[CISTERNA]** Implementare writer NEXT per `@documenti_cisterna` (setDoc/updateDoc) + apertura barrier per `/next/cisterna`.
9. **[MEZZO360]** Implementare `NextMezzo360Page` equivalente funzionale di `src/pages/Mezzo360.tsx` + aggiungere route `/next/mezzo-360/:targa` in `src/App.tsx`.
10. **[AUTISTA360]** Implementare `NextAutista360Page` equivalente funzionale di `src/pages/Autista360.tsx` o collegare il dossier autista esistente come sostituto + route `/next/autista-360`.
11. **[DA VERIFICARE]** Eseguire sessioni di browser testing end-to-end sui moduli marcati per ciascuna feature non verificata.
12. **[LINT]** Azzerare gli errori lint nel perimetro `src/next/**`.
13. **[BACKEND IA]** Piano di deploy del backend `backend/internal-ai` separato (non solo `localhost:4310`) e unificazione canali backend.

---

*Fine audit — 2026-04-22*
