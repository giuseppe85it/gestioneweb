# PIANO DI RISANAMENTO FLUSSO — 2026-06-05

Trasforma i 10 punti di confusione dell'audit (`docs/AUDIT_FLUSSO_CICLO_VITA_2026-06-05.md`) in 4 fasi
eseguibili una alla volta, dal più dannoso al cosmetico, con stime oneste. Tutto verificato nel codice
(`path:riga`) e nel dato fisico (Firestore read-only, 2026-06-05). **Nessuna decisione di prodotto è presa.**
Questo è solo il piano: nessuna implementazione è stata eseguita.

---

## DECISIONI APERTE (le sceglie Giuseppe — qui solo opzioni + conseguenza)
- **D1 — Fase 1, eliminazione manutenzione con sorgenti collegate:**
  - (a) **Sgancio automatico** delle sorgenti all'eliminazione → elimini sempre; le segnalazioni tornano "nuove/da fare".
  - (b) **Blocco eliminazione** se la manutenzione ha sorgenti collegate → niente orfani, ma devi prima sganciare a mano.
- **D2 — gruppo + collegata incompatibili?**
  - (a) **Sì, vietare** (un record o in gruppo o collegato) → meno ambiguità; il gruppo si svuota quando crei il lavoro.
  - (b) **No, coesistono** → resta l'ambiguità (oggi 2 record reali).
- **D3 — "Prendi in carico" manuale:**
  - (a) **Aggiungere il pulsante** (chiama `segnaPresaInCaricoSegnalazione`, già pronto) → gesto esplicito disponibile.
  - (b) **Eliminare writer+test non cablati** → meno codice morto; "presa in carico" resta solo automatica.
- **D4 — avviso "lavoro eseguito ma sorgente aperta" + richiudi (2 record):**
  - (a) **In Fase 1** (è dato sporco) · (b) **In Fase 4** (è UX).
- **D5 — vocabolario target (Fase 3):**
  - (a) **"manutenzione" ovunque** (mai "lavoro") + **"Eseguita"** per finito + stati **"Nuova / In lavorazione / Eseguita"**.
  - (b) Termini diversi se preferisci (da indicare).

---

## Tabella riassuntiva fasi
| Fase | Cosa | Complessità | Rischio regressione | Dipendenze |
|---|---|---|---|---|
| 1 — Stop emorragia | sgancio/blocco all'eliminazione | **Bassa-Media** | Media (tocca il writer di delete; se sbagliato si potrebbe non eliminare o sganciare troppo) | nessuna |
| 2 — Sanare pregresso | riparazione dati una-tantum (21 record) | **Bassa (tecnica) / Alta (attenzione)** | Alta SE automatica (scrive sul dato vivo) → mitigata da backup + approvazione record-per-record | meglio dopo Fase 1 |
| 3 — Una parola | rename SOLO etichette UI | **Bassa** | Bassa (cosmetico) — unico rischio: test sui badge | indip. (ma dopo Fase 1/2) |
| 4 — Unificare gesti | 1 gesto/2 opzioni + micro-patch autori + decisioni residue | **Media-Alta** | Media-Alta (tocca flussi di scrittura) | dopo Fase 1; usa esiti D2/D3/D4 |

---

## DISCREPANZE rispetto all'audit (verificate)
1. **Punti di eliminazione manutenzione = 2 hard-delete, non 1.** L'audit citava solo "dettaglio Elimina". In realtà:
   - (A) Dettaglio Mappa "Elimina" → `NextMappaStoricoPage.tsx:910` → `handleDelete` [NextManutenzioniPage.tsx:2326] → `deleteNextManutenzioneBusinessRecord(recordId)` :2344
   - (B) Modale Quadro PDF "Elimina definitivamente" → `setPdfDeleteCandidate` [:2184] → `handleConfirmPdfDelete` :2359 → `deleteNextManutenzioneBusinessRecord(recordId, fingerprint)` :2367
   - L'**Archivio Storico "Elimina" NON è hard-delete**: è soft-hide (`nascostoInArchivio:true`) via `nextArchivioHideWriter.ts` → `@manutenzioni` non perde il record. *Buona notizia: i 2 hard-delete confluiscono nell'UNICO writer `deleteNextManutenzioneBusinessRecord` → la Fase 1 si fa in un solo punto.*
