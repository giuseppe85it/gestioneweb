# REPORT GOMME MARCATORE 2026-06-07

MODE = OPERAIO - D1 GOMME, STEP 1 - solo report e diagnosi.

## Esito

REPORT COMPLETATO.

Scritture eseguite:
- Firestore: nessuna.
- Codice runtime: nessuna.
- Documentazione: solo questo file.

## Perimetro e metodo

Lettura Firestore sola lettura con service account indicato dal prompt:
- collection/documento: `storage/@manutenzioni`
- query: lettura diretta `collection("storage").doc("@manutenzioni").get()`
- shape trovata: `value[]`
- record totali letti: 84

Ricerca testuale sui record senza marcatore:
- `CAMBIO GOMME`
- `gomma` / `gomme`
- `pneumatic*`
- match case insensitive

Regola usata per "marcatore strutturato raw":
- `gommeInterventoTipo` valorizzato con `ordinario` o `straordinario`
- oppure `assiCoinvolti[]` non vuoto con valori validi
- oppure `gommePerAsse[]` non vuoto con `asseId` valido
- oppure `gommeStraordinario` con almeno uno tra `asseId`, `quantita`, `motivo`

## Marcatore strutturato nel codice

Fonti verificate:
- `src/next/domain/nextManutenzioniDomain.ts:198-220`
- `src/next/domain/nextManutenzioniDomain.ts:294-337`
- `src/next/domain/nextManutenzioniDomain.ts:340-372`
- `src/next/domain/nextManutenzioniDomain.ts:1037-1123`
- `src/next/domain/nextManutenzioniGommeDomain.ts:52-57`
- `src/next/domain/nextManutenzioniGommeDomain.ts:668-768`
- `src/next/domain/nextManutenzioniGommeDomain.ts:813-818`
- `src/next/domain/nextManutenzioniGommeDomain.ts:1030-1105`

Campi ammessi:
- `gommeInterventoTipo`: `ordinario | straordinario`
- `assiCoinvolti`: array di `anteriore | posteriore | asse1 | asse2 | asse3`
- `gommePerAsse`: array di `{ asseId, dataCambio, kmCambio }`
- `gommeStraordinario`: `{ asseId, quantita, motivo }`

Nota strutturale:
- il reader `nextManutenzioniDomain` puo derivare `gommeInterventoTipo = straordinario` da descrizione con `GOMME` / `PNEUM` anche se il record raw non contiene marker;
- il reader `nextManutenzioniGommeDomain` puo parsare blocchi testuali `CAMBIO GOMME` e produrre eventi derivati;
- questo non equivale a marker raw persistito. I record sotto restano invisibili alle regole che richiedono campi strutturati raw.

## Riepilogo numerico

- Record `@manutenzioni` totali: 84
- Con marcatore strutturato raw: 6
- Senza marcatore raw ma con testo gomme/pneumatici: 10
- Senza marcatore raw, cambio gomme certo: 9
- Dubbi / falsi positivi testuali: 1
- Record certi con proposta completa: 7
- Record certi parziali: 2
- Buco di scrittura attivo: SI

