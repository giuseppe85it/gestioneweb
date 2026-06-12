# AUDIT SCHEMA IMPORT GOMME IN MANUTENZIONI NEXT - 2026-06-08

## 1. SCOPO

Questo audit verifica il punto reale di aggancio tra eventi/segnalazioni gomme provenienti da App Autisti / Autisti Inbox / Autisti Admin e lo schema gomme gia esistente in `Manutenzioni NEXT`.

Il presupposto corretto emerso dal codice e': `Manutenzioni NEXT` ha gia uno schema gomme strutturato in `@manutenzioni`. L'audit quindi non progetta un modulo nuovo, non propone una nuova route e non inventa campi dati. Verifica:

- schema gomme esistente in `@manutenzioni`;
- flusso import gomme/segnalazioni da Autisti Inbox / Autisti Admin;
- visibilita finale in Manutenzioni, Dossier Mezzo e Dossier Gomme;
- dettaglio gomme dentro Manutenzioni;
- punto minimo di intervento futuro per far scrivere/agganciare l'import allo storico ufficiale.

Verdetto breve:

- Schema gomme Manutenzioni esistente: **SI**.
- Import attuale da Autisti Inbox/Admin scrive in Manutenzioni: **PARZIALE** solo per chiudere record gia esistenti; **NO** per creare una nuova manutenzione gomme ufficiale.
- Serve modulo nuovo: **NO**.
- Serve nuova route: **NO**.

## 2. FONTI LETTE

### Documenti

I path obbligatori storici `docs/STATO_ATTUALE_PROGETTO.md`, `docs/product/STATO_MIGRAZIONE_NEXT.md`, `docs/product/REGISTRO_MODIFICHE_CLONE.md`, `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`, `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md` non esistono nella forma indicata. Sono stati letti gli equivalenti reali:

- `docs/HANDOFF_UI_GOMME_2026-06-08.md`
- `docs/audit/AUDIT_UI_GOMME_NEXT_2026-06-08.md`
- `AGENTS.md`
- `docs/copia questi nel progetto in chat/STATO_ATTUALE_PROGETTO.md`
- `docs/copia questi nel progetto in chat/STATO_MIGRAZIONE_NEXT.md`
- `docs/copia questi nel progetto in chat/REGISTRO_MODIFICHE_CLONE.md`
- `docs/_live/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/copia questi nel progetto in chat/PROTOCOLLO_SICUREZZA_MODIFICHE.md`

### Manutenzioni

- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`

### Dossier

- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`

### App Autisti / Autisti Inbox / Admin

- `src/autisti/GommeAutistaModal.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/autistiInbox/NextAutistiGommeAllNative.tsx`
- `src/next/components/NextImportGommeChiusuraModal.tsx`

### Writer

- `src/next/writers/nextChiusuraEventoWriter.ts`
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`
- `src/next/domain/nextManutenzioniDomain.ts`

### Helper / barrier

- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`

### Legacy solo confronto

- `src/pages/Manutenzioni.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/components/AutistiEventoModal.tsx`

## 3. SCHEMA GOMME ESISTENTE IN `@manutenzioni`

Fonti principali:

- tipi e sanitizer: `src/next/domain/nextManutenzioniDomain.ts:198-372`;
- payload writer: `src/next/domain/nextManutenzioniDomain.ts:228-264`;
- scrittura sanitizzata: `src/next/domain/nextManutenzioniDomain.ts:1037-1123`;
- salvataggio form: `src/next/NextManutenzioniPage.tsx:2470-2595`;
- lettura dettaglio: `src/next/NextMappaStoricoPage.tsx:354-385`, `1137-1195`;
- read model Dossier: `src/next/domain/nextManutenzioniGommeDomain.ts:1029-1405`.

