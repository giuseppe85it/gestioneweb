# Audit Readiness Chat IA NEXT 2026-05-04

## 1. Identita del documento
- Versione: v1.0
- Data: 2026-05-04
- Tipo: AUDIT readiness (solo lettura)
- Output successivo: PROMPT B (whitelist patch) + PROMPT C (scope copertura)
- Perimetro: audit statico su backend `backend/internal-ai/server/**`, frontend `src/next/chat-ia/**`, Registro Collection Firestore v0.6, spec Zero-Invenzioni e spec Motore Generico.
- Privacy: il documento usa solo path, linee, nomi di campo, nomi collection e stati architetturali. Nessun nome, badge, targa, id reale o valore Firestore e' riportato.

## 2. Stato runtime attuale chat IA

| Area | File / evidenza | Stato | Note readiness |
|---|---|---|---|
| Backend adapter chat | `backend/internal-ai/server/internal-ai-adapter.js:58-59`, `:68`, `:3492-3499` | operativo | Usa il vecchio resolver di default. Shadow comparator attivo solo con `CHAT_IA_SHADOW_RESOLVER === "1"`. |
| Vecchio resolver Driver360 | `backend/internal-ai/server/lib/post-llm-resolver.js:5`, `:126-132`, `:147-155`, `:263-279` | runtime / legacy | Copre solo Driver360 autista su `storage/@colleghi`; `resolvedFilters` e' single-record. |
| Nuovo resolver universale Fase A | `backend/internal-ai/server/lib/registry.config.js:12-55`, `backend/internal-ai/server/lib/universal-resolver.js:259-337` | isolato / shadow | Copertura attuale: `driver360.colleghi` con `accessMode exact_document`. Non e' instradato come fonte runtime primaria. |
| Shadow comparator | `backend/internal-ai/server/lib/shadow-comparator.js`, adapter `internal-ai-adapter.js:3497-3499` | disponibile dietro env flag | Ritorna sempre output legacy; report automatico gia' prodotto in `docs/audit/REPORT_SHADOW_VALIDATION_FASE_A_2026-05-04.md`. |
| Boundary readonly | `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js:664-1364` | attivo | 32 entry `exact_document`, 6 entry `collection_root` dormienti, 1 entry `exact_object_path_from_firestore_field`. Esclusioni sensibili governate da `allowedFields`/`forbiddenFields`. |
| Frontend chat ufficiale | `src/App.tsx:482-494`, `src/next/components/HomeInternalAiLauncher.tsx:17`, `:64-66` | doppio ingresso | `/next/chat` usa `ChatIaPage` e shell locale; `/next/chat-tool` usa `ChatIaToolUsePage`. Il launcher apre `/next/chat`, non il flusso tool-use. |
| Vista Driver360 | `src/next/chat-ia/views/Driver360.tsx:81-218` | presente | Rendering principale presente, ma mostra prova tecnica in chiaro (`sourceCollection`, `sourceRecordId`, `sourceField`, `rule`, `certainty`) a `:53-78` e mostra ID tecnico a `:193-196`. |
| Viste Vehicle360 / Site360 / Euromecc360 / Ricerca360 | `src/next/chat-ia/core/chatIaTypes.ts:346`, `src/next/chat-ia/components/ChatIaMessageItem.tsx:178-183` | enum presenti, UI non implementata | Il renderer mostra placeholder "Vista richiesta non ancora disponibile". |

## 3. Mappa output utente attuale (cosa l'utente vede)