2. **Causa emorragia confermata**: `deleteNextManutenzioneBusinessRecord` [nextManutenzioniDomain.ts:1361-1453] scrive solo `@inventario`, `@materialiconsegnati`, `@manutenzioni`; **non tocca mai `@segnalazioni_autisti_tmp` né `linkedLavoroId`** (la costante `SEGNALAZIONI_AUTISTI_KEY` è definita ma inutilizzata).
3. Numeri audit confermati dal dato: 17 fantasmi, 2 eseguiti con sorgente aperta, 2 contraddittori, 13 disallineati (11 innocui + 2 = i contraddittori). Nessun altro scostamento.

---

## Vincoli globali (validi per tutte le fasi)
- **CHIAVI DATO INTOCCABILI** (si cambiano SOLO stringhe visibili): `stato` e i suoi valori `"daFare"|"programmata"|"eseguita"|"chiusa_da_evento"|"nuova"|"presa_in_carico"|"aperta"|"chiusa"`; `linkedLavoroId`/`linkedLavoroIds`/`linkedMultiple`; `origineTipo`/`origineRefId`/`origineRefKey`/`origineRefs`; `gruppoSegnalazioneId`/`gruppoManutenzioneId`; `fornitore`/`chiusuraDi`/`chiusuraRefId`/`chiusuraData`/`dataChiusura`/`chiusa`/`chiusa_by`; chiavi storage `@manutenzioni`/`@segnalazioni_autisti_tmp`/`@controlli_mezzo_autisti`.
- **Gate per ogni lotto**: `npx tsc -b --noEmit` + `npm run build` + `npx vitest run <test a rischio>` → **STOP point** e verifica dal vivo (`localhost` dev) prima del lotto successivo.
- **Backup**: prima di ogni fase che scrive, copia `.bak.<data>` dei file toccati; per la Fase 2 backup del **documento Firestore** prima di qualsiasi scrittura.
- **Branch**: lavorare su branch dedicato; commit solo su richiesta.

---

## FASE 1 — STOP ALL'EMORRAGIA
**Causa** (verificata): vedi DISCREPANZA 2. Eliminando una manutenzione, le sorgenti restano con `linkedLavoroId` verso un id inesistente → **17 fantasmi reali** (Fase 2).

**Perimetro CHIUSO (rg):**
- Choke point unico: `deleteNextManutenzioneBusinessRecord` [src/next/domain/nextManutenzioniDomain.ts:1361-1453].
- UI che lo invocano: `handleDelete` [src/next/NextManutenzioniPage.tsx:2326-2347]; `handleConfirmPdfDelete` [:2359-2387].
- Riuso esistente: `sganciaLegameManutenzione` [src/next/writers/sganciaLegameOrfanoWriter.ts:132] (toglie `linkedLavoro` dalla sorgente + `origineRef` dalla manutenzione + riporta `stato` a `nuova`/`presa_in_carico`), scope `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`.
- **VISTO E ESCLUSO**: `nextArchivioHideWriter.ts` (è soft-hide, non elimina → fuori perimetro); writer di gruppo (non eliminano).

**Opzione (a) — sgancio automatico (progetto, non scelto):**
- Prima dell'eliminazione, individuare le sorgenti collegate (scan `@segnalazioni_autisti_tmp` + `@controlli_mezzo_autisti` per `linkedLavoroId/Ids === recordId`) e per ciascuna chiamare `sganciaLegameManutenzione({sorgenteId, sorgenteTipo, manutenzioneId})`. Poi eliminare.
- Campi che si azzerano sulla sorgente: `linkedLavoroId/Ids` (→ `writeLegameLavoro([])`), `stato`→`nuova` (o `presa_in_carico` se restano altri legami), `dataPresaInCarico`.
- File da toccare (lista chiusa): `nextManutenzioniDomain.ts` (pre-step nel writer) **oppure** i 2 handler in `NextManutenzioniPage.tsx`. Consigliato: nel writer (copre entrambe le UI). Eventuale helper "trova sorgenti collegate".

**Opzione (b) — blocco eliminazione (progetto, non scelto):**
- Prima di eliminare, se la manutenzione ha sorgenti collegate (incoming `linkedLavoro`) o `origineRefs`, **bloccare** con messaggio ("Sgancia prima le N segnalazioni collegate").
- Intercetto: nei 2 handler (`handleDelete`, `handleConfirmPdfDelete`) o nel writer (ritorna motivo). File: `NextManutenzioniPage.tsx` (messaggi utente) + helper di check.

