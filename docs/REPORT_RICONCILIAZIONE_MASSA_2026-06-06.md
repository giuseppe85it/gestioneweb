# REPORT RICONCILIAZIONE DI MASSA — segnalazioni / controlli ↔ manutenzioni

**Data:** 2026-06-06 · **Modo:** SOLO ANALISI E REPORT — **zero scritture su Firestore, zero modifiche al codice.**
**Fonte dati (sola lettura):** service account Admin su `storage/@manutenzioni`, `storage/@segnalazioni_autisti_tmp`, `storage/@controlli_mezzo_autisti` (+ `storage/@mezzi_aziendali` per i nomi leggibili).
**Snapshot live letto il:** 2026-06-06 17:03 UTC — `@manutenzioni` 84 record · `@segnalazioni_autisti_tmp` 46 · `@controlli_mezzo_autisti` 401 · `@mezzi_aziendali` 32.

> Questo file è l'**unica** scrittura prodotta nel repo. Nessun dato è stato modificato: tutte le "azioni proposte" qui sotto sono **proposte da approvare**, non eseguite.

---

## 0. Come ho letto i dati (note di metodo)

**Stato reale della segnalazione = "doppi interruttori", non l'etichetta `stato`.**
Ogni segnalazione ha due interruttori indipendenti che possono divergere dall'etichetta testuale `stato`:
- **interruttore CHIUSURA** = `chiusa===true` **oppure** `stato==="chiusa"` **oppure** presenza di `chiusuraDi`/`chiusuraRefId`/`dataChiusura`;
- **interruttore PRESA IN CARICO / LEGAME** = presenza di `linkedLavoroId`/`linkedLavoroIds` **oppure** `stato==="presa_in_carico"` **oppure** `dataPresaInCarico`.

Da qui tre stati reali: **APERTA** (nessun interruttore acceso), **IN CARICO** (legame acceso, chiusura spenta), **CHIUSA** (chiusura accesa). Il legame doppio è bidirezionale: `linkedLavoroId` (segnalazione→lavoro) deve corrispondere a `origineRefId`/`origineRefs` (manutenzione→sorgente).

**Famiglia della manutenzione (le manutenzioni NON sono omogenee).**
- **GOMME** = marcatore strutturato `gommeInterventoTipo` ∈ {ordinario, straordinario} (oppure `gommePerAsse`/`gommeStraordinario`/`assiCoinvolti`). **Mai dedotto dal testo** ai fini della classe di famiglia. *(Vedi anomalia A3: molti "CAMBIO GOMME" legacy NON hanno il marcatore.)*
- **COMPRESSORE** = `tipo==="compressore"` → usa **ore** al posto dei km.
- **ATTREZZATURE** = `tipo==="attrezzature"`.
- **MEZZO** = tutto il resto.

**Stato reale della manutenzione.** `stato` esplicito quando presente; altrimenti (34/84 legacy senza `stato`) → **eseguita** se ha `dataEsecuzione`/`km`/`ore`/`importo`, altrimenti **daFare**. Le voci con stato dedotto sono marcate `eseguita*` nel catalogo per targa.

**Controlli.** Niente campo `esito`: il problema (KO) è nei booleani `check{gomme,freni,perdite,luci}` dove **`false` = KO**, e/o nel campo `note`. `chiuso===true` = preso in carico/archiviato. Su 401 controlli, solo **~29** portano un KO o una nota reale; gli altri sono check giornalieri "tutto ok".

**Forza del match** (segnalazione aperta/ambigua → manutenzione eseguita, stessa targa, esecuzione ≥ data segnalazione):
- **FORTE** = la manutenzione cita la segnalazione (descrizione "Segnalazione: …") o la include in `origineRefs`;
- **MEDIO** = stessa area del problema + esecuzione successiva e vicina, senza riferimento esplicito;
- **DEBOLE** = solo compatibilità temporale sulla stessa targa;
- **NESSUNO** = nessuna eseguita compatibile → problema probabilmente **ancora aperto davvero**.

---

## 1. RIEPILOGO (totali per categoria)

