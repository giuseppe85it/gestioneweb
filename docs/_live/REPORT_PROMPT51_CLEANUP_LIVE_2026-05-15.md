# PROMPT 51 — Ripulitura timestamp sporchi su Firestore live (2026-05-15)

## Stato: **PASS**

Cleanup live applicato a Firestore. 1 segnalazione corretta (R1 + R2 entrambi sullo stesso record TI298409). Tutte e 3 le assertions di verifica pass.

---

## FASE 0 — Backup

Script: [scripts/oneoff/backup-firestore-prompt51-20260515.cjs](../../scripts/oneoff/backup-firestore-prompt51-20260515.cjs)

```
BACKUP_DIR=C:\tmp\backup_firestore_prompt51_20260515_185610
  [export] @manutenzioni → 73 record
  [export] @segnalazioni_autisti_tmp → 37 record
  [export] @controlli_mezzo_autisti → 351 record   (era 350 nel backup mattutino — 1 nuovo)
```

Backup fresco fatto **prima** delle scritture cleanup. In caso di problemi, il restore puo' partire da qui usando lo stesso pattern di [restore-firestore-prompt44-20260515.cjs](../../scripts/oneoff/restore-firestore-prompt44-20260515.cjs).

---

## FASE 1 — DRY RUN

Script: [scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs](../../scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs)

### Logica heuristica
- **CHECK_R1**: per ogni segnalazione/controllo con `chiusuraRefId` valorizzato, se la manutenzione target esiste e `chiusuraData` cade in un giorno (`YYYY-MM-DD`) differente dalla `data` della manutenzione target → correggi `chiusuraData = parseISO(target.data)` (mezzanotte locale).
- **CHECK_R2**: per ogni segnalazione con `chiusuraRefId` valorizzato e `dataPresaInCarico` valorizzato, se `dataPresaInCarico` cade nello stesso giorno di `chiusuraData` (caso aggancio retroattivo P47 PRE-fix) o nello stesso giorno della manutenzione target o nello stesso giorno di oggi → rimuovi `dataPresaInCarico` (set `null`).

### Output DRY ([cleanup-timestamps-live-DRY.json](../../scripts/oneoff/cleanup-timestamps-live-DRY.json))

```
[live] manutenzioni=73 segnalazioni=37 controlli=351
CHECK_R1 chiusuraData mismatch: 1
  segnalazione 7d1d8009-69af-4578-a8ef-060d1d4f5766 (TI298409 RICCARDO FENDERICO) 15/05/2026 → 12/05/2026
CHECK_R2 dataPresaInCarico artefatto: 1
  segnalazione 7d1d8009-69af-4578-a8ef-060d1d4f5766 (TI298409 RICCARDO FENDERICO) dataPresaInCarico 2026-05-15 → null  [stessoGiornoDiChiusuraDi]

Totale record da correggere: 2
```

**Esattamente il caso TI298409 di Giuseppe**. Nessun altro record nel sistema risulta sporcato — lo script `agganciaSegnalazioneAManutenzioneEsistente` di PROMPT 47 era stato usato una volta sola (sul caso seg 08/05 → manutenzione 12/05). Decisione automatica (2 < 20): **prosegui automatico a FASE 2**.

---

## FASE 2 — Esecuzione reale

Eseguito con `DRY_RUN=false`. Output [cleanup-timestamps-live-REAL.json](../../scripts/oneoff/cleanup-timestamps-live-REAL.json):

```
[apply] DRY_RUN=false — applico correzioni su Firestore live
  [write] segnalazioni patched=1
```

Una sola write su `storage/@segnalazioni_autisti_tmp`: la segnalazione `7d1d8009-...` patched per entrambe R1 e R2 in una singola operazione `set(merge: false)`. `@manutenzioni` e `@controlli_mezzo_autisti` **non toccate** (nessun record da correggere).

---

## FASE 3 — Verifica post

Script: [scripts/oneoff/verify-ti298409-post-cleanup-2026-05-15.cjs](../../scripts/oneoff/verify-ti298409-post-cleanup-2026-05-15.cjs)

### Dump post-correzione

