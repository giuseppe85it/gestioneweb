# PROMPT 48 — Fix configurazione barriera scope PROMPT 47 (2026-05-15)

## Stato: **PASS**

Bug runtime di Giuseppe risolto. Barriera **resta attiva** su tutto il resto del clone, solo lo scope `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (PROMPT 47) e' ora correttamente configurato per `/next/centro-controllo`.

---

## Causa esatta del blocco

Il PROMPT 47 ha definito la costante stringa `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE = "centro_controllo_legame_write"` nel writer `agganciaSegnalazioneAManutenzioneEsistenteWriter.ts` e l'ha usata in `runWithCloneWriteScopedAllowance(...)`. **Tre cose mancavano in `cloneWriteBarrier.ts`**:

1. **La costante non era definita lato barriera** — `cloneWriteBarrier.ts` non aveva `CENTRO_CONTROLLO_LEGAME_*` (path autorizzati + storage keys + scope name).
2. **Lo scope non era nella type union di `runWithCloneWriteScopedAllowance`** (riga 456-468) — TypeScript lo accettava solo per inferenza largaggine; il counter veniva incrementato comunque a runtime, ma...
3. **Mancava la clausola di autorizzazione in `isAllowedCloneWriteException`** — quando il writer chiamava `assertCloneWriteAllowed("storageSync.setItemSync", { key: "@segnalazioni_autisti_tmp" })`, nessuna delle clausole `if (pathname === ... && hasCloneWriteScopedAllowance(...))` matchava lo scope nuovo. La funzione cadeva fino alla `return false` finale e l'`assertCloneWriteAllowed` lanciava `CloneWriteBlockedError`.

In pratica: il writer si avvolgeva nello scope (counter > 0) correttamente, ma la barriera **non sapeva** che quello scope esistesse e quindi rifiutava la scrittura.

### Path runtime reale dell'utente

`/next/centro-controllo` (tab "Archivio storico" interno, non sub-path). Confermato da [src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx) — il bottone "Sgancia link orfano" appare nella riga espansa dell'Archivio, che e' renderizzato sotto la route `/next/centro-controllo`.

### Path attualmente autorizzati nello scope (POST-FIX)

`/next/centro-controllo` (e sub-path se mai serviranno — il check usa `pathname === entry || pathname.startsWith(`${entry}/`)`).

---

## Fix applicato

### File: [src/utils/cloneWriteBarrier.ts](../../src/utils/cloneWriteBarrier.ts)

**Cambio 1 — Definizione costanti dello scope** (dopo `CHIUSURA_DA_EVENTO_WRITE_SCOPE` riga 160):

```ts
// PROMPT 47/48 — scope dedicato per aggancio/sgancio legame manutenzione lato CC
// (writer agganciaSegnalazioneAManutenzioneEsistente + sganciaLegameOrfano).
// Path autorizzato: SOLO /next/centro-controllo (Archivio Storico interno). Le storage
// keys includono @manutenzioni (writer T1 patch back-link su target stand-alone) +
// @segnalazioni_autisti_tmp + @controlli_mezzo_autisti (patch sorgente).
const CENTRO_CONTROLLO_LEGAME_ALLOWED_WRITE_PATHS = ["/next/centro-controllo"] as const;
const CENTRO_CONTROLLO_LEGAME_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
]);
const CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE = "centro_controllo_legame_write";
```

**Cambio 2 — Helper di check path** (dopo `isAllowedChiusuraDaEventoWritePath`):

```ts
function isAllowedCentroControlloLegameWritePath(pathname: string): boolean {
  return CENTRO_CONTROLLO_LEGAME_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}
```

**Cambio 3 — Type union di `runWithCloneWriteScopedAllowance`** (riga 456-468): aggiunta `| typeof CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`.

**Cambio 4 — Clausola di autorizzazione in `isAllowedCloneWriteException`** (accanto alla clausola sorella `CHIUSURA_DA_EVENTO_WRITE_SCOPE`):

```ts
if (
  isAllowedCentroControlloLegameWritePath(pathname) &&
  hasCloneWriteScopedAllowance(CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE) &&
  kind === "storageSync.setItemSync"
) {
  return CENTRO_CONTROLLO_LEGAME_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
}
```

Nessuna altra deroga modificata. Nessuna deroga rimossa. La barriera resta attiva su tutto il resto.

---

## Verifica

| Tool | Esito |
|------|-------|
| `npx tsc --noEmit` | clean |
| `npx eslint src/utils/cloneWriteBarrier.ts` | clean |
| `npx vitest --no-file-parallelism --pool=forks <writer P47>` | **11/11 pass** (writer P47 invariati) |

I writer P47 [agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts) e [sganciaLegameOrfanoWriter.ts](../../src/next/writers/sganciaLegameOrfanoWriter.ts) non hanno richiesto modifiche: il loro wrapping in `runWithCloneWriteScopedAllowance` era gia' corretto, mancava solo la configurazione lato barriera.

### Test runtime (mockato da vitest)

I test esistenti mockano `cloneWriteBarrier` per i writer, quindi non riproducono il bug runtime (che esiste solo su clone reale `/next/*`). Per riprodurlo serve la sessione browser autenticata di Giuseppe (vedi "Istruzioni per Giuseppe" sotto).

---

## Istruzioni per Giuseppe

Ora puoi tornare su TI298409 e ripetere i 7 clic per sistemarlo (vedi [REPORT_PROMPT47_2026-05-15.md](REPORT_PROMPT47_2026-05-15.md) sezione "Istruzioni operative per Giuseppe — caso TI298409").

1. `/next/centro-controllo` → tab **Archivio storico** → filtra segnalazioni per targa **TI298409**
2. Espandi seg **08/05/2026** "4 gomme di trazione usurate" (id `7d1d8009-...`) → badge giallo **"Link rotto"**
3. Click **"Sgancia link orfano"** → conferma (popup browser confirm, **non** popup barriera)
4. Espandi di nuovo → click **"Aggancia a manutenzione esistente"**
5. Seleziona **"CAMBIO GOMME asse: Posteriore Kumho" del 12/05/2026** (id `1778587360877`, Valtellina Pneumatici)
6. Conferma → segnalazione chiusa automaticamente

Se il popup "Scrittura bloccata dal barrier clone" appare ancora, riportalo: significherebbe che il pathname runtime e' diverso da `/next/centro-controllo` (es. `/next/centro-controllo/qualcosa`) e va aggiunto al check del path.

---

## Conferme di sicurezza

- ✅ Barriera resta attiva: `assertCloneWriteAllowed` e `isCloneRuntime` invariati.
- ✅ Deroghe esistenti invariate: nessuna modifica a `MANUTENZIONE_DAFARE_CREATE_*`, `CHIUSURA_DA_EVENTO_*`, `SEGNALAZIONI_*`, `CONTROLLI_*`, `RICHIESTE_*`, `DELETE_MEZZO_*`, `ARCHIVIO_HIDE_*`, ecc.
- ✅ Path autorizzato solo `/next/centro-controllo` (non altri).
- ✅ Storage keys autorizzate solo `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` (le tre toccate dai writer P47).
- ✅ Lo scope opera solo quando `hasCloneWriteScopedAllowance(CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE)` ritorna true (counter > 0) — ovvero solo durante la callback dei due writer.