| Casistica | File componente coinvolto | Output pulito principale | Grezzo tecnico a video | Pannello collassabile "Perche' vedo questo dato?" | `message.text` libero LLM in rendering |
|---|---|---:|---:|---:|---:|
| Driver360 via flusso tool-use | `ChatIaMessageItem.tsx:171-175`, `Driver360.tsx:174-218` | parziale | si, `Driver360.tsx:53-78` espone campi proof tecnici in chiaro; `:193-196` espone ID tecnico | assente | assente nel messaggio Zero-Invenzioni: `ChatIaToolUsePage.tsx:42-60`, `ChatIaMessageItem.tsx:260-263` |
| Driver360 disambiguazione | `Driver360.tsx:23-50` | parziale | no proof tecnico, ma candidato non ha handler operativo (`onClick={() => undefined}` a `:41`) | assente | assente |
| Vehicle360 | `ChatIaMessageItem.tsx:178-183` | no, placeholder | no | assente | assente se arriva come `zeroMessage` |
| Site360 | `ChatIaMessageItem.tsx:178-183` | no, placeholder | no | assente | assente se arriva come `zeroMessage` |
| Euromecc360 | `ChatIaMessageItem.tsx:178-183` | no, placeholder | no | assente | assente se arriva come `zeroMessage` |
| Ricerca360 | `ChatIaMessageItem.tsx:178-183` | no, placeholder | no | assente | assente se arriva come `zeroMessage` |
| Fallback intent non in catalog | `catalog-validator.js:375-385`, `ChatIaMessageItem.tsx:151-164` | si, messaggio parametrico | no | assente | assente se passa da `zeroMessage` |
| Errore generico / trasporto | `chatIaBackendBridge.ts:247-249`, `ChatIaMessageItem.tsx:151-164` | si, messaggio parametrico | no | assente | assente se passa da `zeroMessage` |
| Route ufficiale `/next/chat` | `src/App.tsx:482-488`, `ChatIaPage.tsx:1-7`, `ChatIaShell.tsx:107-172` | DA VERIFICARE per ogni settore | rischio legacy: usa router/runner locali e `refineChatIaRunnerResult`, non il tool-use backend Zero-Invenzioni | assente | assistant `message.text` non viene stampato da `ChatIaMessageItem.tsx:260-263`, ma il flusso non e' quello del motore generico |

Nota rilevante: la vista Driver360 non usa solo i dati gia' risolti dal backend. Dopo `resolvedFilters.driverId`, rilegge dati lato frontend con `readNextColleghiSnapshot` (`Driver360.tsx:100`) e relazioni con `resolveDriverVehicleRelations` (`Driver360.tsx:114`). I reader coinvolti leggono domini piu' ampi: `nextColleghiDomain.ts:151-195` normalizza anche campi sensibili o liberi, pur non mostrandoli direttamente in Driver360; `driverRelationResolver.ts:92-108` incrocia snapshot flotta/autisti frontend. Questo e' un punto da riallineare al contratto boundary/provenance del motore.

## 4. Lacune bloccanti per readiness

1. **Driver360 espone prova tecnica in chiaro**
   - File: `src/next/chat-ia/views/Driver360.tsx:53-78`, `:200-209`.
   - Impatto utente concreto: l'utente vede nomi di campi tecnici (`sourceCollection`, `sourceRecordId`, `sourceField`, `rule`, `certainty`) dentro la scheda, invece di una prova leggibile o collassata.
   - Categoria: FRONTEND.
   - Criticita: BLOCCANTE READINESS.

2. **Driver360 espone ID tecnico come dato primario**
   - File: `src/next/chat-ia/views/Driver360.tsx:193-196`.
   - Impatto utente concreto: l'ID Firestore/tecnico viene mostrato nella sezione anagrafica principale, non in una sezione prove.
   - Categoria: FRONTEND.
   - Criticita: BLOCCANTE READINESS.

3. **Route ufficiale non usa il flusso tool-use Zero-Invenzioni**
   - File: `src/App.tsx:482-494`, `src/next/components/HomeInternalAiLauncher.tsx:17`, `:64-66`, `src/next/chat-ia/ChatIaPage.tsx:1-7`.
   - Impatto utente concreto: l'ingresso utente apre `/next/chat`, che usa `ChatIaShell` e runner locali, mentre il flusso con adapter, catalog validator, post-LLM resolver e shadow comparator vive su `/next/chat-tool`.
   - Categoria: FRONTEND / BACKEND.
   - Criticita: BLOCCANTE READINESS.

4. **Driver360 rilegge dati e relazioni lato frontend fuori dal collettore certificato del motore**
   - File: `Driver360.tsx:100`, `:114`; `nextColleghiDomain.ts:151-195`, `:266-317`; `driverRelationResolver.ts:92-108`.
   - Impatto utente concreto: la scheda visualizzata non e' ancora completamente derivata dalla shape certificata `ResolvedFiltersV2`/provenance del motore. Alcuni reader frontend normalizzano campi non destinati alla chat.
   - Categoria: BACKEND / FRONTEND / DATI.
   - Criticita: BLOCCANTE READINESS per switch full; non blocca la sola pulizia visuale.