### Segnalazioni autisti (46 totali)

| Categoria | N | Significato |
|---|---:|---|
| Già coerenti — **chiuse** con lavoro eseguito e doppio legame valido | **13** | nulla da fare |
| Già coerenti — **in lavorazione** (presa in carico, lavoro ancora `daFare`) | **8** | nulla da fare, lavoro pendente |
| **Ricucitura FORTE proposta** (lavoro eseguito e collegato, manca solo la chiusura) | **3** | chiudere la segnalazione |
| **MEDIO da confermare** (stessa area, lavoro eseguito plausibilmente lo stesso) | **6** | confermare → poi agganciare/chiudere |
| **Davvero aperte** (nessuna eseguita compatibile) | **11** | problemi reali ancora aperti |
| Informative / non-manutenzione / test (no proposta) | **4** | rumore di fondo |
| **Anomalia**: chiusa **senza** legame né lavoro tracciabile | **1** | TI287110 (vedi §7) |

### Controlli mezzo (401 totali; ~29 con KO/nota)

| Categoria | N (circa) |
|---|---:|
| Collegati a un lavoro (coerenti) | 2 |
| Chiusi via flag controllo (presi in carico, soprattutto freni TI313387) | ~14 |
| Riconciliabili a manutenzione esistente non collegata (gomme/freni/piedi) | ~3 famiglie |
| Problematici ancora aperti, non collegati (problemi reali) | ~10 |
| Anomalia (nota spazzatura) | 1 |

### Manutenzioni (84 totali)
- Per famiglia: **mezzo 69**, **compressore 10**, **attrezzature 5** — di cui **GOMME (marcatore strutturato) 6**.
- Con back-link a sorgente: **50** (`origineRefId`/`origineRefs`) — 20 da segnalazione, 2 da controllo, resto manuale/legacy.

---

## 2. Proposte FORTI (lavoro risulta già fatto — manca solo la chiusura)

Sono segnalazioni **IN CARICO** il cui lavoro collegato è **eseguito**: il doppio legame è già corretto e bidirezionale, ma l'interruttore di chiusura della segnalazione è rimasto spento. Azione proposta: **chiusura** della segnalazione (nessun nuovo aggancio necessario).

| # | Targa (mezzo) | Segnalazione (data · autista) | Lavoro collegato — eseguito | Azione proposta |
|---|---|---|---|---|
| F1 | **TI239279** (Renault T460) | 30/03/2026 · O. Butti — "Tubo 10 metri rotto, altri tubi perdono dalle guarnizioni…" *(seg 261619fc)* | MAN "Segnalazione: altro - Tubo 10 metri rotto…" · **eseguita** 01/04 (Milio) *(from-lavoro-5dd4afde)* | **Chiudere** la segnalazione |
| F2 | **TI313387** (Renault D16.280) | 21/04/2026 · O. Butti — "Perdita olio freni posteriore lato guida" *(seg c7bc5a05)* | MAN "Segnalazione: idraulico - Perdita olio freni posteriore lato guida" · **eseguita** 22/04 (Sciurba) *(from-lavoro-f609de79)* | **Chiudere** la segnalazione |
| F3 | **TI178456** (Renault Lanterna 430) | 11/05/2026 · O. Butti — "Alternatore" (note: ok da Massimiliano) *(seg 0915617c)* | MAN "sostituzione Alternatore" · **eseguita** 12/05 (Mirmax, km 670954) *(man 1778592051280)* | **Chiudere** la segnalazione |

---

## 3. Proposte MEDIE (stessa area, da confermare riga per riga)

Segnalazioni **APERTE** con una manutenzione **eseguita** sulla stessa targa, stessa area, esecuzione successiva: nessun riferimento esplicito, quindi **da confermare** prima di agganciare/chiudere.

