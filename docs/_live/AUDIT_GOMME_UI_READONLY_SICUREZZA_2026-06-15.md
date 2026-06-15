# AUDIT SICUREZZA UI GOMME READ-ONLY

Data audit: 2026-06-15
Ora lettura dati: 21:27 Europe/Rome
Agente: Codex
Rischio classificato: ELEVATO
Modalita: audit in sola lettura

## Verdetto

**SICURO DA IMPLEMENTARE**

Il verdetto vale esclusivamente per il piano definitivo descritto in questo documento:

- nuova vista in sola lettura;
- evidenziazione mostrata nello schema della manutenzione selezionata;
- evento `@gomme_eventi` usato solo tramite `chiusuraRefId` esplicito;
- associazione al mezzo tramite `targetTarga` esatta;
- nessuna associazione automatica evento-manutenzione;
- nessuna scrittura o correzione dei dati;
- nessuna modifica alla madre;
- nessuna modifica a importazione, chiusure, PDF o timestamp.

Non e sicuro implementare una variante che colleghi automaticamente eventi e manutenzioni
per data, descrizione o semplice somiglianza.

## Rettifica del punto di accesso UI

La prima implementazione con riga autonoma `Evento gomme autista` e stata scartata.
Il punto di accesso definitivo e lo `Schema mezzo` gia presente nel riquadro
`Dettagli intervento gomme` della manutenzione selezionata.

Regole definitive:

- la lista storico contiene soltanto manutenzioni;
- un evento ufficiale influenza lo schema soltanto quando il suo ID coincide con
  `chiusuraRefId` della manutenzione e la targa resta esatta;
- se il collegamento non esiste o non e utilizzabile, lo schema usa esclusivamente
  gli assi strutturati nella manutenzione;
- gli eventi della stessa targa ma non collegati sono ignorati;
- restano valide tutte le verifiche live di questo audit su targhe, geometrie,
  immagini, precisione storica e assenza di scritture.

## Risposta semplice

La targa non viene indovinata.

Negli 8 eventi gomme ufficiali presenti al momento dell'audit:

- tutti hanno una `targetTarga` esplicita;
- ogni targa corrisponde a un solo mezzo reale;
- non esistono targhe mancanti o duplicate nell'anagrafica per questi eventi;
- motrice e rimorchio non risultano confusi;
- la categoria del mezzo coincide con la geometria gomme in tutti i casi.

La nuova UI puo quindi mostrare gli eventi del mezzo selezionato filtrando esclusivamente
la `targetTarga` normalizzata.

## 1. Cosa ho controllato

Sono stati letti tramite Firebase Admin read-only e boundary autorizzato i documenti esatti:

| Documento | Record letti | Limite boundary |
|---|---:|---:|
| `storage/@manutenzioni` | 89 | 100 |
| `storage/@gomme_eventi` | 8 | 50 |
| `storage/@cambi_gomme_autisti_tmp` | 9 | 50 |

Per verificare i collegamenti delle manutenzioni, il boundary di `@manutenzioni` e stato
esteso temporaneamente con i soli campi:

- `chiusuraDi`
- `chiusuraRefId`
- `chiusuraData`
- `targaCamion`
- `targaMotrice`
- `targaRimorchio`

Non sono state eseguite scansioni libere e non sono stati letti campi testuali non autorizzati.

Per ogni targa evento e stata inoltre eseguita una verifica esatta su
`storage/@mezzi_aziendali`, restituendo al massimo un mezzo per controllo.

## 2. Cosa ho trovato

### Integrita degli identificativi

| Controllo | Risultato |
|---|---:|
| Manutenzioni senza ID | 0 |
| ID manutenzione duplicati | 0 |
| Eventi ufficiali senza ID | 0 |
| ID evento ufficiale duplicati | 0 |
| Eventi TMP senza ID | 0 |
| ID evento TMP duplicati | 0 |

### Collegamenti manutenzione-evento

Nei 89 record attuali di `@manutenzioni`:

- record con `chiusuraDi`: 0;
- record con `chiusuraRefId`: 0;
- record con `chiusuraData`: 0;
- record con stato `chiusa_da_evento`: 0.

Conclusione: oggi non esistono collegamenti da controllare, riferimenti orfani o mismatch
tra targa manutenzione e targa evento. Non esistono quindi eventi collegati utilizzabili
nei dati correnti: la UI applica il fallback sugli assi strutturati della manutenzione.

### Targa e mezzo

| Controllo sugli 8 eventi ufficiali | Risultato |
|---|---:|
| Eventi con `targetTarga` esplicita | 8 |
| Eventi senza targa | 0 |
| Conflitti tra targa diretta e contesto camion/rimorchio | 0 |
| Targhe evento distinte | 8 |
| Corrispondenze univoche con un mezzo reale | 8 |
| Mezzi non trovati | 0 |
| Targhe duplicate nell'anagrafica per questi eventi | 0 |
| Categorie mezzo coerenti con la geometria evento | 8 |
| Categorie mancanti o non riconosciute | 0 |

Ogni targa ha al momento un solo evento ufficiale. La UI deve comunque supportare piu
eventi sulla stessa targa, distinguendoli tramite l'ID evento.

### Continuita TMP verso evento ufficiale

Otto eventi ufficiali hanno lo stesso ID di un record TMP.

Per tutti gli 8:

- la targa e identica;
- la categoria e identica;
- `gommeIds` e identico.

Il flusso di importazione attuale conserva quindi i dati necessari alla visualizzazione.
Il codice di importazione elimina soltanto `letta` e `stato` prima di salvare l'evento
ufficiale (`src/autistiInbox/AutistiAdmin.tsx`).

## 3. Precisione visuale realmente disponibile

Gli eventi storici non devono essere presentati tutti come selezione di una singola ruota.

| Precisione certificabile | Eventi | Comportamento UI obbligatorio |
|---|---:|---|
| Intero asse, entrambi i lati | 7 | Evidenziare tutte le ruote dell'asse su DX e SX |
| Asse e lato certi | 1 | Evidenziare l'asse sul solo lato indicato |
| Singola ruota storica certa | 0 | Non inventare interno/esterno o posizione singola |
| Non rappresentabile | 0 | Nessun caso attuale |

Il record con asse e lato certi contiene un'indicazione strutturata sufficiente per mostrare
il lato e l'asse, ma non per scegliere una gomma interna o esterna.

La causa del limite storico e nel generatore legacy:
`src/pages/ModalGomme.tsx` costruisce lo stesso ID ruota per le viste destra e sinistra.
Il lato selezionato non viene persistito come campo separato.

Questo difetto storico non impedisce una visualizzazione corretta, a condizione che la UI
dichiari il livello di precisione e non colori una ruota piu specifica del dato disponibile.

## 4. Controllo geometrie e immagini

Sono state verificate automaticamente tutte le geometrie in `src/components/wheels.ts`.

| Controllo | Risultato |
|---|---:|
| Geometrie | 10 |
| Immagini DX/SX controllate | 20 |
| Immagini mancanti | 0 |
| Immagini illeggibili | 0 |
| Viste senza punti ruota | 0 |
| Numero punti incoerente con gli assi | 0 |
| Coordinate fuori dal viewBox `360x180` | 0 |

Le immagini tecniche presenti in `public/gomme/` sono quindi utilizzabili per l'overlay.

## 5. Verifica impatto sui flussi

### Flussi che non devono cambiare

L'implementazione approvata non deve toccare:

- importazione TMP verso `@gomme_eventi`;
- aggancio o sgancio degli eventi;
- stati delle manutenzioni;
- campi `chiusuraDi`, `chiusuraRefId` e `chiusuraData`;
- date e timestamp;
- Dossier;
- PDF;
- app autisti legacy;
- route `/next/autisti`;
- writer o `cloneWriteBarrier`.

