# AUDIT CICLO SEGNALAZIONE → MANUTENZIONE → CHIUSURA

**Data:** 2026-05-14 · **Tipo:** AUDIT READ-ONLY (PROMPT 43 — T2) · **Nessuna patch su `src/` o `backend/`.**

Radiografia del ciclo: segnalazione (autisti / manuale / controllo KO) → presa in carico →
conversione in manutenzione → chiusura (officina / completa manuale / evento autisti).
Materiale: lettura statica dei writer + dump read-only Firestore + sweep Playwright su 11 superfici NEXT.

---

## FASE A — MAPPA STATICA DEL CICLO

### A.1 — Sorgenti della segnalazione

| Sorgente | Storage key | Shape rilevante | Entra nel ciclo via |
|---|---|---|---|
| App autisti | `@segnalazioni_autisti_tmp` | `{ id, mezzo, descrizione, stato?, letta?, chiusa?, linkedLavoroId? }` | inbox autisti NEXT → "prendi in carico" |
| Inserimento manuale NEXT | `@manutenzioni` (direttamente come `daFare`) | record manutenzione con `origineTipo:"manuale"` | form Centro Controllo / Manutenzioni |
| Controllo mezzo KO | `@controlli_mezzo_autisti` | `{ id, mezzo, esito, linkedLavoro? }` | conversione controllo KO → manutenzione daFare |

**Dump reale (2026-05-14):**
- `@segnalazioni_autisti_tmp`: **37 record** — 4 `stato:"nuova"`, 33 `stato:"presa_in_carico"`; 33 con `linkedLavoroId`; **3 con `chiusa:true` ma `stato` ancora `presa_in_carico`**.
- `@controlli_mezzo_autisti`: **350 record** — solo **9** con `linkedLavoro` valorizzato.
- `@manutenzioni`: **73 record** — **55 con `stato` "(vuoto)"**, 10 `eseguita`, 8 `daFare`. Dei daFare: 6 da segnalazione (tutti `from-lavoro-*`, migrati, con `data` valorizzato), 1 da controllo. Degli eseguita: 2 con `fornitore` (chiusura officina), 8 senza (chiusura manuale). **0 record `chiusa_da_evento`.**

### A.2 — Presa in carico

`nextManutenzioneDaFareCreateWriter.ts` → `patchSegnalazione()`:
- imposta `linkedLavoroId`, `letta:true`, e `stato:"presa_in_carico"` **solo se il record ha già un campo `stato`**.
- **NON** scrive alcun `dataPresaInCarico` → la presa in carico non ha timestamp.
- La "presa in carico" non è uno stato separato con writer dedicato: è un effetto collaterale della conversione in manutenzione.

### A.3 — Conversione segnalazione → manutenzione

`createManutenzioneDaFareFromSegnalazione()` / `...FromControllo()` → `buildManutenzioneDaFareRecord()`:
- crea il record manutenzione con `origineTipo` / `origineRefId` / `origineRefKey` (legame **manutenzione → sorgente**).
- in parallelo `patchSegnalazione` scrive `linkedLavoroId` sulla segnalazione (legame **sorgente → manutenzione**).
- **Due convenzioni di nome diverse per lo stesso legame bidirezionale.**
- il record creato ha `data: null` e **nessun** `dataInserimento` / `createdAt`.

### A.4 — Chiusura (3 modalità)

| Modalità | Writer | Campi scritti sulla manutenzione | Propaga sulla segnalazione collegata? |
|---|---|---|---|
| Officina (fornitore valorizzato) | `saveNextManutenzioneBusinessRecord` (`nextManutenzioniDomain.ts`) | `stato:"eseguita"`, `fornitore`, date | **NO** |
| Completa manuale | `saveNextManutenzioneBusinessRecord` | `stato:"eseguita"`, date | **NO** |
| Evento autisti | `nextChiusuraEventoWriter.ts` → `chiudiManutenzioneDaEvento` / `chiudiSegnalazioneDaEvento` / `chiudiControlloDaEvento` | `buildChiusuraPatch`: `{stato, chiusuraDi, chiusuraRefId, chiusuraData}` | SÌ (per i writer dedicati) — ma `patchById` matcha **solo per `record.id`**, nessun fallback fingerprint |

### A.5 — Superfici NEXT dove appaiono i record del ciclo

