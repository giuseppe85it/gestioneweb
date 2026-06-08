# HANDOFF CANTIERE C - PUNTO UNICO DI LETTURA

Data: 2026-06-08

Perimetro: sola lettura su codice e documenti di stato. Nessuna lettura Firestore necessaria per questo handoff: lo stato dati viene citato dai report esecutivi gia' presenti nel repo.

Riferimenti da non ricopiare:
- `docs/PIANO_PROBLEMI_APERTI_2026-06-06.md`
- `docs/AUDIT_STATO_PROBLEMI_2026-06-06.md`
- `docs/AUDIT_FLUSSO_CICLO_VITA_2026-06-05.md`
- `docs/PIANO_RISANAMENTO_FLUSSO_2026-06-05.md`
- `docs/ESITO_RIPARAZIONE_DATI_2026-06-06.md`
- `docs/ESITO_GOMME_D1_2026-06-07.md`
- `docs/ESITO_GOMME_STEP2TER_2026-06-07.md`
- `docs/copia questi nel progetto in chat/DIARIO_DECISIONI.md`

Nota di verifica: in `docs/PIANO_PROBLEMI_APERTI_2026-06-06.md` non e' stata trovata la stringa letterale `Cantiere C`; il file contiene comunque problemi aperti collegati al flusso. La decisione esplicita C0 prima di C1 e' tracciata in `docs/copia questi nel progetto in chat/DIARIO_DECISIONI.md:672-679`.

## 1. PERCHE' - IL PROBLEMA DI FONDO

Il Cantiere C nasce da una malattia strutturale: segnalazioni e manutenzioni vengono lette da molte superfici NEXT, ma ogni superficie ricalcola in autonomia pezzi semantici che dovrebbero essere unici:

- qual e' la targa reale del record;
- se il record e' aperto, chiuso, eseguito, storico o chiuso da evento;
- quale data usare per apertura, presa in carico, esecuzione o chiusura;
- quali legami esistono tra segnalazione/controllo e manutenzione;
- quale famiglia ha una manutenzione: mezzo, gomme, compressore, attrezzature;
- quale parola mostrare in UI per lo stesso fatto.

Questa duplicazione genera una famiglia di bug, non bug isolati. I sintomi storici reali sono documentati:

- rimorchi visibili sotto targa esatta o "Tutte", ma non sotto motrice: limite di interpretazione targa, `docs/AUDIT_STATO_PROBLEMI_2026-06-06.md:33-39`;
- chiusure lette tramite piu' campi (`chiusa`, `stato`, `chiusuraData`, `dataChiusura`), poi rese innocue solo dal reader robusto, `docs/AUDIT_STATO_PROBLEMI_2026-06-06.md:69` e `:110-113`;
- due meccanismi di chiusura segnalazione convivono e sono riconciliati solo a livello reader, `docs/AUDIT_STATO_PROBLEMI_2026-06-06.md:144`;
- quattro parole per "e' finito": "Eseguita", "Chiusa", "Risolta", "Chiusa da evento", `docs/AUDIT_FLUSSO_CICLO_VITA_2026-06-05.md:28` e `:140-151`;
- doppio reader di `@manutenzioni`: `toLegacyDatasetRecord` per lista e `toHistoryItem` per mappa, `docs/AUDIT_FLUSSO_CICLO_VITA_2026-06-05.md:94`.

Quindi il Cantiere C non deve partire da una patch su una singola pagina. Deve prima produrre C0: mappa completa dei punti che leggono o ricalcolano, poi C1: centralina/reader unico, migrata superficie per superficie.

## 2. CENSIMENTO REALE - CHI LEGGE/RICALCOLA OGGI

### 2.1 Reader principali di `@manutenzioni`

