# AUDIT — Rimozione stub Archivista

Data: 2026-04-22
Modello: claude-sonnet-4-6

---

## 1. fattura_ddt × documento_mezzo

### Stato runtime
`not_available`  
Evidenza: `src/next/NextIAArchivistaPage.tsx:93-98`

```
"fattura_ddt:documento_mezzo": {
  availability: "not_available",
  titolo: "Fattura / DDT + Documento mezzo",
  descrizione: "Combinazione non prevista nel modello V1.",
  badge: "Non disponibile",
},
```

### Logica presente
**Nessuna.**  
- Non è presente in `DESTINATION_OPTIONS` (`NextIAArchivistaPage.tsx:41-77`): la voce non compare nel dropdown.
- Non è montato alcun bridge. Il ramo cade nell'`else` generico che renderizza `ia-archivista__inactive-shell` (`NextIAArchivistaPage.tsx:350-358`).
- `isContextAllowed` (`NextIAArchivistaPage.tsx:141-143`) blocca attivamente questa combo: `fattura_ddt` accetta solo `magazzino` o `manutenzione`; se il preset di navigazione portasse `documento_mezzo`, verrebbe normalizzato a `magazzino` prima del mount.
- Non esiste alcuna `ArchivistaFamily` corrispondente in `ArchivistaArchiveClient.ts` (le 5 famiglie definite sono: `fattura_ddt_magazzino`, `fattura_ddt_manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_manutenzione` — `ArchivistaArchiveClient.ts:14-19`).

### Dipendenze
- Nessuna costante esportata, nessun tipo esportato, nessuna stringa letterale fuori da `NextIAArchivistaPage.tsx`.
- Grep su `src/` per `fattura_ddt_documento`, `documento_mezzo_magazzino`, `documento_mezzo_manutenzione`: **nessun risultato**.
- `HomeInternalAiLauncher.tsx`: `ARCHIVISTA_V1_ACTIONS` non contiene questa combo (`HomeInternalAiLauncher.tsx:21-50`).
- `storage.rules`: nessun path Storage dedicato.
- `src/utils/cloneWriteBarrier.ts`: nessuna menzione.

### Dati salvati
Nessun indizio di dati salvati (nessuna family, nessun path Storage, nessuna collection Firestore dedicata).

### Classificazione
**RIMOVIBILE PULITA**  
Evidenza: `NextIAArchivistaPage.tsx:93-98` (unica occorrenza).  
Nota obbligatoria: la rimozione dell'entry da `FLOW_MATRIX` deve accompagnarsi all'aggiornamento della type annotation della variabile (`NextIAArchivistaPage.tsx:79`), che dichiara `Record<\`${ArchivistaTipo}:${ArchivistaContesto}\`, ArchivistaFlowState>` richiedendo tutte e 9 le combinazioni. Senza aggiornamento il compilatore TypeScript produce errore. Il tocco resta all'interno del solo file `NextIAArchivistaPage.tsx`.

---

## 2. preventivo × documento_mezzo

### Stato runtime
`not_available`  
Evidenza: `src/next/NextIAArchivistaPage.tsx:113-118`

```
"preventivo:documento_mezzo": {
  availability: "not_available",
  titolo: "Preventivo + Documento mezzo",
  descrizione: "Combinazione non prevista nel modello V1.",
  badge: "Non disponibile",
},
```

### Logica presente
**Nessuna.**  
- Non è presente in `DESTINATION_OPTIONS` (`NextIAArchivistaPage.tsx:41-77`).
- Nessun bridge montato; cade nell'`else` generico (`NextIAArchivistaPage.tsx:350-358`).
- `isContextAllowed` (`NextIAArchivistaPage.tsx:144-146`) blocca: `preventivo` accetta solo `magazzino` o `manutenzione`.
- Nessuna `ArchivistaFamily` corrispondente (`ArchivistaArchiveClient.ts:14-19`).

### Dipendenze
- Nessuna costante esportata, nessun tipo esportato, nessuna stringa letterale fuori da `NextIAArchivistaPage.tsx`.
- `HomeInternalAiLauncher.tsx`: non presente in `ARCHIVISTA_V1_ACTIONS`.
- `storage.rules`: nessun path Storage dedicato.
- `src/utils/cloneWriteBarrier.ts`: nessuna menzione.

### Dati salvati
Nessun indizio (stessa verifica della combinazione 1).

### Classificazione
**RIMOVIBILE PULITA**  
Evidenza: `NextIAArchivistaPage.tsx:113-118` (unica occorrenza).  
Stessa nota sulla type annotation: aggiornare `NextIAArchivistaPage.tsx:79` contestualmente.

---

## 3. documento_mezzo × magazzino

### Stato runtime
`not_available`  
Evidenza: `src/next/NextIAArchivistaPage.tsx:119-124`

```
"documento_mezzo:magazzino": {
  availability: "not_available",
  titolo: "Documento mezzo + Magazzino",
  descrizione: "Combinazione non prevista nel modello V1.",
  badge: "Non disponibile",
},
```

### Logica presente
**Nessuna.**  
- Non è presente in `DESTINATION_OPTIONS`.
- Nessun bridge montato; cade nell'`else` generico (`NextIAArchivistaPage.tsx:350-358`).
- `isContextAllowed` (`NextIAArchivistaPage.tsx:148-149`) blocca: `documento_mezzo` accetta solo `documento_mezzo` come contesto (`return contesto === "documento_mezzo"`). Un preset con `contesto: "magazzino"` verrebbe normalizzato a `documento_mezzo`.
- Nessuna `ArchivistaFamily` corrispondente.
- Nota: la stringa `"documento_mezzo"` ricorrente nel resto del codice (`nextDocumentiCostiDomain.ts`, `internalAiUniversalHandoff.ts`, ecc.) si riferisce al ramo **attivo** `documento_mezzo:documento_mezzo`, NON a questa combinazione stub.