| Campo | Tipo reale | Dove viene scritto | Dove viene letto | Ordinario | Straordinario | Raw o derivato | Note/esempi codice |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `gommeInterventoTipo` | `"ordinario" | "straordinario"` | `NextManutenzioniPage.saveRecord` passa `"ordinario"` o `"straordinario"`; `sanitizeBusinessRecord` lo persiste se risolto (`1118`) | `nextManutenzioniDomain`, `NextManutenzioniPage`, `NextMappaStoricoPage`, `nextManutenzioniGommeDomain` | Si | Si | Raw persistito quando scritto; puo' essere anche risolto/derivato dal reader | `sanitizeGommeInterventoTipo` accetta solo i due valori; `resolveGommeInterventoTipo` deriva da `gommeStraordinario`, `gommePerAsse`, `assiCoinvolti` o testo gomme. |
| `assiCoinvolti` | array string | `NextManutenzioniPage` per subtype ordinario; `sanitizeBusinessRecord` lo persiste solo se tipo ordinario (`1120`) | Form edit, dettaglio, Dossier | Si | No | Raw persistito | Valori validi: `anteriore`, `posteriore`, `asse1`, `asse2`, `asse3`. |
| `gommePerAsse` | array oggetti | UI ordinaria; oppure generato dal writer se tipo ordinario e ci sono assi ma mancano dettagli (`1054-1062`) | Dettaglio, Dossier, PDF | Si | No | Raw persistito, con fallback calcolato in sanitizer | Ogni entry senza asse valido viene scartata. |
| `gommePerAsse[].asseId` | string asse valido | Da chip asse UI ordinaria / payload | Dettaglio e Dossier | Si | No | Raw persistito | Obbligatorio per mantenere l'entry. |
| `gommePerAsse[].dataCambio` | string/null | Da data record/form; fallback `data` nel sanitizer | Dettaglio, Dossier, PDF | Si | No | Raw persistito o fallback in sanitizzazione | Se mancante, `sanitizeGommePerAsse` usa `fallbackDataCambio`. |
| `gommePerAsse[].kmCambio` | number/null | Da km form; fallback `km` nel sanitizer | Dettaglio, Dossier, PDF | Si | No | Raw persistito o fallback in sanitizzazione | Per motrici/trattori il km e' obbligatorio solo in completamento gomme gia tipizzato. |
| `gommeStraordinario` | oggetto `{ asseId, quantita, motivo }` | UI straordinaria; tappo da sorgenti esplicite; `sanitizeBusinessRecord` lo persiste solo se tipo risolto straordinario (`1119`) | Dettaglio, Dossier, form edit | No | Si | Raw persistito | Se presente, `resolveGommeInterventoTipo` risolve straordinario. |
| `gommeStraordinario.asseId` | asse valido/null | Select asse facoltativo o derivazione sorgente | Dossier/dettaglio | No | Si | Raw persistito | Facoltativo. |
| `gommeStraordinario.quantita` | number/null | Input numero gomme coinvolte o bonifica | Dossier/dettaglio parziale | No | Si | Raw persistito | Facoltativo. |
| `gommeStraordinario.motivo` | string/null | Select motivo straordinario o `problemaGomma`/testo | Dossier/dettaglio | No | Si | Raw persistito | Obbligatorio nella UI per nuovo straordinario non-completion. |
| `targa` | string | Tutti i writer manutenzione | Tutti i reader | Si | Si | Raw persistito | Normalizzata con `normalizeNextMezzoTarga` nel writer. |
| `data` | string | Form Manutenzioni e writer da fare | Storico, Dossier, dettaglio | Si | Si | Raw persistito | Il form normalizza a ISO via `toISO` o fallback `fromUserInput`. |
| `dataEsecuzione` | string/null | In completamento o create da eseguita | Storico/dettaglio | Si | Si | Raw persistito opzionale | Preservata su edit se gia presente. |
| `stato` | string (`daFare`, `eseguita`, `chiusa_da_evento`, ecc.) | Form, writer da fare, chiusura da evento | Liste, KPI, dettaglio | Si | Si | Raw persistito | `chiusa_da_evento` e' stato satellite quando chiusa da evento gomme. |
| `descrizione` | string | Tutti i flussi | Tutti i reader | Si | Si | Raw persistito | Campo libero; non sostituisce il marker. Puo' alimentare fallback testuali. |
| `km` | number/null | Form; app import futuro dovra' confermare valori sospetti | Dossier/dettaglio/PDF | Si | Si | Raw persistito | Per `tipo !== "mezzo"` viene null. |
| `fornitore` | string/null | Form/completamento | Dati completamento, Dossier | Si | Si | Raw persistito opzionale | Campo officina/gommista generico, non specifico gomme. |
| `segnalatoDa` | string/null | Form da fare, create da sorgenti, preservato su edit (`2575-2593`) | Lista, dettaglio, Dossier/storia | Si | Si | Raw persistito opzionale | Campo corretto per autista/nome sorgente se disponibile. |
| `origineRefKey` | string/null | Writer da sorgente e salvataggio preservano | Apertura origine, dettaglio | Si | Si | Raw persistito opzionale | Esempi key: `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`; import manuale TI282780 usa `@gomme_eventi` nei report, ma il codice corrente non crea quel flusso automaticamente. |
| `origineRefId` | string/null | Writer da sorgente e salvataggio preservano | Apertura origine, dettaglio | Si | Si | Raw persistito opzionale | Id della sorgente. |
| `origineRefs` | array legami | `writeLegamiOrigine` se payload lo passa | Dettaglio origini | Si | Si | Raw persistito opzionale | Usato per origine multipla. |
| `chiusuraDi` | string/null | `nextChiusuraEventoWriter` | Badge/timeline, sgancio | Si | Si | Raw persistito opzionale | Per gomme evento: `"gomme_evento"`. |
| `chiusuraRefId` | string/null | `nextChiusuraEventoWriter` | Badge/timeline, sgancio | Si | Si | Raw persistito opzionale | Id evento esterno. |
| `chiusuraData` | number/null | `nextChiusuraEventoWriter` | Timeline/stato | Si | Si | Raw persistito opzionale | Timestamp chiusura. |
| `sourceDocumentId` | string/null | Archivista/manutenzione e salvataggio preservano | Apertura documento | Non specifico | Non specifico | Raw persistito opzionale | Non e' campo gomme, ma esiste nel payload. |
| `sourceRecordId` | string | Non scritto da `saveNextManutenzioneBusinessRecord` come campo raw `@manutenzioni` | Read model Dossier (`NextGommeReadOnlyItem`) | Si | Si | Derivato/read model | In `nextManutenzioniGommeDomain` identifica l'item aggregato; non e' schema raw del writer manutenzioni. |

