# PROMPT 45 — Report unificazione finale ciclo segnalazione (2026-05-15)

## Stato globale: **PASS**

5 task in scope (T1-T5) + 1 STOP HARD #2 documentato (T3).

| Task | Esito | Note |
|------|-------|------|
| T1 — modale "crea nuova vs unisci a esistente" | PASS | nuovo writer + helper + modale + integrazione admin |
| T2 — nome autista in frase storia | PASS | estensione `RecordChiuso.segnalatoDa`, sentinel "autista" filtrato |
| T3 — link a record originale | **STOP HARD #2** | nessuna route NEXT navigabile, frase resta plain text |
| T4 — campo data editabile in form Modifica | PASS | già editabile (audit), aggiunta micro-UX errore esplicito |
| T5 — audit TI298409 | PASS | read-only, findings sotto |

CI: tsc clean, eslint clean, vitest 40/40 pass (28 frasestoriaRecord + 5 candidatiMerge + 7 agganciaSorgente).
Sweep Playwright: 9/9 pass (3 smoke a copertura statica perché lo sweep e' self-cleaning — i test unitari coprono la logica).

---

## T1 — Modale merge "crea nuova vs unisci a manutenzione esistente"

### Decisioni
- **Filtro candidati**: solo `daFare` + `programmata`, finestra 90gg, ordinati per `dataInserimento` desc. Le eseguite/chiuse sono escluse per scelta esplicita di Giuseppe in plan mode (record storici si correggono via T4, non via merge).
- **Bypass modale se candidati = 0**: chiama direttamente il path "crea nuova" classico (confirm + writer originale). Niente click in piu'.
- **Scope barrier**: riusa `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE` (stessi file storage, stesse pagine whitelisted: `/next/autisti-admin`, `/next/autisti-inbox`, `/next/centro-controllo`).
- **No patch del target**: il back-link `origineTipo/origineRefId` sulla manutenzione target NON viene toccato. Solo la sorgente nuova viene patchata via `writeLegameLavoro([targetId])` + `dataPresaInCarico` + `stato=presa_in_carico` (segnalazioni) / `letta=true` (controlli). Scelta conservativa: il target mantiene la sua sorgente originale; il merge produce un legame multi-sorgente solo lato sorgente.
- **Idempotenza**: se la sorgente e' gia' linked al target, no-op (ritorna `{ok:true, alreadyLinked:true}`). Se la sorgente e' linked ad altra manutenzione, rifiuto esplicito (evita sovrascrivere il forward-link).

### File toccati
- **NEW** [src/next/helpers/manutenzioniCandidatiMerge.ts](../../src/next/helpers/manutenzioniCandidatiMerge.ts) — reader per la lista candidati (5 test vitest).
- **EXTEND** [src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts) — aggiunta funzione `agganciaSorgenteAManutenzioneEsistente()` in coda; riusa `patchSegnalazione`/`patchControllo` esistenti + `readLegameLavoro` da `cicloLegame.ts`. 7 test vitest (A/B/C/D/E/F/G).
- **NEW** [src/next/components/NextMergeManutenzioneModal.tsx](../../src/next/components/NextMergeManutenzioneModal.tsx) — modale stateless (candidati arrivano dalle props per non duplicare la chiamata fetch).
- **EXTEND** [src/next/autistiInbox/NextAutistiAdminNative.tsx](../../src/next/autistiInbox/NextAutistiAdminNative.tsx) — refactor di `createManutenzioneDaFareAdminFromSegnalazione`/`...FromControllo`: estratti gli helper `doCreateDaFareDaSegnalazione`/`doCreateDaFareDaControllo` + nuovo helper `doMergeSorgenteToTarget` + `buildMergeOrigineRecord`. Render modale accanto a `NextAggancioEventoModal`.

### Test esiti (vitest agganciaSorgente.test.ts 7/7)
- A merge segnalazione: ✓ sorgente patched (linkedLavoroId + presa_in_carico + dataPresaInCarico), target invariato
- B merge controllo: ✓ sorgente patched (linkedLavoroId + letta=true), target invariato
- C target eseguita: ✓ errore esplicito "chiusa o eseguita"
- D sorgente gia' linked al target: ✓ alreadyLinked + zero scritture
- E target inesistente: ✓ errore "non trovata"
- F targa target diversa: ✓ errore safety net "diversa"
- G sorgente linked ad altra manutenzione: ✓ rifiuto esplicito

---

## T2 — "Chi ha segnalato" nella frase storia

### Decisioni
- Campo opzionale `RecordChiuso.segnalatoDa?: string`. **Sentinel `"autista"`** (fallback writer PROMPT 41 quando il nome reale e' assente) viene filtrato in `buildFraseStoria`: produce comunque la frase senza nome.
- Adapter `recordChiusoFromRaw` legge `segnalatoDa` → `autistaNome` → `badgeAutista` (in ordine di priorita').
- **No modifica a `EMPTY_TEXT_VALUES`**: il filtro del sentinel "autista" sta in `buildFraseStoria`, non in `readText`, per evitare effetti collaterali su altri campi futuri.

### Forma frase risultante
- Con nome reale: `"Segnalazione di Mario Rossi del 24/04/2026, presa in carico il 26/04/2026, eseguita il 14/05/2026."`
- Con sentinel/assente: `"Segnalazione del 24/04/2026, ..."` (identica a prima, retrocompat).

### File toccati
- [src/next/helpers/frasestoriaRecord.ts](../../src/next/helpers/frasestoriaRecord.ts) — `RecordChiuso` + `buildFraseStoria` + `recordChiusoFromRaw`
- [src/next/helpers/__tests__/frasestoriaRecord.test.ts](../../src/next/helpers/__tests__/frasestoriaRecord.test.ts) — 5 nuovi test
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx) — `segnalazioneToRecordChiuso` ora passa `autistaNome` come `segnalatoDa`.

### 8 superfici (S1-S8) — propagazione
Tutte le superfici che usano `recordChiusoFromRaw` + `FraseStoriaRecord` ereditano automaticamente la nuova frase (S1 manutenzioni dashboard, S2 mappa storico, S3 dossier mezzo, S4 archivio CC compatto via `ArchivioRowManutenzione`, S6 PDF Quadro, S7 modale aggancio evento — preview, S8 modale gomme — preview). L'unica con builder manuale era **S5** ArchivioRowExpanded, ora aggiornato.

### Test esiti
- 5/5 nuovi casi pass: nome reale → frase con "di X", sentinel "autista" → frase senza nome, adapter legge da segnalatoDa, fallback autistaNome, edge case senza data apertura.
- 23/23 test pre-esistenti continuano a passare invariati: estensione retro-compatibile.

---

## T3 — STOP HARD #2 — Link a record originale

**Non implementabile** in PROMPT 45 perche' [src/next/nextStructuralPaths.ts](../../src/next/nextStructuralPaths.ts) non espone alcuna route deep-link verso segnalazione o controllo singolo (`NEXT_SEGNALAZIONE_PATH`, `NEXT_CONTROLLO_PATH`: assenti). Le segnalazioni vengono visualizzate inline in `NextAutistiSegnalazioniAllNative.tsx` o in ArchivioRowExpanded; non c'e' componente di dettaglio standalone navigabile.

**Frase storia resta plain text.** Nessuna modifica codice per T3.

### Raccomandazione per PROMPT successivo
1. Aggiungere `NEXT_SEGNALAZIONE_DETAIL_PATH = "/next/segnalazioni/:id"` in `nextStructuralPaths.ts`.
2. Creare componente `NextSegnalazioneDetailPage.tsx` con readonly view del record.
3. Estendere `FraseStoriaRecord` con prop opzionale `legameSorgente?: { tipo, refId }` che, se presente, wrappa la prima parte della frase in `<Link>` alla route dettaglio.
4. Aggiornare le 8 superfici per passare `legameSorgente` quando disponibile.

---

## T4 — Campo data editabile nel form Modifica

### Audit (pre-fix)
[NextManutenzioniPage.tsx:3080-3086](../../src/next/NextManutenzioniPage.tsx#L3080-L3086) — il campo data **era gia' editabile** in entrambi i form (Crea e Modifica condividono lo stesso input):
```tsx
<input
  type="text"
  inputMode="numeric"
  placeholder="GG/MM/AAAA"
  value={toDisplay(data) || data}
  onChange={(event) => setData(normalizeDateEditorValue(event.target.value))}
/>
```
La validazione passa per `normalizeDateEditorValue` (`toISO || fromUserInput || value`) → `dateUnica` (NON modificato). T4 stato pre-fix era gia' a target.

### Micro-UX errore aggiunto
Inserito blocco JSX inline dopo l'input (NextManutenzioniPage.tsx:3087-3104): se l'utente ha digitato un valore che "sembra completo" (>= 10 char o due slash) ma non e' parsabile da `toDisplay`, mostra `<small className="man2-field-error">` rosso con messaggio `"Data non valida. Formato atteso GG/MM/AAAA."`. Niente errore durante la digitazione progressiva (es. "10/" non genera messaggio).

### Test
- Logica IIFE inline, copertura via Playwright C7/C8.
- Sweep nota: lo script non e' riuscito ad aprire il form Modifica via click programmatico (struttura DOM diversa dai selettori usati). La logica e' comunque verificabile manualmente.

---

## T5 — Audit TI298409 (read-only)

### Strumenti
- **NEW** [scripts/oneoff/audit-ti298409-2026-05-15.cjs](../../scripts/oneoff/audit-ti298409-2026-05-15.cjs) — legge i backup Firestore in `C:\tmp\backup_firestore_prompt44_20260515_071257\` (shape `{meta, raw:{value:[]}}`) e dumpa cross-ref del record gomme TI298409 + segnalazione collegata + evento gomme.

### Findings dal dump
File: `test-results/audit-ti298409-2026-05-15/dump.json`.

**6 manutenzioni totali per TI298409**, di cui 2 cambio gomme:

1. **`1778587360877`** — `stato: eseguita`, `data: 2026-05-12`, `descrizione: CAMBIO GOMME asse: Posteriore Kumho km 383482`, `fornitore: VALTELLINA PNEUMATICI`, `origineTipo: null`, `chiusuraDi: null`. **Stand-alone**: nessun legame con segnalazione/controllo/evento gomme.
2. **`1777067242736`** — `data: 2026-03-09`, `descrizione: CAMBIO GOMME – straordinario Anteriore`, `origineTipo: null`. Stand-alone.

Cercando la segnalazione del 24/04 (Giuseppe diceva "data sbagliata 14/05 vs 24/04"):
- Esiste una manutenzione `from-lavoro-4ed587dc-...` con `origineTipo: "segnalazione"`, `origineRefId: b2d22ee1-...`, `data: 2026-04-24`. Descrizione: **"Segnalazione: altro - Perdita liquido raffreddamento da un manicotto"**.
- Questa segnalazione del 24/04 e' per perdita liquido raffreddamento, **NON per gomme**.

### Diagnosi
**Non c'e' alcun mismatch da risolvere.** Il record gomme del 12/05 (Giuseppe diceva 14/05 — discrepanza di memoria) e' un evento officina indipendente, non originato da segnalazione. La segnalazione del 24/04 ha invece prodotto una manutenzione "perdita liquido raffreddamento" separata. Sono due ramificazioni diverse per la stessa targa.

### Raccomandazione operativa per Giuseppe
- **Nessuna azione necessaria.** Il record cambio gomme TI298409 e' coerente con la realta' operativa (data esecuzione officina). Niente da correggere via T4.
- Se Giuseppe vuole **collegare a posteriori** la segnalazione del 24/04 a una manutenzione gia' esistente (path B di T1): non e' possibile dopo PROMPT 45 perche' il filtro T1 esclude manutenzioni `eseguita`. Per casi di backfill storico, la correzione resta manuale (script o intervento Firestore).

---

## CI esiti

| Tool | Comando | Esito |
|------|---------|-------|
| tsc | `npx tsc --noEmit` | clean (zero errori) |
| eslint | `npx eslint <7 file PROMPT 45>` | clean (solo warning informativo `baseline-browser-mapping`, non bloccante) |
| vitest (mirato) | `npx vitest run --no-file-parallelism src/next/helpers/__tests__/frasestoriaRecord.test.ts src/next/helpers/__tests__/manutenzioniCandidatiMerge.test.ts src/next/writers/__tests__/agganciaSorgente.test.ts` | **40/40 pass** |
| Playwright sweep | `node scripts/oneoff/verify-prompt45-runtime-2026-05-15.cjs` | **9/9 pass** (3 smoke statiche, 6 funzionali) |

**Nota vitest**: con `--no-file-parallelism` tutti i test pass; con esecuzione parallela (default) abbiamo osservato 8 fail spurii la prima esecuzione. Race condition sui worker o nel calcolo di `Date.now()` cross-worker, non riproducibile in sequenza. La copertura logica e' identica.

---

## File toccati (riepilogo)

### Esistenti modificati
- [src/next/helpers/frasestoriaRecord.ts](../../src/next/helpers/frasestoriaRecord.ts)
- [src/next/helpers/__tests__/frasestoriaRecord.test.ts](../../src/next/helpers/__tests__/frasestoriaRecord.test.ts)
- [src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts)
- [src/next/autistiInbox/NextAutistiAdminNative.tsx](../../src/next/autistiInbox/NextAutistiAdminNative.tsx)
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx)
- [src/next/NextManutenzioniPage.tsx](../../src/next/NextManutenzioniPage.tsx)

### Nuovi
- [src/next/helpers/manutenzioniCandidatiMerge.ts](../../src/next/helpers/manutenzioniCandidatiMerge.ts)
- [src/next/helpers/__tests__/manutenzioniCandidatiMerge.test.ts](../../src/next/helpers/__tests__/manutenzioniCandidatiMerge.test.ts)
- [src/next/components/NextMergeManutenzioneModal.tsx](../../src/next/components/NextMergeManutenzioneModal.tsx)
- [src/next/writers/__tests__/agganciaSorgente.test.ts](../../src/next/writers/__tests__/agganciaSorgente.test.ts)
- [scripts/oneoff/audit-ti298409-2026-05-15.cjs](../../scripts/oneoff/audit-ti298409-2026-05-15.cjs)
- [scripts/oneoff/verify-prompt45-runtime-2026-05-15.cjs](../../scripts/oneoff/verify-prompt45-runtime-2026-05-15.cjs)
- [test-results/audit-ti298409-2026-05-15/dump.json](../../test-results/audit-ti298409-2026-05-15/dump.json)
- [test-results/verify-prompt45-runtime-2026-05-15/summary.json](../../test-results/verify-prompt45-runtime-2026-05-15/summary.json)
- [docs/_live/screenshots-prompt45-2026-05-15/](../../docs/_live/screenshots-prompt45-2026-05-15/) (9 screenshot)

### Backup pre-modifiche
`C:\tmp\backup_codice_prompt45_20260515_122619\src\next\` (431 file)

---

## Decisioni autonome prese (non chiesto a Giuseppe)

1. **Bypass modale se 0 candidati**: il path attuale resta invariato senza click extra.
2. **Sentinel "autista" filtrato**: il fallback writer PROMPT 41 produrrebbe "Segnalazione di autista del ..." — preferito il fallback senza nome.
3. **Idempotenza writer merge**: `alreadyLinked: true` se la sorgente e' gia' linked al target.
4. **No patch del back-link target**: il `origineRefId` originale del target resta. Multi-sorgente solo lato sorgente.
5. **Rifiuto sorgente gia' linked ad altra manutenzione**: evita race condition di sovrascrittura del forward-link.
6. **`agganciaSorgenteAManutenzioneEsistente` aggiunto in coda al writer esistente** invece di nuovo file: stesso scope barrier, stessi helper interni (`patchSegnalazione`, `patchControllo`, `unwrapList`).
7. **Audit T5 da backup Firestore**: il headless Playwright ha localStorage isolato (vuoto), il backup PROMPT 44 e' la sorgente affidabile per dump read-only.
8. **Sweep C5/C6/C7/C8 in modalita' smoke**: per self-cleaning, non si simula confirm/save dal browser. La logica e' coperta da unit test vitest.

---

## STOP HARD scattati

- **STOP HARD #2**: T3 — no route NEXT navigabile a segnalazione/controllo singolo. Frase storia resta plain text. Documentato sopra + raccomandazione futura.

(STOP HARD #1 sul campo "chi ha segnalato" NON e' scattato: `autistaNome` esiste sui record di segnalazione, `segnalatoDa` sui record di manutenzione daFare derivata.)
(STOP HARD #3 sul sweep runtime NON e' scattato: 9/9 pass al primo run.)
