# AUDIT pre-commit working tree (2026-05-15) — PROMPT 53 FASE 1

## Stato

`git status --porcelain` totale: **174 voci** = 87 modificati `M` + 87 nuovi `??`.

Tre categorie per ogni file:

| Categoria | Conteggio | Descrizione |
|-----------|-----------|-------------|
| **A — TIENI** | **121** (87 M + 34 ?? code/test/docs finali) | da committare normalmente |
| **B — CANCELLA SICURO** | **44** | spazzatura: screenshots, test-results, scan/mapping intermedi, script one-shot completati, dump JSON di sessione |
| **C — DECIDI CON GIUSEPPE** | **9** | config Claude, script riutilizzabili, audit borderline |

**Stima spazio liberato applicando categoria B**: ~177 MB
- `test-results/`: 132 MB (output Playwright + log backend)
- `docs/_live/screenshots-*/`: ~45 MB (10 directory)

---

## CATEGORIA A — TIENI (121 file)

### Codice runtime modificato (M, 87 file)
Tutti i `src/next/**/*.{ts,tsx,css}` + `src/utils/cloneWriteBarrier.ts` + `backend/**`: sono le modifiche PROMPT 39-52 da committare.

### Doc + config modificati (M)
- `AGENTS.md`, `CONTEXT_CLAUDE.md`, `METODO_AGENTI.md`
- `docs/DIARIO_DECISIONI.md`
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md`, `docs/_live/STATO_MIGRAZIONE_NEXT.md`

### Codice nuovo (??)
- `src/next/components/FraseStoriaRecord.tsx`
- `src/next/components/NextAgganciaLegameModal.tsx`
- `src/next/components/NextMergeManutenzioneModal.tsx`
- `src/next/components/OfficinaAutocomplete.tsx`
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowFormatters.ts`
- `src/next/helpers/cicloLegame.ts`
- `src/next/helpers/closureOrchestrator.ts`
- `src/next/helpers/formatStatoManutenzione.ts`
- `src/next/helpers/frasestoriaRecord.ts`
- `src/next/helpers/manutenzioniCandidatiMerge.ts`
- `src/next/helpers/manutenzioniPerAggancio.ts`
- `src/next/helpers/useSorgenteManutenzione.ts`
- `src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts`
- `src/next/writers/presaInCaricoSegnalazioneWriter.ts`
- `src/next/writers/sganciaLegameOrfanoWriter.ts`

### Test nuovi (??)
- `src/next/helpers/__tests__/cicloLegame.test.ts`
- `src/next/helpers/__tests__/closureOrchestrator.test.ts`
- `src/next/helpers/__tests__/formatStatoManutenzione.test.ts`
- `src/next/helpers/__tests__/frasestoriaRecord.test.ts`
- `src/next/helpers/__tests__/manutenzioniCandidatiMerge.test.ts`
- `src/next/helpers/__tests__/manutenzioniPerAggancio.test.ts`
- `src/next/domain/__tests__/` (dir)
- `src/next/writers/__tests__/` (dir)

### Doc/report finali (??)
- `docs/_live/AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md`
- `docs/_live/REPORT_DATE_UNIFICATE_2026-05-14.md`
- `docs/_live/REPORT_ELIMINA_QUADRO_OFFICINE_2026-05-14.md`
- `docs/_live/REPORT_FIX_MODIFICA_MANUTENZIONE_2026-05-14.md`
- `docs/_live/REPORT_PROMPT44_CICLO_FIX_2026-05-14.md`
- `docs/_live/REPORT_PROMPT45_2026-05-15.md`
- `docs/_live/REPORT_PROMPT47_2026-05-15.md`
- `docs/_live/REPORT_PROMPT48_BARRIERA_FIX_2026-05-15.md`
- `docs/_live/REPORT_PROMPT49_FRASE_POST_AGGANCIO_2026-05-15.md`
- `docs/_live/REPORT_PROMPT50_TIMESTAMP_FIX_2026-05-15.md`
- `docs/_live/REPORT_PROMPT51_CLEANUP_LIVE_2026-05-15.md`
- `docs/_live/REPORT_PROMPT52_FRASE_VISTA_SEGNALAZIONE_2026-05-15.md`
- `docs/_live/REPORT_STORIA_UNIFICATA_2026-05-14.md`
- `docs/_live/AUDIT_PRECOMMIT_2026-05-15.md` (questo file)

