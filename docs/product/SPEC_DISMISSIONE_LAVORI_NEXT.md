# SPEC DISMISSIONE LAVORI NEXT

Versione: 1.0
Data: 2026-05-12
Stato: SPEC OPERATIVA, nessuna patch runtime inclusa

## 1. Sommario esecutivo

La NEXT dismette il modulo Lavori come sorgente applicativa e assorbe i record operativi in `@manutenzioni`.
La strategia congelata e' 3a: `@lavori` resta viva fuori dal perimetro NEXT, ma la NEXT non deve piu' leggerla dopo la dismissione (`docs/DIARIO_DECISIONI.md:436-437`).
Non si fa mirror continuo (`docs/DIARIO_DECISIONI.md:431-432`).
I conteggi Firestore reali del 2026-05-12 sono: `@lavori` 18 record, `@manutenzioni` 56 record, 32 segnalazioni con backlink, 9 controlli con backlink.
Dei 18 record `@lavori`, 10 sono aperti e 8 eseguiti; tutti hanno `gruppoId`, tutti hanno `km` e `ore` vuoti.
I 18 record sono tutti `tipo: "targa"`; il caso `tipo: "magazzino"` e' verificato a zero record e resta solo vincolo difensivo.
I 18 record migrati perdono `gruppoId`, non introducono stime km/ore e non duplicano foto su Storage.
I backlink `linkedLavoroId` / `linkedLavoroIds` mantengono il nome e cambiano significato: puntano alla manutenzione equivalente.
I 3 writer oggi diretti a `@lavori` vengono sostituiti da writer `@manutenzioni` con `stato: "daFare"`.
Il sottosistema Chat IA Zero-Invenzioni resta intoccato in questa dismissione.
Tra repunting lettori e rimozione UI c'e' un gate manuale runtime obbligatorio.
Non si toccano `src/pages/**`, regole Firestore, build, lint o test in questa SPEC.

## 2. Fonti e riferimenti

- Audit base: `docs/_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md:1`, report operativo da `docs/_live/AUDIT_DISMISSIONE_LAVORI_NEXT_2026-05-12.md:51`.
- Diario decisioni: `docs/DIARIO_DECISIONI.md:429`, contesto strategia `docs/DIARIO_DECISIONI.md:431-432`, decisioni `docs/DIARIO_DECISIONI.md:436-470`.
- Shape Lavori NEXT: `src/next/domain/nextLavoriDomain.ts:15-16`, tipi e output contract `src/next/domain/nextLavoriDomain.ts:38-65`, normalizzazione record `src/next/domain/nextLavoriDomain.ts:461-544`, lettura `storage/@lavori` `src/next/domain/nextLavoriDomain.ts:674-736`.
- Shape Manutenzioni NEXT: `src/next/domain/nextManutenzioniDomain.ts:14-19`, record legacy `src/next/domain/nextManutenzioniDomain.ts:110-129`, payload writer `src/next/domain/nextManutenzioniDomain.ts:171-189`, sanitizer writer `src/next/domain/nextManutenzioniDomain.ts:810-855`, persistenza `src/next/domain/nextManutenzioniDomain.ts:982-1010`.
- Writer segnalazione/controllo: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540-1603`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1605-1693`.
- Writer Centro Controllo: `src/next/nextLavoroCreateWriter.ts:72-102`, `src/next/nextLavoroCreateWriter.ts:142-202`, invocazione da `src/next/NextCentroControlloParityPage.tsx:2410-2419`.
- Barrier: `src/utils/cloneWriteBarrier.ts:2-7`, `src/utils/cloneWriteBarrier.ts:15-23`, `src/utils/cloneWriteBarrier.ts:145-151`, `src/utils/cloneWriteBarrier.ts:520-526`, `src/utils/cloneWriteBarrier.ts:689-691`, `src/utils/cloneWriteBarrier.ts:818-829`.
- Route e menu: `src/App.tsx:38-41`, `src/App.tsx:325-329`, `src/App.tsx:379-406`, `src/next/nextData.ts:159`, `src/next/nextStructuralPaths.ts:19-22`.
- Nota path: il prompt citava `src/next/NextAutistiAdminNative.tsx` e `src/next/nextManutenzioniDomain.ts`; il codice reale e' in `src/next/autistiInbox/NextAutistiAdminNative.tsx` e `src/next/domain/nextManutenzioniDomain.ts`, verificato con `rg --files src/next`.

## 3. Decisioni congelate

Le decisioni seguenti sono riportate fedelmente dalla voce `2026-05-12` del diario (`docs/DIARIO_DECISIONI.md:436-470`).

