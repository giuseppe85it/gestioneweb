# SPEC SETTORE MEZZI - CHAT IA NEXT

## 0. INTRODUZIONE

### Scopo

Questa spec definisce il primo runner settoriale reale della nuova Chat IA NEXT: il settore Mezzi. Il runner deve trasformare un prompt libero dell'utente in una risposta operativa su un mezzo, senza aprire menu o moduli esterni, usando l'ossatura gia' implementata sotto `src/next/chat-ia/`.

Obiettivo funzionale: la chat deve sostituire e superare l'uso pratico di Mezzo 360 per le richieste rapide su una targa, producendo card, tabelle, timeline e report archiviabili.

### Cosa NON copre

- Lettura live Firestore dei documenti come in Mezzo 360: la v1 usa un reader clone-safe dedicato.
- Timeline completa a 12 dataset in v1: la v1 porta solo le sorgenti mezzo-centriche piu' stabili.
- Scritture business su mezzi, lavori, materiali o manutenzioni: il settore legge e compone, non modifica dati operativi.
- Modifiche alla madre, ad Archivista, al backend OpenAI o ai reader D01-D10.

### Riferimenti

- Telaio costituzionale: `docs/product/MAPPA_IA_CHAT_NEXT.md`.
- Audit rifacimento chat: `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`.
- Ossatura implementata: `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`.
- Vecchio riferimento funzionale: `src/pages/Mezzo360.tsx`.

### Versione

- Versione: `v1.0`
- Data: `2026-04-28`
- Stato: spec implementabile, nessuna modifica codice inclusa.

## 1. STRUTTURA CARTELLE SETTORE

Il settore vive sotto:

```text
src/next/chat-ia/sectors/mezzi/
  README.md
  chatIaMezziRunner.ts
  chatIaMezziTypes.ts
  chatIaMezziTarga.ts
  chatIaMezziData.ts
  chatIaMezziTimeline.ts
  chatIaMezziReport.ts
  ChatIaMezzoCard.tsx
  ChatIaMezzoTimeline.tsx
  ChatIaMezzoMaterialsTable.tsx
  ChatIaMezzoDocumentsList.tsx
```

File da creare:

- `chatIaMezziRunner.ts`: runner `ChatIaSectorRunner`; massimo atteso 250 righe.
- `chatIaMezziTypes.ts`: tipi locali del settore; massimo atteso 180 righe.
- `chatIaMezziTarga.ts`: normalizzazione e fuzzy match targa; massimo atteso 120 righe.
- `chatIaMezziData.ts`: lettura e composizione snapshot dai reader NEXT; massimo atteso 300 righe.
- `chatIaMezziTimeline.ts`: costruzione timeline v1; massimo atteso 220 righe.
- `chatIaMezziReport.ts`: costruzione `ChatIaReport`; massimo atteso 250 righe.
- `ChatIaMezzoCard.tsx`: wrapper visuale della card mezzo; massimo atteso 220 righe.
- `ChatIaMezzoTimeline.tsx`: rendering timeline; massimo atteso 180 righe.
- `ChatIaMezzoMaterialsTable.tsx`: rendering materiali; massimo atteso 160 righe.
- `ChatIaMezzoDocumentsList.tsx`: lista documenti completa da reader 2 clone-safe; massimo atteso 160 righe.

Convenzioni:

- Tutti gli export pubblici del settore usano prefisso `chatIaMezzi` o `ChatIaMezzo`.
- I tipi interni usano prefisso `ChatIaMezzo`.
- Nessun import da `src/pages/**`.
- Nessun accesso diretto a Firebase nel runner, salvo reader NEXT gia' esistenti.

## 2. ARCHITETTURA RUNNER

Flusso:

1. L'utente scrive nel composer della Chat IA NEXT.
2. `routeChatIaPrompt` analizza prompt, entita' e periodo (`src/next/chat-ia/core/chatIaRouter.ts:84`).
3. Il router assegna il settore `mezzi` quando trova una targa o parole chiave mezzo (`src/next/chat-ia/core/chatIaRouter.ts:21-25`, `src/next/chat-ia/core/chatIaRouter.ts:56-68`).
4. `getRunner` deve restituire il runner Mezzi per `sectorId === "mezzi"` (`src/next/chat-ia/core/chatIaSectorRegistry.ts:10-15`).
5. Il runner riceve `ChatIaRunnerContext` e produce `ChatIaRunnerResult`.

Il runner viene chiamato quando:

- `decision.sector === "mezzi"`;
- oppure esiste almeno una entity `{ kind: "targa" }` e nessun altro settore ha precedenza piu' forte.

Il fallback contestuale viene attivato quando:

- manca la targa;
- la targa e' ambigua;
- la targa non esiste nei reader flotta;
- il reader documenti completi non trova record per la targa richiesta;
- il periodo richiesto non e' interpretabile.

## 3. RICONOSCIMENTO PROMPT

Il router generale gia' estrae targa e periodo:

- `extractTarga`: `src/next/chat-ia/core/chatIaText.ts:26-31`.
- `extractPeriodHint`: `src/next/chat-ia/core/chatIaText.ts:56-83`.
- `routeChatIaPrompt` legge targa a `src/next/chat-ia/core/chatIaRouter.ts:87` e periodo a `src/next/chat-ia/core/chatIaRouter.ts:139`.

Il runner Mezzi raffina l'intento con pattern locali, senza cambiare il router core:

- Solo targa, esempio `AB123CD`: output `stato_mezzo`.
- `stato mezzo AB123CD`, `scheda mezzo AB123CD`, `dossier AB123CD`: output card.
- `timeline mezzo AB123CD`, `storia AB123CD`, `eventi AB123CD`: output timeline.
- `materiali mezzo AB123CD`, `cosa ha a bordo AB123CD`: output tabella materiali.
- `documenti mezzo AB123CD`: output lista documenti completi via reader 2 clone-safe.
- `report mezzo AB123CD`: output `report_mezzo_singolo`.
- `report mensile AB123CD aprile 2026`: output `report_mezzo_periodo`.
- `report AB123CD ultimi 90 giorni`: output `report_mezzo_periodo`.

Decisione output:

- `card`: stato mezzo, scheda, solo targa.
- `table`: materiali.
- `table`: documenti completi del mezzo.
- `report_modal`: report singolo o periodo.
- `card` piu' timeline preview: timeline quando richiesta senza report.

## 4. FUZZY MATCH TARGA

Decisione: portare nel settore la logica fuzzy di Mezzo 360, senza importare `src/pages/Mezzo360.tsx`.

Motivo: il valore utente e' reale. In Mezzo 360 una targa con una differenza minima viene ancora associata al mezzo corretto. La Chat IA NEXT deve conservare questa ergonomia, ma con codice nuovo dentro il settore.

Riferimento madre da replicare:

- `normalizeTarga`: `src/pages/Mezzo360.tsx:70`.
- `isSameTarga`: `src/pages/Mezzo360.tsx:135-148`.

Nuovo file:

- `src/next/chat-ia/sectors/mezzi/chatIaMezziTarga.ts`.

Contratto utility:

```ts
export function normalizeChatIaMezzoTarga(value: unknown): string;
export function isSameChatIaMezzoTarga(left: unknown, right: unknown): boolean;
export function resolveChatIaMezzoTargaMatch(args: {
  requestedTarga: string;
  availableTarghe: string[];
}): { status: "found" | "ambiguous" | "not_found"; targa: string | null; candidates: string[] };
```

Regole:

- Normalizzare in maiuscolo.
- Rimuovere spazi, trattini e caratteri non alfanumerici.
- Match esatto ha precedenza assoluta.
- Fuzzy match ammesso solo se la differenza di lunghezza e' al massimo 1 e i caratteri diversi sono al massimo 1, come in Mezzo 360.
- Se piu' mezzi passano il fuzzy match, non scegliere automaticamente: fallback ambiguo.
- Non usare distanza Levenshtein generica piu' permissiva.