---

## CATEGORIA B — CANCELLA SICURO (44 voci)

### Screenshots di debug sessioni — ~45 MB (10 dir)
Output Playwright di sessioni di sviluppo. Coperti dai REPORT corrispondenti, ridondanti per il repo.

- `docs/_live/screenshots-audit-ciclo-2026-05-14/` (8.3M)
- `docs/_live/screenshots-audit-ti298409-2026-05-15/` (900K, vuoto in pratica)
- `docs/_live/screenshots-date-2026-05-14/` (3.1M)
- `docs/_live/screenshots-elimina-officina-2026-05-14/` (5.7M)
- `docs/_live/screenshots-modifica-manutenzione-2026-05-14/` (3.4M)
- `docs/_live/screenshots-officina-dropdown-2026-05-14/` (704K)
- `docs/_live/screenshots-prompt45-2026-05-15/` (3.0M)
- `docs/_live/screenshots-prompt47-2026-05-15/` (2.5M)
- `docs/_live/screenshots-prompt52-2026-05-15/` (5.6M)
- `docs/_live/screenshots-storia-2026-05-14/` (12M)

### test-results/ — 132 MB
Output Playwright + backend log + JSON dump intermedi. Tipicamente gitignorato in qualsiasi repo serio.

- `test-results/` (intera dir, incluse subdir di tutti i verify/sweep e backend-nodemon.log 7.4M)

### Scan/Mapping/Diagnosi intermedi — superati da REPORT
- `docs/_live/SCAN_DATE_TOTALE_2026-05-14.md` → coperto da `REPORT_DATE_UNIFICATE_2026-05-14.md`
- `docs/_live/SCAN_ISO_RESIDUI_2026-05-14.md` → coperto da `REPORT_DATE_UNIFICATE_2026-05-14.md`
- `docs/_live/MAPPING_FRASE_STORIA_RUNTIME_2026-05-14.md` → coperto da `REPORT_STORIA_UNIFICATA_2026-05-14.md`
- `docs/_live/DIAGNOSI_MODIFICA_MANUTENZIONE_2026-05-14.md` → coperto da `REPORT_FIX_MODIFICA_MANUTENZIONE_2026-05-14.md`

### Script verify/sweep/inspect one-shot completati (14 script)
Eseguiti una tantum, esito documentato nel REPORT relativo. Pattern ricostruibile in pochi minuti se serve di nuovo.

- `scripts/oneoff/verify-elimina-officina-2026-05-14.cjs` (P42)
- `scripts/oneoff/verify-modifica-manutenzione-2026-05-14.cjs` (P41)
- `scripts/oneoff/verify-officina-dropdown-2026-05-14.cjs` (P43)
- `scripts/oneoff/verify-prompt44-runtime-2026-05-14.cjs` (P44)
- `scripts/oneoff/verify-prompt45-runtime-2026-05-15.cjs` (P45)
- `scripts/oneoff/verify-prompt47-runtime-2026-05-15.cjs` (P47)
- `scripts/oneoff/sweep-date-runtime-2026-05-14.cjs` (P39)
- `scripts/oneoff/sweep-storia-runtime-2026-05-14.cjs` (P40)
- `scripts/oneoff/dryrun-prompt44-propagazione-2026-05-14.cjs` (P44 una-tantum)
- `scripts/oneoff/audit-ciclo-segnalazione-2026-05-14.cjs` (P43, audit chiuso)
- `scripts/oneoff/audit-ti298409-2026-05-15.cjs` (P45 audit con errore, sostituito da P46)
- `scripts/oneoff/cleanup-timestamps-aggancio-2026-05-15.cjs` (P50 DRY su backup, sostituito da live P51)
- `scripts/oneoff/inspect-prompt52-segnalazione-frase-2026-05-15.cjs` (P52, completato)
- `scripts/oneoff/verify-ti298409-post-cleanup-2026-05-15.cjs` (P51 verify, completato)

