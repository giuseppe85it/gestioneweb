# AUDIT CAMPI REALI PER TEMPLATE IA2

## Capitolo 0 — Come leggere questo documento
- Le 7 famiglie sono fisse e seguono il perimetro del prompt.
- Ogni famiglia e divisa per collezione reale o sotto-blocco runtime.
- La colonna `File:riga writer` punta al punto in cui il campo viene scritto oppure al tipo runtime che lo dichiara quando il writer riusa l'oggetto intero.
- `Obbligatorio = si` quando il campo e sempre presente nell'oggetto scritto in quel ramo.
- `Obbligatorio = no` quando il campo e opzionale nel tipo oppure e scritto solo in alcuni rami.
- I campi annidati sono indicati come `materiali[].id`, `voci[].codice`, `prenotazioneCollaudo.data`.
- Se una shape e riusata identica in piu famiglie, la tabella completa compare una sola volta e gli altri capitoli la richiamano con evidenza.
- Se un writer additivo non e stato trovato nel codice, non invento la shape: lo dichiaro esplicitamente.

## Capitolo 1 — Famiglia 1 · Fattura/DDT magazzino ricambi

### 1.1 madre legacy · `@ordini`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/pages/Acquisti.tsx:1348` | ordine |
| `idFornitore` | string | si | `src/pages/Acquisti.tsx:1348` | ordine |
| `nomeFornitore` | string | si | `src/pages/Acquisti.tsx:1348` | ordine |
| `dataOrdine` | string | si | `src/pages/Acquisti.tsx:1348` | ordine |
| `materiali` | `MaterialeOrdine[]` | si | `src/pages/Acquisti.tsx:1348` | ordine |
| `arrivato` | boolean | si | `src/pages/Acquisti.tsx:1348` | ordine |
| `materiali[].id` | string | si | `src/types/ordini.ts:5`, `src/pages/Acquisti.tsx:1238` | |
| `materiali[].descrizione` | string | si | `src/types/ordini.ts:6`, `src/pages/Acquisti.tsx:1238` | |
| `materiali[].quantita` | number | si | `src/types/ordini.ts:7`, `src/pages/Acquisti.tsx:1238` | |
| `materiali[].unita` | string | si | `src/types/ordini.ts:8`, `src/pages/Acquisti.tsx:1238` | |
| `materiali[].arrivato` | boolean | si | `src/types/ordini.ts:9`, `src/pages/Acquisti.tsx:1238` | |
| `materiali[].dataArrivo` | string | no | `src/types/ordini.ts:10`, `src/pages/DettaglioOrdine.tsx:289` | aggiunto nel dettaglio ordine |
| `materiali[].fotoUrl` | string/null | no | `src/types/ordini.ts:11`, `src/pages/Acquisti.tsx:1238` | |
| `materiali[].fotoStoragePath` | string/null | no | `src/types/ordini.ts:12`, `src/pages/Acquisti.tsx:1238` | |