Punto da tappare indicato, senza fix:
- `src/components/AutistiEventoModal.tsx:294-315` + `src/components/AutistiEventoModal.tsx:339-374`
- `src/pages/Manutenzioni.tsx:301-317` + `src/pages/Manutenzioni.tsx:345-357` + `src/pages/Manutenzioni.tsx:212-224`
- percorsi da-fare NEXT: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:106-139` e `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:230-380`

## Record con marcatore strutturato raw

| Targa | Data | Stato | ID | Marker raw | Nota |
| --- | --- | --- | --- | --- | --- |
| TI287110 | 2026-05-19 | eseguita | `1780477077931` | `gommeInterventoTipo=straordinario`, `gommeStraordinario={asse1, 1, foratura / danno}` | Descrizione: `RIPARAZIONE STRAORDINARIA`; marker presente ma testo non contiene gomme. |
| TI280132 | 2026-05-20 | eseguita | `from-lavoro-daade4a2-c681-46d0-99d4-1906d151116d` | `ordinario`, `assiCoinvolti=[asse1]`, `gommePerAsse[asse1]` | Descrizione `Controllo KO: 2 GOMME...`; km marker nullo. |
| TI298409 | 2026-05-12 | eseguita | `1778587360877` | `ordinario`, `assiCoinvolti=[posteriore]`, `gommePerAsse[posteriore, km 383482]` | Marker coerente con testo `CAMBIO GOMME`. |
| TI233827 | 2025-03-29 | legacy/storico | `1777474590389` | solo `gommeInterventoTipo=straordinario` | DUBBIO: testo parla di controllo geometria per usura pneumatici, non di cambio gomme. Possibile marker improprio da derivazione testo. |
| TI298409 | 2026-03-09 | legacy/storico | `1777067242736` | `ordinario`, `assiCoinvolti=[anteriore]`, `gommePerAsse[anteriore, km 371620]` | Il testo dice `CAMBIO GOMME - straordinario`, ma raw e' `ordinario`. Da non correggere in questa sessione. |
| TI324623 | 2026-03-24 | legacy/storico | `1776958902385` | `straordinario`, `gommeStraordinario={anteriore, 2, intervento non pianificato}` | Testo `CAMBIO GOMME` con asse/marca/km. Marker presente. |

## Tabella approvabile dei record da riparare

I campi proposti sono additivi. Nessun valore e' stato scritto.

| Targa | Data | Descrizione integrale | Famiglia reader attuale | Campi additivi proposti |
| --- | --- | --- | --- | --- |
| TI239045 (`1774962027367`) | 2026-03-31 | `CAMBIO GOMME`<br>`asse: Posteriore`<br>`marca: N/D`<br>`km mezzo: 543423`<br>`intervento: sostituzione` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["posteriore"]`<br>`gommePerAsse: [{ asseId: "posteriore", dataCambio: "2026-03-31", kmCambio: 543423 }]` |
| TI81027 (`1774962042583`) | 2026-03-24 | `CAMBIO GOMME`<br>`asse: 1 asse`<br>`marca: Kumho`<br>`km mezzo: 262836`<br>`intervento: sostituzione` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["asse1"]`<br>`gommePerAsse: [{ asseId: "asse1", dataCambio: "2026-03-24", kmCambio: 262836 }]` |
| TI84069 (`1774363044856`) | 2026-03-24 | `CAMBIO GOMME`<br>`asse: 3 asse`<br>`marca: N/D`<br>`km mezzo: 542114`<br>`intervento: sostituzione` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["asse3"]`<br>`gommePerAsse: [{ asseId: "asse3", dataCambio: "2026-03-24", kmCambio: 542114 }]` |
| TI285195 (`1773066080204`) | 2026-03-09 | `CAMBIO GOMME - ordinario`<br>`Categoria mezzo: semirimorchio asse sterzante`<br>`Asse: 3 asse`<br>`Gomme cambiate: 2`<br>`Marca: kumo`<br>`Km mezzo: 294278` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["asse3"]`<br>`gommePerAsse: [{ asseId: "asse3", dataCambio: "2026-03-09", kmCambio: 294278 }]` |
| TI239279 (`1772531987235`) | 2026-02-27 | `CAMBIO GOMME`<br>`asse: Posteriore`<br>`marca: Kumho`<br>`km mezzo: 266121`<br>`intervento: sostituzione` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["posteriore"]`<br>`gommePerAsse: [{ asseId: "posteriore", dataCambio: "2026-02-27", kmCambio: 266121 }]` |
| TI84069 (`1768996701410`) | 2026-01-21 | `CAMBIO GOMME - ordinario`<br>`Categoria mezzo: semirimorchio asse fisso`<br>`Asse: 1 asse`<br>`Gomme cambiate: 2`<br>`Marca: FULDA REGGETON`<br>`Km mezzo: 535458` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["asse1"]`<br>`gommePerAsse: [{ asseId: "asse1", dataCambio: "2026-01-21", kmCambio: 535458 }]` |
| TI285195 (`1777979571388`) | 2026-05-05 | `CAMBIO GOMME`<br>`asse: 1 asse`<br>`marca: N/D`<br>`km mezzo: 300369`<br>`intervento: sostituzione` | `straordinario_derivato_da_testo`; evento gomme derivabile da blocco testo | `gommeInterventoTipo: "ordinario"`<br>`assiCoinvolti: ["asse1"]`<br>`gommePerAsse: [{ asseId: "asse1", dataCambio: "2026-05-05", kmCambio: 300369 }]` |

## Parziali da decidere prima della riparazione

### TI178456 (`1772635641628`) - 2026-03-04

Descrizione integrale:

```text
CAMBIO GOMME - straordinario
Categoria mezzo: motrice 3 assi
1 ASSE INTERNO SX
Gomme cambiate: 1
Marca: SAVA
Km mezzo: 666599
```

Campi deducibili:
- `gommeInterventoTipo: "straordinario"`
- `gommeStraordinario.asseId: "asse1"`
- `gommeStraordinario.quantita: 1`

Campo non deducibile:
- `gommeStraordinario.motivo`

Domanda secca:
- a) approvare riparazione parziale con `motivo` non proposto;
- b) non riparare finche non viene indicato il motivo.

### TI84822 (`1768493626667`) - 2026-01-15

Descrizione integrale:

```text
CAMBIO GOMME - ordinario
Categoria mezzo: semirimorchio asse sterzante
Asse: 1 asse
Gomme cambiate: 2
Marca: KUMMO
Km mezzo: 290665