| # | Targa | Segnalazione (data) | Manutenzione eseguita candidata | Confidenza | Azione proposta |
|---|---|---|---|---|---|
| M1 | **TI233827** | 13/01 — "Ammortizzatori ultimo asse" *(e8750e0e)* | "**Sostituito ammortizzatori posteriori 4° asse**" · 12/02 (Augustoni) *(man 1777474997286)* | alta (testo quasi identico) | confermare → agganciare + chiudere |
| M2 | **TI285217** | 26/01 — "Manometro pressione cisterna non funzionante" *(c1fac5b8)* | "Segnalazione: altro - **Manometro cisterna non funzionante**…" · 10/04 (Milio) *(from-lavoro-4cc1d480)* — è il lavoro che ha chiuso la segnalazione gemella d4964b81 (03/04, stesso testo) | alta (**duplicato** di problema già risolto) | confermare → agganciare + chiudere |
| M3 | **TI280132** | 13/05 — "Gomme primo asse molto usurate / due gommoni consumati" *(1dab2f26)* | GOMME "Controllo KO: 2 GOMME Kumho — **asse1**" · 20/05 (Valtellina) *(from-lavoro-daade4a2)* — stesso asse della gemella già chiusa c2568521 | alta (gomme stesso asse) | confermare → agganciare + chiudere |
| M4 | **TI285217** | 19/02 — "Tubo scarico crepato" *(6a64e3bd)* | "SISTEMAZIONE TUBO DA 10 MT + cambio 4 guarnizioni Storz" · 30/03 (Milio) *(man 1774962004752)* | media | confermare |
| M5 | **TI113417** | 26/02 — "Perdita aria molto forte spia accesa" *(116f7c43)* | "Tagliando e lavori… filtri (essiccatore…)…" · 31/03 (Sciurba) *(man 1776791310225)* | media | confermare |
| M6 | **TI113417** | 27/02 — "Perdita di olio + perdita di aria" *(8bcb855c)* | stesso tagliando 31/03 (olio motore + essiccatore) *(man 1776791310225)* | media | confermare |

> **Gomme con riserva (NON proposta):** TI84069 — "Tagliata" (gomma **forata, asse2**, 05/02, seg 7e9925c6). Sulla targa risultano cambi gomme **asse1** (21/01, *prima*) e **asse3** (24/03, *dopo*), **non asse2** → match non concludente. Da verificare su `@cambi_gomme_autisti_tmp` (fuori perimetro di questo report).

---

## 4. Proposte DEBOLI / informative (solo elencate, nessuna azione)

Per regola, le DEBOLI **non** diventano azioni. Qui le segnalazioni aperte le cui uniche eseguite compatibili sono **temporalmente** vicine ma **non pertinenti**, più le voci non-manutenzione:

- **TI178456** — "Rumore (prova)" (06/01, G. Milio) → **record di test** ("(prova)"). Da scartare.
- **TI313387** — "Manca attrezzatura per scaricare (chiodi, cunei, guarnizioni, martello)" (15/01) → **logistica**, non un guasto.
- **TI298409** — "Cambiate 3 lampadine." (17/02) → l'autista comunica un intervento **già fatto da sé**; nessuna manutenzione attesa.
- **TI233827** — "Ho lasciato il camion da Augustoni… serbatoio a metà" (26/05) → nota **informativa** su consegna/gasolio.

---

## 5. Segnalazioni in lavorazione (presa in carico, lavoro ancora da eseguire) — coerenti

Legame corretto, lavoro `daFare`: **non** sono "aperte da ricucire", sono pendenti.

| Targa | Segnalazione | Lavoro collegato (daFare) |
|---|---|---|
| TI324633 | "Tachigrafo sballato" (22/04) | "Segnalazione: elettrico - Tachigrafo sballato" *(from-lavoro-c3b066d4)* |
| TI315407 | "Spia guasto ventola" (30/04) | "Segnalazione: motore - Spia guasto ventola" *(from-lavoro-ff4d97f1)* |
| TI315407 | "Errore guasto ventola" (11/05) | "Segnalazione: elettrico - Errore guasto ventola" *(from-lavoro-cd85c334)* |
| TI315407 | "Rallentatore FS" (20/05) | "retard difetto" *(man 75420256…)* |
| TI324623 | "Tagliando in scadenza + aria condizionata KO" (21/05) | "programmare tagliando e sistemazione aria condizionata con Daf Italia" *(man bc03fcd9…)* |
| TI279216 | "Asse anteriore rumore… far controllare in officina" (21/05) | "far controllare da Augustoni…" *(man d0c31311…)* |
| TI233827 | "Motore in protezione" (20/05) **e** "Valvole di non ritorno" (29/05) | **stesso** lavoro raggruppato "motore - Motore in protezione" *(man 1780597640377, origineRefs = entrambe)* |