| ID | Testo decisione |
|---|---|
| J.1 - Migrazione dati | Migrazione totale dei record da `@lavori` a `@manutenzioni`. La collection `@lavori` resta viva in Firestore perche' la madre continua a scriverla. La NEXT non legge piu' `@lavori` dopo la dismissione. |
| J.2 - Card Home | La card Home NEXT "Lavori in attesa" si trasforma in "Manutenzioni da fare". Stesso posto, stessa logica, repuntata sulla nuova collection. |
| J.3 - PDF Quadro manutenzioni | Il PDF "Quadro manutenzioni" mantiene impaginazione attuale invariata in questo giro. I filtri determinano cosa renderizzare. Il PDF deve sapere renderizzare anche record con stato `daFare` e `programmata` senza crashare su campi opzionali (km, fornitore, costo). |
| J.4 - Route dettaglio | La route `/next/dettagliolavori/:id` viene mantenuta come redirect verso il dettaglio manutenzione equivalente, per non rompere link e bookmark esistenti. |
| J.5 - Foto record migrati | Foto dei record migrati: referenziate dal record segnalazione o controllo di origine, non duplicate su Storage. |
| J.6 - Repunting lettori indiretti | I 12 lettori indiretti `@lavori` identificati in audit con gravita ALTA o CRITICA vengono tutti repuntati a `@manutenzioni` in un solo passaggio, senza periodo di transizione a doppia lettura. |
| J.7 - linkedLavoroId | Il campo `linkedLavoroId` sui record `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` mantiene il nome invariato. Cambia solo il significato del valore puntato: dopo la migrazione punta all'id della manutenzione equivalente, non piu' all'id lavoro. |
| J.8 - Tipo "magazzino" | Il tipo "magazzino" dei record `@lavori` (lavori senza targa, richieste materiali generiche) viene mantenuto come tipo "magazzino" anche in `@manutenzioni`. |
| J.9 - gruppoId | Il campo `gruppoId` presente in `@lavori` non viene portato in `@manutenzioni`. Ogni manutenzione `daFare` e' un record separato, niente concetto di blocco di manutenzioni. |
| J.10 - Chat IA Zero-Invenzioni (debito accettato) | Tutto il sottosistema chat IA Zero-Invenzioni resta intoccato in questo intervento. Le entries riferite a lavori (`registry.config.js` `work.lavori`, `view.config.ts` `firestore-storage-lavori-doc`, `internal-ai-firebase-readonly-boundary.js`, `internal-ai-repo-understanding.js`, `chatIaRouter.ts`, `sectorFallbacks.ts`, `chatIaMezziData.ts`) restano invariate. Conseguenza accettata in modo cosciente: la chat IA continuera' a leggere `@lavori` come sorgente attiva finche' non verra' fatta una sessione di pulizia dedicata, in futuro. Le manutenzioni `daFare`/`programmata` create dopo la dismissione non saranno visibili dalla chat IA come "lavori" finche' la pulizia non avverra'. |
| J.11 - Record clone-only in localStorage | I record presenti in `localStorage` `@next_clone_lavori:records` (clone-only, mai persistiti su Firestore) vanno prima contati, poi si decide se migrarli in `@manutenzioni` o scartarli. Decisione rinviata a dopo il conteggio. |
| KM/ORE migrazione | I record `@lavori` migrati portano i campi `km` e `ore` solo se gia' presenti nel record originale. Se assenti, vengono lasciati vuoti. Nessuna stima da rifornimenti o da altre fonti. Nessun flag origine "lavori_legacy". Conseguenza accettata: il KPI "ultimo intervento a X km/ore" del modulo Manutenzioni si calcola solo sui record che hanno km/ore reali compilati; i record migrati senza km non contribuiscono agli aggregati km/ore ma sono comunque presenti nello storico cronologico. |

Applicazione del conteggio Firestore reale: J.8 e' verificata a zero record sul dataset attuale (`@lavori`: 18 `tipo: "targa"`, 0 `tipo: "magazzino"`). La regola `tipo: "magazzino"` non si implementa nella migrazione dei 18 record, resta solo vincolo difensivo per bloccare o segnalare un dato imprevisto.

Applicazione della verifica runtime localStorage del 2026-05-12: J.11 non genera azione in questa dismissione perche' la key `@next_clone_lavori:records` e' risultata assente nel localStorage runtime. Non c'e' dataset clone-only da migrare.

## 4. Shape target @manutenzioni (esteso)

Stato attuale verificato:

- Il dataset canonico e' `@manutenzioni` (`src/next/domain/nextManutenzioniDomain.ts:14-15`).
- Il record legacy oggi espone `id`, `targa`, `km`, `ore`, `sottotipo`, `descrizione`, `eseguito`, `data`, `tipo`, `fornitore`, `materiali`, `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`, `sourceDocumentId`, `importo`, metadati documento (`src/next/domain/nextManutenzioniDomain.ts:110-129`).
- `tipo` oggi e' limitato a `"mezzo" | "compressore" | "attrezzature"` (`src/next/domain/nextManutenzioniDomain.ts:145`).
- Il payload writer oggi accetta `editingSourceId`, `targa`, `tipo`, `fornitore`, `km`, `ore`, `sottotipo`, `descrizione`, `eseguito`, `data`, `materiali`, campi gomme, `sourceDocumentId`, `importo` (`src/next/domain/nextManutenzioniDomain.ts:171-189`).
- Il writer sanitizza e persiste i campi attuali in `sanitizeBusinessRecord()` (`src/next/domain/nextManutenzioniDomain.ts:810-855`) e poi scrive `@manutenzioni` in `saveNextManutenzioneBusinessRecord()` (`src/next/domain/nextManutenzioniDomain.ts:982-994`).
- La ricerca obbligatoria `rg -n "stato.*daFare|stato.*programmata|stato.*eseguita|dataProgrammata|origineTipo|origineRefId|origineRefKey|eseguitoDa" src/next/domain/nextManutenzioniDomain.ts` non ha prodotto righe: i campi target non esistono oggi nel file reale.

Campi nuovi da aggiungere:

| Campo | Tipo | Opzionalita | Default | Regole di compilazione | Fonte |
|---|---|---|---|---|---|
| `stato` | `"daFare" | "programmata" | "eseguita"` | sempre sul nuovo shape | `"eseguita"` per record migrati con `eseguito === true`; `"daFare"` per record migrati con `eseguito !== true`; `"programmata"` solo per flussi futuri non coperti dalla migrazione | `@lavori.eseguito` letto come boolean da `src/next/domain/nextLavoriDomain.ts:476`, stato vista oggi derivato a `src/next/domain/nextLavoriDomain.ts:539` |
| `dataProgrammata` | `string | null` | opzionale | `null` nella migrazione dei 18 record | non stimare; valorizzare solo se un futuro writer riceve una data programmata esplicita | nuovo campo target, non presente in `src/next/domain/nextManutenzioniDomain.ts:110-129` |
| `origineTipo` | `"manuale" | "controllo" | "segnalazione" | null` | opzionale | `null` per record senza origine; `"segnalazione"` o `"controllo"` se `source.type` e' presente; `"manuale"` solo per record legacy senza `source` se serve distinguere il caso manuale | `source.type` normalizzato in `src/next/domain/nextLavoriDomain.ts:501`; writer sorgenti a `src/next/autistiInbox/NextAutistiAdminNative.tsx:1576-1580`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1661-1665`, `src/next/nextLavoroCreateWriter.ts:97-100` |
| `origineRefId` | `string | null` | opzionale | `null` se assente | copiare `source.id` | `src/next/domain/nextLavoriDomain.ts:503` |
| `origineRefKey` | `string | null` | opzionale | `null` se assente | copiare `source.key`, es. `@segnalazioni_autisti_tmp` o `@controlli_mezzo_autisti` | `src/next/domain/nextLavoriDomain.ts:502` |
| `segnalatoDa` | `string | null` | opzionale | `null` se assente | copiare `@lavori.segnalatoDa` | `src/next/domain/nextLavoriDomain.ts:535`; writer a `src/next/autistiInbox/NextAutistiAdminNative.tsx:1574`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1659`, `src/next/nextLavoroCreateWriter.ts:92-93` |
| `eseguitoDa` | `string | null` | opzionale | `null` se assente | copiare `@lavori.chiHaEseguito`; non usare il campo esistente `eseguito` di manutenzioni per non confondere flag/label | `src/next/domain/nextLavoriDomain.ts:536`; `@manutenzioni.eseguito` oggi e' stringa a `src/next/domain/nextManutenzioniDomain.ts:117` e viene scritto a `src/next/domain/nextManutenzioniDomain.ts:845` |
| `urgenza` | `"alta" | "media" | "bassa" | null` | opzionale | `null` se assente | copiare `@lavori.urgenza`; valori non standard restano `null` | normalizzazione a `src/next/domain/nextLavoriDomain.ts:302-304`, lettura a `src/next/domain/nextLavoriDomain.ts:498` |

Vincoli shape:

- Non aggiungere `gruppoId` a `@manutenzioni`: decisione J.9 (`docs/DIARIO_DECISIONI.md:460-461`).
- Non introdurre `tipo: "magazzino"` nel runtime della migrazione corrente: il conteggio Firestore reale e' zero record. `TipoVoce` oggi non lo ammette (`src/next/domain/nextManutenzioniDomain.ts:145`). Se un record imprevisto `tipo: "magazzino"` appare durante la migrazione, la migrazione deve fermarsi o segnalarlo come dato fuori conteggio, non inventare mapping.
- I record migrati con km/ore vuoti restano con `km: null` e `ore: null`; il codice esistente normalizza `km` e `ore` come numeri o `null` (`src/next/domain/nextManutenzioniDomain.ts:815`, `src/next/domain/nextManutenzioniDomain.ts:842`).

## 5. Regole di mapping per la migrazione @lavori -> @manutenzioni

Shape `@lavori` verificata in `src/next/domain/nextLavoriDomain.ts:133-145`, normalizzata in `src/next/domain/nextLavoriDomain.ts:461-544`; i writer attuali producono le stesse chiavi in `src/next/autistiInbox/NextAutistiAdminNative.tsx:1565-1582`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1650-1666`, `src/next/nextLavoroCreateWriter.ts:72-102`.

| Chiave reale `@lavori` | Target `@manutenzioni` | Regola |
|---|---|---|
| `chiHaEseguito` | `eseguitoDa` nuovo | Copiare come stringa o `null`. Non mappare su `@manutenzioni.eseguito` perche' quel campo oggi e' label testuale legacy (`src/next/domain/nextManutenzioniDomain.ts:117`, `src/next/domain/nextManutenzioniDomain.ts:518`). |
| `dataEsecuzione` | `data` esistente | Se presente, usare come `data` della manutenzione eseguita. `@lavori.dataEsecuzione` e' letto a `src/next/domain/nextLavoriDomain.ts:475`; `@manutenzioni.data` e' campo esistente a `src/next/domain/nextManutenzioniDomain.ts:118`. |
| `dataInserimento` | `data` esistente per record non eseguiti; `dataProgrammata: null` | Per record `daFare`, usare `dataInserimento` come data cronologica minima per non perdere ordinamento; non introdurre un campo extra `dataInserimento` perche' non e' nella lista campi target. Campo letto a `src/next/domain/nextLavoriDomain.ts:474`; `@manutenzioni.data` scritto a `src/next/domain/nextManutenzioniDomain.ts:846`. |
| `descrizione` | `descrizione` esistente | Copiare. Letta a `src/next/domain/nextLavoriDomain.ts:472`, scritta su manutenzioni a `src/next/domain/nextManutenzioniDomain.ts:844`. |
| `dettagli` | `descrizione` esistente, append controllato | Se presente, accodare a `descrizione` con separatore testuale; `@manutenzioni` non ha campo `dettagli` (`src/next/domain/nextManutenzioniDomain.ts:110-129`). Letto a `src/next/domain/nextLavoriDomain.ts:473`; prodotto dal writer Centro Controllo a `src/next/nextLavoroCreateWriter.ts:94-95`. |
| `eseguito` | `stato` nuovo | `true -> "eseguita"`, diverso da `true -> "daFare"`. Il boolean e' normalizzato in `src/next/domain/nextLavoriDomain.ts:290-293` e letto a `src/next/domain/nextLavoriDomain.ts:476`. |
| `gruppoId` | scartato | Decisione J.9: non portare il campo. Tutti i 18 record reali lo hanno, quindi tutti lo perdono nella migrazione. Il dettaglio lavori oggi lo usa per aggregare (`src/next/domain/nextLavoriDomain.ts:1025-1034`), ma il target `@manutenzioni` resta uno-a-uno. |
| `id` | id nuova manutenzione | Costruire `mappa idLavoro -> idManutenzione` durante la migrazione. La SPEC non fissa formato id; l'implementazione deve impedire duplicati con pre-check idempotente sui campi `origineRefKey`, `origineRefId`, `targa`, `descrizione`, `stato`. `@lavori.id` e' letto a `src/next/domain/nextLavoriDomain.ts:522`; `@manutenzioni.id` esiste a `src/next/domain/nextManutenzioniDomain.ts:111`. |
| `segnalatoDa` | `segnalatoDa` nuovo | Copiare come stringa o `null`. Letto a `src/next/domain/nextLavoriDomain.ts:535`. |
| `sottoElementi` | scartato se vuoto; VERIFICA APERTA se non vuoto | I writer NEXT creano `sottoElementi: []` (`src/next/autistiInbox/NextAutistiAdminNative.tsx:1575`, `src/next/autistiInbox/NextAutistiAdminNative.tsx:1660`, `src/next/nextLavoroCreateWriter.ts:94`). Il dominio conta solo lunghezza e flag (`src/next/domain/nextLavoriDomain.ts:508-509`). Il conteggio Firestore ha solo chiave sample, non contenuto; prima della migrazione, se un record ha array non vuoto, fermare o produrre report `DA VERIFICARE`. |
| `source.type` | `origineTipo` nuovo | Copiare `segnalazione` / `controllo`; se assente e il record e' il singolo `manuale_o_null`, usare `manuale` solo se serve mantenere il caso manuale, altrimenti `null`. Lettura a `src/next/domain/nextLavoriDomain.ts:501`. |
| `source.id` | `origineRefId` nuovo | Copiare o `null`. Lettura a `src/next/domain/nextLavoriDomain.ts:503`. |
| `source.key` | `origineRefKey` nuovo | Copiare o `null`. Lettura a `src/next/domain/nextLavoriDomain.ts:502`. |
| `targa` | `targa` esistente | Copiare normalizzata uppercase. `@lavori` legge targa da `targa`/`mezzoTarga` a `src/next/domain/nextLavoriDomain.ts:465-467`; `@manutenzioni` normalizza `targa` a `src/next/domain/nextManutenzioniDomain.ts:813`. |
| `tipo` | `tipo: "mezzo"` esistente | I 18 record reali sono tutti `tipo: "targa"`; mapparli a `tipo: "mezzo"`. `@lavori.tipo` ammette `"magazzino" | "targa"` a `src/next/domain/nextLavoriDomain.ts:38` e normalizza a `src/next/domain/nextLavoriDomain.ts:296-300`; `@manutenzioni.tipo` ammette `"mezzo" | "compressore" | "attrezzature"` a `src/next/domain/nextManutenzioniDomain.ts:145`. |
| `urgenza` | `urgenza` nuovo | Copiare `alta` / `media` / `bassa` o `null`. Normalizzazione attuale a `src/next/domain/nextLavoriDomain.ts:302-304`. |
| `km` | `km` esistente | Copiare solo se presente nel record originale. Conteggio reale: 0/18 compilati, quindi tutti i 18 migrati nascono con `km: null`. Il target normalizza `km` a `src/next/domain/nextManutenzioniDomain.ts:815`. |
| `ore` | `ore` esistente | Copiare solo se presente nel record originale. Conteggio reale: 0/18 compilati, quindi tutti i 18 migrati nascono con `ore: null`. Il target normalizza `ore` a `src/next/domain/nextManutenzioniDomain.ts:842`. |

