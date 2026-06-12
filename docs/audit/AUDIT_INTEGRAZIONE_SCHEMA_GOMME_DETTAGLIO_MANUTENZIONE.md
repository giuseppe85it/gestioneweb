# AUDIT - Integrazione schema gomme nel Dettaglio manutenzione

Data audit: 2026-06-10

Modalita: AUDIT ONLY. Nessuna modifica runtime, nessuna modifica asset, nessuna build richiesta.

## 1. File reali letti

Documentazione letta:

- `AGENTS.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/copia questi nel progetto in chat/STATO_ATTUALE_PROGETTO.md`
- `docs/copia questi nel progetto in chat/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/audit/AUDIT_SCHEMA_IMPORT_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`
- `docs/audit/AUDIT_SOLUZIONE_GOMME_DINAMICHE_UI_2026-06-08.md`
- `docs/plan/PIANO_FLUSSI_UI_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`

Nota path equivalenti: nel repo reale non esistono `docs/STATO_ATTUALE_PROGETTO.md` e `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`; gli equivalenti effettivi letti sono `docs/copia questi nel progetto in chat/STATO_ATTUALE_PROGETTO.md` e `docs/copia questi nel progetto in chat/PROTOCOLLO_SICUREZZA_MODIFICHE.md`.

Codice letto:

- `src/App.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextTyreVehicleViewDemoPage.tsx`
- `src/next/components/TyreVehicleView.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/helpers/useSorgenteManutenzione.ts`
- `src/next/next-mappa-storico.css`
- `src/components/TruckGommeSvg.tsx`
- `src/components/wheels.ts`
- `src/next/autisti/NextModalGomme.tsx`

Asset considerati:

- `docs/mockups/schema delle gomme_neutra.png` - 1450x1085
- `docs/mockups/schema_gomme_mask_anteriore_dx.png` - 1450x1085
- `docs/mockups/schema_gomme_mask_posteriore_dx_esterna.png` - 1450x1085
- `docs/mockups/schema_gomme_mask_posteriore_dx_interna.png` - 1450x1085
- `public/gomme/trattore_cisternaDX.png` - 1536x1024

## 2. Flusso reale attuale del Dettaglio

La route reale di Manutenzioni NEXT e `/next/manutenzioni`, montata in `src/App.tsx:258-262` con `NextManutenzioniPage`.

Dentro `NextManutenzioniPage`, il tab visibile "Dettaglio" corrisponde al view interno `mappa`:

- lista tab: `src/next/NextManutenzioniPage.tsx:5627-5650`
- tab "Dettaglio": `src/next/NextManutenzioniPage.tsx:5632`
- render del ramo dettaglio: `src/next/NextManutenzioniPage.tsx:5657-5664`

Il record selezionato viene mantenuto nel parent:

- stato `selectedDetailRecordId`: `src/next/NextManutenzioniPage.tsx:1233`
- record selezionato da `storico`: `src/next/NextManutenzioniPage.tsx:1539-1541`
- apertura dettaglio da record: `src/next/NextManutenzioniPage.tsx:2082-2088`
- passaggio a `NextMappaStoricoPage`: `src/next/NextManutenzioniPage.tsx:5660-5664`

`NextMappaStoricoPage` e quindi il componente reale che visualizza oggi il tab Dettaglio embedded:

- prop `selectedMaintenance`: `src/next/NextMappaStoricoPage.tsx:47-66`
- ricostruzione record completo da `storicoManutenzioni`: `src/next/NextMappaStoricoPage.tsx:482-486`
- record effettivamente usato nel dettaglio: `selectedRecord = selectedLegacyRecord ?? selectedMaintenance` in `src/next/NextMappaStoricoPage.tsx:486`

## 3. Quale componente visualizza oggi lo schema/immagine del mezzo

Nel Dettaglio reale embedded di `NextMappaStoricoPage` oggi non risulta montato uno schema gomme visuale o una immagine del mezzo.