| Punto | Righe | Cosa calcola oggi | Note Cantiere C |
| --- | --- | --- | --- |
| `src/next/domain/nextManutenzioniDomain.ts` - `toLegacyDatasetRecord` | `620-704` | targa, descrizione, data, km, tipo, stato, origine, chiusura, famiglia gomme, assi, gomme per asse | Primo reader reale di `@manutenzioni`; usato da Manutenzioni, Archivio, Centro Controllo parity e altri consumer. |
| `src/next/domain/nextManutenzioniDomain.ts` - `toHistoryItem` | `737-803` | targa, timestamp, descrizione, stato, origine, chiusura, famiglia gomme | Secondo reader reale di `@manutenzioni`; usato da Dossier, gomme, timeline mezzo. E' il doppio reader citato nell'audit. |
| `src/next/domain/nextManutenzioniDomain.ts` - `readNextMezzoManutenzioniSnapshot` | `850-900` | filtra per targa normalizzata, ordina storico, conta record con km/ore/materiali/gomme | Base Dossier e domini mezzo. |
| `src/next/domain/nextManutenzioniDomain.ts` - `readNextManutenzioniLegacyDataset` | `903-937` | legge tutto `@manutenzioni`, normalizza con `toLegacyDatasetRecord`, ordina per data | Base per Da fare, Archivio e ricerche. |
| `src/next/domain/nextManutenzioniDomain.ts` - `readNextManutenzioniDaFareSnapshot` | `939-944` | filtra `stato === "daFare"` | Reader di stato operativo. |
| `src/next/domain/nextManutenzioniDomain.ts` - `readNextManutenzioniDaFareAndProgrammataGlobalSnapshot` | `946-950` | filtra `daFare` o `programmata` | Reader di Manutenzioni NEXT. |
| `src/next/domain/nextOperativitaGlobaleDomain.ts` - `toMaintenanceItem` | `261-305` | rilegge `@manutenzioni` in shape propria: targa, data, fornitore, gomme, qualita' | Terzo normalizer operativo separato, da assorbire o disaccoppiare nel Cantiere C. |

### 2.2 Targa

| Punto | Righe | Cosa calcola oggi |
| --- | --- | --- |
| `src/next/domain/nextAutistiDomain.ts` - `normalizeOptionalTarga` | `263-266` | normalizza una targa tramite `normalizeNextMezzoTarga`. |
| `src/next/domain/nextAutistiDomain.ts` - mapping segnalazione | `580-584` | espone `targa`, `targaCamion`, `targaRimorchio` nello snapshot autisti. |
| `src/next/domain/nextCentroControlloDomain.ts` - `normalizeOptionalTarga` | `380-383` | normalizza targa per Centro Controllo. |
| `src/next/domain/nextCentroControlloDomain.ts` - `normalizeSegnalazioneRecord` | `765-800` | usa `record.targa ?? record.targaCamion ?? record.targaRimorchio`. |
| `src/next/domain/nextCentroControlloDomain.ts` - `buildControlloDisplayTarga` | `889-900` | sceglie motrice/rimorchio in base a `target`. |
| `src/next/NextManutenzioniPage.tsx` - `segnalazioniEleggibili` / `segnalazioniDaFareByTarga` | `1655-1709` | filtra e raggruppa segnalazioni usando `item.targa`. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` - `getAggancioTargaAdmin` | `1586-1595` | calcola targa di aggancio da segnalazione o controllo. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` - `buildMergeOrigineRecord` | `1808-1814` | ricalcola targa per merge sorgente -> manutenzione. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx` - `normalizeTargaCompare` | `50-75` | confronta targa segnalazione e targa camion per mostrare traino/rimorchio. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` - `SegnalazioneExpanded` | `346-353` | ricostruisce targa con fallback `targa`, `targaCamion`, `targaRimorchio`. |
| `src/next/centroControllo/archivioStorico/hooks/useArchivioData.ts` | `97-106` | costruisce mappa flotta per targa uppercase. |
| `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx` | `444-446`, `673-678` | opzioni filtro e metadata mezzo basati su targa normalizzata in UI. |

### 2.3 Stato aperto/chiuso/eseguito