### Dipendenze
- Nessuna fuori da `NextIAArchivistaPage.tsx`.
- `HomeInternalAiLauncher.tsx:44-49`: l'azione "Documento mezzo" usa `tipo: "documento_mezzo", contesto: "documento_mezzo"` — non questa combinazione.
- `storage.rules`: nessun path dedicato.
- `src/utils/cloneWriteBarrier.ts`: nessuna menzione.

### Dati salvati
Nessun indizio.

### Classificazione
**RIMOVIBILE PULITA**  
Evidenza: `NextIAArchivistaPage.tsx:119-124` (unica occorrenza).  
Stessa nota sulla type annotation: aggiornare `NextIAArchivistaPage.tsx:79`.

---

## 4. documento_mezzo × manutenzione

### Stato runtime
`not_available`  
Evidenza: `src/next/NextIAArchivistaPage.tsx:125-130`

```
"documento_mezzo:manutenzione": {
  availability: "not_available",
  titolo: "Documento mezzo + Manutenzione",
  descrizione: "Combinazione non prevista nel modello V1.",
  badge: "Non disponibile",
},
```

### Logica presente
**Nessuna.**  
- Non è presente in `DESTINATION_OPTIONS`.
- Nessun bridge montato; cade nell'`else` generico (`NextIAArchivistaPage.tsx:350-358`).
- `isContextAllowed` (`NextIAArchivistaPage.tsx:148-149`) blocca per le stesse ragioni della combinazione 3.
- Nessuna `ArchivistaFamily` corrispondente.

### Dipendenze
- Nessuna fuori da `NextIAArchivistaPage.tsx`.
- `HomeInternalAiLauncher.tsx`: non presente.
- `storage.rules`: nessun path dedicato.
- `src/utils/cloneWriteBarrier.ts`: nessuna menzione.

### Dati salvati
Nessun indizio.

### Classificazione
**RIMOVIBILE PULITA**  
Evidenza: `NextIAArchivistaPage.tsx:125-130` (unica occorrenza).  
Stessa nota sulla type annotation: aggiornare `NextIAArchivistaPage.tsx:79`.

---

## 5. Impatto UI della rimozione

Le 4 combinazioni sono **già assenti dal dropdown** (`DESTINATION_OPTIONS`, `NextIAArchivistaPage.tsx:41-77`). Il dropdown contiene esattamente 5 voci, tutte corrispondenti a rami attivi. La rimozione non produce buchi visivi né logici nel dropdown.

`isContextAllowed` (`NextIAArchivistaPage.tsx:140-149`) filtra già a monte le combinazioni stub via navigazione con preset. Dopo la rimozione delle 4 entry da `FLOW_MATRIX`, quella funzione resta l'unico presidio contro stati non validi ricevuti via navigation state: va conservata o la sua logica va incorporata nella normalizzazione.

**Rischio post-rimozione (basso ma da documentare):** se dopo la rimozione uno stato `tipo/contesto` stub raggiungesse la variabile `activeFlow = FLOW_MATRIX[buildFlowKey(tipo, contesto)]`, il valore sarebbe `undefined` e la prima lettura di `activeFlow.badge` a `NextIAArchivistaPage.tsx:314` causerebbe un crash runtime. Questo percorso è oggi irraggiungibile via UI e navigation state, ma la rimozione non aggiunge un guard esplicito a quel punto. Se si vuole blindare, si può aggiungere un fallback per `activeFlow` undefined nello stesso file — ma non è strettamente necessario visto il guard esistente.

---

## 6. File da toccare nella patch successiva (elenco secco)

```
src/next/NextIAArchivistaPage.tsx
  - rimuovere entry "fattura_ddt:documento_mezzo"   (righe 93-98)
  - rimuovere entry "preventivo:documento_mezzo"    (righe 113-118)
  - rimuovere entry "documento_mezzo:magazzino"     (righe 119-124)
  - rimuovere entry "documento_mezzo:manutenzione"  (righe 125-130)
  - aggiornare type annotation di FLOW_MATRIX       (riga 79)
    da: Record<`${ArchivistaTipo}:${ArchivistaContesto}`, ArchivistaFlowState>
    a:  una forma che non richieda tutte le 9 combinazioni
        (es. Partial<Record<...>> oppure unione esplicita di chiavi valide)
```

Nessun altro file da toccare.

---

## 7. Domande aperte / file non letti

Nessuna domanda aperta critica per questa rimozione.

File letti per questo audit:
- `src/next/NextIAArchivistaPage.tsx` (integrale)
- `src/next/internal-ai/ArchivistaArchiveClient.ts` (righe 1-100, 240-300)
- `src/next/components/HomeInternalAiLauncher.tsx` (integrale)
- `docs/product/AUDIT_ARCHIVISTA_PREVENTIVO_MANUTENZIONE.md` (integrale)
- `storage.rules` (grep)
- `src/utils/cloneWriteBarrier.ts` (grep)
- Glob `src/next/internal-ai/**/*` per inventario bridge

File non letti perché non necessari (nessun hit nei grep):
- Bridge singoli (`ArchivistaMagazzinoBridge.tsx`, `ArchivistaManutenzioneBridge.tsx`, ecc.): nessuna delle 4 combinazioni stub vi compare.
- `src/next/domain/*`: nessun risultato per le family/path delle 4 combinazioni stub.
- Tutti gli altri consumer `src/next/` che filtrano per `documento_mezzo`: i risultati del grep mostrano che si riferiscono tutti al ramo attivo `documento_mezzo:documento_mezzo`, non alle 4 combinazioni stub.
