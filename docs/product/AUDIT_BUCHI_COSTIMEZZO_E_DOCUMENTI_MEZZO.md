# AUDIT BUCHI COSTIMEZZO E DOCUMENTI MEZZO

## Parte A — Writer di `@costiMezzo`

### Esito netto
- Nel runtime attivo letto in `src/pages/`, `src/next/`, `src/utils/`, non emerge nessun writer additivo che aggiunga nuovi record a `storage/@costiMezzo`.
- L'unico writer reale trovato che tocca la collection e una cancellazione con riscrittura filtrata.
- Tutti gli altri punti trovati (`DossierMezzo`, `CapoMezzi`, `CapoCostiMezzo`, `AnalisiEconomica`, `nextDocumentiCostiDomain`) leggono `items` in sola lettura. Evidenze: `src/pages/DossierMezzo.tsx:550-565`, `src/pages/CapoMezzi.tsx:273-287`, `src/pages/CapoCostiMezzo.tsx:307-323`, `src/pages/AnalisiEconomica.tsx:377-391`, `src/next/domain/nextDocumentiCostiDomain.ts:1654-1678`.
- Il contratto NEXT del modulo dossier conferma `writers: ["nessuno business"]` in `src/next/internal-ai/internalAiUniversalContracts.ts:130-131`.

### Writer trovato
**1. Cancellazione da dossier mezzo** — `src/pages/DossierMezzo.tsx:741-748`  
Snippet letterale:
```ts
const costiDocRef = doc(db, "storage", "@costiMezzo");
const costiSnap = await getDoc(costiDocRef);
const costiData = costiSnap.data() || {};
const items = Array.isArray(costiData.items) ? costiData.items : [];
const updated = items.filter(
  (x: any) => String(x?.id ?? "") !== String(p.id)
);
await setDoc(costiDocRef, { items: updated }, { merge: true });
```
Contesto: quando l'utente elimina un preventivo/fattura dal dossier mezzo e l'elemento non arriva da `@documenti_*`.

| Campo scritto | Tipo | Obbligatorio | File:riga | Nota |
|---|---|---|---|---|
| `items` | array | si | `src/pages/DossierMezzo.tsx:745-748` | riscrittura integrale dell'array filtrato |

### Shape osservabile del record `@costiMezzo` nei reader attivi
Questa non e una shape da writer trovato. E la shape minima effettivamente letta dal runtime attivo.

| Campo letto | Tipo | Obbligatorio | File:riga evidenza | Nota |
|---|---|---|---|---|
| `id` | string | no | `src/pages/DossierMezzo.tsx:157`, `src/next/domain/nextDocumentiCostiDomain.ts:1204` | chiave record |
| `mezzoTarga` | string | no | `src/pages/DossierMezzo.tsx:158`, `src/next/domain/nextDocumentiCostiDomain.ts:1188` | campo primario piu usato |
| `targa` | string | no | `src/next/domain/nextDocumentiCostiDomain.ts:1188` | alias accettato dal layer NEXT |
| `tipo` | string | si | `src/pages/DossierMezzo.tsx:159`, `src/next/domain/nextDocumentiCostiDomain.ts:1191` | `PREVENTIVO/FATTURA` o altro |
| `data` | string | no | `src/pages/DossierMezzo.tsx:160`, `src/next/domain/nextDocumentiCostiDomain.ts:1193` | |
| `descrizione` | string | no | `src/pages/DossierMezzo.tsx:161`, `src/next/domain/nextDocumentiCostiDomain.ts:1200` | fallback titolo |
| `importo` | number | no | `src/pages/DossierMezzo.tsx:162`, `src/next/domain/nextDocumentiCostiDomain.ts:1194` | |
| `valuta` | string | no | `src/pages/DossierMezzo.tsx:163`, `src/next/domain/nextDocumentiCostiDomain.ts:1217` | |
| `currency` | string | no | `src/pages/DossierMezzo.tsx:164`, `src/next/domain/nextDocumentiCostiDomain.ts:1218` | alias accettato |
| `fornitoreLabel` | string | no | `src/pages/DossierMezzo.tsx:165`, `src/next/domain/nextDocumentiCostiDomain.ts:1195` | campo piu usato lato legacy |
| `fornitore` | string | no | `src/next/domain/nextDocumentiCostiDomain.ts:1195` | alias accettato dal layer NEXT |
| `fileUrl` | string/null | no | `src/pages/DossierMezzo.tsx:166`, `src/next/domain/nextDocumentiCostiDomain.ts:1196` | PDF o file originale |

