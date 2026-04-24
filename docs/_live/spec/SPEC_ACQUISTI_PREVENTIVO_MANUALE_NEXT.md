# SPEC_ACQUISTI_PREVENTIVO_MANUALE_NEXT — v3

> **Fonte primaria di verità** per l'implementazione della feature "Preventivo manuale" nel tab NEXT "Prezzi & Preventivi" del modulo Acquisti.
>
> Questo documento è stato redatto dopo **quattro audit di sola lettura** sul codice reale della madre (`src/pages/Acquisti.tsx`) e del barrier (`src/utils/cloneWriteBarrier.ts`). Ogni affermazione tecnica è ancorata a `path:riga` e riporta il codice sorgente letterale dove necessario.
>
> **Regola di precedenza:** il codice reale della madre prevale sempre su questa spec. Se l'implementatore trova divergenze tra questa spec e il codice, deve fermarsi e segnalare, non reinterpretare.
>
> **Versione:** v2 del 2026-04-22 (sostituisce integralmente la v1, che conteneva errori sulle normalizzazioni e sul flusso di import listino rilevati nel PROMPT 6). v3 del 2026-04-23 (aggiunte checkbox WhatsApp/Email opzionali, D8, §4.2 estesa, §5.2 aggiornata, §5.4 nuova, §6.2 estesa, §9.6 nuova, anti-pattern aggiornati).

---

## 1. OBIETTIVO FUNZIONALE

Permettere all'utente, dal tab NEXT **"Prezzi & Preventivi"** (route `/next/materiali-da-ordinare?tab=preventivi`), di inserire manualmente un preventivo (tipicamente ricevuto via WhatsApp, chiamata, SMS) senza passare per il flusso di import PDF/immagini con IA.

Il preventivo manuale deve:
- comparire nel registro preventivi insieme a quelli importati via IA;
- aggiornare automaticamente il listino prezzi (`storage/@listino_prezzi`) al momento del salvataggio;
- essere compatibile al 100% con la UI madre (`src/pages/Acquisti.tsx`) che legge gli stessi documenti Firestore.

---

## 2. DECISIONI DI DESIGN (NON NEGOZIABILI)

| # | Decisione | Valore |
|---|-----------|--------|
| D1 | Posizione del pulsante | Nuovo pulsante **"PREVENTIVO MANUALE"** nel tab "Prezzi & Preventivi", accanto al pulsante esistente "CARICA PREVENTIVO" |
| D2 | Righe articolo | Multi-riga. Minimo **1 riga** obbligatoria, nessun massimo |
| D3 | Allegato foto | **Opzionale**, 0..N foto. Salvate in `Preventivo.imageStoragePaths` / `Preventivo.imageUrls` |
| D4 | Pre-compilazione `numeroPreventivo` | Pre-compilato con la data odierna in formato `ggmmaaaa` (es. `22042026`). Campo **editabile** |
| D5 | Scrittura listino al salvataggio | **Sì**, automatica. Scrittura diretta senza passare per il flusso di bozza della madre |
| D6 | Valuta | Select **CHF / EUR** a livello preventivo. Default CHF |
| D7 | Codice articolo | Campo **libero non obbligatorio** nel modale. Confluisce direttamente in `ListinoVoce.codiceArticolo`, NON in `PreventivoRiga.note` |
| D8 | Canale ricezione preventivo | Due checkbox opzionali "Ricevuto via WhatsApp" e "Ricevuto via Email" nel modale, nella sezione "Canale ricezione" dopo il campo Valuta. Salvate come campi booleani opzionali sul Preventivo (`ricevutoDaWhatsapp?: boolean`, `ricevutoDaEmail?: boolean`), scritti solo se `true`. Badge "✓ WhatsApp" / "✓ Email" visibile nella colonna N. preventivo della lista preventivi espansa nel tab. Lista base non modificata strutturalmente. Madre ignora i campi extra. |

---

## 3. VINCOLI ARCHITETTURALI ASSOLUTI

1. **NON MODIFICARE** `src/pages/Acquisti.tsx` (madre) in nessun modo.
2. **NON MODIFICARE** la shape di `Preventivo`, `PreventivoRiga`, `ListinoVoce`, `Fornitore`, `Valuta`.
3. **NON MODIFICARE** la logica di lettura (`readNextProcurementSnapshot`, `mapPreventivoRecord`, `mapListinoRecord`).
4. I documenti Firestore `storage/@preventivi` e `storage/@listino_prezzi` sono **condivisi** tra madre e NEXT: ogni scrittura deve produrre documenti con shape **identica** a quella prodotta dalla madre.
5. Tutte le scritture devono passare attraverso i wrapper `src/utils/firestoreWriteOps.ts` e `src/utils/storageWriteOps.ts`.
6. **NON importare funzioni da `src/pages/Acquisti.tsx`**: nessuna funzione della madre è esportata. L'implementatore deve **replicarle byte-per-byte** nel file NEXT dedicato.