Conclusione schema: il ramo gomme ufficiale in `@manutenzioni` e' gia sufficiente per importare eventi come manutenzioni ordinarie o straordinarie senza inventare campi. Mancano semmai mapping e conferma dati, non lo schema base.

## 4. COME MANUTENZIONI CREA OGGI UNA MANUTENZIONE GOMME MANUALE

Flusso reale:

```text
NextManutenzioniPage
  -> form con subtype gomme
  -> saveRecord()
  -> saveNextManutenzioneBusinessRecord()
  -> sanitizeBusinessRecord()
  -> storage/@manutenzioni
```

### 4.1 Gomme ordinarie

Campi UI compilati:

- subtype `gomme`;
- targa, tipo, data, descrizione, stato, fornitore/km/materiali se pertinenti;
- chip assi da `assiDisponibili`;
- data cambio e km cambio costruiti in `gommePerAsseDraft`;
- eventuale `segnalatoDa` per creazione `daFare`.

Validazioni:

- targa, descrizione e data obbligatorie (`NextManutenzioniPage.tsx:2499-2502`);
- nuovo record eseguito su mezzo motorizzato senza km: warning confermabile (`2514-2517`);
- ordinario non-completion: almeno un asse obbligatorio (`2524-2527`);
- completamento di record gomme gia tipizzato su motrice/trattore: km obbligatorio (`2478-2512`).

Campi scritti:

- `gommeInterventoTipo="ordinario"`;
- `assiCoinvolti=[...]`;
- `gommePerAsse=[{ asseId, dataCambio, kmCambio }]`;
- campi manutenzione generici (`targa`, `data`, `dataEsecuzione`, `stato`, `descrizione`, `km`, `fornitore`, `segnalatoDa`, ecc.).

Visualizzazione dopo:

- `NextMappaStoricoPage` riconosce il record come gomme se ha `assiCoinvolti`, `gommePerAsse` o `gommeInterventoTipo` (`354-385`);
- mostra "Assi coinvolti", "Tipo intervento", righe per asse con data e km cambio (`1137-1195`);
- Dossier Gomme lo riceve come `sourceOrigin="manutenzione_derivata"`.

