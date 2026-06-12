# AUDIT - Mappatura reale maschere gomme da record manutenzioni

Data audit: 2026-06-10

Modalita: AUDIT ONLY. Nessuna modifica runtime, nessuna modifica asset, nessuna modifica salvataggi, nessuna logica nuova.

## 1. File letti

Documentazione:

- `AGENTS.md`
- `docs/audit/AUDIT_INTEGRAZIONE_SCHEMA_GOMME_DETTAGLIO_MANUTENZIONE.md`
- `docs/audit/AUDIT_SCHEMA_IMPORT_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`
- `docs/audit/AUDIT_SOLUZIONE_GOMME_DINAMICHE_UI_2026-06-08.md`
- `docs/audit/AUDIT_UI_GOMME_NEXT_2026-06-08.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

Codice:

- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextTyreVehicleViewDemoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`
- `src/next/writers/nextChiusuraEventoWriter.ts`
- `src/next/autisti/NextModalGomme.tsx`
- `src/autisti/GommeAutistaModal.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/components/NextImportGommeChiusuraModal.tsx`
- `src/next/autisti/nextAutistiCloneSegnalazioni.ts`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/autisti/Segnalazioni.tsx`
- `src/components/wheels.ts`

## 2. Storage letti readonly

Lettura eseguita in sola lettura da Firestore, collection `storage`, con service account indicato dal progetto. Nessuna scrittura eseguita.

| Storage key | Esiste | Record totali | Record gomme/pertinenti | Note |
| --- | ---: | ---: | ---: | --- |
| `@manutenzioni` | SI | 82 | 16 strutturati gomme | Storico ufficiale manutenzioni. |
| `@cambi_gomme_autisti_tmp` | SI | 9 | 9 eventi gomme | Eventi tmp da app autisti. |
| `@gomme_eventi` | SI | 11 | 11 eventi gomme | Eventi gomme ufficializzati; presenti duplicati storici same-id. |
| `@segnalazioni_autisti_tmp` | SI | 46 | 4 segnalazioni gomme strutturate asse/problema | `posizioneGomma` e `problemaGomma` sono asse-level. |
| `@controlli_mezzo_autisti` | SI | 417 | 3 controlli gomme pertinenti | Testo/note e `check.gomme`, nessuna posizione singola. |

## 3. Campi reali trovati

### `@manutenzioni`

Campi gomme strutturati presenti:

- `gommeInterventoTipo`: 16 record, valori `ordinario` / `straordinario`.
- `assiCoinvolti`: 11 record, valori trovati `anteriore`, `posteriore`, `asse1`, `asse2`, `asse3`.
- `gommePerAsse`: 11 record, shape `{ asseId, dataCambio, kmCambio }`.
- `gommeStraordinario`: 4 record, shape `{ asseId, quantita, motivo }`.
- Campi generici utili al dettaglio: `targa`, `data`, `dataEsecuzione`, `stato`, `descrizione`, `km`, `fornitore`, `segnalatoDa`, `origineRefKey`, `origineRefId`, `chiusuraDi`, `chiusuraRefId`.

Conferma codice:

- Tipi gomme in `nextManutenzioniDomain.ts`: `AsseCoinvoltoId = "anteriore" | "posteriore" | "asse1" | "asse2" | "asse3"`.
- Ordinario: `gommePerAsse[{ asseId, dataCambio, kmCambio }]`.
- Straordinario: `gommeStraordinario{ asseId, quantita, motivo }`.
- Il form Manutenzioni costruisce payload per asse e payload straordinario, non singola gomma.

### `@cambi_gomme_autisti_tmp` e `@gomme_eventi`

Campi evento trovati:

- `targetTarga`
- `targetType`
- `categoria`
- `km`
- `tipo`
- `marca`
- `gommeIds`
- `asseId`
- `asseLabel`
- `rotazioneText`
- `autista`

Valori `gommeIds` trovati:

- `trattore-anteriore-0`
- `trattore-posteriore-1`
- `trattore-posteriore-2`
- `semirimorchioFissi-asse3-2`
- `semirimorchioSterzante-asse1-0`
- `SOSTITUZIONE VALVOLA LATO SX 3 ASSE`

Nota critica: gli eventi hanno `gommeIds`, ma non salvano un campo lato DX/SX in modo utilizzabile nel Dettaglio ufficiale. Inoltre questi campi evento non sono presenti nel record ufficiale `@manutenzioni`.

### `@segnalazioni_autisti_tmp`

Campi gomme trovati:

- `tipoProblema="gomme"`
- `posizioneGomma`
- `problemaGomma`
- `descrizione`
- `chiusuraDi`
- `chiusuraRefId`

Valori osservati:

- `posizioneGomma="asse1"`
- `posizioneGomma="asse2"`
- `posizioneGomma="posteriore"`
- `problemaGomma="forata"`
- `problemaGomma="usurata"`

Questi sono dati di asse/posizione generica, non pneumatico singolo interno/esterno.

### `@controlli_mezzo_autisti`

Campi gomme pertinenti:

- `check.gomme`
- `note`
- `chiusuraDi`
- `chiusuraRefId`

Esempi trovati:

- `Sostituzione gomme 3 Asse km294278`
- `usura pneumatici 1 asse`
- `1 asse rimorchio gomme lisce`

Il dato e' testuale o asse-level. Non contiene singola gomma.

## 4. Campi mancanti

Nei cinque storage letti readonly, conteggio campi posizione singola:

| Campo | `@manutenzioni` | tmp/eventi gomme | segnalazioni/controlli | Verdetto |
| --- | ---: | ---: | ---: | --- |
| `gommePosizioni` | 0 | 0 | 0 | NON TROVATO |
| `posizionePneumatico` | 0 | 0 | 0 | NON TROVATO |
| `pneumaticoId` | 0 | 0 | 0 | NON TROVATO |
| `lato` | 0 | 0 | 0 | NON TROVATO |
| `internoEsterno` | 0 | 0 | 0 | NON TROVATO |
| `latoGomma` | 0 | 0 | 0 | NON TROVATO |

Conclusione: oggi manca un campo posizione strutturato che dica, per esempio, `anterioreDx`, `posterioreDxEsterna`, `posterioreDxInterna`.

## 5. Flusso salvataggio gomme attuale

### Ordinario da Manutenzioni NEXT

Flusso:

```text
NextManutenzioniPage
  -> subtype gomme ordinario
  -> selezione assi
  -> buildGommePerAssePayload()
  -> saveNextManutenzioneBusinessRecord()
  -> @manutenzioni
