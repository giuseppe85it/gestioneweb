# AUDIT ULTIMI 5 BUCHI PRE IA2

## Punto 1 — Prompt di estrazione del backend OpenAI

### 1.1 Prompt attuale per il caso immagine
Ramo attivato quando `detectAttachmentSourceKind(...)` restituisce `image_document`: `backend/internal-ai/server/internal-ai-document-extraction.js:922-931`, chiamata effettiva `:986-995`.

System prompt letterale: `backend/internal-ai/server/internal-ai-document-extraction.js:782-790`
> Sei il parser documentale della nuova IA interna del gestionale. Leggi fatture, DDT, preventivi e documenti materiali di magazzino. Rispondi solo con JSON valido. Non inventare mai dati: se un campo non e leggibile usa null. Estrai solo righe materiali o economiche utili alla review operativa.

User prompt letterale: `backend/internal-ai/server/internal-ai-document-extraction.js:792-843`
> Task `Estrai dati documentali strutturati per review Magazzino.`
> Parametri dinamici: `fileName`, `sourceHint`.
> Schema richiesto:
> - `document.type`
> - `document.supplierName`
> - `document.documentNumber`
> - `document.documentDate`
> - `document.recipientName`
> - `document.currency`
> - `document.imponibile`
> - `document.ivaAmount`
> - `document.ivaRate`
> - `document.totalAmount`
> - `document.notes[]`
> - `items[].description`
> - `items[].articleCode`
> - `items[].quantity`
> - `items[].uom`
> - `items[].unitPrice`
> - `items[].lineTotal`
> - `items[].currency`
> - `items[].confidence`
> - `items[].warnings[]`
> - `rawTextExcerpt`
> - `warnings[].code|severity|message`
> Guardrail:
> - `Non aggiungere testo fuori dal JSON.`
> - `Se il documento e ambiguo mantieni i campi null.`
> - `Le quantita devono restare numeri, non stringhe.`

Per il caso immagine il backend allega `input_image` nello user content: `backend/internal-ai/server/internal-ai-document-extraction.js:877-919`.

### 1.2 Prompt attuale per il caso PDF
Classificazione PDF: `backend/internal-ai/server/internal-ai-document-extraction.js:922-927`.

`pdf_text`
- stesso system prompt: `:782-790`
- stesso user prompt JSON: `:792-843`
- in piu allega il testo estratto dal PDF come `input_text`: `backend/internal-ai/server/internal-ai-document-extraction.js:845-874`
- chiamata effettiva dal dispatcher: `backend/internal-ai/server/internal-ai-document-extraction.js:1007-1014`

`pdf_scan`
- stesso system prompt: `:782-790`
- stesso user prompt JSON: `:792-843`
- in piu allega il PDF come `input_file`: `backend/internal-ai/server/internal-ai-document-extraction.js:877-919`
- chiamata effettiva dal dispatcher: `backend/internal-ai/server/internal-ai-document-extraction.js:997-1006`

### 1.3 Prompt Gemini legacy
Prompt letterale: `functions/estrazioneDocumenti.js:28-54`
> Leggi completamente il documento PDF o immagine.
>
> 1. Estrai il testo completo.
> 2. Identifica se presenti:
>    - fornitore
>    - numero documento
>    - data
>    - targa del mezzo
>    - totale
> 3. Estrai eventuali voci di dettaglio (descrizione, quantita, prezzo, importo).
>
> Restituisci SOLO JSON con questa struttura (puoi omettere campi o aggiungerne se necessari):
> `tipoDocumento, fornitore, numeroDocumento, dataDocumento, targa, marca, modello, telaio, km, imponibile, ivaPercentuale, ivaImporto, totaleDocumento, voci, testo`
> `NON aggiungere testo fuori dal JSON.`

### 1.4 Schema di risposta atteso
Backend OpenAI:
- il provider deve restituire JSON puro in `response.output_text`: `backend/internal-ai/server/internal-ai-document-extraction.js:874`, `:919`
- il parser ripulisce eventuali code fence e prova `JSON.parse`, con fallback da prima `{` a ultima `}`: `backend/internal-ai/server/internal-ai-document-extraction.js:605-626`
- poi normalizza nel contratto interno:

| Campo finale | Tipo | File:riga |
|---|---|---|
| `version` | number | `backend/internal-ai/server/internal-ai-document-extraction.js:185-201` |
| `stato` | string | `:185-201`, `:330-369` |
| `tipoSorgente` | string | `:185-201`, `:922-935` |
| `modalitaEstrazione` | string | `:185-201`, `:986-1014` |
| `providerUsato` | boolean | `:185-201` |
| `tipoDocumento` | string/null | `:628-723` |
| `fornitore` | string/null | `:628-723` |
| `numeroDocumento` | string/null | `:628-723` |
| `dataDocumento` | string/null | `:628-723` |
| `destinatario` | string/null | `:628-723` |
| `valuta` | string/null | `:628-723` |
| `imponibile` | number/null | `:628-723` |
| `ivaImporto` | number/null | `:628-723` |
| `ivaPercentuale` | string/null | `:628-723` |
| `totaleDocumento` | number/null | `:628-723` |
| `noteImportanti[]` | string[] | `:628-723` |
| `righe[]` | array | `:202-263`, `:628-723` |
| `warnings[]` | array | `:174-183`, `:628-723` |
| `campiMancanti[]` | string[] | `:265-281`, `:330-369` |
| `testoEstrattoBreve` | string/null | `:628-723` |

Gemini legacy:
- richiede `responseMimeType: "application/json"`: `functions/estrazioneDocumenti.js:119`
- poi legge `parts[0].text` o fallback strutturati e fa `JSON.parse(text)`: `functions/estrazioneDocumenti.js:129-148`

### 1.5 Parametri configurabili
- Il prompt OpenAI e hardcoded nelle funzioni `buildProviderSystemPrompt()` e `buildProviderUserInstructions(...)`: `backend/internal-ai/server/internal-ai-document-extraction.js:782-843`
- Parametri dinamici reali: `fileName`, `sourceHint`, testo estratto o file binario: `:792-843`, `:845-919`
- Non esiste un input `tipoDocumento atteso` o un template per verticale: `NON DETERMINABILE come supporto runtime`, perche nel file non compare nessun parametro di questo tipo.

## Punto 2 — cloneWriteBarrier: mappa completa

### 2.1 Logica della barrier
- La barrier si attiva solo in clone runtime `/next*`: `src/utils/cloneWriteBarrier.ts:44-45`, `:280-285`
- Blocca ogni scrittura se non rientra in una eccezione codificata in `isAllowedCloneWriteException(...)`: `src/utils/cloneWriteBarrier.ts:193-278`
- Le eccezioni sono guidate da:
  - route attuale
  - `kind` della scrittura (`storageSync.setItemSync`, `storage.uploadBytes`, `fetch.runtime`)
  - `meta.key`, `meta.path`, `meta.url`
- Intercetta anche fetch mutanti: `src/utils/cloneWriteBarrier.ts:289-377`
- Per `/next/ia/interna` l'unica eccezione esplicita e il POST verso `estrazioneDocumenti`; nessuna `storageSync.setItemSync` generale viene aperta su `@documenti_*`, `@manutenzioni`, `@costiMezzo`, `@mezzi_aziendali`: `src/utils/cloneWriteBarrier.ts:44-46`, `:145-154`, `:193-278`