### 4.2 Gomme straordinarie

Campi UI compilati:

- subtype `gomme-straordinario`;
- motivo straordinario (`gomma singola`, `sostituzione urgente`, `foratura / danno`, `intervento non pianificato`, `altro`);
- asse facoltativo;
- numero gomme facoltativo;
- campi manutenzione generici.

Validazioni:

- nuovo straordinario non-completion: motivo esplicito obbligatorio (`2529-2531`);
- completamento gomme gia tipizzato su categoria motorizzata: km obbligatorio come sopra.

Campi scritti:

- `gommeInterventoTipo="straordinario"`;
- `gommeStraordinario={ asseId, quantita, motivo }`;
- `assiCoinvolti=[]`;
- `gommePerAsse=[]`.

Visualizzazione dopo:

- `NextMappaStoricoPage` mostra badge `STRAORDINARIO` se `selectedRecord.gommeStraordinario` esiste (`1141-1146`);
- oggi nel box dettaglio mostra tipo e assi/righe asse quando presenti, ma il rendering della sezione non espone in modo completo `motivo` e `quantita` come card dedicate.

## 5. COME AUTISTI SCRIVE OGGI EVENTI / SEGNALAZIONI GOMME

### 5.1 App autisti

Fonte: `src/autisti/GommeAutistaModal.tsx`.

Dati inseribili:

- target `targetType` e `targetTarga` derivati dal contesto mezzo;
- categoria;
- km obbligatorio per salvare (`kmValid`, `canSave`);
- modalita `cambio` o `rotazione`;
- tipo intervento (`sostituzione`, `riparazione`, `rotazione`);
- marca;
- gomme selezionate (`gommeIds`);
- asse (`asseId`, `asseLabel`);
- dati rotazione (`rotazioneSchema`, `rotazioneText`, `rotazioneAssi`, `assiConCambioGomme`);
- autista (`id`, `nome`, `badge`);
- contesto (`targaCamion`, `targaRimorchio`).

Shape scritta in `@cambi_gomme_autisti_tmp`:

```text
{
  id,
  targetType,
  targetTarga,
  categoria,
  km,
  data: Date.now(),
  marca,
  tipo,
  gommeIds,
  asseId,
  asseLabel,
  rotazioneSchema,
  rotazioneText,
  rotazioneAssi,
  assiConCambioGomme,
  autista,
  contesto,
  stato: "nuovo",
  letta: false
}
```

Campi gia utili per Manutenzioni:

- `targetTarga` -> `targa`;
- `data` -> `data`/`dataEsecuzione` previa normalizzazione;
- `tipo` + `gommeIds` + `rotazioneText` -> descrizione e possibile scelta ordinario/straordinario;
- `asseId` / `asseLabel` -> `assiCoinvolti` o `gommeStraordinario.asseId`;
- `km` -> `km` o `gommePerAsse[].kmCambio`, solo se confermato plausibile;
- `autista.nome` / `badge` -> `segnalatoDa`;
- `marca` -> oggi non ha campo marker dedicato in `@manutenzioni`, quindi puo' stare in descrizione se si vuole conservare senza schema nuovo.

### 5.2 Autisti Inbox / Autisti Admin NEXT

Come arriva il cambio gomme:

- `NextAutistiAdminNative` legge `@cambi_gomme_autisti_tmp` (`448-464`) e lo mostra nella tab gomme (`3021-3124`);
- `NextAutistiGommeAllNative` legge la stessa key per la lista `/next/autisti-inbox/gomme` (`69-85`).

Cosa modifica l'admin:

- funzioni di update cambiano campi del record tmp (`updateGommeRecord`), ma in browser la mutazione e' bloccata da `shouldBlockAdminMutations()` (`1882-1898`);
- azioni "letta", "presa_in_carico", "importa" passano dallo stesso blocco.

Cosa succede quando importa:

```text
importGommeRecord(record)
  -> se shouldBlockAdminMutations(): mostra blocco read-only e non salva
  -> altrimenti apre NextImportGommeChiusuraModal
  -> confirmImportGommeRecord(selected)
      -> appendGommeEventoUfficialeIfMissing(record)
      -> chiude candidati selezionati con chiudi*DaEvento
      -> updateGommeRecord(id, { stato:"importato", letta:true })
```

