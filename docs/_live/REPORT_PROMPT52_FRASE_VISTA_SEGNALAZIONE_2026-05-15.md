# PROMPT 52 — Frase storia mancante su vista segnalazione (2026-05-15)

## Stato: **PASS**

Bug visivo risolto: dopo PROMPT 51 (cleanup live), la riga segnalazione TI298409 mostrava timeline corretta ma **senza la frase storia**. Causa duplice: (1) `ArchivioRowSegnalazione.tsx` non renderizzava `<FraseStoriaRecord>` (a differenza di `ArchivioRowManutenzione` riga compact); (2) `recordChiusoFromRaw` non gestiva il branch `stato === "chiusa"` con `chiusuraData` (caso PROMPT 44 D1 `chiudiSegnalazioneDaEvento`), e inoltre confrontava `stato` case-sensitive (alcune projection NEXT mettono uppercase).

---

## Causa esatta

### Bug 1 — Rendering mancante

[src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx) renderizza titolo + autore + timeline (sempre visibili) ma **non chiama mai `<FraseStoriaRecord>`**. La frase appariva solo dentro `ArchivioRowExpanded` → sub-componente `SegnalazioneExpanded` (PROMPT 47), visibile solo dopo click chevron.

`ArchivioRowManutenzione.tsx` (riga compact) invece renderizza la frase direttamente in [riga 184-187](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx#L184-L187):
```tsx
<FraseStoriaRecord
  {...recordChiusoFromRaw(data, undefined, { sourceRecord })}
  compact
/>
```

L'inconsistenza era voluta? No, semplicemente mai aggiunta sul lato segnalazione.

### Bug 2 — `recordChiusoFromRaw` non gestiva `stato === "chiusa"`

[frasestoriaRecord.ts:201-214](../../src/next/helpers/frasestoriaRecord.ts#L201-L214) (pre-fix) gestiva solo `chiusa_da_evento` e `eseguita`. Per le segnalazioni chiuse via aggancio a manutenzione (PROMPT 44 D1 `chiudiSegnalazioneDaEvento` scrive `stato: "chiusa"` + `chiusuraDi: "manutenzione"` + `chiusuraData`), nessun branch matchava → `modalitaChiusura` undefined, `dataEsecuzione` undefined → frase troncata a `"Segnalazione di X del Y."` senza "eseguita il Z. Chiusa manualmente."

### Bug 3 — `stato` confronto case-sensitive

Visibile durante l'iterazione del fix Bug 1: la projection `nextAutistiDomain.ts:558` mette `stato.toUpperCase()` sui section item delle segnalazioni → `data.stato === "CHIUSA"` (uppercase), mentre `recordChiusoFromRaw` confrontava `stato === "chiusa"` (lowercase). Risultato: anche con Bug 2 fixato, il nuovo branch non matchava perche' case mismatch.

---

## Fix applicato

### Fix Bug 2+3 — `recordChiusoFromRaw`

[src/next/helpers/frasestoriaRecord.ts](../../src/next/helpers/frasestoriaRecord.ts):

**Normalizzazione case-insensitive** dello `stato` letto:
```ts
const statoRaw = readText(record, ["stato"]);
const stato = statoRaw ? statoRaw.toLowerCase() : statoRaw;
```

**Nuovo branch `stato === "chiusa"`** (dopo `eseguita`):
```ts
} else if (stato === "chiusa") {
  // PROMPT 52: segnalazioni/controlli chiusi via aggancio a manutenzione (P44 D1).
  const chiusuraDiText = readText(record, ["chiusuraDi"]);
  if (chiusuraDiText === "gomme_evento") {
    modalitaChiusura = "evento_autisti";
    dataEventoChiusura = readDateRaw(record, ["chiusuraData", "dataChiusura", "dataEsecuzione"]);
  } else {
    modalitaChiusura = "manuale";
  }
  dataEsecuzione = readDateRaw(record, ["chiusuraData", "dataChiusura", "dataEsecuzione"]);
}
```

Mappa:
- `chiusuraDi === "gomme_evento"` → suffisso `Risolta dal cambio gomme del Z.`
- `chiusuraDi === "manutenzione"` (o altro) → suffisso `Chiusa manualmente.`
- `dataEsecuzione` = `chiusuraData` (ms) o fallback `dataChiusura` legacy.

### Fix Bug 1 — Integrazione `<FraseStoriaRecord>` in `ArchivioRowSegnalazione`

[src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx):

Import + chiamata diretta dopo il blocco "Aperta da":
```tsx
import { FraseStoriaRecord } from "../../../components/FraseStoriaRecord";
import { recordChiusoFromRaw } from "../../../helpers/frasestoriaRecord";

// ... dentro il body della riga, dopo "Aperta da..." ...
<FraseStoriaRecord
  {...recordChiusoFromRaw(data as unknown as Record<string, unknown>, "segnalazione")}
  compact
/>
```

Allineato a `ArchivioRowManutenzione`.

---

## Screenshot prima/dopo (Playwright via Simple-Browser-equivalent)

Script ispezione: [scripts/oneoff/inspect-prompt52-segnalazione-frase-2026-05-15.cjs](../../scripts/oneoff/inspect-prompt52-segnalazione-frase-2026-05-15.cjs).

**Prima** ([before-04-expanded.png](screenshots-prompt52-2026-05-15/before-04-expanded.png)) — DOM dump:
```json
{
  "targetText": "...4 gomme di trazione usurate...\nAperta da RICCARDO FENDERICO (badge 1011)\nAPERTA\n08/05/2026 15:30\nRICEVUTA\n—\nCHIUSA\n12/05/2026 00:00",
  "hasExtra": false,
  "hasFraseStoria": false
}
```

**Dopo** ([after-v2-04-expanded.png](screenshots-prompt52-2026-05-15/after-v2-04-expanded.png)) — DOM dump:
```json
{
  "targetText": "...4 gomme di trazione usurate...\nAperta da RICCARDO FENDERICO (badge 1011)\n\nSegnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente.\n\nAPERTA\n08/05/2026 15:30\nRICEVUTA\n—\nCHIUSA\n12/05/2026 00:00",
  "hasExtra": false,
  "hasFraseStoria": true
}
```

La frase storia compatta appare **sotto "Aperta da RICCARDO FENDERICO"** e sopra la timeline. `hasFraseStoria` passa da `false` a `true`. Match esatto del testo atteso da Giuseppe.

---

## CI

| Tool | Esito |
|------|-------|
| `npx tsc --noEmit` | clean |
| `npx eslint <2 file P52>` | clean |
| `npx vitest --pool=forks frasestoriaRecord.test.ts` | **33/33** (28 esistenti + 3 P49 + 2 nuovi P52) |

I 2 test nuovi P52:
- segnalazione `stato="chiusa"` + `chiusuraDi="manutenzione"` + `chiusuraData` → frase con `"eseguita il Z. Chiusa manualmente."` ✓
- segnalazione `stato="chiusa"` + `chiusuraDi="gomme_evento"` → frase con `"Risolta dal cambio gomme del Z."` ✓

---

## File toccati

### Modificati
- [src/next/helpers/frasestoriaRecord.ts](../../src/next/helpers/frasestoriaRecord.ts) — normalizzazione case `stato` + nuovo branch `stato === "chiusa"` con mapping `chiusuraDi`
- [src/next/helpers/__tests__/frasestoriaRecord.test.ts](../../src/next/helpers/__tests__/frasestoriaRecord.test.ts) — 2 test P52
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx) — import + `<FraseStoriaRecord compact />` dopo "Aperta da"

### Nuovi (utility)
- [scripts/oneoff/inspect-prompt52-segnalazione-frase-2026-05-15.cjs](../../scripts/oneoff/inspect-prompt52-segnalazione-frase-2026-05-15.cjs)
- [docs/_live/screenshots-prompt52-2026-05-15/](screenshots-prompt52-2026-05-15/) (8 screenshot before/after + JSON dump DOM)

---

## Istruzioni per Giuseppe

Hard refresh (Ctrl+F5) su `/next/centro-controllo` → Archivio storico → tab Segnalazioni → filtra TI298409 → la riga della seg 08/05 "4 gomme di trazione usurate" deve ora mostrare:

```
TI298409 GOMME                          [Apri dettaglio] [Elimina]
4 gomme di trazione usurate, quasi finite. Da sostituire
Aperta da RICCARDO FENDERICO (badge 1011)
Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente.
[APERTA 08/05 15:30] [RICEVUTA —] [CHIUSA 12/05 00:00]
```

Se la frase appare ancora troncata o assente, ricarica forzando svuotamento cache (Ctrl+Shift+Delete → "Immagini e file memorizzati nella cache" per ultimo'ora).

Per la frase sul **lato Manutenzione 12/05** (Archivio → tab Manutenzioni → TI298409): atteso `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI."` — già funzionante post PROMPT 49 + 51, ma verifica anche quella visivamente.