## 5. LETTURA DATI

Il runner usa solo reader clone-safe. Non legge `src/pages/**` e non usa `getItemSync`. Per la timeline v1 completa usa anche il reader clone-safe segnalazioni/controlli gia' implementato in `src/next/domain/nextSegnalazioniControlliDomain.ts`.

### Reader da usare

- D01 anagrafica flotta: `readNextAnagraficheFlottaSnapshot` in `src/next/nextAnagraficheFlottaDomain.ts:763`, restituisce `items`, `colleghi`, counts e limitations (`src/next/nextAnagraficheFlottaDomain.ts:832-877`).
- D01 mezzo puntuale: `readNextMezzoByTarga` in `src/next/nextAnagraficheFlottaDomain.ts:880`, usa la snapshot flotta e cerca la targa normalizzata (`src/next/nextAnagraficheFlottaDomain.ts:883-889`).
- D02 operativita' tecnica: `readNextMezzoOperativitaTecnicaSnapshot` in `src/next/nextOperativitaTecnicaDomain.ts:223`, aggrega lavori e manutenzioni (`src/next/nextOperativitaTecnicaDomain.ts:228-250`).
- D02 lavori mezzo: `readNextMezzoLavoriSnapshot` in `src/next/domain/nextLavoriDomain.ts:1066`, espone `daEseguire`, `inAttesa`, `eseguiti` e counts (`src/next/domain/nextLavoriDomain.ts:1074-1095`).
- D04 rifornimenti mezzo: `readNextMezzoRifornimentiSnapshot` in `src/next/domain/nextRifornimentiDomain.ts:1304`, filtra righe business e field per targa (`src/next/domain/nextRifornimentiDomain.ts:1307-1324`).
- D05 materiali consegnati: `readNextMaterialiMovimentiSnapshot` in `src/next/domain/nextMaterialiMovimentiDomain.ts:1125`, legge `@materialiconsegnati` (`src/next/domain/nextMaterialiMovimentiDomain.ts:26`) e costruisce item normalizzati (`src/next/domain/nextMaterialiMovimentiDomain.ts:1148-1165`).
- D05 vista mezzo materiali: `buildNextMezzoMaterialiMovimentiSnapshot` in `src/next/domain/nextMaterialiMovimentiDomain.ts:1194`, da usare dopo la snapshot generale.
- D10 stato operativo: `readNextCentroControlloSnapshot` in `src/next/domain/nextCentroControlloDomain.ts:1627`; alias `readNextStatoOperativoSnapshot` in `src/next/domain/nextCentroControlloDomain.ts:1657`.

Reader 1 - segnalazioni e controlli completi per targa:

- Reader clone-safe segnalazioni e controlli completi per targa. Path: `src/next/domain/nextSegnalazioniControlliDomain.ts`. Espone tutte le segnalazioni di un mezzo e tutti i controlli di un mezzo, non solo quelli filtrati come "importanti" da D10. Reader implementato. Domain code `D11-MEZ-EVENTI`.
- Funzione esposta principale: `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297-350`).
- Costante dominio: `NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN` (`src/next/domain/nextSegnalazioniControlliDomain.ts:10-15`).

Contratto minimo atteso dal nuovo reader:

- input: targa normalizzata;
- output: segnalazioni complete del mezzo;
- output: controlli completi del mezzo;
- comportamento: sola lettura, nessuna scrittura e nessun filtro "solo importanti".

Reader 2 - documenti completi per targa:

- Path: `src/next/domain/nextDocumentiMezzoDomain.ts`. Espone tutti i documenti collegati a un mezzo: libretti, fatture, certificati e allegati generici, in modalita clone-safe. Sostituisce le letture live `getDocs` di Mezzo 360 con un percorso architetturalmente coerente con il clone NEXT. Reader implementato. Domain code `D12-MEZ-DOCUMENTI`.
- Funzione esposta principale: `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252-299`).
- Costante dominio: `NEXT_DOCUMENTI_MEZZO_DOMAIN` (`src/next/domain/nextDocumentiMezzoDomain.ts:16-21`).