Dataset scritti se il blocco non intervenisse:

- `@gomme_eventi`: copia evento senza `letta` e `stato`;
- `@cambi_gomme_autisti_tmp`: patch `stato="importato"`, `letta=true`;
- `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`: solo patch di chiusura sui candidati gia esistenti.

Risposta netta:

`Oggi l'import da Autisti Inbox / Admin crea o aggiorna una manutenzione gomme in @manutenzioni? PARZIALE.`

- **SI solo** se "aggiorna" significa chiudere una manutenzione gia esistente selezionata come candidata, scrivendo `stato="chiusa_da_evento"`, `chiusuraDi="gomme_evento"`, `chiusuraRefId`.
- **NO** se il requisito e' creare una nuova manutenzione gomme ufficiale in `@manutenzioni` quando arriva un evento gomme. Quel writer non esiste nel flusso import attuale.

Blocchi:

- `shouldBlockAdminMutations()` ritorna true nel browser e rende admin NEXT read-only (`NextAutistiAdminNative.tsx:774-778`);
- `cloneWriteBarrier` per `CHIUSURA_DA_EVENTO` consente solo `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` e non include `@gomme_eventi`/`@cambi_gomme_autisti_tmp`;
- `storageSync.setItemSync` inghiotte `CloneWriteBlockedError`, quindi alcune scritture bloccate possono fallire silenziosamente (`storageSync.ts:133-135`).

## 6. COME DOSSIER VEDE OGGI LE GOMME

### Reader

`readNextMezzoManutenzioniGommeSnapshot(targa)` in `src/next/domain/nextManutenzioniGommeDomain.ts:1501-1596` legge:

- `@manutenzioni` via `readNextMezzoManutenzioniSnapshot`;
- `@cambi_gomme_autisti_tmp`;
- `@gomme_eventi`.

### Cosa arriva da `@manutenzioni`

Arrivano manutenzioni ufficiali, strutturate o derivate da testo. Gli item generati da storico hanno `sourceOrigin="manutenzione_derivata"` e sono quelli che rappresentano lo storico ufficiale.

### Cosa arriva da `@cambi_gomme_autisti_tmp`

Arrivano eventi esterni tmp da app autisti. `resolveExternalTyreEvent` estrae targa, data, asse, quantita, marca, km, autista, stato e `sourceRecordId`. Questi record sono visibili come eventi, non come storico ufficiale.

### Cosa arriva da `@gomme_eventi`

Arrivano eventi esterni ufficializzati. Anche questi non diventano manutenzioni ufficiali finche non esiste un corrispondente in `@manutenzioni`.

### Dedupliche

- `dedupeExternalTyreItems` preferisce eventi ufficiali rispetto a tmp quando hanno stesso `sourceRecordId`;
- `dedupeExternalAgainstMaintenance` evita doppio conteggio se un evento esterno corrisponde gia a una manutenzione importata;
- match forte solo con `targetTarga`/`targa`; match di contesto resta plausibile.

### Superfici

- `NextDossierMezzoPage` usa lo snapshot composito e mostra riepilogo gomme per asse, eventi straordinari e link a Dossier Gomme;
- `NextDossierGommePage` monta `NextGommeEconomiaSection` con `dataScope="legacy_parity"`;
- `NextGommeEconomiaSection` di default potrebbe usare `extended`, ma nella route Dossier Gomme attuale filtra a `sourceOrigin === "manutenzione_derivata"`, quindi non e' una vista completa degli eventi esterni da importare.

## 7. DETTAGLIO MANUTENZIONI: COSA MOSTRA OGGI QUANDO IL RECORD E' GOMME

### Riconoscimento

`NextMappaStoricoPage` capisce che un record e' gomme se:

- `assiCoinvolti.length > 0`;
- `gommePerAsse.length > 0`;
- `gommeInterventoTipo` presente;
- `tipo === "gomme"`;
- descrizione contiene keyword gomme/pneumatici.

### Cosa mostra per ordinarie

Nel box "Dettagli intervento gomme" mostra:

- assi coinvolti come tag;
- tipo intervento;
- per ogni `gommePerAsse`: asse, data cambio, km cambio.