### 1.2 NEXT · ramo comparabile trovato
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/next/NextEuromeccPage.tsx:3008` | scrittura NEXT su `@ordini` dal ramo Euromecc |
| `idFornitore` | string | si | `src/next/NextEuromeccPage.tsx:3008` | fisso `"euromecc"` |
| `nomeFornitore` | string | si | `src/next/NextEuromeccPage.tsx:3008` | |
| `dataOrdine` | string | si | `src/next/NextEuromeccPage.tsx:3008` | |
| `materiali` | array | si | `src/next/NextEuromeccPage.tsx:3008` | |
| `arrivato` | boolean | si | `src/next/NextEuromeccPage.tsx:3008` | |
| `materiali[].id` | string | si | `src/next/NextEuromeccPage.tsx:3014` | |
| `materiali[].descrizione` | string | si | `src/next/NextEuromeccPage.tsx:3014` | |
| `materiali[].quantita` | number | si | `src/next/NextEuromeccPage.tsx:3014` | |
| `materiali[].unita` | string | si | `src/next/NextEuromeccPage.tsx:3014` | |
| `materiali[].arrivato` | boolean | si | `src/next/NextEuromeccPage.tsx:3014` | nessun `dataArrivo` o foto in questo ramo |

### 1.3 archivio documentale relativo · `@documenti_magazzino`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `tipoDocumento` | string | si | `src/pages/IA/IADocumenti.tsx:506` | payload IA |
| `categoriaArchivio` | string | si | `src/pages/IA/IADocumenti.tsx:506` | forzata a `MAGAZZINO` nel save |
| `fornitore` | string | si | `src/pages/IA/IADocumenti.tsx:39`, `src/pages/IA/IADocumenti.tsx:506` | |
| `numeroDocumento` | string | si | `src/pages/IA/IADocumenti.tsx:39`, `src/pages/IA/IADocumenti.tsx:506` | |
| `dataDocumento` | string | si | `src/pages/IA/IADocumenti.tsx:39`, `src/pages/IA/IADocumenti.tsx:506` | |
| `targa` | string | no | `src/pages/IA/IADocumenti.tsx:45`, `src/pages/IA/IADocumenti.tsx:506` | anche se qui spesso vuota |
| `marca` | string | no | `src/pages/IA/IADocumenti.tsx:46`, `src/pages/IA/IADocumenti.tsx:506` | |
| `modello` | string | no | `src/pages/IA/IADocumenti.tsx:47`, `src/pages/IA/IADocumenti.tsx:506` | |
| `telaio` | string | no | `src/pages/IA/IADocumenti.tsx:48`, `src/pages/IA/IADocumenti.tsx:506` | |
| `km` | string | no | `src/pages/IA/IADocumenti.tsx:49`, `src/pages/IA/IADocumenti.tsx:506` | |
| `riferimentoPreventivoNumero` | string | no | `src/pages/IA/IADocumenti.tsx:52`, `src/pages/IA/IADocumenti.tsx:506` | |
| `riferimentoPreventivoData` | string | no | `src/pages/IA/IADocumenti.tsx:53`, `src/pages/IA/IADocumenti.tsx:506` | |
| `imponibile` | string | no | `src/pages/IA/IADocumenti.tsx:56`, `src/pages/IA/IADocumenti.tsx:506` | |
| `ivaPercentuale` | string | no | `src/pages/IA/IADocumenti.tsx:57`, `src/pages/IA/IADocumenti.tsx:506` | |
| `ivaImporto` | string | no | `src/pages/IA/IADocumenti.tsx:58`, `src/pages/IA/IADocumenti.tsx:506` | |
| `totaleDocumento` | string | no | `src/pages/IA/IADocumenti.tsx:59`, `src/pages/IA/IADocumenti.tsx:506` | |
| `valuta` | string | no | `src/pages/IA/IADocumenti.tsx:60`, `src/pages/IA/IADocumenti.tsx:506` | sovrascritta da `resolveDocumentCurrency` |
| `currency` | string | no | `src/pages/IA/IADocumenti.tsx:61`, `src/pages/IA/IADocumenti.tsx:506` | resta nel payload se presente |
| `voci` | array | no | `src/pages/IA/IADocumenti.tsx:64`, `src/pages/IA/IADocumenti.tsx:506` | |
| `voci[].codice` | string | no | `src/pages/IA/IADocumenti.tsx:29` | |
| `voci[].descrizione` | string | no | `src/pages/IA/IADocumenti.tsx:30` | |
| `voci[].categoria` | string | no | `src/pages/IA/IADocumenti.tsx:31` | |
| `voci[].quantita` | string | no | `src/pages/IA/IADocumenti.tsx:32` | |
| `voci[].prezzoUnitario` | string | no | `src/pages/IA/IADocumenti.tsx:33` | |
| `voci[].scontoPercentuale` | string | no | `src/pages/IA/IADocumenti.tsx:34` | |
| `voci[].importo` | string | no | `src/pages/IA/IADocumenti.tsx:35` | |
| `iban` | string | no | `src/pages/IA/IADocumenti.tsx:67`, `src/pages/IA/IADocumenti.tsx:506` | |
| `beneficiario` | string | no | `src/pages/IA/IADocumenti.tsx:68`, `src/pages/IA/IADocumenti.tsx:506` | |
| `riferimentoPagamento` | string | no | `src/pages/IA/IADocumenti.tsx:69`, `src/pages/IA/IADocumenti.tsx:506` | |
| `banca` | string | no | `src/pages/IA/IADocumenti.tsx:70`, `src/pages/IA/IADocumenti.tsx:506` | |
| `importoPagamento` | string | no | `src/pages/IA/IADocumenti.tsx:71`, `src/pages/IA/IADocumenti.tsx:506` | |
| `testo` | string | no | `src/pages/IA/IADocumenti.tsx:74`, `src/pages/IA/IADocumenti.tsx:506` | |
| `fileUrl` | string | si | `src/pages/IA/IADocumenti.tsx:506` | upload Storage |
| `nomeFile` | string | si | `src/pages/IA/IADocumenti.tsx:506` | |
| `createdAt` | timestamp | si | `src/pages/IA/IADocumenti.tsx:506` | |
| `fonte` | string | si | `src/pages/IA/IADocumenti.tsx:506` | fisso `"IA"` |
| `daVerificare` | boolean | no | `src/pages/IA/IADocumenti.tsx:515` | solo se targa non combacia |
| `motivoVerifica` | string | no | `src/pages/IA/IADocumenti.tsx:515` | |
| `targaEstrattaIA` | string/null | no | `src/pages/IA/IADocumenti.tsx:515` | |

## Capitolo 2 — Famiglia 2 · Fattura manutenzione officina

### 2.1 madre legacy · `@manutenzioni`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/pages/Manutenzioni.tsx:345` | |
| `targa` | string | si | `src/pages/Manutenzioni.tsx:345` | |
| `tipo` | string | si | `src/pages/Manutenzioni.tsx:345` | |
| `fornitore` | string | no | `src/pages/Manutenzioni.tsx:345` | |
| `km` | number/null | no | `src/pages/Manutenzioni.tsx:345`, `src/pages/Manutenzioni.tsx:212` | normalizzato a `null` |
| `ore` | number/null | no | `src/pages/Manutenzioni.tsx:345`, `src/pages/Manutenzioni.tsx:212` | |
| `sottotipo` | string/null | no | `src/pages/Manutenzioni.tsx:345`, `src/pages/Manutenzioni.tsx:212` | |
| `descrizione` | string | si | `src/pages/Manutenzioni.tsx:345` | |
| `eseguito` | string/null | no | `src/pages/Manutenzioni.tsx:345`, `src/pages/Manutenzioni.tsx:212` | |
| `data` | string | si | `src/pages/Manutenzioni.tsx:345` | |
| `materiali` | array | no | `src/pages/Manutenzioni.tsx:345` | array vuoto o popolato |
| `materiali[].id` | string | si | `src/pages/Manutenzioni.tsx:15` | |
| `materiali[].label` | string | si | `src/pages/Manutenzioni.tsx:16` | |
| `materiali[].quantita` | number | si | `src/pages/Manutenzioni.tsx:17` | |
| `materiali[].unita` | string | si | `src/pages/Manutenzioni.tsx:18` | |
| `materiali[].fromInventario` | boolean | no | `src/pages/Manutenzioni.tsx:19` | |
| `materiali[].refId` | string | no | `src/pages/Manutenzioni.tsx:20` | |