Il ramo attuale mostra una sezione testuale `Dettagli intervento gomme` solo quando `showTyreSection` e true:

- calcolo `showTyreSection`: `src/next/NextMappaStoricoPage.tsx:557-564`
- render sezione gomme: `src/next/NextMappaStoricoPage.tsx:1137-1178`
- CSS box attuale: `src/next/next-mappa-storico.css:4509-4563`

Componenti/asset visuali esistenti ma non montati nel Dettaglio reale:

- `NextTyreVehicleViewDemoPage` usa `docs/mockups/schema delle gomme_neutra.png` e tre mask PNG in demo isolata `/next/dev/gomme-demo` (`src/next/NextTyreVehicleViewDemoPage.tsx:20-63`, `103-166`).
- `TyreVehicleView` e un componente generico con base immagine + mask/circle (`src/next/components/TyreVehicleView.tsx:29-39`, `87-178`), ma non risulta integrato in `NextMappaStoricoPage`.
- `TruckGommeSvg` e usato dalla UI App Autisti/NEXT modal gomme (`src/next/autisti/NextModalGomme.tsx:421-433`), non dal Dettaglio manutenzione.
- `resolveNextManutenzioneTechnicalView` produce background `/gomme/*` e punti ruota (`src/next/domain/nextManutenzioniGommeDomain.ts:485-505`), ma nel ramo embedded attuale non e' montato come schema dettaglio.

Verdetto: il punto di integrazione reale non e "sostituire una immagine gia montata" nel codice runtime corrente; e' aggiungere lo schema nel blocco gomme gia esistente di `NextMappaStoricoPage`.

## 4. Record manutenzione: campi disponibili

Il record ufficiale arriva come `NextManutenzioniLegacyDatasetRecord`.

Campi generici disponibili nel record:

- `id`, `targa`, `km`, `ore`, `sottotipo`, `descrizione`, `data`, `dataEsecuzione`, `tipo`, `stato`: `src/next/domain/nextManutenzioniDomain.ts:147-159`
- origine/autore/stato operativo: `origineTipo`, `origineRefId`, `origineRefKey`, `origineRefs`, `segnalatoDa`, `eseguitoDa`, `urgenza`, `chiusuraDi`, `chiusuraRefId`, `chiusuraData`: `src/next/domain/nextManutenzioniDomain.ts:160-169`
- fornitore/materiali/importo/documento: `src/next/domain/nextManutenzioniDomain.ts:171-180`

Campi gomme disponibili:

- `assiCoinvolti?: string[]`: `src/next/domain/nextManutenzioniDomain.ts:173`
- `gommePerAsse?: NextManutenzioneGommePerAsseRecord[]`: `src/next/domain/nextManutenzioniDomain.ts:174`
- `gommeInterventoTipo?: "ordinario" | "straordinario"`: `src/next/domain/nextManutenzioniDomain.ts:175`, tipo in `src/next/domain/nextManutenzioniDomain.ts:206`
- `gommeStraordinario?: { asseId, quantita, motivo }`: `src/next/domain/nextManutenzioniDomain.ts:176`, shape in `src/next/domain/nextManutenzioniDomain.ts:208-212`

Assi ammessi:

- `"anteriore" | "posteriore" | "asse1" | "asse2" | "asse3"`: `src/next/domain/nextManutenzioniDomain.ts:198`
- stesso vocabolario nel dominio gomme: `src/next/domain/nextManutenzioniGommeDomain.ts:52-57`

Il dettaglio puo anche leggere sorgenti collegate tramite `useSorgentiManutenzione`, ma quel hook legge solo segnalazioni/controlli:

- key sorgenti: `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`: `src/next/helpers/useSorgenteManutenzione.ts:19-20`
- lettura tramite `origineRef*`: `src/next/helpers/useSorgenteManutenzione.ts:65-94`

Questo non fornisce oggi una posizione gomma normalizzata per accendere una singola maschera.