La nuova vista deve usare soltanto reader e componenti sotto `src/next/*`.

### Duplicazioni

Il domain attuale assegna precedenza all'evento ufficiale rispetto al TMP e deduplica per
`sourceRecordId` in `src/next/domain/nextManutenzioniGommeDomain.ts`.

Regola definitiva:

- mantenere come lookup interno solo eventi `sourceOrigin === "evento_ufficiale"`;
- non esporre il TMP se esiste l'ufficiale con lo stesso ID;
- non trasformare un evento TMP non importato in storico ufficiale;
- non mostrare eventi come righe autonome nella UI.

### Manutenzioni satellite

Il runtime nasconde gia dalla lista normale le manutenzioni satellite
`chiusa_da_evento`, tramite `isSatelliteChiusoDaEvento`.

Il lookup interno dell'evento:

- non deve far riapparire il satellite;
- non deve creare una seconda manutenzione;
- deve usare come chiave l'ID dell'evento ufficiale;
- non deve produrre una voce UI autonoma.

## 6. Piano definitivo di implementazione

### A. Contratto read-only

Estendere in modo additivo `NextGommeReadOnlyItem` con campi opzionali:

- `categoria`
- `targetType`
- `asseId`
- `gommeIds`
- eventuale `selezioneGommeV2`

Non rimuovere o rinominare campi esistenti.

Esporre nello snapshot della Mappa Storico un lookup interno separato:

```ts
eventiGommeUfficiali: NextGommeReadOnlyItem[]
```

Il lookup deve contenere esclusivamente eventi ufficiali con match targa `forte`
e non deve essere renderizzato come lista.
Il domain legge gia `@gomme_eventi`: non serve un nuovo writer e non serve una nuova
collection.

### B. Resolver di precisione

Creare un resolver puro NEXT con questi esiti:

```ts
type PrecisioneSelezioneGomme =
  | "ruote_esatte_v2"
  | "asse_completo"
  | "asse_lato"
  | "non_rappresentabile";
```

Precedenza:

1. `selezioneGommeV2` valida: ruote e lati esatti.
2. ID legacy duplicati esattamente sui due lati e coerenti con `asseId`: asse completo.
3. Asse e lato presenti nel dato: asse sul lato indicato.
4. Qualunque altro caso: nessun overlay, messaggio prudente.

Il resolver non deve usare data, descrizione della manutenzione o prossimita temporale.

### C. Punto di accesso UI

Nel dettaglio `/next/manutenzioni` mantenere la lista sinistra composta esclusivamente
da manutenzioni.

L'evidenziazione deve essere integrata nello `Schema mezzo` gia presente nel riquadro
`Dettagli intervento gomme` della manutenzione selezionata.

Precedenza della fonte:

1. evento ufficiale indicato esattamente da `chiusuraRefId`, con stessa targa;
2. assi strutturati della manutenzione;
3. nessun overlay quando entrambe le fonti sono insufficienti.

Sono vietati abbinamenti automatici per data, descrizione, targa comune o prossimita
temporale.

### D. Pannello visuale

Mostrare entrambe le viste tecniche DX e SX.

Comportamento:

- `asse_completo`: evidenziare l'asse su entrambe le viste;
- `asse_lato`: evidenziare soltanto la vista indicata;
- `ruote_esatte_v2`: evidenziare solo le ruote dichiarate;
- `non_rappresentabile`: mostrare il mezzo senza overlay e spiegare il limite.

Testo obbligatorio per i record storici non puntuali:

```text
Posizione certificata a livello di asse.
La singola gomma interna o esterna non e disponibile nel record storico.
```

Non usare il fallback generico come se fosse la categoria reale.

### E. Compatibilita futura V2

Il viewer puo accettare il campo opzionale:

```ts
selezioneGommeV2: {
  versione: 2;
  asseId: string;
  ruote: Array<{
    id: string;
    lato: "destra" | "sinistra";
    posizione: number;
  }>;
}
```