### 2.2 NEXT · `@manutenzioni`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/next/domain/nextManutenzioniDomain.ts:739` | generato in `sanitizeBusinessRecord` |
| `targa` | string | si | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `tipo` | string | si | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `fornitore` | string | no | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `km` | number/null | no | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `ore` | number/null | no | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `sottotipo` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `descrizione` | string | si | `src/next/domain/nextManutenzioniDomain.ts:739` | fallback `"Manutenzione"` |
| `eseguito` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `data` | string | si | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `materiali` | array | no | `src/next/domain/nextManutenzioniDomain.ts:739` | |
| `materiali[].id` | string | si | `src/next/domain/nextManutenzioniDomain.ts:101` | stesso schema legacy materiali |
| `materiali[].label` | string | si | `src/next/domain/nextManutenzioniDomain.ts:102` | |
| `materiali[].quantita` | number | si | `src/next/domain/nextManutenzioniDomain.ts:103` | |
| `materiali[].unita` | string | si | `src/next/domain/nextManutenzioniDomain.ts:104` | |
| `materiali[].fromInventario` | boolean | no | `src/next/domain/nextManutenzioniDomain.ts:105` | |
| `materiali[].refId` | string | no | `src/next/domain/nextManutenzioniDomain.ts:106` | |
| `assiCoinvolti` | string[] | no | `src/next/domain/nextManutenzioniDomain.ts:739` | solo ramo gomme |
| `gommeInterventoTipo` | string | no | `src/next/domain/nextManutenzioniDomain.ts:739` | `ordinario` o `straordinario` |
| `gommePerAsse` | array | no | `src/next/domain/nextManutenzioniDomain.ts:739` | solo ramo ordinario |
| `gommePerAsse[].asseId` | string | si | `src/next/domain/nextManutenzioniDomain.ts:145` | |
| `gommePerAsse[].dataCambio` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:145` | |
| `gommePerAsse[].kmCambio` | number/null | no | `src/next/domain/nextManutenzioniDomain.ts:145` | |
| `gommeStraordinario` | object | no | `src/next/domain/nextManutenzioniDomain.ts:739` | solo ramo straordinario |
| `gommeStraordinario.asseId` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:153` | |
| `gommeStraordinario.quantita` | number/null | no | `src/next/domain/nextManutenzioniDomain.ts:153` | |
| `gommeStraordinario.motivo` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:153` | |
| `sourceDocumentId` | string/null | no | `src/next/domain/nextManutenzioniDomain.ts:739` | legame con documento IA |

### 2.3 altri archivi correlati
- `@documenti_mezzi` usa la stessa shape completa gia elencata in **1.3**, ma cambia la collection di destinazione in `src/pages/IA/IADocumenti.tsx:530`.
- `@costiMezzo`: nel perimetro letto non e emerso un writer additivo con shape completa; e emersa solo una riscrittura dopo cancellazione in `src/pages/DossierMezzo.tsx:741-748`. Shape additiva `DA VERIFICARE`.

## Capitolo 3 — Famiglia 3 · Preventivo

### 3.1 `@preventivi`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/pages/Acquisti.tsx:3685` | |
| `fornitoreId` | string | si | `src/pages/Acquisti.tsx:3685` | |
| `fornitoreNome` | string | si | `src/pages/Acquisti.tsx:3685` | |
| `numeroPreventivo` | string | si | `src/pages/Acquisti.tsx:3685` | |
| `dataPreventivo` | string | si | `src/pages/Acquisti.tsx:3685` | |
| `pdfUrl` | string/null | si | `src/pages/Acquisti.tsx:3685` | |
| `pdfStoragePath` | string/null | si | `src/pages/Acquisti.tsx:3685` | |
| `imageStoragePaths` | string[] | no | `src/pages/Acquisti.tsx:3685` | |
| `imageUrls` | string[] | no | `src/pages/Acquisti.tsx:3685` | |
| `righe` | array | si | `src/pages/Acquisti.tsx:3685` | |
| `righe[].id` | string | si | `src/pages/Acquisti.tsx:40` | tipo |
| `righe[].descrizione` | string | si | `src/pages/Acquisti.tsx:41` | |
| `righe[].unita` | string | si | `src/pages/Acquisti.tsx:42` | |
| `righe[].prezzoUnitario` | number | si | `src/pages/Acquisti.tsx:43` | |
| `righe[].note` | string | no | `src/pages/Acquisti.tsx:44` | |
| `createdAt` | number | si | `src/pages/Acquisti.tsx:3685` | |
| `updatedAt` | number | si | `src/pages/Acquisti.tsx:3685` | |

