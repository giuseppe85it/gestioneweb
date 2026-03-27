# AUDIT CENTRO DI CONTROLLO NEXT

## 1. Scopo audit
- Verificare cosa mostra davvero la route ufficiale `/next/centro-controllo`.
- Distinguere il runtime reale della route ufficiale dalla superficie alternativa `NextCentroControlloPage.tsx`.
- Documentare dataset reali, layer normalizzati effettivamente usati, merge/dedup/normalizzazioni, criticita residue e affidabilita reale del modulo NEXT.

## 2. File NEXT realmente analizzati
- `src/App.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextCloneNavigation.ts`
- `src/next/nextData.ts`
- `src/next/NextHomePage.tsx`
- `src/next/NextOperativitaGlobalePage.tsx`
- `src/pages/CentroControllo.tsx`
- `src/pages/CentroControllo.css`
- `src/pages/Home.css`
- `src/next/next-shell.css`

## 3. Cosa mostra davvero il Centro di Controllo NEXT

### 3.1 Route ufficiale `/next/centro-controllo`
- La route ufficiale e agganciata in `src/App.tsx` a `NextCentroControlloClonePage`.
- `NextCentroControlloClonePage` non costruisce una UI nuova: monta direttamente `CentroControllo` della madre dentro un wrapper clone-safe.
- La UI realmente esposta oggi su `/next/centro-controllo` e quindi la pagina a tab della madre, con:
  - header clone-safe aggiunto dal wrapper;
  - back intercettato verso `/next/gestione-operativa`;
  - relabel di tab e CTA in ottica read-only;
  - nessun quick link NEXT;
  - nessun layer D10 applicato prima della UI ufficiale.
- I blocchi visibili reali sulla route ufficiale restano quelli del componente importato:
  - `Manutenzioni programmate`;
  - `Report rifornimenti`;
  - `Segnalazioni autisti`;
  - `Controlli KO/OK`;
  - `Richieste attrezzature`;
  - preview PDF collegate ai report del modulo importato.

### 3.2 Superficie alternativa presente nel repo ma non agganciata alla route ufficiale
- `NextCentroControlloPage.tsx` e una pagina NEXT distinta, non montata oggi da `/next/centro-controllo`.
- Questa superficie usa davvero i layer normalizzati `D10` e `D03`, ma al momento ha valore di cockpit alternativo non ufficiale.
- I blocchi renderizzati in questa pagina alternativa sono:
  - ricerca targa/autista;
  - pannello `ALERT`;
  - `Sessioni attive`;
  - `Revisioni`;
  - `Rimorchi: dove sono`;
  - `Motrici e trattori: dove sono`;
  - `Collegamenti rapidi`;
  - modal eventi autisti importanti;
  - modali prenotazione/pre-collaudo/revisione/missing presenti in UI ma con azioni bloccate o no-op nel clone.

## 4. Mappa blocchi UI -> domain/layer -> dataset reali

