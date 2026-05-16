# PROMPT 49 — Fix frase storia post-aggancio (data + autore + propagazione vista segnalazione)

## Stato: **PASS**

Tre cause distinte diagnosticate e corrette. CI: tsc clean, eslint clean, vitest **31/31** (28 pre-esistenti + 3 nuovi P49).

---

## Cause diagnosticate

### Causa A — Data sbagliata nella frase manutenzione (12/05 invece di 08/05)

[src/next/helpers/frasestoriaRecord.ts:173-179](../../src/next/helpers/frasestoriaRecord.ts#L173-L179) — `recordChiusoFromRaw` legge `dataApertura` da `[dataInserimento, createdAt, timestamp, data, dataProgrammata]` **sulla stessa manutenzione**. Per la manutenzione 12/05 pesca `data: "2026-05-12"` (data esecuzione, NON data segnalazione). Il back-link `origineRefId` non veniva mai seguito.

### Causa B — Autore "RICCARDO FENDERICO" mancante

[src/next/helpers/frasestoriaRecord.ts:190-194](../../src/next/helpers/frasestoriaRecord.ts#L190-L194) — `segnalatoDa` letto da `[segnalatoDa, autistaNome, badgeAutista]` **sempre sulla manutenzione**. Il record manutenzione `1778587360877` era stand-alone e non aveva questi campi; l'aggancio P47 scrive solo back-link (`origineTipo/origineRefId/origineRefKey`), non duplica autore/data.

### Causa C — Frase storia non appare su vista segnalazione chiusa

[src/next/domain/nextAutistiDomain.ts:562](../../src/next/domain/nextAutistiDomain.ts#L562) — projection segnalazione: `chiusa: record.chiusa === true`. Dopo `chiudiSegnalazioneDaEvento` (PROMPT 44 D1) il record raw ha `stato: "chiusa"` + `chiusuraDi/RefId/Data` ma NON `chiusa: true` (campo legacy distinto). Quindi `data.chiusa === false` nella projection → [ArchivioRowExpanded.tsx:219](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx#L219) `showChiusura = false` → frase storia non renderizzata. Inoltre `data.dataChiusura` resta `null` perche' il writer P44 D1 scrive `chiusuraData` (canonico) ma non `dataChiusura` (legacy).

---

## Fix applicato

### Fix A+B — Cross-read sorgente in `recordChiusoFromRaw`

[src/next/helpers/frasestoriaRecord.ts](../../src/next/helpers/frasestoriaRecord.ts) — aggiunta firma `recordChiusoFromRaw(raw, tipoOverride?, options?: { sourceRecord?: RawRecord | null })`. Quando `options.sourceRecord` e' presente, `dataApertura`/`dataPresaInCarico`/`segnalatoDa` vengono letti dal record sorgente (segnalazione/controllo) anziche' dalla manutenzione stessa. **Retro-compatibile**: senza il parametro il comportamento e' invariato.

```ts
// Prima (P45 T2)
const dataApertura = readDateRaw(record, ["dataInserimento", "createdAt", ...]);
const segnalatoDaText = readText(record, ["segnalatoDa", "autistaNome", "badgeAutista"]);

// Dopo (P49)
const dataAperturaCandidate = source ? readDateRaw(source, [...]) : undefined;
const dataApertura = dataAperturaCandidate ?? readDateRaw(record, [...]);   // cross-read
const segnalatoDaFromSource = source ? readText(source, [...]) : null;
const segnalatoDaText = segnalatoDaFromSource ?? readText(record, [...]);   // cross-read
```

### Helper async per il cross-read

[src/next/helpers/useSorgenteManutenzione.ts](../../src/next/helpers/useSorgenteManutenzione.ts) (NEW) — hook React che, dato un record manutenzione con back-link `origineTipo`/`origineRefId`/`origineRefKey`, carica via `getItemSync` la sorgente da `@segnalazioni_autisti_tmp` o `@controlli_mezzo_autisti`. Ritorna `null` se manutenzione e' stand-alone o sorgente non esiste (legame orfano). Best-effort: in caso di errore, `null` (il fallback in `recordChiusoFromRaw` usa il record stesso).

### Integrazione UI (Archivio CC)

[src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx):
- `renderManutenzioneExpanded` → trasformato in sub-componente `ManutenzioneExpanded` con `useSorgenteManutenzione`.
- `recordChiusoFromRaw(data, undefined, { sourceRecord })` per la frase storia espansa.
- Dispatcher `ArchivioRowExpanded` aggiornato: `case "manutenzione": body = <ManutenzioneExpanded data={record.data} />`.

[src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx) (riga compact):
- Aggiunto hook `const sourceRecord = useSorgenteManutenzione(data as ...)` dentro `ArchivioRowManutenzione`.
- `recordChiusoFromRaw(data, undefined, { sourceRecord })` per la frase compatta.

### Fix C — Projection `chiusa` per propagazione vista segnalazione

[src/next/domain/nextAutistiDomain.ts:562-573](../../src/next/domain/nextAutistiDomain.ts) — patch projection segnalazione:

```ts
// Prima
chiusa: record.chiusa === true,
dataChiusura: typeof record.dataChiusura === "number" ? record.dataChiusura : null,

// Dopo (PROMPT 49)
chiusa:
  record.chiusa === true ||
  normalizeLowerText(record.stato) === "chiusa" ||
  typeof record.chiusuraData === "number" ||
  Boolean(normalizeOptionalText(record.chiusuraRefId)),
dataChiusura:
  typeof record.dataChiusura === "number"
    ? record.dataChiusura
    : typeof record.chiusuraData === "number"
      ? record.chiusuraData
      : null,
```

Adesso una segnalazione chiusa via `chiudiSegnalazioneDaEvento` (con `chiusuraDi/RefId/Data` canonici PROMPT 44 D1) appare correttamente come `chiusa: true` nella projection, abilitando `showChiusura` su ArchivioRowExpanded. La data esecuzione viene presa da `chiusuraData` quando `dataChiusura` legacy manca.

---

## Test (vitest 31/31)

Aggiunti 3 nuovi casi in `frasestoriaRecord.test.ts`:
- **P49 A+B** (scenario TI298409 simulato): manutenzione 12/05 stand-alone + sorgente segnalazione 08/05 RICCARDO FENDERICO → frase `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI."` ✓
- **Fallback senza sourceRecord** (legame orfano): frase pesca data manutenzione → `"Segnalazione del 12/05/2026, eseguita il 12/05/2026..."` (comportamento pre-49, retro-compat) ✓
- **sourceRecord sovrascrive autistaNome** del record manutenzione → priorita' alla sorgente ✓

I 28 test pre-esistenti continuano a passare (estensione retro-compatibile).

### CI

| Tool | Esito |
|------|-------|
| `npx tsc --noEmit` | clean |
| `npx eslint <5 file>` | clean |
| `npx vitest --pool=forks <frasestoriaRecord.test.ts>` | **31/31** |

---

## Sweep runtime

Il fix vive nel pattern React (hook + cross-read async), quindi il check Playwright statico non e' riproducibile senza una sessione Firestore reale con TI298409 nello stato post-aggancio. **Verifica runtime via Giuseppe** (vedi istruzioni sotto).

---

## Decisioni autonome

1. **Estensione retro-compatibile**: `options.sourceRecord` e' opzionale. Le superfici che non lo passano (NextDossierMezzoPage, NextManutenzioniPage, NextMappaStoricoPage) **non sono state toccate** — fallback al comportamento pre-49 (legge dalla manutenzione). Solo Archivio CC (Expanded + riga compact) e' aggiornato. Estendere alle altre superfici in PROMPT successivo se necessario.
2. **Hook async** (`useSorgenteManutenzione`) invece di passare lo snapshot dal parent: meno invasivo, ogni componente fa il proprio cross-read on mount. Costo: una `getItemSync` per riga manutenzione visibile. Accettabile (getItemSync sincrono sul localStorage).
3. **Best-effort senza `setState(null)` esplicito**: se la sorgente non e' trovata, il hook mantiene lo stato precedente (default `null`). Eslint-friendly e semanticamente identico per il consumer.
4. **No modifica a `segnalazioneToRecordChiuso`** in ArchivioRowExpanded (la riga segnalazione espansa). Quella funzione gia' legge `data.autistaNome` dalla projection segnalazione, e la projection era gia' corretta (vedi PROMPT 45 T2). Il fix C agisce a monte (projection `chiusa` + `dataChiusura`).
5. **`modalitaChiusura: "manuale"` resta default** sulla vista segnalazione chiusa via manutenzione (`chiusuraDi === "manutenzione"`). Il suffisso diventa "Chiusa manualmente." invece di un piu' specifico "Risolta da manutenzione del <data>". Limitazione accettata in P49; estendibile in futuro con nuova `ModalitaChiusura: "manutenzione"`.

---

## File toccati

### Modificati
- [src/next/helpers/frasestoriaRecord.ts](../../src/next/helpers/frasestoriaRecord.ts) — `recordChiusoFromRaw(raw, tipoOverride?, options?)` con `options.sourceRecord`
- [src/next/helpers/__tests__/frasestoriaRecord.test.ts](../../src/next/helpers/__tests__/frasestoriaRecord.test.ts) — 3 nuovi test P49
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx) — `renderManutenzioneExpanded` → sub-componente `ManutenzioneExpanded` con hook
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx) — hook nel componente + parametro `sourceRecord`
- [src/next/domain/nextAutistiDomain.ts](../../src/next/domain/nextAutistiDomain.ts) — projection `chiusa` + `dataChiusura` arricchite

### Nuovi
- [src/next/helpers/useSorgenteManutenzione.ts](../../src/next/helpers/useSorgenteManutenzione.ts) — hook React per cross-read sorgente

---

## Istruzioni per Giuseppe — verifica TI298409

Ricontrolla TI298409 dopo aver eseguito i 7 clic di PROMPT 47/48. La frase storia deve ora essere coerente da entrambi i lati:

### Lato manutenzione 12/05 (id `1778587360877`)
1. `/next/centro-controllo` → Archivio Storico → tab Manutenzioni → cerca TI298409
2. Trova la riga "CAMBIO GOMME posteriore Kumho del 12/05/2026" → espandi
3. **Atteso**: frase storia mostra
   `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI."`
4. La data 08/05 e' presa dalla segnalazione collegata (`origineRefId`), il nome autore anche.

### Lato segnalazione 08/05 (id `7d1d8009-...`)
1. Stesso archivio → tab Segnalazioni → cerca TI298409
2. Trova "4 gomme di trazione usurate" del 08/05 → espandi
3. **Atteso**: sezione "Stato" mostra la frase storia (e non "Stato corrente: PRESA_IN_CARICO" come prima del fix)
4. La frase storia su questo lato dice qualcosa come
   `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente."`
   (limitazione di P49: il suffisso "Chiusa manualmente" deriva da `modalitaChiusura: "manuale"` di default per `chiusuraDi === "manutenzione"`; estendibile in futuro)

Se invece di queste frasi vedi ancora "Segnalazione del 12/05" oppure "Stato corrente: PRESA_IN_CARICO", segnala — c'e' una superficie non coperta.