### 3.2 `@preventivi_approvazioni`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/pages/CapoCostiMezzo.tsx:638` | chiave composta |
| `targa` | string | si | `src/pages/CapoCostiMezzo.tsx:638` | |
| `status` | string | si | `src/pages/CapoCostiMezzo.tsx:638` | `pending/approved/rejected` |
| `updatedAt` | string | si | `src/pages/CapoCostiMezzo.tsx:638` | ISO string |

### 3.3 `@listino_prezzi`
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `fornitoreId` | string | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `fornitoreNome` | string | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `articoloCanonico` | string | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `codiceArticolo` | string | no | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `note` | string | no | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `unita` | string | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `valuta` | string | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `prezzoAttuale` | number | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `fonteAttuale` | object | si | `src/pages/Acquisti.tsx:65`, `src/pages/Acquisti.tsx:3927` | |
| `fonteAttuale.preventivoId` | string | si | `src/pages/Acquisti.tsx:74` | |
| `fonteAttuale.numeroPreventivo` | string | si | `src/pages/Acquisti.tsx:75` | |
| `fonteAttuale.dataPreventivo` | string | si | `src/pages/Acquisti.tsx:76` | |
| `fonteAttuale.note` | string | no | `src/pages/Acquisti.tsx:77` | |
| `fonteAttuale.pdfUrl` | string/null | si | `src/pages/Acquisti.tsx:78` | |
| `fonteAttuale.pdfStoragePath` | string/null | si | `src/pages/Acquisti.tsx:79` | |
| `fonteAttuale.imageStoragePaths` | string[] | no | `src/pages/Acquisti.tsx:80` | |
| `fonteAttuale.imageUrls` | string[] | no | `src/pages/Acquisti.tsx:81` | |
| `prezzoPrecedente` | number | no | `src/pages/Acquisti.tsx:82`, `src/pages/Acquisti.tsx:3927` | |
| `fontePrecedente` | object | no | `src/pages/Acquisti.tsx:83`, `src/pages/Acquisti.tsx:3927` | |
| `fontePrecedente.preventivoId` | string | si | `src/pages/Acquisti.tsx:84` | se oggetto presente |
| `fontePrecedente.numeroPreventivo` | string | si | `src/pages/Acquisti.tsx:85` | |
| `fontePrecedente.dataPreventivo` | string | si | `src/pages/Acquisti.tsx:86` | |
| `fontePrecedente.note` | string | no | `src/pages/Acquisti.tsx:87` | |
| `fontePrecedente.imageStoragePaths` | string[] | no | `src/pages/Acquisti.tsx:88` | |
| `fontePrecedente.imageUrls` | string[] | no | `src/pages/Acquisti.tsx:89` | |
| `trend` | string | si | `src/pages/Acquisti.tsx:90`, `src/pages/Acquisti.tsx:3927` | |
| `deltaAbs` | number | no | `src/pages/Acquisti.tsx:91`, `src/pages/Acquisti.tsx:3927` | |
| `deltaPct` | number | no | `src/pages/Acquisti.tsx:92`, `src/pages/Acquisti.tsx:3927` | |
| `updatedAt` | number | si | `src/pages/Acquisti.tsx:93`, `src/pages/Acquisti.tsx:3927` | |