## 5. Dati gomme oggi disponibili

### 5.1 Come viene riconosciuta una manutenzione gomme

Nel Dettaglio:

- `selectedAxesNormalized = normalizeNextAssiCoinvolti(selectedRecord?.assiCoinvolti ?? [])`: `src/next/NextMappaStoricoPage.tsx:524-526`
- `showTyreSection` richiede record gomme e almeno assi, `gommePerAsse` o `gommeInterventoTipo`: `src/next/NextMappaStoricoPage.tsx:557-564`

Nel dominio:

- `sanitizeGommeInterventoTipo` accetta solo `"ordinario"` o `"straordinario"`: `src/next/domain/nextManutenzioniDomain.ts:331-337`
- `resolveGommeInterventoTipo` deriva il tipo da esplicito, `gommeStraordinario`, `gommePerAsse`, `assiCoinvolti` o testo cambio gomme: `src/next/domain/nextManutenzioniDomain.ts:360-372`

### 5.2 Cambio gomme ordinario

Form/creazione:

- `buildGommePerAssePayload` costruisce entry `{ asseId, dataCambio, kmCambio }`: `src/next/NextManutenzioniPage.tsx:1025-1039`
- UI ordinaria seleziona assi, non singole gomme: `src/next/NextManutenzioniPage.tsx:4504-4568`
- salvataggio passa `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo="ordinario"`: `src/next/NextManutenzioniPage.tsx:2562-2568`
- writer/sanitizer genera `gommePerAsse` da assi se mancano entry dettagliate: `src/next/domain/nextManutenzioniDomain.ts:1054-1063`
- persist finale: `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`: `src/next/domain/nextManutenzioniDomain.ts:1118-1121`

Display:

- mostra assi coinvolti, tipo intervento, data cambio e km cambio per entry: `src/next/NextMappaStoricoPage.tsx:1147-1175`

### 5.3 Cambio gomme straordinario

Form/creazione:

- `buildGommeStraordinarioPayload` costruisce `{ asseId, quantita, motivo }`: `src/next/NextManutenzioniPage.tsx:1041-1058`
- UI straordinaria chiede motivo, asse facoltativo, numero gomme facoltativo: `src/next/NextManutenzioniPage.tsx:4579-4636`
- salvataggio passa `gommeInterventoTipo="straordinario"` e `gommeStraordinario`: `src/next/NextManutenzioniPage.tsx:2564-2569`
- writer/sanitizer persiste `gommeStraordinario` solo se tipo risolto straordinario: `src/next/domain/nextManutenzioniDomain.ts:1118-1119`

Display:

- badge `STRAORDINARIO` se `selectedRecord.gommeStraordinario` esiste: `src/next/NextMappaStoricoPage.tsx:1141-1145`
- il box attuale non rende in modo dedicato `gommeStraordinario.motivo`, `gommeStraordinario.quantita` e `gommeStraordinario.asseId`; questi dati esistono ma vanno esposti meglio.

### 5.4 Dominio Dossier/read model gomme

`nextManutenzioniGommeDomain` usa gli stessi dati per derivare item leggibili:

- ordinario: `deriveGommePerAsseFromMaintenance` usa prima `gommePerAsse`, poi parsing testo, poi `assiCoinvolti`: `src/next/domain/nextManutenzioniGommeDomain.ts:821-855`
- straordinario: `buildNextGommeStraordinarieEvents` usa `gommeStraordinario.asseId`, `quantita`, `descrizione`, `fornitore`: `src/next/domain/nextManutenzioniGommeDomain.ts:902-929`
- item Dossier per straordinario: `src/next/domain/nextManutenzioniGommeDomain.ts:1029-1072`
- item Dossier per ordinario: `src/next/domain/nextManutenzioniGommeDomain.ts:1075-1120`

Anche qui la posizione resta principalmente asse/label, non pneumatico singolo.

## 6. Cosa si puo gia mappare con certezza

