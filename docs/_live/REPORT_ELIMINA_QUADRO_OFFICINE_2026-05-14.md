# REPORT — ELIMINA NEL QUADRO (T1) + OFFICINA AUTOCOMPLETE (T2) — 2026-05-14 (PROMPT 42)

> Due enhancement sul modulo manutenzioni NEXT, consegnati insieme. Esito: **PASS**.

## T1 — Bottone Elimina nel pannello HTML del Quadro manutenzioni

### Cosa fa
Ogni riga del pannello Quadro (tabelle `man2-pdf-list__table` "Ultime 3" e
`man2-pdf-modal__table` "Vedi tutte" / mese / tipo) ha ora un bottone **Elimina**
(destructive, sempre abilitato). Al click si apre una **modale di conferma** con titolo
"Elimina manutenzione", riepilogo del record (data `GG/MM/AAAA`, descrizione, tipo, targa)
e l'avviso "L'operazione non puo' essere annullata"; bottoni "Annulla" (focus di default)
e "Elimina definitivamente". E' la scialuppa per i record fantasma generati dal bug
pre-PROMPT 41 (es. TI298409), invisibili in Da fare / Dettaglio.

### Writer
`deleteNextManutenzioneBusinessRecord` (`src/next/domain/nextManutenzioniDomain.ts`)
**già esistente**, riusato. Esteso con un 2° parametro opzionale
`fingerprint?: NextManutenzioneEditingFingerprint`: se `findLegacyRecordIndex` non trova
il record (id sintetico index-based instabile), fallback su `findLegacyRecordIndexByFingerprint`
(funzione di PROMPT 41). Resta `Promise<boolean>` — `false` = record non trovato. Additivo,
retro-compatibile col chiamante esistente `handleDelete`.

### Barriera
**Nessuna deroga aggiunta.** `cloneWriteBarrier.ts` autorizza già le scritture su
`@manutenzioni` dalla route `/next/manutenzioni` (path-based, `MANUTENZIONI_ALLOWED_WRITE_PATHS`);
il pannello Quadro vive su quella route. `cloneWriteBarrier.ts` non e' stato toccato.

### File T1
- `src/next/domain/nextManutenzioniDomain.ts` — `deleteNextManutenzioneBusinessRecord(recordId, fingerprint?)`.
- `src/next/NextManutenzioniPage.tsx` — `renderPdfRows` (colonna "Azioni" + bottone Elimina),
  3 `<thead>` (`<th>Azioni</th>`), stato `pdfDeleteCandidate`/`pdfDeleteBusy`, handler
  `handleConfirmPdfDelete`, `renderPdfDeleteModal` montata nel return.
- `src/next/next-manutenzioni.css` — `.man2-btn--danger`, `.man2-pdf-row__delete-cell`,
  `.man2-pdf-modal--confirm`.

## T2 — Campo Officina/Fornitore: autocomplete non vincolante da @officine

### Decisione (post-diagnostica + clarify Giuseppe)
Diagnostica read-only su Firestore reale: `@officine` ha **3 record**
(SCIURBA IGNAZIO, AUGUSTONI TRUCK (PEJO), CARVI); `@manutenzioni` ha **31 valori `fornitore`**
storici, **0 dei quali corrisponde** a un'officina in anagrafica. Scelta di Giuseppe:
autocomplete **non vincolante** — suggerimenti read-only solo da `@officine`, testo libero
sempre ammesso e salvato così com'è. **Niente** ibrido coi 31 storici, niente validazione,
niente "+ aggiungi officina", niente redirect, niente scrittura `@officine` dal form,
niente migration retroattiva.

### Cosa fa
Nuovo componente `src/next/components/OfficinaAutocomplete.tsx` (stateless/controllato,
pattern mirrorato da `NextScadenzeCollaudiPage`): input testo + dropdown di suggerimenti
da `@officine` filtrati sulla digitazione. Selezione di un suggerimento → il campo prende
il **nome ufficiale esatto** dall'anagrafica. Testo libero → salvato esatto, nessun blocco.
2+ caratteri senza match → "Nessun suggerimento". Lista `@officine` vuota → si comporta
come normale input testo. Reader riusato: `readNextOfficineSnapshot` (`nextOfficineDomain.ts`).