### 2.2 Lista completa delle collezioni e il loro stato
| Collezione | Scrittura da `/next/*` | Eccezioni | File:riga evidenza |
|---|---|---|---|
| `@ordini` | bloccata di default | ammessa solo da route Euromecc | `src/utils/cloneWriteBarrier.ts:35`, `:219-239` |
| `@manutenzioni` | bloccata di default | ammessa da `/next/manutenzioni`; ammessa anche da route dossier | `src/utils/cloneWriteBarrier.ts:16-23`, `:255-273` |
| `@costiMezzo` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@mezzi_aziendali` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@preventivi` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@documenti_mezzi` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@documenti_magazzino` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@documenti_generici` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@inventario` | bloccata di default | ammessa da `/next/magazzino`; ammessa da `/next/manutenzioni`; ammessa da route dossier; ammessa in scope IA interno inline | `src/utils/cloneWriteBarrier.ts:9-14`, `:16-23`, `:38-41`, `:195-199`, `:241-250`, `:255-273` |
| `@cisterne_adblue` | bloccata di default | ammessa da `/next/magazzino` | `src/utils/cloneWriteBarrier.ts:9-14`, `:241-250` |
| `@rifornimenti` | bloccata | nessuna eccezione | `src/utils/cloneWriteBarrier.ts:193-278` |
| `@materialiconsegnati` | bloccata di default | ammessa da `/next/magazzino`, `/next/manutenzioni`, route dossier | `src/utils/cloneWriteBarrier.ts:9-14`, `:16-23`, `:38-41`, `:241-250`, `:255-273` |
| `@lavori` | bloccata di default | ammessa da `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti`, `/next/dettagliolavori*` | `src/utils/cloneWriteBarrier.ts:2-7`, `:209-211` |
| `@mezzi_foto_viste` | bloccata di default | ammessa da `/next/manutenzioni` | `src/utils/cloneWriteBarrier.ts:16-23`, `:266-267` |
| `@mezzi_hotspot_mapping` | bloccata di default | ammessa da `/next/manutenzioni` | `src/utils/cloneWriteBarrier.ts:16-23`, `:266-267` |

### 2.3 Conseguenze per IA 2
Sul path `/next/ia/interna`:
- gia aperta: `@inventario` solo dentro lo scope `runWithCloneWriteScopedAllowance(INTERNAL_AI_MAGAZZINO_INLINE_SCOPE, ...)`: `src/utils/cloneWriteBarrier.ts:42-49`, `:171-191`, `:195-199`
- gia aperto come fetch: solo POST verso `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`: `src/utils/cloneWriteBarrier.ts:44-46`, `:145-154`, `:202-207`
- bloccate per IA 2 senza apertura esplicita barrier: `@costiMezzo`, `@manutenzioni`, `@mezzi_aziendali`, `@preventivi`, `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@ordini`, `@cisterne_adblue`, `@rifornimenti`

## Punto 3 — Firebase Storage paths e convenzioni upload

### 3.1 Tabella dei path usati oggi
| Tipo file | Path Storage | Convenzione nome | File:riga writer | Contesto |
|---|---|---|---|---|
| Foto mezzo | `mezzi/<targa>_<ts>.jpg` | targa con spazi rimossi + timestamp | `src/pages/Mezzi.tsx:679-689` | creazione/modifica mezzo |
| Libretto mezzo | `mezzi_aziendali/<mezzoId>/libretto.jpg` | id mezzo o folderId | `src/pages/IA/IALibretto.tsx:435-440`, `src/pages/IA/IACoperturaLibretti.tsx:425-426`, `:510-522` | salvataggio IA libretto / riparazione libretti |
| Documento IA mezzo/magazzino/generico | `documenti_pdf/<ts>_<selectedFile.name>` | timestamp + nome originale | `src/pages/IA/IADocumenti.tsx:498-504` | upload file originale prima di `@documenti_*` |
| Preventivo IA PDF input | `preventivi/ia/<extractionId>.pdf` | id estrazione | `src/pages/Acquisti.tsx:3454-3464` | preview / estrazione IA preventivo |
| Preventivo IA immagini input | `preventivi/ia/<extractionId>_<indice>.<ext>` | id estrazione + indice file | `src/pages/Acquisti.tsx:3472-3496` | preview / estrazione IA preventivo |
| Preventivo salvato | `preventivi/<id>.pdf` | id preventivo | `src/pages/Acquisti.tsx:3663-3668`, `src/pages/Acquisti.tsx:4033-4037` | salvataggio preventivo finale e update bozza |
| File Euromecc | `euromecc/relazioni/<uploadRelazioneId>/<ts>_<state.file.name>` | id relazione + timestamp + nome originale | `src/next/NextEuromeccPage.tsx:3163-3174` | conferma relazione Euromecc |
| Foto inventario NEXT | `inventario/<itemId>/foto.<ext>` | id item + estensione file | `src/next/NextMagazzinoPage.tsx:812`, `src/utils/cloneWriteBarrier.ts:14`, `:247-250` | foto articolo inventario nel modulo NEXT |

