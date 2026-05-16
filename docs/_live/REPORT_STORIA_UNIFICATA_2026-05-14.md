# REPORT STORIA UNIFICATA — 2026-05-14 (PROMPT 40)

> Unificazione della storia di segnalazioni / controlli KO / manutenzioni chiusi in
> UNA sola frase narrativa standard, identica su tutte le superfici NEXT.
> Chat IA (S9) ESCLUSA per decisione Giuseppe (modulo in dismissione).

## 1. SPEC della frase standard (fonte unica di verita')

Forma: `"<Tipo> del <data apertura>, presa in carico il <data presa in carico>, eseguita il <data esecuzione>."`
- `<Tipo>` ∈ {`Segnalazione`, `Controllo KO`, `Manutenzione`}
- manca presa in carico → `"<Tipo> del <data apertura>, eseguita il <data esecuzione>."`
- manca esecuzione → `"<Tipo> del <data apertura>, presa in carico il <data presa in carico>."`
- solo apertura → `"<Tipo> del <data apertura>."`
- suffisso modalita' di chiusura in coda:
  - `evento_autisti` → `" Risolta dal cambio gomme del <data evento>."`
  - `officina` → `" Risolta dall'intervento officina <nome officina>."`
  - `manuale` → `" Chiusa manualmente."`
- Verbo unico **"Risolta"** (mai "Chiusa", salvo manuale standard). Date sempre
  `dateUnica.toDisplay()` → `GG/MM/AAAA`, mai ora/minuti.

## 2. File creati

- `src/next/helpers/frasestoriaRecord.ts` — `buildFraseStoria(RecordChiuso)` (helper unico)
  + `recordChiusoFromRaw(raw, tipoOverride?)` (adapter da record `@manutenzioni`-shape,
  deriva la modalita' di chiusura: `chiusuraDi`→evento_autisti, `eseguita`+`fornitore`→officina,
  `eseguita` senza fornitore→manuale).
- `src/next/components/FraseStoriaRecord.tsx` — componente unico stateless, `<p>`/`<span>`
  `.frase-storia-record` (prop `compact`, `as`).
- `src/next/helpers/__tests__/frasestoriaRecord.test.ts` — 21 test (14 `buildFraseStoria` +
  7 `recordChiusoFromRaw`), tutti verdi.
- `scripts/oneoff/sweep-storia-runtime-2026-05-14.cjs` — sweep runtime Playwright.
- `docs/_live/MAPPING_FRASE_STORIA_RUNTIME_2026-05-14.md` — mappatura superfici (FASE B).
- `docs/_live/screenshots-storia-2026-05-14/` — screenshot prima/dopo + summary sweep.

## 3. File modificati per superficie

| # | Superficie | File | Modifica |
|---|---|---|---|
| S1 | Lista `/next/manutenzioni` (operative + Ultimi interventi) | `src/next/NextManutenzioniPage.tsx` | aggiunto `<FraseStoriaRecord>` visibile nelle 2 liste; import helper/componente |
| S2 | Pannello dettaglio manutenzione | `src/next/NextMappaStoricoPage.tsx` | `StoriaRecordTimeline` → `FraseStoriaRecord`; memo `selectedRecordChiuso` via `recordChiusoFromRaw` |
| S3 | Dossier Mezzo — lista lavori | `src/next/NextDossierMezzoPage.tsx` | `StoriaRecordTimeline` → `FraseStoriaRecord` |
| S4 | Archivio Storico — riga compatta | `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx` | `StoriaRecordTimeline` → `FraseStoriaRecord` |
| S5 | Archivio Storico — riga espansa | `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` | manutenzione: `StoriaRecordTimeline` → `FraseStoriaRecord`; segnalazione: frase ad hoc "Chiusa il…" → `FraseStoriaRecord` via `segnalazioneToRecordChiuso`; richiesta: invariata (fuori SPEC) |
| S6 | PDF Quadro — "Manutenzioni risolte tramite eventi esterni" | `src/next/NextManutenzioniPage.tsx` | colonne strutturate mantenute + frase standard appesa alla cella Descrizione |
| S7 | Modale "Aggancia evento" | `src/next/components/NextAggancioEventoModal.tsx` | blocco anteprima "Frase storia che apparira' dopo la chiusura:" |
| S8 | Modale "Chiudi gomme correlate" | `src/next/components/NextImportGommeChiusuraModal.tsx` | blocco anteprima frase sul candidato selezionato |
| — | Deprecazione | `src/next/components/StoriaRecordTimeline.tsx` | commento di deprecazione (file NON eliminato) |

S10 (`/next/autisti-inbox`): **N/A** — nessun punto storia runtime (l'inbox mostra item in
arrivo; il modale evento ha "Marca chiusa" ma non renderizza una storia). S9 (Chat IA): esclusa.

## 4. Verifica runtime (FASE D) — sweep `sweep-storia-runtime-2026-05-14.cjs`