Contratto minimo atteso dal reader 2:

- input: targa normalizzata;
- output: lista documenti completa collegata alla targa;
- output: metadati documento, tipo, data, importo quando presente, fileUrl e source;
- copertura: libretti, fatture, certificati e allegati generici collegati al mezzo;
- match: targa normalizzata e riferimenti mezzo quando disponibili;
- fallback: lista vuota esplicita quando nessun documento e' collegato alla targa;
- comportamento: sola lettura, nessuna scrittura e nessuna lettura live non mediata.

### Documenti

Decisione v1: opzione C, documenti completi tramite reader 2 clone-safe.

Motivo: Giuseppe richiede parita totale con Mezzo 360 in v1. Mezzo 360 legge documenti con `getDocs(collection(db, colName))` su collezioni live (`src/pages/Mezzo360.tsx:231-236`) e usa collezioni `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` (`src/pages/Mezzo360.tsx:26-30`). La Chat IA NEXT non deve copiare quella lettura live: deve ottenere la stessa copertura tramite reader 2 clone-safe.

Nota: esistono reader documenti/costi (`readNextIADocumentiArchiveSnapshot` in `src/next/domain/nextDocumentiCostiDomain.ts:2010` e `readNextDocumentiCostiFleetSnapshot` in `src/next/domain/nextDocumentiCostiDomain.ts:2247`), ma la v1 del settore Mezzi richiede un reader mezzo-centrico dedicato per parita con Mezzo 360.

### Schema dati combinato

```ts
export type ChatIaMezzoSnapshot = {
  targa: string;
  mezzo: NextAnagraficheFlottaMezzoItem;
  operativita: NextMezzoOperativitaTecnicaSnapshot;
  lavori: NextMezzoLavoriSnapshot;
  rifornimenti: NextMezzoRifornimentiSnapshot;
  materiali: NextMezzoMaterialiMovimentiSnapshot;
  statoOperativo: D10Snapshot;
  segnalazioniControlli: NextMezzoSegnalazioniControlliSnapshot;
  documenti: NextMezzoDocumentiSnapshot;
  sources: Array<{ label: string; path: string; domainCode?: string }>;
  missingData: string[];
};
```

## 6. OUTPUT VISIVO

La card Step Zero esistente e' la base della sezione identita':

- Componente: `src/next/internal-ai/InternalAiMezzoCard.tsx:60`.
- Tipi: `src/next/internal-ai/internalAiTypes.ts:756-787`.
- Costruzione card vecchia IA: `src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1799`.

Import ammesso nel wrapper del settore:

```ts
import InternalAiMezzoCard from "../../../internal-ai/InternalAiMezzoCard";
import type { MezzoDossierCardData } from "../../../internal-ai/internalAiTypes";
```

Il file `InternalAiMezzoCard.tsx` non va modificato. Il wrapper `ChatIaMezzoCard.tsx` compone:

- Identita': riuso diretto Step Zero, con targa, categoria, marca/modello, autista, foto, libretto.
- Scadenze e alert: sezione aggiunta dal wrapper usando D10 e date revisione/manutenzione.
- Lavori e manutenzioni: elenco sintetico da D02, con aperti, in attesa, chiusi, programmati.
- Materiali: tabella compatta da D05.
- Documenti completi: lista documenti collegati al mezzo, ottenuta dal reader 2 clone-safe. Stessa copertura di Mezzo 360 madre.
- Timeline: preview v1 se richiesta o se utile nel report.

Gli stili vivono dentro `src/next/chat-ia/chatIa.css` oppure in un file locale del settore solo se la fase implementativa lo consente. Classi prefissate `chat-ia-mezzo-`.

## 7. TIMELINE UNIFICATA