**Lotti/gate:** L1 implementazione opzione scelta nel writer/handler → gate (tsc+build+`deleteNextManutenzioneBusinessRecord.test`, `sganciaLegameOrfano.test`) → STOP, verifica dal vivo (crea lavoro da segnalazione, elimina, controlla che la segnalazione torni "nuova").
**Test a rischio:** `deleteNextManutenzioneBusinessRecord.test.ts`, `sganciaLegameOrfano.test.ts`, `riapriESganciaSegnalazione.test.ts`. **Nuovi:** "elimina manutenzione con sorgenti → sorgenti sganciate/blocco".
**Stima onesta:** complessità Bassa-Media; rischio Medio. *Cosa si rompe se va male:* opz.(a) sgancio errato → segnalazioni sganciate per sbaglio; opz.(b) blocco troppo aggressivo → non riesci a eliminare nulla. Mitigazione: gate + verifica dal vivo.
**COSA NON FARE:** non aggiungere uno scope clone nuovo (riusa quello di `sganciaLegameManutenzione`); non toccare la logica inventario/consegne del delete (estranea).

---

## FASE 2 — SANARE IL PREGRESSO (dati, una-tantum)
**Strumento:** script Firestore **read→report→(stop)→write solo dopo OK esplicito**, con **backup del documento `storage/@…` PRIMA** di ogni scrittura. Mai automatico. Dove esiste già un gesto UI equivalente (Riapri, Sgancia), preferirlo allo script.

**Censimento esatto (Firestore 2026-06-05):**

**A) 17 FANTASMI** (segnalazione → `linkedLavoroId` inesistente). Riparazione proposta: **sgancio** = `linkedLavoroId/Ids` rimossi, `stato`→`nuova` (già fattibile da UI "Sgancia link orfano"). Elenco (id | targa | stato | problema:descr | → lavoro fantasma):
| id segnalazione | targa | stato | problema:descr | → lavoro inesistente |
|---|---|---|---|---|
| 82ff0b71… | TI178456 | presa_in_carico | motore: Rumore (prova) | 99f8c820… |
| e8750e0e… | TI233827 | presa_in_carico | altro: Ammortizzatori ultimo asse | b994ae30… |
| f9e2e351… | TI315407 | presa_in_carico | altro: Anabbagliante dx non funzionante | 4d455c2a… |
| 4017ba91… | TI313387 | presa_in_carico | altro: Manca attrezzatura per scaricare | c624c75d… |
| fa8ee153… | TI298409 | presa_in_carico | elettrico: Lampadina anabbaglianti dx | 4ffc49f9… |
| eee4adb6… | TI84822 | presa_in_carico | elettrico: Faro posteriore dx spento | 23c31228… |
| b883f689… | TI298409 | presa_in_carico | altro: Trattore problemi riscaldamento | be49d61f… |
| 45feb9b9… | TI285053 | presa_in_carico | altro: Asse sterzante rimorchio bloccato | deb7da3e… |
| 7e9925c6… | TI84069 | presa_in_carico | gomme: Tagliata | 1d8dfe6f… |
| c11828ee… | TI239279 | presa_in_carico | elettrico: Sensore AdBlue non funziona | 7eaa65ad… |
| 2a629be1… | TI298409 | presa_in_carico | elettrico: Cambiate 3 lampadine | 74699f0a… |
| 6a64e3bd… | TI285217 | presa_in_carico | altro: Tubo scarico crepato | b090c8a5… |
| ed063f99… | TI287110 | presa_in_carico | elettrico: Luci ingombro laterali sx spente | dedc1377… |
| 8bcb855c… | TI113417 | presa_in_carico | motore: Perdita olio + perdita aria | eab98d6b… |
| c2568521… | TI280132 | presa_in_carico | gomme: 1 asse quasi finito | 8d2b5c5a… |
| 1dab2f26… | TI280132 | presa_in_carico | gomme: Gomme primo asse molto usurate | 3b167c1a… |
| **5411913c…** | TI324623 | **chiusa** | altro: Climatizzatore non funziona | 1776868559013 |
> **Ambiguo (decisione di Giuseppe):** `5411913c…` è `chiusa` ma punta a un lavoro inesistente → la riparazione "sgancio→nuova" la **riaprirebbe**. Alternativa: lasciarla chiusa e solo pulire il link. Decidere caso per caso.