> Nota positiva: TI233827 mostra un **raggruppamento corretto** di 2 segnalazioni su 1 lavoro via `origineRefs` multipli. Il cluster **ventola TI315407** (3 segnalazioni 30/04–20/05 + 1 aperta, §6) è invece frammentato in 3 lavori distinti tutti `daFare`.

---

## 6. Segnalazioni davvero aperte (nessuna eseguita compatibile → problemi reali)

| Targa | Segnalazione (data · autista) | Area |
|---|---|---|
| TI298409 | "Lampadina anabbaglianti dx bruciata" (22/01 · Fenderico) | luci |
| TI84822 | "Posteriore dx tutto spento" (29/01 · Fenderico) | elettrico (rimorchio) |
| TI298409 | "Riscaldamento/aria non scalda + webasto a intermittenza" (30/01 · Fenderico) | clima |
| TI285053 | "Asse sterzante rimorchio bloccato storto — appuntamento Sciurba" (03/02 · Fenderico) | meccanica |
| TI239279 | "Sensore Ad Blue non funziona + spia scappamento" (10/02 · Martinelli) | elettronica motore |
| TI287110 | "Luci ingombro laterali sx tutte spente" (24/02 · Fenderico) | luci — **vedi anomalia A1** |
| TI84069 | "Gomma tagliata/forata asse2" (05/02 · Calabrese) | gomme (asse2 non coperto, §3) |
| TI315407 | "Anabbagliante dx non funzionante" (14/01 · Milio) | luci |
| TI315407 | "Ventola" (20/05 · Selimi) | motore (affine al cluster ventola in lavorazione) |
| TI229717 | "Spia motore accesa" (26/05 · Attardi) | motore |
| TI279216 | "Lampadina d'ingombro lato dx superiore" (01/06 · Lauro) | luci |

---

## 7. ANOMALIE

- **A1 — Chiusura senza legame né lavoro tracciabile (TI287110).** La segnalazione **f83dbbe1** "Lato sx luci ingombro tutte spente — non si può circolare così" (25/02) risulta `chiusa:true` (`chiusa_by:"centro_controllo_next"`, `dataChiusura` valorizzata) **ma senza** `linkedLavoroId` né `chiusuraRefId` e **senza** alcuna manutenzione di luci sulla targa. È inoltre **duplicato** della gemella **ancora aperta** ed063f99 (24/02, stesso problema). → Chiusura "a mano" non tracciata: non si può dimostrare che il lavoro sia stato fatto. Il problema luci ingombro sx **potrebbe essere ancora reale** (per questo ed063f99 è elencata tra le aperte).
- **A2 — Controllo con nota spazzatura (TI334558).** Controllo 5f1c973e (22/12/2025, E. Selimi) con `note:"Sgfvhghh"`; targa "TI 334558" (con spazio) **non presente** in `@mezzi_aziendali`. → record di test/sporco.
- **A3 — Famiglia GOMME eterogenea: marcatore presente solo su 6 record.** Esistono ~12–13 manutenzioni con "CAMBIO GOMME" nella **descrizione**, ma solo **6** portano il marcatore strutturato `gommeInterventoTipo`. Per le altre (es. TI239045 "CAMBIO GOMME asse Posteriore" *(1774962027367)*, TI84069 asse1/asse3, TI81027, TI84822 asse1, TI285195 asse1/asse3) la natura "gomme" è ricostruibile **solo dal testo** — coerente col reader, ma il dato strutturato manca. → catalogazione di famiglia non uniforme su tutto lo storico gomme.
- **A4 — Manutenzioni legacy senza `stato` (34/84).** Stato dedotto da `dataEsecuzione`/`km`/`ore`/`importo`. Nel catalogo per targa sono marcate `eseguita*`. Non incide sui match (sono comunque eseguite), ma è un buco di dato strutturale.
- **A5 — Cambio gomme registrato solo nel controllo, da verificare.** Controllo TI279216/TI285195 "Sostituzione gomme 3 Asse km294278" (09/03): **esiste** la manutenzione corrispondente "CAMBIO GOMME 3° asse km294278" *(1773066080204)* — quindi **coerente** (riconciliato per km). Analogo per "usura pneumatici 1 asse" (25/03) → "CAMBIO GOMME 1° asse km300369" (05/05). Citato qui solo perché il legame è **per km/testo**, non strutturale.