## Capitolo 4 — Famiglia 4 · Documento mezzo (assicurazione, revisione, collaudo)
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `assicurazione` | string | si | `src/pages/Mezzi.tsx:721`, `src/pages/IA/IALibretto.tsx:398` | |
| `dataImmatricolazione` | string | si | `src/pages/Mezzi.tsx:722`, `src/pages/IA/IALibretto.tsx:400` | documento mezzo correlato |
| `dataScadenzaRevisione` | string | si | `src/pages/Mezzi.tsx:723`, `src/pages/Home.tsx:1310`, `src/pages/IA/IALibretto.tsx:404` | |
| `dataUltimoCollaudo` | string | si | `src/pages/Mezzi.tsx:724`, `src/pages/Home.tsx:1310`, `src/pages/IA/IALibretto.tsx:402` | |
| `librettoUrl` | string/null | no | `src/pages/IA/IALibretto.tsx:439` | scritto solo con preview disponibile |
| `librettoStoragePath` | string/null | no | `src/pages/IA/IALibretto.tsx:440` | |
| `prenotazioneCollaudo` | object/null | no | `src/pages/Home.tsx:1177`, `src/pages/Home.tsx:1312` | |
| `prenotazioneCollaudo.data` | string | si | `src/pages/Home.tsx:1188` | se oggetto presente |
| `prenotazioneCollaudo.ora` | string | no | `src/pages/Home.tsx:1188` | |
| `prenotazioneCollaudo.luogo` | string | no | `src/pages/Home.tsx:1188` | |
| `prenotazioneCollaudo.note` | string | no | `src/pages/Home.tsx:1188` | |
| `prenotazioneCollaudo.completata` | boolean | no | `src/pages/Home.tsx:1292` | aggiunto nel save revisione |
| `prenotazioneCollaudo.completataIl` | string | no | `src/pages/Home.tsx:1292` | |
| `prenotazioneCollaudo.esito` | string | no | `src/pages/Home.tsx:1292` | |
| `prenotazioneCollaudo.noteEsito` | string | no | `src/pages/Home.tsx:1292` | |
| `preCollaudo` | object | no | `src/pages/Home.tsx:1248` | |
| `preCollaudo.data` | string | si | `src/pages/Home.tsx:1248` | se oggetto presente |
| `preCollaudo.officina` | string | si | `src/pages/Home.tsx:1248` | |
| `dataScadenzaRevisioneTimestamp` | number/null | no | `src/next/nextAnagraficheFlottaDomain.ts:533` | presente nel modello NEXT, writer business NEXT non trovato |
| `dataUltimoCollaudoTimestamp` | number/null | no | `src/next/nextAnagraficheFlottaDomain.ts:535` | presente nel modello NEXT, writer business NEXT non trovato |

