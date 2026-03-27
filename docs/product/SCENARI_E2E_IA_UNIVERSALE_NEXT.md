# SCENARI E2E IA UNIVERSALE NEXT

## 1. Scopo
Questo documento traccia gli scenari end-to-end minimi che il sistema universale del clone/NEXT deve saper gestire oggi in modo verificabile.

Ogni scenario riporta:
- input;
- entity resolution;
- request resolution;
- adapter coinvolti;
- output composer;
- action intent e handoff target;
- stato copertura;
- eventuale gap residuo.

## 2. Scenario 1 - Upload libretto mezzo
- Input:
  - file con nome o contenuto riconducibile a `libretto` o `carta di circolazione`
- Entity resolution:
  - usa prompt + nome file + testo allegato;
  - risolve `targa` o `mezzo` quando il segnale e forte
- Request resolution:
  - `requestKind`: `instradamento_documento`
  - focus: `Libretto mezzo e documentazione flotta`
- Adapter coinvolti:
  - `adapter.d01`
  - `adapter.d07d08`
- Output composer:
  - risposta naturale + handoff standard con prefill `flusso=libretto_mezzo`, `targa`, `documentoNome`
- Action intent / handoff target:
  - route primaria: `/next/ia/libretto?archive=1&targa=<targa>&documentoNome=<file>&iaHandoff=<id>`
  - route secondaria: `/next/libretti-export?targa=<targa>&iaHandoff=<id>`
  - stato consumo atteso: `letto_dal_modulo -> prefill_applicato -> completato` oppure `da_verificare`
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale

## 3. Scenario 2 - Upload preventivo fornitore dichiarato in chat
- Input:
  - file preventivo + testo utente con vincolo esplicito `fornitore`
- Entity resolution:
  - risoluzione fornitore da prompt/nome file/testo allegato;
  - eventuale `targa` secondaria se presente
- Request resolution:
  - `requestKind`: `instradamento_documento`
  - focus: `Procurement / preventivi fornitore`
  - vincolo forte: `fornitore`
- Adapter coinvolti:
  - `adapter.d06`
- Output composer:
  - piano universale che dichiara procurement come punto corretto e capability riusata `clone.preventivi-preview`
- Action intent / handoff target:
  - route: `/next/acquisti?fornitore=<fornitore>&documentoNome=<file>&iaHandoff=<id>`
  - prefill canonico: `flusso=procurement_preventivi`, `fornitore`, `targa`, `documentoNome`, `tabTarget=ordini`
  - stato consumo atteso: `letto_dal_modulo -> prefill_applicato -> completato` oppure `da_verificare`
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale

## 4. Scenario 3 - Upload documento ambiguo
- Input:
  - file senza segnali forti o immagine generica
- Entity resolution:
  - eventuali candidate prudenziali da nome file o testo allegato
- Request resolution:
  - `requestKind`: `instradamento_documento`
  - focus: `Inbox documentale universale`
- Adapter coinvolti:
  - `adapter.universal`
- Output composer:
  - piano universale che dichiara l'assenza di routing sicuro e mantiene il documento nella inbox
- Action intent / handoff target:
  - route: `/next/ia/interna/richieste?iaHandoff=<id>`
  - stato richiesta: `inbox_documentale`
  - dati disponibili: motivo classificazione, modulo suggerito, entita candidate, azioni possibili, stato consumo del payload
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale: il mancato invio automatico al modulo sbagliato e il comportamento corretto

## 5. Scenario 4 - Richiesta su targa / mezzo
- Input:
  - prompt libero su mezzo o targa, con o senza allegati
- Entity resolution:
  - pattern targa + catalogo mezzi clone-safe
- Request resolution:
  - `requestKind`: `lookup_entita` o `domanda_operativa`
  - focus: `Lettura entita e moduli pertinenti`
- Adapter coinvolti:
  - base: `adapter.d01`, `adapter.d10`
  - eventuali: `adapter.d02`, `adapter.d04`, `adapter.d07d08`, `adapter.d05`, `adapter.d06`