### Dump JSON one-shot (5 file)
- `scripts/oneoff/cleanup-timestamps-live-DRY.json` (P51 DRY output)
- `scripts/oneoff/cleanup-timestamps-live-REAL.json` (P51 REAL output)
- `scripts/oneoff/cleanup-timestamps-report-DRY.json` (P50 DRY output)
- `scripts/oneoff/migrate-dates-report-DRY.json` (P39 output, M)
- `scripts/oneoff/migrate-dates-report-REAL.json` (P39 output)

---

## CATEGORIA C — DECIDI CON GIUSEPPE (9 voci)

| # | File / Dir | Pro / Contro |
|---|------------|---------------|
| C1 | `.claude/settings.json` (M) | Config Claude Code personale. Tipicamente NON committato. Probabilmente da gitignorare invece che cancellare. |
| C2 | `.claude/settings.local.json` (M) | Idem C1 — `.local` di solito gitignored. |
| C3 | `docs/_live/AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md` | Audit case-specific di TI298409 (P46). Tenerlo come case-study? O cancellare (è dato di un singolo mezzo, non architetturale)? |
| C4 | `docs/_live/AUDIT_CICLO_SEGNALAZIONE_SINTESI.md` | Sintesi dell'audit P43. Ridondante con `AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md`? |
| C5 | `scripts/oneoff/audit-ti298409-prompt46-2026-05-15.cjs` | Audit "filtra per targa" P46. Riusabile come template per audit futuri. Tenerlo come pattern? |
| C6 | `scripts/oneoff/backup-firestore-prompt44-20260515.cjs` | Pattern backup Firestore. Riusabile. Tenerlo come template? |
| C7 | `scripts/oneoff/backup-firestore-prompt51-20260515.cjs` | Quasi identico a C6 (3 collection vs 5). Tenere uno e cancellare l'altro? |
| C8 | `scripts/oneoff/restore-firestore-prompt44-20260515.cjs` | Pattern restore. Utile per emergency recovery futuro. Tenerlo come template? |
| C9 | `scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs` | Logica di cleanup timestamp incoerenti. Riusabile se mai accadesse di nuovo, ma se la regola TIMESTAMP-MAI-DA-CLICK in AGENTS.md viene rispettata, non dovrebbe servire mai. |
| C10 | `scripts/oneoff/migrate-dates-storage-iso-2026-05-14.cjs` (M) | Migration date già eseguita. Tenerlo come testimone storico o cancellare? |

**Default consigliato** (se Giuseppe non specifica):
- **C1+C2**: NON committare, aggiungere `.claude/` a `.gitignore` (eccetto `.claude/agents/` se ci sono subagent definiti).
- **C3**: **TIENI** — un audit di un mezzo reale è documentazione storica di un bug realmente accaduto, vale la pena.
- **C4**: **CANCELLA** — sintesi ridondante.
- **C5, C6, C8**: **TIENI** — pattern riusabili (audit per targa, backup, restore).
- **C7**: **CANCELLA** `backup-firestore-prompt44-20260515.cjs`, tenere `backup-firestore-prompt51-20260515.cjs` (più recente).
- **C9**: **TIENI** — emergency repair tool.
- **C10**: **CANCELLA** — migration chiusa, non riapplicabile.

---

## .gitignore proposto da aggiungere

```gitignore
# Output Playwright / test
test-results/

# Screenshot debug delle sessioni
docs/_live/screenshots-*/

# Dump JSON one-shot di scripts/oneoff
scripts/oneoff/*-DRY.json
scripts/oneoff/*-REAL.json
scripts/oneoff/cleanup-*-report-*.json

# Config Claude Code personale
.claude/settings.local.json

# Editor/backup
*.bak
*.tmp
*.backup
*.old
```

`.claude/settings.json` lasciato libero di essere committato (config "team default") o gitignorato a tua discrezione.

---

## Riepilogo numerico

| Voce | File | Spazio |
|------|------|--------|
| Tieni (A) | 121 | — |
| Cancella sicuro (B) | 44 voci (incluse 10 dir screenshots + 1 dir test-results) | **~177 MB** |
| Decidi (C) | 9 (vedi default sopra) | < 100 KB |

Post-pulizia `git status --porcelain` previsto: ~125 voci pending (codice + doc finali + test).

---

## STOP HARD

Attendo conferma di Giuseppe sulla lista CATEGORIA B + decisione per CATEGORIA C prima di procedere a FASE 2 (cancellazione effettiva).
