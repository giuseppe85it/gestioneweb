# AUDIT DI VERIFICA STATO — 12 problemi/debiti

**Data:** 2026-06-06 · **Modo:** SOLA LETTURA ASSOLUTA — zero scritture su Firestore, zero modifiche al codice.
**Fonte dati (sola lettura):** `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@mezzi_aziendali`, `@lavori`.
**Snapshot live letto il:** 2026-06-06 ~19:2x UTC (ri-letto dopo la riconciliazione: `@controlli` è passato 401→400 e diverse segnalazioni sono state chiuse a mano oggi → il dato è in movimento mentre scrivo).
**Unica scrittura nel repo:** questo file.

> La lista è il sospetto, non la verità. Ogni verdetto ha prova: `path:riga` + simbolo, oppure id/valori dal dato fisico, oppure esito `rg`.

---

## Tabella sintetica

| # | Problema | Verdetto | Prova-chiave |
|---|---|---|---|
| P1 | Rimorchio invisibile in "Segnalazioni aperte" | **RISOLTO (non-bug)** | selector filtra per `item.targa` (= targa rimorchio); dropdown include rimorchi + "Tutte" |
| P2 | Aggancio a manutenzione eseguita → chiude? | **RISOLTO** | propaga la chiusura (`agganciaSegnalazioneAManutenzioneEsistenteWriter.ts:347-388`) |
| P3 | Date chiusura manuale coerenti? | **RISOLTO** | f83dbbe1 ed ed063f99: `dataChiusura === chiusuraData === 11/05/2026`, reader robusto |
| P4 | Design dettaglio allineato al `.pen`? | **PARZIALE** | `.pen` leggibile e struttura corrisponde; fedeltà pixel non verificabile senza rendering; `.pen` modificato/non committato |
| P5 | "Segnalato da" = nomi reali nel gruppo? | **APERTO** | `NextManutenzioniPage.tsx:3502` → `segnalatoDa: "Autisti"` (generico) |
| P6 | Divieto gruppo+collegata enforced? | **PARZIALE** | creazione gruppo rifiuta collegata (`gruppoSegnalazioniWriter.ts:129`); l'aggancio NON rimuove/rifiuta il gruppo |
| P7 | Writer "presa in carico" rimosso? | **APERTO** | `presaInCaricoSegnalazioneWriter.ts` esiste; **mai chiamato da UI** (solo test + commenti) |
| P8 | Doppi interruttori disallineati | **RISOLTO (innocuo)** | 0 disallineamenti forti; 12 record su schema canonico, normalizzati dal reader |
| P9 | Marcatore gomme (A3) | **APERTO (confermato)** | 6 strutturate vs 15 "gomme" a testo (10 solo-testo senza marcatore) |
| P10 | Log `[DIAG-5B/5B-FIX/5C]` | **RISOLTO** | `rg` → nessun match |
| P11 | jsPDF helvetica in pdfEngine | **APERTO** | `pdfEngine.ts` solo `helvetica` (≥40 `setFont`); nessun `RobotoUnicode`/`addFont` |
| P12 | Stato git | **fotografia** | `master` avanti di 15 su `origin/master`; unico non committato: `docs/design/dettaglio-manutenzione.pen` |

---

## Dettaglio con prove

### P1 — RIMORCHIO INVISIBILE → RISOLTO (non è un bug)

**(a) Dato fisico — segnalazioni APERTE (non chiuse, non collegate) ora: 17, su 13 targhe; 4 sono RIMORCHI con segnalazioni aperte.**

| Targa | Categoria | Aperte |
|---|---|---|
| TI285053 | **centina (rimorchio)** | 1 ("Asse sferzante bloccato") |
| TI285217 | **semirimorchio asse sterzante** | 1 ("Tubo scarico crepato") |
| TI84069 | **semirimorchio asse fisso** | 1 ("Tagliata" – gomma) |
| TI84822 | **semirimorchio asse sterzante** | 1 ("Posteriore dx tutto spento") |
| TI298409 | trattore | 3 · TI315407 motrice 2 · TI113417 trattore 2 · TI178456/229717/233827/239279/279216/313387 1 ciascuna |

(TI287110 – il caso originale – ha 0 aperte ora: la sua ed063f99 è stata **chiusa oggi**, vedi P3.)