---

## 8. Sezione GOMME (matching per famiglia)

Manutenzioni con **marcatore strutturato** `gommeInterventoTipo` / `gommePerAsse` (6):

| Targa | Data | Tipo gomme | Asse | Descrizione | Legami |
|---|---|---|---|---|---|
| TI280132 | 20/05 | ordinario | asse1 | "Controllo KO: 2 GOMME Kumho KXA11 385/65 R22.5" | controllo 1667f266 **+** segnalazione c2568521 (bidirezionale ✓) |
| TI298409 | 12/05 | ordinario | posteriore | "CAMBIO GOMME Posteriore Kumho km 383482" | segnalazione 7d1d8009 (✓) |
| TI298409 | 09/03 | straordinario | anteriore | "CAMBIO GOMME straordinario — Anteriore — 2 gomme Kumho" | — (nessun legame) |
| TI324623 | 24/03 | straordinario | — | "CAMBIO GOMME Anteriore Kumho km 262836" | — |
| TI287110 | 19/05 | straordinario | — | "RIPARAZIONE STRAORDINARIA" (Galli Gomme) | — |
| TI233827 | 29/03/2025 | straordinario | — | "servizio completo + controllo geometria per usura anomala pneumatici…" | — |

Casi gomme rilevanti per la riconciliazione: **M3 (TI280132, asse1)** già proposto; **TI84069 asse2** con riserva (§3). Tutti gli altri cambi gomme strutturati risultano **eseguiti e senza segnalazione aperta pendente**.

---

## 9. Sezione CONTROLLI (KO non banali)

- **TI313387 — freni (caso ricorrente, risolto).** Lunga serie di controlli `freni:false` da dic-2025 ad apr-2026, quasi tutti `chiuso`. Culmina nella manutenzione "**SOSTITUZIONE DISCHI E PASTIGLIE ANTERIORI E POSTERIORI**" (20/04, Sciurba) + segnalazione "Freni da controllare" chiusa *(from-lavoro-7c6af494)*. → la ricorrenza freni è **risolta**; i controlli KO aperti residui precedono l'intervento. **Nuovo** problema aperto: "Pedana sx danneggiata / protezione non si alza / spia antiscappamento" (01/06).
- **TI239279 — perdita compressore scarico (02/04)** → lavoro "Controllo KO: PERDITE" eseguito 10/04 *(from-lavoro-82df827a)*. Collegato e coerente.
- **TI280132 — "1 asse rimorchio gomme lisce" (01/04)** → gomme asse1 (20/05) *(from-lavoro-daade4a2)*. Collegato e coerente.
- **TI84822 — "piedi di sgancio bloccati" (20/05, 21/05, 03/06)** + "**Cuscinetto 2° asse lato dx bloccato, pericolo incendio**" (03/06, Scalamato): esiste già un lavoro `daFare` "Piedi di sgancio bloccati… cisterna da controllare…" (03/06, Sciurba) *(man 1780465188822)* → **in lavorazione** (legame testuale, non strutturale). Voce **urgente**, da monitorare.