Regole speciali:

- Foto: non duplicare su Storage; restano referenziate dal record segnalazione/controllo di origine come da J.5 (`docs/DIARIO_DECISIONI.md:448-449`).
- `tipo: "magazzino"`: verificato zero record; regola non implementata nella migrazione dei 18 record, solo controllo difensivo.
- `gruppoId`: tutti i 18 record lo hanno; tutti lo perdono, come da J.9.

## 6. Riscrittura backlink linkedLavoroId

Dataset coinvolti dal conteggio reale:

- `@segnalazioni_autisti_tmp`: 36 record totali, 32 con `linkedLavoroId` o `linkedLavoroIds` popolato.
- `@controlli_mezzo_autisti`: 349 record totali, 9 con `linkedLavoroId` o `linkedLavoroIds` popolato.

Numero di backlink riscritti atteso = numero di record origine con linkedLavoroId/linkedLavoroIds puntante a uno dei 18 lavori migrati. NON il conteggio dei record con campo popolato. La differenza tra i 41 record con campo popolato e i 17 link validi e' rappresentata da 24 record orfani preesistenti (linkedLavoroId che punta a id lavoro non piu' esistente), documentati in docs/_live/REPORT_FASI_1-4_DISMISSIONE_LAVORI_NEXT_2026-05-12.md cap 16.

Regola congelata: il nome `linkedLavoroId` non cambia (`docs/DIARIO_DECISIONI.md:454-455`). Cambia solo il valore: dopo la migrazione punta all'id della manutenzione equivalente.

Algoritmo:

1. Migrare i 18 record `@lavori` secondo il capitolo 5.
2. Durante la creazione dei record target, costruire una mappa in memoria `idLavoro -> idManutenzione`.
3. Caricare `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`.
4. Per ogni record origine, se `linkedLavoroId` e' una chiave della mappa, sostituire il valore con `mappa[linkedLavoroId]`.
5. Se `linkedLavoroIds` e' array, riscrivere ogni elemento presente nella mappa e preservare gli elementi gia' non mappabili come `DA VERIFICARE`.
6. Non rinominare il campo e non aggiungere `linkedManutenzioneId`.

Idempotenza:

- Se un record origine contiene gia' un id manutenzione target, la riscrittura deve essere no-op.
- Prima di creare una manutenzione target, cercare un record esistente con stessa combinazione `origineRefKey`, `origineRefId`, `targa`, `descrizione`, `stato`; se esiste, riusarne l'id nella mappa invece di creare duplicati.
- Se un backlink punta a un id lavoro che non esiste nei 18 record migrati, non cancellarlo: marcarlo nel report migrazione come `DA VERIFICARE`.

Ancore codice attuali:

- `hasLinkedLavoro` su modale evento legge `linkedLavoroId` e `linkedLavoroIds` (`src/next/components/NextHomeAutistiEventoModal.tsx:146-149`).
- Reader segnalazioni propaga `linkedLavoroId` e `hasLinkedLavoro` (`src/next/domain/nextAutistiDomain.ts:551-552`).
- Reader controlli propaga `linkedLavoroIds` e `hasLinkedLavoro` (`src/next/domain/nextAutistiDomain.ts:684-700`).
- Centro Controllo filtra righe gia' linkate con `!row.hasLinkedLavoro` (`src/next/NextCentroControlloParityPage.tsx:1524-1542`).

## 7. Estensione cloneWriteBarrier

Stato attuale:

- `MANUTENZIONI_ALLOWED_WRITE_PATHS` consente solo `/next/manutenzioni` (`src/utils/cloneWriteBarrier.ts:15`).
- `MANUTENZIONI_ALLOWED_STORAGE_KEYS` include gia' `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping` (`src/utils/cloneWriteBarrier.ts:16-22`).
- La regola finale consente `storageSync.setItemSync` su quelle chiavi solo se il pathname passa `isAllowedManutenzioniCloneWritePath()` (`src/utils/cloneWriteBarrier.ts:818-823`).
- Il writer attuale da Centro Controllo usa un perimetro separato `LAVORO_CREATE_ALLOWED_WRITE_PATH = "/next/centro-controllo"`, chiavi `@lavori`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, scope `LAVORO_CREATE_WRITE_SCOPE` (`src/utils/cloneWriteBarrier.ts:145-151`, `src/utils/cloneWriteBarrier.ts:520-526`).

Decisioni per la patch futura:

- Serve nuovo path consentito: SI. La creazione `daFare` da modale autista parte da `/next/centro-controllo`, non da `/next/manutenzioni` (`src/next/NextCentroControlloParityPage.tsx:2410-2419`; modale submit a `src/next/components/NextHomeAutistiEventoModal.tsx:530-563`).
- Serve nuovo scope: SI. Nome previsto: `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`. Motivazione: sostituire `LAVORO_CREATE_WRITE_SCOPE` senza aprire scritture generiche a `@manutenzioni` fuori da `/next/manutenzioni`.
- Chiavi previste per lo scope nuovo: `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`. Le ultime due servono per la patch backlink come oggi fa `src/next/nextLavoroCreateWriter.ts:175-196`.
- `DELETE_MEZZO_ALLOWED_STORAGE_KEYS`: `@lavori` va rimosso dopo la migrazione e il repunting, perche' la NEXT non deve piu' scriverlo (`src/utils/cloneWriteBarrier.ts:131-143`).
- `ARCHIVIO_HIDE_ALLOWED_STORAGE_KEYS`: `@lavori` va rimosso dopo la migrazione e il repunting, perche' l'Archivio Storico deve lavorare sui record `@manutenzioni` target (`src/utils/cloneWriteBarrier.ts:157-163`).

## 8. Piano lettori indiretti - 5 categorie

Nota: il contesto operativo elenca categorie A, B, C, D, E, F. La SPEC le mantiene tutte e sei per non perdere il debito tecnico F.

| Categoria | File:riga | Modifica attesa | Gravita |
|---|---|---|---|
| A - F-bis.1 Home card | `src/next/NextHomePage.tsx:16-20`, `src/next/NextHomePage.tsx:354-388`, `src/next/NextHomePage.tsx:629-647`, `src/next/NextHomePage.tsx:724-735` | Sostituire `readNextLavoriInAttesaSnapshot()` con lettura `@manutenzioni` filtrata `stato === "daFare"`; testi visibili diventano "Manutenzioni da fare". | ALTA |
| A - F-bis.2 KPI Manutenzioni | `src/next/NextManutenzioniPage.tsx:27`, `src/next/NextManutenzioniPage.tsx:770-818`, `src/next/NextManutenzioniPage.tsx:2047-2050` | KPI "Segnalazioni aperte" non deve leggere `@lavori`; usare conteggio manutenzioni `daFare` per targa. | ALTA |
| A - F-bis.3 Centro Controllo Sinottica | `src/next/NextCentroControlloParityPage.tsx:47`, `src/next/NextCentroControlloParityPage.tsx:988-1008`, `src/next/NextCentroControlloParityPage.tsx:1520`, `src/next/NextCentroControlloParityPage.tsx:1629-1632` | `lavoriAperti` diventa lista manutenzioni `daFare`; chip per riga mezzo naviga al dettaglio manutenzione. | CRITICA |
| B - F-bis.4 Archivio Storico | `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:14-15`, `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts:67-84` | Rimuovere lettura archivio `@lavori`; includere i record migrati/nuovi dentro flusso manutenzioni con tutti gli stati. | MEDIA |
| B - F-bis.5 Dossier Mezzo sezione lavori | `src/next/domain/nextDossierMezzoDomain.ts:20-24`, `src/next/domain/nextDossierMezzoDomain.ts:623-639`, `src/next/domain/nextDossierMezzoDomain.ts:760-786`, `src/next/domain/nextDossierMezzoDomain.ts:877-925` | Sezione lavori deve derivare da `@manutenzioni` tutti gli stati, mantenendo categorie visive equivalenti. | ALTA |
| B - F-bis.6 Operativita Tecnica | `src/next/nextOperativitaTecnicaDomain.ts:4-8`, `src/next/nextOperativitaTecnicaDomain.ts:15-25`, `src/next/nextOperativitaTecnicaDomain.ts:228-255` | Sostituire `readNextMezzoLavoriSnapshot()` con modello `@manutenzioni` esteso; contatori aperti/chiusi su `stato`. | ALTA |
| B - F-bis.20 PDF Engine Dossier | `src/utils/pdfEngine.ts:2200-2206`, `src/utils/pdfEngine.ts:2223-2247`, `src/utils/pdfEngine.ts:2255-2259` | PDF Dossier non deve aspettarsi `lavoriDaEseguire/InAttesa/Eseguiti`; deve renderizzare manutenzioni `daFare/programmata/eseguita` senza cambiare impaginazione generale. | ALTA |
| C - F-bis.17 gating linkedLavoroId | `src/next/domain/nextAutistiDomain.ts:551-552`, `src/next/domain/nextAutistiDomain.ts:684-700`, `src/next/NextCentroControlloParityPage.tsx:1524-1542`, `src/next/components/NextHomeAutistiEventoModal.tsx:146-149` | Zero modifiche al nome campo: `hasLinkedLavoro` resta valido perche' il valore diventa id manutenzione. | CRITICA |
| D - writer segnalazione | `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540-1603` | Sostituire creazione `@lavori` con creazione manutenzione `daFare`; patch origine resta `linkedLavoroId`. | CRITICA |
| D - writer controllo | `src/next/autistiInbox/NextAutistiAdminNative.tsx:1605-1693` | Sostituire creazione `@lavori` con creazione manutenzione `daFare`; gestire `linkedLavoroIds` multipli. | CRITICA |
| D - writer modale Centro Controllo | `src/next/nextLavoroCreateWriter.ts:142-202`, invocato da `src/next/NextCentroControlloParityPage.tsx:2410-2419` | Sostituire `createLavoroFromEvento()` con writer manutenzione `daFare` e scope barrier nuovo. | CRITICA |
| E - UI Lavori NEXT | `src/App.tsx:38-41`, `src/App.tsx:325-329`, `src/App.tsx:379-406`, `src/next/nextData.ts:159`, `src/next/nextData.ts:549-552`, `src/next/NextLegacyStorageBoundary.tsx:20-21`, `src/next/NextLegacyStorageBoundary.tsx:212-214` | Rimuovere route/lista/sidebar/preset lavori; mantenere solo redirect compat dettaglio. | ALTA |
| F - Chat IA `chatIaMezziData` | `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:7-8`, `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:83-85`, `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:111-114`, `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:155-161` | NON toccare in questa dismissione; debito tecnico J.10. | MEDIA |
| F - InternalAiMezzoCard | `src/next/internal-ai/InternalAiMezzoCard.tsx:182-205` | NON toccare in questa dismissione; continuera' a mostrare lavori dal vecchio snapshot finche' non c'e' pulizia IA. | MEDIA |
| F - chatIaRouter | `src/next/chat-ia/core/chatIaRouter.ts:30-32` | NON toccare; keyword `lavori` resta nel debito J.10. | MEDIA |
| F - view.config | `src/next/chat-ia/config/view.config.ts:84-111`, `src/next/chat-ia/config/view.config.ts:272-282` | NON toccare; `firestore-storage-lavori-doc` resta attivo per debito J.10. | MEDIA |
| F - registry.config | `backend/internal-ai/server/lib/registry.config.js:372-381` | NON toccare; `work.lavori` resta nel debito J.10. | MEDIA |
| F - firebase readonly boundary | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:484-505`, `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:1156-1170` | NON toccare; boundary lavori resta nel debito J.10. | MEDIA |
| F - repo understanding | `backend/internal-ai/server/internal-ai-repo-understanding.js:200-203`, `backend/internal-ai/server/internal-ai-repo-understanding.js:275-282` | NON toccare; mappa route lavori resta nel debito J.10. | MEDIA |
| F - sectorFallbacks | `src/next/chat-ia/sectors/sectorFallbacks.ts:8-10` | NON toccare; testo statico resta nel debito J.10. | BASSA |

## 9. Reindirizzamento dei 3 writer

Regola generale: durante i prompt 2-4 i vecchi writer `@lavori` restano nel repo in parallelo per transizione controllata; vengono rimossi solo nel prompt 5 con la UI Lavori.

### 9.1 `createLavoroFromSegnalazione`

- File:riga attuale: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540-1603`.
- Shape attuale del record creato (`src/next/autistiInbox/NextAutistiAdminNative.tsx:1565-1582`):