5. **Disambiguazione Driver360 non selezionabile**
   - File: `Driver360.tsx:36-45`, in particolare `:41`.
   - Impatto utente concreto: se il backend produce candidati certificati, l'utente li vede ma il click non applica la scelta.
   - Categoria: FRONTEND.
   - Criticita: BLOCCANTE READINESS.

6. **Il nuovo resolver non e' ancora fonte runtime primaria**
   - File: `internal-ai-adapter.js:3497-3499`, `REPORT_SHADOW_VALIDATION_FASE_A_2026-05-04.md`.
   - Impatto utente concreto: la parita' tecnica Fase A e' stata validata in shadow, ma l'utente continua a dipendere dal resolver legacy finche' non esiste uno switch controllato.
   - Categoria: BACKEND.
   - Criticita: BLOCCANTE READINESS per chiusura Fase A; da eseguire dopo la pulizia output.

7. **Le viste diverse da Driver360 sono solo placeholder**
   - File: `chatIaTypes.ts:346`, `ChatIaMessageItem.tsx:178-183`.
   - Impatto utente concreto: richieste su mezzo, cantiere, Euromecc o ricerca generale non aprono ancora viste dati reali.
   - Categoria: FRONTEND / BACKEND.
   - Criticita: NON BLOCCANTE READINESS per PROMPT B, BLOCCANTE COPERTURA per PROMPT C.

8. **Le entry `collection_root` restano dormienti**
   - File: `REGISTRO_COLLECTION_FIRESTORE.md:437-446`, boundary `internal-ai-firebase-readonly-boundary.js:1265-1349`.
   - Impatto utente concreto: Euromecc e root documentali/Cisterna non possono essere coperte dal motore finche' la Fase B non consuma `collection_root`.
   - Categoria: BACKEND / DATI.
   - Criticita: NON BLOCCANTE READINESS per PROMPT B, BLOCCANTE COPERTURA per PROMPT C.

## 5. Whitelist patch per PROMPT B

1. **Pulizia output Driver360 e collasso prove tecniche**
   - File da toccare: `src/next/chat-ia/views/Driver360.tsx`, eventuale `src/next/chat-ia/views/driver360.css`.
   - Cosa modificare: nascondere `relationProof` tecnico dietro un blocco collassabile minimo; mostrare nella vista primaria solo dati certificati leggibili e rimuovere l'ID tecnico dalla sezione anagrafica principale.
   - Vincoli: non cambiare shape `legacyDriver360`; non cambiare boundary; nessun dato libero LLM.
   - Dipendenze: nessuna.
   - Categoria: FRONTEND.
   - Esito atteso utente: Driver360 resta leggibile e le fonti tecniche non sono piu' in faccia.

2. **Rendere `/next/chat` l'ingresso Zero-Invenzioni tool-use**
   - File da toccare: `src/next/chat-ia/ChatIaPage.tsx` oppure `src/App.tsx` e `src/next/components/HomeInternalAiLauncher.tsx`, scegliendo il punto minimo.
   - Cosa modificare: l'ingresso ufficiale usato dal launcher deve aprire il flusso che chiama `runToolUseConversation`, non la shell locale legacy.
   - Vincoli: mantenere `/next/chat-tool` come alias o route tecnica se utile; non rimuovere codice legacy in questo prompt.
   - Dipendenze: intervento 1 consigliato prima del test utente.
   - Categoria: FRONTEND.
   - Esito atteso utente: la chat aperta dalla home usa adapter, catalog validator, resolver e shadow/full switch.

3. **Rimuovere etichetta utente "Tool Use" dalla UI canonica**
   - File da toccare: `src/next/chat-ia/ChatIaToolUsePage.tsx`.
   - Cosa modificare: titolo e aria-label devono presentare il prodotto come Chat IA NEXT, non come dettaglio tecnico di implementazione.
   - Vincoli: nessun cambio del flusso backend.
   - Dipendenze: intervento 2.
   - Categoria: FRONTEND.
   - Esito atteso utente: l'ingresso canonico non espone lessico tecnico.

4. **Gestire click di disambiguazione Driver360 senza LLM libero**
   - File da toccare: `src/next/chat-ia/views/Driver360.tsx`, eventualmente `src/next/chat-ia/ChatIaToolUsePage.tsx` se serve propagare la scelta certificata.
   - Cosa modificare: il candidato certificato deve poter fissare il filtro risolto o generare una nuova richiesta strutturata senza testo libero LLM.
   - Vincoli: il candidato arriva dal backend; nessun fuzzy match; nessuna scelta automatica dell'LLM.
   - Dipendenze: intervento 2.
   - Categoria: FRONTEND.
   - Esito atteso utente: una disambiguazione prodotta dal backend e' completabile.