### 4.1 Route ufficiale `/next/centro-controllo`
| Blocco UI reale | File NEXT | Layer/domain usato davvero | Dataset reale a monte | Note |
| --- | --- | --- | --- | --- |
| Header clone-safe + banner | `src/next/NextCentroControlloClonePage.tsx` | Nessun domain dati | Nessuno | Solo copy clone-safe e intercetto back |
| Tab `Manutenzioni` | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@mezzi_aziendali` | Lettura ereditata dal componente madre montato nel clone |
| Tab `Report rifornimenti` | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@rifornimenti`, `@rifornimenti_autisti_tmp` | Merge raw lato pagina importata |
| Tab `Segnalazioni autisti` | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@segnalazioni_autisti_tmp` | Filtro/ordinamento nel componente importato |
| Tab `Controlli KO/OK` | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@controlli_mezzo_autisti` | KO/OK gestiti nel componente importato |
| Tab `Richieste attrezzature` | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@richieste_attrezzature_autisti_tmp` | Nessuna normalizzazione NEXT a monte |
| Preview PDF | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | stessi dataset delle tab | Il wrapper cambia solo il testo CTA, non la logica |

### 4.2 Superficie alternativa `NextCentroControlloPage.tsx`
| Blocco UI | File NEXT | Domain/layer | Dataset reale a monte | Normalizzazione effettiva |
| --- | --- | --- | --- | --- |
| Search/hero e shell card | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` + `nextAutistiDomain` | `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `autisti_eventi`, clone local autisti | Lookup targa/autista derivato dai read model, non da raw UI |
| `ALERT` | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@alerts_state` + dataset D10 sopra | Candidati alert da revisioni, conflitti sessione, segnalazioni nuove, eventi importanti |
| `Sessioni attive` | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` + `nextAutistiDomain` | `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `autisti_eventi`, clone local autisti | D03 dedup assignment/signal, boundary summary e anomaly list |
| `Revisioni` | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@mezzi_aziendali`, `@alerts_state` | Normalizza date, calcola scadenza se manca, incrocia prenotazione/pre-collaudo gia presenti sul mezzo |
| `Rimorchi: dove sono` | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@mezzi_aziendali` + `@storico_eventi_operativi` + `@autisti_sessione_attive` | Ricostruzione ultimo luogo e filtro esclusione asset in uso |
| `Motrici e trattori: dove sono` | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@mezzi_aziendali` + `@storico_eventi_operativi` + `@autisti_sessione_attive` | Stessa logica asset location dei rimorchi |
| `Collegamenti rapidi` | `src/next/NextCentroControlloPage.tsx` | Nessun domain dati business | costanti route + `localStorage` preferiti/usage | Favoriti/usage solo locali, nessun impatto business |

## 5. Logiche e filtri reali

### 5.1 Route ufficiale
- La route ufficiale non introduce logiche dati NEXT: eredita quelle del componente `CentroControllo` importato.
- I filtri, merge, PDF e priorita restano quelli della pagina importata.
- Il wrapper NEXT interviene solo su:
  - copy clone-safe del sottotitolo;
  - relabel dei pulsanti;
  - intercetto del bottone back;
  - osservazione DOM per riapplicare i relabel.

### 5.2 Pagina alternativa normalizzata
- `nextCentroControlloDomain` applica:
  - `normalizeNextMezzoTarga` su targhe;
  - `parseDateFlexible` e `toTimestamp` su date eterogenee;
  - `unwrapArrayValue` e `unwrapObjectValue` per shape storage non uniformi;
  - ricostruzione `prenotazioneCollaudo` e `preCollaudo`;
  - classificazione qualita `source_direct`, `derived_acceptable`, `mixed_support`, `excluded_from_v1`.
- Le revisioni:
  - usano `dataScadenzaRevisione` se presente;
  - altrimenti calcolano la prossima revisione da immatricolazione/ultimo collaudo;
  - marcano `scadenza_calcolata` quando il dato e derivato;
  - espongono solo le prime 6 piu urgenti in `revisioniUrgenti`.
- Gli alert:
  - supportano solo `revisione`, `conflitto_sessione`, `segnalazione_nuova`, `eventi_importanti_autisti`;
  - rispettano `@alerts_state` solo in lettura per ack/snooze gia esistenti;
  - escludono alert soppressi o snoozati tramite `pruneAlertsState` + `getAlertStateForCandidate`.
- I conflitti sessione:
  - si attivano se la stessa motrice o lo stesso rimorchio risultano in piu sessioni attive;
  - hanno severita `danger`;
  - qualita `derived_acceptable`.
- Le segnalazioni nuove:
  - includono solo record `stato === "nuova"` o `letta === false`;
  - marcano importanza tramite campi severita/urgenza o `flagVerifica`.
- I controlli KO:
  - provano prima i booleani forti (`ko`, `ok`, `tuttoOk`, `esito`);
  - in mancanza inferiscono KO da `check` o liste anomalie;
  - se inferito, segnano `ko_inferred_from_status`.
- Asset location:
  - esclude i mezzi/rimorchi gia in uso in sessione;
  - prende l'ultimo `luogo` dallo storico eventi per targa;
  - se manca storico, lascia `Luogo non impostato` e flag `missing_storico_luogo`.
- `nextAutistiDomain` applica:
  - merge tra storage madre, collection legacy `autisti_eventi` e dati locali clone autisti;
  - dedup assignment per badge/nome/mezzo/sourceKind;
  - dedup signal per tipo/badge/mezzo/descrizione/timestamp;
  - boundary espliciti `forte`, `prudente`, `locale`, `vuoto`;
  - anomaly list quando badge, nome o targa non si agganciano in modo forte.

## 6. Normalizzazioni applicate davvero

### 6.1 Dimostrate sulla route ufficiale
- Nessuna normalizzazione NEXT a monte della UI ufficiale.
- La route ufficiale usa il wrapper clone-safe, non il domain D10.
- L'unico miglioramento dimostrato della NEXT ufficiale rispetto alla madre su questa route e di sicurezza/contesto:
  - banner esplicito clone-safe;
  - pulsanti relabel in sola lettura;
  - back portato nel perimetro `/next`.

### 6.2 Dimostrate nella pagina alternativa
- `nextCentroControlloDomain` pulisce davvero:
  - targhe non uniformi;
  - date ISO, DMY, timestamp numerici e oggetti Firestore-like;
  - shape storage annidate (`items`, `value.items`, `value`);
  - scadenze revisione mancanti ma ricostruibili;
  - conflitti sessione e alert con metadati stabili;
  - location asset da storico eventi.
- `nextAutistiDomain` pulisce davvero:
  - collegamenti badge/nome/targa eterogenei;
  - segnali clone locali separandoli dai feed madre;
  - fallback legacy `autisti_eventi` senza promuoverlo a fonte forte.

## 7. Criticita residue dopo la normalizzazione
- Criticita principale: la route ufficiale `/next/centro-controllo` non usa il layer normalizzato, quindi il miglioramento del domain D10 non arriva alla UI ufficiale.
- `NextCentroControlloPage.tsx` contiene ancora CTA e modali presenti ma non operative:
  - ricerca autista `handleAutistaSearch` no-op;
  - edit rimorchio no-op;
  - salvataggi prenotazione/pre-collaudo/revisione no-op;
  - export alert PDF disabilitato.
- `nextCentroControlloDomain` resta intenzionalmente incompleto:
  - esclude rifornimenti, richieste attrezzature, gomme e altri feed legacy non usati nella Home clone;
  - quindi non copre l'intero perimetro funzionale del `CentroControllo` importato dalla route ufficiale.
- `@alerts_state` e solo letto: la UI alternativa non puo persistere nuovi `ack` o `snooze`, quindi il comportamento alert resta incompleto come cockpit operativo.
- La qualita `derived_acceptable` copre casi ancora fragili:
  - revisioni calcolate e non dichiarate a monte;
  - KO inferiti da status/check e non da un booleano forte;
  - ultimo luogo ricavato da storico eventi senza garanzia piena di completezza.
- `nextAutistiDomain` resta prudente su:
  - fallback legacy `autisti_eventi`;
  - segnali solo locali del clone autisti;
  - contesto autista locale che puo non trovare un aggancio forte nelle sessioni madre correnti.

## 8. Dipendenze e moduli collegati
- Dipendenze forti della route ufficiale:
  - `src/pages/CentroControllo.tsx`
  - `src/pages/CentroControllo.css`
  - `src/utils/storageSync.ts`
  - helper PDF/preview usati dal componente importato
  - dataset raw `@mezzi_aziendali`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`
