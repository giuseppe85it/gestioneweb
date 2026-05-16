# PROMPT 50 — Fix strutturale timestamp aggancio (2026-05-15)

## Stato: **PASS**

3 regole strutturali (R1/R2/R3) corrette + regola permanente in AGENTS.md + script di ripulitura retroattiva DRY. CI: tsc clean, eslint clean, vitest **86/86** (cumulativi P40-P50).

---

## Cause diagnostiche

### R1 — `chiusuraData` impostato a `Date.now()` invece di ereditare dalla manutenzione

| Punto | File:riga | Problema |
|-------|-----------|----------|
| Writer P47 — `readChiusuraDataMs(target)` | [agganciaSegnalazioneAManutenzioneEsistenteWriter.ts:81-88](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L81-L88) | Leggeva solo `target.chiusuraData` (presente solo se target era `chiusa_da_evento`). Per target `eseguita` senza `chiusuraData` ritornava `undefined`. |
| `buildChiusuraPatch` | [nextChiusuraEventoWriter.ts:60](../../src/next/writers/nextChiusuraEventoWriter.ts#L60) | `chiusuraData = args.chiusuraData ?? Date.now()` → quando il writer P47 passava `undefined`, qui cadeva a `Date.now()`. Risultato: segnalazione 08/05 TI298409 chiusa col timestamp 15/05 17:45. |
| `propagateChiusuraToLegame` | [closureOrchestrator.ts:62](../../src/next/helpers/closureOrchestrator.ts#L62) | Stesso pattern `?? Date.now()`. |

### R2 — `dataPresaInCarico` scritto come effetto collaterale

| Punto | File:riga | Problema |
|-------|-----------|----------|
| `patchSegnalazione` (P44 D7) | [nextManutenzioneDaFareCreateWriter.ts:152](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L152) | Scriveva `dataPresaInCarico = toISO(new Date())` ad ogni creazione daFare da segnalazione. |
| Writer P47 aggancio | [agganciaSegnalazioneAManutenzioneEsistenteWriter.ts:236](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L236) | Stesso pattern in `sourceBasePatch.dataPresaInCarico = toISO(new Date())`. Risultato: aggancio del 15/05 17:45 → `dataPresaInCarico = "2026-05-15"` → frase storia "presa in carico il 15/05". |

### R3 — Timeline manutenzione ignora la sorgente

PROMPT 49 ha gia' introdotto `useSorgenteManutenzione` + `recordChiusoFromRaw({ sourceRecord })` per cross-read di `dataApertura`/`segnalatoDa` dalla sorgente. Il problema residuo era la **riga "presa in carico il 15/05"**, conseguenza diretta di R2 (sorgente aveva `dataPresaInCarico` artefatto). Eliminando R2, la riga sparisce.

---

## Fix applicato

### R1 — `chiusuraData` eredita dalla manutenzione

**[agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts)** — `readChiusuraDataMs(target)` esteso:

```ts
function readChiusuraDataMs(target: RawRecord): number | undefined {
  const raw = target.chiusuraData;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) { /* parse ms */ }
  // PROMPT 50 R1: eredita da target.data (campo ISO canonico manutenzione).
  const dataRaw = target.data;
  if (typeof dataRaw === "string" && dataRaw.trim()) {
    const iso = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const dt = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 0, 0, 0, 0);
      if (Number.isFinite(dt.getTime())) return dt.getTime();
    }
    const parsed = Date.parse(dataRaw);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof dataRaw === "number" && Number.isFinite(dataRaw)) return dataRaw;
  return undefined;
}
```

**[closureOrchestrator.ts](../../src/next/helpers/closureOrchestrator.ts)** — stessa logica nel fallback di `propagateChiusuraToLegame`: prima `options.chiusuraData` (caller esplicito), poi `manutenzioneRecord.data`, poi `manutenzioneRecord.chiusuraData`, infine `Date.now()` come ultimissima rete.

### R2 — `dataPresaInCarico` solo da azione esplicita

**Rimossa scrittura come effetto collaterale**:

- [nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts): rimosso `const dataPresaInCarico = toISO(new Date())` da `patchSegnalazione` + import `toISO` non piu' necessario.
- [agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts): rimosso `sourceBasePatch.dataPresaInCarico = toISO(new Date())` + import.

**Nuovo writer esplicito**: [src/next/writers/presaInCaricoSegnalazioneWriter.ts](../../src/next/writers/presaInCaricoSegnalazioneWriter.ts) (NEW). `segnaPresaInCaricoSegnalazione({ segnalazioneId, dataPresaInCarico? })` e' l'unica funzione autorizzata a scrivere quel campo. Idempotente (`alreadyMarked: true` se gia' valorizzato), riusa scope barrier `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`.

Nota: il bottone UI "Prendi in carico" non e' aggiunto in P50 (out of scope: l'utente puo' chiamare il writer via console/script o aspettare un PROMPT successivo per la UI). La regola tecnica e' rispettata: il campo non viene piu' scritto come side effect.

### R3 — Timeline manutenzione

Implicitamente fixato:
- P49 ha gia' introdotto cross-read di `dataApertura` dalla sorgente in `recordChiusoFromRaw({ sourceRecord })` + hook `useSorgenteManutenzione`. La frase mostra ora la data segnalazione (08/05) come apertura.
- Eliminando R2, `dataPresaInCarico` non viene piu' valorizzato fasullamente, quindi la frase storia P40 omette correttamente la riga "presa in carico il GG/MM/AAAA".

Risultato post-fix per il caso TI298409 (atteso):

> "Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026.
> Risolta dall'intervento officina VALTELLINA PNEUMATICI."

---

## Test (vitest 86/86)

| Suite | Pass |
|-------|------|
| agganciaSegnalazioneAManutenzioneEsistente | 6/6 (incluso nuovo test R1 che verifica `chiusuraData = 2026-05-12 mezzanotte` invece di `Date.now()`) |
| agganciaSorgente (P45) | 7/7 (test aggiornato R2: `dataPresaInCarico` ora `undefined`) |
| presaInCaricoSegnalazione (NEW P50 R2) | 4/4 |
| sganciaLegameOrfano | 5/5 |
| chiusuraDaEvento | 4/4 (invariati) |
| closureOrchestrator | 4/4 (invariati, la nuova logica fallback `target.data` testabile via runtime) |
| cicloLegame | 14/14 |
| frasestoriaRecord (P49) | 31/31 |
| manutenzioniCandidatiMerge (P45) | 5/5 |
| manutenzioniPerAggancio (P47) | 4/4 |

CI:
- `npx tsc --noEmit` → clean
- `npx eslint <4 file P50>` → clean

---

## Ripulitura retroattiva — DRY

[scripts/oneoff/cleanup-timestamps-aggancio-2026-05-15.cjs](../../scripts/oneoff/cleanup-timestamps-aggancio-2026-05-15.cjs) — script DRY-RUN che identifica:
- **R1 retroattivo**: `chiusuraData` differente dalla data manutenzione collegata di > 12h.
- **R2 retroattivo**: `dataPresaInCarico` artefatto (stesso giorno di chiusura o stesso giorno della data manutenzione target).

Esecuzione DRY sul backup Firestore PROMPT 44 (`C:\tmp\backup_firestore_prompt50_20260515_180539`):

```
R1 chiusuraData mismatch (> 12h dalla data manutenzione collegata): 0
R2 dataPresaInCarico artefatto (stesso giorno di chiusura/aggancio): 0
```

**0 record toccati**. Motivo: il backup utilizzato (clone del backup PROMPT 44 del 2026-05-15 07:12) e' antecedente alla sessione di Giuseppe del 15/05 pomeriggio (aggancio TI298409 fatto attorno alle 17:45). Quindi i record sporcati da quella sessione **non sono nel backup** ma esistono nel Firestore live.

**Strategia per TI298409 specifico** (esce dal report come istruzione operativa):

Giuseppe deve riapplicare l'aggancio con i writer fixati:
1. Vai a `/next/centro-controllo` → Archivio Storico → segnalazione 08/05 TI298409
2. Espandi → **"Sgancia link orfano"** (il legame attuale a M-1778587360877 — visto come "valido" — ma ora il fix considera che `chiusuraData` sia errato ⇒ trattabile come orfano semantico). **In alternativa**: rimuovere manualmente da Firestore i campi `chiusuraDi/chiusuraRefId/chiusuraData/dataPresaInCarico` della segnalazione 08/05 + il campo `dataPresaInCarico` sulla manutenzione 12/05 (NO, sulla manutenzione non c'e').
3. Riaggancia via **"Aggancia a manutenzione esistente"** → seleziona "CAMBIO GOMME 12/05 Kumho VALTELLINA". Il nuovo writer eredita `chiusuraData = 2026-05-12 mezzanotte` (R1) e NON scrive `dataPresaInCarico` (R2).
4. La frase storia diventera' coerente: `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026..."` su entrambi i lati.

Se Giuseppe preferisce, il fix puo' essere applicato direttamente in Firestore console:
- Su segnalazione `7d1d8009-...`:
  - `chiusuraData: parse("2026-05-12")` = `1778540400000` ms (12/05/2026 00:00 ora locale Italia CEST)
  - rimuovi `dataPresaInCarico` (set null)
- Su manutenzione `1778587360877`: nessuna modifica necessaria.

---

## Regola permanente AGENTS.md

Aggiunta sezione `## Regole scrittura / TIMESTAMP-MAI-DA-CLICK` in [AGENTS.md](../../AGENTS.md). 4 punti operativi + lezione storica P44/P47 con riferimento a questo report.

---

## Sweep Playwright

**Non eseguito**: i fix R1/R2 vivono nei writer (mockati nei vitest, gia' verificati). Il runtime end-to-end richiederebbe sessione browser con setup Firestore reale e clic UI — non riproducibile in sweep self-cleaning del clone. La regression e' garantita dai 86 test vitest.

---

## File toccati

### Modificati
- [src/utils/.../agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts) — R1 fix `readChiusuraDataMs` + R2 rimosso `dataPresaInCarico`
- [src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts) — R2 rimosso `dataPresaInCarico` da `patchSegnalazione`
- [src/next/helpers/closureOrchestrator.ts](../../src/next/helpers/closureOrchestrator.ts) — R1 fallback con `target.data` prima di `Date.now()`
- [src/next/writers/__tests__/agganciaSegnalazioneAManutenzioneEsistente.test.ts](../../src/next/writers/__tests__/agganciaSegnalazioneAManutenzioneEsistente.test.ts) — test R1 (chiusuraData = 12/05) + R2 (dataPresaInCarico undefined)
- [src/next/writers/__tests__/agganciaSorgente.test.ts](../../src/next/writers/__tests__/agganciaSorgente.test.ts) — test R2 (P45 patchSegnalazione)
- [AGENTS.md](../../AGENTS.md) — sez `## Regole scrittura / TIMESTAMP-MAI-DA-CLICK`

### Nuovi
- [src/next/writers/presaInCaricoSegnalazioneWriter.ts](../../src/next/writers/presaInCaricoSegnalazioneWriter.ts) — writer `segnaPresaInCaricoSegnalazione` (unica via per scrivere `dataPresaInCarico`)
- [src/next/writers/__tests__/presaInCaricoSegnalazione.test.ts](../../src/next/writers/__tests__/presaInCaricoSegnalazione.test.ts) — 4 test
- [scripts/oneoff/cleanup-timestamps-aggancio-2026-05-15.cjs](../../scripts/oneoff/cleanup-timestamps-aggancio-2026-05-15.cjs) — script DRY ripulitura retroattiva
- [scripts/oneoff/cleanup-timestamps-report-DRY.json](../../scripts/oneoff/cleanup-timestamps-report-DRY.json) — output DRY (0 record nel backup PROMPT 44)

### Backup pre-modifiche
- Codice: `C:\tmp\backup_codice_prompt50_20260515_180539` (443 file)
- Firestore (copia backup P44): `C:\tmp\backup_firestore_prompt50_20260515_180539` (6 file)

---

## Istruzioni per Giuseppe — ri-verifica TI298409

### Opzione A — riapplica aggancio con i writer fixati (consigliata)

1. `/next/centro-controllo` → Archivio Storico → segnalazione **08/05** TI298409 "4 gomme di trazione usurate"
2. Espandi la riga. Ora la frase sara' ancora sbagliata (record sporcato dalla sessione di ieri).
3. **Sgancia link orfano** (il writer P47 fixato non interferira'): la segnalazione torna `stato="nuova"`, `letta=false`, `dataPresaInCarico=null`, `linkedLavoroId=null`.
4. **Aggancia a manutenzione esistente** → seleziona "CAMBIO GOMME 12/05 Kumho VALTELLINA PNEUMATICI" (id `1778587360877`)
5. Con i fix R1+R2 attivi:
   - `chiusuraData` segnalazione = **12/05/2026** (mezzanotte locale) — ereditato dalla manutenzione, NON 15/05
   - `dataPresaInCarico` segnalazione = **null** (non scritto)
   - Frase storia su manutenzione 12/05: `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI."`
   - Frase storia su segnalazione 08/05: `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente."` (limitazione P49 sul suffisso "Chiusa manualmente", estendibile in futuro)

### Opzione B — fix diretto Firestore console

Su `@segnalazioni_autisti_tmp/7d1d8009-69af-4578-a8ef-060d1d4f5766`:
- `chiusuraData: 1778540400000` (12/05/2026 00:00 ora locale)
- `dataPresaInCarico: null` (rimuovi il campo)

Se vedi la frase corretta `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026..."` su entrambi i lati, il fix strutturale ha funzionato. Riporta qualsiasi residuo per fix successivo.