### 3.2 Path NON trovati
- `@costiMezzo`: nessun upload Storage dedicato trovato nel runtime letto
- `@manutenzioni`: nessun upload Storage dedicato trovato nel runtime letto
- `@preventivi_approvazioni`: nessun upload Storage dedicato trovato
- `@listino_prezzi`: nessun upload Storage dedicato trovato
- `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` non hanno path distinti per collection: condividono lo stesso upload `documenti_pdf/...`

## Punto 4 — Writer di `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`

### Shape condivisa del record scritto
Tipo base: `src/pages/IA/IADocumenti.tsx:29-67`  
Payload runtime: `src/pages/IA/IADocumenti.tsx:509-521`

| Campo | Tipo | Obbligatorio | Evidenza |
|---|---|---|---|
| `tipoDocumento` | string | si | `src/pages/IA/IADocumenti.tsx:39`, `:509` |
| `categoriaArchivio` | string | si | `src/pages/IA/IADocumenti.tsx:40`, `:511` |
| `fornitore` | string | si | `src/pages/IA/IADocumenti.tsx:42`, `:509` |
| `numeroDocumento` | string | si | `src/pages/IA/IADocumenti.tsx:43`, `:509` |
| `dataDocumento` | string | si | `src/pages/IA/IADocumenti.tsx:44`, `:509` |
| `targa` | string | no | `src/pages/IA/IADocumenti.tsx:46`, `:513` |
| `marca` | string | no | `src/pages/IA/IADocumenti.tsx:47` |
| `modello` | string | no | `src/pages/IA/IADocumenti.tsx:48` |
| `telaio` | string | no | `src/pages/IA/IADocumenti.tsx:49` |
| `km` | string | no | `src/pages/IA/IADocumenti.tsx:50` |
| `riferimentoPreventivoNumero` | string | no | `src/pages/IA/IADocumenti.tsx:53` |
| `riferimentoPreventivoData` | string | no | `src/pages/IA/IADocumenti.tsx:54` |
| `imponibile` | string | no | `src/pages/IA/IADocumenti.tsx:57` |
| `ivaPercentuale` | string | no | `src/pages/IA/IADocumenti.tsx:58` |
| `ivaImporto` | string | no | `src/pages/IA/IADocumenti.tsx:59` |
| `totaleDocumento` | string | no | `src/pages/IA/IADocumenti.tsx:60` |
| `valuta` | string | no | `src/pages/IA/IADocumenti.tsx:61`, `:512` |
| `currency` | string | no | `src/pages/IA/IADocumenti.tsx:62` |
| `voci[]` | array | no | `src/pages/IA/IADocumenti.tsx:65` |
| `iban` | string | no | `src/pages/IA/IADocumenti.tsx:68` |
| `beneficiario` | string | no | `src/pages/IA/IADocumenti.tsx:69` |
| `riferimentoPagamento` | string | no | `src/pages/IA/IADocumenti.tsx:70` |
| `banca` | string | no | `src/pages/IA/IADocumenti.tsx:71` |
| `importoPagamento` | string | no | `src/pages/IA/IADocumenti.tsx:72` |
| `testo` | string | no | `src/pages/IA/IADocumenti.tsx:75` |
| `fileUrl` | string | si | `src/pages/IA/IADocumenti.tsx:514` |
| `nomeFile` | string | si | `src/pages/IA/IADocumenti.tsx:515` |
| `createdAt` | timestamp | si | `src/pages/IA/IADocumenti.tsx:516` |
| `fonte` | string | si | `src/pages/IA/IADocumenti.tsx:517` |
| `daVerificare` | boolean | no | `src/pages/IA/IADocumenti.tsx:518-521` |
| `motivoVerifica` | string | no | `src/pages/IA/IADocumenti.tsx:518-521` |
| `targaEstrattaIA` | string/null | no | `src/pages/IA/IADocumenti.tsx:518-521` |

### 4.1 `@documenti_mezzi`
- Writer trovato: `src/pages/IA/IADocumenti.tsx:529-537`
- Snippet:
```ts
const targetCollection =
  categoriaArchivioFinale === "MEZZO"
    ? "@documenti_mezzi"
    : categoriaArchivioFinale === "MAGAZZINO"
    ? "@documenti_magazzino"
    : "@documenti_generici";
const savedRef = await addDoc(collection(db, targetCollection), payload);
```
- Contesto: save documento IA con `categoriaArchivioFinale === "MEZZO"`

