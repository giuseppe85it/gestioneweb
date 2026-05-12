# SPEC TECNICO — Archivio Storico NEXT

## 0. METADATI

- **Versione**: 1.0 DEFINITIVA
- **Data**: 2026-05-11 (promossa dalla bozza iniziale in PROMPT 29.5)
- **Autore**: Claude Code (bozza iniziale in PROMPT 29.4; promozione a 1.0 in PROMPT 29.5)
- **Stato**: APPROVATO da Giuseppe 2026-05-11, pronto per implementazione (PROMPT 29.6+)
- **Riferimenti incrociati**:
  - Audit fondazionale: [docs/audit/2026-05-11_AUDIT_ARCHIVIO_STORICO_NEXT.md](../audit/2026-05-11_AUDIT_ARCHIVIO_STORICO_NEXT.md)
  - Mockup HTML: [docs/design-mockups/archivio-storico/Archivio_Storico_v2.html](../design-mockups/archivio-storico/Archivio_Storico_v2.html) (v2, 10 maggio 2026, approvato da Giuseppe; rinominato in PROMPT 29.5)
  - README mockup: [docs/design-mockups/archivio-storico/README.MD.txt](../design-mockups/archivio-storico/README.MD.txt)
  - Registro collezioni: [docs/product/REGISTRO_COLLECTION_FIRESTORE.md](REGISTRO_COLLECTION_FIRESTORE.md)
  - Memo critico R0.4 pattern propagazione campi: [docs/DIARIO_DECISIONI.md](../DIARIO_DECISIONI.md) entry 2026-05-11

> **R0 anti-allucinazione applicato**: ogni claim ha path:line verbatim. Quando un campo del mockup non esiste nel type reale, è classificato `CAMPO NON DISPONIBILE NEL TYPE`. Niente invenzioni.

---

## 1. SCOPE E NON-SCOPE

### 1.1 IN SCOPE
- Una **nuova tab pagina** "Archivio storico" dentro `NextCentroControlloParityPage.tsx`, sorella di "Sinottica flotta v2"
- **4 sub-tab**: Lavori, Manutenzioni, Segnalazioni, Richieste
- **Filtri globali sticky**: Autista, Targa, Cerca testuale scoped, Periodo (default ultimi 30 giorni, prolungabile senza limiti)
- **Toggle densità lista**: Comoda / Compatta
- **Click riga = espande inline** (no modale, no navigazione)
- **Foto mezzo** in colonna 64x48 (riusa pattern Sinottica V2)
- **Mini-timeline orizzontale** eventi (Aperta · Presa · Chiusa · Lavoro generato) — solo step esistenti per quel record
- **Ricerca scoped modalità C ibrida**: la sub-tab attiva filtra; le altre sub-tab mostrano contatori dinamici dei match
- **Raggruppamento per giorno** con day-separator sticky
- **Stato vuoto** con bottone "Azzera filtri"
- **Solo lettura**: nessun writer, nessun CTA operativo

### 1.2 ESPLICITAMENTE FUORI SCOPE
- Rifornimenti (audit §1.6: 2 collezioni, shape ricchissima, eventi puntuali senza lifecycle — escape hatch futuro)
- Controlli mezzo autisti (audit §1.4: shape simile a segnalazioni ma SENZA il sub-tab perché Giuseppe ha deciso 4 sub-tab e non 5 — controlli restano nel chip Sinottica)
- Ordini / Materiali da ordinare / Acquisti (audit §1.7: righe annidate, lifecycle per riga, UI naturalmente diversa)
- Scadenze collaudi (audit §1.8: campi inline su `@mezzi_aziendali`, non collezione storica)
- Storico eventi operativi (audit §6: log azioni autista, non lifecycle delle 4 collezioni)
- Azioni operative: niente "Chiudi", "Riapri", "Marca presa in carico", "Crea lavoro" (già coperto nel modal CC esistente)
- Modali grandi tipo Indagine/Analisi/Cronologia/HardDelete (intoccabili, PROMPT 27.x stabile)
- Estensione di `@storico_eventi_operativi` come log unificato (decisione architetturale separata, vedi §15 punto aperto 1)

---

## 2. ARCHITETTURA D'ALTO LIVELLO

### 2.1 Diagramma testuale

```
NextCentroControlloParityPage.tsx (host esistente)
└── tabbar principale (NUOVA, da introdurre — vedi §3)
    ├── tab "Sinottica flotta v2"  → NextCentroControlloSinottica (esistente)
    └── tab "Archivio storico"     → NextArchivioStoricoTab (NUOVO)
                                       │
                                       ├── ArchivioToolbar (filtri sticky)
                                       │     - select Autista
                                       │     - select Targa
                                       │     - input Cerca (debounced)
                                       │     - periodo (date-picker / preset)
                                       │     - chip "N filtri attivi · azzera"
                                       │     - meta destra: "N risultati · ordinati per data ↓"
                                       │
                                       ├── ArchivioSubTabs (4 sub-tab con count dinamico)
                                       │     - Lavori (n) | Manutenzioni (n) | Segnalazioni (n) | Richieste (n)
                                       │     - density toggle inline destra
                                       │
                                       └── ArchivioFeed (orchestratore)
                                             ├── ArchivioDaySeparator (sticky, raggruppamento)
                                             ├── ArchivioRowLavoro
                                             ├── ArchivioRowManutenzione
                                             ├── ArchivioRowSegnalazione
                                             ├── ArchivioRowRichiesta
                                             ├── ArchivioRowExpanded (polimorfa per kind)
                                             └── ArchivioEmptyState
```

### 2.2 Decomposizione componenti React (proposta, nomi)

| Componente | Responsabilità | File proposto |
|---|---|---|
| `NextArchivioStoricoTab` | Host della tab, orchestratore hook+layout | `src/next/centroControllo/archivioStorico/NextArchivioStoricoTab.tsx` |
| `ArchivioToolbar` | Filtri sticky in alto | `src/next/centroControllo/archivioStorico/ArchivioToolbar.tsx` |
| `ArchivioSubTabs` | 4 sub-tab + density toggle + count dinamici | `src/next/centroControllo/archivioStorico/ArchivioSubTabs.tsx` |
| `ArchivioFeed` | Lista cronologica del sub-tab attivo | `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx` |
| `ArchivioDaySeparator` | Separatore sticky "Oggi · Maggio · Aprile" | `src/next/centroControllo/archivioStorico/ArchivioDaySeparator.tsx` |
| `ArchivioRowLavoro` | Riga sub-tab Lavori | `src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx` |
| `ArchivioRowManutenzione` | Riga sub-tab Manutenzioni | `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx` |
| `ArchivioRowSegnalazione` | Riga sub-tab Segnalazioni | `src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx` |
| `ArchivioRowRichiesta` | Riga sub-tab Richieste | `src/next/centroControllo/archivioStorico/rows/ArchivioRowRichiesta.tsx` |
| `ArchivioRowExpanded` | Card espansa polimorfica per kind (4 varianti interne) | `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` |
| `ArchivioMiniTimeline` | Mini-timeline orizzontale stati | `src/next/centroControllo/archivioStorico/ArchivioMiniTimeline.tsx` |
| `ArchivioVeicoloPhoto` | Foto mezzo 64x48 con fallback SVG | `src/next/centroControllo/archivioStorico/ArchivioVeicoloPhoto.tsx` |
| `ArchivioEmptyState` | Stato vuoto + bottone azzera | `src/next/centroControllo/archivioStorico/ArchivioEmptyState.tsx` |

### 2.3 Hook proposti

| Hook | Responsabilità | File proposto |
|---|---|---|
| `useArchivioData` | Orchestratore 4 reader paralleli + normalizzazione a `ArchivioRecord` discriminated union | `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts` |
| `useArchivioFilters` | Stato globale filtri + persistenza in-memory | `src/next/centroControllo/archivioStorico/hooks/useArchivioFilters.ts` |
| `useArchivioSearch` | Logica scoped C: filtro attivo + contatori dinamici tab inattive | `src/next/centroControllo/archivioStorico/hooks/useArchivioSearch.ts` |
| `useArchivioPersistence` | (opz) Salva preferenze densità + ultima sub-tab | `src/next/centroControllo/archivioStorico/hooks/useArchivioPersistence.ts` |

### 2.4 Path radice canonico

`src/next/centroControllo/archivioStorico/` — **DECISIONE D1 di Giuseppe (RISOLTO 2026-05-11)**: nuova dir radice per moduli CC organizzati per dominio. La dir non esiste oggi nel codice (verificato con `find` — i CC components attuali stanno in `src/next/components/` con prefisso `NextCentroControllo*`); l'archivio storico inaugura il nuovo schema `centroControllo/<modulo>/`. Futuri moduli CC seguiranno lo stesso pattern.

---

## 3. INTEGRAZIONE NEL CC ESISTENTE

### 3.1 Stato attuale tabbar interna