Decisione: opzione B in v1, timeline completa per le 5 sorgenti dichiarate sotto. La copertura completa di segnalazioni e controlli usa il Reader 1 gia' disponibile come import diretto. La timeline puo' essere implementata.

Sorgenti v1:

- Eventi storici operativi, equivalenti a `@storico_eventi_operativi`, via D10.
- Segnalazioni autisti complete, equivalenti a `@segnalazioni_autisti_tmp`, via `readNextMezzoSegnalazioniControlliSnapshot`.
- Controlli mezzo autisti completi, equivalenti a `@controlli_mezzo_autisti`, via `readNextMezzoSegnalazioniControlliSnapshot`.
- Rifornimenti basici, via D04.
- Manutenzioni e lavori, via D02.

Sorgenti rinviate a v2:

- Gomme temporanee e gomme eventi.
- Richieste attrezzature autisti.
- Altre famiglie documentali non coperte dal reader 2.
- Altri feed non coperti dai reader clone-safe.

Riferimento madre: Mezzo 360 costruisce timeline da eventi, segnalazioni, controlli, rifornimenti e gomme in `src/pages/Mezzo360.tsx:543-615`. La v1 replica il modello di output per eventi, segnalazioni complete, controlli completi, rifornimenti e manutenzioni/lavori. Segnalazioni e controlli non devono essere presi dai soli segnali filtrati di D10; arrivano dal reader clone-safe completo per targa `readNextMezzoSegnalazioniControlliSnapshot`.

Shape evento:

```ts
export type ChatIaMezzoTimelineEvent = {
  id: string;
  source:
    | "storico_eventi_operativi"
    | "segnalazioni"
    | "controlli"
    | "rifornimenti"
    | "manutenzioni"
    | "lavori";
  dateIso: string | null;
  timestamp: number;
  title: string;
  subtitle: string;
  detail: string;
  severity: "info" | "warning" | "danger" | "success";
  rawSourceId: string | null;
};
```

Ordinamento:

- Descrescente per `timestamp`.
- Eventi senza data vanno in fondo.
- Preview card: massimo 5 eventi.
- Vista timeline richiesta: massimo 50 eventi, poi testo "mostro i primi 50 eventi".

## 8. REPORT MEZZO

Decisione: il settore deve produrre `ChatIaReport` completi e compatibili con l'archivio Chat IA.

Tipi supportati:

- `report_mezzo_singolo`: snapshot attuale di identita', scadenze, lavori, materiali e timeline preview.
- `report_mezzo_periodo`: snapshot filtrato per periodo, con rifornimenti, manutenzioni/lavori eseguiti, eventi e materiali nel periodo.

Trigger:

- `report mezzo TARGA`
- `report TARGA`
- `report mensile TARGA aprile 2026`
- `report TARGA ultimi 30 giorni`
- `report TARGA ultimi 90 giorni`

Contratto `ChatIaReport`: definito in `src/next/chat-ia/core/chatIaTypes.ts:61-82`.

Regole shape:

- `sector: "mezzi"`.
- `type: "puntuale"` per `report_mezzo_singolo`.
- `type: "mensile"` se il periodo deriva da mese esplicito.
- `type: "periodico"` per ultimi 30/90 giorni o range custom.
- `target: { kind: "targa", value: targa }`.
- `period: null` per report singolo, valorizzato per report periodo.
- `preview`: valorizzato quando possibile con shape compatibile con `generateInternalAiReportPdfBlob`.
- `sections`: sempre presenti, anche quando una sezione e' parziale o vuota.
- `sources`: tutti i reader usati.
- `missingData`: eventuali documenti assenti per la targa, timeline non completa, eventuali dataset vuoti.

Compatibilita' PDF:

- `generateChatIaReportPdf` usa `generateInternalAiReportPdfBlob` quando `report.preview` esiste (`src/next/chat-ia/reports/chatIaReportPdf.ts:23-34`).
- Fallback jsPDF resta disponibile quando `preview` e' assente (`src/next/chat-ia/reports/chatIaReportPdf.ts:37-77`).

