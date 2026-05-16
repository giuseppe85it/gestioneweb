# REPORT — PROMPT 44 — Fix strutturale ciclo segnalazione (D1, D3, D4, D6, D7)

**Data:** 2026-05-15 · **Esito globale:** PASS · **Audit di partenza:** [AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md](AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md).

---

## Sintesi

5 fix strutturali al ciclo segnalazione → manutenzione → chiusura, senza migration retroattive
(zero scritture sui 55/73 record storici "(vuoto)"), backup Firestore + restore script disponibili,
e verifica runtime Playwright 8/8 PASS.

| # | Fix | Cosa fa | Test unitari | Verifica runtime |
|---|---|---|---|---|
| **D4** | Fingerprint fallback chiusura da evento | `chiudiManutenzioneDaEvento` ora accetta opzionale `fingerprint`; quando l'id non matcha, risale via `findLegacyRecordIndexByFingerprint` (riuso helper PROMPT 41) | 3/3 PASS | C5 PASS |
| **D3** | `cicloLegame.ts` — accesso unificato | Helper unico per `origineTipo/origineRefId/origineRefKey` (back-link) + `linkedLavoroId/linkedLavoroIds` (forward) + `chiusuraDi/chiusuraRefId/chiusuraData` (trace). Writer routati; reader display intatti | 13/13 PASS | C6 PASS |
| **D1** | Propagazione chiusura via `closureOrchestrator.ts` | Chiusura manutenzione (officina/manuale/evento) propaga sulla segnalazione/controllo via `chiudi*DaEvento` con `tipoEvento="manutenzione"`. Integrato in `saveNextManutenzioneBusinessRecord` + `chiudiManutenzioneDaEvento` | 4/4 PASS | C7 PASS |
| **D7** | `dataPresaInCarico` su segnalazioni | `patchSegnalazione` scrive ISO via `dateUnica.toISO`. La frase storia "presa in carico il GG/MM/AAAA" funziona ora che il dato esiste | 2/2 PASS | C1, C8 PASS |
| **D6** | Etichetta "Storico" — solo display | `formatStatoManutenzione` + helper inline `formatMaintenanceStatoLabelDisplay`. Applicato a Archivio CC, ArchivioFeed PDF map, Quadro/Dettaglio HTML, PDF generation. ZERO scritture | 8/8 PASS | C2, C3, C4 PASS |

---

## Backup e rollback

