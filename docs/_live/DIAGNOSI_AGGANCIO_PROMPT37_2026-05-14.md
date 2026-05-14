# DIAGNOSI AGGANCIO PROMPT 37 - 2026-05-14

> Diagnosi read-only del mismatch filtro Aggancia evento sul caso TI298409 8/12 maggio.
> Script: `scripts/oneoff/diagnosi-aggancio-tridente-2026-05-14.cjs`.
> Firestore: sola lettura via boundary/admin readonly. Zero scritture.

## 1. Identita' record

- Credential mode: `google_application_credentials`
- @manutenzioni letti: 74
- @gomme_eventi letti: 11
- daFare target: id=`from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2`, stato=`daFare`, targa=`TI298409`, descrizione=`Segnalazione: gomme - 4 gomme di trazione usurate, quasi finite. Da sostituire`
- evento target: id=`554348b3-f6ec-40e8-a861-6873af7cce56`, targa=`TI298409`, tipo=`sostituzione`, km=`383482`

## 2. Campi raw

### 2.1 daFare target

| campo | typeof | raw | Timestamp.toDate ISO |
|-------|--------|-----|----------------------|
| data | string | `"2026-05-08"` | - |
| dataProgrammata | object | `null` | - |

### 2.2 evento target 12 maggio

| campo | typeof | raw | Timestamp.toDate ISO |
|-------|--------|-----|----------------------|
| data | number | `1778580122145` | - |

### 2.3 tutti gli eventi gomme TI298409

#### Evento 554348b3-f6ec-40e8-a861-6873af7cce56

- targa normalizzata: `TI298409`
- identita: tipo=`sostituzione`, km=`383482`, marca=`Kumho`

| campo | typeof | raw | Timestamp.toDate ISO |
|-------|--------|-----|----------------------|
| data | number | `1778580122145` | - |

## 3. Filtro applicato

- data riferimento UI da `getManutenzioneAggancioTimestamp`: source=`Date.now()`, raw=`1778757133865`, ISO=`2026-05-14T11:12:13.865Z`, fallback Date.now=SI
- logica helper evento: `data -> dataCambio -> timestamp -> ts -> dataOra -> createdAt`.
- filtro helper: scarta evento se `eventTs < dataRiferimento`.

| id evento | fonte data evento | data evento raw | data evento ISO | data riferimento raw | data riferimento ISO | confronto >= | passa filtro | distanza gg |
|-----------|-------------------|-----------------|-----------------|----------------------|----------------------|--------------|---------------|-------------|
| `554348b3-f6ec-40e8-a861-6873af7cce56` | data | `1778580122145` | 2026-05-12T10:02:02.145Z | `1778757133865` | 2026-05-14T11:12:13.865Z | false | NO | -3 |

## 4. Verdetto

- Ipotesi: **A**
- Motivazione: La data riferimento passata dalla UI e' successiva alla data dell'evento; il confronto eventTs >= dataRiferimento esclude il cambio del 12 maggio.

## 5. Fix proposto

Nel caso daFare gomme, la UI deve passare all'helper la data di nascita/origine del record (`dataInserimento`, `createdAt`, `timestamp`, oppure origine segnalazione/controllo) prima di usare `Date.now()`.
Il fix piu' conservativo e' aggiornare il chiamante in `NextManutenzioniPage.tsx` per calcolare `dataRiferimento` con una fallback chain compatibile con i timestamp reali, oppure estendere `NextAggancioEventoModal`/helper a ricevere anche il record raw e risolvere internamente la data origine.

## 6. Stato Firestore

- Sola lettura: `storage/@manutenzioni` e `storage/@gomme_eventi`.
- Zero scritture eseguite.
