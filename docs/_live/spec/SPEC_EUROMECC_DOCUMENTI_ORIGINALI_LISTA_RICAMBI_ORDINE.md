# SPEC — Euromecc: Documenti originali + Lista ricambi → Ordine

**Versione:** 1.0  
**Data:** 2026-04-09  
**Stato:** PRONTO PER IMPLEMENTAZIONE  
**Route:** `/next/euromecc` — tab Relazioni (esistente)  
**Tipo modulo:** nativo NEXT — scrittura reale su collection e storage dedicati

---

## 1. OBIETTIVO

Due feature collegate:

**A. Documento originale sempre consultabile**
Dopo l'importazione di una relazione, il PDF/foto originale viene salvato su
Firebase Storage e il link di download viene salvato in `euromecc_relazioni`.
Lo storico mostra un tasto "Apri documento" per ogni relazione.

**B. Lista ricambi → Ordine**
Il tab Relazioni supporta un secondo tipo di documento: "Lista ricambi Euromecc".
L'AI estrae i materiali con quantità → crea un ordine reale su `@ordini` con
fornitore = Euromecc → il collegamento è visibile nello storico Euromecc.

---

## 2. FEATURE A — DOCUMENTO ORIGINALE

### 2.1 Storage path
```
euromecc/relazioni/{relazioneId}/{timestamp}_{fileName}
```
Esempio: `euromecc/relazioni/abc123/1717000000000_Relazione_Agosto_2025.pdf`

### 2.2 Estensione tipo `EuromeccRelazioneDoc`
Aggiungi questi campi opzionali al tipo esistente nel file:
```ts
type EuromeccRelazioneDoc = {
  // campi esistenti — non modificare
  id: string;
  fileName: string;
  fileType: "pdf" | "image";
  dataIntervento: string;
  tecnici: string[];
  note: string;
  statoImportazione: "bozza" | "confermata" | "parziale";
  doneCount: number;
  pendingCount: number;
  extraComponentsCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // NUOVI campi opzionali
  fileUrl?: string | null;          // URL download Firebase Storage
  fileStoragePath?: string | null;  // path Storage per eventuale delete
  fileSize?: number | null;         // bytes, per info display
}
```

### 2.3 Upload file al momento della conferma
In `handleConferma` (funzione che scrive su Firestore dopo "Conferma tutto"),
**prima** di `addDoc(collection(db, "euromecc_relazioni"), ...)` aggiungi:

```ts
// Upload documento originale su Storage
let fileUrl: string | null = null;
let fileStoragePath: string | null = null;
let fileSize: number | null = null;

if (state.file) {
  try {
    const storage = getStorage(app);
    const relazioneId = `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
    const ext = state.file.name.split(".").pop() ?? "pdf";
    const path = `euromecc/relazioni/${relazioneId}/${Date.now()}_${state.file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, state.file);
    fileUrl = await getDownloadURL(storageRef);
    fileStoragePath = path;
    fileSize = state.file.size;
  } catch {
    // upload fallisce silenziosamente — la relazione viene salvata comunque
    // senza il link al documento
  }
}
```

Poi includi `fileUrl`, `fileStoragePath`, `fileSize` nel documento salvato su
`euromecc_relazioni`.

### 2.4 Deroga cloneWriteBarrier per Storage Euromecc
In `src/utils/cloneWriteBarrier.ts`, nel blocco Euromecc già esistente
(`isAllowedEuromeccCloneWritePath`), aggiungi un secondo `if` per Storage:

```ts
if (isAllowedEuromeccCloneWritePath(pathname)) {
  // fetch API già esistente
  if (kind === "fetch.runtime") {
    try {
      const parsed = new URL(readMetaUrl(meta), window.location.origin);
      return EUROMECC_ALLOWED_FETCH_API_PATHS.has(parsed.pathname);
    } catch {
      return false;
    }
  }
  // NUOVO: Storage upload per documenti Euromecc
  if (kind === "storage.uploadBytes") {
    const storagePath = readMetaPath(meta);
    return storagePath.startsWith("euromecc/relazioni/");
  }
}
```

### 2.5 Import necessari in `NextEuromeccPage.tsx`
Aggiungi solo se non già presenti:
```ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase"; // verifica il path corretto nel file
```

### 2.6 Aggiornamento `RelazioneStoricoItem`
Aggiungi il tasto "Apri documento" se `fileUrl` è presente:

```tsx
function RelazioneStoricoItem(props: { relazione: EuromeccRelazioneDoc }) {
  const r = props.relazione;
  return (
    <article className="eur-relazioni-storico-item">
      <div className="eur-relazioni-storico-item-main">
        <span className="eur-relazioni-storico-date">{r.dataIntervento}</span>
        <span className="eur-relazioni-storico-tecnici">{r.tecnici.join(", ")}</span>
        <span className="eur-relazioni-storico-counts">
          {r.doneCount} lavori · {r.pendingCount} interventi futuri
        </span>
        {r.statoImportazione === "bozza" ? (
          <span className="eur-mini-badge eur-mini-badge--media">Bozza</span>
        ) : null}
      </div>
      <div className="eur-relazioni-storico-item-actions">
        {r.fileUrl ? (
          <a
            href={r.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eur-btn eur-btn--ghost eur-btn--sm"
          >
            Apri documento
          </a>
        ) : null}
      </div>
    </article>
  );
}
```

### 2.7 Firestore rules Storage
Aggiungi a `storage.rules`:
```
match /euromecc/relazioni/{relazioneId}/{fileName} {
  allow read, write: if request.auth != null;
}
```

---

## 3. FEATURE B — LISTA RICAMBI → ORDINE

### 3.1 Secondo tipo documento nel tab Relazioni
Aggiungi un selettore tipo documento nella fase upload (prima del bottone Analizza):

```
Tipo documento:
● Relazione di manutenzione    ○ Lista ricambi
```

Default: "Relazione di manutenzione" — comportamento attuale invariato.
Se selezionato "Lista ricambi" → flusso diverso (vedi 3.3).

### 3.2 Estensione `RelazioniTabState`
Aggiungi campo al tipo esistente:
```ts
type RelazioniTabState = {
  // campi esistenti invariati
  ...
  documentoTipo: "relazione" | "ricambi";  // default "relazione"
  ricambiPayload: RicambiAiPayload | null;
}
```

### 3.3 Tipo `RicambiAiPayload`
```ts
type RicambiAiItem = {
  descrizione: string;       // testo originale dalla lista
  quantita: number;
  unita: string;             // "pz", "m", "kg", "lt", ecc.
  codiceArticolo: string;    // codice Euromecc se presente, altrimenti ""
  note: string;              // note aggiuntive (es. "nuovo tipo", "vecchio modello")
  selected: boolean;         // default true
}

type RicambiAiPayload = {
  dataDocumento: string;     // ISO yyyy-MM-dd
  azienda: string;           // es. "GHIELMIMPORT - STABIO"
  items: RicambiAiItem[];
}
```

### 3.4 Prompt AI per lista ricambi
Quando `documentoTipo === "ricambi"`, usa questo prompt in `handleAnalyze`:

```
Sei un assistente tecnico specializzato in impianti industriali.
Analizza il seguente elenco materiali/ricambi e restituisci SOLO un oggetto JSON,
senza testo aggiuntivo, senza markdown, senza backtick.

STRUTTURA JSON RICHIESTA:
{
  "dataDocumento": "yyyy-MM-dd",
  "azienda": "nome azienda destinataria",
  "items": [
    {
      "descrizione": "descrizione materiale",
      "quantita": numero,
      "unita": "pz|m|kg|lt|altro",
      "codiceArticolo": "codice se presente altrimenti stringa vuota",
      "note": "note aggiuntive se presenti altrimenti stringa vuota"
    }
  ]
}

REGOLE:
- Estrai TUTTI i materiali elencati, uno per uno
- Se la quantità non è specificata usa 1
- Se l'unità non è specificata usa "pz"
- dataDocumento deve essere la data del documento
- azienda deve essere il nome dell'azienda destinataria (non Euromecc)
- Non inventare materiali non presenti nel documento

DOCUMENTO:
[testo o immagine del documento]
```

### 3.5 Fase review per lista ricambi
Quando `documentoTipo === "ricambi"` e `phase === "review"`,
mostra una UI diversa da quella delle relazioni:

```
LISTA RICAMBI — 29/08/2025
Azienda: GHIELMIMPORT - STABIO
Fornitore ordine: Euromecc

┌─────────────────────────────────────────────────────────┐
│  ☑  N.2  Kit cartucce filtro scaricatore (nuovo)  pz   │
│  ☑  N.2  Kit cartucce filtro scaricatore (vecchio) pz  │
│  ☑  N.8  Calza bicolore 323mm 400mm              pz    │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
[Deseleziona tutto]  [Seleziona tutto]

Fornitore: [Euromecc                    ]  (editabile)
Data ordine: [29/08/2025               ]  (editabile)

[Crea ordine in Materiali da ordinare]
```

Ogni item ha spunta individuale e campi descrizione/quantità editabili inline.

### 3.6 Writer ordine su `@ordini`
Funzione `handleCreaOrdineRicambi()` — scrive direttamente su `storage/@ordini`
seguendo esattamente il pattern della madre (`Acquisti.tsx`):

