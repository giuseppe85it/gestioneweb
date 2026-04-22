# SPEC — Modulo Relazioni Euromecc (Tab Relazioni)

**Versione:** 1.0  
**Data:** 2026-04-08  
**Stato:** PRONTO PER IMPLEMENTAZIONE  
**Route:** `/next/euromecc` — tab `Relazioni` (quinto tab, dopo `Riepilogo`)  
**Tipo modulo:** nativo NEXT — scrittura reale su collection Firestore dedicate

---

## 1. OBIETTIVO

Permettere l'importazione di relazioni di manutenzione Euromecc (PDF o foto) tramite
estrazione AI, revisione umana e registrazione su Firestore. Il flusso produce:
- record `euromecc_done` per ogni lavoro eseguito confermato
- record `euromecc_pending` per ogni intervento consigliato confermato
- record `euromecc_extra_components` per ogni nuovo componente approvato dall'utente

---

## 2. COLLEZIONI FIRESTORE

### 2.1 Collezioni esistenti — usate in scrittura
- `euromecc_done` — writer: `addEuromeccDoneTask` (già in `nextEuromeccDomain.ts`)
- `euromecc_pending` — writer: `addEuromeccPendingTask` (già in `nextEuromeccDomain.ts`)

### 2.2 Nuova collezione — `euromecc_extra_components`
Componenti dinamici aggiunti dall'utente durante la revisione di una relazione.
Non sostituisce `euromeccAreas.ts` — la integra a runtime.

```ts
type EuromeccExtraComponent = {
  areaKey: string;           // riferimento a area esistente in euromeccAreas.ts
  subKey: string;            // chiave univoca generata: areaKey + "-" + slug(name)
  name: string;              // nome leggibile italiano
  code: string;              // codice tecnico, es. "CMP-02-CNGV"
  addedFrom: string;         // id relazione di origine
  addedAt: string;           // ISO yyyy-MM-dd
  addedBy: string;           // nome operatore
  createdAt: Timestamp;
}
```

### 2.3 Nuova collezione — `euromecc_relazioni`
Storico delle relazioni importate.

```ts
type EuromeccRelazioneDoc = {
  fileName: string;
  fileType: "pdf" | "image";
  dataIntervento: string;       // ISO yyyy-MM-dd estratta dall'AI
  tecnici: string[];            // nomi tecnici estratti
  note: string;                 // note libere inserite dall'utente
  statoImportazione: "bozza" | "confermata" | "parziale";
  doneCount: number;            // lavori registrati su euromecc_done
  pendingCount: number;         // lavori registrati su euromecc_pending
  extraComponentsCount: number; // nuovi componenti aggiunti
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. TIPI TYPESCRIPT INTERNI AL MODULO

```ts
// Risultato parsing AI per un singolo lavoro eseguito
type RelazioneItemMatched = {
  kind: "matched";
  areaKey: string;
  subKey: string;
  areaLabel: string;
  subLabel: string;
  title: string;              // descrizione lavoro estratta
  tipoIntervento: string;     // es. "Sostituzione", "Verifica", "Installazione"
  doneDate: string;           // ISO yyyy-MM-dd
  by: string;                 // tecnico
  note: string;
  nextDate: string | null;
  selected: boolean;          // default true — l'utente può deselezionare
}

// Lavoro estratto ma area o componente non certi — richiede revisione utente
type RelazioneItemPartial = {
  kind: "partial";
  rawText: string;            // testo originale dalla relazione
  suggestedAreaKey: string | null;
  suggestedSubKey: string | null;
  // campi editabili dall'utente:
  editAreaKey: string;
  editSubKey: string;         // può essere "NEW" se l'utente sceglie di aggiungere
  editName: string;           // nome del nuovo componente se editSubKey === "NEW"
  editCode: string;           // codice tecnico se editSubKey === "NEW"
  editTitle: string;
  editTipoIntervento: string;
  editDoneDate: string;
  editBy: string;
  editNote: string;
  ignored: boolean;           // true se l'utente sceglie Ignora
}

// Intervento consigliato per il futuro (sezione "prossimi interventi")
type RelazioneItemPending = {
  kind: "pending";
  rawText: string;
  suggestedAreaKey: string | null;
  suggestedSubKey: string | null;
  editAreaKey: string;
  editSubKey: string;
  editTitle: string;
  editPriority: "alta" | "media" | "bassa";
  editDueDate: string | null;
  editNote: string;
  selected: boolean;
  ignored: boolean;
}

// Payload completo prodotto dall'AI
type RelazioneAiPayload = {
  dataIntervento: string;
  tecnici: string[];
  matched: RelazioneItemMatched[];
  partial: RelazioneItemPartial[];
  pending: RelazioneItemPending[];
}