### Cosa mostra per straordinarie

Mostra badge `STRAORDINARIO` se `gommeStraordinario` esiste e puo' mostrare tipo intervento. Il codice letto non evidenzia come card dedicate:

- `gommeStraordinario.motivo`;
- `gommeStraordinario.quantita`;
- `gommeStraordinario.asseId` se non passa da assi normalizzati.

### Dati autista/evento visibili

Visibili indirettamente o altrove:

- `segnalatoDa` viene letto da helper/lista e preservato nel record;
- `chiusuraDi`/`chiusuraRefId` alimentano badge/timeline "chiusa da evento";
- `origineRefKey`/`origineRefId` alimentano la sezione origini/apertura origine.

Non risultano ben evidenziati nel box gomme:

- autista evento (`autista.nome`, `badge`) se resta solo nel record esterno;
- `marca` evento, perche' non e' campo marker `@manutenzioni`;
- `sourceRecordId` del read model Dossier;
- stato evento (`stato`, `letta`) se non e' stato riversato in campi raw della manutenzione;
- origine `@gomme_eventi` come blocco leggibile dentro il dettaglio gomme, salvo campi generici origine/chiusura.

### Leggibilita

La UI attuale e' funzionale ma dispersiva per record gomme importati o derivati da eventi:

- ordinario e' leggibile per asse/data/km;
- straordinario non espone abbastanza bene motivo/quantita/origine;
- i dati evento/autista/marca sono fuori dal box gomme o assenti dallo storico ufficiale;
- il miglioramento corretto e' nel ramo Dettaglio Manutenzioni, senza cambiare schema.

## 8. GAP REALE, SENZA INVENTARE LAVORI

### A. Gap dati/import

- L'import admin NEXT non crea una manutenzione nuova in `@manutenzioni`.
- L'import admin puo' solo scrivere `@gomme_eventi`, patchare tmp e chiudere candidati gia esistenti, ma in browser e' bloccato da `shouldBlockAdminMutations`.
- `NextImportGommeChiusuraModal` seleziona candidati aperti, non costruisce il payload gomme ufficiale.
- `marca` esiste negli eventi esterni ma non nello schema marker `@manutenzioni`; senza nuovo campo, va conservata in descrizione o lasciata nel read model evento.
- `km` evento puo' essere sospetto: il codice non ha una policy import per confermarlo/scartarlo prima di scriverlo in `@manutenzioni`.

### B. Gap UI Dettaglio Manutenzioni

- `gommeStraordinario.motivo` e `quantita` non sono evidenziati bene nel box dettaglio.
- Autista/segnalato da/origine evento non sono presentati come dati principali del blocco gomme.
- Marca, se disponibile dall'evento o dalla descrizione, non viene mostrata come campo dedicato del dettaglio storico.
- Ordinario/straordinario potrebbero essere visualmente piu chiari con card principali e badge.

### C. Gap Dossier

- Dossier Gomme route usa `dataScope="legacy_parity"`, quindi mostra soprattutto manutenzioni derivate e non tutti gli eventi esterni.
- Il Dossier sa leggere eventi esterni, ma questo non li promuove a storico ufficiale.

### D. Gap barrier/scope

- Per far partire l'import dal flusso esistente servono permessi/scope espliciti sul path scelto.
- Oggi `CHIUSURA_DA_EVENTO` non consente `@gomme_eventi` e `@cambi_gomme_autisti_tmp`.
- `/next/autisti-admin` e' bloccato a livello applicativo; se il punto futuro resta li, va rimosso/gestito il blocco con decisione esplicita. Alternativa piu sicura: agganciare il ponte in un path gia governato di Manutenzioni o Inbox, con scope nuovo e chiuso.

## 9. PUNTO MINIMO DI INTERVENTO FUTURO

Punto minimo consigliato: **estendere il flusso di conferma import gomme esistente, non creare modulo nuovo**.

Logica:

```text
Autisti/app crea evento
  -> @cambi_gomme_autisti_tmp
Autisti Admin/InBox conferma import
  -> mantiene append @gomme_eventi
  -> mantiene chiusura candidati esistenti
  -> in piu crea/aggancia una manutenzione ufficiale in @manutenzioni
     usando lo schema gomme esistente
```

