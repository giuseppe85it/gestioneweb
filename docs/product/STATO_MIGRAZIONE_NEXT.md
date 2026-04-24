# STATO MIGRAZIONE NEXT

Ultimo aggiornamento: 2026-04-23
Fonte: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`

---

## 1. Verdetto di promozione

> **NEXT NON pronta a sostituire la madre.**
> Bloccanti: 5 moduli scriventi (aggiornamento 2026-04-23: chiusi Materiali da ordinare + Acquisti alias), 2 pagine non portate nella NEXT per decisione strategica (`Mezzo360`, `Autista360`), auth stub (`signInAnonymously`), `storage.rules` deny-all incompatibile con il codice.

> **Stato al 2026-04-23:** 2 gap scriventi chiusi (Materiali da ordinare + Acquisti alias). Restano 5 gap scriventi, 2 pagine fuori perimetro strategico (Mezzo360, Autista360), 2 bloccanti infrastrutturali (auth, firestore rules).

---

## 2. Matrice moduli

Legenda: ✅ OK scrivente verificato | 🟡 PARZIALE scrivente non verificato | 🔵 READ-ONLY | ❌ MANCANTE

### Operatività lavori

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| LavoriDaEseguire | NextLavoriDaEseguirePage | `/next/lavori-da-eseguire` | 🟡 | Verifica browser end-to-end |
| LavoriInAttesa | NextLavoriInAttesaPage | `/next/lavori-in-attesa` | 🟡 | Verifica browser end-to-end |
| LavoriEseguiti | NextLavoriEseguitiPage | `/next/lavori-eseguiti` | 🟡 | Verifica browser end-to-end |
| DettaglioLavoro | NextDettaglioLavoroPage | `/next/dettagliolavori/:id` | 🟡 | Verifica browser end-to-end |

### Manutenzioni

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| Manutenzioni | NextManutenzioniPage | `/next/manutenzioni` | 🟡 | Verifica browser su bottone Elimina, fix duplicato, PDF, dettaglio |

### Magazzino / Procurement

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| Inventario | NextMagazzinoPage (redirect) | `/next/inventario` → `?tab=inventario` | 🟡 | Verifica browser |
| MaterialiConsegnati | NextMagazzinoPage (redirect) | `/next/materiali-consegnati` → `?tab=materiali-consegnati` | 🟡 | Verifica browser |
| MaterialiDaOrdinare | NextMaterialiDaOrdinarePage | `/next/materiali-da-ordinare` | ✅ | Scrivente verificato 2026-04-23. Writer W1/W2/W3 (foto+ordine fabbisogno) + D1/D2/D3/D4 (dettaglio ordine inglobato). `Dettaglio Ordine` inglobato per scelta strategica 2026-04-23 — non va contato come modulo autonomo. |
| Acquisti | NextAcquistiPage → NextProcurementStandalonePage | `/next/acquisti` | ✅ | Alias URL di Materiali da ordinare — Navigate replace a `/next/materiali-da-ordinare?tab=ordini`. Scrivente per ereditarietà 2026-04-23. Nessuna logica propria (5 righe + redirect). |
| OrdiniInAttesa | NextOrdiniInAttesaPage | `/next/ordini-in-attesa` | 🔵 | Read-only (madre read-only — OK) |
| OrdiniArrivati | NextOrdiniArrivatiPage | `/next/ordini-arrivati` | 🔵 | Read-only (madre read-only — OK) |
| **AttrezzatureCantieri** | NextAttrezzatureCantieriPage | `/next/attrezzature-cantieri` | 🔵 | **Write authorization + writer `@attrezzature_cantieri`** |

### Anagrafiche

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| **Mezzi** | NextMezziPage | `/next/mezzi` | 🔵 | **Write authorization + writer `@mezzi_aziendali`** |
| **Colleghi** | NextColleghiPage | `/next/colleghi` | 🔵 | **Write authorization + writer Firestore colleghi** |
| **Fornitori** | NextFornitoriPage | `/next/fornitori` | 🔵 | **Write authorization + writer Firestore fornitori** |

### Dossier Mezzo

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| DossierLista | NextDossierListaPage | `/next/dossiermezzi` | 🟡 | Verifica browser |
| DossierMezzo | NextDossierMezzoPage | `/next/dossier/:targa` | 🟡 | Verifica browser |
| DossierGomme | NextDossierGommePage | `/next/dossier/:targa/gomme` | 🟡 | Verifica browser |
| DossierRifornimenti | NextDossierRifornimentiPage | `/next/dossier/:targa/rifornimenti` | 🟡 | Verifica browser |
| AnalisiEconomica | NextAnalisiEconomicaPage | `/next/analisi-economica/:targa` | 🔵 | Read-only (madre read-only — OK) |
| **Mezzo360** | — | — | ❌ | **Nessun componente NEXT, nessuna route. Escluso dal perimetro NEXT per scelta strategica (Giuseppe, 2026-04-23): candidato a sostituzione con capability IA + chat unificata; scelta attiva ma non definitiva, da rivalutare. Non va trattato come gap tecnico di migrazione ma come obsolescenza pianificata in valutazione. Riferimento: `docs/DIARIO_DECISIONI.md`** |

### Area Capo

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| CapoMezzi | NextCapoMezziPage | `/next/capo/mezzi` | 🔵 | Read-only (madre read-only — OK) |
| CapoCostiMezzo | NextCapoCostiMezzoPage | `/next/capo/costi/:targa` | 🔵 | Read-only (madre read-only — OK) |

### Centro Controllo / Home / Navigazione

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| Home | NextHomePage | `/next` | 🔵 | Dashboard (OK) |
| CentroControllo | NextCentroControlloParityPage | `/next/centro-controllo` | 🔵 | Read-only parity |
| GestioneOperativa | NextGestioneOperativaPage | `/next/gestione-operativa` | 🔵 | Hub navigazione (OK) |
| — | NextOperativitaGlobalePage | `/next/operativita-globale` | 🔵 | Pannelli read-only aggregati |

### IA

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| IAHome | NextIntelligenzaArtificialePage | `/next/ia` | 🔵 | Hub (OK) |
| IAApiKey | NextIAApiKeyPage | `/next/ia/apikey` | 🔵 | Config key |
| IALibretto | NextIALibrettoPage | `/next/ia/libretto` | 🟡 | Verifica browser save reale |
| IADocumenti | NextIADocumentiPage | `/next/ia/documenti` | 🟡 | Verifica browser |
| IACoperturaLibretti | NextIACoperturaLibrettiPage | `/next/ia/copertura-libretti` | 🔵 | Read-only (OK) |
| LibrettiExport | NextLibrettiExportPage | `/next/libretti-export` | 🔵 | Read-only |
| — | NextIAArchivistaPage | `/next/ia/archivista` | 🟡 | Verifica browser 5 rami attivi |
| — | NextInternalAiPage | `/next/ia/interna` | 🟡 | Verifica browser allegati reali |

### Cisterna

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| **CisternaCaravatePage** | NextCisternaPage | `/next/cisterna` | 🔵 | **Write authorization + writer `@documenti_cisterna`** |
| CisternaCaravateIA | NextCisternaIAPage | `/next/cisterna/ia` | 🔵 | Read-only |
| CisternaSchedeTest | NextCisternaSchedeTestPage | `/next/cisterna/schede-test` | 🔵 | Read-only |

### Autisti (separato)

| Modulo madre | Modulo NEXT | Route NEXT | Stato | Cosa manca |
|---|---|---|---|---|
| App autisti | NextAutisti*Page | `/next/autisti/*` | 🟡 | Verifica browser |
| Autisti Inbox/Admin | NextAutistiInbox*Page | `/next/autisti-inbox/*` | 🟡 | Verifica browser |
| **Autista360** | NextDriverExperiencePage (stub) | **non routed** | ❌ | **Stub non routed. Escluso dal perimetro NEXT per scelta strategica (Giuseppe, 2026-04-23): candidato a sostituzione con capability IA + chat unificata; scelta attiva ma non definitiva, da rivalutare. Non va trattato come gap tecnico di migrazione ma come obsolescenza pianificata in valutazione. Riferimento: `docs/DIARIO_DECISIONI.md`** |

### Euromecc (nativo NEXT)

| Modulo | Route NEXT | Stato | Note |
|---|---|---|---|
| NextEuromeccPage | `/next/euromecc` | 🟡 | Nessun equivalente madre. Write su Firestore `euromecc_*` + Storage `euromecc/relazioni/` + `@ordini` |

---

## 3. Gap scriventi da sbloccare (5 moduli — aggiornamento 2026-04-23)

Fonte: §3 audit. In ordine di priorità:

| Priorità | Modulo | Write ops da implementare | Target chiave/path |
|---|---|---|---|
| 🔴 ALTA | **Mezzi** | create/edit/delete mezzo | `@mezzi_aziendali` |
| 🔴 ALTA | **Colleghi** | create/edit collega | `storage/@colleghi` (Firestore) |
| 🔴 ALTA | **Fornitori** | create/edit fornitore | `storage/@fornitori` (Firestore) |
| 🟠 MEDIA | **AttrezzatureCantieri** | CRUD attrezzature | `@attrezzature_cantieri` |
| 🟠 MEDIA | **Cisterna** | inserimento/aggiornamento documenti | `@documenti_cisterna` (Firestore) |

**Chiusi il 2026-04-23:** `MaterialiDaOrdinare` (scrivente verificato in browser: W1/W2/W3 + D1/D2/D3/D4) + `Acquisti` (alias URL — scrivente per ereditarietà).

**Nota:** sbloccare il barrier non è sufficiente — per ogni modulo occorre anche implementare writer NEXT clone-safe con i wrapper `firestoreWriteOps.ts` / `storageWriteOps.ts`.

---

## 4. Pagine non portate nella NEXT

Fonte: §4 audit.

| Pagina madre | Route madre | Stato NEXT |
|---|---|---|
| `src/pages/Mezzo360.tsx` | `/mezzo-360/:targa` | ❌ Nessuna route NEXT, nessun componente. Escluso dal perimetro NEXT per scelta strategica (Giuseppe, 2026-04-23). Candidato a sostituzione con capability IA + chat unificata. Scelta attiva ma non definitiva, da rivalutare. Non va trattato come gap tecnico di migrazione ma come obsolescenza pianificata in valutazione. Riferimento: `docs/DIARIO_DECISIONI.md` |
| `src/pages/Autista360.tsx` | `/autista-360`, `/autista-360/:badge` | ❌ `NextDriverExperiencePage` è stub non-funzionale non routed. Escluso dal perimetro NEXT per scelta strategica (Giuseppe, 2026-04-23). Candidato a sostituzione con capability IA + chat unificata. Scelta attiva ma non definitiva, da rivalutare. Non va trattato come gap tecnico di migrazione ma come obsolescenza pianificata in valutazione. Riferimento: `docs/DIARIO_DECISIONI.md` |

---

## 5. Gap infrastrutturali

Fonte: §5 audit.

**5.1 Autenticazione (BLOCCANTE)**
- `src/App.tsx`: solo `signInAnonymously()` — nessun login admin, nessun JWT con claims di ruolo
- `NextRoleGuard` si basa su `role` preset simulato frontend, non su claims reali
- In produzione: qualunque utente anonimo con `/next/*` accede alla shell NEXT

**5.2 Storage Rules (BLOCCANTE)**
- `storage.rules` è deny-all; match espliciti aggiunti finora: solo `preventivi/{allPaths=**}` (task 2026-04-22)
- Paths già scritti dal codice NEXT privi di regola: `inventario/`, `mezzi_foto/`, `mezzi_aziendali/`, `documenti_pdf/`, `preventivi/manuali/`, `preventivi/ia/`, `euromecc/relazioni/`

**5.3 Firestore Rules (PARZIALE)**
- Copertura esplicita solo per `Euromecc` (con shape validation)
- Fallback resto Firestore: solo `request.auth != null` — nessuna matrice per-ruolo

**5.4 Lint globale**
- `npm run lint` = KO, 584 problemi totali (568 errori, 16 warning)
- Perimetro NEXT ha delta zero rispetto al baseline, ma il globale include `src/autistiInbox/*`, `src/autisti/*`, `src/pages/*`, `src/utils/*`

**5.5 Backend IA frammentato**
- 5 canali distinti: `functions/`, `functions-schede/`, `api/pdf-ai-enhance.ts`, `server.js` (porta 3001), `backend/internal-ai/` (porta 4310)
- Il backend `backend/internal-ai/` è usato dalla NEXT in produzione ma non ha piano di deploy (oggi solo `localhost:4310`)

**5.6 Double autisti events stream**
- `@storico_eventi_operativi` e `autisti_eventi` in parallelo, deduplication fragile

**5.7 Contratto allegati preventivi doppio**
- `preventivi/manuali/<id>.pdf` (writer manuale) vs `preventivi/ia/<uuid>.<ext>` (writer IA)

---

## 6. Moduli in stato "DA VERIFICARE"

Fonte: §6 audit. Verifica browser live non eseguita su:

| Modulo | Cosa manca di verifica |
|---|---|
| Manutenzioni — bottone Elimina | Delete reale in browser |
| Manutenzioni — fix duplicato modifica | Cleanup duplicati dataset esistente |
| Manutenzioni — restyling tab Dettaglio | Verifica layout browser live |
| Manutenzioni — fix runtime foto PDF | Verifica PDF generato in browser |
| Manutenzioni — Dossier → dettaglio manutenzione | Navigazione browser live |
| Acquisti — Preventivo manuale (WhatsApp/Email) | Save reale + controllo Firestore |
| Acquisti — Preventivo IA | End-to-end con file reali |
| IA Archivista — 5 rami attivi | Verifica su `/next/ia/archivista` |
| IA Libretto — Salva | Upload + Salva live |
| Stub Archivista rimossi | 5 rami attivi verificati |

---

## 7. Roadmap minima per la promozione

Fonte: §8 audit. In ordine di esecuzione:

1. **[AUTH]** Sostituire `signInAnonymously` con auth reale (Google/email) + claims di ruolo; aggiornare `NextRoleGuard` a claims-based
2. **[STORAGE RULES]** Regole esplicite per tutti i path Storage già autorizzati nel barrier
3. **[FIRESTORE RULES]** Matrice per-ruolo per le collection business
4. **[MEZZI]** Writer NEXT clone-safe per `@mezzi_aziendali` + apertura barrier `/next/mezzi`
5. **[ANAGRAFICHE]** Writer NEXT per `@colleghi` e `@fornitori` + apertura barrier
6. ✅ **[ACQUISTI + MATERIALI DA ORDINARE — Completato 2026-04-23]** MaterialiDaOrdinare scrivente (W1–W3, D1–D4). Acquisti è alias URL (Navigate replace) — scrivente per ereditarietà. Pendente: test browser flusso IA preventivi.
7. **[ATTREZZATURE]** Writer NEXT per `@attrezzature_cantieri` + apertura barrier
8. **[CISTERNA]** Writer NEXT per `@documenti_cisterna` + apertura barrier
9. **[MEZZO360]** Decisione strategica pendente: confermare sostituzione con capability IA+chat o implementare equivalente NEXT
10. **[AUTISTA360]** Decisione strategica pendente: confermare sostituzione con capability IA+chat o implementare equivalente NEXT
11. **[DA VERIFICARE]** Sessioni browser testing end-to-end su tutti i moduli marcati
12. **[LINT]** Azzerare errori lint nel perimetro `src/next/**`
13. **[BACKEND IA]** Piano di deploy `backend/internal-ai` e unificazione canali backend

---

## 8. Decisioni strategiche registrate

Le scelte di perimetro e prodotto non sono tracciate in questo file. La fonte unica delle decisioni strategiche e `docs/DIARIO_DECISIONI.md`, che e un registro temporale: ogni decisione ha una data e non viene corretta retroattivamente.

Decisioni attive che impattano lo stato di questo documento (al 2026-04-23):
- Dettaglio Ordine inglobato in Materiali da ordinare
- Mezzo360 e Autista360 esclusi dal perimetro NEXT in favore di capability IA+chat (in valutazione)
- Materiali da ordinare NEXT chiuso scrivente 2026-04-23 (primo modulo NEXT davvero scrivente in produzione)
- Acquisti NEXT confermato alias URL di Materiali da ordinare 2026-04-23 — scrivente per ereditarietà

Per eventuali cambi o nuove decisioni, aggiornare sempre prima `docs/DIARIO_DECISIONI.md`.

---

## 9. Storico aggiornamenti

| Data | Evento |
|---|---|
| 2026-04-23 | Riscrittura integrale da zero in base ad `AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`. Nessun contenuto del file precedente riutilizzato. Backup vecchia versione: `docs/archive/2026-04-23/STATO_MIGRAZIONE_NEXT.md.bak` (il file non preesisteva). |
| 2026-04-23 | Patch fine giornata: chiusi Materiali da ordinare e Acquisti alias. Gap scriventi 7 → 5. Dettaglio test flusso IA preventivi pendente. |