### Ipotesi esplicita, non evidenza
- Il dataset `@costiMezzo` oggi puo contenere dati storici o scritture arrivate da codice non presente nel perimetro runtime attivo letto qui.
- Dentro il perimetro letto non ho trovato il punto che crea nuovi record.

## Parte B — Writer documentali di `@mezzi_aziendali`

### 1. Salvataggio anagrafica mezzo con campi documentali — `src/pages/Mezzi.tsx:676-787`
Snippet letterale:
```ts
const fileName = `mezzi/${targa.replace(/\s+/g, "_")}_${Date.now()}.jpg`;
const storageRef = ref(storage, fileName);
await uploadString(storageRef, base64Data, "base64", { contentType: "image/jpeg" });
const downloadUrl = await getDownloadURL(storageRef);
finalFotoUrl = downloadUrl;
finalFotoPath = fileName;
...
await setItemSync(MEZZI_KEY, currentMezzi);
```
Contesto: quando l'utente crea o modifica un mezzo dalla pagina Mezzi.

| Campo scritto | Tipo | Obbligatorio | File:riga | Nota |
|---|---|---|---|---|
| `assicurazione` | string | si | `src/pages/Mezzi.tsx:721`, `src/pages/Mezzi.tsx:761` | |
| `dataImmatricolazione` | string | si | `src/pages/Mezzi.tsx:722`, `src/pages/Mezzi.tsx:762` | |
| `dataScadenzaRevisione` | string | si | `src/pages/Mezzi.tsx:723`, `src/pages/Mezzi.tsx:763` | |
| `dataUltimoCollaudo` | string | si | `src/pages/Mezzi.tsx:724`, `src/pages/Mezzi.tsx:764` | |
| `fotoUrl` | string/null | si | `src/pages/Mezzi.tsx:740-743`, `src/pages/Mezzi.tsx:780` | URL foto mezzo |
| `fotoPath` | string/null | si | `src/pages/Mezzi.tsx:742-743`, `src/pages/Mezzi.tsx:781` | path Storage `mezzi/<targa>_<ts>.jpg` |

### 2. Scadenze e collaudi da Home — `src/pages/Home.tsx:1177-1317`
Snippet letterale:
```ts
updated[idx] = { ...updated[idx], prenotazioneCollaudo: prenotazione };
void setItemSync(MEZZI_KEY, updated);
...
updated[idx] = { ...updated[idx], preCollaudo: { data, officina } };
void setItemSync(MEZZI_KEY, updated);
...
updated[idx] = { ...current, dataUltimoCollaudo: revisioneDateValue,
  dataScadenzaRevisione: scadenzaValue, prenotazioneCollaudo: nextPrenotazione };
void setItemSync(MEZZI_KEY, updated);
```
Contesto: quando l'utente salva prenotazione collaudo, pre-collaudo o revisione dalla Home.