File probabili da toccare in una futura execution mirata:

- `src/next/autistiInbox/NextAutistiAdminNative.tsx`: punto attuale `confirmImportGommeRecord`, solo se Giuseppe decide che l'import resta li;
- `src/next/components/NextImportGommeChiusuraModal.tsx`: solo per aggiungere review/campi di conferma se necessari;
- nuovo helper/writer piccolo in `src/next/writers/*` oppure funzione dedicata vicina al dominio, che costruisca payload `saveNextManutenzioneBusinessRecord` da evento gomme;
- `src/next/domain/nextManutenzioniDomain.ts`: da usare, non da cambiare, se lo schema basta;
- `src/utils/cloneWriteBarrier.ts`: solo per scope esplicito del nuovo writer, se autorizzato.

File da non toccare:

- `src/pages/Manutenzioni.tsx`;
- `src/autistiInbox/AutistiAdmin.tsx`;
- `src/components/AutistiEventoModal.tsx`;
- app autisti, salvo bug separato e autorizzato;
- Dossier come writer.

Funzioni candidate:

- `confirmImportGommeRecord`: orchestrazione import gia esistente;
- `appendGommeEventoUfficialeIfMissing`: mantenere per idempotenza evento ufficiale;
- `saveNextManutenzioneBusinessRecord`: writer ufficiale per creare `@manutenzioni`;
- `chiudiManutenzioneDaEvento` / `chiudiSegnalazioneDaEvento` / `chiudiControlloDaEvento`: mantenere per candidati esistenti.

Funzioni da non usare:

- legacy `appendGommeManutenzione` in `src/components/AutistiEventoModal.tsx`, perche' crea record testuale madre senza marker;
- legacy `src/pages/Manutenzioni.tsx` modale gomme;
- scritture dirette `setItemSync("@manutenzioni", ...)` fuori dal writer ufficiale, salvo nuova decisione esplicita.

Rischio:

- Import verso `@manutenzioni`: **EXTRA ELEVATO**.
- UI dettaglio: **NORMALE** se solo rendering di campi gia presenti.

Alternativa piu sicura:

1. Primo step execution: solo UI dettaglio gomme migliorata in `NextMappaStoricoPage` usando campi gia presenti, nessun writer.
2. Secondo step execution separato: writer import evento -> manutenzione, con test, scope barrier dedicato e casi di accettazione.

## 10. PROPOSTA UI SOLO PER DETTAGLIO MANUTENZIONI GOMME

Non serve una nuova area. Migliorare solo il Dettaglio Manutenzioni quando `showTyreSection` e' true.

Layout proposto:

- intestazione compatta del blocco:
  - badge `ORDINARIO` / `STRAORDINARIO`;
  - targa;
  - data intervento;
  - stato (`eseguita`, `da fare`, `chiusa da evento`);
- card dati principali:
  - Tipo intervento;
  - Assi/posizione;
  - Km;
  - Fornitore/officina;
  - Segnalato da / autista;
  - Origine evento o origine segnalazione se disponibile.

Per ordinario:

- card "Assi aggiornati";
- una riga per ogni `gommePerAsse`:
  - asse;
  - data cambio;
  - km cambio;
  - se mancante: `Dato non indicato`, non inventare fallback visivo diverso dal dato.

Per straordinario:

- card "Evento straordinario";
- motivo (`gommeStraordinario.motivo`);
- asse (`gommeStraordinario.asseId`);
- quantita (`gommeStraordinario.quantita`);
- se dato assente: `Non indicato`.

Marca:

- mostrare solo se disponibile:
  - da descrizione gia testuale con riga `marca: ...`, oppure
  - da evento collegato se in futuro il writer conserva l'origine leggibile.
- non aggiungere campo raw `marca` a `@manutenzioni` senza decisione di schema.

Autista / segnalato da:

- usare `segnalatoDa` se presente;
- se in futuro il writer importa da evento app autisti, valorizzare `segnalatoDa` con nome autista quando disponibile.

Origine:

- se `origineRefKey/origineRefId` presenti, mostrare "Origine: <key> / <id>";
- se `chiusuraDi="gomme_evento"`, mostrare "Collegato a evento gomme <chiusuraRefId>";
- mantenere link/apertura origine gia esistenti.