```

Campi scritti:

- `gommeInterventoTipo="ordinario"`
- `assiCoinvolti[]`
- `gommePerAsse[{ asseId, dataCambio, kmCambio }]`

Limite: non viene scritta nessuna posizione singola DX/SX, interna/esterna.

### Straordinario da Manutenzioni NEXT

Flusso:

```text
NextManutenzioniPage
  -> subtype gomme straordinario
  -> motivo + asse facoltativo + quantita facoltativa
  -> buildGommeStraordinarioPayload()
  -> saveNextManutenzioneBusinessRecord()
  -> @manutenzioni
```

Campi scritti:

- `gommeInterventoTipo="straordinario"`
- `gommeStraordinario={ asseId, quantita, motivo }`

Limite: anche qui il dato si ferma ad asse/motivo/quantita. Non distingue pneumatico singolo.

### Da segnalazione/controllo

`nextManutenzioneDaFareCreateWriter` puo creare un record `daFare` in `@manutenzioni` da sorgente gomme esplicita.

Campi certi:

- asse da `posizioneGomma` / testo controllo quando normalizzabile;
- motivo da `problemaGomma` o testo compatibile;
- marker parziale in `gommeStraordinario`.

Limite: la sorgente stessa e' asse-level. Non contiene interna/esterna/DX/SX.

## 6. Flusso autisti / box / eventi gomme

### App autisti

`GommeAutistaModal` e `NextModalGomme` permettono selezione visiva gomma/asse e producono eventi con:

- `targetTarga`
- `targetType`
- `categoria`
- `km`
- `tipo`
- `marca`
- `gommeIds`
- `asseId`
- `asseLabel`
- `autista`

La UI ha stato locale `lato` DX/SX per mostrare il disegno, ma quel lato non viene salvato nel record evento.

### Admin / import eventi

`NextAutistiAdminNative.confirmImportGommeRecord`:

- appende l'evento in `@gomme_eventi` con guardia same-id;
- chiude candidati gia esistenti in `@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`;
- aggiorna il tmp come importato.

Non crea automaticamente una nuova manutenzione ufficiale in `@manutenzioni`.

### Dossier / reader gomme

`nextManutenzioniGommeDomain` legge e converge:

- `@manutenzioni`
- `@cambi_gomme_autisti_tmp`
- `@gomme_eventi`

Questo serve per visibilita e dedup, ma non promuove un evento a manutenzione ufficiale e non aggiunge posizione singola al record.

## 7. Matrice mappabilita

| Caso | Verdetto | Motivo |
| --- | --- | --- |
| Record gomme si/no | MAPPABILE ORA CON CERTEZZA | `gommeInterventoTipo`, `assiCoinvolti`, `gommePerAsse`, `gommeStraordinario`, tipo/testo gomme. |
| Tipo ordinario/straordinario | MAPPABILE ORA CON CERTEZZA | Campo `gommeInterventoTipo` nei record strutturati. |
| Asse coinvolto | MAPPABILE ORA CON CERTEZZA | `assiCoinvolti`, `gommePerAsse[].asseId`, `gommeStraordinario.asseId`. |
| Data cambio / km cambio | MAPPABILE ORA CON CERTEZZA | `gommePerAsse[].dataCambio`, `gommePerAsse[].kmCambio`, `data`, `km`. |
| Motivo straordinario | MAPPABILE ORA CON CERTEZZA | `gommeStraordinario.motivo`. |
| Quantita straordinaria | MAPPABILE ORA CON CERTEZZA se campo presente | `gommeStraordinario.quantita`, ma spesso e' null. |
| `anteriore DX` | NON MAPPABILE OGGI | `@manutenzioni` ha al massimo `anteriore`, non lato DX. |
| `posteriore DX esterna` | NON MAPPABILE OGGI | Non esiste campo interna/esterna e non esiste campo lato. |
| `posteriore DX interna` | NON MAPPABILE OGGI | Non esiste campo interna/esterna e non esiste campo lato. |
| `lato SX 3 asse` | DA NON ACCENDERE PER RISCHIO ERRORE | Testo indica SX, maschere attuali sono DX. |
| `asse 3` | MAPPABILE SOLO PARZIALMENTE | Indica asse, non lato, non gomma interna/esterna. |
| `gemellato posteriore` | MAPPABILE SOLO PARZIALMENTE | Indica gruppo/asse, non singola gomma. |
| `sostituzione valvola` | MAPPABILE SOLO PARZIALMENTE | Motivo mappabile; pneumatico singolo no. |
| `cambio gomme completo` | MAPPABILE SOLO PARZIALMENTE | Si puo mappare asse/intervento; non singola gomma salvo campo futuro. |
| `quantita 2 gomme` | MAPPABILE SOLO PARZIALMENTE | Quantita non dice quali due gomme. |
| `rimorchio` / `cisterna` / `semirimorchio` | MAPPABILE SOLO PARZIALMENTE | Categoria utile per asset, non per posizione singola. |
| `trattore stradale` | MAPPABILE SOLO PARZIALMENTE | Categoria compatibile con maschere DX disponibili, ma non basta per sapere quale gomma. |

Verdetto operativo: oggi il Dettaglio puo mostrare solo schema neutro + dati asse/intervento. Nessuna maschera DX deve essere accesa da record reali attuali.

## 8. Analisi caso `SOSTITUZIONE VALVOLA LATO SX 3 ASSE`

Record ufficiale in `@manutenzioni`:

- id: `from-gomme-evento-71f003d9-59b4-4ce5-9301-852723bfa937`
- targa: `TI282780`
- data: `2026-05-26`
- `gommeInterventoTipo`: `straordinario`
- `gommeStraordinario.asseId`: `asse3`
- `gommeStraordinario.motivo`: `sostituzione valvola lato sx`
- descrizione: `CAMBIO GOMME - straordinario / SOSTITUZIONE VALVOLA LATO SX 3 ASSE / Km evento autista: 1234 (non importato nel campo km)`
- `segnalatoDa`: `SANDRO CALABRESE`
- `origineRefKey`: `@gomme_eventi`
- `origineRefId`: `71f003d9-59b4-4ce5-9301-852723bfa937`

Evento sorgente in `@cambi_gomme_autisti_tmp` e `@gomme_eventi`:

- `targetTarga`: `TI282780`
- `targetType`: `rimorchio`
- `categoria`: `semirimorchio asse fisso`
- `asseId`: `asse3`
- `asseLabel`: `3° asse`
- `gommeIds`: `["SOSTITUZIONE VALVOLA LATO SX 3 ASSE"]`
- `tipo`: `riparazione`
- `km`: `1234`
- autista: `SANDRO CALABRESE`

Mappatura certa:

- e' un intervento gomme straordinario;
- riguarda il `3 asse`;
- motivo: sostituzione valvola lato SX;
- autista/segnalato da: Sandro Calabrese;
- origine: evento gomme.

Mappatura non certa:

- quale pneumatico singolo;
- interna o esterna;
- lato DX;
- maschera DX corrispondente.

Verdetto: `DA NON ACCENDERE PER RISCHIO ERRORE`.

Motivo: il testo dice `LATO SX`, mentre le maschere disponibili nel Dettaglio sono `anterioreDx`, `posterioreDxEsterna`, `posterioreDxInterna`. Accendere una maschera DX per questo record sarebbe una rappresentazione falsa.

## 9. Proposta colori reale/debug

Modalita reale nel Dettaglio manutenzione:

- gomme non cambiate: neutre;
- gomme sostituite: rosse;
- nessun rosso se la posizione singola non e' certa;
- nessun blu/giallo in modalita reale.

Modalita debug/demo tecnica:

- colori separati ammessi solo per test maschere;
- rosso/blu/giallo possono restare in `/next/dev/gomme-demo` o sezione tecnica separata;
- non devono sembrare dato reale nel Dettaglio ufficiale.

Regola operativa:

```text
Se posizione singola strutturata assente:
  schema neutro
  testo: posizione singola non disponibile