```ts
{
  id,
  gruppoId,
  tipo,
  targa: tipo === "targa" ? targa : "",
  descrizione,
  dataInserimento: todayYmd(),
  eseguito: false,
  urgenza: record?.flagVerifica ? "alta" : "media",
  segnalatoDa: String(record?.autistaNome ?? record?.badgeAutista ?? "autista"),
  sottoElementi: [],
  source: {
    type: "segnalazione",
    id: record?.id ?? null,
    key: KEY_SEGNALAZIONI,
  },
}
```

- Shape target manutenzione `daFare`:

```ts
{
  id: nuovoIdManutenzione,
  targa,
  tipo: "mezzo",
  descrizione,
  data: todayYmd(),
  stato: "daFare",
  dataProgrammata: null,
  origineTipo: "segnalazione",
  origineRefId: record?.id ?? null,
  origineRefKey: "@segnalazioni_autisti_tmp",
  segnalatoDa,
  eseguitoDa: null,
  urgenza,
  km: null,
  ore: null,
  materiali: [],
  importo: null,
}
```

- Nome nuova funzione: `createManutenzioneDaFareFromSegnalazione`.
- Patch origine: mantenere `linkedLavoroId` come oggi (`src/next/autistiInbox/NextAutistiAdminNative.tsx:1594-1601`), ma valore = id manutenzione.

### 9.2 `createLavoroFromControllo`

- File:riga attuale: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1605-1693`.
- Shape attuale del record creato (`src/next/autistiInbox/NextAutistiAdminNative.tsx:1650-1666`):

```ts
{
  id: genId(),
  gruppoId,
  tipo: "targa" as const,
  targa: t,
  descrizione,
  dataInserimento: todayYmd(),
  eseguito: false,
  urgenza,
  segnalatoDa,
  sottoElementi: [],
  source: {
    type: "controllo",
    id: record?.id ?? null,
    key: KEY_CONTROLLI,
  },
}
```

- Shape target manutenzione `daFare`:

```ts
{
  id: nuovoIdManutenzione,
  targa: t,
  tipo: "mezzo",
  descrizione,
  data: todayYmd(),
  stato: "daFare",
  dataProgrammata: null,
  origineTipo: "controllo",
  origineRefId: record?.id ?? null,
  origineRefKey: "@controlli_mezzo_autisti",
  segnalatoDa,
  eseguitoDa: null,
  urgenza,
  km: null,
  ore: null,
  materiali: [],
  importo: null,
}
```

- Nome nuova funzione: `createManutenzioneDaFareFromControllo`.
- Patch origine: mantenere `linkedLavoroId` o `linkedLavoroIds` come oggi (`src/next/autistiInbox/NextAutistiAdminNative.tsx:1680-1691`), ma valori = id manutenzione.

### 9.3 `createLavoroFromEvento`

- File:riga attuale: `src/next/nextLavoroCreateWriter.ts:142-202`.
- Invocazione dal modale Centro Controllo: `src/next/NextCentroControlloParityPage.tsx:2410-2419`.
- Shape attuale costruita da `buildLavoroRecord()` (`src/next/nextLavoroCreateWriter.ts:72-102`):

```ts
{
  id: lavoroId,
  gruppoId,
  tipo,
  targa: tipo === "targa" ? targaClean : "",
  descrizione: String(input.descrizione ?? "").trim(),
  dataInserimento: todayYmd(),
  eseguito: false,
  urgenza: input.urgenza,
  segnalatoDa: String(input.segnalatoDa ?? "").trim() || "autista",
  sottoElementi: [],
  dettagli: dettagli ? dettagli : null,
  source: {
    type: input.origineTipo,
    id: String(input.origineId ?? "") || null,
    key: sourceKey,
  },
}
```

- Shape target manutenzione `daFare`:

```ts
{
  id: nuovoIdManutenzione,
  targa: normalizeTargaUp(input.targa),
  tipo: "mezzo",
  descrizione: dettagli ? `${descrizione} - ${dettagli}` : descrizione,
  data: todayYmd(),
  stato: "daFare",
  dataProgrammata: null,
  origineTipo: input.origineTipo,
  origineRefId: String(input.origineId ?? "") || null,
  origineRefKey: sourceKey,
  segnalatoDa: String(input.segnalatoDa ?? "").trim() || "autista",
  eseguitoDa: null,
  urgenza: input.urgenza,
  km: null,
  ore: null,
  materiali: [],
  importo: null,
}
```

- Nome nuova funzione: `createManutenzioneDaFareFromEvento`.
- Barrier: sostituire `LAVORO_CREATE_WRITE_SCOPE` (`src/next/nextLavoroCreateWriter.ts:7-9`) con scope manutenzione da-fare nuovo; non riusare lo scope lavori.

## 10. Rimozione UI Lavori NEXT

Route e import:

- Import da rimuovere dopo prompt 5: `NextLavoriInAttesaPage`, `NextLavoriEseguitiPage`, `NextLavoriDaEseguirePage`, `NextDettaglioLavoroPage` (`src/App.tsx:38-41`).
- Route `/next/lavori-da-eseguire`: rimuovere (`src/App.tsx:324-330`).
- Route `/next/lavori-in-attesa`: rimuovere (`src/App.tsx:378-384`).
- Route `/next/lavori-eseguiti`: rimuovere (`src/App.tsx:386-392`).
- Route `/next/dettagliolavori/:lavoroId`: mantenere come redirect compat verso `/next/manutenzioni?id=...`, come da J.4 (`src/App.tsx:394-400`).
- Divergenza codice reale: esiste anche route `/next/dettagliolavori` senza parametro che monta `NextDettaglioLavoroLegacyRedirect` (`src/App.tsx:402-406`); va gestita nello stesso redirect compat, anche se il prompt enumera 4 route.

Sidebar e path:

- Rimuovere voce sidebar `Lavori` (`src/next/nextData.ts:159`).
- Rimuovere route lavori da path accessibili `nextData` (`src/next/nextData.ts:549-552`).
- Rimuovere costanti strutturali lavori (`src/next/nextStructuralPaths.ts:19-22`) solo quando nessun import runtime resta.

File da eliminare nel prompt 5:

- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/next-lavori.css`

