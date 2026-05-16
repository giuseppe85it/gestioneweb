# PROMPT 53 — Pulizia pre-commit (2026-05-15)

## Stato: **PASS**

Working tree ripulito da 174 → **135 voci pending**. ~177 MB di artefatti rimossi. Build verde (36s).

---

## File cancellati per categoria

### CATEGORIA B — 44 voci eliminate
- **10 directory screenshots** in `docs/_live/screenshots-*-2026-05-1{4,5}` (~45 MB):
  audit-ciclo, audit-ti298409, date, elimina-officina, modifica-manutenzione, officina-dropdown, prompt45, prompt47, prompt52, storia.
- **`test-results/` intera** (132 MB) — sweep date/storia, verify P39-P47, audit ciclo, backend-nodemon.log 7.4M, ecc.
- **4 file scan/mapping/diagnosi intermedi**: `SCAN_DATE_TOTALE`, `SCAN_ISO_RESIDUI`, `MAPPING_FRASE_STORIA_RUNTIME`, `DIAGNOSI_MODIFICA_MANUTENZIONE` — coperti da REPORT successivi.
- **14 script one-shot completati** in `scripts/oneoff/`: `verify-elimina-officina`, `verify-modifica-manutenzione`, `verify-officina-dropdown`, `verify-prompt44-runtime`, `verify-prompt45-runtime`, `verify-prompt47-runtime`, `sweep-date-runtime`, `sweep-storia-runtime`, `dryrun-prompt44-propagazione`, `audit-ciclo-segnalazione`, `audit-ti298409-2026-05-15` (P45, sostituito da P46), `cleanup-timestamps-aggancio` (P50 su backup, sostituito da P51 live), `inspect-prompt52-segnalazione-frase`, `verify-ti298409-post-cleanup`.
- **5 dump JSON one-shot**: `cleanup-timestamps-live-DRY.json`, `cleanup-timestamps-live-REAL.json`, `cleanup-timestamps-report-DRY.json`, `migrate-dates-report-DRY.json`, `migrate-dates-report-REAL.json`.

### CATEGORIA C — default applicati
- **C1+C2** `.claude/settings.json` + `.claude/settings.local.json`: **NON cancellati**, ma rimossi dal tracking via `git rm --cached` + aggiunti a `.gitignore`. Restano sul disco come config personale.
- **C3** `AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md`: **MANTENUTO** (case-study storico).
- **C4** `AUDIT_CICLO_SEGNALAZIONE_SINTESI.md`: **CANCELLATO** (ridondante).
- **C5** `audit-ti298409-prompt46-2026-05-15.cjs`: **MANTENUTO** (pattern "audit per targa").
- **C6** `backup-firestore-prompt44-20260515.cjs`: **CANCELLATO** (sostituito da C7).
- **C7** `backup-firestore-prompt51-20260515.cjs`: **MANTENUTO** (pattern backup recente).
- **C8** `restore-firestore-prompt44-20260515.cjs`: **MANTENUTO** (pattern restore emergency).
- **C9** `cleanup-timestamps-live-2026-05-15.cjs`: **MANTENUTO** (emergency repair tool).
- **C10** `migrate-dates-storage-iso-2026-05-14.cjs`: **CANCELLATO** (migration chiusa).

### Riepilogo eliminazioni
- File singoli cancellati: 26 (4 scan/mapping + 14 script + 5 dump JSON + 3 da CATEGORIA C — C4/C6/C10)
- Directory cancellate: 10 screenshots + 1 `test-results/`
- File untracked (rimasti sul disco ma fuori da git): 2 (`.claude/settings*`)

---

## File mantenuti

### CATEGORIA A — 121 voci da committare nel prossimo commit
- 87 modifiche `M` su `src/`, `backend/`, doc finali, config (esclusi `.claude/settings*` ora gitignored).
- 34 nuovi `??` (helpers cicloLegame/closureOrchestrator/frasestoriaRecord/manutenzioniCandidatiMerge/manutenzioniPerAggancio/useSorgenteManutenzione/formatStatoManutenzione, componenti FraseStoriaRecord/NextAgganciaLegameModal/NextMergeManutenzioneModal/OfficinaAutocomplete/ArchivioRowFormatters, writers agganciaSegnalazione.../presaInCarico.../sganciaLegameOrfano..., 6 file `__tests__/` + 2 directory `__tests__/`, 14 doc REPORT/AUDIT finali compresi quelli P53).