---

## 4. FATTI TECNICI DAL CODICE REALE

### 4.1 Route e componenti

- Route: `/next/materiali-da-ordinare`
- Pagina: `src/next/NextMaterialiDaOrdinarePage.tsx`
- Selezione tab: query string `?tab=preventivi`
- Componente tab: `src/next/NextProcurementConvergedSection.tsx`, branch `pricingView === "preventivi"`

### 4.2 Shape documenti Firestore (verificate PROMPT 6)

#### `Valuta` — `Acquisti.tsx:63`
```ts
type Valuta = "CHF" | "EUR";
```

#### `PreventivoRiga` — `Acquisti.tsx:40-46`
```ts
type PreventivoRiga = {
  id: string;
  descrizione: string;
  unita: string;
  prezzoUnitario: number;
  note?: string;
};
```

#### `Preventivo` — `Acquisti.tsx:48-61`
```ts
type Preventivo = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  imageStoragePaths?: string[];
  imageUrls?: string[];
  righe: PreventivoRiga[];
  createdAt: number;
  updatedAt: number;
};
```

**Campi opzionali aggiuntivi NEXT-only (v3):**
```ts
ricevutoDaWhatsapp?: boolean;
ricevutoDaEmail?: boolean;
```
Scritti solo se `true` (spread condizionale, vedi §6.2). Non presenti nel tipo originale della madre (`Acquisti.tsx:48-61`). La madre ignora i campi extra presenti sui documenti Firestore condivisi `storage/@preventivi`.

#### `ListinoVoce` — `Acquisti.tsx:65-98`
```ts
type ListinoVoce = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  articoloCanonico: string;
  codiceArticolo?: string;
  note?: string;
  unita: string;
  valuta: Valuta;
  prezzoAttuale: number;
  fonteAttuale: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    note?: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  prezzoPrecedente?: number;
  fontePrecedente?: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    note?: string;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  trend: "down" | "up" | "same" | "new";
  deltaAbs?: number;
  deltaPct?: number;
  updatedAt: number;
};
```

### 4.3 Costanti documenti

La madre usa costanti `PREVENTIVI_DOC_ID` e `LISTINO_DOC_ID` che valgono rispettivamente `"@preventivi"` e `"@listino_prezzi"`. Nel NEXT replicare con gli stessi valori.

### 4.4 Wrapper writer

File `src/utils/firestoreWriteOps.ts`:
- `setDoc(reference, data, options?)` — chiama `assertCloneWriteAllowed("firestore.setDoc", { path })` (righe 29-36)

File `src/utils/storageWriteOps.ts`:
- `uploadBytes(reference, data, metadata?)` — chiama `assertCloneWriteAllowed("storage.uploadBytes", { path, ... })` (righe 20-28)

Se il barrier blocca, viene lanciato `CloneWriteBlockedError`.

### 4.5 Funzioni della madre da replicare (codice letterale, PROMPT 6)

**Tutte le funzioni elencate qui sono `local to module`, non esportate.** L'implementatore deve riprodurle identiche nel file NEXT dedicato (`src/next/nextPreventivoManualeWriter.ts`).

#### 4.5.1 `normalizeDescrizione` — `Acquisti.tsx:634-640`
```ts
function normalizeDescrizione(v: string) {
  return String(v || "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}
```

#### 4.5.2 `normalizeUnita` — `Acquisti.tsx:642-644`
```ts
function normalizeUnita(v: string) {
  return String(v || "").toUpperCase().trim();
}
```

#### 4.5.3 `normalizeArticoloCanonico` — `Acquisti.tsx:724-726`
```ts
function normalizeArticoloCanonico(v: string) {
  return normalizeDescrizione(v);
}
```