5. **Harden del rendering assistant non-Zero sulla route canonica**
   - File da toccare: `src/next/chat-ia/components/ChatIaMessageItem.tsx`.
   - Cosa modificare: assicurare che sulla route canonica nessun assistant message senza `zeroMessage` possa mostrare testo libero o blocchi legacy non certificati; mantenere user text visibile.
   - Vincoli: non rompere report/archive se restano su flussi legacy; fallback deve essere parametrico.
   - Dipendenze: intervento 2.
   - Categoria: FRONTEND.
   - Esito atteso utente: nessun output narrativo legacy riemerge per errore sulla chat canonica.

6. **Allineare Driver360 al contratto dati certificato minimo**
   - File da toccare: `src/next/chat-ia/views/Driver360.tsx`, `src/next/chat-ia/relations/driverRelationResolver.ts`, eventualmente adapter/bridge se serve passare provenance gia' certificata.
   - Cosa modificare: limitare l'uso dei reader frontend ai soli campi necessari e gia' ammessi dal boundary, oppure consumare dati/provenance dal backend quando disponibili.
   - Vincoli: in caso di dubbio, non leggere ne' mostrare campi non in `allowedFields`; non introdurre `collection_root`.
   - Dipendenze: interventi 1 e 2.
   - Categoria: FRONTEND / BACKEND.
   - Esito atteso utente: Driver360 mostra dati certificati senza dipendere da normalizzazioni frontend piu' ampie del necessario.

7. **Switch full Driver360 controllato dopo pulizia output**
   - File da toccare: `backend/internal-ai/server/internal-ai-adapter.js`, eventuale modulo nuovo di bridge se serve mantenere fallback.
   - Cosa modificare: introdurre switch controllato dal vecchio resolver al Resolver universale Fase A per Driver360, con env flag di emergenza e fallback automatico al legacy in caso di errore.
   - Vincoli: il vecchio resolver resta disponibile; output downstream invariato; nessun `collection_root`; nessun cambio boundary.
   - Dipendenze: interventi 1, 2, 5, 6.
   - Categoria: BACKEND.
   - Esito atteso utente: Driver360 puo' usare il nuovo resolver senza regressione visibile e con rollback immediato.

## 6. Scope copertura moduli per PROMPT C

