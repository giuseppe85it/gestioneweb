# AUDIT NEXT COMPLETO — 2026-05-16

**Tipo:** AUDIT READ-ONLY · **PROMPT:** 54 · **Autore:** Claude Code (Opus 4.7) · **Modalità:** lettura statica del repo + audit storici come baseline.

> Fonte di verità: codice reale del repo. Dove un audit storico è in conflitto col codice, vince il codice ed è segnalato esplicitamente.
> Le 3 questioni già tracciate (7 segnalazioni storiche da chiudere a mano; D2 punto d'ingresso UI `chiusa_da_evento`; T3 link cliccabile a segnalazione originale) NON compaiono nel Piano d'urgenza.

---

## Indice

- [Cap. 1 — Nota di metodo + scoperte trasversali fra le baselines](#cap-1)
- [Cap. 2 — Flussi segnalazione / manutenzione / controllo KO end-to-end](#cap-2)
- [Cap. 3 — Euromecc — entità, relazioni, coerenza UI/dati](#cap-3)
- [Cap. 4 — Gap NEXT-vs-madre + copertura Centro di Controllo](#cap-4)
- [Cap. 5 — App autisti + AutistiAdmin + proposta sostituzione NEXT](#cap-5)
- [Cap. 6 — PDF: diagnosi simboli strani (focus manutenzioni)](#cap-6)
- [Cap. 7 — Chat IA: è obsoleta dopo Centro di Controllo?](#cap-7)
- [Cap. 8 — Piano d'urgenza (unica lista numerata)](#cap-8)
- [Cap. 9 — Osservazioni trasversali](#cap-9)

---

<a id="cap-1"></a>
## 1. Nota di metodo

### 1.1 Anomalie rispetto al testo del PROMPT 54

Tre conflitti fra testo del PROMPT e codice reale, risolti a favore del codice:

1. **File numerati `01_AUDIT_REALE_*.md` … `08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md` NON esistono** in [docs/_live/](docs/_live/). Esistono audit con nomi data-based (es. [AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md](docs/_live/AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md), [AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md](docs/_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md), ecc.) + [STORICO_AUDIT_COMPRESSO.md](docs/_live/STORICO_AUDIT_COMPRESSO.md). → Sostituito lo schema "01-08" con la lettura degli audit reali presenti.
2. **`AUDIT_COPERTURA_MODALI_2026-05-04.md` non è in root**: vive in [docs/product/AUDIT_COPERTURA_MODALI_2026-05-04.md](docs/product/AUDIT_COPERTURA_MODALI_2026-05-04.md) (copia in `docs/_handoff_2026-05-04/`). → Usata la copia in `docs/product/`.
3. **Lo stato del Blocco 8 / Chat IA descritto dal PROMPT è OBSOLETO**: il PROMPT dichiara "Blocco 8 fermo a CANCELLO 6 Playwright 2/10, root cause `catalog-validator.js` su `resolvedFilters.v2`". Il codice reale e gli audit successivi documentano il contrario:
   - [STATO_MIGRAZIONE_NEXT.md:42-49](docs/_live/STATO_MIGRAZIONE_NEXT.md) (sezione "Chat IA NEXT V1 100%", data 2026-05-06): "Chat IA NEXT chiusa V1 100% sulle 5 viste Driver360/Vehicle360/Site360/Euromecc360/Ricerca360"; "Playwright 17-21 PASS 10/10"; "node --check boundary/adapter PASS, build PASS, diagnostics T1..T28 PASS".
   - [backend/internal-ai/server/lib/catalog-validator.js:414](backend/internal-ai/server/lib/catalog-validator.js#L414) — branch `if (value.version === "resolvedFilters.v2") { validateResolvedFiltersV2(value, errors); return; }` operativo.
   - [backend/internal-ai/server/lib/post-llm-resolver.js:3](backend/internal-ai/server/lib/post-llm-resolver.js#L3) e [backend/internal-ai/server/lib/shadow-comparator.js:4](backend/internal-ai/server/lib/shadow-comparator.js#L4) — entrambi marcati "DEPRECATED, nella prossima major. Riferimento: BLOCCO 8" → confermano la chiusura del Blocco 8.
   - [docs/audit/AUDIT_INDIPENDENTE_BLOCCO_8_C6_2026-05-06.md](docs/audit/AUDIT_INDIPENDENTE_BLOCCO_8_C6_2026-05-06.md): "C6 PASS, Playwright BLOCCO 8 C6 PASS 10/10".
   - Conseguenza: il cap. 7 ragiona sullo stato reale (Chat IA V1 CHIUSA), non sulla descrizione del PROMPT.

### 1.2 Decisioni vincolanti citate

Le decisioni di [docs/DIARIO_DECISIONI.md](docs/DIARIO_DECISIONI.md) usate come vincoli sono citate solo per riferimento. Non vengono riscritte. Le più rilevanti per questo audit:

- **2026-04-23** — Mezzo360/Autista360 non portati in NEXT (sostituiti da capability IA + chat + CC).
- **2026-04-30** — Sidebar NEXT cleanup; Scadenze Collaudi diventa modulo scrivente.
- **2026-05-04** — Chat IA NEXT in modalità Zero-Invenzioni; "Esplorazione prima di asserzione"; Registro Collection Firestore v0.5 alias/boundary separati.
- **2026-05-06** — Chat IA NEXT V1 chiusa 100% sulle 5 viste; Registro v1.0 STABLE; SPEC Motore Generico v1.0 STABLE.
- **2026-05-09** — Centro Controllo torre operativa: 4 nuovi scope barrier (RICHIESTE/SEGNALAZIONI/CONTROLLI/DELETE_MEZZO); soft-delete pattern; hard-delete mezzo.
- **2026-05-12 → 14** — Dismissione Lavori NEXT (assorbiti in `@manutenzioni`); decisione **J.7** (`linkedLavoroId`/`linkedLavoroIds` mantengono il nome, cambia solo semantica).
- **2026-05-14** — Macchina chiusura ciclo eventi (`chiusa_da_evento`); aggancio/sgancio retroattivo evento gomme; storia unificata e sparizione satellite.
- **2026-05-15** — PROMPT 47/48 aggancio inverso + barriera; PROMPT 49/50/51 fix timestamp e regola permanente `TIMESTAMP-MAI-DA-CLICK`; PROMPT 52 frase storia su vista segnalazione; PROMPT 53 pulizia pre-commit.

### 1.3 Mappatura sintetica del Centro di Controllo nel codice

Il Centro di Controllo NEXT non vive in una sola cartella: è **sparso** in più sedi (anomalia di architettura, non di funzionamento). File reali:

- Pagina principale (sinottica + alerts + sessioni): [src/next/NextCentroControlloPage.tsx](src/next/NextCentroControlloPage.tsx). **Nota**: il file contiene anche logica della home (`HomeAlertCard`, `StatoOperativoCard`, `QuickNavigationCard`, `HomeInternalAiLauncher`) e ha `CLONE_ACTION_BLOCKED_TITLE = "Clone in sola lettura: azione non disponibile"` ([src/next/NextCentroControlloPage.tsx:52](src/next/NextCentroControlloPage.tsx#L52)) — pattern legacy. Lettura più chiara post-rinomina (vedi cap. 8).
- Wrapper route per parity (registrato in `App.tsx`): [src/next/NextCentroControlloParityPage.tsx](src/next/NextCentroControlloParityPage.tsx).
- Pagina clone separata: [src/next/NextCentroControlloClonePage.tsx](src/next/NextCentroControlloClonePage.tsx).
- Sinottica V2: [src/next/components/NextCentroControlloSinottica.tsx](src/next/components/NextCentroControlloSinottica.tsx) + token CSS [src/next/components/sinottica-flotta-v2-design-tokens.css](src/next/components/sinottica-flotta-v2-design-tokens.css).
- Modali analisi/indagine: [src/next/components/NextCentroControlloAnalisiModal.tsx](src/next/components/NextCentroControlloAnalisiModal.tsx), [src/next/components/NextCentroControlloIndagineModal.tsx](src/next/components/NextCentroControlloIndagineModal.tsx).
- Sotto-modulo **Archivio Storico**: [src/next/centroControllo/archivioStorico/](src/next/centroControllo/archivioStorico/) (22 file: tipi, hooks `useArchivioData`/`useArchivioFilters`/`useArchivioHide`/`useArchivioSearch`/`useArchivioUrlState`, rows formatters `ArchivioRowSegnalazione`/`ArchivioRowManutenzione`/`ArchivioRowRichiesta`/`ArchivioRowExpanded`/`ArchivioRowShared`, toolbar, sub-tabs, feed, kebab menu, confirm delete, day separator, mini timeline, empty state, foto veicolo).
- Domain (reader Firestore): [src/next/domain/nextCentroControlloDomain.ts](src/next/domain/nextCentroControlloDomain.ts:1-200) — `readNextCentroControlloSnapshot()` legge `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`.
- Tipi: [src/next/types/centroControlloTypes.ts](src/next/types/centroControlloTypes.ts).
- CSS dedicato: [src/next/next-centro-controllo.css](src/next/next-centro-controllo.css).
- Route registrata: `/next/centro-controllo` → `NextCentroControlloParityPage` (roleGuard `centro-controllo`).
- Scope barrier dedicati (in [src/utils/cloneWriteBarrier.ts:111-184](src/utils/cloneWriteBarrier.ts#L111-L184)): `RIFORNIMENTI_WRITE_SCOPE`, `SEGNALAZIONI_WRITE_SCOPE`, `CONTROLLI_WRITE_SCOPE`, `RICHIESTE_WRITE_SCOPE`, `DELETE_MEZZO_WRITE_SCOPE`, `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`, `ARCHIVIO_HIDE_WRITE_SCOPE`.

---

<a id="cap-2"></a>
## 2. Flussi segnalazione / manutenzione / controllo KO — end-to-end

I tre flussi convergono sullo stesso schema "sorgente → manutenzione (`daFare`) → chiusura". La descrizione qui sotto è ancorata ai writer/reader reali; il riferimento di sintesi è [docs/_live/AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md](docs/_live/AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md) integrato con i fix PROMPT 44–52.

### 2.1 — Segnalazione autista (autisti in box)

**Punti d'ingresso UI:**
- App autista madre (`src/autisti/`) → scrive `@segnalazioni_autisti_tmp` (VERIFICA NON ESEGUITA su file madre, escluso dal perimetro).
- `/next/autisti-admin` (madre montata): tab "Segnalazioni" → handler `setTab("segnalazioni")` in [src/autistiInbox/AutistiAdmin.tsx:2306](src/autistiInbox/AutistiAdmin.tsx#L2306).
- `/next/autisti-inbox` (NEXT nativo): [src/autistiInbox/AutistiSegnalazioniAll.tsx](src/autistiInbox/AutistiSegnalazioniAll.tsx) + wrapper NEXT [src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx](src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx).
- `/next/centro-controllo` → Archivio Storico → tab Segnalazioni: [src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx](src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx).

**Scrittura iniziale (Firestore):** `@segnalazioni_autisti_tmp` con campi `id`, `mezzo`/`targa*`, `descrizione`, `stato`, `letta`, ecc. (writer madre, perimetro escluso).

**Eventi intermedi NEXT:**
- **Conversione in manutenzione daFare**: `createManutenzioneDaFareFromSegnalazione(record)` in [src/next/writers/nextManutenzioneDaFareCreateWriter.ts:269-315](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L269-L315) → scrive `@manutenzioni` (stato `daFare`, `origineTipo:"segnalazione"`, `origineRefId`, `origineRefKey`) e patch sorgente via `patchSegnalazione` ([src/next/writers/nextManutenzioneDaFareCreateWriter.ts:141-166](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L141-L166)) che scrive `writeLegameLavoro([manutenzioneId])` + `stato:"presa_in_carico"` + `letta:true`. Scope: `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`.
- **Merge su manutenzione esistente daFare/programmata** (PROMPT 45 T1): `agganciaSorgenteAManutenzioneEsistente` in [src/next/writers/nextManutenzioneDaFareCreateWriter.ts:435-525](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L435-L525). Reader candidati: `manutenzioniCandidatiMerge.ts` (finestra 90gg, solo daFare/programmata).
- **Aggancio retroattivo inverso a manutenzione esistente** (PROMPT 47, qualunque stato): `agganciaSegnalazioneAManutenzioneEsistente` in [src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts:171-342](src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L171-L342). Se il target è `eseguita`/`chiusa_da_evento`, propaga la chiusura sulla sorgente (`chiudiSegnalazioneDaEvento`). Reader: `manutenzioniPerAggancio.ts` (finestra 365gg, tutti gli stati).
- **Sgancio link orfano**: `sganciaLegameOrfano` (riferito in [docs/_live/REPORT_PROMPT47_2026-05-15.md]) per casi in cui `linkedLavoroId` punta a manutenzione cancellata.
- **Presa in carico esplicita** (PROMPT 50 R2): `segnaPresaInCaricoSegnalazione` in [src/next/writers/presaInCaricoSegnalazioneWriter.ts:82-125](src/next/writers/presaInCaricoSegnalazioneWriter.ts#L82-L125) — **unica funzione autorizzata** a scrivere `dataPresaInCarico`. Regola `TIMESTAMP-MAI-DA-CLICK` ([AGENTS.md:235-276](AGENTS.md#L235-L276)).
- **Chiusura propagata da manutenzione collegata**: `propagateChiusuraToLegame` in [src/next/helpers/closureOrchestrator.ts:44-120](src/next/helpers/closureOrchestrator.ts#L44-L120). `chiusuraData` eredita da `target.data` (PROMPT 50 R1), no `Date.now()` come effetto collaterale.
- **Chiusura da evento gomme** (PROMPT 38d): `chiudiSegnalazioneDaEvento` in [src/next/writers/nextChiusuraEventoWriter.ts:252-266](src/next/writers/nextChiusuraEventoWriter.ts#L252-L266) (writer dedicato).

**Punto di uscita UI/PDF:**
- Lista NEXT: [src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx](src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx) — usa `generateSegnalazionePDFBlob` di [src/utils/pdfEngine.ts](src/utils/pdfEngine.ts) per export PDF.
- Sinottica V2 (chips/badge): [src/next/components/NextCentroControlloSinottica.tsx](src/next/components/NextCentroControlloSinottica.tsx).
- Archivio Storico CC: [src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx](src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx) — **frase storia certificata** via `FraseStoriaRecord` (PROMPT 52 fix recordChiusoFromRaw).
- Dossier mezzo: [src/next/NextDossierMezzoPage.tsx](src/next/NextDossierMezzoPage.tsx) (sezione storia).

**Buchi reali e migliorie possibili (escluse le 3 questioni già tracciate):**
- **Doppia convenzione di legame** (D3 audit): `linkedLavoroId`/`linkedLavoroIds` sulla segnalazione vs `origineRefId`/`origineRefKey`/`origineTipo` sulla manutenzione. Coesistono per scelta J.7 (nome invariato) ma il `cicloLegame.ts` helper unificato non ha ancora assorbito completamente i due schemi. Costo: M.
- **Stato condizionale `presa_in_carico`** ([nextManutenzioneDaFareCreateWriter.ts:161-163](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L161-L163)): `patchSegnalazione` imposta `stato:"presa_in_carico"` solo se il record ha già il campo `stato`. Record nati senza `stato` non lo ricevono. Costo: S.
- **`@segnalazioni_autisti_tmp` campo `chiusa` vs `stato`**: pattern soft-delete 2026-05-09 introduce `chiusa:true` ma `stato` resta `presa_in_carico` (3 record reali al dump 2026-05-14). Letture devono normalizzare entrambi i campi; il fix di display [ArchivioRowSegnalazione](src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx) via PROMPT 52 sanà la frase ma non lo stato canonico. Costo: M.

### 2.2 — Manutenzione

**Punti d'ingresso UI:**
- Da segnalazione (vedi §2.1): writer `createManutenzioneDaFareFromSegnalazione`.
- Da controllo KO (vedi §2.3): writer `createManutenzioneDaFareFromControllo`.
- Inserimento manuale: tab "Crea/Modifica" in [src/next/NextManutenzioniPage.tsx](src/next/NextManutenzioniPage.tsx) — writer `saveNextManutenzioneBusinessRecord` in [src/next/domain/nextManutenzioniDomain.ts](src/next/domain/nextManutenzioniDomain.ts).
- Da evento autista in `/next/autisti-inbox`: `createManutenzioneDaFareFromEvento` in [src/next/writers/nextManutenzioneDaFareCreateWriter.ts:226-267](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L226-L267) (sanificato PROMPT 28).

**Scrittura Firestore:** `@manutenzioni`. Stati ammessi: `daFare`, `programmata`, `eseguita`, `chiusa_da_evento`, "(vuoto)" (legacy, 55/73 record).

**Eventi intermedi:**
- Aggancio retroattivo a `gomme_evento` (PROMPT 38d, decisione 2026-05-14): scrive `stato:"chiusa_da_evento"`, `chiusuraDi:"gomme_evento"`, `chiusuraRefId`, `chiusuraData` via [src/next/writers/nextChiusuraEventoWriter.ts:234-250](src/next/writers/nextChiusuraEventoWriter.ts#L234-L250). Helper read-only: [src/next/helpers/eventiCompatibili.ts](src/next/helpers/eventiCompatibili.ts). Modal: [src/next/components/NextAggancioEventoModal.tsx](src/next/components/NextAggancioEventoModal.tsx).
- Modifica (PROMPT 44 Opzione 1): id stabile alla radice; matching per id reale o fingerprint via `findLegacyRecordIndexByFingerprint`. Fix `chiudiManutenzioneDaEvento` con fallback fingerprint: [src/next/writers/nextChiusuraEventoWriter.ts:95-108](src/next/writers/nextChiusuraEventoWriter.ts#L95-L108).
- Eliminazione: bottone "Elimina" nel Quadro manutenzioni HTML (PROMPT 44d) con `deleteNextManutenzioneBusinessRecord` (fallback fingerprint).
- **Closure orchestrator** (PROMPT 44 D1): chiusura manutenzione → propagazione a sorgente collegata via `propagateChiusuraToLegame` ([closureOrchestrator.ts:44-120](src/next/helpers/closureOrchestrator.ts#L44-L120)). Idempotente.
- Strategia 3a (PROMPT 23-25, decisione 2026-05-12/13): `@lavori` Firestore intoccabile, madre continua a scriverlo; NEXT non legge `@lavori` come modulo Lavori; campo `linkedLavoroId` mantiene il nome ma punta a `@manutenzioni` (J.7).

**Punto di uscita UI/PDF:**
- `/next/manutenzioni` tab "Da fare", "Dettaglio", "Quadro" ([NextManutenzioniPage.tsx](src/next/NextManutenzioniPage.tsx)).
- PDF Quadro manutenzioni: usa Roboto Unicode con fallback Helvetica via `ensurePdfUnicodeFont` ([NextManutenzioniPage.tsx:626-647](src/next/NextManutenzioniPage.tsx#L626-L647)) — **unico generator NEXT con gestione Unicode** (vedi cap. 6).
- Dossier mezzo: sezione storia + ultimi 5 + modale "Mostra tutti" ([NextDossierMezzoPage.tsx](src/next/NextDossierMezzoPage.tsx)).
- Centro Controllo Sinottica V2: chip stato + KPI "Manutenzioni urgenti" ([NextCentroControlloSinottica.tsx:1527](src/next/components/NextCentroControlloSinottica.tsx#L1527)).
- Archivio Storico CC: tab Manutenzioni ([ArchivioRowManutenzione.tsx](src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx)).

**Buchi reali:**
- **55/73 manutenzioni con `stato:"(vuoto)"`** (dump 2026-05-14): record legacy migrati senza normalizzazione. Display ha fallback ma KPI e filtri risentono dell'ambiguità. Costo migration: M/L.
- **Record `daFare` nuovi nascono con `data:null` e senza `dataInserimento`/`createdAt`** (D5 audit ciclo segnalazione): [nextManutenzioneDaFareCreateWriter.ts:105-139](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L105-L139) `buildManutenzioneDaFareRecord` lascia `data: null`. Conseguenza: ordinamento per data e filtri "ultimi 30gg" si appoggiano a campi mancanti. Costo: S.
- **Aggregator badge "ASSE X da verificare" Gomme Sinottica**: dichiarato nel tipo `SinotticaRow.gommeAxleProblema` ma hardcoded `null` ([NextCentroControlloSinottica.tsx:760](src/next/components/NextCentroControlloSinottica.tsx#L760)) — badge mai visibile (decisione 2026-05-11 lascia placeholder).

### 2.3 — Controllo KO

**Flusso completo documentato in [docs/_live/RUNTIME_FLUSSO_CONTROLLO_KO_MANUTENZIONE_DAFARE.md](docs/_live/RUNTIME_FLUSSO_CONTROLLO_KO_MANUTENZIONE_DAFARE.md).** Sintesi ancorata al codice:

**Step 1** — Autista invia controllo via app madre: scrive `@controlli_mezzo_autisti` con `check` (mappa). KO quando almeno una voce `false`.

**Step 2** — Admin in `/next/autisti-admin` tab "Controlli" o `/next/centro-controllo` Archivio.

**Step 3** — Click "CREA MANUTENZIONE": handler `createManutenzioneDaFareAdminFromControllo(record)` ([src/next/autistiInbox/NextAutistiAdminNative.tsx:1540](src/next/autistiInbox/NextAutistiAdminNative.tsx#L1540)) blocca doppio collegamento se `linkedLavoroId`/`linkedLavoroIds` presenti, conferma, chiama writer.

**Step 4** — Writer: `createManutenzioneDaFareFromControllo` in [src/next/writers/nextManutenzioneDaFareCreateWriter.ts:317-390](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L317-L390). Genera N manutenzioni `daFare` (una per targa coinvolta — entrambi/motrice/rimorchio). Urgenza `alta` se >1 KO o `obbligatorio === true`.

**Step 5** — Backlink controllo: `patchControllo` ([nextManutenzioneDaFareCreateWriter.ts:168-184](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L168-L184)) scrive `writeLegameLavoro([manutenzioneId, ...])` (campo `linkedLavoroId` o `linkedLavoroIds`).

**Step 6** — Visualizzazione: card home, tab "Da fare" in Manutenzioni, KPI CC, sezione Dossier.

**Step 7** — Tracciabilità origine: in tab "Dettaglio" pannello "Origine manutenzione" + bottone "Vedi controllo" ([NextManutenzioniPage.tsx:3482-3517](src/next/NextManutenzioniPage.tsx#L3482-L3517)).

**Chiusura controllo (centro controllo, soft-delete pattern 2026-05-09):**
- `markControlloChiuso(id)` in [src/next/nextControlliWriter.ts:28-70](src/next/nextControlliWriter.ts#L28-L70) scrive `chiuso:true`, `dataChiusura:Date.now()`, `chiuso_by:"centro_controllo_next"`. Scope: `CONTROLLI_WRITE_SCOPE`.
- `markSegnalazioneChiusa(id)` simmetrico in [src/next/nextSegnalazioniWriter.ts:28-70](src/next/nextSegnalazioniWriter.ts#L28-L70) (`chiusa:true`).
- Chiusura da evento: `chiudiControlloDaEvento` ([nextChiusuraEventoWriter.ts:268-282](src/next/writers/nextChiusuraEventoWriter.ts#L268-L282)) come per le segnalazioni.
- Aggancio inverso (PROMPT 47): `agganciaSegnalazioneAManutenzioneEsistente` supporta `sorgenteTipo:"controllo"`.

**Buchi reali:**
- **Solo 9/350 controlli hanno `linkedLavoro` valorizzato** (dump 2026-05-14): la stragrande maggioranza dei controlli registrati non è mai stata convertita in manutenzione. Non è necessariamente un bug (un controllo "tutto OK" non genera nulla), ma il rapporto 9/350 suggerisce di verificare la copertura della scrematura UI.
- **UI conversione controllo→manutenzione vive nella madre `AutistiAdmin.tsx`**: il bottone "CREA MANUTENZIONE" ([NextAutistiAdminNative.tsx:2663-2665](src/next/autistiInbox/NextAutistiAdminNative.tsx#L2663-L2665) ha equivalente nativo NEXT, ma il flusso primario passa ancora da `/next/autisti-admin` che monta la madre. Migrazione completa: vedi cap. 5.
- **Test runtime end-to-end**: VERIFICA NON ESEGUITA (audit statico).

---

<a id="cap-3"></a>
## 3. Euromecc — flusso problemi / segnalazioni / relazioni / visualizzazione

### 3.1 Entità e relazioni reali

Sorgente: [src/next/domain/nextEuromeccDomain.ts](src/next/domain/nextEuromeccDomain.ts) + [src/next/euromeccAreas.ts](src/next/euromeccAreas.ts) + [src/next/NextEuromeccPage.tsx](src/next/NextEuromeccPage.tsx).

**Collection Firestore** ([nextEuromeccDomain.ts:20-23](src/next/domain/nextEuromeccDomain.ts#L20-L23)):
- `euromecc_pending` — `EuromeccPendingDoc` (`areaKey`, `subKey`, `title`, `priority` {alta|media|bassa}, `dueDate`, `note`).
- `euromecc_done` — `EuromeccDoneDoc` (`areaKey`, `subKey`, `title`, `doneDate`, `by`, `note`, `nextDate`, `closedPending`).
- `euromecc_issues` — `EuromeccIssueDoc` (`areaKey`, `subKey`, `title`, `check`, `type` {criticita|anomalia|osservazione}, `state` {aperta|chiusa}, `reportedAt`, `reportedBy`, `note`, `closedDate`).
- `euromecc_area_meta` — `EuromeccAreaMetaDoc` (`areaKey`, `cementType`, `cementTypeShort`, `updatedBy`).
- Inoltre (lettura statica `AUDIT_COPERTURA_MODALI`): `euromecc_relazioni`, `euromecc_extra_components` (con file upload Storage in `euromecc/relazioni/{id}/{ts}_{fileName}`).

**Relazioni:**
- `area + sub` (gerarchia statica definita in `EUROMECC_AREAS`).
- Issue → pending: stesso `areaKey/subKey`, ma niente legame esplicito a documento.
- Done → pending: pattern `closedPending: true` indica che il done ha chiuso una pending; non c'è riferimento esplicito a `pendingId`.

### 3.2 Coerenza UI ↔ dati

- UI: [NextEuromeccPage.tsx](src/next/NextEuromeccPage.tsx) con 5 tab (`home`, `maintenance`, `issues`, `report`, `relazioni`).
- Relazioni gestite via [EuromeccRelazioneDoc](src/next/NextEuromeccPage.tsx#L110-L126) (`fileName`, `tecnici`, `note`, `statoImportazione`, `doneCount`, `pendingCount`, `extraComponentsCount`).
- **Coerenza dati**: relazione ↔ done/pending è inferita da contatori (`doneCount`, `pendingCount`) salvati nel documento relazione, non da legame back-link. Se i count divergono dalla realtà Firestore (cancellazione di un `done` collegato), il documento relazione mostra info stale. VERIFICA RUNTIME NON ESEGUITA.
- Type `EuromeccStatus` ([nextEuromeccDomain.ts:25](src/next/domain/nextEuromeccDomain.ts#L25)): unione di `EuromeccBaseStatus | "maint" | "issue" | "done" | "obs"`. La distinzione UI fra "issue/criticità" e "issue/anomalia" e "issue/osservazione" è semantica (campo `type`), non grafica strutturale: potenziale punto di disorientamento se non c'è una legenda visibile.

### 3.3 Ambiguità di flusso e punti di disorientamento utente

VERIFICA UI NON ESEGUITA (audit statico). Dal codice e da audit copertura modali (`AUDIT_COPERTURA_MODALI_2026-05-04` riga 83-84):
- **5 tab** (home/maintenance/issues/report/relazioni) — il distinguo `issues` vs `maintenance` vs `pending` può sovrapporsi mentalmente (un'issue aperta è anche un fabbisogno di manutenzione?). Il `DataManagerTabKey: "issues" | "pending" | "done"` ([NextEuromeccPage.tsx:48](src/next/NextEuromeccPage.tsx#L48)) introduce una seconda tassonomia parallela alla prima.
- **3 tipi issue** (`criticita`, `anomalia`, `osservazione`) — distinzione semantica che richiede UX dedicata (filtri/colori).
- **Campi liberi esclusi dal motore generico** (`AUDIT_COPERTURA_MODALI` riga 84): `note`, `by`, `reportedBy`, `tecnici`, `fileUrl`, `name`, `code`, `addedFrom/At/By` non in allowedFields. Coerente con Zero-Invenzioni ma significa che la Chat IA non li legge.

### 3.4 Migliorie concrete

- **Etichette legenda nei tab issues**: pillola colore + label per `criticita`/`anomalia`/`osservazione`.
- **Unificare tassonomia `tab` vs `DataManagerTabKey`**: capire se `home/maintenance/issues/report/relazioni` e `issues/pending/done` rappresentano due viste della stessa entità o due flussi differenti; documentare nella UI.
- **Legame esplicito done→pending**: aggiungere campo `closedPendingId` invece di solo flag `closedPending` per tracciare quale pending è stata chiusa. Costo: S.
- **Sync counters relazione**: ricalcolo on-demand (o serverless function) dei `doneCount`/`pendingCount`/`extraComponentsCount` quando un done/pending viene eliminato. Costo: M.

---

<a id="cap-4"></a>
## 4. Gap NEXT-vs-madre — cosa manca per lo stacco completo

### 4.1 Inventario route NEXT (`src/App.tsx` + [src/next/nextStructuralPaths.ts](src/next/nextStructuralPaths.ts))

33 rotte NEXT registrate. Lista riassunta nel piano (vedi C:\Users\giumi\.claude\plans\mode-audit-read-only-magical-sutton.md). Per questo audit, sono rilevanti:

- `/next/autisti-admin` → **monta `AutistiAdmin.tsx` madre** (vedi cap. 5).
- `/next/autisti` → `NextAutistiCloneLayout` (NEXT).
- `/next/autisti-inbox` → `NextAutistiInboxHomePage` (NEXT).
- `/next/centro-controllo` → `NextCentroControlloParityPage` (NEXT, roleGuard).
- `/next/chat` → `ChatIaPage` (NEXT, V1 chiusa).
- `/next/euromecc` → `NextEuromeccPage` (NEXT nativo, no parity madre).
- `/next/manutenzioni` → `NextManutenzioniPage` (NEXT, post-dismissione Lavori).

### 4.2 Gap classificati

**(a) Gap reali da chiudere:**

| # | Modulo / area | File evidenza | Taglia | Dipendenze |
|---|---|---|---|---|
| G1 | `/next/autisti-admin` monta madre `AutistiAdmin.tsx` (1404 KB) | `src/App.tsx`, [src/autistiInbox/AutistiAdmin.tsx](src/autistiInbox/AutistiAdmin.tsx) | **L** | tutti i 5 tab handlers, 11 storage keys (vedi §5.2), generazione PDF, modali, TargaPicker, lightbox |
| G2 | Cisterna scritture: `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili` NON nel registro Firestore (decisione 2026-05-04 punto 2 aperta) | [src/next/nextCisternaWriter.ts](src/next/nextCisternaWriter.ts), [REGISTRO_COLLECTION_FIRESTORE.md](docs/product/REGISTRO_COLLECTION_FIRESTORE.md) | M | inclusione nel motore generico v1, allowedFields, boundary readonly |
| G3 | Root collection documentali (`@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`) non corrispondenti a entry `storage/@documenti_*` del registro (decisione 2026-05-04 punto 1 aperta) | [AUDIT_COPERTURA_MODALI_2026-05-04.md:447-449](docs/product/AUDIT_COPERTURA_MODALI_2026-05-04.md) | M | aggiornare registro + boundary |
| G4 | Foto storage path (`fotoStoragePath`, `photoStoragePath`, `storagePath`) non in allowedFields per inventario/materiali/attrezzature/mezzi (decisione 2026-05-04 punto 4 aperta) | `AUDIT_COPERTURA_MODALI_2026-05-04.md:455-458` | S | aggiornare registro |
| G5 | Coordinate hotspot `x/y/areaId/uploadedAt` non in allowedFields (`@mezzi_foto_viste`, `@mezzi_hotspot_mapping`) — decisione 2026-05-04 punto 7 aperta | [src/next/domain/nextMappaStoricoDomain.ts:451-514](src/next/domain/nextMappaStoricoDomain.ts) | S | aggiornare registro |
| G6 | `chat_ia_reports` collection scritta dal codice ([src/next/chat-ia/reports/chatIaReportArchive.ts](src/next/chat-ia/reports/chatIaReportArchive.ts)) ma non formalmente esclusa nel registro (decisione 2026-05-04 punto 3 aperta) | come sopra | S | aggiornare registro (esclusione esplicita) |
| G7 | Cisterna NEXT modulo aperto/parziale (riferito in `STATO_MIGRAZIONE_NEXT` come "fase iniziale") | [src/next/NextCisternaPage.tsx](src/next/NextCisternaPage.tsx), [src/next/NextCisternaIAPage.tsx](src/next/NextCisternaIAPage.tsx), [src/next/NextCisternaSchedeTestPage.tsx](src/next/NextCisternaSchedeTestPage.tsx) | L | scope barrier, lettori, modali |
| G8 | Madre `src/pages/CisternaCaravate/*` (3 file) ancora unico riferimento per alcuni dataset Cisterna | [src/pages/CisternaCaravate/](src/pages/CisternaCaravate/) | dipende da G7 | come G7 |

**(b) Coperto da Centro di Controllo:**

L'audit della copertura funzionale Mezzo360 e Autista360 (decisione 2026-04-23 — non portati in NEXT) si fa per casi d'uso storici:

| Caso d'uso storico Mezzo360 | Coperto da CC? | Evidenza |
|---|---|---|
| Vedere stato corrente di un mezzo (anagrafica + autista assegnato) | **SÌ completamente** | Sinottica V2 ([NextCentroControlloSinottica.tsx](src/next/components/NextCentroControlloSinottica.tsx)) + Dossier mezzo ([NextDossierMezzoPage.tsx](src/next/NextDossierMezzoPage.tsx)) |
| Storico manutenzioni di un mezzo | **SÌ completamente** | Dossier mezzo sezione storia + Archivio Storico CC sub-tab Manutenzioni |
| Cronologia sessioni autista→mezzo | **SÌ completamente** | [src/next/domain/nextSessioniStoricoDomain.ts](src/next/domain/nextSessioniStoricoDomain.ts) + `NextMezzoCronologiaModal.tsx` (decisione 2026-05-09) |
| Costi mezzo (rifornimenti + manutenzioni aggregati) | **SÌ parzialmente** | Dossier mezzo (sezioni costi), CC tab Rifornimenti. Manca aggregato unico "totale annuo" come vista dedicata |
| Documenti mezzo (libretto, fatture) | **SÌ completamente** | Dossier mezzo sezione Fatture + `/next/ia/documenti` + libretto in IA |
| Foto mezzo viste/hotspot | **SÌ parzialmente** | [src/next/domain/nextMappaStoricoDomain.ts](src/next/domain/nextMappaStoricoDomain.ts) + hotspot mapping. Display foto presente; editor hotspot VERIFICA NON ESEGUITA |

| Caso d'uso storico Autista360 | Coperto da CC? | Evidenza |
|---|---|---|
| Sessioni attive autista | **SÌ completamente** | CC sinottica + `@autisti_sessione_attive` reader |
| Rifornimenti autista | **SÌ completamente** | CC tab Rifornimenti + dossier rifornimenti |
| Segnalazioni autista | **SÌ completamente** | CC Archivio Storico sub-tab Segnalazioni + `/next/autisti-inbox` |
| Controlli autista | **SÌ completamente** | CC + `/next/autisti-admin` (madre, vedi G1) |
| Cambi gomme autista | **SÌ completamente** | CC + writer `nextChiusuraEventoWriter` |
| Storia eventi operativi autista (inizio/cambio assetto) | **SÌ completamente** | `@storico_eventi_operativi` reader + cronologia mezzo |
| Profilo aggregato autista (Driver360 classico) | **SÌ tramite Chat IA** | `Driver360.tsx` in Chat IA NEXT (vedi cap. 7); il CC non offre una pagina "profilo autista" standalone |

Conclusione: **Centro di Controllo copre la maggioranza dei casi d'uso storici di Mezzo360 e Autista360**, lasciando un solo caso parziale (aggregato costi mezzo) e demandando il "profilo autista" alla Chat IA (Driver360).

**(c) Shared intenzionale (opzione α):**

- [src/components/AutistiEventoModal.tsx](src/components/AutistiEventoModal.tsx) — shared con madre, intoccabile (decisione `CLAUDE_CHAT_BEHAVIOR.md:64-65`). I wrapper NEXT (es. `NextHomeAutistiEventoModal`) sono autonomi.
- `@lavori` Firestore (strategia 3a): madre continua a scrivere, NEXT non legge come modulo. Decisione 2026-05-12/13.

---

<a id="cap-5"></a>
## 5. App autisti + AutistiAdmin — UI, flussi, proposta sostituzione NEXT

### 5.1 Audit UI/flussi `src/autistiInbox/` lato NEXT (autisti in box)

[src/autistiInbox/](src/autistiInbox/) contiene 14 file `.tsx` + 14 `.css`. Entry point principali:

- [AutistiInboxHome.tsx](src/autistiInbox/AutistiInboxHome.tsx) (32 KB) — home inbox autista, raggruppa eventi.
- [AutistiSegnalazioniAll.tsx](src/autistiInbox/AutistiSegnalazioniAll.tsx), [AutistiControlliAll.tsx](src/autistiInbox/AutistiControlliAll.tsx), [AutistiGommeAll.tsx](src/autistiInbox/AutistiGommeAll.tsx), [RichiestaAttrezzatureAll.tsx](src/autistiInbox/RichiestaAttrezzatureAll.tsx), [AutistiLogAccessiAll.tsx](src/autistiInbox/AutistiLogAccessiAll.tsx) — liste per tipologia.
- [CambioMezzoInbox.tsx](src/autistiInbox/CambioMezzoInbox.tsx) — flow cambio mezzo.

Wrapper NEXT in [src/next/autistiInbox/](src/next/autistiInbox/): `NextAutistiSegnalazioniAllNative.tsx`, `NextAutistiControlliAllNative.tsx`, `NextAutistiAdminNative.tsx` (~2700 righe — implementazione NEXT nativa autonoma!).

**Friction reali (autisti in box) — riferimento [AUDIT_COPERTURA_MODALI_2026-05-04.md](docs/product/AUDIT_COPERTURA_MODALI_2026-05-04.md):**
- Doppi handler "presa in carico" / "crea manutenzione" sparsi tra `AutistiAdmin.tsx` (madre) e `NextAutistiAdminNative.tsx` (NEXT). UX non identica fra le due viste.
- 11 storage keys condivise → ogni modifica struttura record va propagata in entrambi.
- Modale lightbox foto: VERIFICA NON ESEGUITA (audit statico).

### 5.2 Stato attuale di `AutistiAdmin.tsx` (madre, READ-ONLY)

[src/autistiInbox/AutistiAdmin.tsx](src/autistiInbox/AutistiAdmin.tsx) — ~3000+ righe (~140 KB).

**Funzionalità principali:**
- 6 tab: `rifornimenti`, `segnalazioni`, `controlli`, `gomme`, `attrezzature`, `storico_cambio` (`TabKey` riga 58-64).
- Date picker live con `nowTs` che si aggiorna ogni 30s (riga 162-167).
- Generazione PDF: `generateControlloPDFBlob`, `generateSegnalazionePDFBlob` da `pdfEngine.ts`.
- Preview PDF + WhatsApp share (`PdfPreviewModal`, `buildWhatsAppShareUrl`).
- `TargaPicker`, `loadHomeEvents`, `loadRimorchiStatus`.
- Firestore read/write diretti via `doc(db, ...)`, `getDoc`, `setDoc`, `deleteObject`, `ref`.

**Storage keys lette/scritte** (righe 29-39):
- `@autisti_sessione_attive`, `@mezzi_aziendali`, `@colleghi`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@rifornimenti` (dossier), `@segnalazioni_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@storico_eventi_operativi`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`.

**Dipendenze esterne:**
- `src/utils/storageSync` (`getItemSync`, `setItemSync`).
- `src/utils/pdfEngine` (generator).
- `src/utils/pdfPreview` (helper share).
- `src/utils/homeEvents` (loadHomeEvents, loadRimorchiStatus).
- `src/utils/targhe` (buildTargheList).
- `src/components/TargaPicker`, `src/components/PdfPreviewModal`.
- `src/utils/dateFormat` (formatDateUI, formatDateTimeUI — **NON usa `dateUnica.ts` NEXT**).

**Punti di interfacciamento col resto del sistema:**
- Storage keys condivise con NEXT → ogni scrittura della madre impatta i reader CC, manutenzioni, dossier, sinottica.
- Genera PDF via `pdfEngine.ts` motore condiviso → soggetto a stesso problema simboli strani (vedi cap. 6).
- Date format `dateFormat.ts` legacy, non `dateUnica.ts` → inconsistenza display fra madre e NEXT (decisione 2026-05-14 "date unificate").

### 5.3 Proposta sostituzione NEXT del segmento AutistiAdmin

> Non è una SPEC. È un'idea di percorso.

**Dove vivrebbe**: `src/next/autistiAdmin/` (cartella nuova, sotto il perimetro NEXT). **Esiste già** un punto di partenza in `src/next/autistiInbox/NextAutistiAdminNative.tsx` (~2700 righe) — usato come base per il sotto-flusso "crea manutenzione da segnalazione/controllo". Da promuovere a modulo autonomo `NextAutistiAdminPage.tsx` con sotto-componenti dedicati.

**Funzionalità da ricreare 1:1:**
- 6 tab (`rifornimenti`, `segnalazioni`, `controlli`, `gomme`, `attrezzature`, `storico_cambio`).
- Date picker live.
- TargaPicker (esistente).
- Generazione PDF con motore Unicode-safe (vedi cap. 6).
- Preview PDF + share.

**Funzionalità da ripensare:**
- Single page → router con sotto-rotte (es. `/next/autisti-admin/segnalazioni`) per deeplink condivisibili (pattern già adottato in Archivio Storico CC con `useArchivioUrlState`).
- Date display via `dateUnica.ts` (unificate).
- Writer NEXT esistenti (`markSegnalazioneChiusa`, `markControlloChiuso`, `createManutenzioneDaFareFrom*`, `markRichiestaAttrezzaturaEvasa`) invece di Firestore diretto.
- Soft-delete pattern (decisione 2026-05-09) coerente fra CC e nuovo autisti-admin.
- Eliminazione duplicazione UI con `/next/autisti-inbox`: distinguere chiaramente "vista admin" vs "vista autista".

**Dipendenze da risolvere prima:**
- Verifica writer NEXT completi per tutti i tab (rifornimenti CC ha già scope `RIFORNIMENTI_WRITE_SCOPE`; gomme via `nextChiusuraEventoWriter`; attrezzature ha `RICHIESTE_WRITE_SCOPE`).
- Modali shared (Opzione α `AutistiEventoModal.tsx`): mantenere wrapper NEXT, non duplicare.
- `loadHomeEvents`/`loadRimorchiStatus` da migrare o adattare a reader NEXT.

**Taglia complessiva e fasi:**

- Fase 1 (S) — Audit funzionale 1:1 di `AutistiAdmin.tsx`: lista chiusa dei flussi attivi (post-dismissione Lavori e post-2026-05-15 fix).
- Fase 2 (M) — Promozione `NextAutistiAdminNative.tsx` da componente interno a pagina autonoma `NextAutistiAdminPage`; introduzione sotto-rotte URL state.
- Fase 3 (M) — Migrazione PDF al motore Unicode-safe (vedi cap. 6).
- Fase 4 (M) — Migrazione date a `dateUnica.ts`.
- Fase 5 (L) — Switch route `/next/autisti-admin` → nuova pagina; rimozione mount madre.
- Fase 6 (S) — Cleanup `src/autistiInbox/AutistiAdmin.tsx` (decisione di Giuseppe: lasciare dormiente o cancellare).

**Stima complessiva**: **L**.

### 5.4 Friction autisti in box vs `AUDIT_COPERTURA_MODALI_2026-05-04.md`

Modali coperte parziali (sezione "Modali con campi operativi esclusi"):
- Note libere su segnalazioni TMP non leggibili dal motore (corretto by design Zero-Invenzioni).
- Foto: `fotoStoragePath`/`fotoUrl` non in allowedFields → la chat IA non può dire "esiste foto X" senza esplorazione (G4).

### 5.5 Migliorie ordinate per impatto/costo

**Lato autisti in box (NEXT esistente):**

| # | Miglioria | Impatto | Costo |
|---|---|---|---|
| 1 | Promuovere `NextAutistiAdminNative.tsx` a pagina autonoma con URL state e sostituire mount madre | alto | L |
| 2 | Unificare PDF a motore Unicode-safe | alto | S (fanout: M) |
| 3 | Date display via `dateUnica.ts` | medio | S |
| 4 | Distinzione UX `/next/autisti-admin` (admin) vs `/next/autisti-inbox` (autista) | medio | S |

**Lato AutistiAdmin madre (sostituzione):**

| # | Miglioria | Impatto | Costo |
|---|---|---|---|
| 1 | Scrivere SPEC NEXT autisti-admin (mappa 1:1) | alto | S |
| 2 | Fasi 1-2 dell'idea di percorso §5.3 | alto | M |
| 3 | Switch route definitivo (fase 5) | alto | L |

---

<a id="cap-6"></a>
## 6. PDF — diagnosi simboli strani (focus manutenzioni)

### 6.1 Motori PDF in uso lato NEXT

- **Motore principale condiviso (madre + NEXT)**: [src/utils/pdfEngine.ts](src/utils/pdfEngine.ts) — `import jsPDF from "jspdf"`; `import autoTable from "jspdf-autotable"`; `import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib"`. Espone `generateLavoroPDFBlob`, `generateSegnalazionePDFBlob`, `generateControlloPDFBlob`, `generateTablePDF`, `generateArchivioStoricoPDFBlob`, ecc.
- **Generator NEXT-specifici**:
  - [src/next/internal-ai/internalAiReportPdf.ts](src/next/internal-ai/internalAiReportPdf.ts) — `generateInternalAiReportPdfBlob`, sanitize filename NFD + rimozione diacritici.
  - [src/next/chat-ia/reports/chatIaReportPdf.ts](src/next/chat-ia/reports/chatIaReportPdf.ts) — import dinamico jsPDF, font `helvetica`, `splitTextToSize`.
- **Generator inline in pagine NEXT**:
  - [src/next/NextManutenzioniPage.tsx](src/next/NextManutenzioniPage.tsx) — **unico generator NEXT con sistema Unicode font Roboto via fetch runtime + fallback Helvetica** (vedi §6.2).
  - [src/next/NextEuromeccPage.tsx](src/next/NextEuromeccPage.tsx) — usa solo `helvetica` (~30 chiamate `setFont("helvetica", ...)`).
  - [src/next/NextCisternaPage.tsx](src/next/NextCisternaPage.tsx) — usa solo `helvetica`.

### 6.2 Gestione font / encoding / caratteri speciali

**Pattern Unicode in `NextManutenzioniPage.tsx` (riferimento):**

- Definizioni font Unicode ([NextManutenzioniPage.tsx:142-144](src/next/NextManutenzioniPage.tsx#L142-L144)):
  ```text
  PDF_UNICODE_FONT_URL = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf"
  PDF_UNICODE_FONT_FILE = "Roboto-Regular.ttf"
  PDF_UNICODE_FONT_FAMILY = "RobotoUnicode"
  ```
- Loader runtime: `getPdfUnicodeFontBase64()` ([NextManutenzioniPage.tsx:580-594](src/next/NextManutenzioniPage.tsx#L580-L594)) — fetch della TTF, encoding base64, cache in promise.
- Setup font: `ensurePdfUnicodeFont(doc)` ([NextManutenzioniPage.tsx:626-647](src/next/NextManutenzioniPage.tsx#L626-L647)) — chiama `doc.addFont(PDF_UNICODE_FONT_FILE, PDF_UNICODE_FONT_FAMILY, "normal")` per `normal` e `bold`; setta `__nextUnicodeFontReady = true`. **Fallback console.warn** "Font Unicode PDF non disponibile: fallback Helvetica" se fetch fallisce.
- Uso: prima di ogni renderer `await ensurePdfUnicodeFont(docWithTable)` e poi `doc.setFont(fontReady ? PDF_UNICODE_FONT_FAMILY : "helvetica", style)` ([NextManutenzioniPage.tsx:2238-2241](src/next/NextManutenzioniPage.tsx#L2238-L2241)).

**Tutti gli altri generator** (pdfEngine.ts, NextEuromeccPage, NextCisternaPage, internalAiReportPdf, chatIaReportPdf) usano **solo `setFont("helvetica", ...)`**. helvetica standard in jsPDF è **PostScript Standard Encoding** (Latin-1) e supporta solo caratteri ASCII e alcuni Latin-1 base — NON UTF-8 multibyte.

### 6.3 Causa probabile dei simboli strani

Mix di tre fattori:

1. **jsPDF helvetica standard** non supporta encoding UTF-8 nativo. Caratteri come `€` (U+20AC), `°` (U+00B0), lettere accentate `à/è/ì/ò/ù/é` possono renderizzare come glifi mancanti (rettangoli, punti interrogativi, `?`, o sequenze byte interpretate male). Il problema si manifesta sui PDF segnalazioni/controlli/Cisterna/Euromecc e su tutti i generator `pdfEngine.ts`.
2. **In `NextManutenzioniPage` il fetch del font Roboto da `fonts.gstatic.com`** può fallire (offline, blocco rete, latenza) → fallback Helvetica → stesso problema visibile sul Quadro PDF.
3. **Dati Firestore dinamici** (`descrizione`, `note`, `tipoProblema`, `segnalatoDa`, `fornitore`, `descrizioneSnippet`) provengono da input liberi che possono contenere `€`, accentate, simboli matematici. Esempio: campo `descrizione` di `@manutenzioni` (`AUDIT_COPERTURA_MODALI` riga 218).

VERIFICA NON ESEGUITA (audit statico): non posso confermare in che misura i singoli generator producano simboli strani — è un'ipotesi tecnica solida, non un dato runtime.

### 6.4 Stringhe a rischio (esempi reali nel codice)

- [src/next/NextManutenzioniPage.tsx:122](src/next/NextManutenzioniPage.tsx#L122) `addFont(...)` accetta nome con caratteri ASCII; rischio sui content row.
- Header tabelle PDF: stringhe italiane con accentate (es. "Manutenzioni risolte tramite eventi esterni" — non accentato, ma il PDF generato include label come "Officina", "Eseguito da", "Fornitore", "Importo €", "Numero riparazioni", "Note tecniche").
- Body righe: `descrizione`, `note`, `fornitore`, `marca`, `modello`, `chiHaEseguito` — tutti potenzialmente con `à/è/ì/ò/ù`.
- Footer: data formattata `formatGGMMYYYY_HHMM` (numeri + `/` + `:`, ASCII-safe).

### 6.5 Soluzioni note (ordinate per costo, NON applicate)

| # | Soluzione | Costo | Effetto |
|---|---|---|---|
| 1 | **Bundlare Roboto-Regular.ttf come asset locale** (`public/fonts/Roboto-Regular.ttf`) ed eliminare fetch CDN → rimuove rischio offline/blocco rete | S | Risolve fallback silente Helvetica in `NextManutenzioniPage`. Non risolve gli altri generator |
| 2 | **Estendere il pattern `ensurePdfUnicodeFont`** a `pdfEngine.ts` motore condiviso (helper unico `installUnicodeFontOnDoc(doc)`) e a tutti i generator NEXT-specifici (Cisterna, Euromecc, internalAiReportPdf, chatIaReportPdf) | S/M | Risolve simboli strani su TUTTI i PDF del progetto. Richiede testare retrocompatibilità rendering tabelle autoTable |
| 3 | **Sanitizer pre-render** (NFD + rimozione diacritici o sostituzione mirata `€→EUR`, `°→deg`) come workaround | S | Brutto, distrugge accentate, peggiora UX. Da evitare se non come ultima rete |
| 4 | **Sostituire jsPDF con pdfmake** (supporto Unicode nativo, font Roboto built-in) | L | Riscrittura quasi totale di tutti i generator. Sproporzionato rispetto al fix #2 |
| 5 | **Embed di font Unicode commerciali** (Open Sans, Source Sans, Inter) con licenza compatibile | S | Equivalente a #1/#2 per costo, differenza solo estetica |

**Strategia consigliata:** combinare **#1 + #2** (bundle asset + helper unificato). Taglia complessiva: **S-M**.

---

<a id="cap-7"></a>
## 7. Chat IA — è obsoleta dopo Centro di Controllo?

### 7.1 Stato reale Chat IA (codice + SPEC + audit)

**Spec di riferimento**: [docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md](docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md) (v1.0 BOZZA, ma applicata).

**Architettura attuale** (lettura statica):
- **Pipeline backend**: `internal-ai-adapter.js` → schema strict OpenAI `ChatZeroInvenzioniMessage` (campo `text` libero RIMOSSO) → `catalog-validator.js` → `universal-resolver.js` → `relation-resolver.js` → `query-engine.js` → `resolvedFilters.v2` → frontend.
- **Catalog validator** ([backend/internal-ai/server/lib/catalog-validator.js:1-200](backend/internal-ai/server/lib/catalog-validator.js#L1-L200)): enum chiusi `ACTION_ENUM`, `VIEW_ENUM` (Driver360/Vehicle360/Site360/Euromecc360/Ricerca360), `ENTITY_KIND_ENUM`, `PERIOD_PRESET_ENUM`, `CLARIFICATION_KIND_ENUM`, `ACCOMPANIMENT_KIND_ENUM`, `REPORT_TEMPLATE_ENUM`. `FORBIDDEN_FIELDS = {text, blocks, entities, sources, notices, summary, narrative, description, comment, explanation, reasoning}`. `UNSAFE_RESOLVED_FILTER_FIELD_NAMES` (32 pattern) blocca contatti, URL firmati, note libere.
- **resolvedFilters.v2** ([catalog-validator.js:414, 708-709](backend/internal-ai/server/lib/catalog-validator.js#L414)): validato con branch dedicato `validateResolvedFiltersV2`.
- **5 viste certificate**: [src/next/chat-ia/views/Driver360.tsx](src/next/chat-ia/views/Driver360.tsx), `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360` (`CertifiedView.tsx` config-driven per le ultime 4).
- **Reader interni** (i 59 tool del registry, declassati a reader): [src/next/chat-ia/tools/registry/](src/next/chat-ia/tools/registry/).
- **Fingerprint validator** declassato a guardrail di regressione (`lib/fingerprint-validator.js`).

### 7.2 Cosa è fatto / cosa manca

**Fatto (decisioni 2026-05-04, 2026-05-06 confermate da `STATO_MIGRAZIONE_NEXT.md:42-49`):**
- Fase A Zero-Invenzioni: schema strict riscritto, system prompt riscritto, fingerprint declassato, rendering testo libero rimosso.
- Blocchi 1-7 chiusi.
- **Blocco 8 CHIUSO con C6 PASS, Playwright 17-21 PASS 10/10** (audit indipendente del 2026-05-06).
- Chat IA NEXT V1 chiusa al 100% sulle 5 viste.
- Registro Collection Firestore v1.0 STABLE; SPEC Motore Generico v1.0 STABLE.

**Manca (per renderla operativa al 100%):** **nulla di bloccante**. Il PROMPT 54 cita "Blocco 8 fermo a CANCELLO 6 Playwright 2/10, root cause `catalog-validator.js` su `resolvedFilters.v2`" — questa descrizione è **OBSOLETA** (vedi cap. 1.1 punto 3). Lo stato corrente è "Chat IA V1 CHIUSA". Eventuali pannelli "Perché vedo questo dato?" su Driver360 sono migliorie non urgenti, non blocchi.

### 7.3 Confronto funzionale Chat IA ↔ Centro di Controllo

| Caso d'uso | Chat IA | Centro Controllo | Note |
|---|---|---|---|
| Apri dossier mezzo per targa esatta | **OK** via Vehicle360 con `resolvedFilters.v2` | **OK migliore** via Sinottica V2 → click su targa o Dossier mezzo | CC: 1 click; Chat: 1 frase + disambiguation |
| Apri profilo autista per nome (es. "Sandro") | **OK** via Driver360 con `disambiguation_request` | **PEGGIO** — no pagina "profilo autista" standalone; servono più view (sessioni attive + storico + rifornimenti) | Driver360 è il caso d'uso più forte della Chat IA |
| Lista segnalazioni aperte mese scorso | **OK** via Ricerca360 con `periodPreset:"last_30d"` | **OK migliore** via Archivio Storico CC con filtri data + tipo | CC: filtri persistenti URL state |
| Mezzi con revisione in scadenza | **PARZIALE** (intent non in catalog MVP) | **OK completo** via `/next/scadenze-collaudi` + alert home | CC vince |
| KPI flotta (manutenzioni urgenti, controlli KO oggi) | **PEGGIO** (no view aggregata dedicata) | **OK completo** Sinottica V2 + cards home | CC vince |
| Vista Euromecc per area/sub | **OK** via Euromecc360 | **OK** via `/next/euromecc` 5 tab | Parity |
| Chiudere una segnalazione | **NO** (Chat IA read-only) | **OK** via Archivio Storico CC | CC vince |
| Aggancio retroattivo segnalazione→manutenzione | **NO** | **OK** Archivio Storico CC con writer `agganciaSegnalazioneAManutenzioneEsistente` | CC vince |
| Hard-delete mezzo | **NO** | **OK** Sinottica V2 Shift+click foto + doppia conferma | CC vince |
| Ricerca conversazionale libera "trovami fatture per TI..." | **OK unico** via Ricerca360 con classificazione intent | **NO** (no input naturale) | **Chat IA unica** |
| Disambiguazione "Sandro" → 2 candidati | **OK unico** via disambiguation_request | **NO** (lista autisti statica) | **Chat IA unica** |
| Report PDF aggregato da template (`report_request`) | **OK** via template enum chiusi | **PARZIALE** (Quadro manutenzioni, Archivio PDF) | Parity con sfumature |

### 7.4 Valore residuo unico della Chat IA

Sì, esistono **due valori residui che il Centro Controllo non offre e non può offrire** con la sua architettura attuale:

1. **Ricerca conversazionale libera** — un singolo input naturale come "fatture Sciurba per TI113417 nel 2025" attiva NER deterministico + intent routing + view certificata. Il CC richiede navigazione strutturata (Dossier mezzo → Fatture → filtro fornitore + anno).
2. **Disambiguazione semantica** — query "Sandro" produce N candidati con id reali e displayLabel certificati. Il CC ha solo liste statiche o filtri esatti.

Inoltre, l'**asset infrastrutturale** della Chat IA (catalog validator + relation resolver deterministico + universal resolver + 38 collection boundary readonly + fingerprint validator) è un investimento Zero-Invenzioni difficilmente replicabile: dismetterlo significa buttare un livello di sicurezza dato.

### 7.5 RACCOMANDAZIONE NETTA

**CHAT IA HA VALORE RESIDUO → tenere operativa a perimetro chiuso.**

**Perimetro ridotto consigliato:**

- Mantenere le 5 viste certificate (Driver360, Vehicle360, Site360, Euromecc360, Ricerca360) e l'intero stack Zero-Invenzioni.
- **Non aggiungere nuove view** né nuove `action` al catalog intent senza richiesta esplicita di Giuseppe + evidenza d'uso.
- **Non reintrodurre testo narrativo LLM** in alcuna forma (preservare `FORBIDDEN_FIELDS` in `catalog-validator.js`).
- Manutenzione esclusivamente correttiva: bugfix, sicurezza, aggiornamento SDK OpenAI/runtime. **Niente nuove feature**.
- Test E2E mantenuti (Playwright 17-21 + diagnostics T1-T28). Niente nuovi test senza richiesta.
- Eliminare il "debito Chat IA Zero-Invenzioni" residuo se compare (es. ripulitura registry/boundary di entry deprecate).
- **NON spegnere** `/next/chat`: la presenza dell'input naturale è il valore residuo unico (§7.4).

**Passi minimi per chiuderla a v1.0 (se non già fatto):**

- VERIFICA NON ESEGUITA (audit statico): l'audit non può verificare lo stato esatto della V1.0 STABLE oltre a quanto `STATO_MIGRAZIONE_NEXT.md` riporta. La SPEC Chat Zero-Invenzioni risulta "BOZZA" ([SPEC_CHAT_ZERO_INVENZIONI_NEXT.md:9](docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md#L9)) ma la decisione 2026-05-04 e l'audit indipendente di chiusura V1 2026-05-06 confermano l'implementazione effettiva. Eventuale gap = solo promozione formale del documento SPEC da BOZZA a STABLE.

### 7.6 Nota finale cap. 7

Questa raccomandazione è **dell'audit**, **non vincolante**. La decisione finale resta a Giuseppe.

---

<a id="cap-8"></a>
## 8. Piano d'urgenza — unica lista numerata

> Ordinata per urgenza reale (non per area). Esclude le 3 questioni già tracciate (7 segnalazioni storiche, D2 punto ingresso `chiusa_da_evento`, T3 link cliccabile).

### 8.1 Voci urgenti

| # | Titolo | Superficie | Taglia | Dipendenze | Motivo dell'ordine |
|---|---|---|---|---|---|
| 1 | **PDF Unicode font generalizzato** (bundle Roboto locale + helper unico in `pdfEngine.ts` propagato a tutti i generator) | PDF (cap. 6) | S-M | nessuna | Sintomo immediato per l'utente: simboli strani su manutenzioni / segnalazioni / controlli / Euromecc / Cisterna. Costo basso, impatto alto, fix una-tantum |
| 2 | **Aggregator badge "ASSE X da verificare" gomme Sinottica V2** ([NextCentroControlloSinottica.tsx:760](src/next/components/NextCentroControlloSinottica.tsx#L760), hardcoded `null`) | Centro Controllo (cap. 4) | S | reader `nextManutenzioniDomain.ts:73-76` (già espone i campi) | Badge dichiarato nel tipo ma mai popolato — utente si aspetta info che non vede. Audit-only del 2026-05-11 |
| 3 | **Cisterna: completare scope NEXT + collection in registro** (decisione 2026-05-04 punto 2, aperta da 12gg) | Cisterna + Firestore (cap. 4 G2/G7/G8) | M | aggiornare [REGISTRO_COLLECTION_FIRESTORE.md](docs/product/REGISTRO_COLLECTION_FIRESTORE.md) + boundary readonly | Decisione di prodotto già presa, non implementata. Blocca motore generico v1 per Cisterna |
| 4 | **Root collection documentali nel registro** (`@documenti_mezzi/magazzino/generici`, decisione 2026-05-04 punto 1) | Firestore (cap. 4 G3) | M | come #3 | Chat IA non può leggere documenti reali; rischio incoerenza letture |
| 5 | **Whitelist categorie mezzo unificata** (Sinottica V2 vs nextCentroControlloDomain — decisione 2026-05-11 memo) | Centro Controllo | S | [nextCentroControlloDomain.ts:47-61](src/next/domain/nextCentroControlloDomain.ts#L47-L61) `classifyMezzoCategoria` già esiste ma non importata in Sinottica | Rischio mezzo classificato motrice in Home e rimorchio in Sinottica per categorie atipiche |
| 6 | **`patchSegnalazione` imposta `stato` sempre, non solo se già presente** ([nextManutenzioneDaFareCreateWriter.ts:161-163](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L161-L163)) | Flusso segnalazione (cap. 2) | S | nessuna | Bug latente: record nati senza stato non ricevono `presa_in_carico` |
| 7 | **Record `daFare` nascano con `data:null` e senza `dataInserimento`/`createdAt`** (D5 audit ciclo) | Flusso manutenzione (cap. 2) | S | [nextManutenzioneDaFareCreateWriter.ts:105-139](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L105-L139) | Ordinamento/filtri per data si appoggiano a campo `null`. Trivial fix |
| 8 | **Soft-delete legacy: 3 segnalazioni con `chiusa:true` e `stato:"presa_in_carico"`** (desync canonical) | Flusso segnalazione (cap. 2) | M | reader deve normalizzare entrambi i campi | UX presenta segnalazioni "eternamente aperte" |
| 9 | **Foto storage path in allowedFields** (`fotoStoragePath`, `photoStoragePath`, `storagePath`) — decisione 2026-05-04 punto 4 | Firestore (cap. 4 G4) | S | aggiornare registro | Pannello "Perché vedo questo dato?" non può dire "esiste foto X" |
| 10 | **Hotspot coordinate `x/y/areaId/uploadedAt` in allowedFields** (decisione 2026-05-04 punto 7) | Firestore (cap. 4 G5) | S | come #9 | Editor hotspot non spiegabile dal motore generico |
| 11 | **`chat_ia_reports` formalizzato come "escluso by design"** nel registro (decisione 2026-05-04 punto 3) | Firestore (cap. 4 G6) | S | come #9 | Coerenza documentale; il codice già scrive |
| 12 | **Hard-delete mezzo: fallback cascade per `mezzoId`** (audit 2026-05-11) | Centro Controllo | S | [nextMezzoHardDeleteWriter.ts](src/next/nextMezzoHardDeleteWriter.ts) | Rischio futuro contenuto; record con solo `mezzoId` (no targa) sopravvivono a cancellazione |
| 13 | **Sostituzione NEXT di AutistiAdmin** (G1, vedi §5.3) — strategica | App autisti (cap. 5) | **L** | tutto §5.3 | Madre destinata a dismettersi. Investimento grosso, fa parte della roadmap, non bloccante oggi |

### 8.2 Migliorie non urgenti

| # | Titolo | Superficie | Taglia | Note |
|---|---|---|---|---|
| 14 | **Rinomina cosmetica** `NextCentroControlloPage.tsx` → `NextHomePage.tsx` (file è effettivamente la home `/next`, non il Centro Controllo) | Centro Controllo (cap. 1.3) | S | Migliora leggibilità repo; nessun impatto runtime |
| 15 | **Unificazione legame** `linkedLavoroId` ↔ `origineRefId` via cicloLegame.ts già esistente | Flusso segnalazione (cap. 2) | M | Refactor strutturale; non bloccante |
| 16 | **Normalizzazione stato manutenzione** (55/73 con `stato:"(vuoto)"`) | Manutenzioni (cap. 2) | M/L | Migration o etichetta display "stato non definito" |
| 17 | **Pannello "Perché vedo questo dato?" su Driver360** — feature SPEC Chat Zero-Invenzioni dichiarata ma VERIFICA NON ESEGUITA in UI | Chat IA (cap. 7) | M | Solo se si decide di estendere Chat IA |
| 18 | **Euromecc: legame esplicito done→pending** via `closedPendingId` | Euromecc (cap. 3) | S | Rimuove ambiguità "quale pending è stata chiusa" |
| 19 | **Euromecc: sync counters relazione on-demand** | Euromecc (cap. 3) | M | Evita info stale dopo cancellazione done/pending |
| 20 | **Sync `dateFormat.ts` (madre) → `dateUnica.ts` (NEXT)** quando si farà la sostituzione AutistiAdmin | App autisti (cap. 5) | S | Dipendente da #13 |
| 21 | **Audit UX dei 5 tab Euromecc** (legenda, distinzione `tab` vs `DataManagerTabKey`) | Euromecc (cap. 3) | S | UX |

---

<a id="cap-9"></a>
## 9. Osservazioni trasversali

> Max 8 voci. Pattern ricorrenti, rischi sistemici, debiti tecnici evidenti — niente prescrizioni esecutive.

1. **Sintassi di stato sedimentata in modo organico**: stati `daFare`/`programmata`/`eseguita`/`chiusa_da_evento`/`(vuoto)` su `@manutenzioni`; `aperta`/`importata`/`chiusa`/`nuova`/`presa_in_carico` su segnalazioni; `aperto`/`importato`/`chiusa` su controlli; `chiusa` (segnalazioni) vs `chiuso` (controlli) come booleani paralleli. Ogni reader/writer normalizza in modo locale. Rischio: divergenze di display tra superfici.

2. **Doppia convenzione di legame `linkedLavoroId` ↔ `origineRefId/Key/Tipo`** preservata per decisione J.7 (nome invariato). L'helper `cicloLegame.ts` unifica via `readLegameLavoro`/`writeLegameLavoro`/`readLegameOrigine`/`writeLegameOrigine` ma le due convenzioni vivono ancora come "verità duplicata" sui record. Pattern lavora, ma è fragile.

3. **`cloneWriteBarrier.ts` si è gonfiato a 15+ scope ognuno con i suoi path autorizzati** (~985 righe). Pattern di sicurezza solido (la barriera è il punto critico per la decisione "madre dismettibile") ma debito di leggibilità crescente. Ogni nuovo modulo NEXT scrivente aggiunge un proprio scope + costanti.

4. **Pattern propagazione campi soft-delete** (memo critico decisione 2026-05-11): ogni nuovo campo del tipo reader (`NextAutistiXxxSectionItem`) deve essere propagato esplicitamente sia nel tipo parity Row sia nella funzione mapper. Bug PROMPT 27.10/27.11 ne fu vittima. Il pattern è ricorrente e non automatizzabile da TypeScript (i mapper sono manuali).

5. **`NextCentroControlloPage.tsx` (~27k righe + nome fuorviante)** suggerisce che la "torre di controllo" sia cresciuta troppo in un singolo file e con responsabilità sovrapposte (home NEXT + sinottica + alerts + sessioni). Indicatore di un possibile refactor di estrazione.

6. **PDF in tre dialetti**: helvetica-only (pdfEngine.ts condiviso, Cisterna, Euromecc, internalAiReport, chatIaReport), Unicode-via-fetch (NextManutenzioniPage), import dinamico jsPDF (chatIaReportPdf). Tre approcci coesistenti, debito di propagazione del fix Unicode.

7. **Stato di salute documentale alto ma file lunghi**: `DIARIO_DECISIONI.md` (31k token), `STATO_MIGRAZIONE_NEXT.md` (63k token), `STATO_ATTUALE_PROGETTO.md` (521 KB). Eccellente tracciabilità storica ma indicizzazione mentale rallentata; helper agenti devono leggere a chunks. Anomalia documentazione: il PROMPT 54 cita file `01..08_AUDIT_*.md` che non esistono (vedi cap. 1.1) — segno che la nomenclatura citata in PROMPT non si è mai materializzata.

8. **Decisioni 2026-05-04 "post-audit copertura modali" parzialmente aperte** (7 punti deliberati, 3-4 ancora da implementare 12 giorni dopo). Riferimento `DIARIO_DECISIONI.md:177-241`. La presa di decisione è veloce e tracciata, l'esecuzione segue con un lag fisiologico; il piano d'urgenza (cap. 8) ne assorbe alcune (#3, #4, #9, #10, #11).

---

**Fine audit.**