Se posizione singola strutturata presente:
  gomma sostituita rossa
  altre gomme neutre
```

## 10. Struttura dati futura consigliata

Campo additivo opzionale consigliato:

```ts
gommePosizioni?: Array<
  | "anterioreDx"
  | "posterioreDxEsterna"
  | "posterioreDxInterna"
>;
```

Regole:

- campo opzionale;
- nessuna migrazione automatica da testo libero;
- nessuna deduzione interna/esterna da `asseId`;
- nessuna deduzione DX/SX da `gommeIds` senza campo lato strutturato;
- valorizzato solo da UI o writer che dispongono di posizione certa;
- se assente, il Dettaglio resta neutro.

## 11. Valori iniziali futuri

Valori iniziali per il set maschere gia disponibile:

- `anterioreDx`
- `posterioreDxEsterna`
- `posterioreDxInterna`

Questi valori coprono solo lo schema DX attuale. Non coprono lato SX e non coprono altri mezzi/categorie senza asset dedicati.

## 12. Rischio DX/SX e categorie mezzo

### Rischio DX/SX

Le maschere attuali sono DX. Un record con testo o dato SX non deve mai accendere una maschera DX.

Esempi:

- `LATO SX 3 ASSE`: non accendere.
- `1 ASSE INTERNO SX`: non accendere DX.
- `asse3` senza lato: non accendere.

### Rischio categorie mezzo

Gli asset disponibili in `docs/mockups` sono per lo schema validato DX corrente. In `public/gomme` esistono molte immagini per categorie diverse:

- trattore DX/SX;
- motrici;
- rimorchi;
- semirimorchi;
- biga;
- pianale;
- vasca;
- centina.

Ma le maschere battistrada validate sono solo:

- `schema_gomme_mask_anteriore_dx.png`
- `schema_gomme_mask_posteriore_dx_esterna.png`
- `schema_gomme_mask_posteriore_dx_interna.png`

Quindi non basta sapere la categoria mezzo. Serve anche una configurazione asset/maschere per categoria + lato + posizione.

## 13. Patch successiva consigliata

### Step 1 - UI conservativa

Obiettivo:

- mantenere lo schema gomme nel Dettaglio;
- non accendere maschere da dati attuali;
- mostrare avviso `posizione singola non disponibile`;
- mostrare bene assi, data, km, motivo, quantita, fornitore, segnalato da, origine.

Regola:

```text
maskStates = []
```

per tutti i record attuali, finche non esiste `gommePosizioni[]`.

### Step 2 - Campo additivo

Obiettivo:

- introdurre `gommePosizioni[]` solo dopo approvazione;
- aggiornare form e writer in modo esplicito;
- testare che i vecchi record restino neutri.

### Step 3 - Estensione SX / categorie

Obiettivo:

- creare maschere per SX;
- creare registri per categorie mezzo;
- mappare posizione solo se il dato e l'asset coincidono.

### Step 4 - Attivazione reale maschere

Obiettivo:

- accendere rosso solo da `gommePosizioni[]`;
- nessun parsing libero descrizione;
- nessuna accensione DX su SX.

## 14. Whitelist esatta per patch successiva

### Patch UI conservativa, senza nuovo schema

File candidati:

- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- eventuale componente presentazionale gia esistente o dedicato sotto `src/next/components/`

File da non toccare:

- writer;
- domain schema;
- Firestore/Storage;
- `cloneWriteBarrier`;
- madre legacy;
- app autisti;
- autisti inbox/admin;
- asset PNG.

### Patch schema additivo `gommePosizioni[]`

Da fare solo con nuova autorizzazione esplicita:

- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/NextManutenzioniPage.tsx`
- eventuale writer import gomme;
- test domain/writer;
- eventuale aggiornamento boundary/chat IA se il campo deve diventare leggibile da IA.