| Campo scritto | Tipo | Obbligatorio | File:riga | Nota |
|---|---|---|---|---|
| `prenotazioneCollaudo` | object/null | si | `src/pages/Home.tsx:1177-1179` | anche `null` in cancellazione prenotazione |
| `prenotazioneCollaudo.data` | string | si | `src/pages/Home.tsx:1194` | |
| `prenotazioneCollaudo.ora` | string | si | `src/pages/Home.tsx:1195` | puo restare vuota |
| `prenotazioneCollaudo.luogo` | string | no | `src/pages/Home.tsx:1196` | |
| `prenotazioneCollaudo.note` | string | no | `src/pages/Home.tsx:1197` | |
| `preCollaudo` | object | si | `src/pages/Home.tsx:1245-1252` | |
| `preCollaudo.data` | string | si | `src/pages/Home.tsx:1248` | |
| `preCollaudo.officina` | string | si | `src/pages/Home.tsx:1248` | |
| `dataUltimoCollaudo` | string | si | `src/pages/Home.tsx:1310` | revisione fatta |
| `dataScadenzaRevisione` | string | si | `src/pages/Home.tsx:1311` | +1 anno dalla revisione |
| `prenotazioneCollaudo.completata` | boolean | si | `src/pages/Home.tsx:1294` | nel ramo revisione |
| `prenotazioneCollaudo.completataIl` | string | si | `src/pages/Home.tsx:1295` | |
| `prenotazioneCollaudo.esito` | string | si | `src/pages/Home.tsx:1296` | |
| `prenotazioneCollaudo.noteEsito` | string | no | `src/pages/Home.tsx:1297` | |

### 3. Salvataggio IA libretto — `src/pages/IA/IALibretto.tsx:398-473`
Snippet letterale:
```ts
const path = `mezzi_aziendali/${mezzoId}/libretto.jpg`;
const storageRef = ref(storage, path);
await uploadString(storageRef, preview, "data_url");
const url = await getDownloadURL(storageRef);
mezzo.librettoUrl = url;
mezzo.librettoStoragePath = path;
...
await setItemSync("@mezzi_aziendali", mezzi);
```
Contesto: quando l'utente analizza un libretto con IA e poi salva sul mezzo associato.

| Campo scritto | Tipo | Obbligatorio | File:riga | Nota |
|---|---|---|---|---|
| `assicurazione` | string | no | `src/pages/IA/IALibretto.tsx:398-404` | scritto solo se IA restituisce valore |
| `dataImmatricolazione` | string | no | `src/pages/IA/IALibretto.tsx:400` | |
| `dataUltimoCollaudo` | string | no | `src/pages/IA/IALibretto.tsx:402` | mappato da campo IA `revisione` |
| `dataScadenzaRevisione` | string | no | `src/pages/IA/IALibretto.tsx:404` | |
| `librettoUrl` | string | no | `src/pages/IA/IALibretto.tsx:439` | |
| `librettoStoragePath` | string | no | `src/pages/IA/IALibretto.tsx:440` | path Storage `mezzi_aziendali/<mezzoId>/libretto.jpg` |

### 4. Riparazione e upload libretti — `src/pages/IA/IACoperturaLibretti.tsx:425-450`, `src/pages/IA/IACoperturaLibretti.tsx:510-526`
Snippet letterale:
```ts
const path = `mezzi_aziendali/${folderId}/libretto.jpg`;
mezzo.librettoStoragePath = path;
const url = await getDownloadURL(ref(storage, path));
mezzo.librettoUrl = url;
...
await setItemSync("@mezzi_aziendali", mezziList);
```
Contesto: pagina di copertura libretti, sia in modalita riparazione da folder esistente sia in upload manuale del file.

| Campo scritto | Tipo | Obbligatorio | File:riga | Nota |
|---|---|---|---|---|
| `librettoStoragePath` | string | si | `src/pages/IA/IACoperturaLibretti.tsx:425-426`, `src/pages/IA/IACoperturaLibretti.tsx:510-522` | |
| `librettoUrl` | string | no | `src/pages/IA/IACoperturaLibretti.tsx:431-432`, `src/pages/IA/IACoperturaLibretti.tsx:520-521` | in riparazione puo fallire il `getDownloadURL` |

### Nota NEXT
- Non ho trovato writer business NEXT su `@mezzi_aziendali` per questi campi.
- `src/next/components/NextScadenzeModal.tsx:311`, `:331`, `:351` dichiara esplicitamente che prenotazione, pre-collaudo e revisione non vengono salvati su `@mezzi_aziendali`.