**Importante**: `NextCentroControlloParityPage.tsx` NON ha oggi una tabbar principale "Sinottica vs Archivio". Ha solo:
1. Header pagina + render diretto di `<NextCentroControlloSinottica>` a [src/next/NextCentroControlloParityPage.tsx:1403](../src/next/NextCentroControlloParityPage.tsx#L1403)
2. Una tabbar **interna** sotto la Sinottica (`cc-tabs`, classi `active`) con 3 voci `TabKey = "rifornimenti" | "segnalazioni" | "controlli"` ([src/next/NextCentroControlloParityPage.tsx:73-76](../src/next/NextCentroControlloParityPage.tsx#L73-L76)), renderizzata a [:1741-1763](../src/next/NextCentroControlloParityPage.tsx#L1741-L1763)

Il mockup richiede una tabbar **NUOVA**, di livello **superiore** (sotto il `page-head`, sopra la toolbar archivio), con 2 voci sorelle: "Sinottica flotta" e "Archivio storico".

### 3.2 Patch chirurgica proposta

**Punto di inserimento**: subito **prima** del rendering `<NextCentroControlloSinottica>` a [:1403](../src/next/NextCentroControlloParityPage.tsx#L1403), aggiungere:

```tsx
// nuovo state — propagazione campi R0.4 OK perché campo è locale al host
const [archivioMode, setArchivioMode] = useState<"sinottica" | "archivio">("sinottica");

// nuova page-tabbar sopra Sinottica
<div className="cc-page-tabs"> ... 2 button "Sinottica" / "Archivio" ... </div>

{archivioMode === "sinottica" && <NextCentroControlloSinottica ... />}
{archivioMode === "archivio" && <NextArchivioStoricoTab />}
```

**File coinvolti dalla patch**:
- `src/next/NextCentroControlloParityPage.tsx` — aggiunta state `archivioMode`, render tabbar nuova, mount condizionale di `NextArchivioStoricoTab`. **Minima invasività**: ~15-20 righe nette di aggiunta, nessuna rimozione, nessuna refactor dei flussi esistenti.

### 3.3 Tab esistenti che NON vanno toccate
- La tabbar interna `cc-tabs` (rifornimenti/segnalazioni/controlli) [:1741-1763](../src/next/NextCentroControlloParityPage.tsx#L1741-L1763) **resta dentro la sezione Sinottica** — visibile solo quando `archivioMode === "sinottica"`
- Tutti gli handler PROMPT 27 (markSegnalazioneChiusa, markControlloChiuso, markRichiestaEvasa, createLavoroFromEvento) — invariati
- Modali Indagine, Analisi, Modifica, Cronologia, HardDelete, EditMezzo, HomeAutistiEvento — non vengono né aperte né referenziate da Archivio Storico

### 3.4 Rischio E2E (memo Giuseppe: 275/275 verdi)

**Test E2E esistente sul CC**: solo 1 test E2E presente sul CC ([tests/e2e/23-audit-media-kml-centro-controllo.spec.ts:63](../tests/e2e/23-audit-media-kml-centro-controllo.spec.ts#L63) "audit Media km/L"). Estrae righe dal DOM della Sinottica, controlla `(R.km - seed.km) / R.litri`. **Non conta tab della tabbar**, quindi NON è a rischio di rottura dall'aggiunta della nuova page-tabbar.

**Test esistenti potenzialmente a rischio** (da verificare runtime):
- Eventuali test che assertano il primo `<NextCentroControlloSinottica>` come root child del CC dopo l'header → la nuova tabbar pre-Sinottica può rompere selettori CSS posizionali. Verificare prima dell'integrazione.
- Test che cliccano sulla tabbar `cc-tabs` (rifornimenti/segnalazioni/controlli) — restano OK perché la tabbar è dentro la sezione Sinottica, raggiungibile cliccando prima "Sinottica" sulla page-tabbar (default).

**Test nuovi richiesti**: dettaglio in §13.

---

## 4. READER FIRESTORE — 4 COLLEZIONI

### 4.1 `@lavori`

- **Nome verbatim**: `"@lavori"` — [src/next/domain/nextLavoriDomain.ts:16](../src/next/domain/nextLavoriDomain.ts#L16) `const LAVORI_DATASET_KEY = "@lavori";`
- **Reader esistente**:
  - `readNextLavoriInAttesaSnapshot(options)` → solo aperti ([src/next/domain/nextLavoriDomain.ts:934-938](../src/next/domain/nextLavoriDomain.ts#L934-L938))
  - `readNextLavoriEseguitiSnapshot(options)` → solo eseguiti ([:940-944](../src/next/domain/nextLavoriDomain.ts#L940-L944))
- **GAP**: nessun reader "ALL_HISTORY" che includa entrambi gli stati. L'archivio storico necessita di **tutti** i lavori (aperti+eseguiti+in_attesa) nel periodo selezionato.
- **PROPOSTA NUOVO READER**:
  - Nome: `readNextLavoriArchivioSnapshot(options: { fromTs?: number; toTs?: number; includeCloneOverlays?: boolean })`
  - Signature: ritorna `NextLavoriListaSnapshot` (riusa il type esistente) con `routeId` nuovo `"lavori-archivio"` (estendere `NextLavoriListaRouteId` a [src/next/domain/nextLavoriDomain.ts:30](../src/next/domain/nextLavoriDomain.ts#L30) `= "lavori-in-attesa" | "lavori-eseguiti" | "lavori-archivio"`)
  - Internamente: chiama la stessa pipeline `readNextLavoriListaSnapshot` ma con filtro stato vuoto (include tutti) + filtro periodo client-side
- **Filtri lato server vs client**:
  - Firestore: il dataset `@lavori` è un documento storage unico (vedi `LAVORI_DATASET_KEY` come doc, non collection root) → **niente where lato server**, tutto in memory dopo lettura
  - Filtro periodo: post-lettura, su `timestampInserimento` ([:74](../src/next/domain/nextLavoriDomain.ts#L74))
  - Filtro targa: post-lettura su `mezzoTarga`/`targa`
  - Filtro autista: post-lettura su `segnalatoDa` + `chiHaEseguito`
- **Cardinalità stimata**: ALTA (audit §1.1 — uno per ogni segnalazione/controllo + creazioni manuali)
- **Strategia di load**: vedi §4.5

### 4.2 `@manutenzioni`

- **Nome verbatim**: `"@manutenzioni"` — [src/next/domain/nextManutenzioniDomain.ts:15](../src/next/domain/nextManutenzioniDomain.ts#L15)
- **Reader esistente**: `readNextManutenzioniLegacyDataset()` ([src/next/domain/nextManutenzioniDomain.ts:716-750](../src/next/domain/nextManutenzioniDomain.ts#L716-L750)) — ritorna `NextManutenzioniLegacyDatasetRecord[]` **integrale** (tutto lo storico, no filtri)
- **GAP**: nessuno — il reader è già "ALL_HISTORY".
- **Filtri**:
  - Periodo: client-side post-lettura su `parseDateFlexible(record.data).getTime()` (data è string legacy)
  - Targa: client-side su `record.targa`
  - Autista: client-side su `record.eseguito`/`record.fornitore` (NB: nelle manutenzioni "autore" è ambiguo, vedi §6.1)
- **Cardinalità stimata**: MEDIA-ALTA
- **Riuso possibile**: già consumato da [src/next/NextLegacyStorageBoundary.tsx:209](../src/next/NextLegacyStorageBoundary.tsx#L209) e da `NextManutenzioniPage`.

### 4.3 `@segnalazioni_autisti_tmp` + `@controlli_mezzo_autisti` (parziale) + `@richieste_attrezzature_autisti_tmp`

- **Nomi verbatim**: dichiarati in [src/next/domain/nextAutistiDomain.ts:23-25](../src/next/domain/nextAutistiDomain.ts#L23-L25)
- **Reader esistente**: `readNextAutistiReadOnlySnapshot(now, options)` ([src/next/domain/nextAutistiDomain.ts:1234-1267](../src/next/domain/nextAutistiDomain.ts#L1234-L1267)) — ritorna `NextAutistiReadOnlySnapshot` con `segnalazioniRows`, `controlliRows`, `richiesteRows` **tutti** (chiusi+aperti), tipizzati come `NextAutistiSegnalazioneSectionItem[]` / `NextAutistiControlloSectionItem[]` / `NextAutistiRichiestaSectionItem[]`
- **GAP**: nessuno — è già "ALL_HISTORY". Include già i campi soft-delete (`chiusa`/`chiuso`/`evasa`) e i campi linkedLavoroId/hasLinkedLavoro (audit §2.3-2.5).
- **Filtri**:
  - Periodo: client-side post-lettura su `record.timestamp`
  - Targa: client-side su `record.targa` (segnalazioni/richieste) e `record.targaMotrice`/`record.targaRimorchio` (controlli, anche se controlli **NON è una sub-tab dell'archivio**, vedi §1.2)
  - Autista: client-side su `record.autistaNome` + `record.badgeAutista`
- **Cardinalità stimata**: ALTA per segnalazioni, MEDIA per richieste
- **Riuso possibile**: già consumato da `NextCentroControlloParityPage.tsx` ([:809](../src/next/NextCentroControlloParityPage.tsx#L809) `loadAutistiReadOnlySections`).

### 4.4 Strategia di load — lazy vs eager

**Raccomandazione: EAGER su mount tab Archivio, LAZY sui sub-pane non-attivi**.

Motivazione:
- I 4 sub-tab condividono i **filtri globali** (autista/targa/periodo/search) → la query "X risultati totali · 1 filtro attivo" nel toolbar richiede **tutti i 4 dataset filtrati in parallelo** per il count
- I **contatori dinamici** delle sub-tab non-attive (modalità C, vedi §7) richiedono che TUTTI e 4 i dataset siano in memoria filtrati
- Lazy load per ogni click sub-tab → l'utente vedrebbe count "0" su sub-tab non-ancora-caricate, UX sbagliata
- **Costo**: 4 chiamate Firestore in parallelo al mount (Promise.all), una sola volta per sessione finché non viene cambiato il periodo
- **Trigger refetch**: cambio del filtro Periodo (perché altera il dataset Firestore se in futuro si introduce filtro server-side); cambi di Autista/Targa/Search = solo refilter client-side, no refetch

### 4.5 Stima volumi e performance

| Collezione | Cardinalità (audit §1) | Default ultimi 30gg | Note |
|---|---|---|---|
| `@lavori` | ALTA | ~50-200 records | Default periodo già filtra il 95% dello storico |
| `@manutenzioni` | MEDIA-ALTA | ~30-100 records | OK |
| `@segnalazioni` | ALTA | ~30-150 records | Soft-delete reduce visibili |
| `@richieste` | MEDIA | ~10-50 records | OK |
| **Totale archivio aperto** | — | **~120-500 records** | Gestibile in memoria, render virtualizzazione NON necessaria |

Per periodi più lunghi (es. "ultimi 12 mesi" su flotta da 30 mezzi) si arriva facilmente a 3000-5000 records totali. **Raccomandazione**: se il filtro periodo > 6 mesi, mostrare warning toolbar tipo "Caricamento esteso…" oppure introdurre virtualizzazione futura (non in scope 0.1).

---

## 5. TYPE PROIEZIONE — MAPPING CAMPI UI → CODICE

### 5.0 Type unificato proposto

Per l'archivio, propongo un **discriminated union** `ArchivioRecord` che incapsula i 4 record:

```typescript
type ArchivioRecord =
  | { kind: "lavoro"; data: NextLavoriListaRow }
  | { kind: "manutenzione"; data: NextManutenzioniLegacyDatasetRecord }
  | { kind: "segnalazione"; data: NextAutistiSegnalazioneSectionItem }
  | { kind: "richiesta"; data: NextAutistiRichiestaSectionItem };
```

> **Note**: `NextLavoriListaRow` ([src/next/domain/nextLavoriDomain.ts:174-192](../src/next/domain/nextLavoriDomain.ts#L174-L192)) è la versione "row" più snella di `NextLavoroReadOnlyItem`, già usata dalle pagine `NextLavori*`. Il SPEC suggerisce `NextLavoriListaRow` per consistenza, ma se serve `source.originId` (per il link "generato da segnalazione" timeline) bisogna passare a `NextLavoroReadOnlyItem` ([:65-114](../src/next/domain/nextLavoriDomain.ts#L65-L114)). **Decisione**: usare `NextLavoroReadOnlyItem` (più ricco; `source.*` necessario per la timeline §5.1).

> **DECISIONE D2 di Giuseppe (RISOLTO 2026-05-11)**: la **colonna ID NON è visualizzata** nella v1.0 dell'archivio. I formati decorativi "L-2026-NNN" / "M-2026-NNN" / "S-2026-NNN" / "R-2026-NNN" presenti nel mockup HTML (span `.rec-id`) NON vengono renderizzati dai componenti React. L'`id` raw del record (UUID/timestamp) resta usato solo come `key` React per la riga e per i join interni (es. link "generato da segnalazione" risolto via `source.originId`). Coerente con README mockup "ho un dubbio, scorro e trovo": l'utente cerca per descrizione/targa/autista, non per ID.

### 5.1 LAVORI — Mapping campi UI → type

Type: `NextLavoroReadOnlyItem` ([src/next/domain/nextLavoriDomain.ts:65-114](../src/next/domain/nextLavoriDomain.ts#L65-L114))

**Riga (compatta):**

| Elemento UI mockup | Campo type | Note disponibilità |
|---|---|---|
| Data colonna sinistra (dd mmm + anno + ora) | `timestampInserimento` ([:74](../src/next/domain/nextLavoriDomain.ts#L74)) | ✓ DISPONIBILE — formattare con date-fns / Intl |
| Targa (header) | `mezzoTarga` ([:111](../src/next/domain/nextLavoriDomain.ts#L111)) | ✓ DISPONIBILE — string normalizzata |
| Categoria (Trattore/Cisterna) | NON SU `NextLavoroReadOnlyItem` | ⚠ JOIN richiesto con `@mezzi_aziendali.categoria` via `mezzoTarga`. Già fatto in Sinottica V2 (cita `m.categoria` in [src/next/components/NextCentroControlloSinottica.tsx:590-591](../src/next/components/NextCentroControlloSinottica.tsx#L590-L591)) |
| Pill urgenza (Alta/Media/Bassa) | `urgenza` ([:78](../src/next/domain/nextLavoriDomain.ts#L78)) `NextLavoroUrgenza = "bassa"\|"media"\|"alta"\|null` | ✓ DISPONIBILE |
| Titolo riga | `descrizione` ([:70](../src/next/domain/nextLavoriDomain.ts#L70)) + `dettagli` ([:71](../src/next/domain/nextLavoriDomain.ts#L71)) opz | ✓ DISPONIBILE — concatenare "descrizione" oppure mostrare solo `descrizione` (mockup riga mostra una sola frase = solo `descrizione`) |
| "Aperto da X" | `segnalatoDa` ([:79](../src/next/domain/nextLavoriDomain.ts#L79)) | ✓ DISPONIBILE (può essere null) |
| "Eseguito da X" | `chiHaEseguito` ([:80](../src/next/domain/nextLavoriDomain.ts#L80)) | ✓ DISPONIBILE per storage; ⚠ ESCLUSO dal boundary AI ([REGISTRO:1007](REGISTRO_COLLECTION_FIRESTORE.md#L1007)) — visibile in NEXT, NON in chat IA |
| Mini-timeline step Aperta | `timestampInserimento` | ✓ DISPONIBILE |
| Mini-timeline step Presa | **NON TRACCIATO** (audit §5.1) | ✗ NON MOSTRARE step "Presa/Ricevuta" sui lavori — il modello dati `@lavori` non ha né timestamp né flag per la presa in carico. La decisione D4 (pallino "Ricevuta" senza timestamp) si applica solo a Segnalazioni e Richieste, NON ai Lavori. |
| Mini-timeline step Chiusa/Eseguita | `timestampEsecuzione` ([:75](../src/next/domain/nextLavoriDomain.ts#L75)) | ✓ DISPONIBILE se `eseguito === true`; altrimenti niente step |
| Mini-timeline step "Generato da segnalazione" | `source.originType === "segnalazione"` + `source.originId` ([:91-96](../src/next/domain/nextLavoriDomain.ts#L91-L96)) | ✓ DISPONIBILE — link a sub-tab Segnalazioni filtrato per ID, **non cross-tab navigation** ma intra-archivio scroll/highlight |
| Badge "Materiali (n)" | NON SU `NextLavoroReadOnlyItem` | ✗ **ESCLUSO — DECISIONE D3 di Giuseppe (RISOLTO 2026-05-11)**: badge Materiali NON renderizzato sui Lavori. Mantenuto solo sulle Manutenzioni dove `materiali` esiste davvero (`materiali.length` di `NextManutenzioniLegacyMaterialRecord[]`). Memo: lavori e manutenzioni restano concettualmente distinti — niente JOIN runtime per derivare materiali sui lavori. Vedi `docs/DIARIO_DECISIONI.md` per il razionale. |
| Foto mezzo colonna 64x48 | `fotoUrl` da `NextAnagraficheFlottaMezzoItem` ([src/next/nextAnagraficheFlottaDomain.ts](../src/next/nextAnagraficheFlottaDomain.ts), già letto da `readNextAnagraficheFlottaSnapshot`) | ✓ DISPONIBILE via join targa |

**Card espansa LAVORI** (mockup §righe 894-931):

| Sezione mockup | Campo type | Disponibilità |
|---|---|---|
| Descrizione (testo lungo + spessore residuo, soglia ecc.) | `descrizione` + `dettagli` | ✓ PARZIALE — solo testo libero; metriche tipo "spessore residuo 22 mm — soglia 18 mm" sono **invenzioni del mockup**, non esistono nel type. **Mostrare solo testo libero**. |
| Note officina (blockquote) | NESSUN CAMPO | ✗ ESCLUDERE sezione |
| Fornitore: Ragione sociale, Referente, Telefono, N. fattura, Importo, Pagamento | NESSUN CAMPO sul `NextLavoroReadOnlyItem` | ✗ ESCLUDERE sezione interamente — questi campi appartengono al record `@manutenzioni` correlato (se esiste), non al `@lavori` |
| Origine: link a segnalazione + presa in carico autore | `source.originType` + `source.originId` ([:91-96](../src/next/domain/nextLavoriDomain.ts#L91-L96)) | ✓ DISPONIBILE — link interno. "presa in carico da R. Costa alle 09:15" è derivato dalla **segnalazione sorgente** (`stato:"presa_in_carico"` + `letta:true`) non dal lavoro |
| Chiusura: chi, km al rientro, esito | `chiHaEseguito` + `timestampEsecuzione` | ✓ PARZIALE — "chi" + "quando" disponibili; **"km al rientro" e "esito positivo" NON ESISTONO NEL TYPE** → ESCLUDERE |

**Pattern propagazione campi R0.4**: se in futuro si vuole esporre "Materiali (n)" o "Note officina", servirà:
1. Aggiungere campo al type reader (`NextLavoroReadOnlyItem` o joint con `@manutenzioni`)
2. Propagare nel mapper `mapToArchivioRecord` in `useArchivioData`
3. Aggregator esposto a `ArchivioRowLavoro`
4. Render condizionale nella card espansa

### 5.2 MANUTENZIONI — Mapping campi UI → type

Type: `NextManutenzioniLegacyDatasetRecord` ([src/next/domain/nextManutenzioniDomain.ts:110-130](../src/next/domain/nextManutenzioniDomain.ts#L110-L130))

**Riga:**

| Elemento UI mockup | Campo type | Note |
|---|---|---|
| Data sinistra | `data` ([:118](../src/next/domain/nextManutenzioniDomain.ts#L118)) string legacy → parse con `parseDateFlexible` (interno al reader, [:323](../src/next/domain/nextManutenzioniDomain.ts#L323)) | ✓ DISPONIBILE |
| Targa | `targa` ([:112](../src/next/domain/nextManutenzioniDomain.ts#L112)) | ✓ DISPONIBILE; valore può essere "—" per manutenzioni di compressore/attrezzature |
| Categoria | join `@mezzi_aziendali.categoria` se targa presente; **per `tipo === "compressore"` mostrare "Compressore officina"; per `tipo === "attrezzature"` mostrare "Cassetta autista ..."** (testo descrittivo, vedi mockup r1395-1399) | ⚠ JOIN + logica condizionale |
| Type-chip "Mezzo"/"Compressore"/"Attrezzature" | `tipo` ([:119](../src/next/domain/nextManutenzioniDomain.ts#L119)) `"mezzo"\|"compressore"\|"attrezzature"` | ✓ DISPONIBILE |
| Titolo | `descrizione` ([:116](../src/next/domain/nextManutenzioniDomain.ts#L116)) | ✓ DISPONIBILE |
| "Fornitore X" | `fornitore` ([:120](../src/next/domain/nextManutenzioniDomain.ts#L120)) opz | ✓ DISPONIBILE |
| Importo "CHF 1 240.00" | `importo` ([:127](../src/next/domain/nextManutenzioniDomain.ts#L127)) + `sourceDocumentCurrency` ([:129](../src/next/domain/nextManutenzioniDomain.ts#L129)) `"EUR"\|"CHF"\|"UNKNOWN"\|null` | ✓ DISPONIBILE |
| "contratto" badge (importo 0.00) | derivato: `importo === 0` o `importo === null` + `fornitore` di tipo contratto | ⚠ logica heuristica; **DECISIONE RICHIESTA** §15 |
| Timeline Aperta | NON TRACCIATA SEPARATAMENTE — coincide con `data` (audit §5.2) | ✓ usare `data` |
| Timeline Presa | NON TRACCIATA | ✗ NON MOSTRARE |
| Timeline Eseguita | coincide con `data` (record creato post-fatto) | ✓ MOSTRARE solo Aperta=Eseguita oppure unico step "Eseguita" |
| Timeline "Generato" | NESSUN CAMPO `source.*` su manutenzioni (audit §5.2) | ✗ NON MOSTRARE |
| Badge "Materiali (n)" | `materiali` ([:121](../src/next/domain/nextManutenzioniDomain.ts#L121)) array → `materiali.length` | ✓ DISPONIBILE |
| Badge "Foto (n)" | NESSUN CAMPO `foto`/`fotoCount` su manutenzioni | ✗ ESCLUDERE (mockup mostra ma è invenzione) |
| Foto mezzo colonna | `fotoUrl` da `@mezzi_aziendali` via targa join | ✓ DISPONIBILE solo se targa non null |

**Card espansa MANUTENZIONI**:

| Sezione | Campo type | Disponibilità |
|---|---|---|
| Descrizione | `descrizione` | ✓ DISPONIBILE |
| Materiali (n) lista | `materiali: NextManutenzioniLegacyMaterialRecord[]` ([:121](../src/next/domain/nextManutenzioniDomain.ts#L121)) — campi `label, quantita, unita, fromInventario` ([:101-108](../src/next/domain/nextManutenzioniDomain.ts#L101-L108)) | ✓ DISPONIBILE — sotto-tabella |
| Importo + valuta | `importo` + `sourceDocumentCurrency` | ✓ DISPONIBILE |
| Documento sorgente (link/URL) | `sourceDocumentId` + `sourceDocumentFileUrl` ([:126](../src/next/domain/nextManutenzioniDomain.ts#L126), [:128](../src/next/domain/nextManutenzioniDomain.ts#L128)) | ✓ DISPONIBILE — link "Apri fattura PDF" |
| Km | `km` ([:113](../src/next/domain/nextManutenzioniDomain.ts#L113)) | ✓ DISPONIBILE |
| Ore (compressore/attrezz.) | `ore` ([:114](../src/next/domain/nextManutenzioniDomain.ts#L114)) | ✓ DISPONIBILE quando `tipo !== "mezzo"` |
| Sottotipo (motrice/trattore per compressore) | `sottotipo` ([:115](../src/next/domain/nextManutenzioniDomain.ts#L115)) | ✓ DISPONIBILE |
| Sezione gomme: assi coinvolti, tipo intervento, asse straordinario | `assiCoinvolti` ([:122](../src/next/domain/nextManutenzioniDomain.ts#L122)) + `gommeInterventoTipo` ([:124](../src/next/domain/nextManutenzioniDomain.ts#L124)) + `gommeStraordinario.asseId/motivo` ([:125, :157-161](../src/next/domain/nextManutenzioniDomain.ts#L125)) | ✓ DISPONIBILE — mostrare solo se almeno uno dei 3 campi popolato |

### 5.3 SEGNALAZIONI — Mapping campi UI → type

Type: `NextAutistiSegnalazioneSectionItem` ([src/next/domain/nextAutistiDomain.ts:128-148](../src/next/domain/nextAutistiDomain.ts#L128-L148)) — **gold standard catena completa**

**Riga:**

| Elemento UI mockup | Campo type | Note |
|---|---|---|
| Data sinistra | `timestamp` ([:130](../src/next/domain/nextAutistiDomain.ts#L130)) number ms | ✓ DISPONIBILE |
| Targa | `targa` ([:131](../src/next/domain/nextAutistiDomain.ts#L131)) | ✓ DISPONIBILE (può essere null) |
| Categoria | JOIN `@mezzi_aziendali.categoria` via targa | ⚠ JOIN |
| Type-chip "Freni"/"Gomme"/"Elettrico"/"Altro" | `tipo` ([:134](../src/next/domain/nextAutistiDomain.ts#L134)) string libera; mapping a 4 classi `.is-freni`/`.is-gomme`/`.is-elett`/default come fa Sinottica V2 ([src/next/components/NextCentroControlloSinottica.tsx:289-294](../src/next/components/NextCentroControlloSinottica.tsx#L289-L294) funzione `deriveSegnTipo`) | ✓ DISPONIBILE + riusare `deriveSegnTipo` |
| Titolo (testo segnalazione tra virgolette) | `descrizione` ([:135](../src/next/domain/nextAutistiDomain.ts#L135)) | ✓ DISPONIBILE |
| "Aperta da X" | `autistaNome` + `badgeAutista` ([:132-133](../src/next/domain/nextAutistiDomain.ts#L132-L133)) | ✓ DISPONIBILE |
| "Da app autista, area Bellinzona Sud" (luogo) | **NESSUN CAMPO `luogo`/`area`** nel type | ✗ ESCLUDERE riga "Da app autista, X" o mostrare solo "Da app autista" senza luogo |
| Timeline Aperta | `timestamp` | ✓ DISPONIBILE |
| Timeline Presa | derivato: `stato === "presa_in_carico"` (raw, settato dalla madre, vedi audit §5.3) + `letta === true` | **DECISIONE D4 di Giuseppe (RISOLTO 2026-05-11)**: pallino reso quando `letta === true OR stato === "presa_in_carico"`. Rendering: dot color `warn` (arancio, come mockup), label "**Ricevuta**" (NON "Presa" per evitare semantica di timestamp), **timestamp ASSENTE**, tooltip al hover "Ricevuta dall'officina — orario non tracciato". |
| Timeline Chiusa | `dataChiusura` ([:141](../src/next/domain/nextAutistiDomain.ts#L141)) number ms | ✓ DISPONIBILE se `chiusa === true` |
| Timeline "Generato lavoro L-NNN" | `linkedLavoroId` ([:143](../src/next/domain/nextAutistiDomain.ts#L143)) + `hasLinkedLavoro` ([:144](../src/next/domain/nextAutistiDomain.ts#L144)) | ✓ DISPONIBILE — link interno al lavoro corrispondente nella sub-tab Lavori |
| Badge "Foto (n)" | `fotoCount` ([:139](../src/next/domain/nextAutistiDomain.ts#L139)) | ✓ DISPONIBILE |
| Foto mezzo colonna | join via `targa` | ✓ DISPONIBILE |

**Card espansa SEGNALAZIONI**:

| Sezione | Campo type | Disponibilità |
|---|---|---|
| Descrizione lunga | `descrizione` | ✓ DISPONIBILE |
| Autore + badge | `autistaNome` + `badgeAutista` | ✓ DISPONIBILE |
| Stato + chiusura | `stato` + `chiusa` + `dataChiusura` + `chiusaBy` | ✓ DISPONIBILE |
| Link a lavoro generato | `linkedLavoroId` | ✓ DISPONIBILE |
| Foto thumbnail (se `fotoCount > 0`) | NESSUN URL nel type proiezione — solo `fotoCount` | ✗ ESCLUDERE lista foto inline; al massimo badge cliccabile che apre modale Indagine esistente ([src/next/components/NextCentroControlloIndagineModal.tsx](../src/next/components/NextCentroControlloIndagineModal.tsx)). **DECISIONE §15**: aprire modale Indagine richiede passaggio del record completo; in archivio storico potrebbe non avere senso |

### 5.4 RICHIESTE — Mapping campi UI → type

Type: `NextAutistiRichiestaSectionItem` ([src/next/domain/nextAutistiDomain.ts:170-187](../src/next/domain/nextAutistiDomain.ts#L170-L187))

**Riga:**

| Elemento UI mockup | Campo type | Note |
|---|---|---|
| Data sinistra | `timestamp` ([:172](../src/next/domain/nextAutistiDomain.ts#L172)) | ✓ DISPONIBILE |
| Targa | `targa` ([:173](../src/next/domain/nextAutistiDomain.ts#L173)) | ✓ DISPONIBILE |
| Categoria | JOIN | ⚠ |
| Type-chip | NESSUN CAMPO `tipo` né categoria nel type | ✗ NON MOSTRARE chip tipologia |
| Titolo | `testo` ([:176](../src/next/domain/nextAutistiDomain.ts#L176)) | ✓ DISPONIBILE |
| "Aperta da X" | `autistaNome` + `badgeAutista` | ✓ DISPONIBILE |
| Timeline Aperta | `timestamp` | ✓ DISPONIBILE |
| Timeline Presa | `letta: boolean\|null` ([:178](../src/next/domain/nextAutistiDomain.ts#L178)) — solo flag, niente timestamp | **DECISIONE D4 di Giuseppe (RISOLTO 2026-05-11)**: pallino reso quando `letta === true`. Rendering: dot color `warn` (arancio), label "**Ricevuta**", timestamp **ASSENTE**, tooltip "Ricevuta dall'officina — orario non tracciato". |
| Timeline Chiusa | `dataEvasione` ([:182](../src/next/domain/nextAutistiDomain.ts#L182)) (campo nominato **"Evasa"** non "Chiusa") | ✓ DISPONIBILE |
| Timeline "Generato" (lavoro) | **NESSUN CAMPO** `linkedLavoroId` su richieste (audit §2.5: richieste NON generano lavori) | ✗ NON MOSTRARE step "Generato" — UI deve gestire timeline corta a 3 step max |
| Badge "Foto (n)" | `hasFoto` ([:180](../src/next/domain/nextAutistiDomain.ts#L180)) boolean — niente count numerico | ⚠ Mostrare solo badge "Foto" (no n) oppure escludere. **DECISIONE §15** |
| Foto mezzo colonna | join via `targa` | ✓ DISPONIBILE |

**Card espansa RICHIESTE**:

| Sezione | Campo type | Disponibilità |
|---|---|---|
| Testo completo | `testo` | ✓ DISPONIBILE |
| Stato evasione | `evasa` + `dataEvasione` + `evasaBy` | ✓ DISPONIBILE |

---

## 6. LOGICA FILTRI GLOBALI

### 6.1 Filtro Autista (select)

- **Popolamento lista**: dedup su 3 dataset (lavori, segnalazioni, richieste — esclude manutenzioni, vedi sotto):
  - `lavori`: `segnalatoDa` (e in v1.0 NON `chiHaEseguito` perché può contenere "Officina X" e mischiare semantica autista/officina)
  - `segnalazioni`: `autistaNome` (preferito) + `badgeAutista`
  - `richieste`: stesso schema segnalazioni
- **Deduplicazione**: normalizzare case-insensitive trim, raccogliere in `Set<string>`, ordinare alfabeticamente
- **Memo cardinalità**: tipicamente <30 autisti attivi → select nativo OK; alternativa autocomplete

#### 6.1.bis Comportamento su sub-tab Manutenzioni — DECISIONE D5 + D5-bis di Giuseppe (RISOLTO 2026-05-11)

Le manutenzioni hanno `fornitore` / `eseguito` (officina/fornitore), NON un autista. Il filtro Autista è strutturalmente non applicabile.

**Regole D5 + D5-bis** (vincolanti, opzione a + a2):

- Il filtro Autista si applica SOLO a Lavori, Segnalazioni, Richieste
- Sulla sub-tab **Manutenzioni** il filtro Autista è **IGNORATO**: la lista completa del periodo (con eventuali altri filtri Targa/Periodo/Cerca applicati) viene mostrata. **Non lista vuota**.
- Quando il filtro Autista è attivo E la sub-tab Manutenzioni è aperta: render di un **banner inline** in cima al feed Manutenzioni con testo: *"Filtro Autista ignorato in questa scheda — le manutenzioni non hanno un autista, mostrato l'elenco completo del periodo."*
  - Style suggerito: stesso pattern visivo di `.filter-state` del mockup (brand-tint + bordo soft) ma a tutta larghezza del feed e senza bottone azzera (il filtro resta attivo, è solo ignorato qui)
  - Posizionamento: prima del primo `ArchivioDaySeparator`
- Il **contatore della sub-tab Manutenzioni** nella sub-tabbar NON viene scalato dal filtro Autista — resta il totale del periodo + eventuali altri filtri (Targa/Cerca/Periodo). Così il count badge della sub-tab è coerente con quello che si vede dentro la tab.

### 6.2 Filtro Targa (select)

- **Popolamento lista**: dedup su tutti i 4 dataset (`targa`/`mezzoTarga` per lavori/manutenzioni/segnalazioni/richieste). Per **manutenzioni di tipo compressore/attrezzature** la targa è `null` → record presenti ma non filtrabili per targa.
- **Strategia per controlli (non in scope)**: irrilevante perché controlli non è sub-tab
- **Source canonica suggerita**: la lista targhe potrebbe arrivare anche da `readNextAnagraficheFlottaSnapshot` (flotta intera) per consistenza con Sinottica V2 → l'utente può filtrare anche per targa con 0 record (vedi stato vuoto)

### 6.3 Filtro Cerca testuale (input + scoped C)

Vedi §7 (sezione dedicata).

### 6.4 Filtro Periodo (date-picker o preset)

- **Default**: "ultimi 30 giorni" → cutoff `Date.now() - 30 * 24 * 60 * 60 * 1000`
- **Preset suggeriti**: "Oggi", "Ultimi 7gg", "Ultimi 30gg" (default), "Ultimi 90gg", "Ultimi 12 mesi", "Tutto"
- **Date-picker custom**: data inizio + data fine; nessun limite superiore (mockup README: "prolungabile senza limiti")
- **Applicazione filtro**: client-side post-lettura. Già discusso §4.5 — refetch solo se il dataset è impostato per filtrare server-side in futuro (oggi non lo è perché `@lavori` etc. sono storage documents)

### 6.5 Chip "X filtri attivi · azzera"

- **Logica conteggio**: contare i filtri **non-default**. Periodo "ultimi 30gg" = default → NON conta. Autista/Targa/Cerca non vuoti = +1 ciascuno. Periodo diverso da default = +1.
- **Reset**: ripristina ognuno al default (Periodo torna a "ultimi 30gg", altri a vuoto)

### 6.6 Pattern propagazione R0.4 per i filtri

Aggiungere un nuovo filtro globale richiede:
1. State in `useArchivioFilters`
2. Componente UI in `ArchivioToolbar`
3. Predicate function in `useArchivioData` che lo applica al dataset normalizzato
4. Aggiornamento del calcolo "N filtri attivi" nel chip toolbar

---

## 7. LOGICA RICERCA SCOPED — MODALITÀ C IBRIDA

### 7.1 Algoritmo step-by-step

1. Utente è sulla sub-tab `X` (default "lavori")
2. Utente digita "freni" nell'input Cerca → debounced (raccomandazione: **200ms**, idiomatico React, evita lag su grandi liste)
3. La sub-tab `X` mostra solo record che **matchano "freni"** sui campi indicizzati di `X` (vedi §7.2)
4. Le altre 3 sub-tab mostrano **count dinamico** = numero di record che matchano "freni" sui rispettivi campi indicizzati
5. Click su sub-tab `Y` (es. Manutenzioni) → diventa attiva → mostra suoi match per "freni"
6. La query "freni" **persiste** cambiando sub-tab (state in `useArchivioFilters`, non ricavato dalla sub-tab)
7. Reset query Cerca → tutti i count tornano al totale tab (post filtri globali Autista/Targa/Periodo applicati ma senza search)

### 7.2 Campi indicizzati per ricerca per sub-tab

| Sub-tab | Campi indicizzati |
|---|---|
| Lavori | `descrizione`, `dettagli`, `targa`/`mezzoTarga`, `segnalatoDa`, `chiHaEseguito`, `urgenza` (es. "alta") |
| Manutenzioni | `descrizione`, `targa`, `fornitore`, `tipo`, `sottotipo`, `eseguito` |
| Segnalazioni | `descrizione`, `targa`, `autistaNome`, `badgeAutista`, `tipo` (freni/gomme/elettrico) |
| Richieste | `testo`, `targa`, `autistaNome`, `badgeAutista` |

> **Memo**: `chiHaEseguito` su Lavori è ESCLUSO dal boundary AI ma INCLUSO nel boundary storage NEXT — quindi è ricercabile dal Archivio (NON dalla chat IA).

### 7.3 Algoritmo match

- Normalizzazione: `query.trim().toLowerCase()` e `field.toLowerCase().includes(normalizedQuery)`
- Multi-token: se query contiene spazi (es. "freni bianchi"), split su whitespace, ogni token deve matchare almeno un campo (AND su token, OR su campi)
- Per simboli speciali (es. "L-2026-237"): match esatto su `id`

### 7.4 Contatori dinamici: live o on-blur?

**Raccomandazione: LIVE con debounce 200ms**.

Motivazione:
- L'utente si aspetta feedback immediato sui count delle altre tab (es. cercando "freni" vuole sapere subito che ci sono 3 match in manutenzioni)
- Il debounce 200ms previene flicker su digitazione veloce
- I dataset sono già in memoria (eager load §4.4) → il refilter è una `Array.filter` con costo O(N) trascurabile per ~500 records totali
- On-blur introduce friction: l'utente dovrebbe spostare il focus per vedere i count, contro-intuitivo

### 7.5 Pattern propagazione campi indicizzati R0.4

Aggiungere un nuovo campo ricercabile richiede:
1. Aggiungere il campo al type proiezione (se non c'è)
2. Aggiornare la funzione `getSearchableText(record: ArchivioRecord): string` nel hook `useArchivioSearch`
3. Verificare che il campo sia popolato dal reader

---

## 8. CARD ESPANSA — POLIMORFICA PER COLLEZIONE

### 8.1 Layout generale

Mockup [riga 309-376](../docs/design-mockups/archivio%20storico/Archivio-Storico%20(1).html): `.rec-extra` block con sezioni `.rx-section` (k:v grid 132px + 1fr) e `.rx-grid` (3 colonne).

### 8.2 Sezioni per kind (solo campi del type reale)

| Kind | Sezioni mostrate |
|---|---|
| **Lavori** | Descrizione (`descrizione` + `dettagli`); Origine (link a `source.originId` segnalazione/controllo se presente); Chiusura (`chiHaEseguito` + `timestampEsecuzione` se `eseguito`) |
| **Manutenzioni** | Descrizione (`descrizione`); Materiali (`materiali[]` lista — label + quantita + unita); Importo (`importo` + valuta); Documento (link `sourceDocumentFileUrl` se presente); Km/Ore (se popolati); Gomme sub-section (`assiCoinvolti`/`gommePerAsse`/`gommeInterventoTipo`/`gommeStraordinario` se almeno uno popolato) |
| **Segnalazioni** | Descrizione lunga (`descrizione`); Stato + chiusura (`stato`/`chiusa`/`dataChiusura`/`chiusaBy`); Link al lavoro generato (`linkedLavoroId` se presente); Foto count (`fotoCount` come info testuale, no thumbnails per ora) |
| **Richieste** | Testo completo (`testo`); Stato evasione (`evasa`/`dataEvasione`/`evasaBy`); flag foto (`hasFoto`) |

### 8.3 Caso "nessun campo extra disponibile"

Se per un record non c'è nulla in più oltre ai campi già in riga (es. lavoro senza `dettagli` né `source.*` né `chiHaEseguito`), la card espansa mostrerebbe sezioni vuote. **Decisione**: il chevron espansione **resta visibile** ma la card espansa mostra una sola riga "Nessun dettaglio aggiuntivo registrato per questo record." (placeholder neutro), per coerenza UX con il mockup.

---

## 9. FOTO MEZZO E BADGE FOTO

### 9.1 Foto mezzo colonna 64x48

- **Source**: `fotoUrl` campo del mezzo, già letto da `readNextAnagraficheFlottaSnapshot` ([src/next/nextAnagraficheFlottaDomain.ts](../src/next/nextAnagraficheFlottaDomain.ts)). Stesso meccanismo usato in Sinottica V2:
  - Sinottica costruisce `mezziForSinottica` con `fotoUrl` a [src/next/NextCentroControlloParityPage.tsx:884](../src/next/NextCentroControlloParityPage.tsx#L884)
  - Tipo `SinotticaMezzoItem` include `fotoUrl: string | null` a [src/next/components/NextCentroControlloSinottica.tsx:25](../src/next/components/NextCentroControlloSinottica.tsx#L25)
- **Pattern proposto archivio**: in `useArchivioData`, caricare anche la mappa `Map<targaUp, { fotoUrl, categoria }>` da `readNextAnagraficheFlottaSnapshot` e passarla ai `ArchivioRow*` per il join lookup runtime
- **Strategia caching**: refetch solo su mount tab + dopo refresh utente. Foto sono URL Firebase Storage cachabili dal browser nativo
- **Lazy loading immagini**: usare `loading="lazy"` HTML attribute su `<img>` per ottimizzare scroll su liste lunghe
- **Fallback SVG**: quando `fotoUrl === null` o errore caricamento, mostrare silhouette per categoria. Il mockup (linee 2117-2133) ha già 6 SVG inline `VEHICLE_SVGS` (trattore/motrice/cisterna/rimorchio/compressore/attrezzature) + funzione `svgForCat(cat)` che mappa categoria a SVG. **Replicare 1:1** la funzione in `ArchivioVeicoloPhoto.tsx`.

### 9.2 Badge "Foto (n)" cliccabile

Mockup mostra badge `Foto N` che apre presumibilmente un viewer foto. Analisi disponibilità:

- **Manutenzioni**: NESSUN campo foto sul type — il badge va **escluso** dalla riga manutenzioni (audit §5.2 conferma)
- **Lavori**: NESSUN campo foto — escluso
- **Segnalazioni**: `fotoCount: number` ([src/next/domain/nextAutistiDomain.ts:139](../src/next/domain/nextAutistiDomain.ts#L139)) disponibile, ma **NESSUN URL** nel type proiezione → il badge può mostrare il count ma non ha foto da aprire
- **Richieste**: `hasFoto: boolean` ([:180](../src/next/domain/nextAutistiDomain.ts#L180)) — solo flag, niente count né URL

**Raccomandazione**: nella v0.1 dell'archivio storico, **escludere completamente i badge Foto cliccabili**. Il count può essere indicato in card espansa come testo informativo ("3 foto allegate") senza apertura modale. Per aprire le foto serve il record raw (con array `fotoStoragePaths`) e il modale Indagine, che oggi NON riceve un singolo record ma un evento — un retrofit richiederebbe modifiche ai modali esistenti, fuori scope §1.2.

---

## 10. STATI E COMPORTAMENTI

### 10.1 Loading

Riusare pattern Sinottica V2: container con classe `cc-sinottica-scope-v2` + spinner inline come fa `NextCentroControlloSinottica.tsx`. **Pattern esatto da identificare**: Sinottica V2 oggi NON ha skeleton loaders distinti, mostra direttamente dati o lista vuota. Per Archivio Storico propongo un **placeholder testuale neutro** "Caricamento archivio…" senza skeleton sintetico (no scope-creep).

### 10.2 Errore caricamento

Riusare fallback inline tipo `<div className="ccs-error">Errore caricamento: {message}</div>` (verificare path esistente). Se non esiste, scrivere un componente minimale `<ArchivioErrorState message={...} onRetry={...} />` 10 righe.

### 10.3 Stato vuoto

Mockup [linee 1875-1889](../docs/design-mockups/archivio%20storico/Archivio-Storico%20(1).html): empty state con SVG + h3 + p + bottone "Azzera filtri". Replicare 1:1 con `ArchivioEmptyState.tsx`. Bottone chiama `resetFilters()` di `useArchivioFilters`.

### 10.4 Persistenza filtri

**Raccomandazione: state in-memory NON persistente**.

Motivazione:
- L'utente apre l'Archivio per "ho un dubbio, controllo, esco" (README mockup: "ho un dubbio, apro l'archivio, scorro e trovo")
- Persistere filtri tra ricariche pagina creerebbe sorprese ("perché vedo solo 3 record? Ah, c'è un filtro nascosto")
- Lo stato fresh garantisce sempre default "ultimi 30 giorni" alla riapertura
- Eccezione: la sub-tab attiva può essere persistente per intra-sessione (durante navigazione interna del CC) — gestita in-memory dal componente host

### 10.5 Densità Comoda/Compatta

- Toggle inline destra sub-tabbar (mockup [linee 211-230](../docs/design-mockups/archivio%20storico/Archivio-Storico%20(1).html#L211-L230))
- Applicazione: classe CSS `is-compact` sul container feed (`feedWrap`)
- **Persistenza**: localStorage chiave `archivio.densità` con fallback "comoda". Persistenza utile perché è una **preferenza utente stabile**, non un filtro temporaneo

---

## 11. ORDINAMENTO E RAGGRUPPAMENTO

### 11.1 Ordinamento default

- **Data DESC** (più recente in cima), tie-break su `id`
- Per Lavori: chiave `timestampInserimento`
- Per Manutenzioni: chiave `parseDateFlexible(data).getTime()` (riusare la funzione già definita nel reader, [src/next/domain/nextManutenzioniDomain.ts:323](../src/next/domain/nextManutenzioniDomain.ts#L323))
- Per Segnalazioni/Richieste: chiave `timestamp`

### 11.2 Raggruppamento giorno

Criteri di etichettatura (basati su data corrente):
- **Oggi**: `record.dateLocal === today` → label `Oggi · <weekday> <day> <month>`
- **Ieri**: `record.dateLocal === today - 1` → label `Ieri · <weekday> <day> <month>`
- **Questa settimana**: dentro la settimana corrente, esclusi oggi e ieri → label `<weekday> · <day> <month>` (mockup mostra anche range "4–7 maggio" per multi-giorni → semplificazione: una row per giorno)
- **Mese**: stesso mese ma settimana precedente → label `<MeseName>` (es. "Maggio · 1 mag → 10 mag")
- **Mese precedente**: → label `<MeseName>` (es. "Aprile · 28 apr → 30 apr")

### 11.3 Sticky day-separator

CSS `position: sticky; top: 64px;` per allinearsi sotto la toolbar sticky che è a `top: 0`. Z-index 3 (sotto toolbar che è 5).

---

## 12. SCRIVENTE? NO — SOLA LETTURA

**Conferma esplicita**:
- Nessun **writer NEXT** nuovo
- Nessuna **deroga aggiunta** a `src/utils/cloneWriteBarrier.ts`
- Nessuna chiamata a `firestoreWriteOps`, `setItemSync`, `runWithCloneWriteScopedAllowance`
- L'archivio è **strettamente read-only** rispetto a Firestore + storage

Il modulo è **safe per il clone barrier**: legge dataset già letti da altri reader esistenti, nessuna pagina nuova `/next/centro-controllo` o nuova rotta. La tab Archivio è sotto `/next/centro-controllo`, già autorizzata in barrier per le scritture **delle altre tab** (PROMPT 27 segnalazioni/controlli/richieste/lavoro creation). L'archivio NON aggiunge scritture.

---

## 13. TEST PLAYWRIGHT

### 13.1 Test E2E esistenti a rischio

Solo 1 test E2E presente sul CC: [tests/e2e/23-audit-media-kml-centro-controllo.spec.ts](../tests/e2e/23-audit-media-kml-centro-controllo.spec.ts) "audit Media km/L".

**Analisi rischio**: il test estrae righe dalla Sinottica V2 (selettori CSS sulla tabella sinottica) e valida formula `(R.km - seed.km) / R.litri`. Con l'aggiunta della nuova page-tabbar:
- Se il default landing è "Sinottica" (raccomandato): il test continua a passare invariato
- Se il selettore CSS dipende da `:nth-child` posizionale del CC: rischio rottura → verificare manualmente i selettori prima del merge

**Test a basso rischio**: nessuna patch al test necessaria se la nuova tabbar è sopra `<NextCentroControlloSinottica>` e la Sinottica resta il default visibile al mount.

### 13.2 Test E2E nuovi proposti per Archivio Storico

File proposto: `tests/e2e/24-archivio-storico-centro-controllo.spec.ts`.

Test list (con assertion concettuali):

1. **Apertura tab dal CC**: navigate `/next/centro-controllo` → click "Archivio storico" → vedere toolbar + 4 sub-tab
2. **Default sub-tab Lavori attiva** + lista popolata con dati reali
3. **Tutte e 4 sub-tab caricano dati**: click ognuna, verificare che render contiene almeno 1 row OR empty state (no errore JS)
4. **Filtro Periodo default**: chip "Ultimi 30 giorni" mostrato come acceso, "1 filtro attivo"
5. **Filtro Autista**: select un autista, conta record diminuisce, chip "2 filtri attivi"
6. **Filtro Targa**: select targa, count diminuisce
7. **Ricerca scoped modalità C**:
   - Input "freni" → sub-tab attiva mostra solo match
   - Sub-tab non-attive mostrano count badge con match per "freni"
   - Click sub-tab Y → vedere match Y
   - Cambia sub-tab, query persiste
   - Reset search → count torna a totali
8. **Click riga → espande**: classe `.is-expanded` aggiunta + sezioni `.rec-extra` visibili. Click di nuovo → collapse
9. **Densità Compatta**: click bottone "Compatta" → container ha classe `is-compact`, righe più strette
10. **Stato vuoto**: applica filtro restrittivo (targa inesistente + periodo "Oggi" + query "xyznonesiste") → vedere empty state + click "Azzera filtri" → ritorna alla lista popolata
11. **No regressioni Sinottica**: click tab "Sinottica flotta" → vedere `NextCentroControlloSinottica` invariata
12. **Page-tabbar persiste**: cambio sub-tab archivio NON cambia page-tabbar (resta "Archivio storico" attiva)

### 13.3 Test mirati durante implementazione

Step-by-step §14 — ogni step deve verificare almeno:
- `tsc --noEmit` verde
- `vite build` verde
- nessun regression sul test E2E PROMPT 10 (rieseguire dopo step 8 e step 9)

---

## 14. ORDINE DI IMPLEMENTAZIONE PROPOSTO

### Step 1 — Type + reader nuovi
- **File creati**:
  - (se serve) `src/next/centroControllo/archivioStorico/archivioTypes.ts` con `ArchivioRecord` discriminated union
- **File modificati**:
  - `src/next/domain/nextLavoriDomain.ts`: estendi `NextLavoriListaRouteId` con `"lavori-archivio"`, aggiungi export `readNextLavoriArchivioSnapshot`
- **Verifica**: `tsc --noEmit` verde

### Step 2 — Hook logica pura
- **File creati**:
  - `src/next/centroControllo/archivioStorico/hooks/useArchivioFilters.ts`
  - `src/next/centroControllo/archivioStorico/hooks/useArchivioSearch.ts`
  - `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts`
- **Verifica**: `tsc --noEmit` verde, hook testabili in isolamento

### Step 3 — Componenti riga (4 file)
- **File creati**:
  - `src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx`
  - `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx`
  - `src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx`
  - `src/next/centroControllo/archivioStorico/rows/ArchivioRowRichiesta.tsx`
- **Verifica**: `tsc --noEmit` verde

### Step 4 — Card espansa + Mini-timeline + Foto + Empty state
- **File creati**:
  - `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` (polimorfica)
  - `src/next/centroControllo/archivioStorico/ArchivioMiniTimeline.tsx`
  - `src/next/centroControllo/archivioStorico/ArchivioVeicoloPhoto.tsx` (con `svgForCat` replica mockup r2117-2133)
  - `src/next/centroControllo/archivioStorico/ArchivioEmptyState.tsx`
  - `src/next/centroControllo/archivioStorico/ArchivioDaySeparator.tsx`

### Step 5 — Orchestratori
- **File creati**:
  - `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx`
  - `src/next/centroControllo/archivioStorico/ArchivioSubTabs.tsx`
  - `src/next/centroControllo/archivioStorico/ArchivioToolbar.tsx`

### Step 6 — CSS scope archivio
- **File creati**:
  - `src/next/centroControllo/archivioStorico/archivio-storico.css` con classi `.archivio-toolbar`, `.feed`, `.rec`, `.timeline`, etc. — **NB**: riusa token IBM Plex / palette dalla Sinottica V2 già in [src/next/components/sinottica-flotta-v2-design-tokens.css](../src/next/components/sinottica-flotta-v2-design-tokens.css). Import del file token nel CSS archivio per consistenza.
- **NIENTE :root globale** — tutti gli stili sotto scope archivio

### Step 7 — Host
- **File creati**:
  - `src/next/centroControllo/archivioStorico/NextArchivioStoricoTab.tsx`
- **Verifica**: il componente renderizza in isolamento (mount manuale in dev)

### Step 8 — Integrazione in NextCentroControlloParityPage.tsx
- **File modificato**:
  - `src/next/NextCentroControlloParityPage.tsx`: +1 import, +1 state `archivioMode`, +1 page-tabbar div, +1 condizionale mount
- **Patch**: minima invasiva, ~20 righe nette di aggiunta. Backup `.bak.20260511-PROMPT29` consigliato.
- **Verifica**: `tsc --noEmit` verde, `vite build` verde, E2E PROMPT 10 verde

### Step 9 — Test Playwright nuovi
- **File creati**:
  - `tests/e2e/24-archivio-storico-centro-controllo.spec.ts` con i 12 test §13.2
- **Verifica**: tutti i 12 nuovi test passano + PROMPT 10 invariato

### Step 10 — Verifica E2E full
- Run completo: `npx playwright test`
- Stato atteso: tutti i 275 esistenti verdi + 12 nuovi verdi = 287/287

---

## 15. RISCHI E PUNTI APERTI

### 15.1 Campi mockup NON disponibili nei type → escludere dalla card espansa

Sintesi di tutte le esclusioni dichiarate in §5:

| Sezione/Campo mockup | Sub-tab | Decisione |
|---|---|---|
| Note officina (blockquote) | Lavori | **ESCLUDERE** |
| Fornitore: Ragione sociale/Referente/Telefono/N. fattura/Importo/Pagamento (su Lavori) | Lavori | **ESCLUDERE** (sono campi di `@manutenzioni`, non `@lavori`) |
| Km al rientro (su Lavori) | Lavori | **ESCLUDERE** |
| Esito "positivo/negativo" (su Lavori chiusura) | Lavori | **ESCLUDERE** |
| Spessore residuo / soglia (su Lavori descrizione) | Lavori | **ESCLUDERE** — testo libero solo |
| Badge "Materiali (n)" su Lavori | Lavori | **ESCLUDERE** — [RISOLTO 2026-05-11] D3(b): badge non renderizzato sui Lavori (vedi §15.3 voce 3) |
| Foto thumbnails inline | Tutti | **ESCLUDERE** — solo count testuale; nessun URL nel type proiezione |
| Badge "Foto (n)" su Manutenzioni | Manutenzioni | **ESCLUDERE** — nessun campo foto |
| Type-chip tipologia su Richieste | Richieste | **ESCLUDERE** — nessun `tipo` nel type |
| Luogo "Area di sosta Bellinzona Sud", "Tratta Como → Lugano" | Segnalazioni | **ESCLUDERE** — nessun campo luogo/area |
| Timeline step "Presa" con timestamp | Segnalazioni/Richieste/Controlli | **ESCLUDERE timestamp**, eventualmente mostrare solo pallino indicatore (vedi §15.3 punto 4) |
| Timeline step "Presa" su Lavori | Lavori | **ESCLUDERE** — non tracciato |
| Timeline step "Generato lavoro" su Richieste | Richieste | **ESCLUDERE** — richieste non generano lavori |

### 15.2 Reader nuovi proposti

- `readNextLavoriArchivioSnapshot(options: { fromTs?: number; toTs?: number; includeCloneOverlays?: boolean })` — NUOVO, riusa la pipeline `readNextLavoriListaSnapshot` con filtro stato vuoto (tutti). Estensione del `NextLavoriListaRouteId` a 3 valori.

### 15.3 Domande aperte per Giuseppe — TUTTE RISOLTE 2026-05-11 (storico decisioni)

> Storico chiuso: le 5 voci sotto sono state risolte da Giuseppe il 2026-05-11 in PROMPT 29.5. Tenute qui come tracciabilità delle decisioni.

1. **Path radice nuovi componenti** — [RISOLTO 2026-05-11] **(a)** `src/next/centroControllo/archivioStorico/` (nuova dir). L'archivio storico inaugura il nuovo schema `centroControllo/<modulo>/`, futuri moduli CC seguiranno lo stesso pattern. Vedi §2.4.

2. **ID record formato "L-2026-NNN"** — [RISOLTO 2026-05-11] **(c)** colonna ID **nascosta** nella v1.0. Gli `id` raw sono usati solo come `key` React e per join interni (es. `source.originId`). Coerente con README mockup "ho un dubbio, scorro e trovo". Vedi nota globale §5.0 e tabelle §5.1-5.4.

3. **Badge "Materiali (n)" su Lavori** — [RISOLTO 2026-05-11] **(b)** badge **escluso** sui Lavori. Lavori e manutenzioni restano concettualmente distinti — niente JOIN runtime per derivare materiali sui lavori. Badge Materiali mantenuto solo su Manutenzioni (`materiali.length`). Vedi tabella §5.1.

4. **Timeline step "Presa" senza timestamp** — [RISOLTO 2026-05-11] **(a)** pallino "**Ricevuta**" (NON "Presa") senza timestamp, dot color `warn`, tooltip "Ricevuta dall'officina — orario non tracciato". Si applica a Segnalazioni e Richieste, NON ai Lavori (che non tracciano nemmeno il flag). Vedi tabelle §5.3 e §5.4.

5. **Filtro Autista su Manutenzioni** — [RISOLTO 2026-05-11] **(a + a2)** il filtro Autista è **ignorato** sulla sub-tab Manutenzioni: lista completa mostrata + **banner inline** "Filtro Autista ignorato in questa scheda — le manutenzioni non hanno un autista, mostrato l'elenco completo del periodo." Il count badge della sub-tab Manutenzioni NON viene scalato dal filtro Autista. Vedi §6.1.bis.

### 15.4 Ambiguità nel mockup non risolte
- "Origine" su Lavori: il mockup mostra "Aperta dall'autista E. Selimi il 10.05 · 08:51, presa in carico da R. Costa alle 09:15." → questo testo è derivato dalla **segnalazione sorgente** (via `source.originId` → join con segnalazione). Implementazione: 1 lookup runtime nel mapper `useArchivioData`. OK fattibile.
- Foto count su Manutenzioni: mockup mostra "Foto (7)" su una manutenzione (riga 1382). **Invenzione del mockup** — nessun campo foto. Esclusione confermata §15.1.
- "contratto" badge importo: derivazione heuristica (`importo === 0 OR null`). Confidenza bassa — preferibile aggiungere campo `daContratto: boolean` al type reader come miglioramento futuro.

### 15.5 Performance — virtualizzazione lista
- Per filtri "tutto lo storico" (12+ mesi su flotta 30 mezzi) si possono raggiungere 3000-5000 records totali. Render flat di 5000 article DOM nodes può degradare scrolling.
- **Per 0.1**: nessuna virtualizzazione. Se Giuseppe segnala lag in produzione, introdurre `react-window` in PROMPT futuro.

### 15.6 Conflitto README mockup vs SCOPE Giuseppe
- README dice "**niente** limite temporale (nessun ultimi 24 mesi)" ma il mockup HTML mostra in `.tabs-meta` "Consolidato · ultimi 24 mesi · sola lettura" (display:none). Il README vince — il mockup ha lasciato un residuo dell'iterazione precedente. **Risolto**: filtro periodo arbitrario senza limite massimo.

### 15.7 Riferimento path file mockup — [RISOLTO 2026-05-11]
- Rinomina effettuata in PROMPT 29.5. Path canonico: `docs/design-mockups/archivio-storico/Archivio_Storico_v2.html` (dir rinominata da `archivio storico` a `archivio-storico` per eliminare lo spazio; file rinominato da `Archivio-Storico (1).html` a `Archivio_Storico_v2.html` per allinearsi al README). README.MD.txt mantiene estensione `.txt` come da decisione Giuseppe.

---

## 16. ALLEGATO — RICERCHE rg ESEGUITE

Comandi rg/grep effettuati durante l'audit + lo SPEC (sintesi cronologica):

```bash
# Trovare mockup + README
find . -iname "*archivio*storico*"
find . -iname "design-mockup*" -type d
find ./src/next -type d -iname "*centro*"

# Type proiezione e reader per le 4 collezioni
rg "^export type" src/next/domain/nextLavoriDomain.ts
rg "^export type" src/next/domain/nextManutenzioniDomain.ts
rg "^export type" src/next/domain/nextAutistiDomain.ts
rg "readNextLavoriInAttesaSnapshot|readNextManutenzioniLegacyDataset|readNextAutistiReadOnlySnapshot" src/next/

# Integrazione CC Parity
rg "activeTab|setActiveTab|TabKey|cc-sinottica-scope-v2|<NextCentroControlloSinottica" src/next/NextCentroControlloParityPage.tsx
rg "SinotticaMezzoItem|fotoUrl|readNextAnagraficheFlottaSnapshot" src/next/NextCentroControlloParityPage.tsx

# CSS scope V2 + reader foto
rg "cc-sinottica-scope-v2|sinottica-flotta-v2|IBM Plex|--font-mono|--brand" src/next/components/

# Test E2E
ls tests/e2e/ | grep -E "centro|sinott|archivio"
rg "test\(|test\.describe|playwright" tests/e2e/23-audit-media-kml-centro-controllo.spec.ts
```

### 16.1 Comandi eseguiti in PROMPT 29.5 (promozione 1.0)

```bash
# Rinomina dir mockup (rimuove spazio)
mv "docs/design-mockups/archivio storico" "docs/design-mockups/archivio-storico"

# Rinomina file mockup (allineato al README)
mv "docs/design-mockups/archivio-storico/Archivio-Storico (1).html" \
   "docs/design-mockups/archivio-storico/Archivio_Storico_v2.html"

# Verifica
ls docs/design-mockups/archivio-storico/
# atteso: Archivio_Storico_v2.html + README.MD.txt
```

### 16.2 File letti (Read tool, sessione 29.4):
- Mockup HTML: `docs/design-mockups/archivio storico/Archivio-Storico (1).html` (linee 1-2202, integrale)
- README: `docs/design-mockups/archivio storico/README.MD.txt` (46 righe)
- Audit: `docs/audit/2026-05-11_AUDIT_ARCHIVIO_STORICO_NEXT.md` (riferimenti già nello SPEC)
- Type readers: `src/next/domain/nextLavoriDomain.ts`, `nextManutenzioniDomain.ts`, `nextAutistiDomain.ts`, `nextRifornimentiDomain.ts`, `nextProcurementDomain.ts`
- `src/next/NextCentroControlloParityPage.tsx` (zoom su tabbar e mount Sinottica)
- `src/next/components/NextCentroControlloSinottica.tsx` (zoom su `SinotticaMezzoItem` + foto + `deriveSegnTipo`)
- `src/next/nextLavoroCreateWriter.ts` (per shape lavoro creato)

Fine SPEC.
