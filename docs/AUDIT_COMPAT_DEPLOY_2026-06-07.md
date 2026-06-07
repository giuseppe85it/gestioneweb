# Audit compatibilità pre-deploy — 2026-06-07

> Sessione **sola lettura assoluta**. Firestore letto in sola lettura (service account
> `gestionemanutenzione-934ef`, progetto confermato = quello dell'app, `src/firebase.ts`).
> Nessuna scrittura su dati o codice. Unica scrittura: questo file.
> Verifiche fatte su **dato fisico reale** (1243 record campionati su 8 dataset), non su assunzioni.

## Riferimenti di versione

- **Ultima produzione plausibile (last-good build):** `e9c7fabd` (2026-04-28 17.46), genitore di
  `d489d751` (2026-04-28 22.31, il commit che introduce l'import rotto `../tools` → da lì i deploy
  falliscono). La produzione autisti gira quindi su codice ≈ 28/04 (≈6 settimane fa). Data esatta del
  deploy confermabile solo da dashboard Vercel.
- **HEAD (codice da deployare):** `379edc15`.
- **Layout fisico dati:** collection Firestore `storage`, un documento per chiave
  (`storage/@segnalazioni_autisti_tmp` …) con campo `value` = **array** di record. L'app autista
  fa read-array → append/patch → `setDoc({value})` (sovrascrittura intera, tranne `@mezzi_aziendali`
  che ha merge). Confermato in `src/utils/storageSync.ts`.

## Scoperta che orienta tutto l'audit

**Il percorso di SCRITTURA dell'app autista è INVARIATO da `e9c7fabd` a HEAD.**
`git diff e9c7fabd..HEAD` su `src/autisti/`, `src/components/AutistiEventoModal.tsx`,
`src/utils/homeEvents.ts`, `src/cisterna/collections.ts` → **nessuna modifica** (cambia solo
`cloneWriteBarrier.ts`, che *blocca/abilita* scritture lato clone NEXT, non l'app autista).
Riprova empirica: i record creati nelle ultime 6 settimane hanno **esattamente** la shape prodotta
dai writer legacy `src/autisti/*` (es. controlli con `check{}`+`target`+`timestamp`; segnalazioni
con `data`:number+`stato`:"nuova") → la produzione autisti **è** quel codice legacy, che nel nuovo
build resta identico.

Conseguenza: l'app autista NUOVA scriverà la **stessa** shape della VECCHIA. Il problema si riduce a
una sola domanda: **i reader/writer NEXT nuovi leggono e preservano correttamente questa shape
(e gli stati legacy accumulati)?** Risposta verificata sotto: **sì**.

---

## PASSO 1 — Delta writer app autisti (VECCHIA vs NUOVA)

| Writer | Chi/Dove | Vecchia → Nuova | Cambio di shape sui dati autista |
|---|---|---|---|
| `autisti/Segnalazioni.tsx` (crea segnalazione) | autista `/autisti` | **INVARIATO** | nessuno |
| `autisti/ControlloMezzo.tsx` (controllo mezzo) | autista | **INVARIATO** | nessuno |
| `autisti/GommeAutistaModal.tsx` (evento gomme) | autista | **INVARIATO** | nessuno |
| `autisti/Rifornimento.tsx` (rifornimento) | autista | **INVARIATO** | nessuno |
| `autisti/RichiestaAttrezzature.tsx` | autista | **INVARIATO** | nessuno |
| `components/AutistiEventoModal.tsx` (inbox legacy: `stato="presa_in_carico"`) | manager legacy | **INVARIATO** | nessuno |
| `next/nextSegnalazioniWriter.ts` | manager `/next/centro-controllo` | **NUOVO** | **additivo**: `chiusa`,`dataChiusura`,`chiusa_by` via `{...current,…}` |
| `next/nextRifornimentiWriter.ts` | manager CC | **NUOVO** | **additivo**: edita campi esistenti + `lastModifiedAt/Source`, `{...current,…}` |
| `next/nextControlliWriter.ts`, `next/nextRichiesteAttrezzatureWriter.ts` | manager CC | **NUOVO** | **additivo** (spread) |
| `next/writers/gruppoSegnalazioniWriter.ts` | manager `/next/manutenzioni` | **NUOVO** | **additivo**: solo `gruppoSegnalazioneId`, `{...record,…}` |
| `next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts` | manager CC/manut. | **NUOVO/mod** | **additivo**: `linkedLavoroId(s)`,`chiusura*`,`stato`, `...record` |
| `next/writers/presaInCaricoSegnalazioneWriter.ts` | — | **RIMOSSO** (`5e245686`, "non cablato") | nessuna nuova scrittura; stato `presa_in_carico` **ancora letto** ovunque |

**Tutti i writer nuovi sono spread-based** (`{ ...current, …patch }`): preservano i campi base
dell'autista, aggiungono/aggiornano solo i propri. **Nessun writer ricostruisce il record da zero →
nessuna perdita di campi.** Tutti girano solo sotto scope esplicito (`runWithCloneWriteScopedAllowance`)
su azione manager in `/next/...`, **mai** sull'app autista né all'avvio.

---

## PASSO 2 — Compatibilità in LETTURA (dati vecchi → codice nuovo)

Reader principale `next/domain/nextAutistiDomain.ts` (e domini CC/gomme): **uniformemente difensivo** —
ogni campo letto con `normalizeOptionalText(record.X ?? record.Y ?? fallback)`, date via `toTimestamp`
(accetta number/string/sec/ms), `Array.isArray(...)` prima di iterare, optional chaining sui `.toUpperCase()`.
Nessun accesso `record.a.b` non protetto.

Riscontro su **dato fisico reale** (campioni live):

| Dataset | Record (in finestra ≥28/04) | Range date | Esito lettura nuovo codice |
|---|---|---|---|
| `@segnalazioni_autisti_tmp` | 46 (19) | 06/01 → 02/06 | **OK** — base 46/46 coerente |
| `@controlli_mezzo_autisti` | 400 (117) | 21/12 → 05/06 | **OK** — usa `timestamp` (400/400), `check{}`→koList |
| `@rifornimenti_autisti_tmp` | 342 (107) | 12/01 → 05/06 | **OK** — base 342/342 coerente |
| `@cambi_gomme_autisti_tmp` / `@gomme_eventi` | 8/11 (3) | 27/02 → 26/05 | **OK** — `autista` object gestito (`autista?.nome ?? …`) |
| `@richieste_attrezzature_autisti_tmp` | 10 (0) | 21/12 → 17/04 | **OK** — nessun nuovo record in finestra |
| `@storico_eventi_operativi` | 416 (170) | 11/02 → 05/06 | **OK** — `prima/dopo` object con guardie |
| `@autisti_sessione_attive` | 10 (9) | 23/04 → 05/06 | **OK** — autisti attivi, shape attesa |
| `autisti_eventi` (collection legacy) | 3+ | — | **OK** — fallback prudente, `createdAt` Timestamp ignorato |

**Stati legacy presenti nel dato reale e tutti gestiti:**
- `stato` segnalazioni = `nuova`(13) / `chiusa`(22) / **`presa_in_carico`(11)**. Il nuovo codice legge
  `presa_in_carico` in `ArchivioRowSegnalazione`, `frasestoriaRecord`, `storiaRecord`, inbox →
  **nessuna regressione** dalla rimozione del writer (era solo scrittura non cablata).
- `chiusuraData`/`dataChiusura` con **tipo misto `[string,number]`**: gestiti da `toTimestamp`
  (string parse via `parseDataRobusta`). `chiusa` derivata da 4 segnali ridondanti
  (`chiusa===true || stato==="chiusa" || typeof chiusuraData==="number" || chiusuraRefId`).
- `linkedLavoroIds` presente ma `null` (31/46): `Array.isArray` lo salta, usa `linkedLavoroId`. OK.
- `gruppoSegnalazioneId` sempre `null` finora: `normalizeOptionalText`→null. OK (campo del flusso nuovo).
- `dataPresaInCarico` sempre `null`: la frase storia non mostra la *data* di presa in carico (lo
  *stato* sì). **Pre-esistente e per scelta** (writer "non cablato"), non una regressione del deploy.

**Nessun campo che il codice nuovo assuma presente e che i record reali non abbiano.** Nessun
percorso di lettura può lanciare su questi dati.

---

## PASSO 3 — Compatibilità in SCRITTURA (app nuova → flussi esistenti)

- **App autista nuova → reader/flussi:** scrive shape identica alla vecchia (writer invariati) → già
  dimostrata leggibile. Nessun campo nuovo introdotto dall'app autista.
- **Manager nuovo → record:** solo campi **additivi** via spread (vedi PASSO 1). I reader vecchi
  (eventuale bundle manager in cache nella finestra di deploy) **ignorano** i campi extra; il
  vocabolario di stato è condiviso (`presa_in_carico`/`chiusa`/`letta`). Nessun rename/rimozione.
- **Migrazioni implicite al primo avvio del codice nuovo:** **NESSUNA.** `main.tsx`/`App.tsx` non
  contengono `setItemSync`/`setDoc`. Gli hit "migrat/backfill" sono (a) solo-display su record già
  migrati ("zero scritture Firestore"), (b) backfill analisi AI nel modulo Archivista, attivati da
  azione utente esplicita e protetti dal clone barrier — **non toccano i dati autisti e non girano
  al boot**. L'intera architettura `cloneWriteBarrier` rende il NEXT **read-only by default**.
- **Finestra di deploy (client misto):** `vercel.json` ha `Cache-Control: no-store` → cutover rapido
  al bundle nuovo, finestra minima. Unico aspetto: la sovrascrittura dell'intero array in `storageSync`
  (read→modify→write) ha semantica **last-write-wins** se due client scrivono sulla stessa chiave nello
  stesso istante. **È pre-esistente** (storageSync invariato), **non introdotta dal deploy**: i writer
  rileggono l'array subito prima di scrivere (finestra ~ms) e le scritture autista sono poco frequenti.
  Impatto pratico trascurabile, ma è l'unico vero punto di attenzione concorrenza.

---

## PASSO 4 — VERDETTO

### ✅ COMPATIBILE — deploy sicuro per i dati

Motivazione chiusa:
1. Percorso di scrittura autista **invariato** → nessuna deriva di shape (confermato anche dal dato reale in finestra).
2. Reader NEXT nuovi **difensivi**, verificati su 1243 record reali: leggono tutte le shape e **tutti** gli stati legacy (`presa_in_carico`, date `string|number`, `linkedLavoroIds:null`).
3. Writer NEXT nuovi **spread-based** → preservano i campi, **nessuna perdita dato**.
4. **Nessuna migrazione implicita** all'avvio del codice nuovo che tocchi i dati autisti.

**Comportamenti attesi innocui (non bloccanti):**
- La *data* di presa in carico non compare nella frase storia (`dataPresaInCarico` mai scritta) — pre-esistente, lo *stato* presa-in-carico resta visibile.
- Campi additivi nuovi (`gruppoSegnalazioneId`, `lastModifiedAt/Source`) compaiono solo su record toccati dal manager nuovo; ignorati da letture vecchie.

**Unica riserva pre-esistente (NON introdotta dal deploy):** last-write-wins sulla sovrascrittura
intera dell'array in `storageSync`. Da tenere a mente per il futuro, non un blocco al deploy.

### Frase di Giuseppe — verifica esplicita
> «i dati arrivano nel posto giusto e la NEXT li legge come oggi»

**CONFERMATA.** I dati arrivano nello stesso posto (`storage/@…tmp`, writer autista invariati) e la
NEXT li legge — anzi **meglio di oggi**: i reader nuovi sono più difensivi e gestiscono esplicitamente
gli stati legacy che l'app vecchia trattava in modo più rigido. Il lavoro prosegue e **non si perdono dati**.

---

### Metodo / comandi (tutti read-only)
```
git diff --stat e9c7fabd..HEAD -- src/autisti/ ...        # writer autista INVARIATI
node C:/tmp/fsaudit.cjs                                    # campione reale 8 dataset (sola lettura)
git grep "...current|...record" src/next/writers/*        # writer spread-based
git grep -L setItemSync src/main.tsx src/App.tsx          # nessuna scrittura al boot
```
Script di lettura Firestore tenuto fuori dal repo (`C:/tmp`), rimosso a fine sessione. Repo invariato.