## Capitolo 5 — Famiglia 5 · Cisterna AdBlue
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `id` | string | si | `src/next/NextMagazzinoPage.tsx:1035` | |
| `data` | string | si | `src/next/NextMagazzinoPage.tsx:1035` | |
| `quantitaLitri` | number/null | si | `src/next/NextMagazzinoPage.tsx:1035` | sempre presente, anche `null` |
| `quantita` | number/null | si | `src/next/NextMagazzinoPage.tsx:1035` | duplicato di `quantitaLitri` |
| `litri` | number/null | si | `src/next/NextMagazzinoPage.tsx:1035` | duplicato di `quantitaLitri` |
| `inventarioRefId` | string/null | si | `src/next/NextMagazzinoPage.tsx:1035` | |
| `stockKey` | string/null | si | `src/next/NextMagazzinoPage.tsx:1035` | |
| `materialeLabel` | string | si | `src/next/NextMagazzinoPage.tsx:1035` | fisso `"AdBlue"` |
| `descrizione` | string | si | `src/next/NextMagazzinoPage.tsx:1035` | fisso `"AdBlue"` |
| `unita` | string | si | `src/next/NextMagazzinoPage.tsx:1035` | fisso `"lt"` |
| `numeroCisterna` | string/null | no | `src/next/NextMagazzinoPage.tsx:1035` | |
| `note` | string/null | no | `src/next/NextMagazzinoPage.tsx:1035` | |