#### 4.5.4 `computeTrend` — `Acquisti.tsx:763-771`
```ts
function computeTrend(prezzoNuovo: number, prezzoPrecedente?: number) {
  if (prezzoPrecedente === undefined || prezzoPrecedente === null || !Number.isFinite(prezzoPrecedente)) {
    return { trend: "new" as const, deltaAbs: undefined as number | undefined, deltaPct: undefined as number | undefined };
  }
  const deltaAbs = prezzoNuovo - prezzoPrecedente;
  const deltaPct = prezzoPrecedente === 0 ? undefined : (deltaAbs / prezzoPrecedente) * 100;
  if (deltaAbs < 0) return { trend: "down" as const, deltaAbs, deltaPct };
  if (deltaAbs > 0) return { trend: "up" as const, deltaAbs, deltaPct };
  return { trend: "same" as const, deltaAbs, deltaPct: 0 };
}
```

#### 4.5.5 `listinoKey` — `Acquisti.tsx:749-761`
```ts
function listinoKey(input: {
  fornitoreId: string;
  articoloCanonico: string;
  unita: string;
  valuta: Valuta;
}) {
  return [
    String(input.fornitoreId || "").trim(),
    normalizeArticoloCanonico(input.articoloCanonico),
    normalizeUnita(input.unita),
    input.valuta,
  ].join("|");
}
```

#### 4.5.6 `sanitizeUndefinedToNull` — `Acquisti.tsx:785-799`
```ts
function sanitizeUndefinedToNull<T>(value: T): T {
  if (value === undefined) return null as T;
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUndefinedToNull(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      out[key] = item === undefined ? null : sanitizeUndefinedToNull(item);
    });
    return out as T;
  }
  return value;
}
```

#### 4.5.7 `asStringArray` — `Acquisti.tsx:817-822`
```ts
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
}
```

#### 4.5.8 `generaId` — `Acquisti.tsx:253`
```ts
const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
```

### 4.6 Matching listino — logica reale

Il matching è realizzato via `listinoKey` (§4.5.5). La chiave include:
- `fornitoreId` trimmed
- `normalizeArticoloCanonico(articoloCanonico)` — UPPERCASE, punteggiatura `.-_/` → spazio, spazi multipli compressi
- `normalizeUnita(unita)` — UPPERCASE, trim
- `valuta` (stringa `"CHF" | "EUR"` esatta)

La prima voce con stessa chiave matcha.

**Implicazione pratica per la UI:** l'utente che scrive "Filtro olio Volvo" o "FILTRO OLIO VOLVO" o "filtro.olio-volvo" produce la stessa chiave → matcha la stessa voce listino.

### 4.7 Storage path per foto preventivo manuale

Per ogni foto allegata al preventivo manuale usare il path:

```
preventivi/manuali/${preventivoId}_${idx}.${ext}
```

- `preventivoId`: generato via `generaId()`
- `idx`: 1-based, nell'ordine di upload
- `ext`: estensione originale del file, lowercase, no dots

Questo path è **distinto** dal path IA della madre (`preventivi/ia/...`) e dal path PDF finale (`preventivi/...`), per mantenere separazione logica.

---

## 5. FLUSSO UTENTE (UX)

### 5.1 Attivazione

1. Utente naviga su `/next/materiali-da-ordinare?tab=preventivi`.
2. Nell'header del registro, accanto al pulsante "CARICA PREVENTIVO" esistente, compare **"PREVENTIVO MANUALE"**.
3. Click → si apre un **modale**.

### 5.2 Modale

**Sezione testata:**
- **Fornitore** (obbligatorio): select da fornitori NEXT (source: `src/next/domain/nextFornitoriDomain.ts`).
- **Numero preventivo** (obbligatorio): input testo. Pre-compilato `ggmmaaaa` odierno. Editabile.
- **Data preventivo** (obbligatorio): input date. Default odierna. Salvata in formato `YYYY-MM-DD`.
- **Valuta** (obbligatorio): select CHF / EUR. Default CHF.
- **Sezione "Canale ricezione"** (opzionale): due checkbox indipendenti, dopo il campo Valuta.
  - "Ricevuto via WhatsApp" → stato `ricevutoDaWhatsapp`, default `false`
  - "Ricevuto via Email" → stato `ricevutoDaEmail`, default `false`
  - Entrambe NON obbligatorie. Non bloccano la validazione. Abilitate/disabilitate insieme agli altri controlli durante il salvataggio.
  - Evidenza: `NextPreventivoManualeModal.tsx:395-425`

