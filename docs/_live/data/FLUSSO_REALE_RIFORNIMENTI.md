# FLUSSO REALE RIFORNIMENTI

## Scopo
- Fotografare il flusso reale end-to-end dei rifornimenti nel repository.
- Separare chiaramente writer, reader, dataset e tolleranze legacy.
- Fissare il flusso da rispettare per una futura lettura NEXT sicura senza toccare il gestionale madre.

## Perimetro
- Dominio: `D04 Rifornimenti e consumi`
- Audit repo-driven, senza modifiche runtime.
- Stato verifica live Firestore: `DA VERIFICARE` sul contenuto reale attuale del doc `storage/@rifornimenti`, perche la lettura diretta dal dataset non e disponibile da questo ambiente.

## Dataset e ruoli reali

| Dataset / chiave | Ruolo reale oggi | Shape osservata nel repo | Note |
| --- | --- | --- | --- |
| `@rifornimenti_autisti_tmp` | staging operativo ad alta fedelta | array logico letto via `getItemSync`, fisicamente spesso sotto `value` | contiene il record quasi completo nato da app autisti o admin |
| `@rifornimenti` | proiezione dossier/business ridotta | tollerate `items`, `value.items`, `value`, array | viene scritto con `setDoc` diretto e letto con unwrap multipli |
| `storageSync` (`getItemSync` / `setItemSync`) | wrapper storage per chiavi legacy | `setItemSync` salva come `{ value: ... }` | spiega perche molti reader gestiscono `value` |
| `autisti_eventi` / PDF payload | consumo secondario | payload derivati, non sorgente business | usati per inbox, preview e PDF, non per il canonico dossier |

## 1. Moduli che scrivono rifornimenti

### Writer principali
- `src/autisti/Rifornimento.tsx`
  - Origine principale del dato operativo.
  - Scrive prima il record completo in `@rifornimenti_autisti_tmp`.
  - Poi proietta lo stesso record nel dataset dossier `@rifornimenti`.
  - Shape staging osservata:
    - `id`
    - `autistaId`, `autistaNome`, `badgeAutista`
    - `targaCamion`, `targaRimorchio`
    - `tipo`, `metodoPagamento`, `paese`
    - `km`, `litri`, `importo`
    - `note`
    - `data`
    - `flagVerifica`, `confermatoAutista`
  - Shape proiettata in `@rifornimenti.items` tramite `buildDossierItem(...)`:
    - `id`
    - `mezzoTarga`
    - `data`
    - `litri`
    - `km`
    - `distributore`
    - `costo`
    - `note`

- `src/autistiInbox/AutistiAdmin.tsx`
  - Writer amministrativo parallelo.
  - Crea, modifica e cancella rifornimenti.
  - Aggiorna sempre `@rifornimenti_autisti_tmp`.
  - Poi riallinea `@rifornimenti` con la stessa logica di proiezione ridotta.
  - In lettura/scrittura sul dossier tollera ancora sia `items` sia `value.items`.

### Writer indiretti / infrastrutturali
- `src/utils/storageSync.ts`
  - Non crea record di business da solo.
  - Determina pero la forma fisica delle chiavi che passano da `setItemSync`, cioe `{ value: ... }`.
  - E uno dei motivi della convivenza tra shape top-level e shape sotto `value`.

## 2. Moduli che leggono rifornimenti

### Reader che leggono solo il dataset staging `@rifornimenti_autisti_tmp`
- `src/pages/DossierMezzo.tsx`
  - Legge direttamente il `tmp`.
  - Filtra per `targaCamion`.
  - Si aspetta campi ricchi come `autistaNome`, `badgeAutista`, `tipo`, `litri`, `km`, `data`.
  - Non usa il canonico `@rifornimenti`.

- `src/utils/homeEvents.ts`
  - Costruisce gli eventi rifornimento della home/inbox autisti dal `tmp`.
  - Usa fallback targa multipli: `targaCamion`, `targaMotrice`, `mezzoTarga`, `targa`.
  - Usa fallback temporale `timestamp ?? data`.

- `src/autistiInbox/AutistiInboxHome.tsx`
  - Reader indiretto: usa `loadHomeEvents(...)`.
  - Quindi dipende di fatto dal `tmp`.

- `src/autistiInbox/components/RifornimentiCard.tsx`
  - Widget UI che mostra gli eventi gia derivati da `loadHomeEvents(...)`.

- `src/pages/Autista360.tsx`
  - Timeline autista.
  - Legge `@rifornimenti_autisti_tmp` tra i bucket principali.
  - Si aspetta campi ricchi per titolo, sottotitolo e preview modale.

- `src/pages/Mezzo360.tsx`
  - Vista 360 mezzo legacy.
  - Legge `@rifornimenti_autisti_tmp`.

- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
  - Usa `@rifornimenti_autisti_tmp` come supporto operativo per i rifornimenti `caravate`.
  - Legge data, targa, autista e litri dai record autisti.

- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
  - Legge `@rifornimenti_autisti_tmp` per confronti e supporto schede.

- `src/cisterna/collections.ts`
  - Formalizza il legame cisterna -> `@rifornimenti_autisti_tmp` e normalizza eventi autisti a uso cisterna.

### Reader che leggono canonico + staging e fanno merge
- `src/pages/RifornimentiEconomiaSection.tsx`
  - Legge `@rifornimenti` e `@rifornimenti_autisti_tmp`.
  - Accetta shape multiple sul canonico: `items`, `value.items`, `value`, array.
  - Filtra il canonico per `mezzoTarga ?? targaCamion ?? targaMotrice`.
  - Se `km` manca nel canonico, prova a recuperarlo dal `tmp` con match euristico per:
    - stessa targa normalizzata
    - stessi litri
    - finestra di 10 minuti o stesso giorno
  - E il reader che spiega meglio perche il gestionale attuale "vede bene" anche con canonico incompleto.

- `src/pages/CentroControllo.tsx`
  - Legge `@rifornimenti` e `@rifornimenti_autisti_tmp`.
  - Normalizza entrambi i flussi in `RefuelRow`.
  - Fa merge tra dossier e tmp:
    - match per `originId` se possibile
    - fallback euristico su targa, litri e prossimita temporale
  - Backfilla `autistaNome`, `badgeAutista`, `km`, `costo`, `distributore`, `note`.
  - Espone anche il campo `source` (`dossier`, `tmp`, `merged`).

### Reader indiretti via `RifornimentiEconomiaSection`
- `src/pages/DossierRifornimenti.tsx`
  - Wrapper della sezione economia rifornimenti.

- `src/pages/AnalisiEconomica.tsx`
  - Include `RifornimentiEconomiaSection`.
  - Quindi eredita la stessa logica di lettura e merge.

### Consumatori secondari
- `src/components/AutistiEventoModal.tsx`
  - Genera preview PDF dei rifornimenti dagli eventi gia caricati.
  - Non e sorgente dati primaria del dominio.

- `src/utils/pdfEngine.ts`
  - Formatter PDF per singolo rifornimento e report mensile.
  - Si aspetta payload anche ricchi (`autistaNome`, `badgeAutista`, `costo`, `distributore`) ma non legge storage da solo.

## 3. Flusso reale end-to-end

### Nascita dato
1. L'autista inserisce il rifornimento in `src/autisti/Rifornimento.tsx`, oppure l'admin lo crea/modifica da `src/autistiInbox/AutistiAdmin.tsx`.
2. Il record nasce in forma operativa ricca, orientata all'evento autista.

### Staging
3. Il record viene scritto in `@rifornimenti_autisti_tmp`.
4. Questo dataset conserva il dettaglio operativo piu vicino alla fonte:
   - autista
   - badge
   - targa camion/rimorchio
   - tipo rifornimento
   - litri
   - km
   - importo
   - data numerica
   - note

### Consolidamento / proiezione dossier
5. Lo stesso writer costruisce una proiezione ridotta con `buildDossierItem(...)`.
6. La proiezione viene salvata in `@rifornimenti`, di fatto sotto `items`, ma i reader mantengono compatibilita anche con `value.items`.
7. In questa proiezione si perdono o non sono garantiti:
   - `autistaNome`
   - `badgeAutista`
   - `timestamp` canonico separato
   - `source`
   - `validation`

### Visualizzazione legacy
8. Le viste legacy non consumano tutte lo stesso dataset:
   - `DossierMezzo`, `HomeEvents`, `Autista360`, `Mezzo360`, `Cisterna*` leggono il `tmp`
   - `RifornimentiEconomiaSection`, `CentroControllo` leggono il canonico ma lo completano col `tmp`
   - `DossierRifornimenti` e `AnalisiEconomica` dipendono dalla sezione economia

### Uso in dossier / economia / report
9. Il Dossier dettaglio mezzo visualizza i rifornimenti operativi direttamente dal `tmp`.
10. Le viste economia e reportistica mensile preferiscono il canonico `@rifornimenti`, ma recuperano dal `tmp` cio che manca.
11. Il Centro Controllo usa il merge piu spinto e rende visibile la provenienza finale dei dati.

## 4. Perche il gestionale madre funziona

Il gestionale madre riesce a mostrare bene i rifornimenti non perche esista gia un contratto canonico unico, ma perche il runtime legacy e molto tollerante.