### 4.2 `@documenti_magazzino`
- Writer trovato: `src/pages/IA/IADocumenti.tsx:529-537`
- Snippet: stesso writer condiviso sopra
- Contesto: save documento IA con `categoriaArchivioFinale === "MAGAZZINO"`

### 4.3 `@documenti_generici`
- Writer trovato: `src/pages/IA/IADocumenti.tsx:529-537`
- Snippet: stesso writer condiviso sopra
- Contesto: save documento IA con `categoriaArchivioFinale` diverso da `MEZZO` e `MAGAZZINO`

## Punto 5 — Writer di `@manutenzioni`

### 5.1 Writer che CREA un nuovo intervento
**Legacy principale** — `src/pages/Manutenzioni.tsx:345-362`
```ts
const nuovaVoce: VoceManutenzione = {
  id: Date.now().toString(),
  targa: t,
  tipo,
  fornitore,
  km: km ? Number(km) : null,
  ore: ore ? Number(ore) : null,
  sottotipo: tipo === "compressore" ? sottotipo : null,
  descrizione: desc,
  eseguito: eseguito || null,
  data: d,
  materiali: materialiTemp.length ? [...materialiTemp] : [],
};
const nuovoStorico = [nuovaVoce, ...storico];
await persistStorico(nuovoStorico);
```
Contesto: utente salva una manutenzione dalla pagina `Manutenzioni`.

**Legacy secondario gomme** — `src/components/AutistiEventoModal.tsx:362-374`
```ts
const nuovaVoce = {
  id: Date.now().toString(),
  targa,
  tipo: "mezzo",
  descrizione,
  data,
  km,
  materiali: [],
};
await setItemSync(KEY_MANUTENZIONI, [...list, nuovaVoce]);
```
Contesto: import evento gomme in manutenzione.

**NEXT business** — chiamante `src/next/NextManutenzioniPage.tsx:1094-1112`, writer `src/next/domain/nextManutenzioniDomain.ts:739-781`, `:910-924`

### 5.2 Writer che MODIFICA un intervento esistente
- **Legacy `Manutenzioni.tsx`: NON DETERMINABILE come vera modifica in place.**  
  Il file espone `isEditing`, ma il salvataggio costruisce comunque `nuovaVoce` con nuovo `id` e la prependa allo storico: `src/pages/Manutenzioni.tsx:118`, `:345-362`. Non emerge un ramo che aggiorni per id l'elemento esistente.
- **NEXT**: la modifica esiste. `saveNextManutenzioneBusinessRecord(...)` filtra lo storico usando `editingSourceId` e poi inserisce il record aggiornato in testa: `src/next/domain/nextManutenzioniDomain.ts:910-924`

### 5.3 Shape consolidata del record manutenzione
Shape legacy base: `src/pages/Manutenzioni.tsx:15-33`, `:212-224`  
Shape NEXT estesa: `src/next/domain/nextManutenzioniDomain.ts:100-125`, `:739-781`