Barrier da rimuovere nel prompt 5:

- `LAVORI_ALLOWED_WRITE_PATHS` (`src/utils/cloneWriteBarrier.ts:2-7`).
- `isAllowedLavoriCloneWritePath()` (`src/utils/cloneWriteBarrier.ts:240-245`).
- Regola finale `@lavori` (`src/utils/cloneWriteBarrier.ts:689-691`).
- `LAVORO_CREATE_ALLOWED_WRITE_PATH`, `LAVORO_CREATE_ALLOWED_STORAGE_KEYS`, `LAVORO_CREATE_WRITE_SCOPE` (`src/utils/cloneWriteBarrier.ts:145-151`) e ramo allowance (`src/utils/cloneWriteBarrier.ts:520-526`).

Altre rimozioni collegate:

- Rimuovere `@lavori` da `DELETE_MEZZO_ALLOWED_STORAGE_KEYS` (`src/utils/cloneWriteBarrier.ts:131-143`) dopo migrazione e repunting.
- Rimuovere `@lavori` da `ARCHIVIO_HIDE_ALLOWED_STORAGE_KEYS` (`src/utils/cloneWriteBarrier.ts:157-163`) dopo repunting Archivio.
- Rimuovere import e override preset `lavori` da `NextLegacyStorageBoundary`: import `readNextLavoriLegacyDataset` a `src/next/NextLegacyStorageBoundary.tsx:20`, override `@lavori` a `src/next/NextLegacyStorageBoundary.tsx:212-214`.

## 11. Ordine di esecuzione dei 5 prompt Codex operativi

1. Estensione shape `@manutenzioni`
   - Obiettivo: aggiungere campi `stato`, `dataProgrammata`, `origineTipo`, `origineRefId`, `origineRefKey`, `segnalatoDa`, `eseguitoDa`, `urgenza`; aggiornare normalizzatori e payload senza cambiare UI Lavori.
   - Dipendenze: SPEC approvata.
   - Perimetro file: `src/next/domain/nextManutenzioniDomain.ts`, `src/utils/cloneWriteBarrier.ts`, eventuali tipi consumer strettamente necessari.
   - Taglia: L.
   - Rischi principali: rottura storico esistente `@manutenzioni`, confusione tra `eseguito` stringa e `stato`, campi opzionali non propagati.

2. Nuovi writer `manutenzione daFare`
   - Obiettivo: introdurre writer da segnalazione, da controllo e da modale Centro Controllo verso `@manutenzioni`; i vecchi writer `@lavori` restano nel repo.
   - Dipendenze: prompt 1 chiuso.
   - Perimetro file: `src/next/autistiInbox/NextAutistiAdminNative.tsx`, nuovo o sostitutivo writer vicino a `src/next/nextLavoroCreateWriter.ts`, `src/next/components/NextHomeAutistiEventoModal.tsx`, `src/next/NextCentroControlloParityPage.tsx`, `src/utils/cloneWriteBarrier.ts`.
   - Taglia: M.
   - Rischi principali: scope barrier troppo largo, backlink non aggiornato, creazione duplicata da controllo con piu' targhe.

3. Migrazione una tantum
   - Obiettivo: migrare 18 record `@lavori` in `@manutenzioni`; riscrivere tutti i backlink validi verso id manutenzione, cioe' record origine il cui `linkedLavoroId` o `linkedLavoroIds` punta a uno dei 18 lavori migrati. Nessuna migrazione localStorage J.11: key `@next_clone_lavori:records` verificata assente.
   - Dipendenze: prompt 1 chiuso; prompt 2 chiuso o writer nuovi disattivati durante run.
   - Perimetro file: script one-off sotto `scripts/oneoff/` da creare, eseguire e rimuovere; nessun runtime.
   - Taglia: L.
   - Rischi principali: idempotenza, record `sottoElementi` non vuoti, backlink orfani, collisione id.

4. Repunting lettori indiretti categorie A e B
   - Obiettivo: Home, KPI Manutenzioni, Centro Controllo, Archivio Storico, Dossier, Operativita Tecnica, PDF Dossier leggono `@manutenzioni`, non `@lavori`.
   - Dipendenze: prompt 3 chiuso con report Firestore e backlink.
   - Perimetro file: file categoria A/B del capitolo 8, piu' eventuali tipi condivisi.
   - Taglia: L.
   - Rischi principali: doppio conteggio, route dettaglio ancora lavori, testi visibili non aggiornati in italiano.

GATE MANUALE OBBLIGATORIO tra prompt 4 e prompt 5:

- Aprire `/next`: la card deve mostrare "Manutenzioni da fare" e conteggi da `@manutenzioni` `stato="daFare"`; OK/NO.
- Aprire `/next/manutenzioni`: KPI "Segnalazioni aperte" deve riflettere manutenzioni `daFare` per targa; OK/NO.
- Aprire `/next/centro-controllo`: chip lavori urgenti/da fare deve leggere manutenzioni `daFare`; OK/NO.
- Aprire una segnalazione con `linkedLavoroId`: il gating deve ancora impedire doppia creazione; OK/NO.
- Aprire Archivio Storico: i 18 record migrati devono apparire nel dominio manutenzioni/stati corretti, non come lettura `@lavori`; OK/NO.
- Aprire Dossier Mezzo e PDF Dossier: sezioni ex lavori devono renderizzare senza crash e senza leggere `@lavori`; OK/NO.
- Verificare che nessun nuovo record operativo NEXT venga scritto in `@lavori`; OK/NO.
- Solo Giuseppe puo' autorizzare il prompt 5 dopo questi controlli.

5. Rimozione UI Lavori NEXT
   - Obiettivo: eliminare route, sidebar, pagine, CSS, dominio `nextLavoriDomain`, deroghe barrier lavori; lasciare redirect compat `/next/dettagliolavori/:id -> /next/manutenzioni?id=...`.
   - Dipendenze: gate manuale completato con tutti OK.
   - Perimetro file: `src/App.tsx`, `src/next/nextData.ts`, `src/next/nextStructuralPaths.ts`, sei file Lavori, `src/next/NextLegacyStorageBoundary.tsx`, `src/utils/cloneWriteBarrier.ts`.
   - Taglia: M.
   - Rischi principali: link morti, import orfani, route senza parametro non gestita, barrier stale.

## 12. Verifiche di chiusura

Checklist standard:

1. Route ufficiali NEXT verificate nel codice reale.
2. Nessuna route ufficiale target monta runtime legacy come finale.
3. Nessun import da `src/pages/**` introdotto.
4. UI esterna verificata su schermate principali.
5. Flussi principali verificati a runtime.
6. Modali principali verificati a runtime.
7. PDF principali verificati senza crash.
8. Layer NEXT puliti usati davvero.
9. Barrier coerente con writer attivi.
10. Audit separato o verifica indipendente prima di dichiarare chiusura totale.

Checklist specifica dismissione:

1. `rg "@lavori|readNextLavori|nextLavoriDomain" src/next src/utils` non deve trovare letture operative NEXT, esclusi debiti Chat IA dichiarati in capitolo 13.
2. `@manutenzioni` contiene 18 record migrati con `stato` corretto: 10 `daFare`, 8 `eseguita`.
3. I 18 record migrati hanno `km: null` e `ore: null`, coerente col conteggio Firestore reale.
4. Nessun record migrato contiene `gruppoId`.
5. Nessun record migrato introduce `tipo: "magazzino"`; se compare, la migrazione deve essere `DA VERIFICARE`.
6. Tutti i backlink validi delle segnalazioni sono riscritti (= record origine il cui `linkedLavoroId` e' presente nei 18 lavori migrati); eventuali orfani preesistenti restano documentati nel report.
7. Tutti i backlink validi dei controlli sono riscritti (= record origine il cui `linkedLavoroId`/`linkedLavoroIds` e' presente nei 18 lavori migrati); eventuali orfani preesistenti restano documentati nel report.
8. Home mostra "Manutenzioni da fare" e non naviga a `/next/lavori-in-attesa`.
9. Centro Controllo non scrive piu' `@lavori` da modale evento.
10. `/next/dettagliolavori/:id` redirige a `/next/manutenzioni?id=...`.
11. `src/utils/cloneWriteBarrier.ts` non contiene piu' scope `LAVORO_CREATE_*` dopo prompt 5.
12. `NextLegacyStorageBoundary` non inietta piu' preset `lavori`.

## 13. Debito tecnico aperto

- Chat IA Zero-Invenzioni resta intoccata in questa dismissione come da J.10 (`docs/DIARIO_DECISIONI.md:463-464`).
- Entry registry `work.lavori` resta in `backend/internal-ai/server/lib/registry.config.js:372-381`.
- Boundary `firestore-storage-lavori-doc` resta in `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:1156-1170`.
- `view.config.ts` resta con `firestore-storage-lavori-doc` e `site_jobs` (`src/next/chat-ia/config/view.config.ts:84-111`, `src/next/chat-ia/config/view.config.ts:272-282`).
- `chatIaRouter.ts` resta con keyword `lavori` (`src/next/chat-ia/core/chatIaRouter.ts:30-32`).
- `sectorFallbacks.ts` resta con testo che cita lavori (`src/next/chat-ia/sectors/sectorFallbacks.ts:8-10`).
- `chatIaMezziData.ts` resta con sorgente `storage/@lavori + storage/@manutenzioni` (`src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:111-114`).
- `internal-ai-repo-understanding.js` resta con route lavori (`backend/internal-ai/server/internal-ai-repo-understanding.js:200-203`, `backend/internal-ai/server/internal-ai-repo-understanding.js:275-282`).
- Eventuale refactor impaginazione PDF resta fuori: J.3 mantiene impaginazione invariata in questo giro (`docs/DIARIO_DECISIONI.md:442-443`).
- `@lavori` Firestore resta vivo; nessuna cancellazione collection.
- Pulizia 24 backlink orfani preesistenti (17 segnalazioni + 7 controlli) il cui linkedLavoroId punta a lavori non piu' esistenti; task separato, fuori scope dismissione; elenco completo in docs/_live/REPORT cap 16.

## 14. Cosa NON si fa (controllo anti-ambito)

- Non si tocca `src/pages/**`.
- Non si cancella `@lavori` da Firestore.
- Non si tocca il sottosistema Chat IA Zero-Invenzioni in questa dismissione.
- Non si rinomina `linkedLavoroId`.
- Non si rifanno impaginazione PDF e layout generale del "Quadro manutenzioni".
- Non si introduce `gruppoId` in `@manutenzioni`.
- Non si introduce `tipo: "magazzino"` in `@manutenzioni` per i 18 record migrati; il caso resta solo vincolo difensivo per dati imprevisti.
- Non si stimano km dai rifornimenti o da altre fonti.
- Non si duplicano foto su Storage.
- Non si aggiungono dipendenze, script npm, regole Firestore o build step.