### Tolleranze reali che oggi tengono in piedi il flusso
- Accetta dataset doppi: `@rifornimenti_autisti_tmp` e `@rifornimenti`.
- Accetta shape multiple del canonico: `items`, `value.items`, `value`, array.
- Accetta naming multipli della targa:
  - `mezzoTarga`
  - `targaCamion`
  - `targaMotrice`
  - `targaRimorchio`
  - `targa`
- Accetta campi temporali multipli:
  - `data`
  - `dataOra`
  - `timestamp`
- Completa `km`, `costo`, `autistaNome`, `badgeAutista` usando merge e fallback dal `tmp`.
- In alcune viste usa direttamente il `tmp`, cioe il dataset piu ricco.

### Conseguenza pratica
- Il madre non dipende da un solo dataset pulito.
- Dipende da un ecosistema di letture tolleranti, unwrap multipli e merge euristici.
- Questo spiega perche "funziona" anche se il dominio non e ancora pienamente canonico per la NEXT.

## 5. Nodi critici

### Dataset doppi
- `@rifornimenti_autisti_tmp` e staging operativo, ma viene anche letto direttamente come sorgente utente finale.
- `@rifornimenti` e proiezione business, ma non basta sempre da solo.

### Shape multiple
- Il `tmp` passa da `storageSync`, quindi spesso vive sotto `value`.
- Il canonico viene scritto con `setDoc` diretto, quindi tende a stare sotto `items`.
- I reader mantengono pero compatibilita anche con `value.items` e altre varianti.

### Naming multipli
- Targa non unificata.
- Tempo non unificato.
- Costo a volte `costo`, a volte `importo`.

### Merge euristici
- `RifornimentiEconomiaSection` recupera `km` dal `tmp`.
- `CentroControllo` ricostruisce righe merged e backfilla altri campi.
- Questo e utile al madre, ma non va copiato nella NEXT.

### Riduzione del canonico attuale
- La proiezione `@rifornimenti.items` e troppo povera per replicare da sola tutta l'esperienza legacy.
- I campi mancanti principali per parita legacy sono:
  - `autistaNome`
  - `badgeAutista`
  - `timestamp` canonico certo
  - metadati di origine/validazione

### Verifica live residua
- La distribuzione reale, oggi, tra `items` top-level e residui legacy non e dimostrabile da questo ambiente.
- Lo stato va quindi marcato `DA VERIFICARE` sul piano live dataset, ma il flusso architetturale nel codice e sufficientemente chiaro.

## 6. Flusso corretto da rispettare in NEXT

### Strategia piu sicura
- Considerare `@rifornimenti_autisti_tmp` solo come staging legacy.
- Considerare `@rifornimenti.items` come unica sorgente business per ogni futura lettura NEXT di `D04`.
- Leggere nella NEXT solo il sottoinsieme di campi realmente presenti e stabili nel canonico.

### Cosa si puo riusare
- Il fatto che i writer proiettino gia verso `@rifornimenti`.
- Il campo `mezzoTarga` come chiave mezzo-centrica migliore del canonico.
- Il nucleo minimo gia documentato in `docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md`:
  - `id`
  - `mezzoTarga`
  - `data`
  - `litri`
  - `distributore`
  - `note`
- `km` e `costo` solo come opzionali nullable, non come requisiti duri.

### Cosa NON dobbiamo copiare
- Nessuna lettura di `@rifornimenti_autisti_tmp` nella NEXT.
- Nessun merge dossier/tmp reader-side.
- Nessun fallback a `value.items` o array raw se l'obiettivo dichiarato e il contratto canonico target.
- Nessun recupero euristico di `km`, `autistaNome`, `badgeAutista` o `costo`.
- Nessun uso implicito di `data` come se fosse gia `timestamp` canonico.

### Lettura transitoria controllata?
- Solo se dichiarata esplicitamente come transitoria e limitata al sottoinsieme canonico di `@rifornimenti.items`.
- Non e consigliata una lettura transitoria che replichi le tolleranze legacy, perche sporcherebbe subito il Dossier NEXT.

### Regola pratica per il prossimo step NEXT
- Se l'obiettivo e un blocco rifornimenti minimale nel Dossier NEXT:
  - usare solo `@rifornimenti.items`
  - mostrare solo campi canonici stabili
  - dichiarare chiaramente che si tratta di convergenza minima read-only
  - lasciare fuori autista, badge, matching km e calcoli avanzati finche non esiste un contratto runtime pienamente allineato

## Verdetto finale
- `IL FLUSSO REALE E ABBASTANZA CHIARO`

Motivo:
- writer principali identificati
- reader principali identificati
- staging e consolidamento distinguibili
- motivi del corretto funzionamento legacy spiegati
- perimetro sicuro e perimetro da non copiare nella NEXT ora documentati

Resta `DA VERIFICARE` solo la distribuzione live attuale del documento `storage/@rifornimenti`, non il disegno del flusso nel codice.