| Campo | Tipo | Obbligatorio | Evidenza |
|---|---|---|---|
| `id` | string | si | `src/pages/Manutenzioni.tsx:345`, `src/next/domain/nextManutenzioniDomain.ts:739` |
| `targa` | string | si | `src/pages/Manutenzioni.tsx:346`, `src/next/domain/nextManutenzioniDomain.ts:739` |
| `tipo` | string | si | `src/pages/Manutenzioni.tsx:347`, `src/next/domain/nextManutenzioniDomain.ts:739` |
| `fornitore` | string | no | `src/pages/Manutenzioni.tsx:348`, `src/next/domain/nextManutenzioniDomain.ts:765` |
| `km` | number/null | no | `src/pages/Manutenzioni.tsx:349`, `:217`, `src/next/domain/nextManutenzioniDomain.ts:743`, `:767` |
| `ore` | number/null | no | `src/pages/Manutenzioni.tsx:350`, `:218`, `src/next/domain/nextManutenzioniDomain.ts:768` |
| `sottotipo` | string/null | no | `src/pages/Manutenzioni.tsx:351`, `:219`, `src/next/domain/nextManutenzioniDomain.ts:769` |
| `descrizione` | string | si | `src/pages/Manutenzioni.tsx:352`, `src/next/domain/nextManutenzioniDomain.ts:770` |
| `eseguito` | string/null | no | `src/pages/Manutenzioni.tsx:353`, `:220`, `src/next/domain/nextManutenzioniDomain.ts:771` |
| `data` | string | si | `src/pages/Manutenzioni.tsx:354`, `src/next/domain/nextManutenzioniDomain.ts:772` |
| `materiali[]` | array | no | `src/pages/Manutenzioni.tsx:355`, `src/next/domain/nextManutenzioniDomain.ts:773` |
| `materiali[].id` | string | si | `src/pages/Manutenzioni.tsx:15`, `src/next/domain/nextManutenzioniDomain.ts:100` |
| `materiali[].label` | string | si | `src/pages/Manutenzioni.tsx:16`, `src/next/domain/nextManutenzioniDomain.ts:101` |
| `materiali[].quantita` | number | si | `src/pages/Manutenzioni.tsx:17`, `src/next/domain/nextManutenzioniDomain.ts:102` |
| `materiali[].unita` | string | si | `src/pages/Manutenzioni.tsx:18`, `src/next/domain/nextManutenzioniDomain.ts:103` |
| `materiali[].fromInventario` | boolean | legacy no / NEXT si | `src/pages/Manutenzioni.tsx:19`, `src/next/domain/nextManutenzioniDomain.ts:104` |
| `materiali[].refId` | string | no | `src/pages/Manutenzioni.tsx:20`, `src/next/domain/nextManutenzioniDomain.ts:105` |
| `assiCoinvolti` | string[] | no | `src/next/domain/nextManutenzioniDomain.ts:120`, `:775` |
| `gommePerAsse` | array | no | `src/next/domain/nextManutenzioniDomain.ts:121`, `:776` |
| `gommeInterventoTipo` | string | no | `src/next/domain/nextManutenzioniDomain.ts:122`, `:774` |
| `gommeStraordinario` | object | no | `src/next/domain/nextManutenzioniDomain.ts:123`, `:775` |
| `sourceDocumentId` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:124`, `:781` |

### 5.4 Collegamento fattura → manutenzione
- Legacy `@manutenzioni`: **NON ESISTE** un campo documento/fattura nel tipo `VoceManutenzione` o nel writer `nuovaVoce`: `src/pages/Manutenzioni.tsx:15-33`, `:345-355`
- NEXT: esiste solo `sourceDocumentId`, cioe un id documento sorgente generico, non un campo nominato `fatturaId`: `src/next/domain/nextManutenzioniDomain.ts:124`, `:167-183`, `:781`

## Punto 6 — Riepilogo decisionale
| Collezione | Writer additivo esiste | Barrier lo blocca da NEXT | Upload Storage esiste | IA 2 puo scrivere oggi | Cosa serve per abilitare |
|---|---|---|---|---|---|
| `@costiMezzo` | NON DETERMINABILE nel runtime letto | si | no dedicato trovato | no | apertura barrier + writer additivo runtime non trovato |
| `@manutenzioni` | si | si su `/next/ia/interna` | no dedicato trovato | no | apertura barrier per IA 2 o passaggio da route gia ammessa |
| `@mezzi_aziendali` | si | si | si | no | apertura barrier |
| `@documenti_mezzi` | si | si | si (`documenti_pdf/...`) | no | apertura barrier |
| `@documenti_magazzino` | si | si | si (`documenti_pdf/...`) | no | apertura barrier |
| `@documenti_generici` | si | si | si (`documenti_pdf/...`) | no | apertura barrier |
| `@preventivi` | si | si | si (`preventivi/...`) | no | apertura barrier |
| `@inventario` | si | no, ma solo scope mirato | si (`inventario/...`) | si, solo scope inline IA magazzino | usare eccezione gia codificata |
| `@ordini` | si | si salvo Euromecc | no dedicato in questo audit | no | route/eccezione Euromecc o apertura barrier |
| `@cisterne_adblue` | si | si salvo Magazzino | no file documentale dedicato trovato | no | route Magazzino o apertura barrier |