- Output composer:
  - risposta naturale multi-modulo con entita, adapter, vincoli e action intent
- Action intent / handoff target:
  - route principale: `/next/mezzi?targa=<targa>&mezzoId=<id>&iaHandoff=<id>`
  - eventuali route secondarie su documenti, rifornimenti o materiali
  - prefill canonico: `targa`, `vistaTarget`, eventuali `campiDaVerificare`
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale

## 6. Scenario 5 - Richiesta su autista
- Input:
  - prompt libero su `autista`, `badge`, segnali o eventi
- Entity resolution:
  - badge-first sul catalogo clone-safe autisti;
  - fallback prudente per nome
- Request resolution:
  - focus su modulo autisti;
  - selezione `autisti.admin` o `autisti.inbox` in base al contenuto
- Adapter coinvolti:
  - `adapter.d03`
- Output composer:
  - risposta naturale su autista, badge, eventi e contesto mezzo
- Action intent / handoff target:
  - route: `/next/autisti-admin?badge=<badge>&autista=<nome>&targa=<targa>&iaHandoff=<id>` oppure `/next/autisti-inbox?badge=<badge>&autista=<nome>&targa=<targa>&iaHandoff=<id>`
  - prefill canonico: `autista`, `badge`, `targa`, `vistaTarget`
  - stato consumo atteso: `letto_dal_modulo -> prefill_applicato -> completato` oppure `da_verificare`
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale

## 7. Scenario 6 - Richiesta o documento su cisterna
- Input:
  - prompt o file con segnali `cisterna`, `scheda test`, `caravate`
- Entity resolution:
  - risoluzione prudente di `cisterna` o `targa`
- Request resolution:
  - focus: `Cisterna / documentazione specialistica`
- Adapter coinvolti:
  - `adapter.d09`
- Output composer:
  - piano universale che mantiene il verticale specialistico, ma lo instrada dal core universale
- Action intent / handoff target:
  - route: `/next/cisterna/ia?targa=<targa>&documentoNome=<file>&iaHandoff=<id>`
  - prefill canonico: `flusso=cisterna_documenti`, `targa`, `documentoNome`
  - stato consumo atteso: `letto_dal_modulo -> prefill_applicato -> completato` oppure `da_verificare`
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale; il verticale resta read-only per scelta architetturale

## 8. Scenario 7 - Richiesta su materiale / inventario
- Input:
  - prompt o tabella materiali/inventario
- Entity resolution:
  - materiale da prompt, nome file o testo allegato
- Request resolution:
  - focus: `Inventario / materiali / magazzino`
- Adapter coinvolti:
  - `adapter.d05`
- Output composer:
  - risposta naturale con action intent coerente tra `Inventario` e `Materiali consegnati`
- Action intent / handoff target:
  - route: `/next/inventario?queryMateriale=<materiale>&iaHandoff=<id>` oppure `/next/materiali-consegnati?queryMateriale=<materiale>&targa=<targa>&iaHandoff=<id>`
  - prefill canonico: `queryMateriale`, `targa`, `vistaTarget`
  - stato consumo atteso: `letto_dal_modulo -> prefill_applicato -> completato` oppure `da_verificare`
- Stato copertura:
  - `assorbito`
- Gap residuo:
  - nessuno nel perimetro attuale

## 9. Regola di verifica pratica
Ogni scenario resta verificabile oggi con:
1. invio prompt o allegato da `/next/ia/interna`;
2. controllo della workbench universale;
3. controllo della sezione `/next/ia/interna/richieste`;
4. verifica della presenza di `iaHandoff=<id>` sulla route suggerita;
5. verifica del payload tracciato nel repository locale isolato del sistema universale;
6. verifica della progressione reale dello stato consumo (`creato`, `instradato`, `letto_dal_modulo`, `prefill_applicato`, `completato` o `da_verificare`).