| Superficie | Route | Legge da | Mostra |
|---|---|---|---|
| Manutenzioni — Da fare | `/next/manutenzioni` | `@manutenzioni` (filtro `daFare`) | lista daFare |
| Manutenzioni — Dettaglio | `/next/manutenzioni` tab Dettaglio | `@manutenzioni` per mezzo | storico interventi mezzo |
| Manutenzioni — Quadro PDF | `/next/manutenzioni` tab Quadro | `@manutenzioni` (tutti) | 73 righe, tutti gli stati |
| CC — Archivio Manutenzioni | `/next/centro-controllo` → Archivio storico | `@manutenzioni` | feed manutenzioni archiviate |
| CC — Archivio Segnalazioni | idem, subtab Segnalazioni | `@segnalazioni_autisti_tmp` | feed segnalazioni |
| Autisti inbox — Segnalazioni | `/next/autisti-inbox/segnalazioni` | `@segnalazioni_autisti_tmp` | segnalazioni da prendere in carico |
| Autisti inbox — Home | `/next/autisti-inbox` | aggregato | riepilogo |
| Dossier mezzo | `/next/dossiermezzi/<targa>` | `@manutenzioni` + `@segnalazioni_autisti_tmp` per mezzo | storia mezzo, sezioni "Storia interventi" / "Eventi gomme straordinari" |

---

## FASE B — VERIFICA RUNTIME (sweep Playwright, 11 superfici)

Sweep read-only: `scripts/oneoff/audit-ciclo-segnalazione-2026-05-14.cjs`.
Screenshot in `docs/_live/screenshots-audit-ciclo-2026-05-14/`. 4 casi reali dal dump.

| Caso | Casistica | Superfici verificate | Esito |
|---|---|---|---|
| **TI113417** | manutenzione `eseguita` da officina (fornitore valorizzato) + segnalazione `nuova` | Dossier, Quadro, Dettaglio | PASS display — **NOTA**: segnalazione `nuova` resta scollegata, nessun legame con la manutenzione eseguita |
| **TI334558** | segnalazione `presa_in_carico` → manutenzione collegata (`linkedLavoroId`) | Dossier, Archivio CC segnalazioni | PASS legame visibile · **FAIL** se la segnalazione risulta `chiusa:true` ma `stato:presa_in_carico` (desync A.1) |
| **TI280132** | controllo KO → manutenzione `daFare` collegata | Dossier, Quadro | PASS legame `origineTipo:"controllo"` · **NOTA**: solo 9/350 controlli hanno `linkedLavoro` |
| **TI233827** | `daFare` da segnalazione (`from-lavoro-*`) | Dossier (sezione Storia interventi), Quadro, Dettaglio | PASS display · **NOTA**: record `daFare` migrato con `data` valorizzato; i nuovi nascono con `data:null` |
| **chiusa_da_evento** | chiusura via evento autisti | — | **N/A — 0 record reali in Firestore.** Macchina PROMPT 34 mai usata in produzione |

Sintesi sweep: **11 superfici catturate**, nav-shell coerente. Le divergenze NON sono di rendering
delle singole superfici (il display è coerente fra Dettaglio / Quadro / Archivio CC) ma di **dato
sottostante e di legame** — vedi FASE C.

---

## FASE C — DIAGNOSI (divergenze classificate)

| # | Divergenza | Gravità | Tipo | Causa (file:riga) | Fix suggerito (≤2 righe) | Costo | Dipendenze |
|---|---|---|---|---|---|---|---|
| D1 | 3 segnalazioni `chiusa:true` ma `stato:"presa_in_carico"` | **MEDIA** | inconsistenza | chiusura officina/manuale non propaga (`nextManutenzioniDomain.ts` → `saveNextManutenzioneBusinessRecord`) | nel ramo chiusura, risalire `origineRefId` e patchare `stato` sulla segnalazione | M | richiede lookup inverso segnalazione |
| D2 | 0 record `chiusa_da_evento` — macchina PROMPT 34 inutilizzata | **MEDIA** | ridondanza / feature morta | nessuna superficie UI innesca `chiudiManutenzioneDaEvento` (`nextChiusuraEventoWriter.ts`) | decidere: collegare l'inbox autisti o rimuovere il writer | L | decisione prodotto |
| D3 | Due convenzioni di legame: `linkedLavoroId` (segnalazione) vs `origineRefId/Key/Tipo` (manutenzione) | **MEDIA** | ridondanza / inconsistenza | `nextManutenzioneDaFareCreateWriter.ts` (`buildManutenzioneDaFareRecord` + `patchSegnalazione`) | unificare in un solo schema di legame condiviso | M | tocca writer + reader |
| D4 | `chiudiManutenzioneDaEvento` matcha **solo per `record.id`**, nessun fallback fingerprint | **ALTA** (latente) | legame perso potenziale | `nextChiusuraEventoWriter.ts` → `patchById` | aggiungere fallback `findLegacyRecordIndexByFingerprint` (come fix PROMPT 41) | S | riusa helper PROMPT 41 |
| D5 | `daFare` nuovi nascono con `data:null` e senza `dataInserimento`/`createdAt` | **MEDIA** | dato mancante | `nextManutenzioneDaFareCreateWriter.ts` → `buildManutenzioneDaFareRecord` | scrivere `dataInserimento: nowISO()` alla creazione | S | nessuna |
| D6 | 55/73 `@manutenzioni` con `stato` "(vuoto)" | **MEDIA** | dato mancante | record legacy migrati senza normalizzazione dello stato | migration di normalizzazione o fallback di display esplicito | M/L | dato storico |
| D7 | Nessun `dataPresaInCarico` — la presa in carico non ha timestamp | **MEDIA** | dato mancante | `nextManutenzioneDaFareCreateWriter.ts` → `patchSegnalazione` | aggiungere `dataPresaInCarico: nowISO()` in `patchSegnalazione` | S | nessuna |
| D8 | `patchSegnalazione` imposta `stato:"presa_in_carico"` **solo se** il record ha già `stato` | **BASSA** | inconsistenza | `nextManutenzioneDaFareCreateWriter.ts` → `patchSegnalazione` (condizionale) | impostare sempre `stato`, anche se assente | S | nessuna |

