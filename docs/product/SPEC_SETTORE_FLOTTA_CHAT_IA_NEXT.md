# SPEC SETTORE FLOTTA/ANALISI CHAT IA NEXT

Versione: 2026-04-28

## 0. INTRODUZIONE

Questa spec definisce il settore `flotta` della Chat IA NEXT. E' il secondo settore reale dopo Mezzi e serve a rispondere a domande libere su insiemi di mezzi, rifornimenti, consumi, medie, comparazioni e ricorrenze storiche.

La differenza architetturale rispetto a Mezzi e' sostanziale: Mezzi parte quasi sempre da una targa e costruisce una scheda puntuale; Flotta parte da intenti analitici, spesso senza targa, e produce output aggregati.

Casi d'uso prioritari:

1. Lista mezzi: `lista mezzi`, `tutti i mezzi`, `mezzi cisterna`, `mezzi revisione scaduta`.
2. Calcolo rifornimenti per periodo: `rifornimenti aprile 2026`.
3. Comparazione fonti rifornimento: `rifornimenti cisterna Caravate vs distributori`.
4. Consumo mezzo nel periodo: `quanto ha consumato TI282780 ultimi 6 mesi`.
5. Media consumi: `media consumi flotta`, `media consumi cisterna ultimi 12 mesi`.
6. Ricerca pattern testuale: `questa segnalazione e gia successa?`, `guasti motore TI282780`.

Riferimenti letti:

- Roadmap Flotta/Analisi in `docs/product/MAPPA_IA_CHAT_NEXT.md:147-157`.
- Ossatura runner e flusso chat in `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md:126-156`, `:529-547`, `:644-668`.
- Pattern settore Mezzi in `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`.
- Audit rifacimento chat IA in `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md:181-188`, `:524-530`, `:644-647`.
- Codice reale dei runner e reader citato nelle sezioni successive.

## 1. STRUTTURA CARTELLE

Albero da creare:

```text
src/next/chat-ia/sectors/flotta/
  README.md
  chatIaFlottaRunner.ts
  chatIaFlottaTypes.ts
  chatIaFlottaIntent.ts
  chatIaFlottaData.ts
  chatIaFlottaAggregations.ts
  chatIaFlottaTextSearch.ts
  chatIaFlottaReport.ts
  ChatIaFlottaChart.tsx
```

File da creare:

- `README.md`: descrizione settore e confini; 20-40 righe.
- `chatIaFlottaRunner.ts`: implementa `ChatIaSectorRunner`; 220-320 righe.
- `chatIaFlottaTypes.ts`: intenti, aggregati, chart model, result locali; 180-260 righe.
- `chatIaFlottaIntent.ts`: parsing intent e parole chiave; 140-220 righe.
- `chatIaFlottaData.ts`: composizione dati dai reader clone-safe; 220-340 righe.
- `chatIaFlottaAggregations.ts`: calcoli su rifornimenti, consumi, medie, periodi; 220-360 righe.
- `chatIaFlottaTextSearch.ts`: ricerca testuale D-FLOT-3; 160-260 righe.
- `chatIaFlottaReport.ts`: eventuale `ChatIaReport` analitico; 160-240 righe.
- `ChatIaFlottaChart.tsx`: rendering grafico semplice con Recharts; 100-180 righe.

File core da modificare in implementazione:

- `src/next/chat-ia/core/chatIaTypes.ts`: aggiungere sector id `flotta` e contratto chart. Oggi `ChatIaSectorId` non contiene `flotta` (`src/next/chat-ia/core/chatIaTypes.ts:7-14`) e `ChatIaOutputKind` non contiene chart (`src/next/chat-ia/core/chatIaTypes.ts:25-31`).
- `src/next/chat-ia/core/chatIaRouter.ts`: aggiungere scoring settore Flotta. Oggi i settori sono `mezzi`, `autisti`, `manutenzioni_scadenze`, `materiali`, `costi_fatture`, `documenti`, `cisterna` (`src/next/chat-ia/core/chatIaRouter.ts:21-50`).
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`: registrare `chatIaFlottaRunner`; oggi registra solo `mezzi` (`src/next/chat-ia/core/chatIaSectorRegistry.ts:1-20`).
- `src/next/chat-ia/components/ChatIaMessageItem.tsx`: aggiungere rendering chart. Oggi renderizza card, table, timeline e report (`src/next/chat-ia/components/ChatIaMessageItem.tsx:26-127`).
- `src/next/chat-ia/sectors/sectorFallbacks.ts`: aggiungere fallback settoriale Flotta; oggi manca `flotta` nel record fallback (`src/next/chat-ia/sectors/sectorFallbacks.ts:3-18`).

Convenzioni naming:

- Export principale: `chatIaFlottaRunner`.
- Tipi: prefisso `ChatIaFlotta`.
- Funzioni dati: prefisso `readChatIaFlotta...`.
- Funzioni aggregazione: prefisso `buildChatIaFlotta...`.
- Nessun import da `src/pages/**`.
- Nessuna scrittura business.

## 2. ARCHITETTURA RUNNER FLOTTA

Il runner Flotta segue il contratto comune `ChatIaSectorRunner`, definito in `src/next/chat-ia/sectors/sectorTypes.ts:9-22`.

Pattern riusato da Mezzi:

- runner esportato come costante, come `chatIaMezziRunner` in `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:107-235`;
- `canHandle`, `run`, `fallbackContext`;
- output `ChatIaRunnerResult`, con `sources`, `table`, `report`, `backendContext`;
- reader clone-safe letti da un file data dedicato, come `readChatIaMezzoSnapshot` in `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61-125`.

Differenze chiave rispetto a Mezzi:

- Mezzi usa la targa come entita' primaria: `canHandle` e' true se `decision.sector === "mezzi"` o se esiste una targa (`src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:110-112`).
- Flotta usa l'intento come entita' primaria: lista, rifornimenti, comparazione, consumo, media, ricerca.
- Flotta puo' gestire prompt senza targa.
- Flotta puo' gestire prompt con targa solo se l'intento e' analitico, per esempio `consumo`, `media`, `rifornimenti`, `ultimi 6 mesi`; una targa nuda resta al settore Mezzi.
- Flotta non deve provare risposte approssimative: se l'intento non e' riconosciuto attiva il fallback D-FLOT-1.

Flusso runner:

```text
prompt
  -> normalizePromptText
  -> detectFlottaIntent
  -> se intent non riconosciuto: fallback "non capisco"
  -> selezione reader clone-safe
  -> filtro periodo / filtro targa / filtro categoria
  -> aggregazione locale nel runner
  -> ChatIaRunnerResult con text + table/card/chart/report
  -> eventuale refinement backend solo sul testo, non sui dati
```

Regola di sola lettura: il runner Flotta legge dati e produce output; non chiama writer e non apre flussi business.

## 3. RICONOSCIMENTO INTENT

Intent supportati:

| Intent | Parole chiave principali | Esempi |
| --- | --- | --- |
| `lista_mezzi` | `lista mezzi`, `tutti i mezzi`, `mezzi`, `flotta`, `revisione scaduta`, `cisterna` | `mezzi cisterna`, `mezzi revisione scaduta` |
| `rifornimenti_periodo` | `rifornimenti`, `gasolio`, `carburante`, mese/anno, `periodo` | `rifornimenti aprile 2026` |
| `comparazione_rifornimenti` | `vs`, `confronta`, `comparazione`, `cisterna`, `distributori`, `caravate` | `rifornimenti cisterna Caravate vs distributori` |
| `consumo_mezzo` | targa + `consumato`, `consumo`, `l/100`, `ultimi` | `quanto ha consumato TI282780 ultimi 6 mesi` |
| `media_consumi` | `media`, `medie`, `statistiche`, `trend`, `flotta`, `cisterna` | `media consumi flotta` |
| `ricerca_pattern` | `e gia successo`, `gia successa`, `guasti`, `trova`, `cerca`, `storico`, `segnalazione` | `guasti motore TI282780` |

Algoritmo decisionale:

```text
normalized = normalizePromptText(prompt)
targa = extractTarga(prompt)

if keyword ricerca_pattern:
  return ricerca_pattern

if keyword comparazione and keyword rifornimenti:
  return comparazione_rifornimenti

if targa and keyword consumo/rifornimenti/media/ultimi:
  return consumo_mezzo

if keyword media/statistiche/trend:
  return media_consumi

if keyword rifornimenti/carburante/gasolio:
  return rifornimenti_periodo

if keyword lista/tutti/mezzi/flotta/revisione/cisterna:
  return lista_mezzi

return null
```

`canHandle`:

- true se `decision.sector === "flotta"`;
- true se non c'e' targa e il prompt contiene parole chiave Flotta;
- true se c'e' targa ma il prompt contiene parole chiave analitiche Flotta (`consumo`, `rifornimenti`, `media`, `ultimi`, `trend`);
- false per targa nuda o dossier/stato/timeline/documenti mezzo: questi restano a Mezzi.

Router core:

- aggiungere `flotta` a `ChatIaSectorId` (`src/next/chat-ia/core/chatIaTypes.ts:7-14`);
- aggiungere `flotta` in `SECTOR_KEYWORDS` (`src/next/chat-ia/core/chatIaRouter.ts:21-50`);
- regola di precedenza: `flotta` batte `mezzi` solo quando la targa e' accompagnata da parole analitiche; altrimenti `mezzi` resta dominante come oggi (`src/next/chat-ia/core/chatIaRouter.ts:128-130`).

## 4. INTENT 1: LISTA MEZZI

Pattern prompt:

- `lista mezzi`
- `tutti i mezzi`
- `mezzi cisterna`
- `mezzi revisione scaduta`
- `mezzi senza autista`

Reader usato:

- D01 `readNextAnagraficheFlottaSnapshot` in `src/next/nextAnagraficheFlottaDomain.ts:763-878`.

Campi disponibili:

- `targa`, `categoria`, `tipo`, `marcaModello`, `autistaNome`, `dataScadenzaRevisioneTimestamp`, `manutenzioneProgrammata`, `librettoUrl` in `src/next/nextAnagraficheFlottaDomain.ts:79-121`.
- counts flotta in `src/next/nextAnagraficheFlottaDomain.ts:135-145`, popolati in `:842-852`.

Filtri supportati:

- categoria/tipo: `tipo === "cisterna"` oppure testo categoria contiene `cisterna`;
- revisione scaduta: `dataScadenzaRevisioneTimestamp !== null && dataScadenzaRevisioneTimestamp < Date.now()`;
- revisione in scadenza: soglia tecnica 30 giorni, da dichiarare nel testo output;
- senza autista: `!autistaNome`;
- con libretto: `Boolean(librettoUrl)`.

Output:

- `ChatIaTable` con colonne: `Targa`, `Tipo`, `Categoria`, `Marca/modello`, `Autista`, `Revisione`, `Stato`.
- Testo breve sopra tabella: numero secco, per esempio `Mezzi trovati: 12`.
- `sources: ["mezzi"]`, perche' il dato primario e' D01.

## 5. INTENT 2: RIFORNIMENTI PER PERIODO

Pattern prompt:

- `rifornimenti aprile 2026`
- `rifornimenti ultimi 30 giorni`
- `gasolio flotta marzo 2026`
- `totale carburante 2026`

Reader usato:

- D04 `readNextRifornimentiReadOnlySnapshot` in `src/next/domain/nextRifornimentiDomain.ts:1291-1302`.

Campi disponibili:

- item rifornimento con `targa`, `dataDisplay`, `timestamp`, `litri`, `km`, `costo`, `valuta`, `tipo`, `distributore`, `provenienza` in `src/next/domain/nextRifornimentiDomain.ts:120-187`.
- snapshot globale con `items`, `counts`, `totals` in `src/next/domain/nextRifornimentiDomain.ts:189-242`.
- il builder dei totali somma `litri` e `costo` sugli item in `src/next/domain/nextRifornimentiDomain.ts:1236-1255`.

Aggregazione:

- filtra per periodo usando `timestamp` o `timestampRicostruito`;
- somma litri: `sum(item.litri ?? 0)`;
- somma costi: `sum(item.costo ?? 0)`, separando o segnalando valute se necessario;
- conteggio rifornimenti: `items.length`;
- raggruppa per mese se il periodo copre piu' mesi.

Decisione architetturale:

- Gli aggregati dei casi 2-5 si calcolano lato runner partendo dai reader esistenti. Non serve un nuovo reader aggregato come prerequisito.
- Motivo: D04 espone gia' item normalizzati con data, litri, km, costo, distributore e provenienza (`src/next/domain/nextRifornimentiDomain.ts:120-187`) e snapshot globale (`src/next/domain/nextRifornimentiDomain.ts:1291-1302`).
- Limite: se `timestamp` manca su una parte dei record, il runner deve escluderli dal filtro periodo e dichiarare il conteggio escluso nel testo, non inventare date.

Output:

- Numero secco: `Totale rifornimenti aprile 2026: 12.430 L`.
- Tabella opzionale ultimi record: data, targa, litri, costo, distributore.
- Grafico semplice se il periodo e' multi-mese: linea o barre mensili litri.

## 6. INTENT 3: COMPARAZIONE RIFORNIMENTI

Pattern prompt:

- `rifornimenti cisterna Caravate vs distributori`
- `confronta cisterna e distributori aprile 2026`
- `carburante interno contro esterno ultimi 12 mesi`

Reader usati:

- D04 `readNextRifornimentiReadOnlySnapshot` per distributori/business/field in `src/next/domain/nextRifornimentiDomain.ts:1291-1302`.
- D09 `readNextCisternaSnapshot` per report Cisterna Caravate in `src/next/domain/nextCisternaDomain.ts:1240-1362`.

Campi D09 utili:

- report mensile con `litriTotaliMese`, `litriDocumentiMese`, `litriSupportoMese`, `costi`, `ripartizioneAzienda`, `perTarga`, `detailRows` in `src/next/domain/nextCisternaDomain.ts:168-229`.
- calcolo Cisterna dei litri e costi in `src/next/domain/nextCisternaDomain.ts:1022-1235`.

Aggregazione comparativa:

- D04: filtra per periodo e somma `litri`, `costo`, conteggio; raggruppa per mese.
- D09: per ogni mese del periodo chiama `readNextCisternaSnapshot(monthKey, { includeCloneOverlays: false })` e usa `snapshot.report.litriTotaliMese` o `litriSupportoMese` secondo etichetta scelta nel testo.
- Output comparativo minimo:
  - `cisternaLitri`
  - `distributoriLitri`
  - `totaleLitri`
  - `deltaLitri`
  - `percentualeCisterna`

Output:

- Numero secco: `Cisterna: 8.100 L; distributori: 4.330 L`.
- Tabella `Fonte`, `Litri`, `Costo`, `Rifornimenti`, `%`.
- Grafico barre con due serie: `Cisterna` e `Distributori`.
- Se D09 segnala limiti o mixed currency, includere nota da `snapshot.limitations` / `report.notes`; D09 produce limitations in `src/next/domain/nextCisternaDomain.ts:1310-1326`.

## 7. INTENT 4: CONSUMO MEZZO

Pattern prompt:

- `quanto ha consumato TI282780 ultimi 6 mesi`
- `consumo TI282780 aprile 2026`
- `l/100 TI282780 ultimi 12 mesi`

Reader usati:

- D04 mezzo: `readNextMezzoRifornimentiSnapshot(targa)` in `src/next/domain/nextRifornimentiDomain.ts:1304-1318`.
- D01 mezzo: `readNextMezzoByTarga(targa)` in `src/next/nextAnagraficheFlottaDomain.ts:880-889`, solo per validare esistenza e mostrare contesto anagrafico.

Calcolo:

- filtra rifornimenti del mezzo nel periodo;
- litri totali: somma `litri`;
- km percorsi: differenza tra massimo e minimo `km` leggibile nel periodo;
- consumo `l/100km = (litriTotali / kmPercorsi) * 100`;
- se `kmPercorsi <= 0` o meno di due letture km affidabili: risposta parziale, nessun consumo inventato.

Riferimento calcolo gia' presente in NEXT:

- `NextRifornimentiEconomiaSection` calcola km periodo e consumo medio da litri/km in `src/next/NextRifornimentiEconomiaSection.tsx:420-453`.

Output:

- Numero secco: `Consumo TI282780 ultimi 6 mesi: 31,4 L/100km`.
- Grafico trend mensile se ci sono almeno due bucket.
- Tabella di supporto: mese, litri, km stimati, consumo.

## 8. INTENT 5: MEDIE E STATISTICHE

Pattern prompt:

- `media consumi flotta`
- `media consumi cisterna ultimi 12 mesi`
- `mezzi che consumano di piu`
- `costi manutenzione 2026`
- `mezzi piu problematici`

Reader usati:

- D04 per litri, km, costo rifornimenti: `src/next/domain/nextRifornimentiDomain.ts:120-187`, `:1291-1302`.
- D01 per gruppo mezzi e filtri tipo/categoria: `src/next/nextAnagraficheFlottaDomain.ts:79-145`, `:763-878`.
- D02 lavori/manutenzioni se si parla di problematicita': `readNextMezzoOperativitaTecnicaSnapshot` in `src/next/nextOperativitaTecnicaDomain.ts:223-255` e `readNextMezzoLavoriSnapshot` in `src/next/domain/nextLavoriDomain.ts:1067-1107`.
- D07/D08 costi documentali: `readNextDocumentiCostiFleetSnapshot` in `src/next/domain/nextDocumentiCostiDomain.ts:2247-2265`; snapshot flotta documenti/costi in `src/next/domain/nextDocumentiCostiDomain.ts:341-378`.

Aggregazioni statistiche:

- media consumi flotta: calcolare consumo per mezzo con D04 e poi media aritmetica sui mezzi con km affidabili;
- media consumi cisterna: filtro D01 `tipo === "cisterna"` o categoria cisterna, poi D04;
- mezzi che consumano di piu': top N per `l/100km`, solo se km validi;
- costi manutenzione: usare D07/D08 se item con importo e targa leggibile; se il prompt chiede manutenzioni operative e non costi documentali, usare D02 come conteggio lavori, non come importo;
- problematicita': usare conteggi lavori aperti/chiusi D02 e ricorrenze D11; non mescolare importi e eventi in un unico punteggio senza spiegarlo.

Output:

- Numero secco sempre presente per medie: `Media consumi flotta: 29,8 L/100km`.
- Grafico obbligatorio per D-FLOT-2: barre top mezzi o linea trend mensile.
- Tabella con i mezzi esclusi dal calcolo per km mancanti.

## 9. INTENT 6: RICERCA PATTERN TESTUALE

Pattern prompt:

- `questa segnalazione e gia successa?`
- `guasti motore TI282780`
- `cerca perdita olio`
- `trova rumore freni`
- `quante volte rotto questo pezzo?`

Reader usati:

- D11-MEZ-EVENTI per segnalazioni e controlli completi per targa: `readNextMezzoSegnalazioniControlliSnapshot(targa)` in `src/next/domain/nextSegnalazioniControlliDomain.ts:297-350`.
- D10 per eventi storici: `readNextStatoOperativoSnapshot` in `src/next/domain/nextCentroControlloDomain.ts:1657-1660`; snapshot include `eventiStorici` in `src/next/domain/nextCentroControlloDomain.ts:262-284`.
- D01 per elencare targhe quando la ricerca e' flotta-wide: `readNextAnagraficheFlottaSnapshot` in `src/next/nextAnagraficheFlottaDomain.ts:763-878`.

Campi testuali D11:

- segnalazioni: `titolo`, `descrizione`, `categoria`, `ambito`, `stato` in `src/next/domain/nextSegnalazioniControlliDomain.ts:19-36`; mapping descrizione da `descrizione`, `note`, `testo` in `src/next/domain/nextSegnalazioniControlliDomain.ts:202-230`.
- controlli: `titolo`, `descrizione`, `target`, `note`, `esito` in `src/next/domain/nextSegnalazioniControlliDomain.ts:38-54`; mapping descrizione/note in `src/next/domain/nextSegnalazioniControlliDomain.ts:234-261`.

Campi testuali D10:

- `D10StoricoEventoItem` espone `tipo`, `luogo`, badge/nome autista, targhe coinvolte e source, ma non un campo `descrizione` dedicato (`src/next/domain/nextCentroControlloDomain.ts:134-152`). Quindi la ricerca eventi D10 v1 deve indicizzare solo i campi realmente esposti.

Algoritmo match testuale D-FLOT-3:

```text
query = estrai frase dopo "cerca/trova/guasti/e gia successo"
needle = normalize(query)

normalizzazione:
  lowercase
  rimozione doppie spaziature
  trim

se targa presente:
  leggi D11 per targa
else:
  leggi D01 e cicla tutte le targhe chiamando D11 per ciascuna

leggi D10 una volta

per ogni segnalazione/controllo/evento:
  haystack = join campi testuali esposti
  se haystack contiene needle oppure tutte le parole chiave principali:
    aggiungi occorrenza

ordina per timestamp desc
limita a 20 occorrenze
```

Output:

- Testo: `Ho trovato 4 occorrenze testuali per "motore"`.
- Lista/tabella: data, mezzo coinvolto, descrizione, fonte (`segnalazione`, `controllo`, `evento`), contesto.
- Nessuna analisi semantica complessa.
- Se la frase chiave non e' chiara: fallback D-FLOT-1, non ricerca approssimativa.

Limite tecnico:

- D11 oggi e' mezzo-centrico. Per ricerca flotta-wide la v1 puo' ciclare le targhe D01 e chiamare D11 per ogni targa, senza creare un nuovo reader prerequisito. Se le prestazioni risultano insufficienti in browser, una SPEC futura potra' introdurre un reader aggregato D11 globale.

## 10. FALLBACK CONTESTUALE

Si attiva quando:

- `detectFlottaIntent` ritorna `null`;
- il prompt contiene parole troppo generiche (`analizza`, `dimmi qualcosa`, `situazione`) senza oggetto o periodo;
- la frase di ricerca pattern non contiene termini utili;
- il periodo richiesto non e' interpretabile e l'intento richiede un periodo;
- mancano dati minimi per il calcolo e non esiste un output parziale onesto.

Testo letterale obbligatorio D-FLOT-1:

```text
Non capisco questa richiesta sulla flotta. Posso fare: lista mezzi, calcolo rifornimenti per periodo, comparazione rifornimenti cisterna vs distributori, consumi mezzo, medie e statistiche, ricerca testuale nello storico segnalazioni.
```

Esempi:

- Prompt: `analizza tutto` -> fallback letterale.
- Prompt: `quanto consuma` senza targa o ambito -> fallback letterale.
- Prompt: `e gia successo?` senza frase chiave e senza messaggio precedente utilizzabile -> fallback letterale.

Regola: vietato produrre una risposta approssimativa.

## 11. CONTRATTO RUNNER FLOTTA

Il runner implementa `ChatIaSectorRunner`:

```ts
export const chatIaFlottaRunner: ChatIaSectorRunner = {
  id: "flotta",
  label: "Flotta/Analisi",
  canHandle(decision) { ... },
  async run({ prompt, decision, context }) { ... },
  fallbackContext({ prompt, decision }) { ... },
};
```

Contratto risultato:

- `sector: "flotta"`.
- `sources`: dichiarare tutti i settori dati letti, per esempio `["mezzi", "costi_fatture", "cisterna"]` quando usa D01 + D04 + D09. La regola viene dalla spec ossatura: un runner deve dichiarare i settori consultati (`docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md:529-547`).
- `outputKind`: per la v1 usare:
  - `table` per liste e occorrenze;
  - nuovo `chart` o `card` con chart per numeri/grafici, secondo modifica core scelta in implementazione;
  - `report_modal` solo se il prompt chiede report o riepilogo salvabile.
- `backendContext`: includere intent, periodo, conteggi record letti, record esclusi e limitazioni.
- `error`: solo per errori tecnici; non usarlo per fallback comprensibile.

Estensione necessaria del tipo:

- `ChatIaRunnerResult` oggi non ha `chart` (`src/next/chat-ia/core/chatIaTypes.ts:156-168`).
- `ChatIaMessage` oggi non conserva `chart` (`src/next/chat-ia/core/chatIaTypes.ts:114-128`).
- La spec decide di introdurre un tipo leggero:

```ts
type ChatIaChart = {
  id: string;
  title: string;
  kind: "bar" | "line";
  xKey: string;
  series: Array<{ key: string; label: string }>;
  data: Array<Record<string, string | number | null>>;
  emptyText: string;
};
```

## 12. GRAFICI

Libreria scelta: Recharts.

Motivo:

- `recharts` e' gia' dipendenza del progetto in `package.json:31`.
- E' gia' usata in NEXT per grafici rifornimenti/gomme: `src/next/NextRifornimentiEconomiaSection.tsx:4-15` e `src/next/NextGommeEconomiaSection.tsx:2-11`.
- Non richiede nuove dipendenze.

Pattern d'uso:

- `ResponsiveContainer` obbligatorio per adattamento alla card chat.
- `BarChart` per comparazioni fonte e top mezzi.
- `LineChart` per trend mensili.
- `Tooltip`, `XAxis`, `YAxis` sempre presenti.
- Niente animazioni avanzate.
- Niente interattivita complessa.

Componenti:

- `ChatIaFlottaChart.tsx`: riceve `ChatIaChart` e renderizza `BarChart` o `LineChart`.
- `ChatIaMessageItem.tsx`: aggiunge `renderChart(message)` accanto a `renderTable` e `renderCard`; oggi questi renderer sono in `src/next/chat-ia/components/ChatIaMessageItem.tsx:26-101`.

D-FLOT-2:

- Ogni output di media, trend o comparazione deve includere numero secco + grafico semplice.
- Se i dati sono insufficienti per il grafico, il runner deve dirlo esplicitamente e produrre solo il numero se calcolabile; se neanche il numero e' calcolabile, fallback o risposta parziale con motivo.

## 13. FILE ESISTENTI DA RIUSARE

- Contratto runner: `src/next/chat-ia/sectors/sectorTypes.ts:9-22`.
- Registry settori: `src/next/chat-ia/core/chatIaSectorRegistry.ts:1-20`.
- Router prompt: `src/next/chat-ia/core/chatIaRouter.ts:21-145`.
- Tipi chat: `src/next/chat-ia/core/chatIaTypes.ts:7-168`.
- Text utility e periodo mese/anno: `src/next/chat-ia/core/chatIaText.ts:18-87`.
- Renderer messaggio: `src/next/chat-ia/components/ChatIaMessageItem.tsx:26-127`.
- Pattern runner Mezzi: `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:107-235`.
- Pattern data Mezzi: `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61-125`.
- D01 flotta: `src/next/nextAnagraficheFlottaDomain.ts:79-145`, `:763-889`.
- D04 rifornimenti: `src/next/domain/nextRifornimentiDomain.ts:120-242`, `:1291-1318`.
- D09 cisterna: `src/next/domain/nextCisternaDomain.ts:168-229`, `:1022-1235`, `:1240-1362`.
- D10 centro controllo/eventi: `src/next/domain/nextCentroControlloDomain.ts:134-152`, `:262-284`, `:1515-1608`, `:1657-1660`.
- D11 segnalazioni/controlli: `src/next/domain/nextSegnalazioniControlliDomain.ts:19-80`, `:202-261`, `:297-350`.
- D02 operativita tecnica/lavori: `src/next/nextOperativitaTecnicaDomain.ts:55-82`, `:223-255`; `src/next/domain/nextLavoriDomain.ts:146-171`, `:1067-1107`.
- D07/D08 documenti/costi flotta: `src/next/domain/nextDocumentiCostiDomain.ts:341-378`, `:1778-1804`, `:2247-2265`.
- Recharts in NEXT: `package.json:31`, `src/next/NextRifornimentiEconomiaSection.tsx:4-15`, `src/next/NextGommeEconomiaSection.tsx:2-11`.

## 14. FILE ESISTENTI DA NON TOCCARE

- Qualsiasi file in `src/pages/**`.
- Qualsiasi file Archivista.
- Qualsiasi function Cloud legacy.
- Writer business e barriere scrittura, salvo che una SPEC futura chieda esplicitamente report archive o nuovi output non business.
- Reader D01-D12: il settore Flotta v1 deve riusarli; non modificarli.
- Madre e moduli legacy.

Per questa spec la chat resta sola lettura. Le uniche scritture ammesse nell'ossatura sono quelle gia' previste per salvataggio report chat dopo conferma utente, non scritture business (`docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md:545-547`).

## 15. DEFINITION OF DONE SETTORE FLOTTA

1. `ChatIaSectorId` include `flotta`.
2. Router riconosce prompt Flotta senza targa e prompt analitici con targa.
3. `getRunner("flotta")` restituisce `chatIaFlottaRunner`.
4. `chatIaFlottaRunner` implementa `ChatIaSectorRunner`.
5. Sono implementati i 6 intent della spec.
6. Gli aggregati dei casi 2-5 sono calcolati lato runner dai reader esistenti.
7. Nessun reader D01-D12 viene modificato.
8. Nessun file madre o Archivista viene importato.
9. Fallback D-FLOT-1 restituisce il testo letterale.
10. Output statistici/comparativi rispettano D-FLOT-2: numero secco + grafico semplice.
11. Ricerca pattern rispetta D-FLOT-3: match testuale su campi esposti, niente semantica inventata.
12. Ogni risultato dichiara `sources`.
13. I record esclusi da calcoli per data/km/costo mancanti sono conteggiati nel testo o in `backendContext`.
14. Build verde.
15. Lint sui file toccati verde o delta 0.

## 16. TEST DI ACCETTAZIONE PER UTENTE

Prompt da provare in browser:

1. `lista mezzi`
   - Atteso: tabella mezzi da D01 con conteggio.
2. `mezzi cisterna`
   - Atteso: tabella filtrata per tipo/categoria cisterna.
3. `mezzi revisione scaduta`
   - Atteso: tabella filtrata con scadenze anteriori a oggi.
4. `rifornimenti aprile 2026`
   - Atteso: totale litri/costi/conteggio da D04, tabella o grafico se utile.
5. `rifornimenti cisterna Caravate vs distributori aprile 2026`
   - Atteso: numero secco + tabella + grafico barre D04 vs D09.
6. `quanto ha consumato TI282780 ultimi 6 mesi`
   - Atteso: consumo L/100km se km validi; altrimenti risposta parziale con motivo.
7. `media consumi flotta ultimi 12 mesi`
   - Atteso: media numerica + grafico top/trend.
8. `guasti motore TI282780`
   - Atteso: occorrenze testuali da D11 e D10, ordinate per data, con fonte.

Test fallback:

- `analizza tutto`
  - Atteso: testo D-FLOT-1 letterale, nessun tentativo approssimativo.

## 17. DECISIONI VINCOLANTI

D-FLOT-1 - Quando l'IA non capisce:

- Decisione: rispondere con fallback letterale e non tentare risposta approssimativa.
- Testo: `Non capisco questa richiesta sulla flotta. Posso fare: lista mezzi, calcolo rifornimenti per periodo, comparazione rifornimenti cisterna vs distributori, consumi mezzo, medie e statistiche, ricerca testuale nello storico segnalazioni.`

D-FLOT-2 - Output calcoli:

- Decisione: ogni media, trend o comparazione produce numero secco + grafico semplice.
- Grafici con Recharts, gia' disponibile in `package.json:31` e gia' usato in NEXT (`src/next/NextRifornimentiEconomiaSection.tsx:4-15`, `src/next/NextGommeEconomiaSection.tsx:2-11`).

D-FLOT-3 - Ricerca pattern "e gia successo?":

- Decisione: ricerca testuale, non pattern numerico e non semantica complessa.
- Fonti: D11 segnalazioni/controlli (`src/next/domain/nextSegnalazioniControlliDomain.ts:19-80`, `:202-261`, `:297-350`) e D10 eventi storici (`src/next/domain/nextCentroControlloDomain.ts:134-152`, `:262-284`, `:1657-1660`).
- Output: data, mezzo coinvolto, descrizione o testo disponibile, fonte, contesto.

Decisione tecnica - aggregati casi 2-5:

- Decisione: calcolo lato runner partendo dai reader esistenti, senza nuovo reader aggregato come prerequisito.
- Motivo: D04 espone gia' item globali e per mezzo con `timestamp`, `litri`, `km`, `costo`, `distributore` (`src/next/domain/nextRifornimentiDomain.ts:120-187`, `:1291-1318`); D01 espone flotta e filtri (`src/next/nextAnagraficheFlottaDomain.ts:79-145`); D09 espone aggregati mensili Cisterna (`src/next/domain/nextCisternaDomain.ts:168-229`, `:1022-1235`).
- Limite: per ricerca testuale flotta-wide D11 e' oggi mezzo-centrico; la v1 cicla le targhe D01 e chiama D11 per targa. Se le performance non bastano, si aprira' una SPEC successiva per reader aggregato.

Decisione tecnica - sector id:

- Decisione: il settore si chiama `flotta`.
- Motivo: directory richiesta `src/next/chat-ia/sectors/flotta/`; output e router restano semplici.

Decisione tecnica - contratto chart:

- Decisione: introdurre `ChatIaChart` leggero e `ChatIaFlottaChart.tsx`.
- Motivo: `ChatIaOutputKind` oggi non ha grafici (`src/next/chat-ia/core/chatIaTypes.ts:25-31`), ma D-FLOT-2 li rende obbligatori per calcoli/statistiche.

## 18. APPENDICE: file letti

- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `package.json`
- `src/next/chat-ia/core/chatIaTypes.ts`
- `src/next/chat-ia/core/chatIaRouter.ts`
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`
- `src/next/chat-ia/core/chatIaText.ts`
- `src/next/chat-ia/components/ChatIaMessageItem.tsx`
- `src/next/chat-ia/components/ChatIaShell.tsx`
- `src/next/chat-ia/sectors/sectorTypes.ts`
- `src/next/chat-ia/sectors/sectorFallbacks.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/NextRifornimentiEconomiaSection.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