**B) 2 ESEGUITI CON SORGENTE APERTA** (propagazione chiusura mancata). Riparazione: **richiudere la sorgente** (propagare la chiusura del lavoro → segnalazione `chiusa`).
| manutenzione (eseguita) | targa | → segnalazione (ancora presa_in_carico) |
|---|---|---|
| from-lavoro-5dd4afde… | TI239279 | 261619fc… |
| from-lavoro-f609de79… | TI313387 | c7bc5a05… |

**C) 2 CONTRADDITTORI** (`chiusa=true` ma stato aperto, nessuna traccia). Riparazione: decidere se sono chiuse o aperte.
| id | targa | stato | descr |
|---|---|---|---|
| f83dbbe1… | TI287110 | nuova | Luci ingombro lato sx spente |
| 5cdfe350… | TI313387 | presa_in_carico | Freni da controllare |
> **Ambiguo:** o `chiusa=false` (riallinea ad aperta) o `stato="chiusa"`+traccia (chiudi davvero). Serve il giudizio di Giuseppe (sono state risolte o no?).

**D) 2 IN GRUPPO E COLLEGATE** (gruppo `79a72198`, targa TI233827, lavoro esistente `1780597640377`): `7fa81331…`, `0cd32f30…`. Riparazione: dipende da **D2**; nessuna azione finché D2 non è decisa.

**E) 11 DISALLINEATI INNOCUI** (`stato="chiusa"` ma bool `chiusa` non settato): il reader deriva correttamente la chiusura ([nextAutistiDomain.ts:599-603]). **COSA NON FARE: non sanarli ora** — costo > beneficio, zero impatto visibile.

**Lotti/gate:** per categoria (A→B→C), ciascuna: backup doc → report → OK Giuseppe → scrittura → rilettura di verifica → STOP. **Stima:** tecnica Bassa, attenzione Alta. *Rischio:* scrittura su dato vivo → mitigato da backup + read-back + approvazione.

---

## FASE 3 — UNA PAROLA PER OGNI COSA (solo etichette UI)
**VINCOLO:** si toccano SOLO stringhe visibili; le CHIAVI DATO restano intatte (vedi Vincoli globali). Target proposto (D5): "manutenzione" ovunque; "Eseguita" per finito; stati video "Nuova / In lavorazione / Eseguita".

**Perimetro CHIUSO (rg sulle stringhe) — rinominabili:**
| File:riga | Stringa attuale | Proposta | Note |
|---|---|---|---|
| NextManutenzioniPage.tsx:3453 | "Creare un **lavoro** Da fare…" | "…una **manutenzione** Da fare…" | confirm |
| NextManutenzioniPage.tsx:3507 | "**Lavoro** Da fare creato…" | "**Manutenzione** Da fare creata…" | toast |
| NextManutenzioniPage.tsx:3803 / 4062 | "Crea **lavoro** (Da fare)" | "Crea **manutenzione** (Da fare)" | bottone |
| NextManutenzioniPage.tsx:4010 | "Segnalazioni aperte (N)" | (ok / "Segnalazioni nuove (N)") | coerenza "aperte/nuove" |
| frasestoriaRecord.ts:65-75 | "Risolta dal…/dall'intervento officina/Chiusa manualmente" | *valutare* | vedi COSA NON FARE |
| ArchivioFeed.tsx:264-267 | "Chiusa"/"Aperta" (segnalazione) | "Eseguita"/"Nuova"? | richiede coerenza con stati video |
| ArchivioRowSegnalazione.tsx:155,175,198 | "Aperta da X"/"Aperta"/"Chiusa" | allineare al set unico | timeline |
| NextCentroControlloParityPage.tsx:2245 / NextRichiestaAttrezzatureAllNative.tsx:222 | `isNuova ? "NUOVA" : stato` | mostra label mappata | badge |
> Badge manutenzione "DA FARE/ESEGUITA/CHIUSA DA EVENTO/PROGRAMMATA" già coerenti (ArchivioFeed.tsx:194-197, ArchivioRowManutenzione.tsx:58-61, NextManutenzioniPage.tsx:407-409): la mappatura label è il punto giusto dove intervenire.