Salvataggio archivio:

- Usare `createChatIaReportArchiveEntry` (`src/next/chat-ia/reports/chatIaReportArchive.ts:44-91`).
- Target archivio: `targetKind = "targa"`, `targetValue = targa`, `targetBadge = null`.
- Lista/riapertura/cancellazione soft: `src/next/chat-ia/reports/chatIaReportArchive.ts:94-123`.

## 9. FALLBACK CONTESTUALE

Il fallback non deve essere generico. Deve spiegare cosa manca e proporre un prompt utile.

Casi:

- Targa mancante: "Dimmi la targa del mezzo, ad esempio: stato mezzo AB123CD".
- Targa non trovata: "Non trovo la targa AB123CD nella flotta NEXT. Posso riprovare se mi scrivi la targa completa senza spazi."
- Targa ambigua: "Ho trovato piu' mezzi simili a AB123CD: AB123CD, AB123CE. Scrivimi la targa esatta."
- Periodo invalido: "Il periodo non e' chiaro. Puoi scrivere ad esempio: report mensile AB123CD aprile 2026."
- Documento non trovato per la targa indicata: "Non trovo documenti collegati alla targa AB123CD nei dati disponibili. Posso comunque mostrarti stato, lavori, materiali e timeline."
- Nessun materiale: "Non risultano consegne materiali collegate a questa targa nei dati D05."

`fallbackContext` deve restituire `ChatIaFallbackResponse` con `sector: "mezzi"` e 2-3 esempi coerenti.

## 10. CONTRATTO RUNNER

Il runner implementa `ChatIaSectorRunner`, definito in `src/next/chat-ia/sectors/sectorTypes.ts:9-22`.

Export richiesto:

```ts
export const chatIaMezziRunner: ChatIaSectorRunner = {
  id: "mezzi",
  label: "Mezzi",
  canHandle,
  run,
  fallbackContext,
};
```

`canHandle(decision)`:

- true se `decision.sector === "mezzi"`;
- true se `decision.entities` contiene almeno una targa e `decision.sector` e' nullo;
- false negli altri casi.

`run({ prompt, decision, context })`:

1. Estrae targa da `decision.entities`.
2. Se manca, ritorna fallback.
3. Legge flotta D01 e risolve match esatto/fuzzy.
4. Se match non trovato o ambiguo, ritorna fallback.
5. Compone `ChatIaMezzoSnapshot` con D01, D02, D04, D05, D10, `readNextMezzoSegnalazioniControlliSnapshot` e `readNextMezzoDocumentiSnapshot`.
6. Determina intento locale.
7. Restituisce `ChatIaRunnerResult`:
   - `status: "completed"` se tutti i dati principali sono disponibili;
   - `status: "partial"` se mancano materiali, rifornimenti o parti timeline;
   - `outputKind` coerente con intento;
   - `sources: ["mezzi"]` come campo tecnico minimo, con `backendContext.sources` dettagliato.

`fallbackContext({ prompt, decision })`:

- usa solo prompt e decision;
- non legge dati;
- non chiama backend;
- produce esempi italiani concreti.

Registrazione:

- `src/next/chat-ia/core/chatIaSectorRegistry.ts:10-15` oggi ritorna `null`; l'implementazione dovra' importare `chatIaMezziRunner` e restituirlo per `"mezzi"`.

## 11. FILE ESISTENTI DA RIUSARE