**Sezione righe articoli (almeno 1, senza massimo):**
Per ogni riga:
- **Descrizione** (obbligatorio): input testo → `PreventivoRiga.descrizione`
- **Codice articolo** (opzionale): input testo → direttamente `ListinoVoce.codiceArticolo` (NON confluisce in `PreventivoRiga.note`)
- **Unità** (obbligatorio): input testo (es. `PZ`, `LT`, `KG`) → `PreventivoRiga.unita`
- **Prezzo unitario** (obbligatorio): input numerico → `PreventivoRiga.prezzoUnitario`
- **Note riga** (opzionale): input testo → `PreventivoRiga.note`
- Bottone "×" rimuovi riga (visibile solo se ci sono ≥ 2 righe)

Bottone **"+ Aggiungi riga"** sotto la lista.

**Sezione allegati:**
- Uploader multi-file (accept `image/*`), opzionale, con preview e rimozione pre-salvataggio.

**Pulsanti modale:**
- **"Annulla"** — chiude senza salvare
- **"Salva preventivo"** — esegue §6

### 5.3 Validazione (inline, niente `window.alert`)

Impedire salvataggio se:
- `fornitoreId` non selezionato
- `numeroPreventivo` vuoto (post trim)
- `dataPreventivo` vuoto
- nessuna riga presente
- almeno una riga ha: `descrizione` vuota post trim, oppure `unita` vuota post trim, oppure `prezzoUnitario` non finito/NaN/negativo/zero

### 5.4 Badge nel tab preventivi

Nell'area espansa del tab "Prezzi & Preventivi" (il gruppo fornitore deve essere aperto/espanso per vedere la tabella), la colonna "N. preventivo" della tabella `acq-prev-table` mostra il badge di canale ricezione.

Funzione renderer: `renderPreventivoReceiptBadges(item)` — `NextProcurementConvergedSection.tsx:123-146`.

- Se `ricevutoDaWhatsapp === true`: badge `✓ WhatsApp`.
- Se `ricevutoDaEmail === true`: badge `✓ Email`.
- Se entrambi `false` o `undefined`: il renderer restituisce `null` (nessun badge).

Stile badge: `inline-flex`, colore `#2d7a3e` (testo e bordo), background `rgba(45, 122, 62, 0.08)`, `border-radius: 999px`. Nessun file CSS creato: stile inline.

Posizionamento: dentro una `<div style={{ display: "grid", gap: 4 }}>` che contiene prima `<span>{item.numeroPreventivo}</span>` e poi il renderer — `NextProcurementConvergedSection.tsx:436`. La lista preventivi (struttura colonne, righe di testata, logica filtri) non è stata modificata.

---

## 6. FLUSSO DI SALVATAGGIO (LOGICA TECNICA)

### 6.1 Sequenza al click "Salva preventivo"

1. **Validazione** (§5.3). Se fallisce, stop.
2. **Generazione** `preventivoId = generaId()`.
3. **Upload foto** (se presenti) su `preventivi/manuali/<preventivoId>_<idx>.<ext>` via `uploadBytes` del wrapper `storageWriteOps`. Raccogliere `imageStoragePaths: string[]` e `imageUrls: string[]` (via `getDownloadURL`).
   - Se una foto fallisce: prosegui con le altre (log console).
   - Se tutte falliscono: prosegui senza foto (log console).
4. **Costruzione `Preventivo`** (§6.2).
5. **Lettura** `storage/@preventivi` via `getDoc` → `currentPreventivi: Preventivo[]`.
6. **Scrittura** `storage/@preventivi`: `setDoc(ref, sanitizeUndefinedToNull({ preventivi: [nuovoPreventivo, ...currentPreventivi] }), { merge: true })` via wrapper `firestoreWriteOps.setDoc`.
7. **Costruzione nuovo listino** (§6.3).
8. **Scrittura** `storage/@listino_prezzi` via wrapper.
9. **Refresh UI** (callback `onPreventivoSaved` passata dal parent).
10. **Feedback utente** inline e chiusura modale.

**Gestione errori:**
- Se §6.6 fallisce: abortire. Non scrivere listino. Mostrare errore.
- Se §6.8 fallisce: preventivo salvato, listino no. Mostrare errore specifico.

### 6.2 Costruzione oggetto `Preventivo`

```ts
const now = Date.now();
const preventivo: Preventivo = {
  id: preventivoId,
  fornitoreId: /* dal form */,
  fornitoreNome: /* lookup da fornitori caricati */,
  numeroPreventivo: /* dal form, trim */,
  dataPreventivo: /* dal form, formato YYYY-MM-DD */,
  pdfUrl: null,
  pdfStoragePath: null,
  imageStoragePaths: /* da §6.1.3, [] se vuoto */,
  imageUrls: /* da §6.1.3, [] se vuoto */,
  righe: /* vedi sotto */,
  createdAt: now,
  updatedAt: now,
};
```