**Controlli problematici ancora aperti, non collegati (problemi reali da valutare):** TI285217 "Botola cisterna ant rotta / perdita aria" (26/01); TI178456 "Spia avaria freni" (20/01, ma controllo del giorno dopo `chiuso`); TI229717 freni KO (29/01); TI113417 "spia EBS/ABS su 84069 da 3 giorni" (31/01); TI285053 "Blocchi telo rotti" (03/02); TI313387 "Pedana/protezione" (01/06).

---

## 10. Catalogo per targa (sintesi leggibile)

Legenda manutenzioni: `[stato/famiglia]` — `eseguita*` = stato dedotto (legacy senza `stato`). Id tecnici tra parentesi/abbreviati.

### TI113417 — Renault T460 (trattore)
- **Segnalazioni:** 26/02 *aperta* "Perdita aria molto forte spia accesa" (M5); 27/02 *aperta* "Perdita di olio + perdita di aria" (M6).
- **Manutenzioni:** 06/02 compressore (tagliando, ore 10070); 31/03 mezzo "Tagliando + filtri (essiccatore…), olio, diagnosi ECU" (Sciurba).
- **Controlli:** 31/01 "spia EBS/ABS su 84069 da 3gg"; 02/03 KO perdite.

### TI136914 — Renault T460 4x2 (trattore)
- **Manutenzioni:** 14/04 compressore (tagliando, ore 9663).
- **Controlli aperti:** "Piedi di sgancio bloccati" (20/05, 21/05) e "Cuscinetto 2° asse pericolo incendio" (03/06) → riferiti al rimorchio TI84822.

### TI178456 — Renault Lanterna 430 (motrice 3 assi)
- **Segnalazioni:** 06/01 "Rumore (prova)" *(test)*; 11/05 *in carico* "Alternatore" → **F3 (chiudere)**.
- **Manutenzioni:** 26/01 manometro impianto; 26/01 compressore; 04/03 cambio gomme 1°asse interno sx; 12/05 "sostituzione Alternatore" (Mirmax) ←orig seg; 21/05 olio rabbocco.
- **Controlli:** 20/01 "Spia avaria freni" → controllo successivo (21/01) `chiuso`.

### TI229717 — Renault T480 (trattore)
- **Segnalazioni:** 26/05 *aperta* "Spia motore accesa" → **davvero aperta**.
- **Manutenzioni:** 06/02 compressore; 02/03 "sostituzione freni posteriori".
- **Controlli:** 29/01 KO freni.

### TI233827 — Renault C460 8x4 (motrice 4 assi)
- **Segnalazioni:** 13/01 *aperta* "Ammortizzatori ultimo asse" → **M1**; 20/04 + 29/04 *chiuse* motore (→ from-lavoro-183e0356, coerenti); 20/05 + 29/05 *in carico* "Motore in protezione" / "Valvole di non ritorno" → stesso lavoro daFare 1780597640377; 26/05 nota gasolio *(informativa)*.
- **Manutenzioni:** ricco storico Augustoni 2024-2026 (spie motore, sensore Nox, cinghie, **ammortizzatori 4° asse 12/02**, pompa basamento 18/05) + compressore 13/01 + daFare 20/05.

### TI239045 — Renault T460 (trattore)
- **Segnalazioni:** 02/06 *chiusa* "Sedile rotto" → smontaggio+saldatura (coerente).
- **Manutenzioni:** 31/03 cambio gomme posteriore; 12/05 "bruciato anabbagliante"; 02/06 "smontaggio sedile e saldatura" ←orig seg.

### TI239279 — Renault T460 (trattore)
- **Segnalazioni:** 10/02 *aperta* "Sensore Ad Blue non funziona + spia scappamento" → **davvero aperta** (nessuna eseguita pertinente); 30/03 *in carico* "Tubo 10 metri rotto" → **F1 (chiudere)**.
- **Manutenzioni:** 06/02 compressore; 27/02 cambio gomme posteriore; 01/04 "Tubo 10 metri…" ←orig seg; 10/04 "Controllo KO: PERDITE" ←orig controllo.
- **Controlli:** 02/04 "grossa perdita compressore di scarico" → collegato (coerente).