## Capitolo 6 — Famiglia 6 · Euromecc
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `euromecc_relazioni.fileName` | string | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.fileType` | string | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.dataIntervento` | string | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.tecnici` | string[] | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.note` | string | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.statoImportazione` | string | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.doneCount` | number | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.pendingCount` | number | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.extraComponentsCount` | number | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3033`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.fileUrl` | string/null | no | `src/next/NextEuromeccPage.tsx:3042`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.fileStoragePath` | string/null | no | `src/next/NextEuromeccPage.tsx:3042`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.fileSize` | number/null | no | `src/next/NextEuromeccPage.tsx:3042`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.ordineId` | string/null | no | `src/next/NextEuromeccPage.tsx:3042` | solo ramo crea ordine ricambi |
| `euromecc_relazioni.ordineMateriali` | number/null | no | `src/next/NextEuromeccPage.tsx:3042` | solo ramo crea ordine ricambi |
| `euromecc_relazioni.createdAt` | timestamp | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3042`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_relazioni.updatedAt` | timestamp | si | `src/next/NextEuromeccPage.tsx:2980`, `src/next/NextEuromeccPage.tsx:3042`, `src/next/NextEuromeccPage.tsx:3181` | |
| `euromecc_extra_components.areaKey` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.subKey` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.name` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.code` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.addedFrom` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.addedAt` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.addedBy` | string | si | `src/next/NextEuromeccPage.tsx:3116` | |
| `euromecc_extra_components.createdAt` | timestamp | si | `src/next/NextEuromeccPage.tsx:3116` | |

## Capitolo 7 — Famiglia 7 · Carburante / rifornimenti
| Campo | Tipo | Obbligatorio | File:riga writer | Note |
|---|---|---|---|---|
| `@rifornimenti_autisti_tmp.id` | string | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.autistaId` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.autistaNome` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.badgeAutista` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.targaCamion` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.targaRimorchio` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.tipo` | string | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.metodoPagamento` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.paese` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.km` | number/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.litri` | number/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.importo` | number/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.note` | string/null | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.data` | number | si | `src/autisti/Rifornimento.tsx:157` | timestamp numerico |
| `@rifornimenti_autisti_tmp.flagVerifica` | boolean | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.confermatoAutista` | boolean | si | `src/autisti/Rifornimento.tsx:157` | |
| `@rifornimenti_autisti_tmp.timestamp` | number | no | `src/autistiInbox/AutistiAdmin.tsx:1866`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1876` | compare in modifica admin |
| `@rifornimenti_autisti_tmp.motivoVerifica` | string/null | no | `src/autistiInbox/AutistiAdmin.tsx:1889`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1899` | solo se presente/settato |
| `@rifornimenti.id` | string | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | proiezione dossier |
| `@rifornimenti.mezzoTarga` | string/null | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | |
| `@rifornimenti.data` | string | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | data formattata |
| `@rifornimenti.litri` | number/null | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | |
| `@rifornimenti.km` | number/null | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | |
| `@rifornimenti.distributore` | string | si | `src/autisti/Rifornimento.tsx:33`, `src/autisti/Rifornimento.tsx:44` | derivato da tipo/paese/metodo |
| `@rifornimenti.costo` | number/null | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | derivato da `importo` |
| `@rifornimenti.note` | string | si | `src/autisti/Rifornimento.tsx:44`, `src/autisti/Rifornimento.tsx:199` | |

## Capitolo 8 — Riepilogo trasversale
| Famiglia | Campi totali elencati | Obbligatori | Opzionali | Collezione/i | Stato |
|---|---:|---:|---:|---|---|
| 1. Fattura/DDT magazzino ricambi | 53 | 27 | 26 | `@ordini`, `@documenti_magazzino` | entrambi |
| 2. Fattura manutenzione officina | 28 | 14 | 14 | `@manutenzioni`, `@documenti_mezzi`, `@costiMezzo` | entrambi, ma `@costiMezzo` disallineato |
| 3. Preventivo | 51 | 34 | 17 | `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi` | madre |
| 4. Documento mezzo | 20 | 8 | 12 | `@mezzi_aziendali` | madre + modello NEXT |
| 5. Cisterna AdBlue | 12 | 10 | 2 | `@cisterne_adblue` | solo NEXT |
| 6. Euromecc | 24 | 21 | 3 | `euromecc_relazioni`, `euromecc_extra_components` | solo NEXT |
| 7. Carburante / rifornimenti | 26 | 24 | 2 | `@rifornimenti_autisti_tmp`, `@rifornimenti` | entrambi |

## Capitolo 9 — Anomalie trovate
- `src/types/ordini.ts:14-25` dichiara `Ordine` due volte; la seconda aggiunge `arrivato`.
- `src/pages/Acquisti.tsx:2735` e `src/pages/Acquisti.tsx:5357` dichiarano due funzioni `persistListino` con la stessa responsabilita.
- `@costiMezzo`: nel perimetro letto non e emerso un writer additivo completo; e emersa solo la cancellazione con riscrittura filtro in `src/pages/DossierMezzo.tsx:741-748`.
- `@rifornimenti_autisti_tmp` e `@rifornimenti` non hanno la stessa shape: il secondo e una proiezione ridotta costruita da `buildDossierItem` in `src/autisti/Rifornimento.tsx:44` e replicata anche nei writer admin.
- `@cisterne_adblue` salva tre campi sinonimi per la quantita (`quantitaLitri`, `quantita`, `litri`) nello stesso writer `src/next/NextMagazzinoPage.tsx:1035`.