**Campi opzionali canale ricezione (v3):**
Se `ricevutoDaWhatsapp` è `true`, viene aggiunto al Preventivo via spread condizionale:
```ts
...(input.ricevutoDaWhatsapp ? { ricevutoDaWhatsapp: true } : {})
```
Idem per `ricevutoDaEmail`:
```ts
...(input.ricevutoDaEmail ? { ricevutoDaEmail: true } : {})
```
Se il valore è `false` o `undefined`, il campo **NON viene scritto** nel documento Firestore (serializzazione pulita, nessun campo booleano `false` persistito). Evidenza: `nextPreventivoManualeWriter.ts:275-276`.

Per ogni riga del form, costruire `PreventivoRiga`:
```ts
const riga: PreventivoRiga = {
  id: generaId(),
  descrizione: /* dal form, trim */,
  unita: /* dal form, trim (NON normalizzare qui) */,
  prezzoUnitario: Number(/* dal form */),
  note: /* dal form (solo "Note riga"), trim, undefined se vuota */,
};
```

**IMPORTANTE (D7):** il campo "Codice articolo" del form **NON confluisce** in `PreventivoRiga.note`. Resta separato e viene applicato direttamente alla `ListinoVoce` in §6.3. Le note del preventivo contengono solo le note libere dell'utente.

Rationale: la madre usa una regex `code:|codice:` su `PreventivoRiga.note` per estrarre codici articolo in fase di import IA (`extractArticleCodeFromNote`, `Acquisti.tsx:742-746`). Non replichiamo quel meccanismo fragile per il preventivo manuale: il codice articolo va direttamente a destinazione.

### 6.3 Scrittura listino — logica reale semplificata

Poiché nel preventivo manuale **non c'è un flusso di bozza intermedio** (a differenza della madre, dove l'utente rivede l'estrazione IA), l'implementazione salta l'analisi di bozza e scrive direttamente il listino replicando il **ramo `default`** di `confermaImportBozza` (Acquisti.tsx:3867-3950).

**Algoritmo:**

1. Lettura listino corrente:
   ```ts
   const listinoRef = doc(collection(db, "storage"), "@listino_prezzi");
   const listinoSnap = await getDoc(listinoRef);
   const current: ListinoVoce[] = listinoSnap.exists() ? (listinoSnap.data()?.voci as ListinoVoce[]) || [] : [];
   ```
2. `let next = [...current]`
3. `const now = Date.now()`
4. **Per ogni riga del preventivo manuale:**

   a. Calcolare la chiave matching:
   ```ts
   const key = listinoKey({
     fornitoreId: preventivo.fornitoreId,
     articoloCanonico: riga.descrizione,
     unita: riga.unita,
     valuta: preventivo.valuta,
   });
   ```

   b. Cercare indice:
   ```ts
   const idx = next.findIndex((v) => listinoKey({
     fornitoreId: v.fornitoreId,
     articoloCanonico: v.articoloCanonico,
     unita: v.unita,
     valuta: v.valuta,
   }) === key);
   ```

   c. Costruire `nextFonteAttuale` (comune a entrambi i rami):
   ```ts
   const sourceImageStoragePaths = asStringArray(preventivo.imageStoragePaths);
   const sourceImageUrls = asStringArray(preventivo.imageUrls);
   const nextFonteAttuale = {
     preventivoId: preventivo.id,
     numeroPreventivo: preventivo.numeroPreventivo,
     dataPreventivo: preventivo.dataPreventivo,
     note: riga.note || undefined,
     pdfUrl: null,
     pdfStoragePath: null,
     imageStoragePaths: sourceImageStoragePaths,
     imageUrls: sourceImageUrls,
   };
   ```

   d. **Se `idx >= 0` (voce esistente):** replicare il ramo default di `Acquisti.tsx:3906-3946`:
   ```ts
   const prev = next[idx];
   const trendData = computeTrend(riga.prezzoUnitario, prev.prezzoAttuale);
   next[idx] = {
     ...prev,
     articoloCanonico: normalizeArticoloCanonico(riga.descrizione),
     codiceArticolo: (codiceArticoloDalForm || "").trim() || undefined,
     unita: normalizeUnita(riga.unita),
     valuta: preventivo.valuta,
     note: (riga.note || "").trim() || prev.note || undefined,
     prezzoPrecedente: prev.prezzoAttuale,
     fontePrecedente: {
       preventivoId: prev.fonteAttuale.preventivoId,
       numeroPreventivo: prev.fonteAttuale.numeroPreventivo,
       dataPreventivo: prev.fonteAttuale.dataPreventivo,
       note: String(prev.fonteAttuale.note || "").trim() || String(prev.note || "").trim() || undefined,
       imageStoragePaths: asStringArray(prev.fonteAttuale.imageStoragePaths),
       imageUrls: asStringArray(prev.fonteAttuale.imageUrls),
     },
     prezzoAttuale: riga.prezzoUnitario,
     fonteAttuale: nextFonteAttuale,
     trend: trendData.trend,
     deltaAbs: trendData.deltaAbs,
     deltaPct: trendData.deltaPct,
     updatedAt: now,
   };
   ```

   e. **Se `idx < 0` (voce nuova):** replicare `Acquisti.tsx:3948-3974`:
   ```ts
   next.push({
     id: generaId(),
     fornitoreId: preventivo.fornitoreId,
     fornitoreNome: preventivo.fornitoreNome,
     articoloCanonico: normalizeArticoloCanonico(riga.descrizione),
     codiceArticolo: (codiceArticoloDalForm || "").trim() || undefined,
     unita: normalizeUnita(riga.unita),
     valuta: preventivo.valuta,
     note: (riga.note || "").trim() || undefined,
     prezzoAttuale: riga.prezzoUnitario,
     fonteAttuale: {
       preventivoId: preventivo.id,
       numeroPreventivo: preventivo.numeroPreventivo,
       dataPreventivo: preventivo.dataPreventivo,
       note: (riga.note || "").trim() || undefined,
       pdfUrl: null,
       pdfStoragePath: null,
       imageStoragePaths: sourceImageStoragePaths,
       imageUrls: sourceImageUrls,
     },
     trend: "new",
     updatedAt: now,
   });
   ```