### TI279216 — Renault T460 (trattore)
- **Segnalazioni:** 21/05 *in carico* "Asse anteriore rumore, far controllare in officina" → daFare; 01/06 *aperta* "Lampadina ingombro dx superiore" → **davvero aperta**.
- **Manutenzioni:** daFare "far controllare da Augustoni"; 12/03 compressore.
- **Controlli:** 09/03 "Sostituzione gomme 3°asse km294278" (→ riconciliato su TI285195); 25/03 usura gomme 1°asse; 01/06 "guarnizione coperchio bottola".

### TI280132 — Alkom SM39 (semirimorchio sterzante)
- **Segnalazioni:** 01/04 *chiusa* gomme asse1 (coerente); 13/05 *aperta* "Gomme primo asse molto usurate" → **M3**.
- **Manutenzioni:** 20/05 attrezzature (perni scarico cemento); 20/05 **GOMME asse1** (Valtellina) ←orig controllo+segnalazione.
- **Controlli:** 26/12 KO perdite/luci; 01/04 "1 asse gomme lisce" → collegato.

### TI285053 — Wielton NS3K (centina)
- **Segnalazioni:** 03/02 *aperta* "Asse sterzante bloccato storto" → **davvero aperta** (attesa officina).
- **Controlli:** 03/02 "Blocchi telo rotti" (aperto).

### TI285195 — O.ME.P.S. CM35 (semirimorchio sterzante)
- **Segnalazioni:** 28/05 *chiusa* "guarnizione coperchio cisterna" → coerente.
- **Manutenzioni:** 09/03 cambio gomme 3°asse (km294278); 05/05 cambio gomme 1°asse (km300369); 13/05 e 20/05 tubi; 01/06 "rifacimento 2ª botola" ←orig seg.
- **Controlli gomme:** riconciliati per km (vedi A5).

### TI285217 — O.ME.P.S. Silo (semirimorchio sterzante)
- **Segnalazioni:** 26/01 *aperta* "Manometro pressione cisterna" → **M2 (duplicato risolto)**; 19/02 *aperta* "Tubo scarico crepato" → **M4**; 03/04 *chiusa* "Manometro cisterna… tubo compressore sfiata" (coerente).
- **Manutenzioni:** 30/03 "sistemazione tubo 10mt + guarnizioni storz"; 10/04 "Manometro cisterna…" ←orig seg.
- **Controlli:** 26/01 "Botola cisterna ant rotta / perdita aria" (aperto); 02/04 perdita compressore (collegato).

### TI285997 — Lecitrailer (pianale)
- **Segnalazioni:** 08/04 *chiusa* "Fanalino anteriore SX" → "cambio luce bianca ingombro" (coerente).

### TI287110 — O.ME.P.S. (semirimorchio sterzante)
- **Segnalazioni:** 24/02 *aperta* "Luci ingombro laterali sx tutte spente" → **davvero aperta**; 25/02 *chiusa* (gemella) → **ANOMALIA A1** (chiusa a mano, nessun lavoro tracciato).
- **Manutenzioni:** 10/03 botole/guarnizioni; 19/05 GOMME riparazione straordinaria (Galli) — **nessuna** riguarda le luci.

### TI298409 — Renault T460 (trattore)
- **Segnalazioni:** 22/01 *aperta* "Lampadina anabbagliante dx" (aperta); 30/01 *aperta* "Riscaldamento/webasto" (aperta); 17/02 *aperta* "Cambiate 3 lampadine" *(già fatto)*; 24/04 *chiusa* "Perdita liquido raffreddamento manicotto" (coerente); 08/05 *chiusa* gomme posteriori (coerente); 18/05 *chiusa* "Perdita liquido raffreddamento" (coerente).
- **Manutenzioni:** compressore 12/01; gomme anteriore 09/03; convergenza 31/03; olio rabbocco 14/04; gomme posteriore 12/05 ←orig seg; manicotto 18/05 ←orig seg; pompa acqua 18/05 ←orig seg.