// Stato locale del tab Relazioni
type RelazioniTabState = {
  phase: "idle" | "uploading" | "analyzing" | "review" | "saving" | "done";
  file: File | null;
  filePreviewUrl: string | null;
  fileType: "pdf" | "image" | null;
  payload: RelazioneAiPayload | null;
  noteGenerali: string;
  bozzaId: string | null;
  error: string | null;
}
```

---

## 4. STRUTTURA COMPONENTI

```
NextEuromeccPage.tsx
└── tab "Relazioni"
    ├── RelazioniTab              — orchestratore stato fase
    │   ├── RelazioniUpload       — fase idle: drop zone + bottone analizza
    │   ├── RelazioniAnalyzing    — fase analyzing: loading animato
    │   ├── RelazioniReview       — fase review: layout due colonne
    │   │   ├── RelazioniDocPreview     — colonna sinistra: PDF/immagine
    │   │   ├── RelazioniExtracted      — colonna destra: risultati AI
    │   │   │   ├── RelazioniSectionMatched   — bucket ✅
    │   │   │   ├── RelazioniSectionPartial   — bucket ⚠️
    │   │   │   └── RelazioniSectionPending   — bucket 📋
    │   │   └── RelazioniActionBar      — note + salva bozza + conferma tutto
    │   └── RelazioniStorico      — lista relazioni già importate (in fondo)
    │       └── RelazioneStoricoItem
```

Tutti i componenti vivono dentro `NextEuromeccPage.tsx` come funzioni locali,
seguendo esattamente il pattern di `SiloDiagram` e `CaricoDiagram`.
Non creare file separati.

---

## 5. FLUSSO OPERATIVO DETTAGLIATO

### Fase 1 — IDLE
- Area upload centrata nella pagina
- Accetta: `application/pdf`, `image/jpeg`, `image/png`
- Drag & drop + click per selezionare
- Dopo selezione: mostra nome file + anteprima thumbnail se immagine
- Bottone "Analizza" attivo solo dopo selezione file
- In fondo alla pagina: `RelazioniStorico` (lista relazioni precedenti)

### Fase 2 — ANALYZING
- Sostituisce la UI con loading centrato
- Sequenza messaggi animati:
  1. "Lettura documento..."
  2. "Estrazione lavori eseguiti..."
  3. "Classificazione per componente..."
  4. "Identificazione interventi futuri..."
- Chiama `api/pdf-ai-enhance` con il prompt strutturato (vedi sezione 6)
- Se errore: torna a fase idle con messaggio di errore

### Fase 3 — REVIEW
Layout due colonne — split 40% / 60%:

**Colonna sinistra (40%) — documento originale**
- Se PDF: renderizza prima pagina come immagine tramite `pdf-lib` o mostra
  iframe con il PDF originale
- Se immagine: mostra img con object-fit contain
- Scrollabile indipendentemente

**Colonna destra (60%) — risultati AI**

Header con metadati estratti:
```
Data intervento: 26/08/2025
Tecnici: Lembo Giuseppe, Astone Antonino
```

Sezione ✅ LAVORI REGISTRABILI (N)
- Raggruppati per area (es. "Compressore N.2", "Carico camion 1")
- Ogni item mostra: nome componente, tipo intervento, spunta individuale
- Spunta default: selezionato
- Icona matita per aprire form di modifica inline
- Form di modifica inline (si apre sotto la riga):
  - Area (dropdown tutte le aree)
  - Componente (dropdown componenti dell'area)
  - Tipo intervento (testo libero)
  - Note (testo libero)

Sezione ⚠️ NON RICONOSCIUTI (N)
- Ogni item mostra testo originale dalla relazione
- Form sempre visibile (non collassato):
  - Area: dropdown con tutte le aree — pre-selezionata dal suggerimento AI
  - Componente: dropdown componenti dell'area selezionata
    + voce "➕ Aggiungi nuovo componente"
  - Se "Aggiungi nuovo": mostra campi Nome e Codice editabili
  - Tipo intervento, Note
  - Bottoni: [Aggiungi e registra] [Ignora]

Sezione 📋 PROSSIMI INTERVENTI CONSIGLIATI (N)
- Stessa struttura dei non riconosciuti
- Questi producono `euromecc_pending` invece di `euromecc_done`
- Campo aggiuntivo: Priorità (alta/media/bassa) + Data scadenza

**Action bar in fondo alla colonna destra:**
- Campo "Note generali relazione" (textarea)
- Bottone secondario "Salva bozza"
- Bottone primario "✓ Conferma tutto e registra"
  - Registra tutti i matched selezionati + partial approvati + pending selezionati
  - Crea euromecc_extra_components per ogni nuovo componente approvato
  - Crea record in euromecc_relazioni
  - Mostra feedback: "X lavori registrati, Y interventi futuri aggiunti"
  - Torna a fase idle

### Fase BOZZA
- Salva stato corrente in `euromecc_relazioni` con `statoImportazione: "bozza"`
- Al ritorno nel tab: se esiste una bozza, mostra banner
  "Hai una bozza in corso — [Riprendi] [Scarta]"

---

## 6. PROMPT AI — struttura da passare a `api/pdf-ai-enhance`

Il campo `inputText` deve contenere:

```
Sei un assistente tecnico specializzato in impianti industriali di stoccaggio cemento.
Analizza la seguente relazione di manutenzione e restituisci SOLO un oggetto JSON,
senza testo aggiuntivo, senza markdown, senza backtick.