5. **Ordinare `next`:** `next.sort((a, b) => b.updatedAt - a.updatedAt);`
6. **Scrivere:** `setDoc(listinoRef, sanitizeUndefinedToNull({ voci: next }), { merge: true })` via wrapper.

**Note importanti:**
- `codiceArticoloDalForm` è il valore del campo "Codice articolo" del form, per riga.
- **NON** popolare `deltaAbs`/`deltaPct` sulla voce nuova (madre non lo fa).
- **NON** popolare `prezzoPrecedente`/`fontePrecedente` sulla voce nuova.
- `trend: "new"` è hardcoded per voci nuove (coerente con madre).
- L'aggiornamento in-place rispetta `...prev` → preserva ogni campo non esplicitamente sovrascritto.

---

## 7. MODIFICHE AL BARRIER

### 7.1 Costanti da aggiungere a `cloneWriteBarrier.ts`

```ts
const MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS = ["/next/materiali-da-ordinare"] as const;
const MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS = new Set([
  "storage/@preventivi",
  "storage/@listino_prezzi",
]);
const MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = ["preventivi/manuali/"] as const;
```

### 7.2 Funzione path match

```ts
function isAllowedMaterialiDaOrdinareCloneWritePath(pathname: string): boolean {
  return MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}
```

### 7.3 Branch da inserire a riga 366 (prima di Magazzino)

```ts
if (isAllowedMaterialiDaOrdinareCloneWritePath(pathname)) {
  if (kind === "firestore.setDoc") {
    return MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
  }
  if (kind === "storage.uploadBytes") {
    const path = readMetaPath(meta);
    return MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
      path.startsWith(prefix),
    );
  }
}
```

**Solo** `firestore.setDoc` e `storage.uploadBytes`. Nessun altro `kind` autorizzato.

---

## 8. PERIMETRO FILE

### 8.1 CREA

- `src/next/NextPreventivoManualeModal.tsx` — componente modale
- `src/next/nextPreventivoManualeWriter.ts` — funzioni helper (replica delle funzioni madre + logica salvataggio). Il writer **deve contenere** le repliche byte-per-byte di: `normalizeDescrizione`, `normalizeUnita`, `normalizeArticoloCanonico`, `computeTrend`, `listinoKey`, `sanitizeUndefinedToNull`, `asStringArray`, `generaId`. Più le due funzioni di alto livello: `saveNextPreventivoManuale` e `upsertListinoFromPreventivoManuale`.
- `docs/change-reports/<YYYY-MM-DD_HHMM>_preventivo_manuale_next.md`
- `docs/continuity-reports/<YYYY-MM-DD_HHMM>_continuity_preventivo_manuale_next.md`