Integrato in `NextManutenzioniPage.tsx` `renderForm` al posto dell'input testo libero del
campo Fornitore (etichetta ora "Fornitore / Officina"). Rimosso l'auto-`.toUpperCase()`
sulla digitazione manuale (Giuseppe: "stringa esatta dell'utente, no normalizzazioni furbe").
Il valore continua a salvarsi nel campo Firestore `fornitore` di `@manutenzioni`.

### File T2
- `src/next/components/OfficinaAutocomplete.tsx` (nuovo).
- `src/next/NextManutenzioniPage.tsx` — import + stato `officine` + `useEffect` di
  caricamento read-only + sostituzione input Fornitore con `<OfficinaAutocomplete>`.
- `src/next/next-manutenzioni.css` — classi `.officina-ac*`.

## Test unitari

`src/next/domain/__tests__/deleteNextManutenzioneBusinessRecord.test.ts` — 4 casi,
**4/4 PASS** (run isolato, come da convenzione del progetto):
delete per id reale → rimosso, altri invariati; delete per fingerprint (record senza id
reale) → rimosso il giusto; delete non trovato → `false`, array invariato; delete ultimo
record → array vuoto. `saveNextManutenzioneBusinessRecord.test.ts` (PROMPT 41) resta 5/5.

## Verifica runtime — `scripts/oneoff/verify-elimina-officina-2026-05-14.cjs`

Sweep Playwright self-cleaning (crea un record di test su **TI113417**, NON TI298409, e lo
elimina). **9/9 PASS:**

| Check | Esito |
|---|---|
| mezzo attivo del form ≠ TI298409 | PASS (TI113417) |
| campo Fornitore reso come autocomplete | PASS |
| T2-1: digito "augu" → dropdown → selezione popola "AUGUSTONI TRUCK (PEJO)" | PASS |
| T2-2: testo libero "Pippo officina fantasia" → "Nessun suggerimento", non bloccato | PASS |
| T1: form compilato (descrizione = marker) e salvataggio inviato | PASS |
| T1: Quadro mostra la riga del marker col bottone Elimina | PASS |
| T1: modale conferma → Annulla → record ancora presente | PASS |
| T1: modale conferma → "Elimina definitivamente" → record sparito dal Quadro | PASS |
| T2-4: Modifica record esistente → campo Fornitore autocomplete presente ed editabile | PASS |

Screenshot in `docs/_live/screenshots-elimina-officina-2026-05-14/`.

## Verifiche tecniche

- `npx vitest run` (per-file, come da convenzione): `deleteNextManutenzioneBusinessRecord` 4/4,
  `saveNextManutenzioneBusinessRecord` 5/5.
- `npx tsc --noEmit` → PASS. `npm run build` → PASS (resta la nota informativa pre-esistente
  `TS2307` su `vitest` dai file test in `tsc -b`, non fatale, già presente da PROMPT 41).
- `npx eslint` sui file toccati → PASS, 0 warning.

## Avvertenze per Giuseppe

- **Record fantasma TI298409**: ora **eliminabile manualmente** dal pannello Quadro
  manutenzioni (riga → Elimina → conferma). Non toccato da questo prompt: lo elimini tu.
- **Officine con nomi divergenti**: i **31 valori `fornitore`** storici in `@manutenzioni`
  NON corrispondono ai 3 record di `@officine` e **non sono stati migrati**. L'autocomplete
  diventera' progressivamente piu' utile man mano che popoli `@officine` da Anagrafiche con
  i nomi reali — **senza dover toccare il codice**. Eventuale ripulitura/allineamento dei
  nomi storici e' una decisione separata, fuori da questo prompt.

## Perimetro

Toccati: `NextManutenzioniPage.tsx`, `nextManutenzioniDomain.ts` (solo
`deleteNextManutenzioneBusinessRecord`), `next-manutenzioni.css` + nuovi
`OfficinaAutocomplete.tsx`, test, script di verifica, report/screenshots.
NON toccati: `src/pages/`, `src/autistiInbox/AutistiAdmin.tsx`, `dateUnica.ts`,
`cloneWriteBarrier.ts` (nessuna deroga necessaria), frase storia / `FraseStoriaRecord`,
la fix PROMPT 41 su `saveNextManutenzioneBusinessRecord`. Nessuna migration retroattiva.

## Stato Firestore

Il codice non scrive di per sé. Lo sweep di verifica ha creato e poi eliminato un record
di test su TI113417 (net-zero).