```ts
async function handleCreaOrdineRicambi(
  payload: RicambiAiPayload,
  nomeFornitore: string,
  dataOrdine: string,
  relazioneId: string
): Promise<void> {
  const db = getFirestore();
  const ordiniRef = doc(collection(db, "storage"), "@ordini");
  const snap = await getDoc(ordiniRef);
  const existing: Ordine[] = snap.exists()
    ? ((snap.data()?.value as Ordine[]) ?? [])
    : [];

  const selectedItems = payload.items.filter(i => i.selected);

  const nuovoOrdine: Ordine & { euromeccRelazioneId?: string } = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    idFornitore: "euromecc",
    nomeFornitore,
    dataOrdine,
    materiali: selectedItems.map(item => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      descrizione: item.codiceArticolo
        ? `${item.descrizione} [${item.codiceArticolo}]`
        : item.descrizione,
      quantita: item.quantita,
      unita: item.unita,
      arrivato: false,
    })),
    arrivato: false,
    euromeccRelazioneId: relazioneId,
  };

  await setDoc(ordiniRef, { value: [...existing, nuovoOrdine] }, { merge: true });
}
```

### 3.7 Deroga cloneWriteBarrier per @ordini da Euromecc
In `src/utils/cloneWriteBarrier.ts`, nel blocco Euromecc esistente,
aggiungi un terzo `if` per la scrittura su `@ordini`:

```ts
if (isAllowedEuromeccCloneWritePath(pathname)) {
  // fetch API — già esistente
  if (kind === "fetch.runtime") { ... }
  // Storage upload — aggiunto in Feature A
  if (kind === "storage.uploadBytes") { ... }
  // NUOVO: storageSync write per @ordini da lista ricambi
  if (kind === "storageSync.setItemSync") {
    const key = readMetaKey(meta);
    return key === "@ordini";
  }
}
```

### 3.8 Collegamento visibile nello storico Euromecc
Estendi `EuromeccRelazioneDoc` con:
```ts
ordineId?: string | null;       // id ordine creato su @ordini
ordineMateriali?: number | null; // numero materiali nell'ordine
```

In `RelazioneStoricoItem` mostra badge se `ordineId` è presente:
```tsx
{r.ordineId ? (
  <span className="eur-mini-badge eur-mini-badge--ok">
    Ordine creato · {r.ordineMateriali} materiali
  </span>
) : null}
```

---

## 4. FIRESTORE RULES

### 4.1 `firestore.rules` — nessuna modifica necessaria
`euromecc_relazioni` ha già `allow read, write: if isSignedIn()`.
`storage/@ordini` è gestito dalla madre — regole già esistenti.

### 4.2 `storage.rules` — aggiungere
```
match /euromecc/relazioni/{relazioneId}/{fileName} {
  allow read, write: if request.auth != null;
}
```

---

## 5. PERIMETRO FILE

### MODIFICA
- `src/next/NextEuromeccPage.tsx` — Feature A e B
- `src/utils/cloneWriteBarrier.ts` — due nuove deroghe chirurgiche
- `storage.rules` — nuova regola Storage Euromecc

### NON TOCCARE
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/euromeccAreas.ts`
- `src/pages/Acquisti.tsx` o qualsiasi pagina madre
- `src/utils/materialImages.ts`
- Tab Home, Manutenzione, Problemi, Riepilogo — non toccare
- Qualsiasi altro file

### SE SERVE TOCCARE FILE EXTRA
- Fermati e scrivi: `SERVE FILE EXTRA: <path>`

---

## 6. DIVIETI ASSOLUTI

- Non modificare writer esistenti in `nextEuromeccDomain.ts`
- Non modificare la madre (`src/pages/`)
- Non aprire nuove deroghe nel barrier oltre quelle descritte
- Non modificare `SiloDiagram`, `CaricoDiagram`, `MapSvg`
- Non introdurre nuove dipendenze npm

---

## 7. BUILD / TEST OBBLIGATORI

- `npm run build` — zero errori TypeScript
- Verifica runtime:
  1. Tab Relazioni — selettore tipo documento visibile
  2. Carico relazione PDF → Analizza → conferma → "Apri documento" appare nello storico
  3. Carico lista ricambi PDF → Analizza → review items → "Crea ordine" → ordine visibile in Materiali da ordinare NEXT
  4. Nessun errore `[CLONE_NO_WRITE]` in console

---

## 8. OUTPUT RICHIESTO DA CODEX

1. `PATCH COMPLETATA` oppure `PATCH PARZIALE`
2. `FILE TOCCATI:`
3. `FEATURE A:` upload Storage funzionante + "Apri documento" nello storico
4. `FEATURE B:` selettore tipo + AI ricambi + writer @ordini
5. `DEROGHE BARRIER:` conferma delle due nuove deroghe aggiunte
6. `BUILD:` esito
7. `RUNTIME:` conferma visiva se disponibile
8. `NOTE:` anomalie o SERVE FILE EXTRA