DIZIONARIO COMPONENTI DISPONIBILI:
[inserire qui a runtime la lista completa areaKey → subKey[] da euromeccAreas.ts
 più i componenti extra da euromecc_extra_components]

STRUTTURA JSON RICHIESTA:
{
  "dataIntervento": "yyyy-MM-dd",
  "tecnici": ["Nome Cognome"],
  "matched": [
    {
      "areaKey": "...",
      "subKey": "...",
      "title": "descrizione lavoro",
      "tipoIntervento": "Sostituzione|Verifica|Installazione|Pulizia|Controllo|Altro",
      "doneDate": "yyyy-MM-dd",
      "by": "Nome Cognome",
      "note": "",
      "nextDate": null
    }
  ],
  "partial": [
    {
      "rawText": "testo originale non mappato",
      "suggestedAreaKey": "areaKey o null",
      "suggestedSubKey": "subKey o null"
    }
  ],
  "pending": [
    {
      "rawText": "testo intervento consigliato",
      "suggestedAreaKey": "areaKey o null",
      "suggestedSubKey": "subKey o null",
      "suggestedPriority": "alta|media|bassa"
    }
  ]
}

REGOLE:
- Usa SOLO le areaKey e subKey presenti nel dizionario componenti
- Se un componente non è nel dizionario, mettilo in "partial" non in "matched"
- La sezione "prossimi interventi consigliati" della relazione va in "pending"
- doneDate deve essere la data dell'intervento indicata nel documento
- by deve essere il nome del tecnico che ha eseguito quel lavoro specifico
- Se i tecnici sono più di uno e non è specificato chi ha fatto cosa,
  usa il primo tecnico per tutti i lavori
- Non inventare componenti non presenti nel dizionario

TESTO RELAZIONE:
[testo estratto dal documento]
```

### Estrazione testo dal file
- Se immagine (jpg/png): converti in base64 → passa come `imageBase64`
  a `pdf-ai-enhance` (supporta già immagini)
- Se PDF: usa `pdf-lib` già nel repo per estrarre testo grezzo → passa come `inputText`
  Se `pdf-lib` non riesce ad estrarre testo (PDF scansionato):
  converti prima pagina in canvas → base64 → passa come `imageBase64`

### Costruzione dizionario a runtime
Prima della chiamata AI, costruisci il dizionario così:

```ts
// 1. aree statiche da euromeccAreas.ts
const staticDict = Object.values(EUROMECC_AREAS).map(area => ({
  areaKey: area.key,
  areaLabel: area.title,
  components: area.components.map(c => ({ subKey: c.key, subLabel: c.name }))
}));

// 2. componenti extra da Firestore
const extraSnap = await getDocs(collection(db, "euromecc_extra_components"));
const extraByArea: Record<string, {subKey: string, subLabel: string}[]> = {};
extraSnap.docs.forEach(doc => {
  const d = doc.data() as EuromeccExtraComponent;
  if (!extraByArea[d.areaKey]) extraByArea[d.areaKey] = [];
  extraByArea[d.areaKey].push({ subKey: d.subKey, subLabel: d.name });
});

// 3. merge
const dict = staticDict.map(area => ({
  ...area,
  components: [
    ...area.components,
    ...(extraByArea[area.areaKey] ?? [])
  ]
}));
```

---

## 7. WRITER CALLS — sequenza al "Conferma tutto"

```ts
// Per ogni matched selezionato:
await addEuromeccDoneTask({
  areaKey, subKey, title,
  doneDate, by, note,
  nextDate: null,
  closedPending: false
});

// Per ogni partial approvato con subKey esistente:
await addEuromeccDoneTask({ ... });

// Per ogni partial approvato con subKey === "NEW":
// 1. prima crea il componente extra
await addDoc(collection(db, "euromecc_extra_components"), {
  areaKey, subKey: generatedSubKey,
  name: editName, code: editCode,
  addedFrom: relazioneId,
  addedAt: today, addedBy: operatore,
  createdAt: serverTimestamp(), 
});
// 2. poi registra il lavoro
await addEuromeccDoneTask({ areaKey, subKey: generatedSubKey, ... });

