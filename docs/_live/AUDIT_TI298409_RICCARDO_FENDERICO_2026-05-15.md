# AUDIT TI298409 — Riccardo Fenderico — ciclo gomme (PROMPT 46)

Data: 2026-05-15
Sorgente dati: `C:\tmp\backup_firestore_prompt44_20260515_071257\` (backup PROMPT 44, 5 collection).
Read-only. Nessuna modifica codice/dati.

---

## 1. Conteggi reali per TI298409

| Collection | Totale | TI298409 |
|------------|--------|----------|
| `@manutenzioni` | 73 | **6** |
| `@segnalazioni_autisti_tmp` | 37 | **11** |
| `@controlli_mezzo_autisti` | 350 | **16** |
| `@gomme_eventi` | 11 | **0** |

Filtro: match su **qualunque** campo targa del record (`targa`, `targaCamion`, `targaMotrice`, `targaRimorchio`). Dump completo in [test-results/audit-ti298409-2026-05-15-prompt46/](../../test-results/audit-ti298409-2026-05-15-prompt46/).

**Importante**: TI298409 e' la **motrice** dell'autista Riccardo Fenderico (badge 1011). Riccardo guida anche il rimorchio **TI280132** (storico) e **TI287110** (alla data 08/05). Alcuni record gomme TI298409 in realta' riguardano il rimorchio (gomme rimorchio): vanno letti con l'ambito.

---

## 2. Timeline cronologica completa TI298409 (33 record)

Sintesi (timeline JSON completa in `timeline-TI298409.json`):

```
31/12/2025 | controllo     | ELVIRA DEMMA           | OK
12/01/2026 | manutenzione  | (no autore)            | TAGLIANDO COMPRESSORE
12/01/2026 | controllo  x2 | RICCARDO FENDERICO     | OK
22/01/2026 | controllo     | RICCARDO FENDERICO     | OK
22/01/2026 | segnalazione  | RICCARDO FENDERICO     | "Lampadina anabbaglianti dx bruciata"  (linked: 4ffc49f9...)
26/01/2026 | controllo     | RICCARDO FENDERICO     | KO (perdite)  (linked: c3ef6c33..., aa3e15a8...)
26/01/2026 | segnalazione  | RICCARDO FENDERICO     | "Manometro pressione cisterna non funzionante"  (nessun lavoro)
28/01/2026 | controllo     | RICCARDO FENDERICO     | OK
29/01/2026 | segnalazione  | RICCARDO FENDERICO     | "Fare posteriore dx tutto spento"  (linked: 23c31228...)
29/01/2026 | controllo     | RICCARDO FENDERICO     | OK
30/01/2026 | segnalazione  | RICCARDO FENDERICO     | "Trattore problemi riscaldamento + webasto"  (linked: be49d61f...)
03/02/2026 | controllo + segn | RICCARDO FENDERICO  | OK + "asse sferzante rimorchio bloccato storto"
06/02/2026 | controllo  x2 | RICCARDO FENDERICO     | OK
17/02/2026 | segnalazione  | RICCARDO FENDERICO     | "Cambiate 3 lampadine"  (linked: 74699f0a...)
24/02/2026 | segnalazione  | RICCARDO FENDERICO     | "Luci ingombro laterali sx tutte spente"  (linked: dedc1377...)
25/02/2026 | segnalazione  | RICCARDO FENDERICO     | "Lato sx luci ingombro tutte spente"  (nessun lavoro)
09/03/2026 | manutenzione  | (no autore)            | CAMBIO GOMME – straordinario | Anteriore | Kumo  (stand-alone)
23/03/2026 | controllo     | RICCARDO FENDERICO     | OK
31/03/2026 | manutenzione  | (no autore)            | CONVERGENZA  (stand-alone)
*** 01/04/2026 | controllo     | RICCARDO FENDERICO     | KO (gomme)  (linked: from-lavoro-daade4a2-... TI280132)
*** 01/04/2026 | segnalazione  | RICCARDO FENDERICO     | "1 asse quasi finito"  (linked: 8d2b5c5a... ORFANO)
08/04/2026 | controllo     | RICCARDO FENDERICO     | OK
14/04/2026 | manutenzione  | (no autore)            | OLIO MOTORE PER RABBOCCO  (stand-alone)
17/04/2026 | controllo     | RICCARDO FENDERICO     | OK
23/04/2026 | controllo     | RICCARDO FENDERICO     | OK
24/04/2026 | manutenzione  | RICCARDO FENDERICO     | "Segnalazione: altro - Perdita liquido raffreddamento da un manicotto"  (origine seg b2d22ee1...)
24/04/2026 | segnalazione  | RICCARDO FENDERICO     | "Perdita liquido raffreddamento"  (linked: from-lavoro-4ed587dc...)
04/05/2026 | controllo     | RICCARDO FENDERICO     | OK
*** 08/05/2026 | segnalazione  | RICCARDO FENDERICO     | "4 gomme di trazione usurate"  (linked: from-lavoro-a5ba1512... ORFANO)
*** 12/05/2026 | manutenzione  | (no autore)            | "CAMBIO GOMME asse: Posteriore Kumho"  (stand-alone, fornitore VALTELLINA PNEUMATICI)
```

I 5 record gomme-related sono marcati con `***`. La timeline e' nel file [test-results/audit-ti298409-2026-05-15-prompt46/timeline-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/timeline-TI298409.json).

---

## 3. I 5 record chiave del ciclo gomme

### 3.1 Controllo KO GOMME del 01/04/2026 (id `1667f266-5160-4163-a5a3-14796034b1c6`)

```json
{
  "obbligatorio": true,
  "target": "rimorchio",
  "targaCamion": "TI298409",
  "targaRimorchio": "TI280132",
  "autistaNome": "RICCARDO FENDERICO",
  "badgeAutista": "1011",
  "timestamp": 1775023441488,    // 2026-04-01 ore italiane
  "letta": true,
  "chiuso": true,                // <-- gia' chiuso Firestore
  "chiuso_by": "centro_controllo_next",
  "dataChiusura": 1778477757841, // <-- 2026-05-10 19:35:57
  "linkedLavoroId": "from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d",
  "note": "1 asse rimorchio gomme lisce",
  "check": { "gomme": false, "freni": true, "luci": true, "perdite": true }
}
```

- **Stato Firestore**: `chiuso: true` dal 10/05 (chiuso da Centro Controllo). NON e' "ancora aperto" come pensava Giuseppe nello screenshot.
- **Discrepanza UI**: il `linkedLavoroId` punta a una manutenzione daFare ancora aperta (TI280132 `from-lavoro-daade4a2-...`, vedi 3.3) — l'UI potrebbe mostrare il controllo come "presa in carico/aperto" perche' guarda lo stato della daFare collegata, non `chiuso: true` sul controllo.
- **Target rimorchio**: il KO e' per il rimorchio TI280132, NON la motrice TI298409. La daFare e' correttamente su TI280132.

### 3.2 Segnalazione del 01/04/2026 "1 asse quasi finito" (id `c2568521-a959-4791-aea8-485fb2c9e944`)

```json
{
  "data": 1775023509867,         // 2026-04-01
  "tipoProblema": "gomme",
  "problemaGomma": "usurata",
  "posizioneGomma": "asse1",
  "ambito": "rimorchio",
  "targa": "TI280132",           // <-- targa principale = rimorchio
  "targaCamion": "TI298409",
  "targaRimorchio": "TI280132",
  "categoriaMezzo": "semirimorchio asse sterzante",
  "autistaNome": "RICCARDO FENDERICO",
  "descrizione": "1 asse quasi finito",
  "stato": "presa_in_carico",
  "letta": true,
  "linkedLavoroId": "8d2b5c5a-04bd-429a-87b7-739a41f11536"  // <-- ORFANO
}
```

- **Ambito rimorchio**: anche questa e' per il rimorchio TI280132.
- **`linkedLavoroId` orfano**: `8d2b5c5a-...` non esiste in `@manutenzioni` (verificato sull'intero dump, non solo su TI298409). Dangling pointer.
- **Stato `presa_in_carico`** ma il lavoro collegato non c'e' piu' — la segnalazione resta "appesa" nell'UI senza azione possibile.

### 3.3 Manutenzione daFare `from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d` (in TI280132)

Trovata grep-ando sul dump completo `@manutenzioni`:

```json
{
  "id": "from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d",
  "targa": "TI280132",
  "stato": "daFare",
  "data": "2026-04-01",
  "descrizione": "Controllo KO: GOMME",
  "origineRefId": "1667f266-5160-4163-a5a3-14796034b1c6"   // <-- punta al controllo 01/04
}
```

- Esiste, sta su TI280132, stato `daFare`, **non ancora eseguita**. Il legame back-link al controllo c'e'.
- E' il motivo per cui l'UI vede il "Controllo KO 01/04" come "ancora aperto" — la daFare collegata non e' stata eseguita.

### 3.4 Segnalazione 08/05/2026 "4 gomme di trazione usurate, quasi finite. Da sostituire" (id `7d1d8009-69af-4578-a8ef-060d1d4f5766`)

```json
{
  "data": 1778247026772,         // 2026-05-08
  "tipoProblema": "gomme",
  "problemaGomma": "usurata",
  "posizioneGomma": "posteriore",
  "ambito": "motrice",
  "targa": "TI298409",           // <-- motrice!
  "targaCamion": "TI298409",
  "targaRimorchio": "TI287110",
  "categoriaMezzo": "trattore stradale",
  "autistaNome": "RICCARDO FENDERICO",
  "descrizione": "4 gomme di trazione usurate, quasi finite. Da sostituire",
  "stato": "presa_in_carico",
  "letta": true,
  "linkedLavoroId": "from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2"  // <-- ORFANO
}
```

- **Motrice TI298409**: ambito = motrice, gomme posteriori.
- **`linkedLavoroId` orfano**: `from-lavoro-a5ba1512-...` non esiste in `@manutenzioni`. Dangling pointer.
- **Stato `presa_in_carico`** in attesa di un lavoro che non e' mai stato registrato come daFare in Firestore (o e' stato cancellato manualmente — vedi storia "record fantasma" PROMPT 41/42 di TI298409).

### 3.5 Manutenzione del 12/05/2026 "CAMBIO GOMME posteriore Kumho" (id `1778587360877`)

```json
{
  "id": "1778587360877",
  "targa": "TI298409",
  "stato": "eseguita",
  "data": "2026-05-12",
  "descrizione": "CAMBIO GOMME\nasse: Posteriore\nmarca: Kumho\nkm mezzo: 383482\nintervento: sostituzione",
  "fornitore": "VALTELLINA PNEUMATICI",
  "origineTipo": null,
  "origineRefId": null,
  "linkedLavoroId": null,
  "chiusuraDi": null
}
```

- **Stand-alone**: nessun legame back-link a segnalazione, nessuna traccia di chiusura.
- **Stesso asse della segnalazione 08/05** (posteriore motrice, Kumho/Kumo) — semanticamente corrisponde, ma il legame Firestore non e' stato registrato (l'officina/CC l'ha inserita manualmente senza usare il flusso "esegui da daFare").

---

## 4. Relazioni attese vs reali

Giuseppe attendeva:

### A. Controllo KO GOMME 01/04 → ancora aperto, da chiudere
| Aspetto | Realta' |
|---------|---------|
| Stato controllo | `chiuso: true` da 10/05 |
| Stato visivo UI | "presa in carico/aperto" probabilmente perche' la daFare collegata e' ancora aperta |
| Legame | `linkedLavoroId -> daFare TI280132 from-lavoro-daade4a2-...` ESISTE ✓ |
| Da chiudere? | **Si'**, ma chiudendo la daFare TI280132 (eseguendo il cambio gomme rimorchio), il closureOrchestrator PROMPT 44 D1 propaghera' la chiusura sul controllo. |

### B. Segnalazione 08/05 → collegata all'evento app del 12/05
| Aspetto | Realta' |
|---------|---------|
| Legame Firestore segnalazione → evento 12/05 | **ASSENTE** |
| Segnalazione: linkedLavoroId | `from-lavoro-a5ba1512-...` ORFANO (non in @manutenzioni) |
| Manutenzione 12/05: origineRefId | `null` |
| Possibile ricostruzione automatica? | No: i due record hanno solo coincidenze semantiche (stessa targa, stesso ambito posteriore motrice, stesso fornitore Kumho/Valtellina, date vicine). Nessun campo li lega in Firestore. |

### C. Manutenzione 12/05 → chiude la segnalazione 08/05
| Aspetto | Realta' |
|---------|---------|
| `chiusuraDi` su manutenzione | `null` |
| `chiusuraRefId` su segnalazione | (manca, e' segnalazione, non manutenzione) |
| Status segnalazione | `presa_in_carico` (non `chiusa`) |
| Chiusura propagata da closureOrchestrator? | No, non c'era legame da seguire (entrambi i campi `origineTipo`/`origineRefId` sulla manutenzione sono `null`). |

**Verdetto generale**: solo la relazione **A** ha un legame Firestore consistente (anche se il display UI puo' confondere stato controllo vs stato daFare). Le relazioni **B** e **C** non esistono come legami Firestore. Sono ricostruibili a vista (umano), ma non automaticamente.

---

## 5. Raccomandazioni operative per Giuseppe

### Per il Controllo KO GOMME 01/04 (id `1667f266-...`)
> **Non e' "aperto" in senso stretto** (`chiuso: true` su Firestore). Cio' che l'UI mostra come "in lavorazione" e' la manutenzione daFare `from-lavoro-daade4a2-...` su **rimorchio TI280132** (non TI298409). Per "chiuderlo completamente": apri `/next/manutenzioni`, filtra targa TI280132, trova la riga "Controllo KO: GOMME" del 01/04, esegui il cambio gomme rimorchio (quando avverra' nella realta'). Il closureOrchestrator PROMPT 44 D1 chiudera' automaticamente il controllo originale.

### Per la Segnalazione 08/05 "4 gomme di trazione usurate" (id `7d1d8009-...`)
> **Non sistemabile via UI attuale.** La segnalazione punta a una daFare orfana (`from-lavoro-a5ba1512-...`) che non esiste piu' in Firestore (probabilmente cancellata in passato come record fantasma). Stato runtime: la segnalazione resta `presa_in_carico` indefinitamente. **Per chiuderla servono opzioni nuove non ancora costruite**:
> - **(opzione futura X1)** estendere il modale "Aggancia evento" alle manutenzioni **eseguita** (non solo cambi gomme) per agganciare retroattivamente la segnalazione 08/05 alla manutenzione 12/05.
> - **(opzione futura X2)** UI "Sgancia link orfano" che rimuove `linkedLavoroId` quando la daFare non esiste piu', riportando la segnalazione a `nuova`.
> - **(workaround manuale)** modifica Firestore direttamente (out of scope per PROMPT 46).
>
> Nota: il merge T1 di PROMPT 45 NON aiuta — filtra solo daFare/programmata, ed in questo caso la segnalazione ha gia' un `linkedLavoroId` (`hasLinkedLavoro` blocca pre-modale).

### Per la Manutenzione 12/05 "CAMBIO GOMME posteriore Kumho" (id `1778587360877`)
> **Niente da sistemare sul record**: e' eseguita correttamente con fornitore Valtellina Pneumatici. **Se Giuseppe vuole il legame retroattivo con la segnalazione 08/05**, dipende dalla stessa funzionalita' "Aggancia segnalazione a manutenzione eseguita" che oggi non esiste (vedi opzione futura X1 sopra).

---

## 6. Perche' PROMPT 45 T5 ha sbagliato

### Errore strutturale dello script audit T5
Lo script `audit-ti298409-2026-05-15.cjs` di PROMPT 45 ha fatto **solo cross-reference monodirezionale** (manutenzione → sorgente via `origineRefId`):

1. Ha filtrato `@manutenzioni` per `targa === TI298409 AND (sottotipo === gomme OR descrizione include "gomm")` → trovato 2 record.
2. Per il record principale `1778587360877` ha letto `origineRefId: null` → ha concluso "stand-alone".
3. Per cercare "la segnalazione collegata" ha guardato l'unica manutenzione `from-lavoro-*` presente fra le 6 manutenzioni di TI298409 — `from-lavoro-4ed587dc-...` (perdita liquido del 24/04) — e ha riportato la SUA sorgente `b2d22ee1-...` come "la segnalazione collegata al caso".
4. Ha concluso falsamente: "la segnalazione del 24/04 era per perdita liquido raffreddamento, cambio gomme stand-alone, nessun mismatch".

### Cosa avrebbe dovuto fare
- Filtrare `@segnalazioni_autisti_tmp` per **targa** TI298409 (in tutti i campi `targa*`) — avrebbe trovato 11 segnalazioni, incluse le **due gomme** del 01/04 e 08/05.
- Filtrare `@controlli_mezzo_autisti` per **targa** TI298409 — avrebbe trovato 16 controlli incluso il **KO gomme** del 01/04.
- Per ciascuna segnalazione/controllo, leggere `linkedLavoroId` (forward link) e verificare se la manutenzione collegata esiste in `@manutenzioni`. Se non esiste → orfana.
- Cross-referenziare bidirezionalmente: dalla manutenzione cercare la sorgente; dalla sorgente cercare la manutenzione; segnare gli orfani.

### Sintesi causa
**T5 cercava per LEGAME, non per TARGA.** Ha ignorato che le segnalazioni TI298409 non collegate via `origineRefId` alla manutenzione gomme esistevano comunque (perche' i loro `linkedLavoroId` erano orfani o puntavano a daFare separate). Inoltre ha confuso "la segnalazione collegata via back-link al record gomme stand-alone" (inesistente, perche' stand-alone) con "una segnalazione qualsiasi dei record gomme di Riccardo" (esistono, ma non collegate).

### Lezione per futuri audit
- **Cerca sempre per targa, non per legame.**
- **Verifica esistenza dei target dei `linkedLavoroId`/`origineRefId`** — orfani esistono nella realta' (record cancellati manualmente, fantasmi PROMPT 41/42).
- **Cross-referenzia bidirezionalmente.**
- **Filtra anche su `targaCamion`/`targaMotrice`/`targaRimorchio`** — record di rimorchio possono avere targa principale del rimorchio e targa motrice in altro campo.

---

## Allegati

- [test-results/audit-ti298409-2026-05-15-prompt46/manutenzioni-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/manutenzioni-TI298409.json) (6 record)
- [test-results/audit-ti298409-2026-05-15-prompt46/segnalazioni-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/segnalazioni-TI298409.json) (11 record)
- [test-results/audit-ti298409-2026-05-15-prompt46/controlli-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/controlli-TI298409.json) (16 record)
- [test-results/audit-ti298409-2026-05-15-prompt46/gomme_eventi-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/gomme_eventi-TI298409.json) (0 record)
- [test-results/audit-ti298409-2026-05-15-prompt46/timeline-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/timeline-TI298409.json) (33 entry normalizzate)
- [test-results/audit-ti298409-2026-05-15-prompt46/timeline-gomme-TI298409.json](../../test-results/audit-ti298409-2026-05-15-prompt46/timeline-gomme-TI298409.json) (5 entry gomme-related)
- Script audit: [scripts/oneoff/audit-ti298409-prompt46-2026-05-15.cjs](../../scripts/oneoff/audit-ti298409-prompt46-2026-05-15.cjs)