CAMBIO GOMME - ordinario
Categoria mezzo: semirimorchio asse sterzante
Asse: 3 asse
Gomme cambiate: 2
Marca: KUMMO
Km mezzo: 290665

CAMBIO GOMME - GIRATA EST INTERNO PER USURA
Categoria mezzo: semirimorchio asse sterzante
Asse: 2 asse
Gomme cambiate: 1
Km mezzo: 290665
```

Campi deducibili senza dubbio:
- `gommeInterventoTipo: "ordinario"`
- `assiCoinvolti` almeno `["asse1", "asse3"]`
- `gommePerAsse` per `asse1` e `asse3`, con `dataCambio: "2026-01-15"` e `kmCambio: 290665`

Campo da decidere:
- il terzo blocco dice `GIRATA EST INTERNO PER USURA`, non `ordinario` o `straordinario`; il modello raw non ha un campo dedicato per rotazione/girata.

Domanda secca:
- a) includere anche `asse2` in `assiCoinvolti/gommePerAsse` come intervento gomme ordinario del record;
- b) riparare solo `asse1` e `asse3`, lasciando fuori la girata.

## Dubbi / falsi positivi testuali

### TI85688 (`1780304893610`) - 2026-06-01

Descrizione integrale:

```text
RIPARAZIONE PROVVISIORIA TUBO GOMMA SCARICO CISTERNA PER FORO
```

Valutazione:
- contiene `gomma`, ma indica un tubo in gomma della cisterna, non pneumatici;
- nessun campo gomme proposto;
- reader manutenzioni attuale puo comunque classificarlo come testo gomme solo se la ricerca include il singolare `gomma`; il codice `isCambioGommeDerived` usa `GOMME` / `PNEUM`, quindi questo record oggi non ha marker raw.

Domanda secca:
- a) escludere definitivamente dalla riparazione gomme;
- b) trattarlo come record gomme solo con conferma esplicita del proprietario.

## Diagnosi entrypoint di scrittura

### 1. NEXT `/next/manutenzioni` - form principale

File:
- `src/next/NextManutenzioniPage.tsx:2537-2545`
- `src/next/NextManutenzioniPage.tsx:2553-2582`
- `src/next/domain/nextManutenzioniDomain.ts:1037-1123`
- `src/next/domain/nextManutenzioniDomain.ts:1282-1336`

Esito:
- scrive marker gomme se l'utente usa i sottotipi UI gomme;
- ordinario: passa `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo="ordinario"`;
- straordinario: passa `gommeInterventoTipo="straordinario"` e `gommeStraordinario`;
- se la descrizione libera contiene `GOMME` / `PNEUM` ma non passa sottotipo gomme, il domain puo scrivere solo `gommeInterventoTipo="straordinario"` derivato dal testo. Questo genera marker debole e puo creare falsi positivi come `TI233827`.

Verdetto:
- percorso parzialmente coperto;
- da irrigidire: non derivare marker raw completo da semplice parola `GOMME` / `PNEUM` senza dati strutturati o decisione UI.

### 2. NEXT `/next/manutenzioni` - crea lavoro da gruppo

File:
- `src/next/NextManutenzioniPage.tsx:3500-3518`

Esito:
- scrive esplicitamente `assiCoinvolti: []`, `gommePerAsse: []`, `gommeInterventoTipo: null`, `gommeStraordinario: null`;
- se la descrizione del gruppo contiene gomme, il record nasce senza marker strutturato.

Verdetto:
- buco attivo per lavori da gruppo con descrizione gomme.

### 3. NEXT da evento/segnalazione/controllo - writer da-fare

File:
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:106-139`
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:230-380`
- uso da Centro Controllo: `src/next/NextCentroControlloParityPage.tsx:2403-2409`
- uso da Autisti Inbox NEXT: `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx:213-224`

Esito:
- `buildManutenzioneDaFareRecord` non scrive alcun campo gomme strutturato;
- da segnalazione/controllo costruisce descrizioni come `Segnalazione: ...` o `Controllo KO: ...`;
- se il KO e gomme, il record nasce testuale e non strutturato.

Verdetto:
- buco attivo.
- punto da tappare: `buildManutenzioneDaFareRecord` o i caller `createManutenzioneDaFareFromSegnalazione/Controllo/Evento`, con mapping esplicito solo quando la sorgente espone dati gomme strutturali.

### 4. NEXT Importa documenti / Archivista Manutenzione

File:
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:1120-1138`

