# REPORT AUDIT INCROCIATO LEGACY ↔ NEXT — chiusure perse nella migrazione

**Data:** 2026-06-06 · **Modo:** SOLA LETTURA ASSOLUTA — zero scritture su Firestore, zero modifiche al codice.
**Fonte dati (sola lettura):** `storage/@lavori`, `storage/@manutenzioni`, `storage/@segnalazioni_autisti_tmp`, `storage/@controlli_mezzo_autisti` (+ `@mezzi_aziendali`).
**Snapshot live letto il:** 2026-06-06 17:25 UTC — `@lavori` 18 · `@manutenzioni` 84 · `@segnalazioni_autisti_tmp` 46.
**Sospetto da verificare (Giuseppe):** alcune segnalazioni oggi "aperte/ambigue" in NEXT erano state CHIUSE/COMPLETATE nel vecchio sistema madre ("lavori in attesa / lavori eseguiti") e la migrazione verso `@manutenzioni` non ha riportato la chiusura.

> Unica scrittura nel repo: questo report. Nessuna proposta di fix codice: solo fotografia.

---

## 1. La fonte legacy e il codice di migrazione (PASSO 1)

### 1.1 Dove vive il dato legacy
- **Chiave reale:** `storage/@lavori` (documento unico, array sotto `value`). Letta da:
  - [src/pages/LavoriInAttesa.tsx:86](src/pages/LavoriInAttesa.tsx#L86) `getItemSync("@lavori")` filtrato `isLavoroInAttesaGlobal` (eseguito ≠ true);
  - [src/pages/LavoriEseguiti.tsx:153](src/pages/LavoriEseguiti.tsx#L153);
  - [src/pages/DettaglioLavoro.tsx:24](src/pages/DettaglioLavoro.tsx#L24), [src/pages/Mezzo360.tsx:17](src/pages/Mezzo360.tsx#L17) (`KEY_LAVORI = "@lavori"`), scrittura madre da [src/autistiInbox/AutistiAdmin.tsx:731-734](src/autistiInbox/AutistiAdmin.tsx#L731-L734) e [src/components/AutistiEventoModal.tsx:546-547](src/components/AutistiEventoModal.tsx#L546-L547).
- **Tipo legacy** [src/types/lavori.ts:12-25](src/types/lavori.ts#L12-L25): `Lavoro { id, gruppoId, tipo("magazzino"|"targa"), descrizione, dataInserimento, eseguito:boolean, targa?, urgenza?, segnalatoDa?, chiHaEseguito?, dataEsecuzione?, sottoElementi[] }`. Stato reale = booleano `eseguito` ([src/utils/lavoriSelectors.ts:3-9](src/utils/lavoriSelectors.ts#L3-L9)). Sul dato reale c'è anche `source{type,id,key}` (riferimento alla segnalazione/controllo di origine) e `dettagli`.

### 1.2 Il codice di migrazione `from-lavoro-*`
- La convenzione id è **`from-lavoro-<idLavoroLegacy>`**: l'id del lavoro madre è incapsulato nell'id manutenzione (ancora oggi usata nei redirect: [src/next/nextCloneNavigation.ts:139-141](src/next/nextCloneNavigation.ts#L139-L141), [src/next/redirects/NextDettaglioLavoroLegacyRedirect.tsx:16](src/next/redirects/NextDettaglioLavoroLegacyRedirect.tsx#L16)). Questo permette il join legacy↔NEXT.
- Lo **script una-tantum** che ha materializzato i record era `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs`, dichiarato eliminato in [docs/_live/REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md:78](docs/_live/REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md#L78).
  - **NON è recuperabile da git:** `git log --all --name-status` non mostra alcun add/delete del file → **non è mai stato committato** (creato, eseguito e cancellato solo nel working tree). Dichiarato qui per onestà: le righe esatte dello script non esistono in cronologia.
  - La **logica** che ha seguito è però congelata nella SPEC e sopravvive nel writer runtime equivalente (sotto).

### 1.3 Cosa portava di qua la migrazione — e cosa NO (verdetto sul codice)

| Campo legacy | Destinazione `@manutenzioni` | Riga di riferimento |
|---|---|---|
| `eseguito === true` | **`stato: "eseguita"`**; `≠ true → "daFare"` | [SPEC ch.4 tab. `stato`](docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md) (riga 72) e [ch.5 riga 98](docs/product/SPEC_DISMISSIONE_LAVORI_NEXT.md) |
| `dataEsecuzione` | `data` | SPEC ch.5 riga 94 |
| `chiHaEseguito` | `eseguitoDa` | SPEC ch.5 riga 93 |
| `source.type/id/key` | `origineTipo / origineRefId / origineRefKey` | SPEC ch.5 righe 103-105 |
| `gruppoId` | **scartato** (decisione J.9) | SPEC ch.5 riga 99 |
| backlink `linkedLavoroId` su segnalazione/controllo | **solo il VALORE riscritto** verso l'id manutenzione | SPEC ch.6 righe 129-136 |

**→ Portava lo stato di chiusura del lavoro? SÌ**, ma solo dentro la manutenzione (`eseguito → stato:"eseguita"`).
**→ Scriveva la chiusura sulla segnalazione collegata? NO.** La SPEC ch.6 riscrive *solo il valore* di `linkedLavoroId`; non tocca `chiusa`/`chiusuraDi`/`stato` della segnalazione. Lo conferma il writer runtime equivalente — `patchSegnalazione` in [src/next/writers/nextManutenzioneDaFareCreateWriter.ts:154-166](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L154-L166): scrive `linkedLavoroId` + `letta:true` e, al massimo, `stato:"presa_in_carico"` — **mai** la chiusura. La propagazione mancante è la stessa già diagnosticata in [docs/_live/AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md](docs/_live/AUDIT_CICLO_SEGNALAZIONE_2026-05-14.md) (divergenza D1).

---

## 2. RIEPILOGO numerico dell'incrocio (PASSO 2-3)

| Voce | Valore |
|---|---:|
| Lavori legacy `@lavori` totali | **18** |
| — eseguiti (`eseguito:true`) | **8** |
| — in attesa (`eseguito:false`) | **10** |
| Manutenzioni `from-lavoro-*` presenti oggi in `@manutenzioni` | **14** (11 `eseguita`, 3 `daFare`) |
| Lavori legacy migrati con **stato di esecuzione coerente** (eseguito→eseguita) | **8 / 8** (nessuno stato perso a livello manutenzione) |
| Lavori legacy senza gemello `from-lavoro-*` oggi (soppiantati da manutenzione reale) | **4** |
| Divergenze NEXT `eseguita` ↔ legacy ancora `in attesa` (madre non aggiornata) | **4** |
| **Segnalazioni "aperte/ambigue" smentite dal legacy** (lavoro legacy ESEGUITO) | **3** |
| MEDIE (report riconciliazione) promosse a **certe** dal legacy | **1** (+1 parziale) |
| Delle 11 "davvero aperte" smentite dal legacy | **0** |
| Manutenzioni A4 senza stato di cui il legacy conosce lo stato vero | **0 / 34** (nessuna proviene da `@lavori`) |
| A4 comunque eseguite per inferenza (km/ore/importo) | **34 / 34** |

---

## 3. Segnalazioni "aperte/ambigue" smentite dal legacy (elenco secco)

Sono i casi in cui il vecchio sistema dice che **il lavoro è stato ESEGUITO**, ma la segnalazione NEXT non risulta chiusa.

| Targa | Problema (segnalazione, stato NEXT) | Lavoro legacy ESEGUITO | Quando · da chi |
|---|---|---|---|
| **TI239279** | "Tubo 10 metri rotto, altri tubi perdono…" — *presa in carico* (261619fc) | `5dd4afde` "Segnalazione: altro - Tubo 10 metri rotto…" `eseguito:true` | 01/04/2026 · milio |
| **TI313387** | "Perdita olio freni posteriore lato guida" — *presa in carico* (c7bc5a05) | `f609de79` "Segnalazione: idraulico - Perdita olio freni posteriore…" `eseguito:true` | 22/04/2026 · sciurba |
| **TI285217** | "Manometro pressione cisterna non funzionante" — *nuova/aperta* (c1fac5b8) | `4cc1d480` "Manometro cisterna non funzionante…" `eseguito:true` (origine sul **duplicato** d4964b81, oggi chiuso) | 10/04/2026 · Milio |

- I primi due (TI239279, TI313387) coincidono con **F1** e **F2** del [report riconciliazione](docs/REPORT_RICONCILIAZIONE_MASSA_2026-06-06.md): il legacy **conferma** che il lavoro era già eseguito nel vecchio sistema; resta da accendere solo l'interruttore di chiusura della segnalazione.
- Il terzo (TI285217 manometro) è una segnalazione ancora **"nuova"**, duplicato di d4964b81: il manometro era già stato sistemato (lavoro legacy eseguito 10/04). È l'unico caso "nuova" davvero smentito dal legacy.

---

## 4. MEDIE confermate dal legacy (PASSO 3)

Delle 6 MEDIE del report riconciliazione, l'incrocio col vecchio sistema dà:

| MEDIO | Targa | Verdetto legacy |
|---|---|---|
| Manometro pressione cisterna (c1fac5b8) | TI285217 | **CONFERMATO ESEGUITO** dal legacy (`4cc1d480`, 10/04, Milio) → promosso a certo |
| Tubo scarico crepato (6a64e3bd) | TI285217 | **Parziale**: stesso lavoro legacy `4cc1d480` cita "Tubo compressore cisterna… sfiata" — area cisterna/tubi toccata, ma non è testualmente "tubo scarico". Resta da confermare |
| Ammortizzatori ultimo asse (e8750e0e) | TI233827 | Legacy: 0 eseguiti (i 2 lavori legacy TI233827 sono motore, `false`). L'esecuzione esiste in NEXT (man. Augustoni 1777474997286), **non** nel legacy |
| Gomme primo asse usurate (1dab2f26) | TI280132 | Legacy `daade4a2` "Controllo KO GOMME" è ancora **`eseguito:false`**; l'esecuzione è avvenuta in NEXT (Valtellina 20/05), non nel legacy |
| Perdita aria (116f7c43) · Perdita olio+aria (8bcb855c) | TI113417 | **Nessun** lavoro legacy su TI113417 → NON TROVATO |

**Esito MEDIE:** il legacy promuove a certo **1** caso (manometro), ne tocca parzialmente **1** (tubo scarico). Gli altri 4 restano come nel report riconciliazione (esecuzione NEXT o non trovata).

---

## 5. Le 11 "davvero aperte": il legacy non ne smentisce nessuna

Per ciascuna ho cercato un lavoro legacy ESEGUITO della stessa targa compatibile per area:

| Targa | Problema (aperta) | Lavori legacy stessa targa | Esito |
|---|---|---|---|
| TI298409 | Lampadina anabbaglianti dx | 2 lavori, **0 eseguiti** | NON TROVATO |
| TI84822 | Posteriore dx tutto spento (elettrico) | 1 eseguito ma è "Guarnizioni tubi/cisterna" (area diversa) | NON TROVATO (area incompatibile) |
| TI298409 | Riscaldamento / webasto | 2 lavori, 0 eseguiti | NON TROVATO |
| TI285053 | Asse sterzante bloccato | nessun lavoro legacy | NON TROVATO |
| TI239279 | Sensore Ad Blue | 2 eseguiti ma sono "Tubo 10mt" e "Perdite" (area diversa) | NON TROVATO (area incompatibile) |
| TI287110 | Luci ingombro sx | nessun lavoro legacy | NON TROVATO |
| TI84069 | Gomma tagliata asse2 | nessun lavoro legacy | NON TROVATO |
| TI315407 | Anabbagliante dx | 2 lavori (ventola), 0 eseguiti | NON TROVATO |
| TI315407 | Ventola | 2 lavori ventola, **0 eseguiti** (in attesa anche nel legacy) | NON TROVATO |
| TI229717 | Spia motore accesa | nessun lavoro legacy | NON TROVATO |
| TI279216 | Lampadina ingombro dx | nessun lavoro legacy | NON TROVATO |

**Verdetto:** **nessuna** delle 11 "davvero aperte" è smentita dal legacy. Dove la targa ha lavori legacy eseguiti (TI84822, TI239279), riguardano un'area diversa. Le 11 restano aperte davvero in entrambi i sistemi. In particolare il **cluster ventola TI315407** risulta `in attesa` anche nel vecchio sistema — coerente, non chiuso da nessuna parte.

---

## 6. Le 34 manutenzioni A4 (senza stato): il legacy non c'entra

- **0 / 34** sono `from-lavoro-*` → **nessuna delle 34 proviene da `@lavori`**. La migrazione lavori non le ha generate, quindi il "lavoro legacy di origine" **non esiste** e non può dire se erano eseguite.
- Sono manutenzioni **importate/manuali**: storico officina AUGUSTONI TRUCK (11 record TI233827, spie motore/tagliandi/ammortizzatori/collaudo), riparazioni MILIO, cambi gomme (VALTELLINA / N/D), tagliandi compressore, dischi/pastiglie SCIURBA, ecc.
- **34 / 34** hanno segnali di esecuzione reali (`km`/`ore`/`importo`/fornitore) → eseguite con certezza per inferenza, indipendentemente da `@lavori`.

**Conclusione A4:** l'anomalia "manutenzione senza `stato`" **non** è un danno della migrazione lavori; è un buco di shape dei record importati/manuali (la madre/officina li scrive senza `stato` esplicito). Il legacy `@lavori` non aggiunge informazione perché non ne è la sorgente.

---

## 7. Dettaglio per targa (solo le targhe con lavori legacy)

### TI239279 — Renault T 460
- Legacy: `5dd4afde` "Tubo 10 metri rotto…" **eseguito 01/04** (milio) → MAN `from-lavoro-5dd4afde` `eseguita`; segnalazione origine 261619fc **presa in carico (non chiusa)** → chiusura persa.
- Legacy: `82df827a` "Controllo KO: PERDITE" **eseguito 10/04** (Milio) → MAN `from-lavoro-82df827a` `eseguita`; origine = controllo 44ebe449. Coerente.
- Aperta non smentita: "Sensore Ad Blue" (area diversa).

### TI313387 — Renault D16.280
- Legacy: `7c6af494` "Freni da controllare" **eseguito 22/04** (sciurba) → MAN `eseguita`; segnalazione 5cdfe350 **chiusa**. Coerente.
- Legacy: `f609de79` "Perdita olio freni posteriore" **eseguito 22/04** (sciurba) → MAN `eseguita`; segnalazione c7bc5a05 **presa in carico (non chiusa)** → chiusura persa (F2).

### TI285217 — O.ME.P.S. Silo
- Legacy: `4cc1d480` "Manometro cisterna non funzionante / tubo compressore sfiata" **eseguito 10/04** (Milio) → MAN `eseguita`; segnalazione origine d4964b81 **chiusa**. Ma il **duplicato** c1fac5b8 ("Manometro pressione cisterna", 26/01) è rimasto **nuovo** → smentito dal legacy.

### TI285997 — Lecitrailer
- Legacy: `27ceb61e` "Fanalino anteriore SX" **eseguito 14/04** (MILIO). Oggi **non** esiste più `from-lavoro-27ceb61e`: la segnalazione b74d5e20 è stata ri-collegata alla manutenzione reale `1776922394876` ("cambio luce bianca ingombro") ed è **chiusa**. Soppiantata, esito coerente.

### TI324623 — DAF FT XF
- Legacy: `f2ab2ab1` "Climatizzatore non funziona" **eseguito 22/04** (DAF ITALIA) → MAN `eseguita`; segnalazione 5411913c **chiusa**. Coerente.

### TI84822 — O.ME.P.S CM35
- Legacy: `7236bb5c` "Guarnizioni tubi e cisterna consumate" **eseguito 12/05** (Milio) → MAN `eseguita`; segnalazione 810d56e5 **chiusa**. Coerente. (L'aperta elettrica "posteriore dx spento" è altra area, non coperta.)

### TI280132 — Alkom SM39
- Legacy: `daade4a2` "Controllo KO: GOMME" **`eseguito:false`** (in attesa nel legacy). In NEXT però `from-lavoro-daade4a2` è `eseguita` (Valtellina 20/05). **Divergenza**: NEXT eseguito, madre no.

### TI233827 — Renault C460 8x4
- Legacy: `9c2ed0ca` (motore, false) e `183e0356` (motore, false). `183e0356` in NEXT è `eseguita` (pompa basamento Augustoni 18/05) → **divergenza** NEXT eseguito / legacy in attesa; segnalazioni f7fdb252+c8e188a9 **chiuse**. L'aperta "Ammortizzatori ultimo asse" non ha lavoro legacy eseguito.

### TI324633 — DAF FT XF
- Legacy: `c3b066d4` "Tachigrafo sballato" `false` → MAN `from-lavoro-c3b066d4` `daFare`; segnalazione 436b5393 **in carico**. Coerente (in lavorazione).

### TI298409 — Renault T460
- Legacy: `4ed587dc` "Perdita liquido manicotto" `false` → MAN `eseguita` (divergenza), seg b2d22ee1 **chiusa**. `a5ba1512` "4 gomme di trazione" `false`, soppiantato da gomme reale `1778587360877`, seg 7d1d8009 **chiusa**. Le aperte (lampadine, webasto) non hanno lavoro legacy eseguito.

### TI315407 — Renault C430
- Legacy: `ff4d97f1` + `cd85c334` (ventola) entrambi **`false`** → MAN `daFare`; segnalazioni **in carico**. Il problema ventola è aperto anche nel legacy. Coerente con "davvero aperte".

### TI178456 — Renault Lanterna 430
- Legacy: `4a204a02` "Alternatore" **`false`** (in attesa). In NEXT l'alternatore è stato sostituito (man. reale `1778592051280`, MIRMAX 12/05), segnalazione 0915617c **in carico**. → l'esecuzione è NEXT, non legacy; segnalazione comunque non chiusa.

### TI85688 — omeps cm39
- Legacy: `b2234103` "cono posteriore crepata" **`false`** (senza source). In NEXT `from-lavoro-b2234103` è `eseguita` (saldatura/rinforzo CARVI 21/05). **Divergenza** NEXT eseguito / legacy in attesa.

---

## 8. VERDETTO MIGRAZIONE (fotografia, niente fix)

1. **Lo stato di chiusura del lavoro FU portato — ma solo nella manutenzione.** `@lavori.eseguito===true → @manutenzioni.stato:"eseguita"` (SPEC ch.4 riga 72, ch.5 riga 98). Verifica sui dati: **0** casi di lavoro eseguito finito in manutenzione non-eseguita. A questo livello **nessuna chiusura persa**.

2. **La chiusura NON fu propagata alla segnalazione di origine.** La migrazione (SPEC ch.6, passi 3-5) riscrive **solo il valore** di `linkedLavoroId`; il writer runtime equivalente `patchSegnalazione` ([nextManutenzioneDaFareCreateWriter.ts:154-166](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L154-L166)) imposta al massimo `stato:"presa_in_carico"` + `letta:true`, **mai** `chiusa`/`chiusuraDi`. → una segnalazione con lavoro legacy eseguito resta "presa in carico" (ambigua). **Oggi visibile su 3 segnalazioni:** F1 (TI239279), F2 (TI313387), + il duplicato manometro TI285217.

3. **`gruppoId` scartato per scelta (J.9, SPEC ch.5 riga 99):** i raggruppamenti di lavori sono andati persi; ogni manutenzione è 1:1.

4. **Nessun canale di ritorno verso la madre `@lavori`:** le esecuzioni fatte in NEXT dopo la dismissione non aggiornano `@lavori` (la madre resta `eseguito:false`). 4 divergenze odierne (TI280132 gomme, TI298409 manicotto, TI233827 motore, TI85688 cono): NEXT `eseguita`, legacy `in attesa`. È il rovescio del sospetto, ma è la **stessa** rottura del legame bidirezionale.

5. **Le 34 A4 non c'entrano con la migrazione:** 0 provengono da `@lavori`; sono import/manuali, tutte eseguite per km/ore. Il legacy non ne sa nulla.

### Risposta diretta al sospetto di Giuseppe
- **Parzialmente vero, in forma ristretta:** non è la chiusura del *lavoro* a essersi persa (quella è arrivata sulla manutenzione), ma la chiusura della *segnalazione* collegata, che la migrazione non ha mai scritto. Risultato pratico identico per chi guarda l'inbox segnalazioni: **3 segnalazioni** appaiono aperte/ambigue pur avendo lavoro già eseguito nel vecchio sistema (TI239279 tubo, TI313387 perdita olio freni, TI285217 manometro).
- **Falso per le 11 "davvero aperte":** il legacy non le smentisce — restano aperte in entrambi i sistemi.
- **Non pertinente per le 34 A4:** non sono lavori migrati; il loro stato "vero" (eseguite) viene da km/ore, non dal vecchio sistema.

---

## 9. Regole rispettate
- **Zero scritture** su `@lavori`, `@manutenzioni`, `@segnalazioni`, `@controlli` (solo `.get()`); **zero modifiche al codice**.
- Join legacy↔NEXT fatto solo sull'id strutturale `from-lavoro-<idLavoro>` e su `source`/`origineRef*` reali, **mai** per somiglianza di id.
- "NON TROVATO" dichiarato dove non esiste (11 aperte non smentite, 0 A4 dal legacy).
- Le chiavi legacy **esistono** ancora su Firestore (`@lavori`, 18 record): l'audit è stato completato; lo script di migrazione originale non è in git (mai committato) ed è stato dichiarato come tale.