Stato importato/ufficiale:

- record in `@manutenzioni`: etichetta "Storico ufficiale";
- record chiuso da evento: etichetta "Risolto da evento gomme";
- evento esterno non importato: non dovrebbe comparire come manutenzione ufficiale nel Dettaglio, salvo vista Dossier/read model.

## 11. RISCHI

| Rischio | Classe | Dettaglio |
| --- | --- | --- |
| UI dettaglio | NORMALE | Rendering di campi gia letti; rischio principale e sovraccaricare il dettaglio o mostrare dati derivati come se fossero raw. |
| Import verso `@manutenzioni` | EXTRA ELEVATO | Scrive storico ufficiale, puo creare duplicati, km errati, tipo errato, legami sbagliati. |
| Dossier | ELEVATO | Cambiare dedup/read model puo far sparire o duplicare eventi; meglio non toccarlo nella prima execution writer. |
| Barrier | EXTRA ELEVATO | Nuovo ponte richiede scope esplicito; aprire key sbagliate o path vecchi crea scritture non governate. |
| Duplicati | ELEVATO | Esistono duplicati storici in `@gomme_eventi`; il writer deve essere idempotente per id evento/origine. |
| Perdita dati | ELEVATO | Non bisogna perdere marca/autista/km evento: se non entrano nello schema marker, vanno riportati in descrizione/origine o lasciati nell'evento. |
| Madre/legacy | ELEVATO | Usare legacy riporta record testuali senza marker e contraddice la decisione madre intoccabile. |

## 12. VERDETTO FINALE

1. Lo schema gomme in Manutenzioni esiste gia? **SI**.
2. Schema reale da rispettare: `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse[{asseId,dataCambio,kmCambio}]`, `gommeStraordinario{asseId,quantita,motivo}`, piu campi manutenzione generici (`targa`, `data`, `dataEsecuzione`, `stato`, `descrizione`, `km`, `fornitore`, `segnalatoDa`, `origineRef*`, `chiusura*`).
3. L'import attuale da Autisti Inbox/Admin scrive gia in Manutenzioni? **PARZIALE**: puo chiudere una manutenzione gia esistente selezionata, ma **NO** non crea una nuova manutenzione gomme ufficiale.
4. Punto minimo futuro: intervenire nel flusso di conferma import gomme esistente (`confirmImportGommeRecord`) o in un writer piccolo chiamato da quel flusso, creando una manutenzione con `saveNextManutenzioneBusinessRecord` secondo schema esistente e mantenendo append evento/chiusure.
5. UI da migliorare: solo Dettaglio Manutenzioni gomme in `NextMappaStoricoPage`/ramo embedded, evidenziando ordinario/straordinario, asse, km, motivo, autista/segnalato da, origine.
6. Serve un modulo nuovo? **NO**.
7. Serve una nuova route? **NO**.
8. Serve prima un altro audit? **NO**, il codice e' abbastanza mappato per un prompt execution mirato. Serve invece una decisione operativa su dove far partire il writer (`/next/autisti-admin` oggi bloccato oppure flusso Manutenzioni/Inbox con scope dedicato) e sui campi da confermare prima di scrivere km/marca nel perimetro esistente.

## Verifiche eseguite

Comandi di sola lettura usati:

- `rg "gommeInterventoTipo"`
- `rg "gommePerAsse"`
- `rg "gommeStraordinario"`
- `rg "assiCoinvolti"`
- `rg "confirmImportGommeRecord"`
- `rg "appendGommeEventoUfficialeIfMissing"`
- `rg "@cambi_gomme_autisti_tmp"`
- `rg "@gomme_eventi"`
- `rg "@manutenzioni"`
- `rg "GommeAutistaModal"`
- `rg "NextImportGommeChiusuraModal"`
- `rg "saveNextManutenzioneBusinessRecord"`
- `rg "segnalatoDa"`
- `rg "origineRef"`
- `rg "chiusuraDi"`
- `rg "sourceRecordId"`
- letture mirate con `Get-Content` dei file elencati.

Build/test non eseguiti: audit documentale, nessuna modifica runtime.