**(b) Codice.** Il selector `segnalazioniEleggibili` filtra per `item.targa` e `activeTarga` ([NextManutenzioniPage.tsx:1663-1679](src/next/NextManutenzioniPage.tsx#L1663-L1679)): per una segnalazione di rimorchio il campo `targa` **è** la targa rimorchio (es. ed063f99 `targa:"TI287110"`). Il raggruppamento `segnalazioniDaFareByTarga` raggruppa per `segnalazione.targa` ([:1680-1717](src/next/NextManutenzioniPage.tsx#L1680-L1717)) → le targhe rimorchio ottengono il proprio gruppo. Il menu mezzi ([:5595-5606](src/next/NextManutenzioniPage.tsx#L5595-L5606)) elenca **tutti** i mezzi da `workspace.mezzi` (`toMezzoOption` non filtra motrice/rimorchio) **+ opzione "Tutte"**; `mezziSelezionabili` ([:1883-1900](src/next/NextManutenzioniPage.tsx#L1883-L1900)) filtra solo per testo di ricerca.

**Verdetto:** i rimorchi **non sono invisibili**: sono selezionabili e le loro segnalazioni aperte compaiono sotto la **targa rimorchio** (o con "Tutte"). **Limite di design (non bug):** non compaiono sotto la vista della **motrice** trainante — la scoping è per targa esatta. Chi guarda solo la motrice non le vede; "Tutte" o la targa rimorchio sì.

### P2 — AGGANCIO A MANUTENZIONE GIÀ ESEGUITA → RISOLTO (chiude)

`agganciaSegnalazioneAManutenzioneEsistente` ([agganciaSegnalazioneAManutenzioneEsistenteWriter.ts](src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts)):
- `isTargetEseguitaOChiusa(target)` = `stato ∈ {eseguita, chiusa_da_evento}` o `chiusuraDi` presente ([:80-85](src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L80-L85));
- se vero, imposta `propagaChiusura=true` ([:347-350](src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L347-L350)) e in step 2 chiama `chiudiSegnalazioneDaEvento`/`chiudiControlloDaEvento` ([:370-388](src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L370-L388)) ereditando `chiusuraData` dalla manutenzione (`readChiusuraDataMs`, no `Date.now()`).
- Il **batch** riusa lo stesso writer per ogni sorgente ([:400-430](src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts#L400-L430)).

**Verdetto:** la segnalazione viene **CHIUSA** (propagazione), non resta aperta-ma-collegata. (Direzione inversa coperta da `closureOrchestrator.propagateChiusuraToLegame`.)

### P3 — DATE CHIUSURA MANUALE → RISOLTO (coerenti)

Valori reali (dato fisico, oggi):
- **f83dbbe1** (TI287110, "Lato sx luci ingombro…"): `stato:"chiusa"`, `chiusa:true`, `chiusa_by:"centro_controllo_next"`, `dataChiusura:1778481001738`, `chiusuraData:1778481001738`, `chiusuraDi:null`.
- **ed063f99** (duplicato "Luci ingombro laterali sx…", **chiuso oggi**): identici — `dataChiusura === chiusuraData === 1778481001738`.

`1778481001738` = **11/05/2026** per entrambi (stessa data ereditata, non la data del click — comportamento voluto PROMPT 50 R1).

Coerenza scrittura↔lettura:
- reader `nextAutistiDomain.ts:600-612` deriva `chiusa = chiusa===true || stato==="chiusa" || typeof chiusuraData==="number" || chiusuraRefId` e `dataChiusura = dataChiusura ?? chiusuraData` (**robusto su entrambi gli schemi**);
- riga Archivio `ArchivioRowSegnalazione.tsx:92,200` legge `data.chiusa===true` + `formatTimelineStamp(data.dataChiusura)`;
- frase storia `frasestoriaRecord.ts:286` legge `chiusuraData → dataChiusura → dataEsecuzione`.

**Verdetto:** campi temporali **coerenti tra loro** (`dataChiusura === chiusuraData`) e con la UI (timeline APERTA→CHIUSA mostra 11/05/2026). Nessun bug di scrittura/lettura. *(Nota: 0 record nel dataset hanno `dataChiusura ≠ chiusuraData`.)*

### P4 — DESIGN ALLINEATO → PARZIALE

- Il `.pen` **è leggibile** via Pencil MCP: `docs/design/dettaglio-manutenzione.pen` con 2 frame ("Dettaglio manutenzione — esempio stato ESEGUITA" e "… DA FARE") + componenti riusabili `comp/Field` e `comp/OriginRow`.
- Lo screenshot del frame ESEGUITA mostra: header mezzo (targa/modello/autista/km/data) + tab `Da fare / Dashboard / Mappa / Modifica / Dettaglio / Quadro PDF` + storico-timeline a sinistra + pannello dettaglio a destra (titolo, fornitore+km+Δkm, pulsanti `MODIFICA/DOSSIER/DOCUMENTO/PDF/Chiudi`, descrizione, riga origine). **La struttura corrisponde** alla `NextManutenzioniPage` reale (stessi tab, storico, pannello, "origini nel dettaglio").
- git: nessun commit dopo `38a684ee` con messaggio di "allineamento al design"; i commit che toccano i file dettaglio sono `a2b84d4e` ("…origini nel dettaglio"), `7b888b10`, `25e435ef` ("aggiornamento 21.08"). Il `.pen` è inoltre **modificato e non committato** (design in evoluzione).

**Verdetto PARZIALE:** struttura allineata (componenti `Field`/`OriginRow` ↔ campi/origini del dettaglio reale), ma **fedeltà visiva pixel non verificabile** senza rendere l'app, e il design corrente è uncommitted.

### P5 — "SEGNALATO DA = NOMI REALI" (flusso Crea lavoro dal gruppo) → APERTO

Handler crea-lavoro-dal-gruppo: [NextManutenzioniPage.tsx:3480-3505](src/next/NextManutenzioniPage.tsx#L3480-L3505) chiama `saveNextManutenzioneBusinessRecord({ …, origineTipo:"manuale", origineRefId:null, **segnalatoDa: "Autisti"**, … })` — riga [:3502](src/next/NextManutenzioniPage.tsx#L3502). Valore **generico hardcoded**, non i nomi reali degli autisti delle origini.

(Per contrasto: il "Crea lavoro" singolo usa il nome reale — `sourceRecord.segnalatoDa` [:2590](src/next/NextManutenzioniPage.tsx#L2590); e `createManutenzioneDaFareFromSegnalazione` usa `record.autistaNome`/`badgeAutista`.)

**Verdetto:** ancora generico **"Autisti"** nel solo flusso gruppo.

### P6 — DIVIETO GRUPPO+COLLEGATA → PARZIALE

- **Creazione/aggiunta gruppo:** `assertSelectedRecords` rifiuta una segnalazione **collegata** (`hasLinkedLavoro → "Segnalazione gia collegata"`, [gruppoSegnalazioniWriter.ts:129](src/next/writers/gruppoSegnalazioniWriter.ts#L129)) e **chiusa** ([:128](src/next/writers/gruppoSegnalazioniWriter.ts#L128)). Usato sia da `creaGruppoSegnalazioni` sia da `aggiungiAGruppo`. → divieto **ENFORZATO** in questa direzione.
- **Aggancio di una segnalazione già raggruppata:** i writer di aggancio (`agganciaSegnalazioneAManutenzioneEsistente`, `nextManutenzioneDaFareCreateWriter.patchSegnalazione`, `agganciaSorgenteAManutenzioneEsistente`) scrivono `linkedLavoroId`+`letta`+`stato` ma **NON** toccano `gruppoSegnalazioneId`. Il campo `gruppoSegnalazioneId` è scritto **solo** dal gruppo writer (`rg gruppoSegnalazioneId` → set/null solo in `gruppoSegnalazioniWriter.ts:162/201/229`). → collegare una segnalazione raggruppata **non** rimuove né rifiuta il gruppo.

**Verdetto PARZIALE:** il divieto D2a è enforced **a senso unico** (creazione gruppo blocca le collegate); l'altra direzione (collegare una raggruppata) **non** è enforced — il gruppo resta.

### P7 — WRITER "PRESA IN CARICO" (D3b: eliminare) → APERTO (ancora presente, non cablato)

- File e funzione presenti: `src/next/writers/presaInCaricoSegnalazioneWriter.ts` → `segnaPresaInCaricoSegnalazione`; + test `presaInCaricoSegnalazione.test.ts`.
- `rg segnaPresaInCaricoSegnalazione` su `src/`: usato **solo** nel proprio test e citato in **commenti** di `agganciaSegnalazioneAManutenzioneEsistenteWriter.ts:322` e `nextManutenzioneDaFareCreateWriter.ts:151`. **Nessuna chiamata da UI/runtime.**

**Verdetto:** writer **ancora presente** (decisione D3b non eseguita); di fatto **codice morto non cablato**.

### P8 — DOPPI INTERRUTTORI DI CHIUSURA → RISOLTO (innocuo)

Dato fisico (46 segnalazioni):
- Disallineamenti **forti** (stato-stringa ≠ stato reale dai due interruttori chiusura+legame): **0**.
- `dataChiusura ≠ chiusuraData` (entrambi presenti): **0**. `chiuso senza alcuna data`: **0**. `presa_in_carico senza link`: **0**. `link senza presa_in_carico`: **0**.
- Unico scarto di ridondanza: **12** record con `stato:"chiusa"` + `chiusuraData` **senza** il booleano legacy `chiusa:true` (chiusi via writer/aggancio canonico). Il reader li normalizza comunque (`nextAutistiDomain.ts:600-612`) → **innocui** (nessuna divergenza UI).
- (Oggi 9 record hanno `chiusa:true` — stamattina erano 2: Giuseppe ha chiuso a mano diversi record via `centro_controllo_next` durante la sessione.)

**Verdetto:** allineati nel senso che conta (0 forti); i ~11-12 "innocui" attesi corrispondono ai 12 record su schema canonico, già gestiti dal reader.

### P9 — MARCATORE GOMME (A3) → APERTO (confermato sul dato fresco)

- Manutenzioni con marcatore **strutturato** (`gommeInterventoTipo` / `gommePerAsse` / `gommeStraordinario`): **6**.
- Manutenzioni che citano "gomme/pneum" nella **descrizione**: **15**.
- **Solo testo** (gomme nel testo, **senza** marcatore): **10** (es. `1774962027367`, `1774363044856`, `1773066080204`, `1768996701410`, `1777979571388`, …).

**Verdetto:** anomalia A3 **reale**: il marcatore strutturato copre solo **6 su ~16** record gomme; gli altri 10 sono gomme riconoscibili solo dal testo.

### P10 — LOG `[DIAG-5B/5B-FIX/5C]` → RISOLTO

`rg "DIAG-5B|DIAG-5C|DIAG5B|5B-FIX"` su tutto il repo → **nessun match**. Log diagnostici assenti.

### P11 — jsPDF HELVETICA in pdfEngine.ts → APERTO

`pdfEngine.ts`: **solo** `helvetica` — ≥40 chiamate `doc.setFont("helvetica", …)` (es. righe 398, 414, 484, 590, 653, 685, 950, 966, …). `rg "RobotoUnicode|addFont|addFileToVFS|Roboto|NotoSans"` su `pdfEngine.ts` → **nessun match**. Nessun font Unicode custom registrato.

**Verdetto:** ancora **helvetica** (limiti Unicode non risolti in pdfEngine).

### P12 — STATO GIT → fotografia

- Branch: `master`, **avanti di 15** commit su `origin/master`, **0 indietro** (`git rev-list --left-right --count origin/master...master` → `0  15`).
- Non committato nel worktree: **solo** `docs/design/dettaglio-manutenzione.pen` (Modified, ` M`). Il `.pen` **è** presente come modifica non committata.
- Nei 15 commit avanti rientrano i due report di oggi (`03048990` riconciliazione, `b3215ba0` legacy).

---

## EXTRA — problemi nuovi notati (solo elenco, nessuna analisi)

1. Crea-lavoro-dal-gruppo scrive `origineTipo:"manuale"` + `origineRefId:null` sulla manutenzione ([NextManutenzioniPage.tsx:3499-3501](src/next/NextManutenzioniPage.tsx#L3499-L3501)); il legame alle origini resta solo forward (aggancio batch), il back-link `origineTipo/origineRefId` sul record manutenzione non riflette le segnalazioni.
2. Convivono **due meccanismi di chiusura segnalazione**: manuale `centro_controllo_next` (scrive `chiusa:true`+`dataChiusura`+`chiusuraData`) e canonico `chiudi*DaEvento` (scrive `stato:"chiusa"`+`chiusuraDi`+`chiusuraData`, **senza** `chiusa:true`). Riconciliati solo a livello reader.
3. `presaInCaricoSegnalazioneWriter` è codice non cablato ad alcuna UI (vedi P7).
4. `@controlli_mezzo_autisti` è passato 401→400 durante la sessione (un controllo rimosso oggi); dato in movimento mentre si legge.
5. f83dbbe1 ed ed063f99 chiusi entrambi con `dataChiusura` 11/05/2026 (data ereditata fissa, non derivata dalla timeline propria delle due segnalazioni di febbraio).

---

## Regole rispettate
- Zero scritture su dati e codice; sola lettura Firestore (`.get()`) + `rg`/lettura file.
- Ogni verdetto con prova reale (path:riga, id/valori, esito `rg`).
- "NON VERIFICABILE/PARZIALE" dichiarati con motivo dove la prova non è conclusiva (P4).