### 8.2 MODIFICA

- `src/utils/cloneWriteBarrier.ts` — SOLO §7
- `src/next/NextProcurementConvergedSection.tsx` — stato `showManualeModal`, pulsante, render modale, prop `onPreventivoSaved?`
- `src/next/NextMaterialiDaOrdinarePage.tsx` — estrarre loader `readNextProcurementSnapshot` come callable, passare prop `onPreventivoSaved` al child
- `docs/product/STATO_MIGRAZIONE_NEXT.md` — APPEND ONLY
- `docs/product/REGISTRO_MODIFICHE_CLONE.md` — APPEND ONLY (voce numerata progressivamente)
- `CONTEXT_CLAUDE.md` — APPEND ONLY
- `docs/fonti-pronte/STATO_MIGRAZIONE_NEXT.md` — copia identica byte-per-byte
- `docs/fonti-pronte/REGISTRO_MODIFICHE_CLONE.md` — copia identica byte-per-byte
- `docs/fonti-pronte/CONTEXT_CLAUDE.md` — copia identica byte-per-byte

### 8.3 VIETATI

- `src/pages/Acquisti.tsx`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/utils/firestoreWriteOps.ts` (solo import, non modificare)
- `src/utils/storageWriteOps.ts` (solo import)
- qualsiasi altra spec in `docs/product/`
- `docs/fonti-pronte/00_INDICE_FONTI_PRONTE.md`
- qualsiasi change-report / continuity-report / voce esistente: solo append, mai modifica

---

## 9. NOTE TECNICHE

### 9.1 Lettura pre-scrittura

Prima di scrivere Firestore, **rileggere** il documento corrente via `getDoc` (non usare snapshot NEXT in memoria):

```ts
import { doc, collection, getDoc } from "firebase/firestore";
import { setDoc } from "@/utils/firestoreWriteOps";  // wrapper!