## Parte C — Shape completa consolidata

### Shape costo mezzo consolidata
Questa tabella unifica tutti i campi realmente osservati nei reader attivi di `@costiMezzo`. Non esiste, nel perimetro letto, un writer additivo verificato che li scriva.

| Campo | Tipo | Evidenza |
|---|---|---|
| `id` | string | `src/pages/DossierMezzo.tsx:157`, `src/next/domain/nextDocumentiCostiDomain.ts:1204` |
| `mezzoTarga` | string | `src/pages/DossierMezzo.tsx:158`, `src/next/domain/nextDocumentiCostiDomain.ts:1188` |
| `targa` | string | `src/next/domain/nextDocumentiCostiDomain.ts:1188` |
| `tipo` | string | `src/pages/DossierMezzo.tsx:159`, `src/next/domain/nextDocumentiCostiDomain.ts:1191` |
| `data` | string | `src/pages/DossierMezzo.tsx:160`, `src/next/domain/nextDocumentiCostiDomain.ts:1193` |
| `descrizione` | string | `src/pages/DossierMezzo.tsx:161`, `src/next/domain/nextDocumentiCostiDomain.ts:1200` |
| `importo` | number | `src/pages/DossierMezzo.tsx:162`, `src/next/domain/nextDocumentiCostiDomain.ts:1194` |
| `valuta` | string | `src/pages/DossierMezzo.tsx:163`, `src/next/domain/nextDocumentiCostiDomain.ts:1217` |
| `currency` | string | `src/pages/DossierMezzo.tsx:164`, `src/next/domain/nextDocumentiCostiDomain.ts:1218` |
| `fornitoreLabel` | string | `src/pages/DossierMezzo.tsx:165`, `src/next/domain/nextDocumentiCostiDomain.ts:1195` |
| `fornitore` | string | `src/next/domain/nextDocumentiCostiDomain.ts:1195` |
| `fileUrl` | string/null | `src/pages/DossierMezzo.tsx:166`, `src/next/domain/nextDocumentiCostiDomain.ts:1196` |

### Shape documento mezzo consolidata
| Campo | Tipo | Writer |
|---|---|---|
| `assicurazione` | string | `Mezzi.tsx`, `IALibretto.tsx` |
| `dataImmatricolazione` | string | `Mezzi.tsx`, `IALibretto.tsx` |
| `dataScadenzaRevisione` | string | `Mezzi.tsx`, `Home.tsx`, `IALibretto.tsx` |
| `dataUltimoCollaudo` | string | `Mezzi.tsx`, `Home.tsx`, `IALibretto.tsx` |
| `fotoUrl` | string/null | `Mezzi.tsx` |
| `fotoPath` | string/null | `Mezzi.tsx` |
| `librettoUrl` | string | `IALibretto.tsx`, `IACoperturaLibretti.tsx` |
| `librettoStoragePath` | string | `IALibretto.tsx`, `IACoperturaLibretti.tsx` |
| `prenotazioneCollaudo` | object/null | `Home.tsx` |
| `prenotazioneCollaudo.data` | string | `Home.tsx` |
| `prenotazioneCollaudo.ora` | string | `Home.tsx` |
| `prenotazioneCollaudo.luogo` | string | `Home.tsx` |
| `prenotazioneCollaudo.note` | string | `Home.tsx` |
| `prenotazioneCollaudo.completata` | boolean | `Home.tsx` |
| `prenotazioneCollaudo.completataIl` | string | `Home.tsx` |
| `prenotazioneCollaudo.esito` | string | `Home.tsx` |
| `prenotazioneCollaudo.noteEsito` | string | `Home.tsx` |
| `preCollaudo` | object | `Home.tsx` |
| `preCollaudo.data` | string | `Home.tsx` |
| `preCollaudo.officina` | string | `Home.tsx` |