// Per ogni pending selezionato:
await addEuromeccPendingTask({
  areaKey, subKey, title,
  priority: editPriority,
  dueDate: editDueDate ?? "",
  note: editNote
});

// Salva record relazione
await addDoc(collection(db, "euromecc_relazioni"), {
  fileName, fileType, dataIntervento, tecnici,
  note: noteGenerali,
  statoImportazione: "confermata",
  doneCount, pendingCount, extraComponentsCount,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

---

## 8. COMPONENTE RelazioniStorico

In fondo al tab (visibile in fase idle), lista delle relazioni già importate:

```
RELAZIONI IMPORTATE
─────────────────────────────────────────────────
26/08/2025  Lembo Giuseppe, Astone Antonino
            12 lavori registrati · 3 interventi futuri
            [Visualizza]
─────────────────────────────────────────────────
10/02/2025  Perdichizzi Domenico, Astone Antonino
            14 lavori registrati · 2 interventi futuri
            [Visualizza]
```

Click "Visualizza" → apre modal read-only con il payload completo della relazione.
Non permette modifiche — solo consultazione.

---

## 9. FIRESTORE RULES — aggiornamenti richiesti

Aggiungere a `firestore.rules`:

```
match /euromecc_extra_components/{docId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn()
    && request.resource.data.areaKey is string
    && request.resource.data.subKey is string
    && request.resource.data.name is string
    && request.resource.data.code is string;
  allow delete: if isSignedIn();
}

match /euromecc_relazioni/{docId} {
  allow read: if isSignedIn();
  allow create, update: if isSignedIn();
  allow delete: if isSignedIn();
}
```

---

## 10. CSS — classi da aggiungere

Seguire le convenzioni CSS esistenti del modulo Euromecc (prefisso `eur-`):

```css
.eur-relazioni-upload       /* drop zone upload */
.eur-relazioni-review       /* container fase review */
.eur-relazioni-col-left     /* colonna documento */
.eur-relazioni-col-right    /* colonna risultati */
.eur-relazioni-section      /* sezione matched/partial/pending */
.eur-relazioni-item         /* singolo lavoro */
.eur-relazioni-item--matched
.eur-relazioni-item--partial
.eur-relazioni-item--pending
.eur-relazioni-item--ignored
.eur-relazioni-action-bar   /* barra azioni in fondo */
.eur-relazioni-storico      /* lista storico */
.eur-relazioni-storico-item
```

---

## 11. PERIMETRO FILE

### CREA
- Nessun file nuovo — tutto dentro `NextEuromeccPage.tsx`

### MODIFICA
- `src/next/NextEuromeccPage.tsx` — aggiunta tab + tutti i componenti locali
- `firestore.rules` — aggiunta rules per due nuove collection

### NON TOCCARE
- `src/next/euromeccAreas.ts`
- `src/next/domain/nextEuromeccDomain.ts` — usare i writer esistenti, non modificarli
- `src/next/internal-ai/internalAiEuromeccReadonly.ts`
- `api/pdf-ai-enhance.ts`
- Qualsiasi altro file

### SE SERVE TOCCARE FILE EXTRA
- Fermati e scrivi: `SERVE FILE EXTRA: <path>`

---

## 12. DIVIETI ASSOLUTI

- Non modificare tab esistenti (Home, Manutenzione, Problemi, Riepilogo)
- Non modificare SiloDiagram, CaricoDiagram, SILO_HOTSPOTS, CARICO_HOTSPOTS
- Non modificare writer esistenti in nextEuromeccDomain.ts
- Non aprire scritture su collection diverse da euromecc_done, euromecc_pending,
  euromecc_extra_components, euromecc_relazioni
- Non chiamare api diversi da api/pdf-ai-enhance
- Non introdurre nuove dipendenze npm

---

## 13. BUILD / TEST OBBLIGATORI

- `npm run build` — zero errori TypeScript
- Verifica runtime:
  1. Tab "Relazioni" visibile nella navigazione Euromecc
  2. Upload PDF → bottone Analizza attivo
  3. Fase analyzing → loading visibile
  4. Fase review → layout due colonne con documento e risultati
  5. "Conferma tutto" → dati visibili in tab Manutenzione
  6. Storico → relazione appare nella lista

---

## 14. OUTPUT RICHIESTO DA CODEX

1. `PATCH COMPLETATA` oppure `PATCH PARZIALE`
2. `FILE TOCCATI:`
3. `COMPONENTI CREATI:` lista funzioni/componenti aggiunti
4. `COLLECTION USATE:` conferma delle 4 collection
5. `BUILD:` esito
6. `RUNTIME:` conferma visiva se disponibile
7. `NOTE:` anomalie o SERVE FILE EXTRA