### I 3 problemi più strutturali (radici, non sintomi)

1. **Nessuna propagazione bidirezionale della chiusura.**
   La chiusura officina/manuale aggiorna **solo** la manutenzione: la segnalazione collegata resta
   `presa_in_carico` per sempre (D1). Radice: la logica di chiusura vive dentro
   `saveNextManutenzioneBusinessRecord`, che non conosce — e non risale — il legame inverso.
   **Proposta:** un unico *closure orchestrator* che, dato un record chiuso, risale
   `origineRefId` / `linkedLavoroId` e propaga lo stato finale a tutte le entità del ciclo.

2. **Due convenzioni di legame + matching fragile per indice/id.**
   `linkedLavoroId` da una parte, `origineRefId/Key/Tipo` dall'altra (D3); e la chiusura da evento
   matcha solo per `record.id` senza fallback fingerprint (D4) — stessa classe di fragilità del bug
   PROMPT 41. Radice: ogni writer ha inventato il proprio schema di legame.
   **Proposta:** un modulo unico `cicloLegame.ts` con **un solo** schema di riferimento + helper di
   risoluzione con fallback fingerprint condiviso fra tutti i writer/reader.

3. **Macchina `chiusa_da_evento` (PROMPT 34) costruita senza punto d'ingresso.**
   0 record reali in 73 manutenzioni (D2): il writer esiste, la superficie che lo innesca no.
   Radice: feature implementata bottom-up senza collegare l'inbox autisti.
   **Proposta:** decisione di prodotto — o si collega l'inbox autisti (l'autista chiude → evento →
   chiusura propagata), o si rimuove il writer come codice morto.

---

## FASE D — DOMANDE PER GIUSEPPE (max 5)

1. **Chiusura officina/manuale → segnalazione:** quando una manutenzione nata da segnalazione viene
   chiusa, la segnalazione originale deve passare a `chiusa`/`risolta`? Oggi resta `presa_in_carico`
   per sempre (D1).
2. **Macchina `chiusa_da_evento` (PROMPT 34):** la teniamo e colleghiamo l'inbox autisti, o la
   rimuoviamo? Ad oggi 0 record reali la usano (D2).
3. **Timestamp presa in carico:** serve un `dataPresaInCarico` visibile (es. "presa in carico il
   GG/MM/AAAA")? Oggi non viene salvato (D7).
4. **Stato "(vuoto)" su 55/73 manutenzioni:** vuoi una migration una-tantum di normalizzazione, o
   basta un'etichetta di display "stato non definito"? (D6).
5. **Convenzione di legame:** ti va bene che unifichiamo `linkedLavoroId` e `origineRef*` in un
   unico schema, anche se questo tocca writer e reader esistenti? (D3, problema strutturale 2).

---

## PRIORITÀ RACCOMANDATA

1. **D4** (ALTA latente, costo S) — fallback fingerprint nella chiusura da evento: previene perdita
   di legame, riusa l'helper già scritto in PROMPT 41.
2. **D1 + problema strutturale 1** — propagazione bidirezionale della chiusura: è il sintomo più
   visibile per l'utente (segnalazioni "eternamente aperte").
3. **D5 + D7** (costo S ciascuno) — timestamp di creazione e presa in carico: piccoli, sbloccano
   ordinamento e display corretti.
4. **D3 + D6** — unificazione legame e normalizzazione stato: lavoro strutturale, da pianificare.
5. **D2** — decisione di prodotto sulla macchina `chiusa_da_evento`.

---

## EVIDENZE

- Sweep: `scripts/oneoff/audit-ciclo-segnalazione-2026-05-14.cjs`
- Screenshot (11 superfici): `docs/_live/screenshots-audit-ciclo-2026-05-14/`
- Summary sweep: `test-results/audit-ciclo-segnalazione/summary.json`
- Mappa superfici di riferimento: `docs/_live/AUDIT_STORIA_SEGNALAZIONE_SUPERFICI_2026-05-14.md`
- Writer letti: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`,
  `src/next/writers/nextChiusuraEventoWriter.ts`, `src/next/nextManutenzioniDomain.ts`