- Dipendenze forti della pagina alternativa:
  - `src/next/domain/nextCentroControlloDomain.ts`
  - `src/next/domain/nextAutistiDomain.ts`
  - `src/next/nextStructuralPaths.ts`
  - `src/components/AutistiImportantEventsModal.tsx`
  - `src/utils/alertsState.ts`
  - `src/utils/dateFormat.ts`
  - `src/next/nextAnagraficheFlottaDomain.ts`
- Moduli/route richiamati dalla pagina alternativa:
  - Dossier mezzo/lista dossier;
  - Gestione Operativa;
  - Autisti Admin / Autisti Inbox;
  - IA / Libretti Export;
  - Inventario / Materiali / Manutenzioni / Procurement;
  - Cisterna;
  - Mezzi / Colleghi / Fornitori.
- Dipendenze deboli ma potenzialmente fragili:
  - shape di `@alerts_state`;
  - shape di `@storico_eventi_operativi`;
  - qualita dei campi data su `@mezzi_aziendali`;
  - semantica `stato/letta` delle segnalazioni;
  - semantica KO nei controlli.

## 9. Qualita reale del modulo NEXT
- Valutazione secca della route ufficiale: `NON PIU PULITA DELLA MADRE SUL PIANO DATI`.
- La route ufficiale e piu sicura della madre sul piano del contesto clone:
  - no-write esplicito;
  - copy onesta;
  - rientro nel perimetro NEXT.
- La route ufficiale non e piu affidabile della madre sul piano logico/dati:
  - eredita le stesse letture raw;
  - eredita gli stessi merge e filtri del componente importato;
  - non usa il read model D10.
- Valutazione della pagina alternativa `NextCentroControlloPage.tsx`: `PIU PULITA MA NON UFFICIALE`.
- Il codice normalizzato della pagina alternativa migliora davvero la leggibilita dei dati, ma oggi non basta a qualificare il modulo ufficiale `/next/centro-controllo` come realmente normalizzato.

## 10. Confronto sintetico madre vs NEXT dove rilevante
- Uguale di fatto alla madre sulla route ufficiale:
  - struttura a tab;
  - dataset letti;
  - PDF e logiche operative del componente importato.
- Migliorato nella NEXT, ma solo nel wrapper ufficiale:
  - linguaggio clone-safe;
  - ritorno verso percorso NEXT;
  - esplicitazione del perimetro read-only.
- Migliorato nella NEXT, ma solo nella pagina alternativa non agganciata:
  - normalizzazione targhe/date/shape;
  - alert/focus tipizzati;
  - boundary autisti forte/prudente/locale;
  - separazione dei limiti dentro `limitations`.
- Ancora ereditato male:
  - il modulo ufficiale non passa ancora dal layer D10 che il repo presenta come disponibile;
  - parte della documentazione generale parla del Centro di Controllo NEXT come layerizzato, ma sul path ufficiale questo oggi non e dimostrato.