Si puo mappare con certezza:

1. Record gomme si/no:
   - da `tipo === "gomme"`, `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`.

2. Tipo intervento:
   - `gommeInterventoTipo="ordinario"` o `"straordinario"`.

3. Asse coinvolto:
   - ordinario: `assiCoinvolti[]` e/o `gommePerAsse[].asseId`.
   - straordinario: `gommeStraordinario.asseId`, se presente.

4. Data/km:
   - ordinario: `gommePerAsse[].dataCambio`, `gommePerAsse[].kmCambio`, fallback `data`/`km`.
   - straordinario: `data`, `km` record, se presenti.

5. Motivo/quantita straordinario:
   - `gommeStraordinario.motivo`
   - `gommeStraordinario.quantita`

6. Origine generica:
   - `origineTipo`, `origineRefId`, `origineRefKey`, `origineRefs`
   - `chiusuraDi`, `chiusuraRefId`, `chiusuraData`
   - `segnalatoDa`

7. Categoria mezzo per scegliere asset o vista:
   - `mezzoInfo.categoria` passato da `NextManutenzioniPage` a `NextMappaStoricoPage`: `src/next/NextManutenzioniPage.tsx:5667-5672`
   - `nextManutenzioniGommeDomain` sa che categoria `trattore` ha asse `anteriore` con 2 gomme e `posteriore` con 4 gomme: `src/next/domain/nextManutenzioniGommeDomain.ts:330-336`

## 7. Cosa NON si puo mappare oggi

NON DISTINGUIBILE OGGI dai campi ufficiali di `@manutenzioni`:

1. `anteriore DX`
   - il dato ufficiale dice al massimo `asseId="anteriore"`.
   - non esiste campo strutturato `lato`, `dx/sx`, `posizioneGomma` o `tyreId` nel record manutenzione.

2. `posteriore DX esterna`
   - il dato ufficiale dice al massimo `asseId="posteriore"`.
   - non esiste campo strutturato che separi gemellata esterna/interna.

3. `posteriore DX interna`
   - stesso limite: `posteriore` indica l'asse, non la singola gomma.

4. Marca come campo marker ufficiale:
   - `marca` esiste negli eventi esterni/read model, ma non nel marker `@manutenzioni` letto dal Dettaglio ufficiale.
   - puo stare in descrizione o in origine evento, ma non va inventato un campo runtime senza decisione.

5. Vista SX/DX completa:
   - le mask disponibili in `docs/mockups` coprono la vista DX dello schema validato: anteriore DX, posteriore DX esterna, posteriore DX interna.
   - non ci sono in questo set asset/mask equivalenti per il lato SX.

Conclusione operativa: oggi e' possibile integrare lo schema come visualizzazione del record gomme e accendere in modo certo un asse o mostrare un dato parziale; non e' possibile accendere con verita dati una singola gomma DX interna/esterna senza un dato posizione additivo o una regola prodotto esplicita.

## 8. Rischio se si integra subito

Rischio principale: visualizzare come "gomma sostituita" una posizione che il dato non certifica.

Esempi concreti:

- Se `gommePerAsse[].asseId="posteriore"`, colorare solo `posterioreDxEsternaBattistrada` inventerebbe che e' stata cambiata la gomma esterna DX.
- Se `gommeStraordinario={ asseId:"posteriore", quantita:1, motivo:"foratura" }`, il dato dice una gomma sul posteriore, ma non dice interna/esterna e non dice DX/SX.
- Se `assiCoinvolti=["anteriore"]`, il dato puo significare asse anteriore, non per forza anteriore DX.

Rischi secondari:

- usare gli asset `docs/mockups/*` direttamente nel runtime e' accettabile come prototipo, ma e' fragile come destinazione production; per una patch definitiva conviene promuovere gli asset in un path runtime esplicito.
- il componente demo attuale `TyreVehicleView.tsx` mantiene anche una modalita `circle`, storica, che non va usata per la UI approvata.
- il Dettaglio e' gia un file grande; inserire mapping e grafica direttamente in `NextMappaStoricoPage` aumenterebbe il debito.