### Patch asset categorie/SX

Da fare solo con nuova autorizzazione esplicita:

- nuovi asset maschere;
- registro asset/posizioni;
- demo tecnica;
- nessun writer dati.

## 15. Verdetto finale

1. `@manutenzioni` contiene 16 record gomme strutturati.
2. Nessun record letto contiene posizione singola strutturata.
3. I campi `gommePosizioni`, `posizionePneumatico`, `pneumaticoId`, `lato`, `internoEsterno`, `latoGomma` sono assenti.
4. Gli eventi hanno `gommeIds`, ma non salvano lato DX/SX in modo utilizzabile nel Dettaglio ufficiale.
5. Oggi non si puo accendere con certezza nessuna maschera DX.
6. Oggi si puo mostrare solo schema neutro + dati asse/intervento.
7. Il caso `SOSTITUZIONE VALVOLA LATO SX 3 ASSE` va classificato `DA NON ACCENDERE PER RISCHIO ERRORE`.

## 16. Comandi/verifiche eseguite

Sola lettura:

- `rg` su campi gomme, maschere, eventi, autisti e writer.
- `Get-Content` mirato sui file elencati.
- Lettura Firestore readonly dei documenti `storage/@manutenzioni`, `storage/@cambi_gomme_autisti_tmp`, `storage/@gomme_eventi`, `storage/@segnalazioni_autisti_tmp`, `storage/@controlli_mezzo_autisti`.

Build non eseguita: audit documentale, nessuna modifica runtime.
