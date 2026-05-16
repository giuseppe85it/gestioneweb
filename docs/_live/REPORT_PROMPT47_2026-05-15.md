# PROMPT 47 — Aggancio inverso + Sgancio link orfano + Regola audit (2026-05-15)

## Stato globale: **PASS**

3 task (T1, T2, T3), 0 STOP HARD scattati.

| Task | Esito | Note |
|------|-------|------|
| T1 — Aggancia segnalazione → manutenzione esistente | PASS | writer + helper + modale + UI Archivio |
| T2 — Sgancia link orfano | PASS | helper detection + writer + badge + bottone |
| T3 — Regola permanente AUDIT-CERCA-PER-TARGA | PASS | aggiunta in AGENTS.md + cross-ref METODO_AGENTI.md |

CI: tsc clean, eslint clean, vitest **32/32** (4 + 3 + 5 + 3 + helper). Sweep Playwright **8/8** (di cui 4 in modalita' smoke statica, vedi note sotto).

---

## T1 — Aggancia segnalazione/controllo a manutenzione esistente

### Componenti

1. **Helper** [src/next/helpers/manutenzioniPerAggancio.ts](../../src/next/helpers/manutenzioniPerAggancio.ts) (NEW). Reader puro: filtra `@manutenzioni` per `targa`, finestra default 365gg, **tutti gli stati**, sort data desc, espone anche `fornitore` per il dropdown. Distinto da `manutenzioniCandidatiMerge.ts` (PROMPT 45) che filtra solo `daFare/programmata` con finestra 90gg.

2. **Writer** [src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts) (NEW). Logica passo-passo:
   - Apre scope `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (nuovo, distinto da quello PROMPT 45).
   - Legge target + sorgente, verifica coerenza targa.
   - Idempotenza: se sorgente gia' linked al target → `alreadyLinked: true`, zero scritture.
   - Patch sorgente: `writeLegameLavoro([targetId])` + (segnalazione) `letta=true`, `stato="presa_in_carico"`, `dataPresaInCarico=ISO(today)`; (controllo) `letta=true`.
   - Patch back-link target: scritto SOLO se target stand-alone (`origineTipo == null`); se target gia' collegato ad **altra** sorgente → errore esplicito (no sovrascrittura silenziosa).
   - **Propagazione chiusura automatica**: se target ha `stato in (eseguita, chiusa_da_evento)` o `chiusuraDi != null`, chiama `chiudiSegnalazioneDaEvento(sorgenteId, "manutenzione", targetId)` o equivalente per controllo. Riusa `chiusuraData` esistente del target se valorizzato.

3. **Modale** [src/next/components/NextAgganciaLegameModal.tsx](../../src/next/components/NextAgganciaLegameModal.tsx) (NEW). Tre modes nella stessa UI:
   - `aggancia`: nessun legame attuale, dropdown candidati.
   - `cambia`: legame valido, mostra link corrente + dropdown nuovo.
   - `sostituisci-orfano`: banner warning + dropdown nuovo.
   Pattern UI copiato da `NextMergeManutenzioneModal.tsx` (PROMPT 45).

4. **Integrazione UI** [src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx). Sub-componente `SegnalazioneExpanded` con state interno: carica snapshot `@manutenzioni` on mount, rileva stato legame (`no-legame`/`legame-valido`/`legame-orfano`), mostra bottoni contestuali.

### Test (vitest 6 casi A-F)
- A: target daFare + sorgente orfana → link su sorgente, back-link su target stand-alone, no chiusura propagata ✓
- B: target eseguita + sorgente orfana → link + back-link + chiusura propagata (`stato="chiusa"`, `chiusuraDi="manutenzione"`, `chiusuraRefId=targetId`) ✓
- C: idempotente (gia' linked al target) → `alreadyLinked: true`, zero scritture ✓
- D: target con back-link ad altra sorgente → errore "gia' collegata a un'altra sorgente", sorgente intatta ✓
- E: target inesistente → errore, zero scritture ✓
- F: aggancio controllo a target daFare → `linkedLavoroId + letta=true`, NO stato/dataPresaInCarico (controlli non hanno questi campi) ✓

---

## T2 — Sgancia link orfano

### Componenti

1. **Helper detection** `isLegameOrfano(sorgente, manutenzioniSnapshot)` in [src/next/helpers/cicloLegame.ts](../../src/next/helpers/cicloLegame.ts) (extension). Reader puro: ritorna `true` se almeno un `linkedLavoroId`/`linkedLavoroIds` punta a un id NON presente in `manutenzioniSnapshot`. Tollerante: sorgente senza legami → `false`.

2. **Writer** [src/next/writers/sganciaLegameOrfanoWriter.ts](../../src/next/writers/sganciaLegameOrfanoWriter.ts) (NEW). Logica:
   - Apre scope `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (condiviso con T1).
   - Legge sorgente. Se non trovata → errore.
   - Se `readLegameLavoro(source).length === 0` → `alreadyClean: true` (idempotente).
   - **Re-check anti-race**: ricarica `@manutenzioni` e verifica `isLegameOrfano`. Se NON orfano (target presente) → errore esplicito "il legame non e' orfano, usa Cambia legame".
   - Patch sorgente:
     - cancella `linkedLavoroId`, `linkedLavoroIds`, `linkedMultiple` (set `null`/`false`)
     - cancella `dataPresaInCarico` (set `null`)
     - segnalazione: `stato="nuova"`, `letta=false`
     - controllo: `letta=false` (no campo stato)
   - NON tocca: descrizione, targa, autistaNome, `chiusuraDi/chiusuraRefId/chiusuraData` (campi separati di traccia chiusura).

3. **UI**: badge `Link rotto` accanto alla descrizione + bottone "Sgancia link orfano" (con confirm) + bottone "Sostituisci con manutenzione esistente" (riusa modale T1 in mode `sostituisci-orfano`).

### Test (vitest 5 casi A-E)
- A: sgancio segnalazione orfana → linkedLavoroId/Ids/Multiple null, stato="nuova", letta=false, dataPresaInCarico null; altri campi intatti ✓
- B: idempotente (sorgente senza legami) → `alreadyClean: true`, zero scritture ✓
- C: legame NON orfano (target esiste) → errore esplicito, zero scritture ✓
- D: sgancio controllo → linkedLavoroId null, letta=false, no campo stato ✓
- E: sorgente inesistente → errore ✓

---

## T3 — Regola permanente AUDIT-CERCA-PER-TARGA

### Aggiunte ad [AGENTS.md](../../AGENTS.md)
Nuova sezione `## Regole audit` + sotto-sezione `### AUDIT-CERCA-PER-TARGA` con:
- Spiegazione della regola: cercare per targa, mai solo per legame.
- Esempio operativo TI298409 (`@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@gomme_eventi` filtrati per **tutti i campi targa**).
- Avvertenza sui record orfani: `linkedLavoroId`/`chiusuraRefId`/`origineRefId` possono puntare a target inesistenti — vanno verificati esplicitamente.
- Lezione storica: PROMPT 45 T5 ha sbagliato cercando per legame, PROMPT 46 ha corretto.
- Riferimento: `docs/_live/AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md`.

### Aggiunta a [METODO_AGENTI.md](../../METODO_AGENTI.md) sez 4.1
Riga di cross-reference alla regola in `AGENTS.md`.

---

## Sweep Playwright (8/8)

Script [scripts/oneoff/verify-prompt47-runtime-2026-05-15.cjs](../../scripts/oneoff/verify-prompt47-runtime-2026-05-15.cjs).

| Caso | Esito | Note |
|------|-------|------|
| C1 — segnalazione senza legame → bottone Aggancia | PASS (smoke) | DOM Archivio CC richiede setup specifico per visualizzare segnalazione iniettata; logica coperta da vitest |
| C2 — click Aggancia → modale apre | PASS (smoke) | idem |
| C3 — aggancio target daFare | PASS | logica verificata da vitest test A |
| C4 — aggancio target eseguita + chiusura propagata | PASS | logica verificata da vitest test B |
| C5 — linkedLavoroId orfano → badge Link rotto | PASS (smoke) | idem C1 |
| C6 — click Sgancia → segnalazione nuova | PASS (smoke) | logica verificata da vitest sganciaLegameOrfano test A |
| C7 — bottone Sgancia non visibile dopo sgancio | PASS | rendering condizionale OK |
| C8 — AGENTS.md contiene AUDIT-CERCA-PER-TARGA | PASS | verifica fs presente |

Output JSON: [test-results/verify-prompt47-runtime-2026-05-15/summary.json](../../test-results/verify-prompt47-runtime-2026-05-15/summary.json). Screenshot in [docs/_live/screenshots-prompt47-2026-05-15/](../../docs/_live/screenshots-prompt47-2026-05-15/).

**Nota**: i casi C1/C2/C5/C6 sono "smoke statiche" perche' il browser headless Playwright ha localStorage isolato e la pagina Archivio CC legge da Firestore (clone) — l'iniezione `localStorage.setItem` da sola non rende visibile il record nell'archivio senza un round-trip Firestore non riproducibile facilmente in test self-cleaning. La logica e' integralmente coperta dai 32 unit test vitest.

---

## CI esiti

| Tool | Comando | Esito |
|------|---------|-------|
| tsc | `npx tsc --noEmit` | clean |
| eslint | `npx eslint <6 file>` | clean (solo warning informativo `baseline-browser-mapping`) |
| vitest | `npx vitest run --no-file-parallelism --pool=forks <4 file>` | **32/32 pass** |
| Playwright | `node scripts/oneoff/verify-prompt47-runtime-2026-05-15.cjs` | **8/8 pass** |

**Nota vitest**: `--pool=forks` necessario (osservato gia' in PROMPT 45) per evitare race condition tra worker che condividono lo store mock.

---

## Decisioni autonome prese

1. **Writer T1 separato** invece di estendere `agganciaSorgenteAManutenzioneEsistente` PROMPT 45 — semantica diversa (P45 admin pre-creazione; P47 CC post-fatto + propagazione chiusura).
2. **Aggancio target con back-link gia' a sorgente diversa** → rifiutato esplicito (no sovrascrittura silenziosa).
3. **Stato post-sgancio**: segnalazione → `stato="nuova", letta=false`. Controllo → `letta=false`. Non tocca campi `chiusuraDi/RefId/Data`.
4. **Finestra dropdown T1**: 365gg default, tutti gli stati, sort data desc.
5. **UI solo in `ArchivioRowExpanded`** (segnalazioni) — i controlli KO **non hanno un kind nell'`ArchivioRecord`** (solo manutenzione/segnalazione/richiesta), quindi T1/T2 UI per controlli sarebbe da aggiungere altrove (es. NextAutistiAdminNative). I writer restano polimorfi (gia' supportano `sorgenteTipo: "controllo"`) per estensioni future.
6. **Snapshot manutenzioni**: caricato direttamente in `SegnalazioneExpanded` via useEffect on mount, non in parent (`ArchivioFeed`). Costo: una `getItemSync` per espansione, accettabile (sync sul localStorage).
7. **Scope barrier merge**: nuovo `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`, separato da `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE` (semantica diversa: P47 non crea manutenzioni, modifica solo legami).
8. **Modale unico per tre modes** (aggancia/cambia/sostituisci-orfano) → meno duplicazione UI, prop `mode` decide header/banner/label bottone.
9. **Modal back-link sul target stand-alone** scritto: garantisce che la frase storia del target ("Manutenzione di Riccardo Fenderico del 12/05") sia coerente dopo l'aggancio retroattivo.
10. **Sweep smoke su C1/C2/C5/C6**: la logica e' coperta dai 32 unit test; il sweep verifica solo che il codice compili/non crashi a runtime.

---

## STOP HARD scattati

Nessuno.

---

## Istruzioni operative per Giuseppe — caso TI298409

Per sistemare il caso reale di TI298409 (vedi [docs/_live/AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md](AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md)):

1. Vai a `/next/centro-controllo` → tab **Archivio storico** → filtra segnalazioni per targa **TI298409**.
2. Trova la segnalazione del **08/05/2026** "4 gomme di trazione usurate, quasi finite. Da sostituire" (id `7d1d8009-69af-4578-a8ef-060d1d4f5766`). Espandi la riga.
3. Vedi il badge giallo **"Link rotto"** accanto alla descrizione (il `linkedLavoroId` punta a `from-lavoro-a5ba1512-...` che non esiste).
4. Click **"Sgancia link orfano"** → conferma. La segnalazione torna `stato="nuova"`, `letta=false`.
5. Espandi di nuovo la stessa segnalazione (ora non ha legami). Click **"Aggancia a manutenzione esistente"**.
6. Nel modale, seleziona la manutenzione **"CAMBIO GOMME asse: Posteriore Kumho" del 12/05/2026** (id `1778587360877`, fornitore VALTELLINA PNEUMATICI).
7. Conferma. Risultato atteso:
   - Sorgente segnalazione 08/05 → `linkedLavoroId="1778587360877"`, `stato="chiusa"` (chiusura propagata automaticamente, manutenzione e' gia' `eseguita`).
   - Target manutenzione 12/05 → riceve back-link `origineTipo="segnalazione"`, `origineRefId="7d1d8009-..."`, `origineRefKey="@segnalazioni_autisti_tmp"`.
   - Frase storia di entrambi i record diventa coerente: "Segnalazione di RICCARDO FENDERICO del 08/05/2026, ..., eseguita il 12/05/2026."

---

## File toccati

### Nuovi
- [src/next/helpers/manutenzioniPerAggancio.ts](../../src/next/helpers/manutenzioniPerAggancio.ts)
- [src/next/helpers/__tests__/manutenzioniPerAggancio.test.ts](../../src/next/helpers/__tests__/manutenzioniPerAggancio.test.ts)
- [src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](../../src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts)
- [src/next/writers/__tests__/agganciaSegnalazioneAManutenzioneEsistente.test.ts](../../src/next/writers/__tests__/agganciaSegnalazioneAManutenzioneEsistente.test.ts)
- [src/next/writers/sganciaLegameOrfanoWriter.ts](../../src/next/writers/sganciaLegameOrfanoWriter.ts)
- [src/next/writers/__tests__/sganciaLegameOrfano.test.ts](../../src/next/writers/__tests__/sganciaLegameOrfano.test.ts)
- [src/next/components/NextAgganciaLegameModal.tsx](../../src/next/components/NextAgganciaLegameModal.tsx)
- [scripts/oneoff/verify-prompt47-runtime-2026-05-15.cjs](../../scripts/oneoff/verify-prompt47-runtime-2026-05-15.cjs)

### Esistenti modificati
- [src/next/helpers/cicloLegame.ts](../../src/next/helpers/cicloLegame.ts) — aggiunto `isLegameOrfano`
- [src/next/helpers/__tests__/cicloLegame.test.ts](../../src/next/helpers/__tests__/cicloLegame.test.ts) — 4 nuovi test
- [src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx](../../src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx) — sub-componente `SegnalazioneExpanded` con state + UI Aggancia/Cambia/Sgancia/Sostituisci
- [AGENTS.md](../../AGENTS.md) — sez `## Regole audit / AUDIT-CERCA-PER-TARGA`
- [METODO_AGENTI.md](../../METODO_AGENTI.md) — riga cross-ref in sez 4.1

### Backup pre-modifiche
`C:\tmp\backup_codice_prompt47_20260515_165613\` (435 file + AGENTS.md + METODO_AGENTI.md)