- Route Chat IA NEXT: `src/App.tsx:11`, `src/App.tsx:515-518`.
- Tipi comuni chat: `src/next/chat-ia/core/chatIaTypes.ts:7-168`.
- Router chat: `src/next/chat-ia/core/chatIaRouter.ts:21-50`, `src/next/chat-ia/core/chatIaRouter.ts:84-140`.
- Helper testo: `src/next/chat-ia/core/chatIaText.ts:18-83`.
- Contratto runner: `src/next/chat-ia/sectors/sectorTypes.ts:9-22`.
- Registry runner: `src/next/chat-ia/core/chatIaSectorRegistry.ts:10-15`.
- Card mezzo Step Zero: `src/next/internal-ai/InternalAiMezzoCard.tsx:60`.
- Tipo card mezzo: `src/next/internal-ai/internalAiTypes.ts:756-787`.
- Costruzione card Step Zero esistente: `src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1799`.
- D01 flotta: `src/next/nextAnagraficheFlottaDomain.ts:763-890`.
- D02 operativita' tecnica: `src/next/nextOperativitaTecnicaDomain.ts:223-250`.
- D02 lavori mezzo: `src/next/domain/nextLavoriDomain.ts:1066-1095`.
- D04 rifornimenti mezzo: `src/next/domain/nextRifornimentiDomain.ts:1304-1324`.
- D05 materiali/movimenti: `src/next/domain/nextMaterialiMovimentiDomain.ts:1125-1165`, `src/next/domain/nextMaterialiMovimentiDomain.ts:1194`.
- D10 stato operativo: `src/next/domain/nextCentroControlloDomain.ts:1627-1660`.
- D11-MEZ-EVENTI dominio: `src/next/domain/nextSegnalazioniControlliDomain.ts:10-15`.
- D11-MEZ-EVENTI snapshot: `src/next/domain/nextSegnalazioniControlliDomain.ts:61-74`.
- D11-MEZ-EVENTI reader: `src/next/domain/nextSegnalazioniControlliDomain.ts:297-350`.
- D12-MEZ-DOCUMENTI dominio: `src/next/domain/nextDocumentiMezzoDomain.ts:16-21`.
- D12-MEZ-DOCUMENTI snapshot: `src/next/domain/nextDocumentiMezzoDomain.ts:61-73`.
- D12-MEZ-DOCUMENTI reader: `src/next/domain/nextDocumentiMezzoDomain.ts:252-299`.
- PDF report Chat IA: `src/next/chat-ia/reports/chatIaReportPdf.ts:23-77`.
- Archivio report Chat IA: `src/next/chat-ia/reports/chatIaReportArchive.ts:44-123`.
- Riferimento madre per comportamento utente, solo da leggere: `src/pages/Mezzo360.tsx:13-30`, `src/pages/Mezzo360.tsx:135-148`, `src/pages/Mezzo360.tsx:374-615`.

## 12. FILE ESISTENTI DA NON TOCCARE

- `src/pages/Mezzo360.tsx`: riferimento madre, non importare e non modificare.
- `src/next/internal-ai/InternalAiMezzoCard.tsx`: riuso solo via import; nessuna modifica.
- `src/next/internal-ai/internalAiTypes.ts`: nessuna modifica shape esistente.
- Reader D01-D10: riuso solo via import, nessuna modifica.
- `src/next/NextInternalAiPage.tsx`: vecchia chat resta in piedi.
- `backend/internal-ai/**`: backend non si modifica.
- Sottosistema Archivista: fuori perimetro.
- `src/pages/**`: madre intoccabile.

## 13. DEFINITION OF DONE SETTORE MEZZI

1. Build verde.
2. Lint zero errori sui file nuovi del settore e sui file core toccati.
3. `chatIaMezziRunner` implementa `ChatIaSectorRunner`.
4. `getRunner("mezzi")` restituisce il runner Mezzi.
5. Prompt solo targa produce card mezzo.
6. Prompt `stato mezzo TARGA` produce card con identita', scadenze e lavori.
7. Fuzzy match targa replica il comportamento di Mezzo 360 senza importare la madre.
8. Targa ambigua produce fallback contestuale.
9. Targa assente produce fallback contestuale.
10. Prompt `materiali mezzo TARGA` produce tabella materiali.
11. Prompt `documenti mezzo TARGA` produce lista documenti completa tramite reader 2 clone-safe.
12. Prompt `timeline mezzo TARGA` produce timeline v1 ordinata.
13. Prompt `report mezzo TARGA` produce `ChatIaReport` puntuale.
14. Prompt `report mensile TARGA aprile 2026` produce `ChatIaReport` con periodo.
15. Report mezzo esportabile in PDF tramite adapter esistente.
16. Report mezzo salvabile e riapribile dall'archivio Chat IA.
17. Reader 1, segnalazioni e controlli completi per targa, importato senza modifiche dal settore Mezzi.
18. Reader 2, documenti completi per targa, importato senza modifiche dal settore Mezzi.
19. Nessun file madre, Archivista, backend o reader D01-D10 modificato.