La produzione di questo campo nell'app autisti resta un secondo task separato.
La route `/next/autisti` oggi rimanda ancora alla legacy: non deve essere modificata nella
prima fase read-only.

## 7. Test obbligatori

### Unit test

- targa evento uguale alla targa attiva: evento incluso;
- targa diversa: evento escluso;
- ufficiale e TMP con stesso ID: mostrare solo ufficiale;
- ID legacy bilaterali duplicati: `asse_completo`;
- asse e lato testuali: `asse_lato`;
- payload V2 valido: `ruote_esatte_v2`;
- payload incompleto o incoerente: `non_rappresentabile`;
- categoria sconosciuta: nessun overlay.

### Test UI

- lista composta soltanto da manutenzioni;
- selezione manutenzione gomme apre lo schema nello stesso dettaglio;
- evento non collegato della stessa targa ignorato;
- cambio targa elimina immediatamente il lookup del mezzo precedente;
- DX/SX corretti su tutte le categorie;
- manutenzione multi-asse evidenziata su entrambi i lati;
- messaggio prudente per record non puntuale;
- desktop e viewport mobile.

### Regressioni

- importazione gomme invariata;
- manutenzioni e satelliti invariati;
- Dossier invariato;
- PDF invariati;
- nessuna modifica a timestamp;
- `npm run build` completo.

## 8. Gate di accettazione

La patch potra essere accettata soltanto se:

1. modifica esclusivamente `src/next/*` e documentazione canonica pertinente;
2. non contiene `setItemSync`, writer o chiamate Firestore mutanti nel nuovo flusso;
3. non modifica il routing autisti;
4. non modifica la madre;
5. tutti i test del resolver passano;
6. la build completa passa;
7. un audit separato del diff conferma madre intoccata e assenza di scritture.

## 9. Ripristino e sicurezza dell'audit

Hash SHA-256 boundary prima dell'audit:

`11EFCF14F172F089861539C566A435ECBA86C8D57AE5CC8672921F5F1C4191DB`

Hash SHA-256 boundary dopo il ripristino:

`11EFCF14F172F089861539C566A435ECBA86C8D57AE5CC8672921F5F1C4191DB`

Esito:

- hash identici;
- `git diff` sul boundary vuoto;
- zero scritture Firestore;
- zero record modificati;
- build canonica `npm run build` superata.

## 10. Esplorazione Zero-Invenzioni

1. **Cosa cercavo**
   Collegamenti manutenzione-evento, riferimenti orfani, mismatch di targa, continuita
   TMP/ufficiale e possibilita di rappresentare assi/ruote.

2. **Cosa ho trovato**
   89 manutenzioni, 8 eventi ufficiali e 9 TMP. Nessun collegamento manutenzione-evento
   attualmente presente. Tutti gli eventi ufficiali hanno targa univoca e mezzo reale.

3. **Cosa non ho trovato**
   Nessun `chiusuraRefId`, collegamento orfano, mismatch di targa, ID duplicato, categoria
   mancante o geometria illeggibile nel perimetro controllato.

4. **Fonti adiacenti**
   `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` restano flussi adiacenti, ma
   il viewer approvato non li legge, non li modifica e non costruisce relazioni verso di
   essi. Non e stato necessario ampliare il boundary su tali dataset.

5. **Conclusione operativa**
   Asserzione confermata: la UI read-only puo essere implementata in sicurezza seguendo
   il piano definitivo sopra. L'associazione deve restare evento ufficiale -> targa esatta,
   mai evento -> manutenzione dedotta.

## Nota documentale

Al momento dell'audit non risultano presenti in `docs/_live/`:

- `STATO_ATTUALE_PROGETTO.md`
- `STATO_MIGRAZIONE_NEXT.md`
- `REGISTRO_MODIFICHE_CLONE.md`

Non sono state consultate copie deprecate e non sono stati creati sostituti, per rispettare
il perimetro autorizzato del solo report di audit.