### CATEGORIA C mantenuti
- `audit-ti298409-prompt46-2026-05-15.cjs` (pattern audit)
- `backup-firestore-prompt51-20260515.cjs` (template backup)
- `restore-firestore-prompt44-20260515.cjs` (template restore)
- `cleanup-timestamps-live-2026-05-15.cjs` (emergency tool)
- `AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md` (case study)
- `AUDIT_PRECOMMIT_2026-05-15.md` (questo audit)

---

## `.gitignore` aggiornato

Aggiunte le seguenti voci a [.gitignore](../../.gitignore):

```gitignore
# PROMPT 53 — non committare artefatti delle sessioni di sviluppo

# Output Playwright / test
test-results/

# Screenshot debug delle sessioni
docs/_live/screenshots-*/

# Dump JSON one-shot di scripts/oneoff
scripts/oneoff/*-DRY.json
scripts/oneoff/*-REAL.json
scripts/oneoff/cleanup-*-report-*.json

# Config Claude Code personale
.claude/settings.json
.claude/settings.local.json

# Editor / backup file
*.bak
*.tmp
*.backup
*.old
```

Prossime sessioni: gli output di test, gli screenshot di debug, i dump JSON e i config Claude non finiranno piu' nelle voci pending.

---

## Build post-pulizia

Bug preesistente scoperto: `tsconfig.app.json` includeva `src/` senza escludere `**/__tests__/**`. `tsc -b` (usato da `npm run build`) prova a compilare i `.test.ts` ma non ha `vitest` nei `types`, quindi falliva. Fix: aggiunto `exclude` ai test in [tsconfig.app.json](../../tsconfig.app.json). I test continuano a girare via vitest, non via tsc-b.

```json
"include": ["src"],
"exclude": ["src/**/__tests__/**", "src/**/*.test.ts", "src/**/*.test.tsx"]
```

### Risultato build
```
✓ built in 36.27s
dist/index.html                            0.47 kB
dist/assets/index-CD7ZMeQ2.css           639.65 kB │ gzip: 103.80 kB
dist/assets/index-DjNOJaw1.js          4,878.62 kB │ gzip: 1,373.80 kB
```

Warning chunk-size > 500 kB preesistente, non bloccante.

---

## Conteggio finale pending commit

| Stato | Pre-pulizia | Post-pulizia |
|-------|-------------|--------------|
| `M` modificati | 87 | 85 (`.claude/settings*` rimossi dal tracking) |
| `??` nuovi | 87 | 42 (~45 voci di artefatti eliminate) |
| `D` cancellati | 0 | 8 (incluse 2 `.claude/settings*` con `git rm --cached`) |
| **Totale** | **174** | **135** |

Riduzione: -39 voci pending, ~177 MB liberati su disco.

---

## File toccati in PROMPT 53

### Modificati (config)
- [.gitignore](../../.gitignore) — aggiunte 5 categorie di pattern per artefatti di sessione
- [tsconfig.app.json](../../tsconfig.app.json) — escluso `__tests__` dalla build (fix preesistente)

### Nuovi (audit + report)
- [docs/_live/AUDIT_PRECOMMIT_2026-05-15.md](AUDIT_PRECOMMIT_2026-05-15.md) — audit FASE 1
- [docs/_live/REPORT_PROMPT53_PULIZIA_PRECOMMIT_2026-05-15.md](REPORT_PROMPT53_PULIZIA_PRECOMMIT_2026-05-15.md) — questo

### Eliminati
44 voci di CATEGORIA B + 3 voci di CATEGORIA C (C4/C6/C10) + 2 `.claude/settings*` rimossi dal tracking (file conservati sul disco).