## 9. Soluzione consigliata

Soluzione consigliata: componente separato presentazionale, montato dentro il blocco gomme di `NextMappaStoricoPage`, ma alimentato solo da dati gia certificati.

Nome indicativo futuro:

- `src/next/components/TyreVehicleView.tsx` se si decide di ripulire/riusare il componente esistente.
- oppure nuovo componente dedicato `src/next/components/NextGommeSchemaView.tsx` se si vuole evitare di portare nella UI reale la modalita storica a cerchi.

Punto di mount consigliato:

- dentro `src/next/NextMappaStoricoPage.tsx`, nel ramo `showTyreSection`, prima o sopra l'attuale `man2-detail-v2__gomme-box` (`src/next/NextMappaStoricoPage.tsx:1137-1178`).

Comportamento consigliato per evitare invenzioni:

1. Se il record non e' gomme: non mostrare lo schema.
2. Se il record e' gomme ma ha solo asse generico:
   - mostrare schema neutro + badge/testo "posizione singola non disponibile";
   - oppure colorare tutte le gomme visibili dell'asse solo se Giuseppe approva che il colore rappresenti "asse coinvolto", non "gomma singola".
3. Se in futuro il record contiene posizione precisa:
   - accendere la maschera esatta (`anterioreDx`, `posterioreDxEsterna`, `posterioreDxInterna`).
4. Non usare parsing libero della descrizione per decidere interna/esterna, salvo casi esplicitissimi e con fallback "da verificare".

## 10. Forma dati minima per accendere le maschere senza interpretare l'immagine

Per accendere le tre maschere validate serve una lista di id visuali, ad esempio:

```ts
type GommeMaskId =
  | "anterioreDx"
  | "posterioreDxEsterna"
  | "posterioreDxInterna";

type GommeSchemaMaskState = {
  id: GommeMaskId;
  state: "replaced" | "default" | "neutral";
};
```

Questa forma puo essere calcolata in UI, ma oggi i dati ufficiali non bastano a popolarla in modo esatto per la singola gomma.

Se Giuseppe vuole precisione reale su singolo pneumatico, serve una decisione additiva di schema, ad esempio un campo opzionale futuro:

```ts
gommePosizioniCoinvolte?: Array<
  | "anteriore_dx"
  | "anteriore_sx"
  | "posteriore_dx_esterna"
  | "posteriore_dx_interna"
  | "posteriore_sx_esterna"
  | "posteriore_sx_interna"
>
```

Questa e' solo proposta, non implementazione. Il nome e il vocabolario vanno approvati prima di qualunque patch dati/writer.

Alternativa senza nuovo schema: tenere il dato ufficiale per asse e usare le maschere solo come rappresentazione "asse coinvolto". In quel caso la UI deve dichiararlo chiaramente e non presentarlo come singola gomma.

## 11. Patch futura proposta, divisa in step

### Step 1 - Integrazione visuale prudente, senza schema nuovo

Obiettivo:

- montare lo schema nel Dettaglio gomme;
- mostrare schema neutro e stati per asse senza inventare singola posizione;
- esporre meglio motivo, quantita, asse, km, fornitore, segnalato da/origine.

Patch:

- creare/riusare componente visuale con base neutra + maschere.
- helper locale `buildGommeSchemaViewModel(record, mezzoInfo)` che ritorna:
  - `isGomme`
  - `tipo`
  - `assiCoinvolti`
  - `posizioniDistinguibili: false` quando manca dato singola gomma
  - `maskStates` vuoto o asse-level approvato
  - `warning: "NON DISTINGUIBILE OGGI"` dove serve.

Test/verify:

- record non gomme: nessuno schema.
- ordinario con `posteriore`: non deve accendere una singola gomma come sostituita.
- straordinario con `posteriore`, quantita 1: mostra motivo/quantita ma posizione singola non disponibile.
- build completa `npm run build`.
- verifica browser su `/next/manutenzioni` dopo patch.

### Step 2 - Decisione prodotto su posizione precisa

Obiettivo:

- decidere se introdurre campo additivo di posizione gomma oppure restare su asse-level.

Richiede decisione Giuseppe:

- A: campo additivo opzionale per posizioni gomma.
- B: nessun campo nuovo; lo schema mostra solo asse/riassunto, non gomma singola.

### Step 3 - Estensione writer/form solo se Step 2A approvato

Obiettivo:

- salvare posizione gomma quando l'utente la seleziona manualmente o quando l'evento sorgente la contiene in modo strutturato.

Questo step toccherebbe domain/writer/form e non va fatto dentro una patch solo UI.

## 12. Whitelist esatta per la patch successiva

### Patch UI prudente senza schema nuovo

File candidati:

- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- `src/next/components/TyreVehicleView.tsx` oppure `src/next/components/NextGommeSchemaView.tsx`
- `src/next/components/tyreVehicleView.css` oppure nuovo CSS dedicato se si riusa il componente
- `src/next/NextTyreVehicleViewDemoPage.tsx` solo se il componente condiviso viene estratto e la demo va mantenuta compatibile

Asset candidati solo se Giuseppe approva spostamento da mockup a runtime:

- `public/gomme/schema/schema_delle_gomme_neutra.png`
- `public/gomme/schema/schema_gomme_mask_anteriore_dx.png`
- `public/gomme/schema/schema_gomme_mask_posteriore_dx_esterna.png`
- `public/gomme/schema/schema_gomme_mask_posteriore_dx_interna.png`

File da non toccare in questa patch UI:

- writer
- domain dati
- `cloneWriteBarrier`
- Firestore/Storage
- madre legacy
- App Autisti
- Autisti Admin/Inbox

### Patch posizione precisa con schema additivo

Da fare solo con nuova decisione:

- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/NextManutenzioniPage.tsx`
- eventuale writer import gomme
- test dedicati

## 13. Eventuali SERVE FILE EXTRA

Non serve file extra per scrivere questo audit.

Serve invece una decisione extra prima della patch runtime:

- se la UI deve colorare singole gomme solo quando esiste dato posizione preciso;
- oppure se Giuseppe accetta una rappresentazione per asse con avviso visivo.

Se si vuole produzione con asset fuori `docs/mockups`, serve approvare il path runtime degli asset prima della patch.

## 14. Verdetto sintetico

1. File che monta realmente il tab Dettaglio: `src/next/NextManutenzioniPage.tsx`, view interno `mappa`, che monta `NextMappaStoricoPage`.
2. Componente che visualizza oggi lo schema/immagine del mezzo nel Dettaglio: nessuno nel ramo runtime corrente; c'e' solo box testuale gomme.
3. Record selezionato: `selectedDetailRecord` da `storico`, passato come `selectedMaintenance`, poi risolto a `selectedRecord` in `NextMappaStoricoPage`.
4. Campi reali per capire se e' gomme: `tipo`, `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`.
5. Campi reali per assi/gomme coinvolti: assi si, singole gomme no.
6. Ordinario: `gommeInterventoTipo="ordinario"`, `assiCoinvolti`, `gommePerAsse[{asseId,dataCambio,kmCambio}]`.
7. Straordinario: `gommeInterventoTipo="straordinario"`, `gommeStraordinario{asseId,quantita,motivo}`.
8. `anteriore DX`, `posteriore DX esterna`, `posteriore DX interna`: NON DISTINGUIBILE OGGI dai dati ufficiali.
9. Punto consigliato di mount: `NextMappaStoricoPage`, dentro `showTyreSection`, tramite componente separato.
10. Patch successiva consigliata: prima UI prudente senza nuovo schema; poi decisione separata se serve posizione gomma precisa.