Esito:
- passa a `saveNextManutenzioneBusinessRecord` solo targa/tipo/sottotipo/fornitore/km/descrizione/eseguito/data/materiali/documento/importo;
- non passa `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`;
- se un documento descrive gomme, il salvataggio non produce marker completo; il domain puo derivare solo marker debole da testo.

Verdetto:
- buco attivo se l'import documentale crea manutenzioni gomme.

### 5. Madre legacy `/manutenzioni`

File:
- route: `src/App.tsx:662`
- `src/pages/Manutenzioni.tsx:301-317`
- `src/pages/Manutenzioni.tsx:345-357`
- `src/pages/Manutenzioni.tsx:212-224`

Esito:
- la modale gomme legacy aggiunge solo un blocco testuale alla descrizione;
- il record salvato contiene `id`, `targa`, `tipo`, `fornitore`, `km`, `ore`, `sottotipo`, `descrizione`, `eseguito`, `data`, `materiali`;
- non scrive marker gomme.

Verdetto:
- buco attivo nella madre legacy.
- compatibile con molti record storici senza marker.

### 6. Madre legacy `AutistiEventoModal` - import evento gomme

File:
- usi legacy: `src/pages/Home.tsx`, `src/pages/Autista360.tsx`, `src/pages/Mezzo360.tsx`, `src/autistiInbox/AutistiInboxHome.tsx`
- `src/components/AutistiEventoModal.tsx:280-315`
- `src/components/AutistiEventoModal.tsx:339-374`

Esito:
- importa in `@gomme_eventi`;
- poi crea anche una voce `@manutenzioni`;
- la voce manutenzione contiene solo `id`, `targa`, `tipo`, `descrizione`, `data`, `km`, `materiali`;
- non scrive `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`.

Verdetto:
- buco attivo.
- e' il percorso piu coerente con i record `CAMBIO GOMME` ben formattati ma senza marker.

## Verdetto sul buco

I record senza marker non sono solo vecchi/legacy in senso storico:
- la maggior parte e tra 2026-01-15 e 2026-03-31;
- esiste un record certo senza marker del 2026-05-05 (`TI285195`, `1777979571388`);
- il codice legacy che genera blocchi `CAMBIO GOMME` senza marker e' ancora presente;
- il writer NEXT da-fare puo ancora creare record gomme testuali senza marker;
- l'Archivista Manutenzione non passa campi gomme strutturati.

Conclusione:
- buco attivo: SI.
- punto principale da tappare: import evento gomme legacy e/o sostituzione del percorso con writer NEXT strutturato.
- punto NEXT da tappare: `nextManutenzioneDaFareCreateWriter` per sorgenti gomme/KO gomme e `ArchivistaManutenzioneBridge` se l'estrazione espone pneumatici.
- punto domain da rivedere: `isCambioGommeDerived` non deve promuovere semplici testi `GOMME/PNEUM` a marker raw sufficiente senza campi strutturali.

## Esplorazione Firestore richiesta dalla regola zero-invenzioni

Cosa cercavo:
- record `@manutenzioni` con o senza campi gomme strutturati;
- record senza marker raw ma con testo `CAMBIO GOMME`, `gomma/gomme`, `pneumatic*`;
- date e campi utili per capire se il buco e' storico o ancora possibile.

Dove ho cercato:
- `storage/@manutenzioni`, lettura diretta del documento, shape `value[]`.

Cosa ho trovato:
- 84 record totali;
- 6 record con marker raw;
- 10 record senza marker raw ma con testo gomme/pneumatici;
- 9 record certi da riparare o decidere;
- 1 falso positivo testuale.

Cosa non ho trovato:
- nei 9 record certi senza marker non ho trovato `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse` o `gommeStraordinario` raw;
- non ho trovato valori strutturali da inventare per il motivo dello straordinario `TI178456`;
- non ho trovato un campo raw dedicato a rotazione/girata gomme nel modello manutenzione.

Collection adiacenti:
- il codice indica `@gomme_eventi` e `@cambi_gomme_autisti_tmp` come fonti correlate, ma questa sessione richiedeva il censimento su `storage/@manutenzioni`; non ho esteso il report a una riconciliazione completa cross-collection.

Conclusione operativa:
- asserzione confermata: i record elencati sono realmente senza marker strutturato raw in `storage/@manutenzioni`.