| Punto | Righe | Cosa calcola oggi |
| --- | --- | --- |
| `src/next/domain/nextManutenzioniDomain.ts` - `sanitizeManutenzioneStato` | `527-538` | ammette solo `daFare`, `programmata`, `eseguita`, `chiusa_da_evento`. |
| `src/next/domain/nextAutistiDomain.ts` - mapping segnalazione | `591-604` | crea `stato` uppercase e deriva `chiusa` da `chiusa`, `stato==="chiusa"`, `chiusuraData`, `chiusuraRefId`. |
| `src/next/domain/nextAutistiDomain.ts` - mapping controllo | `757-770` | deriva KO, `chiuso`, `dataChiusura`, `stato`, `chiusura*`. |
| `src/next/domain/nextCentroControlloDomain.ts` - `isSegnalazioneNuova` / `normalizeSegnalazioneRecord` | `742`, `765-800` | considera nuova se `stato === "nuova"` o `letta === false`; flagga gia' lette/chiuse. |
| `src/next/NextMappaStoricoPage.tsx` - `isClosedSegnalazioneSource` | `210-224` | considera chiusa se `stato === "chiusa"` o `chiusa === true` o `chiusuraData` presente. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx` | `90-96`, `193-200` | mostra ricevuta da `letta/stato`, ma mostra chiusura solo se `data.chiusa === true`; la frase storia usa invece helper robusto. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` | `328-330`, `480-490` | mostra chiusura solo da `data.chiusa === true`, poi stato corrente da `data.stato`. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx` - `statoLabel` | `57-65` | mappa stati manutenzione in label proprie, incluso fallback "STORICO". |
| `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx` - `formatManutenzioneStatoLabel` | `191-199` | mappa gli stessi stati in altra forma ("Da fare", "Chiusa da evento", "Eseguita", "Storico"). |
| `src/next/centroControllo/archivioStorico/ArchivioFeed.tsx` - `mapSegnalazioneToPdfRow` | `247-276` | label PDF segnalazione: `Chiusa`, `Manutenzione generata`, `Aperta`. |
| `src/next/helpers/formatStatoManutenzione.ts` | `12-17` | helper display separato per fallback "Storico", non semantica dati. |

### 2.4 Date

| Punto | Righe | Cosa calcola oggi |
| --- | --- | --- |
| `src/next/domain/nextAutistiDomain.ts` - `toTimestamp` | `278-294` | normalizza numeri secondi/ms e stringhe parseabili. |
| `src/next/domain/nextAutistiDomain.ts` - segnalazioni | `581`, `605-612`, `616` | timestamp da `timestamp ?? data`; `dataChiusura = dataChiusura ?? chiusuraData`; `chiusuraData` normalizzata. |
| `src/next/domain/nextAutistiDomain.ts` - controlli | `751`, `765`, `770` | timestamp e chiusure per controlli. |
| `src/next/NextManutenzioniPage.tsx` - `getMaintenancePdfDateValue` | `599-632` | sceglie data PDF con ordini diversi per chiusa da evento, operativa o storica. |
| `src/next/NextManutenzioniPage.tsx` - `formatPdfChiusuraDateLabel` | `635-638` | data chiusura PDF da `chiusuraData` o `dataEsecuzione`. |
| `src/next/NextManutenzioniPage.tsx` - `formatSegnalazioneDateLabel` | `3187-3190` | data segnalazione da timestamp snapshot. |
| `src/next/NextMappaStoricoPage.tsx` - `sourceDateLabel` | `191-193` | data origine da `dataInserimento`, `createdAt`, `timestamp`, `data`, `dataProgrammata`. |
| `src/next/NextMappaStoricoPage.tsx` - `resolveMappaStoricoChiusuraData` | `228-240` | chiusura da `chiusuraData`, poi `dataEsecuzione`, poi `data`. |
| `src/next/helpers/frasestoriaRecord.ts` - `recordChiusoFromRaw` | `189-288` | data apertura, presa in carico, esecuzione e evento chiusura con fallback cross-read su sorgente. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx` | `67`, `193-200` | data apertura da timestamp, data chiusura timeline da `data.dataChiusura`. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` | `279-288` | `segnalazioneToRecordChiuso` usa `dataChiusura` per esecuzione/evento. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowManutenzione.tsx` | `90-97`, `119-135`, `220-230` | title chiusura da evento da `chiusuraData`; timeline manutenzione da timestamp estratto. |

### 2.5 Legami