## 11. Cosa e dimostrato
- `src/App.tsx` monta `NextCentroControlloClonePage` su `/next/centro-controllo`.
- `NextCentroControlloClonePage` monta `CentroControllo` della madre e non invoca `readNextCentroControlloSnapshot`.
- `NextCentroControlloPage.tsx` invoca davvero `readNextCentroControlloSnapshot` e `readNextAutistiReadOnlySnapshot`.
- `nextCentroControlloDomain.ts` legge davvero solo sei dataset: `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`.
- `nextAutistiDomain.ts` aggiunge davvero `@richieste_attrezzature_autisti_tmp`, `autisti_eventi` e i dataset locali clone autisti.
- Le azioni scriventi/operative principali della pagina alternativa restano bloccate o no-op.

## 12. Cosa resta DA VERIFICARE
- Se esiste una decisione futura gia approvata per sostituire la route ufficiale con `NextCentroControlloPage.tsx`.
- Se le semantiche KO dei controlli legacy sono davvero complete o se alcuni casi vengono persi dal criterio `excluded_from_v1`.
- Se `@alerts_state` contiene sempre metadati coerenti con gli alert derivati dal domain D10.
- Se i campi `prenotazioneCollaudo` e `preCollaudo` su `@mezzi_aziendali` sono sempre valorizzati con shape compatibile.
- Se `@storico_eventi_operativi` mantiene davvero il `luogo` in modo affidabile abbastanza da sostenere il blocco asset location.

## 13. Tabella finale blocco -> domain -> dataset -> logica -> rischio -> affidabilita
| Blocco UI | File NEXT | Domain/layer | Dataset reale a monte | Normalizzazione | Logica reale | Rischio | Affidabilita | Stato prova |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route ufficiale `/next/centro-controllo` | `src/next/NextCentroControlloClonePage.tsx` | Nessuno | Nessuno diretto nel wrapper | Solo relabel/back/banner | Monta `CentroControllo` importato senza D10 | Alto | Media lato UX clone, bassa lato pulizia dati | DIMOSTRATO |
| Manutenzioni programmate | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@mezzi_aziendali` | Nessuna NEXT | Lista/filtri ereditati dal componente importato | Alto | Bassa come modulo NEXT normalizzato | DIMOSTRATO |
| Report rifornimenti | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@rifornimenti` + `@rifornimenti_autisti_tmp` | Nessuna NEXT | Merge raw e report PDF del componente importato | Alto | Bassa | DIMOSTRATO |
| Segnalazioni autisti | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@segnalazioni_autisti_tmp` | Nessuna NEXT | Filtri e ordinamenti ereditati | Medio | Bassa | DIMOSTRATO |
| Controlli KO/OK | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@controlli_mezzo_autisti` | Nessuna NEXT | Lista KO/OK del componente importato | Medio | Bassa | DIMOSTRATO |
| Richieste attrezzature | `src/next/NextCentroControlloClonePage.tsx` -> `src/pages/CentroControllo.tsx` | Nessun layer NEXT | `@richieste_attrezzature_autisti_tmp` | Nessuna NEXT | Lista richieste del componente importato | Medio | Bassa | DIMOSTRATO |
| ALERT | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@alerts_state` + dataset D10 | Si | Candidati da revisioni, conflitti, segnalazioni nuove, eventi importanti | Medio | Media | DIMOSTRATO MA NON UFFICIALE |
| Sessioni attive | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` + `nextAutistiDomain` | `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `autisti_eventi`, clone locale | Si | Boundary D03 + lista sessioni attive | Medio | Media | DIMOSTRATO MA NON UFFICIALE |
| Revisioni | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@mezzi_aziendali`, `@alerts_state` | Si | Scadenza diretta o calcolata, top 6 urgenti | Medio | Media | DIMOSTRATO MA NON UFFICIALE |
| Rimorchi dove sono | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@mezzi_aziendali` + `@storico_eventi_operativi` + `@autisti_sessione_attive` | Si | Ultimo luogo noto escludendo asset in uso | Medio | Media-bassa | DIMOSTRATO MA NON UFFICIALE |
| Motrici e trattori dove sono | `src/next/NextCentroControlloPage.tsx` | `nextCentroControlloDomain` | `@mezzi_aziendali` + `@storico_eventi_operativi` + `@autisti_sessione_attive` | Si | Ultimo luogo noto escludendo asset in uso | Medio | Media-bassa | DIMOSTRATO MA NON UFFICIALE |
| Collegamenti rapidi | `src/next/NextCentroControlloPage.tsx` | Nessun domain dati business | costanti route + `localStorage` favoriti | Parziale | Ricerca e ranking locale dei quick link | Basso | Alta | DIMOSTRATO MA NON UFFICIALE |