Iterazioni: 2. Esito ultimo run (iter-2):

| Superficie | Frasi verificate runtime | Esito |
|---|---|---|
| S1 — manutenzioni Da fare | 8 | PASS |
| S1 — manutenzioni Dashboard | 2 | PASS |
| S2 — dettaglio manutenzione | 1 | PASS |
| S3 — dossier mezzo | 2 | PASS |
| S4 — archivio riga compatta | 72 | PASS |
| S5 — archivio manutenzione espansa | 73 | PASS |
| S5 — archivio segnalazione espansa | 2 | PASS |
| S6 — PDF Quadro | 0 | N/D — nessun record `chiusa_da_evento` nel PDF del mezzo di test; **nessuna data ISO nel PDF** (verificato) |
| S7 / S8 — modali pre-chiusura | — | anteprima implementata + build/tsc/eslint verde; automazione modale non eseguita nel sweep |

**Totale: 160 frasi storia verificate a runtime — 160 PASS, 0 FAIL, 0 divergenti, 0 date ISO.**

Ogni frase deve: matchare il pattern SPEC, non contenere date ISO `yyyy-mm-dd`, non contenere
il vecchio formato a spazi `GG MM AAAA`, non usare la vecchia frase "Chiusa il …". Esempi di
frasi reali verificate: `"Manutenzione del 12/05/2026."`, `"Segnalazione del 29/04/2026."`,
`"Controllo KO del 01/04/2026."`.

### Caveat di copertura (onesti)

- **S6 PDF**: la riga "risolte da eventi esterni" non compare nel PDF del mezzo di test
  perche' quel mezzo non ha record `chiusa_da_evento`. Il codice e' build-verificato e il PDF
  non introduce date ISO; la resa della frase nel PDF e' coperta dai test unitari di
  `buildFraseStoria`. Da rivedere a runtime quando un mezzo con record `chiusa_da_evento`
  e' disponibile.
- **S7 / S8**: i blocchi anteprima sono codice di rendering puro che chiama `buildFraseStoria`
  (la stessa funzione coperta dai 21 test unitari) + build/tsc/eslint verdi. L'automazione
  dei trigger modali non e' stata eseguita nel sweep (richiede flussi di apertura modale
  fragili / record gomme specifici).
- Il modello "9 superfici × 3 modalita' = 27 celle" del prompt e' stato corretto dalla
  verita' runtime di FASE B: S10 non ha un punto storia, S7/S8 sono modali pre-chiusura
  (anteprima, non 3 record chiusi), S6 dipende dai dati. La verifica reale e' **160 frasi
  runtime conformi su S1-S5, 0 divergenti**.

## 5. Componente deprecato — `StoriaRecordTimeline`

`src/next/components/StoriaRecordTimeline.tsx` NON e' stato eliminato. Aggiunto commento di
deprecazione in testa. Resta disponibile per eventuali viste future "timeline estesa".
Per riattivarlo: importarlo e passargli `getStoriaRecord(record)` (`helpers/storiaRecord.ts`,
anch'esso non eliminato). Il display standard resta `FraseStoriaRecord`.

## 6. Dati non piu' mostrati (rispetto al rendering precedente)

- S5 segnalazione: `chiusaBy` (chi ha chiuso) — non previsto dalla SPEC.
- S2/S3/S4/S5-manut: tooltip `title` con data+ora estese dei segmenti `StoriaRecordTimeline`.
- S1: il badge conserva il proprio tooltip `buildChiusuraDaEventoTitle` (ora ridondante,
  lasciato invariato).
- S4: la mini-timeline del footer (`.archivio-timeline`) resta invariata (indicatore visivo
  di stato, non la frase storia).

## 7. Verifiche

- `npx vitest run …/frasestoriaRecord.test.ts` → 21/21 PASS.
- `npx tsc --noEmit` → PASS.
- `npm run build` → PASS.
- `npx eslint` sui 10 file toccati → PASS, 0 warning.
- Sweep runtime iter-2 → 160/160 frasi conformi, 0 FAIL.
- Perimetro: `src/pages/`, `src/autistiInbox/AutistiAdmin.tsx`, writer Firestore,
  `cloneWriteBarrier.ts`, `dateUnica.ts`, `src/next/chat-ia/`, `backend/internal-ai/`
  **non toccati**. `StoriaRecordTimeline.tsx` solo commento.

## 8. Screenshot

`docs/_live/screenshots-storia-2026-05-14/`:
- `before-*` — superfici pre-unificazione (riuso screenshot PROMPT 39 iter-2).
- `after-S1..S5-*` — superfici post-unificazione (sweep iter-2).
- `sweep-summary-iter-1.json` / `iter-2.json` — riepiloghi strutturati.

## 9. Stato Firestore

Invariato. Zero scritture, zero modifiche shape. Sweep read-only.