| Punto | Righe | Cosa calcola oggi |
| --- | --- | --- |
| `src/next/helpers/cicloLegame.ts` - `readLegameOrigine` | `93-105` | back-link manutenzione -> sorgente da `origineTipo/origineRefId/origineRefKey`. |
| `src/next/helpers/cicloLegame.ts` - `readLegamiOrigine` | `107-132` | legge `origineRefs[]`; fallback su campi legacy singoli. |
| `src/next/helpers/cicloLegame.ts` - `readLegameLavoro` | `135-151` | forward-link sorgente -> manutenzione da `linkedLavoroId` e `linkedLavoroIds`. |
| `src/next/helpers/cicloLegame.ts` - `readChiusuraTrace` | `154-170` | traccia chiusura da `chiusuraDi/chiusuraRefId/chiusuraData`. |
| `src/next/helpers/cicloLegame.ts` - writer helper | `177-242` | scrive shape canoniche, ma C2 vieta unificazione writer senza nuova decisione. |
| `src/next/domain/nextManutenzioniDomain.ts` - `toLegacyDatasetRecord` | `658-667`, `683-692` | inserisce origine e chiusura nella projection legacy. |
| `src/next/domain/nextManutenzioniDomain.ts` - `toHistoryItem` | `770`, `794-802` | inserisce origine e chiusura nella projection history. |
| `src/next/NextManutenzioniPage.tsx` - pannello origini | `1543-1550`, `5254-5285` | usa `origineRefs` o fallback campi singoli per mostrare sorgenti. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowSegnalazione.tsx` | `94-96` | legge forward-link con `readLegameLavoro`. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` | `321-363` | rilegge `@manutenzioni` e usa `readLegameLavoro` per rilevare legami/orfani e candidati. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` - aggancio evento | `1647-1664` | chiude segnalazione/controllo da evento gomme. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` - crea da fare | `1694-1740` | crea manutenzione da segnalazione/controllo, poi ricarica sorgente. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` - merge | `1780-1800` | aggancia sorgente a manutenzione esistente e ricarica sorgente. |

### 2.6 Famiglia manutenzione

| Punto | Righe | Cosa calcola oggi |
| --- | --- | --- |
| `src/next/domain/nextManutenzioniDomain.ts` - `isCambioGommeDerived` | `443-445` | deduce gomme dal testo `CAMBIO GOMME`, `GOMME`, `PNEUM`. |
| `src/next/domain/nextManutenzioniDomain.ts` - `toLegacyDatasetRecord` | `625-654`, `701-704` | risolve tipo gomme, assi, gomme per asse e straordinario. |
| `src/next/domain/nextManutenzioniDomain.ts` - `toHistoryItem` | `744-759`, `787-791` | calcola `isCambioGommeDerived`, assi/gomme, tipo intervento. |
| `src/next/NextManutenzioniPage.tsx` - `resolvePdfMaintenanceTypeLabel` | `294-305` | classifica PDF come gomme/compressore/attrezzature/mezzo. |
| `src/next/NextManutenzioniPage.tsx` - `deriveUiSubtype` | `832-852` | deriva sottotipo UI da marker gomme o parole in descrizione. |
| `src/next/NextManutenzioniPage.tsx` - `mapLegacyRecordToGommeReadModel` | `1097-1129` | crea read model gomme dalla projection legacy, includendo anche derivazione testo. |
| `src/next/NextMappaStoricoPage.tsx` - `isTyreMaintenanceRecord` | `376-382` | considera gomme da assi, gomme per asse, tipo intervento o `tipo==="gomme"`. |
| `src/next/domain/nextManutenzioniGommeDomain.ts` - `toMaintenanceItem` | `982-1027` | converte `NextMaintenanceHistoryItem` in item read-only gomme/manutenzione. |
| `src/next/domain/nextManutenzioniGommeDomain.ts` - `toGommeItems` | `1029-1038` | produce item gomme ordinario/straordinario. |
| `src/next/domain/nextManutenzioniGommeDomain.ts` - `resolveExternalTyreEvent` | `1321-1365` | legge eventi gomme esterni da tmp/ufficiale e calcola asse, quantita', marca, km, autista. |
| `src/next/domain/nextManutenzioniGommeDomain.ts` - `readNextMezzoManutenzioniGommeSnapshot` | `1501-1546` | unisce storico manutenzioni, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, deduplica e produce vista gomme. |
| `src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx` - `ManutenzioneExpanded` | `80-100` | mostra blocco gomme se ci sono assi, gomme per asse, straordinario o tipo gomme. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` - `hasGommeKeywordAdmin` | `1559-1576` | deduce contenuto gomme da descrizione/tipo/check, usato in superficie admin autisti. |