const ref = doc(collection(db, "storage"), "@preventivi");
const snap = await getDoc(ref);
const current: Preventivo[] = snap.exists() ? (snap.data()?.preventivi ?? []) : [];
const next = [nuovoPreventivo, ...current];
await setDoc(ref, sanitizeUndefinedToNull({ preventivi: next }), { merge: true });
```

### 9.2 Refresh UI dopo salvataggio

Il parent `NextMaterialiDaOrdinarePage.tsx` (righe ~620-628) carica lo snapshot via `readNextProcurementSnapshot`. Estrarre il loader come `useCallback` riusabile (es. `refreshProcurementSnapshot`) e passarlo al child `NextProcurementConvergedSection` come prop `onPreventivoSaved`. Il modale, al salvataggio riuscito, chiama `onPreventivoSaved()` prima di chiudersi.

### 9.3 Pulsante PREVENTIVO MANUALE — styling

Stessa classe CSS del pulsante "CARICA PREVENTIVO" esistente. Non creare CSS nuovi.

### 9.4 Testi UI

- Pulsante: `PREVENTIVO MANUALE`
- Titolo modale: `Nuovo preventivo manuale`
- Bottone salva: `Salva preventivo`
- Bottone annulla: `Annulla`
- Labels: `Fornitore`, `Numero preventivo`, `Data preventivo`, `Valuta`, `Articoli`, `+ Aggiungi riga`, `Descrizione`, `Codice articolo (opzionale)`, `Unità`, `Prezzo unitario`, `Note (opzionale)`, `Allegati foto (opzionale)`, `Aggiungi foto`
- Loading: `Salvataggio in corso...`
- Successo: `Preventivo salvato e listino aggiornato`

### 9.5 Validazione

Usare stato inline (colore input, messaggio sotto il campo). **Vietato** `window.alert` per validazione form.
`window.alert` **consentito solo** per feedback di fallimento di scrittura Firestore/Storage in §6.1.

### 9.6 Estensione dominio NEXT (v3)

Il mapper `mapPreventivoRecord` in `src/next/domain/nextProcurementDomain.ts` propaga i due campi con pattern:
```ts
ricevutoDaWhatsapp: raw?.ricevutoDaWhatsapp === true ? true : undefined,
ricevutoDaEmail: raw?.ricevutoDaEmail === true ? true : undefined,
```
Evidenza: `nextProcurementDomain.ts:743-744`.

Il type `NextProcurementPreventivoItem` (letto da `nextProcurementDomain.ts:110-111`) include i due campi come opzionali:
```ts
ricevutoDaWhatsapp?: boolean;
ricevutoDaEmail?: boolean;
```

Nessun altro mapper nel dominio (`mapListinoRecord`, ecc.) è stato toccato. La propagazione è limitata al solo record Preventivo.

---

## 10. CHECKLIST POST-IMPLEMENTAZIONE

1. [ ] `npx eslint` sui file toccati → OK
2. [ ] `npm run build` → OK
3. [ ] Aprire `/next/materiali-da-ordinare?tab=preventivi`
4. [ ] Pulsante "PREVENTIVO MANUALE" presente accanto a "CARICA PREVENTIVO"
5. [ ] Click apre modale
6. [ ] Numero preventivo pre-compilato `ggmmaaaa` odierno
7. [ ] Data pre-compilata oggi
8. [ ] Valuta default CHF
9. [ ] Validazione: senza fornitore → bloccato inline
10. [ ] Validazione: riga senza descrizione/unità/prezzo → bloccato inline
11. [ ] Aggiunta/rimozione righe OK
12. [ ] Upload foto multiple, preview, rimozione OK
13. [ ] Salva senza foto, 1 riga su articolo mai visto → preventivo appare; listino ha voce nuova, `trend: "new"`, `articoloCanonico` UPPERCASE, `unita` UPPERCASE
14. [ ] Salva senza foto, 1 riga su articolo già a listino stesso fornitore stessa unità stessa valuta → listino aggiornato, `prezzoPrecedente` popolato, `trend` coerente, `deltaAbs`/`deltaPct` calcolati
15. [ ] Salva con 2 foto → `preventivi/manuali/<id>_1.jpg`, `<id>_2.jpg` su Storage; `imageStoragePaths` e `imageUrls` popolati
16. [ ] Aprire `/acquisti` madre: preventivo manuale compare in elenco; "APRI DOCUMENTO" apre prima foto se presente
17. [ ] Aprire listino madre: voce aggiornata mostra trend e prezzi correttamente
18. [ ] Console: zero `[CLONE_NO_WRITE]`
19. [ ] Console: nessun errore rosso non-preesistente

---

## 11. ANTI-PATTERN

- ❌ Importare funzioni da `src/pages/Acquisti.tsx` (nessuna è esportata)
- ❌ Modificare shape di `Preventivo`, `PreventivoRiga`, `ListinoVoce`
- ❌ Aggiungere campi `tipoFonte`, `origine`, `manuale`
- ❌ Allargare barrier oltre `/next/materiali-da-ordinare`
- ❌ Autorizzare barrier `kind` diversi da `firestore.setDoc` + `storage.uploadBytes`
- ❌ Autorizzare documenti Firestore diversi da `@preventivi` + `@listino_prezzi`
- ❌ Autorizzare upload fuori da `preventivi/manuali/`
- ❌ Scrivere senza passare per i wrapper
- ❌ Introdurre logiche trend/delta diverse da `computeTrend` madre
- ❌ Introdurre normalizzazioni diverse da quelle replicate in §4.5
- ❌ Confluire "codice articolo" del form dentro `PreventivoRiga.note` (errore della v1 — corretto in §6.2)
- ❌ Replicare il flusso di bozza della madre (non necessario, vedi §6.3)
- ❌ Chiamare endpoint IA / fetch esterne
- ❌ Creare file CSS nuovi
- ❌ Usare `window.alert` per validazione
- ❌ Aggiungere librerie
- ❌ Reinterpretare testi UI di §9.4
- ❌ Modificare voci esistenti in registro/stato/context
- ❌ Mirror `fonti-pronte` non byte-per-byte
- ❌ Aggiungere i badge `✓ WhatsApp` / `✓ Email` nella lista preventivi base (struttura colonne — il badge va solo nel contenuto della cella N. preventivo nella vista espansa)
- ❌ Rendere le checkbox "Ricevuto via WhatsApp" / "Ricevuto via Email" obbligatorie o bloccanti per la validazione
- ❌ Scrivere `ricevutoDaWhatsapp: false` o `ricevutoDaEmail: false` nel documento Firestore (serializzazione pulita: scrivi solo se `true`)
- ❌ Modificare il tipo `Preventivo` originale della madre (`Acquisti.tsx:48-61`) — i due campi sono opzionali in intersezione locale NEXT e la madre li ignora

---

**Fine spec v3.** In caso di divergenze con il codice reale della madre: fermarsi e segnalare, non reinterpretare.