**Segnalazione `7d1d8009-...`** (08/05 RICCARDO FENDERICO):
```
targa: TI298409
autistaNome: RICCARDO FENDERICO
stato: chiusa
letta: true
linkedLavoroId: 1778587360877
dataPresaInCarico: <null>           ← R2 OK
chiusuraDi: manutenzione
chiusuraRefId: 1778587360877
chiusuraData: 1778536800000  (12/05/2026 00:00)   ← R1 OK
```

**Manutenzione `1778587360877`** (12/05 CAMBIO GOMME Kumho):
```
targa: TI298409
stato: eseguita
data: 2026-05-12
fornitore: VALTELLINA PNEUMATICI
origineTipo: segnalazione
origineRefId: 7d1d8009-69af-4578-a8ef-060d1d4f5766
```

### Assertions

- **R1**: `chiusuraData === 12/05/2026 mezzanotte` → **OK**
- **R2**: `dataPresaInCarico === null` → **OK**
- **Linked**: `segnalazione.linkedLavoroId === manutenzione.id` + `manutenzione.origineRefId === segnalazione.id` → **OK** (legame bidirezionale coerente)

---

## Effetto su frase storia

Con i fix PROMPT 49 (cross-read sorgente) + PROMPT 50 (no `dataPresaInCarico` artefatto) gia' deployati, e i dati ora coerenti dopo P51, la frase storia attesa su entrambi i lati:

**Manutenzione 12/05 (`/next/centro-controllo` → Archivio Manutenzioni):**
> Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI.

**Segnalazione 08/05 (Archivio Segnalazioni):**
> Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente.

(Il suffisso "Chiusa manualmente" rimane perche' `chiusuraDi: "manutenzione"` mappa a `modalitaChiusura: "manuale"` di default — limitazione P49 documentata, fix dedicato in PROMPT successivo se necessario.)

---

## Istruzioni per Giuseppe — hard refresh + verifica

1. **Hard refresh** del browser su `/next/centro-controllo` (Ctrl+F5 o Cmd+Shift+R). Senza hard refresh, il clone potrebbe servire il vecchio snapshot in cache.
2. Vai a **Archivio storico** → tab Segnalazioni → filtra **TI298409**
3. Espandi la segnalazione **08/05 "4 gomme di trazione usurate"**. **Atteso**:
   - Badge giallo "Link rotto" → **NON DEVE essere presente** (legame valido).
   - Nella sezione "Stato" appare la frase: `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Chiusa manualmente."`
   - **NIENTE** "presa in carico il 15/05".
4. Vai a tab Manutenzioni → cerca TI298409 → riga "CAMBIO GOMME posteriore Kumho del 12/05" → espandi. **Atteso**:
   - Frase storia: `"Segnalazione di RICCARDO FENDERICO del 08/05/2026, eseguita il 12/05/2026. Risolta dall'intervento officina VALTELLINA PNEUMATICI."`

Se vedi frasi diverse o residui di "presa in carico 15/05" o "chiusa 15/05", segnala — i dati Firestore sono ora coerenti, quindi una residua incoerenza visiva indicherebbe un bug residuo in un reader (es. proiezione che non ha letto chiusuraData aggiornata).

---

## File toccati

### Nuovi
- [scripts/oneoff/backup-firestore-prompt51-20260515.cjs](../../scripts/oneoff/backup-firestore-prompt51-20260515.cjs)
- [scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs](../../scripts/oneoff/cleanup-timestamps-live-2026-05-15.cjs)
- [scripts/oneoff/verify-ti298409-post-cleanup-2026-05-15.cjs](../../scripts/oneoff/verify-ti298409-post-cleanup-2026-05-15.cjs)

### Output JSON
- [scripts/oneoff/cleanup-timestamps-live-DRY.json](../../scripts/oneoff/cleanup-timestamps-live-DRY.json)
- [scripts/oneoff/cleanup-timestamps-live-REAL.json](../../scripts/oneoff/cleanup-timestamps-live-REAL.json)

### Backup Firestore pre-cleanup
`C:\tmp\backup_firestore_prompt51_20260515_185610\` — restore manuale possibile usando il pattern di `restore-firestore-prompt44-20260515.cjs`.

### Codice runtime
**NESSUNA modifica** a `src/`. P50 aveva gia' fixato i writer; P51 si occupa solo della pulizia dati live.
