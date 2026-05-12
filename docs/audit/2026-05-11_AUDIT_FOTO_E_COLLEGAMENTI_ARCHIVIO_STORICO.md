# AUDIT — Foto Mezzo + Collegamenti Modali Archivio Storico NEXT

**Data**: 2026-05-11
**Modalità**: READ-ONLY (R0 anti-allucinazione applicato — ogni claim ha `path:line`)
**Scope**: 2 domande indipendenti — foto mezzo + collegamenti modali su 4 sub-tab archivio
**Perimetro lettura**: solo `src/next/` (madre legacy non toccata)

---

## 0. SINTESI ESECUTIVA

| Domanda | Esito |
|---|---|
| Perché la foto mezzo non si vede? | **BUG identificato** — catena spezzata in 3 punti (Feed non passa la map, righe non hanno prop, righe usano il componente Step 3 vecchio invece del Step 4 nuovo). Fix chirurgico ≤30 righe. |
| Quali modali aprire dalle 4 righe archivio? | **Mapping completo trovato**: Lavoro→pagina dedicata, Manutenzione→pagina con query param, Segnalazione/Richiesta→stesso modale `NextHomeAutistiEventoModal` con `editable={false}` (strada Y zero-touch). |

---

## PARTE 1 — AUDIT FOTO MEZZO

### 1.1 useArchivioData LEGGE flotta correttamente ✓

[useArchivioData.ts:16](../src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L16) importa `readNextAnagraficheFlottaSnapshot` e lo invoca a [:61](../src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L61) dentro `Promise.all`.

Costruzione mappa [:91-101](../src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L91-L101):
```typescript
const flottaMap: ArchivioFlottaMap = new Map<string, ArchivioFlottaInfo>();
for (const item of flottaSnapshot.items) {
  const targaUp: string = String(item.targa ?? "").trim().toUpperCase();
  if (!targaUp) continue;
  if (!flottaMap.has(targaUp)) {
    flottaMap.set(targaUp, {
      fotoUrl: item.fotoUrl,
      categoria: item.categoria || null,
    });
  }
}
```

Esposto via `state.flotta` a [:130](../src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L130). Type:
```typescript
export type ArchivioFlottaInfo = { fotoUrl: string | null; categoria: string | null };
export type ArchivioFlottaMap = Map<string, ArchivioFlottaInfo>;
```

**Verdetto 1.1**: ✓ il dato c'è.

### 1.2 ArchivioFeed NON passa `flotta` alle 4 righe ✗

Grep `flotta|dataState\.` su [ArchivioFeed.tsx](../src/next/centroControllo/archivioStorico/ArchivioFeed.tsx):
- riga 199, 201, 205, 208, 210, 219, 223, 249, 256, 263 → riferimenti a `dataState.records`, `dataState.loading`, `dataState.error`, `dataState.refetch`
- **0 riferimenti** a `dataState.flotta`

Nelle righe del render (linee ~280-340 del Feed) i 4 `<ArchivioRow*>` ricevono solo `record`, `isExpanded`, `onToggleExpand`. **Nessuna prop `flotta` viene passata**.

**Verdetto 1.2**: ✗ ArchivioFeed riceve la flotta in `dataState.flotta` ma la **scarta**.

### 1.3 Le 4 righe NON hanno prop foto + usano `ArchivioVeicoloPhotoPlaceholder` (vecchio Step 3) ✗

Grep su `src/next/centroControllo/archivioStorico/rows/`:

| Riga | Import | Usage |
|---|---|---|
| [ArchivioRowLavoro.tsx:19](../src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx#L19) | `ArchivioVeicoloPhotoPlaceholder` da `./ArchivioRowShared` | [:81](../src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx#L81) `<ArchivioVeicoloPhotoPlaceholder categoria={null} />` |
| [ArchivioRowManutenzione.tsx:17](../src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx#L17) | `ArchivioVeicoloPhotoPlaceholder` | [:75](../src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx#L75) `<ArchivioVeicoloPhotoPlaceholder categoria={data.tipo === "compressore" ? ...} />` |
| [ArchivioRowSegnalazione.tsx:17](../src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx#L17) | `ArchivioVeicoloPhotoPlaceholder` | [:72](../src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx#L72) `<ArchivioVeicoloPhotoPlaceholder categoria={null} />` |
| [ArchivioRowRichiesta.tsx:18](../src/next/centroControllo/archivioStorico/rows/ArchivioRowRichiesta.tsx#L18) | `ArchivioVeicoloPhotoPlaceholder` | [:56](../src/next/centroControllo/archivioStorico/rows/ArchivioRowRichiesta.tsx#L56) `<ArchivioVeicoloPhotoPlaceholder categoria={null} />` |

`ArchivioVeicoloPhotoPlaceholder` è in [ArchivioRowShared.tsx:126](../src/next/centroControllo/archivioStorico/rows/ArchivioRowShared.tsx#L126) — accetta solo `{categoria}` come prop. **NON ha `fotoUrl`**, è il fallback SVG-only creato in Step 3.

**Verdetto 1.3**: ✗ Le 4 righe non hanno prop `fotoUrl` né `flotta` e usano il componente Step 3 vecchio.

### 1.4 ArchivioVeicoloPhoto (Step 4) — nuovo componente — ESISTE ma non è importato da nessuno ✗

[ArchivioVeicoloPhoto.tsx](../src/next/centroControllo/archivioStorico/ArchivioVeicoloPhoto.tsx):
- linea 89: `fotoUrl?: string | null` come prop
- linea 105-122: branch `if (fotoUrl && !errored) { return <img src={fotoUrl} loading="lazy" onError={() => setErrored(true)} ...> }`
- linea 124+: fallback SVG placeholder per categoria

Il componente è **logicamente corretto** — gestisce fotoUrl + onError → placeholder.

Grep `ArchivioVeicoloPhoto` (senza suffisso `Placeholder`) in `src/next/`:
- Risulta solo nel file stesso. **Nessun consumer** lo importa.

**Verdetto 1.4**: ✓ il componente è OK ma è codice morto: scollegato dalle 4 righe.

### 1.5 DIAGNOSI — catena spezzata in 3 punti

Riferendomi alla classificazione del prompt 30.0:

- (a) useArchivioData NON legge flotta → **falso**, la legge ([:61](../src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L61))
- (b) useArchivioData legge ma NON espone → **falso**, espone in `state.flotta` ([:130](../src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts#L130))
- **(c) ArchivioFeed NON passa la mappa alle righe → VERO** (mai referenziata nel render righe)
- **(d) Le righe NON leggono dalla mappa → VERO** (non hanno prop `flotta`/`fotoUrl`)
- **(e) Le righe NON passano fotoUrl al componente right → VERO** (usano `ArchivioVeicoloPhotoPlaceholder` Step 3 che non accetta fotoUrl)
- (f) ArchivioVeicoloPhoto non renderizza img → **falso**, render OK
- (g) Altro: il componente Step 4 `ArchivioVeicoloPhoto` esiste ma è codice morto (mai importato da consumer)

**Causa root**: durante Step 4 è stato creato `ArchivioVeicoloPhoto.tsx` con supporto `fotoUrl`, ma le 4 righe Step 3 non sono state refactorate per consumare il nuovo componente (lo SPEC §14 Step 4 lo prevedeva ma il refactor non è stato applicato — coerentemente con la decisione di Step 4 §G di "lasciare Step 3 invariato per evitare ripercussioni").

### 1.6 PATCH PROPOSTA (NON IMPLEMENTATA)

**File modificati**: 5 (1 orchestratore + 4 righe). Stima ~30 righe nette di delta.

1. **[ArchivioFeed.tsx](../src/next/centroControllo/archivioStorico/ArchivioFeed.tsx)**: passare `flottaInfo` a ciascuna `<ArchivioRow*>` derivandolo da `dataState.flotta` con la targa estratta dal record:
   - lavoro: `dataState.flotta.get(record.data.mezzoTarga?.toUpperCase())`
   - manutenzione: `dataState.flotta.get(record.data.targa?.toUpperCase())`
   - segnalazione: `dataState.flotta.get(record.data.targa?.toUpperCase())`
   - richiesta: `dataState.flotta.get(record.data.targa?.toUpperCase())`
   - Prop opzionale: `flottaInfo?: { fotoUrl: string | null; categoria: string | null }`

2. **4 file righe**:
   - Aggiungere `flottaInfo` opzionale alla prop type
   - Sostituire `<ArchivioVeicoloPhotoPlaceholder categoria={...} />` con `<ArchivioVeicoloPhoto targa={...} categoria={flottaInfo?.categoria ?? null} fotoUrl={flottaInfo?.fotoUrl ?? null} />`
   - Import `ArchivioVeicoloPhoto` da `../ArchivioVeicoloPhoto` (non più `Placeholder` da `./ArchivioRowShared`)

3. **`ArchivioRowShared.tsx`**: lasciare `ArchivioVeicoloPhotoPlaceholder` per retrocompat (codice morto post-fix, ma rimozione fuori scope minimo) — oppure rimuovere se grep conferma 0 consumer post-patch.

4. **Test E2E nuovi**: 1 test "foto mezzo presente: archivio prima riga ha `<img>` o placeholder SVG". Selettore: `.archivio-row-photo img` o `.archivio-row-photo svg`. Robusto sia se la prima riga ha fotoUrl, sia se ha fallback. Sospensione del test sull'aspetto pixel-perfect dell'immagine — solo presenza DOM.

**Indipendenza**: la patch foto è completamente autonoma rispetto ai collegamenti modali (Parte 2). Può essere mergiata da sola.

---

## PARTE 2 — AUDIT MODALI ESISTENTI NEL CC

### 2.1 INVENTARIO MODALI APERTI DALLA SINOTTICA V2

Verificato in [NextCentroControlloParityPage.tsx](../src/next/NextCentroControlloParityPage.tsx) (host CC):

| Modale / Target | Path import | Scopo | Apertura |
|---|---|---|---|
| `PdfPreviewModal` | [:3](../src/next/NextCentroControlloParityPage.tsx#L3) | Anteprima PDF (rifornimenti) | tab Rifornimenti interna |
| `NextRifornimentoEditModal` | [:29](../src/next/NextCentroControlloParityPage.tsx#L29) | Edit rifornimento | tab Rifornimenti interna |
| `NextCentroControlloIndagineModal` | [:30](../src/next/NextCentroControlloParityPage.tsx#L30) | Indagine rifornimento (RefuelRow) | chip Anomalie Sinottica |
| `NextCentroControlloAnalisiModal` | [:31](../src/next/NextCentroControlloParityPage.tsx#L31) | Analisi rifornimenti/andamento | varie azioni Sinottica |
| `NextHomeAutistiEventoModal` | [:33](../src/next/NextCentroControlloParityPage.tsx#L33) | Modale event autista (segnalazione/controllo/richiesta) | chip event Sinottica |
| `NextMezzoEditModal` | [:34](../src/next/NextCentroControlloParityPage.tsx#L34) | Edit anagrafica mezzo | click foto Sinottica |
| `NextMezzoCronologiaModal` | [:35](../src/next/NextCentroControlloParityPage.tsx#L35) | Cronologia mezzo | click cronologia Sinottica |
| `NextMezzoHardDeleteModal` | [:36](../src/next/NextCentroControlloParityPage.tsx#L36) | Hard delete mezzo | SHIFT+click foto Sinottica |

#### Handler Sinottica → modali (target archivio)

[NextCentroControlloParityPage.tsx:1494-1647](../src/next/NextCentroControlloParityPage.tsx#L1494-L1647):
- `onTargaClick(targa)` → naviga a `buildNextDossierPath(targa)` (Dossier mezzo)
- `onAnomalieClick(targa)` → apre `NextCentroControlloIndagineModal` (specifico anomalie rifornimenti)
- `onGommeClick(targa)` → naviga al dossier gomme
- `onDocumentiClick(targa)` → naviga ai documenti
- `onContrattoClick(targa)` → apre `NextCentroControlloAnalisiModal`
- **`onLavoroClick(lavoroId)`** [:1642-1644](../src/next/NextCentroControlloParityPage.tsx#L1642-L1644) → `navigate(buildNextDettaglioLavoroPath({ lavoroId }))` — **PAGINA, non modale**
- **`onEventoChipClick(event: HomeEvent)`** [:1645-1648](../src/next/NextCentroControlloParityPage.tsx#L1645-L1648) → apre `NextHomeAutistiEventoModal` (single event)
- **`onChipListOpen(anchorRect, kind, targa, ids, tipoSegn?)`** [:1538-1632](../src/next/NextCentroControlloParityPage.tsx#L1538-L1632) → costruisce `HomeEvent[]` solo per record APERTI poi apre lo stesso modale con lista navigabile

### 2.2 MAPPING TARGET PER ARCHIVIO STORICO

#### LAVORI → pagina dedicata `/next/dettagliolavori/{id}`
- **Pattern Sinottica**: `onLavoroClick(lavoroId)` → `navigate(buildNextDettaglioLavoroPath({lavoroId}))` ([NextCentroControlloParityPage.tsx:1642-1644](../src/next/NextCentroControlloParityPage.tsx#L1642-L1644))
- **Importazione path builder**: `import { buildNextDettaglioLavoroPath } from "./domain/nextLavoriDomain";` (linea 45)
- **Pagina target**: [NextDettaglioLavoroPage.tsx](../src/next/NextDettaglioLavoroPage.tsx) — esiste, legge lavoro singolo via id
- **Compatibilità record eseguiti=true**: ✓ la pagina è di consultazione (Lavori Da Eseguire / In Attesa / Eseguiti convergono su questo dettaglio), funziona per qualsiasi stato lavoro
- **Verdetto**: usare lo stesso navigate dall'archivio. Click riga lavoro archivio → `navigate(buildNextDettaglioLavoroPath({lavoroId: record.data.id}))`

#### MANUTENZIONI → pagina `/next/manutenzioni?recordId={id}`
- **Pattern Sinottica**: la Sinottica V2 **NON apre nessun modale per le manutenzioni** (le manutenzioni non hanno chip; appaiono come cella derivata "Ultimo: MM.YYYY" + eventuale badge gomme). Confermato grep `manutenzioneClick` / `onManutenzioneClick` → 0 risultati nel CC.
- **Pagina target esistente**: [NextManutenzioniPage.tsx](../src/next/NextManutenzioniPage.tsx) accetta query param `?recordId={id}` ([:869](../src/next/NextManutenzioniPage.tsx#L869)) e gestisce selezione dettaglio inline ([:3027](../src/next/NextManutenzioniPage.tsx#L3027) `onSelectMaintenance={(recordId) => setSelectedDetailRecordId(recordId)}`)
- **Compatibilità record passati**: ✓ tutte le manutenzioni sono per definizione "fatti registrati a posteriori" — la pagina mostra l'elenco intero e selezione dettaglio sempre disponibile
- **Verdetto**: click riga manutenzione archivio → `navigate("/next/manutenzioni?recordId=" + encodeURIComponent(record.data.id))`. **Nessun modale necessario.**

#### SEGNALAZIONI → `NextHomeAutistiEventoModal` con `editable={false}`
- **Modale**: `NextHomeAutistiEventoModal` ([components/NextHomeAutistiEventoModal.tsx](../src/next/components/NextHomeAutistiEventoModal.tsx))
- **Pattern Sinottica**: la Sinottica costruisce `HomeEvent` per ogni segnalazione attiva con `tipo:"segnalazione"` ([NextCentroControlloParityPage.tsx:1551-1571](../src/next/NextCentroControlloParityPage.tsx#L1551-L1571)) e lo passa al modale via state `sinotticaEventoModalEvent`. Modale renderizzato a [:1650-1722](../src/next/NextCentroControlloParityPage.tsx#L1650-L1722).
- **Props critiche**: `event: HomeEvent | null`, `editable?: boolean`, `onMarkChiusa?`, `onMarkChiuso?`, `onMarkEvasa?`, `onCreateLavoro?` ([NextHomeAutistiEventoModal.tsx:41-55](../src/next/components/NextHomeAutistiEventoModal.tsx#L41-L55))
- **Branch `editable`**: il blocco azioni "Marca chiusa / evasa / chiuso / CREA LAVORO" è wrappato in `{editable && event && (...)}` a [linea 959](../src/next/components/NextHomeAutistiEventoModal.tsx#L959). **Quando `editable={false}` o omesso, le azioni NON vengono renderizzate.**
- **Compatibilità record `chiusa=true`**: ✓ il modale mostra i dati (descrizione, autista, badge, timestamp, JSON payload, foto se presenti) indipendentemente dallo stato `chiusa`. Le azioni sono nascoste solo via `editable={false}`. Nessun branch ulteriore basato su `chiusa`/`stato`.
- **Verdetto**: click riga segnalazione archivio → costruire `HomeEvent` da `NextAutistiSegnalazioneSectionItem` (stesso pattern righe 1551-1571 del Parity) → aprire modale con `editable={false}`.

#### RICHIESTE → `NextHomeAutistiEventoModal` con `editable={false}`
- **Modale**: stesso `NextHomeAutistiEventoModal`
- **Pattern Sinottica**: costruzione `HomeEvent` con `tipo:"richiesta_attrezzature"` ([NextCentroControlloParityPage.tsx:1601-1623](../src/next/NextCentroControlloParityPage.tsx#L1601-L1623))
- **Compatibilità record `evasa=true`**: ✓ stesso ragionamento delle Segnalazioni — il modale mostra dati senza branch su `evasa`. Azioni nascoste con `editable={false}`.
- **Verdetto**: click riga richiesta archivio → costruire `HomeEvent` da `NextAutistiRichiestaSectionItem` (pattern righe 1601-1623) → aprire modale con `editable={false}`.

### 2.3 COMPORTAMENTO SU RECORD CHIUSI/STORICIZZATI

Riferendo alle 3 strategie del prompt 30.0:

- **(X) Apri stesso modale, accetta azioni irrilevanti**: rischio alto. Su record già chiuso, "Marca chiusa" è idempotente ma confonde l'UX; "CREA LAVORO" su segnalazione già con `linkedLavoroId` è già protetto da `disabled` ([:749](../src/next/components/NextHomeAutistiEventoModal.tsx#L749) `disabled={hasLinkedLavoro(payload) || createFormOpen}` → label "GIÀ CREATO"), ma "Marca chiusa" NON ha guard analogo.
- **(Y) Apri stesso modale con flag `editable={false}`**: ✓ **già supportato nativamente** dal codice esistente ([:340, :959, :499](../src/next/components/NextHomeAutistiEventoModal.tsx#L340)). **Zero refactor del modale**, basta omettere `editable` o passarlo a `false` dall'archivio. **Patch minima**: solo nuovo handler + render condizionale nel parent CC.
- **(Z) Modale diverso solo-lettura**: spreco di codice, il modale esistente già supporta entrambi i modi.

**Decisione consigliata: STRADA Y** (zero-touch sul modale esistente).

Nota di rifinitura UX (futura, non critica): mostrare nel modale `editable={false}` un badge "📁 Archivio storico" o "Record chiuso" per chiarire all'utente perché le azioni sono nascoste. Patch ~3 righe — opzionale, fuori dallo scope minimo.

### 2.4 CONNETTIVITÀ PROPOSTA (alto livello, NON IMPLEMENTATA)

#### Pattern condiviso
- Lo state del modale (`sinotticaEventoModalEvent`, `sinotticaEventoModalOpen`) vive già in **NextCentroControlloParityPage.tsx** ([:687-688](../src/next/NextCentroControlloParityPage.tsx#L687-L688))
- L'archivio storico è un componente figlio del Parity ([:1424](../src/next/NextCentroControlloParityPage.tsx#L1424) `<NextArchivioStoricoTab />`)
- Per condividere lo state ci sono 2 opzioni:
  - **(α) prop drilling**: `NextArchivioStoricoTab` riceve un callback `onOpenEvent(event, editable)` dal Parity → solleva l'evento al parent → Parent gestisce lo state esistente
  - **(β) context React**: nuovo context "ArchivioModalBridge". Più sofisticato, fuori scope minimo
  - **(γ) navigate**: per Lavori e Manutenzioni va bene (sono pagine), per Segnalazioni/Richieste sarebbe rotto (sono modali sopra CC)

**Raccomandazione: α (prop drilling)**. Più semplice, allineato al pattern PROMPT 28.

#### Mapping handler per kind

| Kind | Handler proposto | Estrazione da ArchivioRecord |
|---|---|---|
| Lavoro | `navigate(buildNextDettaglioLavoroPath({lavoroId: record.data.id}))` | `record.data.id` ([NextLavoriListaRow.id](../src/next/domain/nextLavoriDomain.ts#L177)) |
| Manutenzione | `navigate("/next/manutenzioni?recordId=" + encodeURIComponent(record.data.id))` | `record.data.id` ([NextManutenzioniLegacyDatasetRecord.id](../src/next/domain/nextManutenzioniDomain.ts#L111)) |
| Segnalazione | costruire HomeEvent (pattern righe 1551-1571) + `onOpenEvent(event, false)` | `record.data.{id, timestamp, targa, autistaNome, badgeAutista, tipo, descrizione, stato}` |
| Richiesta | costruire HomeEvent (pattern righe 1601-1623) + `onOpenEvent(event, false)` | `record.data.{id, timestamp, targa, autistaNome, badgeAutista, testo, stato}` |

#### Override comportamento click riga

Oggi in archivio: click riga toggla `isExpanded` (ArchivioFeed `handleToggleExpand`). Decisione di UX:
- **Opzione 1**: click riga = espande card (comportamento attuale), e ci sarà un nuovo bottone/link "Apri dettaglio" dentro la card espansa → naviga/apre modale
- **Opzione 2**: click riga = apre subito il modale/pagina, e la freccia chevron resta per espandere inline
- **Opzione 3 (ibrida)**: doppio click apre modale, singolo click espande

Lo SPEC §10 dice "click riga = espande inline". Quindi **Opzione 1** è coerente con lo SPEC approvato — il link "Apri dettaglio" sta dentro la card espansa.

---

## PARTE 3 — RACCOMANDAZIONE STRATEGICA

### 3.1 PRIORITÀ INTERVENTI

| Intervento | Priorità | Costo | Note |
|---|---|---|---|
| **Fix foto mezzo** (Parte 1.6) | ALTA | BASSO | 5 file, ~30 righe nette, indipendente |
| **Collegamento Lavori** | ALTA | BASSO | 1 handler navigate, riusa builder esistente |
| **Collegamento Manutenzioni** | MEDIA | BASSO | 1 handler navigate, query param già supportato |
| **Collegamento Segnalazioni** | ALTA | MEDIO | costruzione HomeEvent + prop drilling onOpenEvent + render condizionale |
| **Collegamento Richieste** | ALTA | MEDIO | stesso modello Segnalazioni |
| **Strada Y readOnly** (`editable={false}`) | — | NULLO | già supportato nativamente, basta passare il flag |

### 3.2 STRADA CONSIGLIATA

**Due prompt separati** (NON un macro).

Motivazione basata su evidenza:

1. **La fix foto è autoconsistente**: tocca solo `archivioStorico/`, nessuna dipendenza dal modale. Può essere mergiata e testata in isolamento. Test E2E rapidi (presenza `.archivio-row-photo img` o svg).
2. **I collegamenti modali toccano il parent CC** (NextCentroControlloParityPage.tsx), che è il file critico stabilizzato a 62/62 PASS Playwright. Patch separata = backup separato, risk-isolation.
3. **Le decisioni UX sui collegamenti** richiedono input di Giuseppe (vedi §3.3 punto 1-2) — la foto invece è solo un bug tecnico, non ha decisioni UX.

**Sequenza consigliata**:
- **PROMPT 30.1** (immediato, autonomo): fix foto mezzo. 5 file, ~30 righe, test E2E 1 nuovo, indipendente.
- **PROMPT 30.2** (dopo decisioni Giuseppe in §3.3): collegamenti modali con strada Y. Backup CC, 1-2 file modificati (Parity + ArchivioFeed), test E2E per i 4 kind.

### 3.3 DOMANDE APERTE PER GIUSEPPE (max 5)

1. **UX del click riga**: Opzione 1 (espande inline, bottone "Apri dettaglio" nella card espansa — coerente con SPEC §10) **OPPURE** Opzione 2 (click riga apre direttamente modale/pagina, chevron resta per espansione)? Raccomando Opzione 1 perché allineata allo SPEC 1.0 approvato.

2. **Badge "Archivio storico" sul modale readOnly**: aggiungiamo un piccolo badge visivo nel `NextHomeAutistiEventoModal` quando `editable={false}` per dichiarare "stai consultando uno storico" (~3 righe), OPPURE lasciamo sobrio (assenza azioni = readOnly implicito)? Opzionale.

3. **Manutenzioni — navigate vs modale**: la decisione attuale è navigate a `/next/manutenzioni?recordId={id}` (esistente). Va bene così, OPPURE preferisci che cliccare manutenzione apra un nuovo modale dedicato (richiede creazione)? Raccomando navigate (zero scope creep).

4. **Lavoro generato — link inverso da Segnalazione**: nell'archivio, riga Segnalazione mostra step "Generato lavoro {ID}" quando `hasLinkedLavoro`. Vogliamo rendere quello span un link cliccabile che apre il dettaglio lavoro? Sarebbe un sottoset di collegamento (PROMPT 30.2 lo include automaticamente, ~3 righe in più).

5. **Refactor `ArchivioVeicoloPhotoPlaceholder`**: post-fix foto, il vecchio componente in `ArchivioRowShared.tsx` diventa codice morto. Lo rimuoviamo nel PROMPT 30.1 (cleanup) o lasciamo per retrocompat documentale? Raccomando rimozione (zero consumer dopo patch).