## 14. TEST DI ACCETTAZIONE PER UTENTE

1. Apri `/next/chat`.
2. Scrivi una targa reale della flotta e premi invio: deve comparire la scheda del mezzo.
3. Scrivi `stato mezzo <TARGA>`: deve comparire identita', scadenze, alert e lavori.
4. Scrivi `materiali mezzo <TARGA>`: deve comparire una tabella o un messaggio di assenza materiali.
5. Scrivi `timeline mezzo <TARGA>`: deve comparire una timeline completa per le 5 sorgenti dichiarate, ordinata per data.
6. Scrivi `documenti mezzo <TARGA>`: deve comparire una lista documenti reale o il messaggio "documento non trovato" se non esistono documenti per quella targa.
7. Scrivi `report mensile <TARGA> aprile 2026`: deve aprirsi il report, esportabile e salvabile.

## 15. DECISIONI VINCOLANTI

1. Documenti completi: opzione C in v1. Reader 2 implementato in `src/next/domain/nextDocumentiMezzoDomain.ts` con domain code `D12-MEZ-DOCUMENTI`. Il settore Mezzi lo importa senza modificarlo. La decisione precedente, opzione B v1 con contenuto non reale, e' superata.
2. Fuzzy targa: opzione A. Replicare la logica di Mezzo 360 dentro `chatIaMezziTarga.ts`, senza importare file madre.
3. Timeline: opzione B in v1. Timeline v1 completa per le 5 sorgenti dichiarate (eventi D10, segnalazioni complete via `D11-MEZ-EVENTI`, controlli completi via `D11-MEZ-EVENTI`, rifornimenti D04, manutenzioni/lavori D02). Reader 1 implementato in `src/next/domain/nextSegnalazioniControlliDomain.ts`; il settore Mezzi lo importa senza modificarlo.
4. Report: supporto v1 obbligatorio per `report_mezzo_singolo` e `report_mezzo_periodo`, con `ChatIaReport`, PDF adapter e archivio Chat IA.

## 16. APPENDICE: file letti

- `docs/_live/STATO_ATTUALE_PROGETTO.md`.
- `docs/product/MAPPA_IA_CHAT_NEXT.md`.
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`.
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`.
- `src/next/chat-ia/core/chatIaTypes.ts`.
- `src/next/chat-ia/core/chatIaRouter.ts`.
- `src/next/chat-ia/core/chatIaText.ts`.
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`.
- `src/next/chat-ia/sectors/sectorTypes.ts`.
- `src/next/chat-ia/reports/chatIaReportPdf.ts`.
- `src/next/chat-ia/reports/chatIaReportArchive.ts`.
- `src/next/internal-ai/InternalAiMezzoCard.tsx`.
- `src/next/internal-ai/internalAiTypes.ts`.
- `src/next/internal-ai/internalAiChatOrchestrator.ts`.
- `src/next/nextAnagraficheFlottaDomain.ts`.
- `src/next/nextOperativitaTecnicaDomain.ts`.
- `src/next/domain/nextLavoriDomain.ts`.
- `src/next/domain/nextRifornimentiDomain.ts`.
- `src/next/domain/nextMaterialiMovimentiDomain.ts`.
- `src/next/domain/nextCentroControlloDomain.ts`.
- `src/next/domain/nextDocumentiCostiDomain.ts`.
- `src/App.tsx`.
- `src/pages/Mezzo360.tsx`.