**VISTO E ESCLUSO (occorrenze NON da toccare):** tutte le comparazioni `stato === "daFare"/"eseguita"/"chiusa_da_evento"/"nuova"` (NextManutenzioniPage.tsx:385-386,1587,3482,3826; ArchivioFeed.tsx:194-197; NextMappaStoricoPage.tsx:860; nextAutistiDomain.ts:532-533,593; storiaRecord.ts:67; agganciaSegnalazioneAManutenzioneEsistenteWriter.ts:82); type `NextManutenzioneStato` [nextManutenzioniDomain.ts:57]; campi `gruppoSegnalazioneId`/`origineTipo`/`chiusaBy` (mappers); option `value="daFare"` ecc. in `ArchivioToolbar.tsx:184-187` (il `value` resta, cambia solo il testo dell'option).

**Lotti/gate:** un file per lotto → tsc+build+`formatStatoManutenzione.test.ts`. **Test a rischio:** `formatStatoManutenzione.test.ts` (verifica i testi dei badge — il rename può romperlo: aggiornare test insieme). **Stima:** complessità Bassa, rischio Basso.
**COSA NON FARE:** non riscrivere la **frase storia** narrativa (`frasestoriaRecord.ts`) forzando "Eseguita": "Risolta dall'intervento officina…" è un racconto, non un badge — cambiarlo può peggiorare la leggibilità. Decidere a parte se la narrativa segue il set unico.

---

## FASE 4 — UNIFICARE I GESTI + RESIDUE
**I 3 gesti oggi (UI → writer):**
- "Crea manutenzione" → `NextAutistiAdminNative.tsx:2842` (label "CREA MANUTENZIONE") → `createManutenzioneDaFareFromSegnalazione` [nextManutenzioneDaFareCreateWriter.ts:270].
- "Aggancia a esistente" → singola `ArchivioRowExpanded.tsx:519` + batch `ArchivioFeed.tsx:633` → `agganciaSegnalazioneAManutenzioneEsistente(Batch)`.
- "Crea lavoro (Da fare)" dal gruppo → `handleCreaLavoroDaGruppo` [NextManutenzioniPage.tsx:3444] → `saveNextManutenzioneBusinessRecord` + aggancio batch.

**Unificazione proposta (perimetro UI, riuso writer):** UN gesto "Manda in manutenzione" con 2 opzioni — **(1) nuova manutenzione** / **(2) aggancia a esistente** — che instrada ai writer ESISTENTI. NON fondere i writer (rischio alto): si unifica solo l'**ingresso**. File ingresso: punti UI sopra.

**Micro-patch già decisa (autori reali nel Crea lavoro dal gruppo):** in `handleCreaLavoroDaGruppo` [NextManutenzioniPage.tsx:3492] `segnalatoDa:"Autisti"` → derivare i nomi reali dai `targetItems` (autisti distinti delle segnalazioni del gruppo). Solo questo campo; resto invariato. *Nota collegata (separata):* per vedere gli autori reali ANCHE nella frase storia del dettaglio, `selectedRecordChiuso` [NextMappaStoricoPage.tsx:333-339] dovrebbe passare `sourceRecords` (oggi non lo fa) — valutare se includerla qui.

**Decisioni residue:** D2 (gruppo+collegata), D3 (Prendi in carico: cablare o rimuovere `presaInCaricoSegnalazioneWriter`), D4 (avviso+richiudi dei 2 record B — qui o in Fase 1).

**Lotti/gate:** L1 micro-patch autori (isolata, bassa) → gate; L2 unificazione ingresso → gate (`gruppoSegnalazioniTransform.test`, `agganciaSegnalazioneAManutenzioneEsistente.test`, `manutenzioniPerAggancio.test`, `gruppoManutenzioniWriter.test`). **Stima:** L1 Bassa; L2 Media-Alta. *Rischio:* L2 tocca flussi di scrittura → regressioni su aggancio/creazione.
**COSA NON FARE:** non unificare i gruppi-segnalazioni e gruppi-manutenzioni in un solo sistema ora (rifattorizzazione grande, beneficio incerto); non rimuovere `gruppoManutenzioniWriter`/`gruppoSegnalazioniWriter`.

---

## Verifica end-to-end (per ogni fase)
- `npx tsc -b --noEmit` + `npm run build` verdi.
- `npx vitest run` sui test elencati per fase.
- Dal vivo (`npm run dev` → `/next/manutenzioni?role=admin`): Fase 1 → crea lavoro da segnalazione, elimina, verifica sgancio/blocco; Fase 2 → riletture post-riparazione; Fase 3 → controllo etichette su Da fare/Archivio/dettaglio; Fase 4 → aggancio/creazione + autori reali nel lavoro da gruppo.

## Note di esecuzione
Le fasi si eseguono **una alla volta**, ciascuna previa scelta delle DECISIONI APERTE pertinenti e con i
gate/STOP indicati. Questo documento NON implementa nulla: è solo il piano.