### 2.7 Superfici coperte e reader usati

| Superficie | File | Reader / ricalcoli |
| --- | --- | --- |
| Da fare / Manutenzioni NEXT | `src/next/NextManutenzioniPage.tsx` | `readNextManutenzioniDaFareAndProgrammataGlobalSnapshot`, grouping segnalazioni, subtype/famiglia, PDF date, origini. |
| Mappa / Storico | `src/next/NextMappaStoricoPage.tsx` | chiusura sorgenti, date chiusura, famiglia gomme, dettaglio gomme. |
| Archivio Storico | `src/next/centroControllo/archivioStorico/**` | `readNextManutenzioniLegacyDataset`, `readNextAutistiReadOnlySnapshot`, propri label stato, legami, targa, PDF. |
| Centro Controllo | `src/next/domain/nextCentroControlloDomain.ts` | snapshot segnalazioni/controlli/sessioni; targa, stato nuova, KO, preview. |
| Inbox autisti NEXT/admin | `src/next/autistiInbox/NextAutistiAdminNative.tsx` | legge `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti`, modifica record admin, crea/merge manutenzioni, aggancia eventi. |
| Dossier mezzo | `src/next/domain/nextDossierMezzoDomain.ts` | usa `readNextMezzoManutenzioniSnapshot` e `readNextMezzoManutenzioniGommeSnapshot`; riclassifica pending/done. |
| Gomme Dossier | `src/next/domain/nextManutenzioniGommeDomain.ts` | unisce manutenzioni e eventi gomme, deduplica, converte legacy view. |
| Frasi storia | `src/next/helpers/frasestoriaRecord.ts` | cross-read date/autore/stato/chiusura con fallback multipli. |
| IA interna / tool ricerca | `src/next/chat-ia/tools/registry/*`, `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts` | riusano reader manutenzioni esistenti; da includere nella migrazione solo dopo stabilizzazione del reader unico. |

## 3. STATO ATTUALE DEI DATI

La chat nuova deve partire da questo assunto operativo, basato sui report presenti nel repo:

- segnalazioni/controlli/manutenzioni sono stati riparati nel ciclo dati del 2026-06-06: `docs/ESITO_RIPARAZIONE_DATI_2026-06-06.md:16`;
- la riparazione ha scritto origine/legami su record approvati, es. `_origineRefs` in `docs/ESITO_RIPARAZIONE_DATI_2026-06-06.md:356`;
- il ramo gomme in `@manutenzioni` e' stato bonificato con marker strutturati sui record approvati, `docs/ESITO_GOMME_D1_2026-06-07.md:40-60`;
- il confronto esteso gomme ha censito eventi e key collegate, `docs/ESITO_GOMME_D1_2026-06-07.md:71-88`;
- lo step finale gomme ha importato TI282780 in `@manutenzioni` e ripulito i test in `@cambi_gomme_autisti_tmp` / `@gomme_eventi`, con conteggi finali `@manutenzioni 82 -> 83`, tmp `14 -> 8`, eventi `14 -> 11`, `docs/ESITO_GOMME_STEP2TER_2026-06-07.md:31-43`.

Questo non chiude il Cantiere C. Significa solo che il lavoro strutturale puo' partire da dati ripuliti rispetto ai bug di giugno. Il problema residuo e' codice: molte letture equivalenti continuano a vivere in punti diversi.

## 4. DECISIONI GIA' PRESE - VINCOLANTI