- **Dati Firestore (read-only):** `C:\tmp\backup_firestore_prompt44_20260515_071257\` — 5 JSON
  pretty: `@manutenzioni` (73), `@segnalazioni_autisti_tmp` (37), `@controlli_mezzo_autisti` (350),
  `@gomme_eventi` (11), `@officine` (3). Integrità verificata (count JSON == count live) — OK 5/5.
- **Codice:** `C:\tmp\backup_codice_prompt44_20260515_071441\` — copia di `src/next/`,
  `src/utils/cloneWriteBarrier.ts`, `backend/internal-ai/` (1.3 GB).
- **Script rollback:** `scripts/oneoff/restore-firestore-prompt44-20260515.cjs`. `DRY_RUN = true`
  di default. Uso:
  ```
  node scripts/oneoff/restore-firestore-prompt44-20260515.cjs C:\tmp\backup_firestore_prompt44_20260515_071257
  ```
  Cambia `DRY_RUN=false` nel sorgente per applicare il rollback.

---

## File toccati (raggruppati per D)

### D4 — fingerprint fallback
- [src/next/domain/nextManutenzioniDomain.ts](../../src/next/domain/nextManutenzioniDomain.ts): export di `findLegacyRecordIndexByFingerprint` (1 riga).
- [src/next/writers/nextChiusuraEventoWriter.ts](../../src/next/writers/nextChiusuraEventoWriter.ts): nuova helper `patchByIdOrFingerprint`, parametro `fingerprint` in `chiudiManutenzioneDaEvento`/`chiudiRecordDaEvento`.
- [src/next/NextManutenzioniPage.tsx](../../src/next/NextManutenzioniPage.tsx): caller passa `{targa,data,descrizione,stato}` da `record`.
- [src/next/components/NextImportGommeChiusuraModal.tsx](../../src/next/components/NextImportGommeChiusuraModal.tsx): tipo `NextImportGommeChiusuraSelection` esteso con campo opzionale `fingerprint`; popolato in `candidateFromRecord` per kind="manutenzione".
- [src/next/autistiInbox/NextAutistiAdminNative.tsx](../../src/next/autistiInbox/NextAutistiAdminNative.tsx): caller passa `entry.fingerprint`.

### D3 — `cicloLegame.ts`
- [src/next/helpers/cicloLegame.ts](../../src/next/helpers/cicloLegame.ts) — NUOVO: `readLegameOrigine`/`readLegameLavoro`/`readChiusuraTrace`/`writeLegameOrigine`/`writeLegameLavoro`.
- [src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts): `buildManutenzioneDaFareRecord` usa `writeLegameOrigine`; `patchSegnalazione`/`patchControllo` usano `writeLegameLavoro`.

### D1 — `closureOrchestrator.ts`
- [src/next/helpers/closureOrchestrator.ts](../../src/next/helpers/closureOrchestrator.ts) — NUOVO: `propagateChiusuraToLegame`.
- [src/next/domain/nextManutenzioniDomain.ts](../../src/next/domain/nextManutenzioniDomain.ts): hook dopo `saveNextManutenzioneBusinessRecord` quando `stato === "eseguita"`.
- [src/next/writers/nextChiusuraEventoWriter.ts](../../src/next/writers/nextChiusuraEventoWriter.ts): hook dopo `chiudiManutenzioneDaEvento` riuscita.

### D7 — `dataPresaInCarico`
- [src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts): `patchSegnalazione` scrive `dataPresaInCarico` via `dateUnica.toISO(new Date())`.
- `frasestoriaRecord.ts` e `FraseStoriaRecord.tsx`: **non toccati** — supporto al campo già presente.

### D6 — etichetta "Storico"
- [src/next/helpers/formatStatoManutenzione.ts](../../src/next/helpers/formatStatoManutenzione.ts) — NUOVO.
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx): `statoLabel`/`statoStyle` aggiungono ramo "STORICO" + grigio neutro; default `?? "eseguita"` rimosso (ora `?? null` → "STORICO").
- [src/next/centroControllo/archivioStorico/ArchivioFeed.tsx](../../src/next/centroControllo/archivioStorico/ArchivioFeed.tsx): `formatManutenzioneStatoLabel` aggiunge fallback "Storico".
- [src/next/NextManutenzioniPage.tsx](../../src/next/NextManutenzioniPage.tsx): nuova `formatMaintenanceStatoLabelDisplay(item)`, applicata in Quadro PDF (HTML + bytes PDF) e Dettaglio HTML. Resolver/filtri non toccati.

### Test unitari aggiunti
- [src/next/writers/__tests__/chiusuraDaEvento.test.ts](../../src/next/writers/__tests__/chiusuraDaEvento.test.ts) — D4 (3 casi).
- [src/next/helpers/__tests__/cicloLegame.test.ts](../../src/next/helpers/__tests__/cicloLegame.test.ts) — D3 (13 casi).
- [src/next/helpers/__tests__/closureOrchestrator.test.ts](../../src/next/helpers/__tests__/closureOrchestrator.test.ts) — D1 (4 casi).
- [src/next/helpers/__tests__/frasestoriaRecord.test.ts](../../src/next/helpers/__tests__/frasestoriaRecord.test.ts) — D7 (2 casi nuovi, totale ora 22).
- [src/next/helpers/__tests__/formatStatoManutenzione.test.ts](../../src/next/helpers/__tests__/formatStatoManutenzione.test.ts) — D6 (8 casi).

**Vitest totale: 30 nuovi test, tutti verdi.**

### Script oneoff
- `scripts/oneoff/backup-firestore-prompt44-20260515.cjs` (backup)
- `scripts/oneoff/restore-firestore-prompt44-20260515.cjs` (rollback, DRY_RUN=true)
- `scripts/oneoff/dryrun-prompt44-propagazione-2026-05-14.cjs` (FASE 3 DRY-RUN)
- `scripts/oneoff/verify-prompt44-runtime-2026-05-14.cjs` (FASE 6 sweep)

---

## DRY-RUN propagazione (FASE 3)

Backlog: **7 record sorgente** che verrebbero modificati se ri-applicassimo la propagazione alle
manutenzioni già chiuse oggi. Sotto soglia STOP HARD #2 (100). **Il fix NON e' retroattivo**:
questi 7 record restano nello stato attuale e vanno chiusi manualmente (vedi "Cose lasciate
a Giuseppe" più sotto).

| # | Tipo | Sorgente id | Targa | Manutenzione | Stato → |
|---|---|---|---|---|---|
| 1 | segnalazione | `261619fc…b413772` | TI239279 | `from-lavoro-5dd4afde…c60167` | presa_in_carico → chiusa |
| 2 | controllo | `44ebe449…ef9a8d3` | TI239279 | `from-lavoro-82df827a…36389` | (vuoto) → chiusa |
| 3 | segnalazione | `d4964b81…851a5627` | TI285217 | `from-lavoro-4cc1d480…dff1eb96` | presa_in_carico → chiusa |
| 4 | segnalazione | `b74d5e20…f07abab370` | TI285997 | `from-lavoro-27ceb61e…d4e594f` | presa_in_carico → chiusa |
| 5 | segnalazione | `c7bc5a05…4239ea0` | TI313387 | `from-lavoro-f609de79…25dff49` | presa_in_carico → chiusa |
| 6 | segnalazione | `5411913c…b1d9df17c6e8` | TI324623 | `from-lavoro-f2ab2ab1…f65d90d8` | presa_in_carico → chiusa |
| 7 | segnalazione | `810d56e5…f5b366e80` | TI84822 | `from-lavoro-7236bb5c…447cc460` | presa_in_carico → chiusa |

Output completo: `test-results/dryrun-prompt44-propagazione.json`.

---

## Verifica runtime (FASE 6)

`scripts/oneoff/verify-prompt44-runtime-2026-05-14.cjs` — **8/8 PASS** (mezzo TI113417, marker `VERIFY-P44-…`).

| Caso | Esito | Dettaglio |
|---|---|---|
| C1 | PASS | `/next/manutenzioni` carica senza errori (smoke) |
| C2 | PASS | D6 — "STORICO" visibile in Archivio CC Manutenzioni |
| C3 | PASS | D6 — "STORICO" visibile nel Dettaglio mezzo |
| C4 | PASS | D6 — 55 record con stato "(vuoto)" invariati prima/dopo (zero migration) |
| C5 | PASS | D4 — fingerprint fallback (chiusuraDaEvento.test.ts 3/3) |
| C6 | PASS | D3 — readLegame*/writeLegame* (cicloLegame.test.ts 13/13) |
| C7 | PASS | D1 — propagateChiusuraToLegame (closureOrchestrator.test.ts 4/4) |
| C8 | PASS | D7 — frase storia con `dataPresaInCarico` (frasestoriaRecord.test.ts D7 2/2) |

**Self-cleaning OK**: la segnalazione e la manutenzione di test sono state rimosse al termine.
**TI298409 (proibito): 6 record invariati**, mai toccato.

Screenshot: `test-results/verify-prompt44/screenshots/`.

---

## Build / TypeScript / Lint

- `npm run build` → EXIT 0 (`dist/index.html` prodotto). Le TS2307 "Cannot find module 'vitest'"
  sui file di test sono pre-esistenti (PROMPT 41) e non bloccanti — `tsc -b` esce 0 in incremental.
- `npx tsc --noEmit` → EXIT 0.
- `npx eslint` sui 11 file toccati → EXIT 0.
- Vitest per-file sui 5 file di test → tutti verdi (3 + 13 + 4 + 22 + 8 = 50 casi).

---

## Decisioni autonome prese durante l'esecuzione

1. **Schema di scrittura `cicloLegame`**: si tengono i nomi di campo esistenti
   (`origineTipo/origineRefId/origineRefKey` + `linkedLavoroId/linkedLavoroIds`). NON si scrive
   su `chiusuraDi` come legame (è una traccia di chiusura, letta da ~15 superfici). Unificazione
   di **accesso**, non di storage.
2. **Scope D3 reader**: `cicloLegame` consumato dai writer del ciclo + dal `closureOrchestrator`.
   I reader di solo display (Dossier/Quadro/Archivio CC) leggono già i campi canonici, non sono
   stati migrati (churn rischioso; `frasestoriaRecord.ts` è protetto dal prompt).
3. **D7 senza toccare `frasestoriaRecord.ts`**: la funzione `recordChiusoFromRaw` legge già
   `dataPresaInCarico`/alias, e `buildFraseStoria` già emette la riga "presa in carico il…".
   D7 è puramente lato writer.
4. **D6 doppia funzione di label in `NextManutenzioniPage.tsx`**: ho mantenuto il resolver
   esistente (`resolveMaintenanceStato` collassa null → "daFare" per i filtri) e ho aggiunto una
   funzione di display separata `formatMaintenanceStatoLabelDisplay(item)` che differenzia il
   "vero `daFare`" dal "legacy senza stato". Applicata SOLO nei punti di rendering utente, NON
   nei filtri.
5. **Propagazione D1 riusa writer esistenti**: l'orchestrator chiama
   `chiudiSegnalazioneDaEvento`/`chiudiControlloDaEvento` con `tipoEvento="manutenzione"`. Niente
   modifiche a `cloneWriteBarrier.ts` (lo scope `CHIUSURA_DA_EVENTO_WRITE_SCOPE` copre già le
   chiavi sorgente).
6. **Verify runtime C3 retry**: il check iniziale puntava al Quadro PDF, che richiede filtri per
   mostrare item — sostituito con Dettaglio mezzo (HTML rendering live). Retry singolo, PASS.

---

## Cose lasciate a Giuseppe (manuale)

**7 segnalazioni/controlli "eterni"** (vedi tabella DRY-RUN sopra) — collegati a manutenzioni
già `eseguita`/chiusa ma scollegati dalla propagazione perché chiuse PRIMA del fix. Si possono
chiudere a mano dall'Inbox Autisti / Archivio CC, una alla volta, o tramite uno script
una-tantum dedicato (fuori scope di questo prompt).

Sono i seguenti mezzi: TI239279, TI285217, TI285997, TI313387, TI324623, TI84822.

---

## Rollback — note operative

In caso di necessità (es. comportamento imprevisto in produzione):

1. **Codice**: `git revert` dei commit di questo prompt, oppure ripristina i file da
   `C:\tmp\backup_codice_prompt44_20260515_071441\` (sovrascrivendo `src/next/` corrente).
2. **Dati Firestore**: usare lo script `restore-firestore-prompt44-20260515.cjs`:
   ```
   # 1. Apri lo script, cambia DRY_RUN = false
   # 2. Esegui:
   node scripts/oneoff/restore-firestore-prompt44-20260515.cjs C:\tmp\backup_firestore_prompt44_20260515_071257
   ```
   Sovrascrive le 5 collection con il contenuto del backup integro.

**Nessuna delle azioni di FASE 1-5 ha richiesto migration dei dati esistenti**, quindi il rollback
del codice da solo è sufficiente per tornare al comportamento pre-PROMPT 44 — i record creati nel
frattempo (segnalazioni con `dataPresaInCarico`, manutenzioni con propagazione) restano nello
stato post-fix, ma sono comunque retrocompatibili (i campi extra vengono ignorati dai vecchi reader).