| Priorita' | Modulo | Collection target | accessMode richiesto | Stato boundary | Stato registro v0.6 | Stato motore (Fase A/B/...) | Note |
|---:|---|---|---|---|---|---|---|
| 1 | autisti | `storage/@colleghi` | `exact_document` | attivo | verificata runtime | Fase A parziale | Gia' coperto da `driver360.colleghi`; serve estendere a sessioni/relazioni. |
| 2 | sessioni attive | `storage/@autisti_sessione_attive` | `exact_document` | attivo | verificata runtime | richiede config exact_document | Fonte forte per assetto corrente; prima estensione naturale dopo autisti. |
| 3 | mezzi | `storage/@mezzi_aziendali` | `exact_document` | attivo | verificata runtime | richiede config exact_document | Necessario per Vehicle360 e relazione autista-mezzo. |
| 4 | rifornimenti | `storage/@rifornimenti_autisti_tmp`, `storage/@rifornimenti` | `exact_document` | attivo | verificata runtime / post-update | richiede config exact_document | Copre feed autisti e dossier/business. |
| 5 | manutenzioni | `storage/@manutenzioni` | `exact_document` | attivo | post-update allowedFields | richiede config exact_document | Modulo tecnico Vehicle360/Ricerca360. |
| 6 | lavori | `storage/@lavori` | `exact_document` | attivo | post-update allowedFields | richiede config exact_document | Collegamenti mezzo/cantiere/lavoro. |
| 7 | inventario | `storage/@inventario` | `exact_document` | attivo | post-update allowedFields | richiede config exact_document | Base magazzino/materiali. |
| 8 | materiali consegnati | `storage/@materialiconsegnati` | `exact_document` | attivo | post-update allowedFields | richiede config exact_document | Collegamenti materiale/cantiere/fornitore. |
| 9 | ordini | `storage/@ordini` | `exact_document` | attivo | post-update allowedFields | richiede config exact_document | Procurement; attenzione a path foto annidati documentati solo come alias. |
| 10 | preventivi | `storage/@preventivi`, `storage/@preventivi_approvazioni` | `exact_document` | attivo | verificata runtime / post-update | richiede config exact_document | URL firmati esclusi; usare solo path tecnici ammessi. |
| 11 | fornitori | `storage/@fornitori` | `exact_document` | attivo | post-update allowedFields | richiede config exact_document | Chiave forte preferita se presente; nomi solo ricerca/disambiguazione. |
| 12 | documenti | root `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` | `collection_root` + patch boundary root | non attivo per root | BLOCCO RUNTIME / deprecate le voci `storage/@documenti_*` | Fase B dopo boundary root | Lacune scrittura note: flussi con shape diverse e path tecnico non sempre persistito. |
| 13 | cisterna | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili` | `collection_root` + patch boundary root | non attivo per root | BLOCCO RUNTIME | Fase B dopo boundary root | Include lacuna path tecnico crop per schede IA; runtime check futuro. |
| 14 | euromecc | `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`, `euromecc_extra_components`, `euromecc_relazioni` | `collection_root` | dichiarato ma dormiente | dichiarate non operative fino a patch resolver | Fase B | Le entry boundary esistono ma il motore deve consumare `collection_root`. |

## 7. Pannello prove "Perche' vedo questo dato?"
- Stato attuale: parziale / assente come pannello. Esiste `relationProof` dati (`chatIaTypes.ts:423-435`) e rendering diretto in `Driver360.tsx:53-78`, ma non un pannello collassabile.
- Path componenti coinvolti: `src/next/chat-ia/views/Driver360.tsx`, `src/next/chat-ia/components/ChatIaMessageItem.tsx`.
- Contratto dati gia' disponibile dal motore: parziale. La spec Motore Generico definisce provenance e contratto pannello in `SPEC_MOTORE_GENERICO_NEXT.md:351-383`; il resolver universale Fase A produce record certificati, ma la vista Driver360 corrente non consuma ancora il collettore multi-record come sorgente primaria.
- Lacune di rendering: prove tecniche visibili in chiaro; nessun componente collassabile; nessuna distinzione utente tra prova leggibile e dettaglio tecnico.
- Nota operativa: la pulizia minima del PROMPT B puo' procedere senza `SPEC_PANNELLO_PROVE_NEXT.md`, limitandosi a un collassabile minimo che nasconde i dettagli tecnici esistenti. La spec dedicata resta necessaria per il pannello completo del PROMPT C.

## 8. Test automatici proposti per PROMPT C
- Niente `message.text` libero in rendering assistant sulla route canonica.
- Niente output LLM libero su dati business.
- Niente campi fuori `allowedFields` esposti al frontend.
- Niente relazione critica senza `relationProof`.
- Query autista sintetica non inventa.
- Query mezzo sintetica non inventa.
- Query magazzino sintetica non inventa.
- Query documenti non espone URL firmati.
- Pannello prove presente e collassato di default.
- Shadow comparator funzionante come regressione, usando il report di validazione Fase A come baseline.
- Route `/next/chat` e `/next/chat-tool` non divergono nel percorso canonico previsto.
- Fallback intent non in catalog resta parametrico e non mostra testo LLM libero.

## 9. Decisioni rinviate (open questions)
1. Il periodo (`periodPreset`) resta inizialmente Driver360-only o viene esteso a tutte le viste 360 nel primo ciclo del motore?
2. La "vista config" sara' configurazione dichiarativa statica o generata da registry config runtime derivato?
3. Le letture `collection_root` avranno cache assente, breve TTL o solo on-demand?
4. Le 6 entry Euromecc dormienti richiedono revisione `allowedFields` prima della Fase B o sono sufficienti come primo test?
5. Il pannello prove minimo del PROMPT B resta locale a Driver360 o diventa subito componente condiviso?
6. Quando una root collection documentale ha flussi di scrittura con shape diversa, quale shape viene promossa come contratto operativo del motore?

## 10. Verdetto operativo
- PROMPT B copre 7 interventi della whitelist (vedi §5).
- PROMPT C copre 14 moduli + pannello prove + test (vedi §6, §7, §8).
- Audit di readiness completato. Nessun test manuale richiesto a Giuseppe in questa fase.