1. C0 prima di C1. Prima serve analisi completa: inbox autisti NEXT, Manutenzioni, Centro Controllo, Archivio, Mappa/Storico, Dossier, frasi storia e domini. La decisione e' in `docs/copia questi nel progetto in chat/DIARIO_DECISIONI.md:679`.
2. Niente centralina costruita su assunzioni. La centralina C1 va progettata solo dopo la mappa reale.
3. Migrazione graduale superficie per superficie. Vietato big-bang su tutte le viste.
4. C2: non unificare le scritture di chiusura in writer unico senza nuova decisione esplicita. Per ora il Cantiere C centralizza la LETTURA.
5. Vocabolario D5a: "manutenzione" ovunque e "Eseguita" per finito sono etichette UI, non migrazione dati. Riferimento: `docs/PIANO_RISANAMENTO_FLUSSO_2026-06-05.md:22-23`, `:49`, `:130`.
6. Chiavi dato intoccabili: `linkedLavoroId`, `linkedLavoroIds`, `origineTipo`, `origineRefId`, `origineRefKey`, `origineRefs`, `fornitore`, `chiusuraDi`, `chiusuraRefId`, `chiusuraData`, `dataChiusura`, `chiusa`, `chiusa_by`, e key storage reali. Riferimento: `docs/PIANO_RISANAMENTO_FLUSSO_2026-06-05.md:49`.
7. Campi nuovi solo additivi e solo se il prodotto li approva.

## 5. VINCOLI TECNICI

- La NEXT non e' piu' globalmente read-only, ma ogni scrittura business si apre modulo per modulo con dataset e operazioni dichiarate: `AGENTS.md:11-13`.
- `src/utils/cloneWriteBarrier.ts` resta il controllo esplicito delle scritture NEXT. Scope rilevanti gia' presenti: chiusura da evento, gruppo segnalazioni, aggancio/sgancio legame Centro Controllo, `src/utils/cloneWriteBarrier.ts:160-170`, `:482-510`, `:575-599`.
- Le scritture Firebase devono passare dai wrapper: `src/utils/firestoreWriteOps.ts:15-42` e `src/utils/storageWriteOps.ts:20-56`.
- Gate build canonico: `npm run build`, che in `package.json:11` equivale a `tsc -b && vite build`. La regola e' anche in `AGENTS.md:95`.
- Backup solo in `C:\tmp`, mai `.bak` nel repo: `docs/copia questi nel progetto in chat/DIARIO_DECISIONI.md:681-682`.
- Commit a fine lotto verde; push = deploy e va fatto solo con build verde: `docs/copia questi nel progetto in chat/DIARIO_DECISIONI.md:668`.
- Madre intoccabile: il Cantiere C riguarda il perimetro NEXT e le letture che oggi alimentano le superfici NEXT.

## 6. PRIMO PASSO SUGGERITO PER LA CHAT NUOVA

Il primo lavoro e' C0 completo, non C1.

Checklist C0:

1. Prendere questa sezione 2 come mappa iniziale.
2. Verificare con `rg` aggiornato che non siano comparsi nuovi reader o calcoli autonomi dopo questo handoff.
3. Verificare empiricamente le letture di:
   - Manutenzioni NEXT;
   - Centro Controllo;
   - Archivio Storico;
   - Mappa/Storico;
   - Dossier mezzo;
   - inbox autisti NEXT/admin;
   - frasi storia.
4. Definire il contratto del punto unico di lettura:
   - input raw segnalazione/manutenzione/controllo;
   - output normalizzato: targa, stato canonico display, stato dati reale, date, legami, famiglia, origine, label UI.
5. Migrare una superficie alla volta, partendo da quella con minor blast radius.
6. Solo dopo C0 approvato progettare C1.

Proposta di contratto C1, da non implementare senza nuovo prompt:

```ts
type LetturaCicloRecord = {
  id: string;
  kind: "segnalazione" | "controllo" | "manutenzione";
  targa: string | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  statoDato: string | null;
  statoDisplay: "Nuova" | "In lavorazione" | "Eseguita" | "Storico" | "Da verificare";
  isAperta: boolean;
  isChiusa: boolean;
  date: {
    apertura: unknown;
    presaInCarico: unknown;
    esecuzione: unknown;
    chiusura: unknown;
  };
  legami: {
    forwardManutenzioneIds: string[];
    origineRefs: Array<{ tipo: "segnalazione" | "controllo"; refKey: string | null; refId: string }>;
    chiusura: { chiusuraDi: string; chiusuraRefId: string | null; chiusuraData: number | null } | null;
  };
  famiglia: "mezzo" | "gomme" | "compressore" | "attrezzature" | "altro";
};
```

Questo contratto e' una proposta di forma, non una decisione implementativa.