### TI313387 — Renault D16.280 (motrice 2 assi)
- **Segnalazioni:** 15/01 *aperta* "Manca attrezzatura" *(logistica)*; 30/03 *chiusa* "Freni da controllare" (coerente); 21/04 *in carico* "Perdita olio freni posteriore" → **F2 (chiudere)**.
- **Manutenzioni:** 13/01 compressore (revisione); 20/04 "**dischi e pastiglie ant+post**"; 22/04 ×2 ←orig segnalazioni (freni/idraulico).
- **Controlli:** lunga serie freni KO (quasi tutti `chiuso`) → risolta col cambio dischi/pastiglie 20/04; 01/06 "Pedana/protezione" (nuovo, aperto).

### TI315407 — Renault C430 (motrice 3 assi)
- **Segnalazioni:** 14/01 *aperta* "Anabbagliante dx" → **davvero aperta**; 30/04 + 11/05 + 20/05 *in carico* ventola/rallentatore → 3 lavori `daFare`; 20/05 *aperta* "Ventola" → **davvero aperta** (cluster ventola frammentato).
- **Manutenzioni:** 3 daFare (retard/ventola).

### TI324623 — DAF FT XF (trattore)
- **Segnalazioni:** 20/04 *chiusa* "Climatizzatore" (coerente); 21/05 *in carico* "Tagliando + aria condizionata KO" → daFare.
- **Manutenzioni:** daFare tagliando+clima; 24/03 gomme anteriore; 22/04 "Climatizzatore" ←orig seg.

### TI324633 — DAF FT XF (trattore)
- **Segnalazioni:** 22/04 *in carico* "Tachigrafo sballato" → daFare.
- **Manutenzioni:** 07/01 compressore; 30/03 ingrassaggio perni; 23/04 daFare tachigrafo ←orig seg.

### TI84069 — Mistral S372P1 (semirimorchio fisso)
- **Segnalazioni:** 05/02 *aperta* "Gomma tagliata/forata asse2" → **gomme con riserva** (asse2 non coperto, §3).
- **Manutenzioni:** 21/01 gomme asse1; 24/03 gomme asse3.
- **Controlli:** 31/01 "spia EBS/ABS da 3gg".

### TI84822 — O.ME.P.S CM35 (semirimorchio sterzante)
- **Segnalazioni:** 29/01 *aperta* "Posteriore dx tutto spento" → **davvero aperta**; 12/05 *chiusa* "Guarnizioni tubi/cisterna consumate" (coerente).
- **Manutenzioni:** 15/01 gomme asse1; 06/03 botole/manometro; 12/05 guarnizioni storz (attrezzature) + lavoro ←orig seg; 03/06 **daFare** "Piedi di sgancio bloccati + cisterna" (Sciurba).
- **Controlli:** "piedi sgancio" ×3 + "cuscinetto pericolo incendio" (03/06).

### Altre targhe senza segnalazioni/controlli aperti rilevanti
- **TI180147** (Iveco X-Way): 03/06 "ricalibrazione anabbagliante sx" (eseguita).
- **TI282780** (O.ME.P.S. CM35): 5 manutenzioni eseguite (botole/valvole/tubo), nessuna segnalazione.
- **TI81027** (O.ME.P.S. Silo): gomme 1°asse 24/03 + guarnizioni 17/04.
- **TI85688** (omeps cm39): 6 manutenzioni (rotazione gomme 1°asse, guarnizioni, valvole, saldatura/rinforzo, tubo scarico).
- **TI334558**: solo 1 controllo spazzatura (anomalia A2).

---

## 11. Regole rispettate
- **Zero scritture** su `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` (solo `.get()`); **zero modifiche al codice**.
- Le proposte **FORTI** e **MEDIE** sono in tabella, approvabili riga per riga; le **DEBOLI** non sono mai diventate azioni.
- Nessuna deduzione per somiglianza di id; "NON TROVATO" dichiarato dove non c'è (es. Ad Blue TI239279, luci TI287110, gomma asse2 TI84069).
- Famiglia gomme classificata dal **marcatore strutturato**, non dal testo; l'eterogeneità del marcatore è registrata come anomalia A3.
