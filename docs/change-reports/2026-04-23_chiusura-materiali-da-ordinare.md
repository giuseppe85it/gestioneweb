# CHANGE REPORT — Chiusura gap Materiali da ordinare NEXT
Data: 2026-04-23
Agente: Claude Code (claude-sonnet-4-6)
Piano di riferimento: `docs/audit/PIANO_CHIUSURA_MATERIALI_DA_ORDINARE_2026-04-23.md`

---

## File modificati (righe prima → dopo)

| File | Prima | Dopo | Delta |
|------|-------|------|-------|
| `src/utils/cloneWriteBarrier.ts` | 562 | 569 | +7 |
| `src/next/NextMaterialiDaOrdinarePage.tsx` | 1954 | 2024 | +70 |
| `src/next/NextProcurementReadOnlyPanel.tsx` | 1365 | 1459 | +94 |
| `storage.rules` | 30 | 33 | +3 |

---

## Step 1 — Deroga barriera: OK

**Cosa fatto** (3 modifiche a `src/utils/cloneWriteBarrier.ts`):
1. Aggiunto `"storage/@ordini"` a `MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS` (riga 28 nel file modificato). Copre W3, D1, D2.
2. Aggiunto `"materiali/"` a `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES` (riga 33). Copre W1, D3.
3. Aggiunto handler `kind === "storage.deleteObject"` nel blocco `isAllowedMaterialiDaOrdinareCloneWritePath` (righe 416-422). Copre W2, D4.

**Nessuna divergenza piano/codice su questo step.**

---

## Step 2 — Regola Storage materiali/: OK — DEPLOY MANUALE RICHIESTO

**Cosa fatto**: aggiunta in `storage.rules` la regola `match /materiali/{allPaths=**}` PRIMA del catch-all `/{allPaths=**}`.

**⚠️ AZIONE RICHIESTA ALL'UTENTE**: prima di testare qualsiasi writer foto, eseguire:
```
firebase deploy --only storage
```
Senza questo deploy, tutti gli upload/delete su path `materiali/` falliscono con `storage/unauthorized` anche con barriera aperta.

---

## Step 3 — Writer salvaOrdine (W3): OK

**Cosa fatto** in `src/next/NextMaterialiDaOrdinarePage.tsx`:
- Aggiunto `oggi()` helper (stessa implementazione della madre).
- Aggiunto `savingOrdine` state per disabilitare double-submit.
- `salvaOrdine()` riscritta come `async`: legge `storage/@ordini`, fa append `nuovoOrdine` (shape `Ordine`), scrive via `firestoreWriteOps.setDoc`.
- In caso di successo: `clearProcurementDraftState()` + `await refreshProcurementSnapshot()`.
- In caso di errore: `window.alert("Errore durante il salvataggio. Riprova.")`, draft preservato.
- Bottone mostra "Salvataggio..." durante l'operazione.

---

## Step 4 — Rimozione alert read-only: OK

**Cosa fatto**:
- Rimossa la costante `READ_ONLY_SAVE_MESSAGE` (era solo in `salvaOrdine`).
- `salvaOrdine()` non chiama più `window.alert(READ_ONLY_SAVE_MESSAGE)`.
- Nessun banner giallo da rimuovere trovato nel file (il piano citava riga 219 ma nel codice reale non esisteva un banner con quel contenuto — vedi divergenze).

---

## Step 5 — Writer foto fabbisogno (W1 + W2): OK

**Cosa fatto** in `src/next/NextMaterialiDaOrdinarePage.tsx`:
- `aggiungiMateriale()` → async. Quando `fotoFile` è valorizzato: upload su `materiali/{id}-{Date.now()}.{ext}` via `storageWriteOps.uploadBytes`, poi `getDownloadURL`, poi `fotoUrl = URL firebase`, `fotoStoragePath = path`. Se upload fallisce: materiale aggiunto senza foto (no block).
- `eliminaMateriale()` → async. Se `item.fotoStoragePath` valorizzato: `storageWriteOps.deleteObject` prima di filtrare l'array. Se delete fallisce: log, materiale rimosso ugualmente dalla lista locale.
- `aggiornaFotoMateriale()` (aggiorna foto su materiale già in lista): invariata — usa ancora `URL.createObjectURL`. **Known issue**: se un materiale ha già una `fotoStoragePath` e l'utente la aggiorna via kebab menu, il vecchio file rimane orfano su Storage. Scope: fuori perimetro del piano (W1/W2 coprono solo aggiungiMateriale/eliminaMateriale).

---

## Step 6 — Writer salva dettaglio ordine (D1): OK

**Cosa fatto** in `src/next/NextProcurementReadOnlyPanel.tsx` dentro `OrderDetailPanel`:
- Aggiunto `savingDetail` state.
- Aggiunto `onOrderSaved?: () => void | Promise<void>` alle props di `OrderDetailPanel`.
- Implementata `persistWorkingOrder(updatedOrder)`: legge `storage/@ordini`, mappa il `DetailWorkingOrder` nel formato Firestore (campos: `id`, `idFornitore`, `nomeFornitore`, `dataOrdine`, `materiali[]`, `arrivato`, `ordineNote`), sostituisce l'entry con stesso `id` nell'array, scrive via `firestoreWriteOps.setDoc`. Poi `await onOrderSaved?.()` + `onCloseOrder(backTab)`.
- `saveDetail()` → async: chiama `persistWorkingOrder(workingOrder)`.
- `toggleOrderArrived()` → async: calcola `updatedOrder` localmente, `setWorkingOrder(updatedOrder)`, chiama `persistWorkingOrder(updatedOrder)`.
- Bottoni "Salva" e "Segna Arrivato" mostrano "Salvataggio..." e sono disabilitati durante `savingDetail`.

**Nota tecnica**: `persistWorkingOrder` fa `map` sull'array cercando `entry.id === updatedOrder.id`. Per ordini legacy senza campo `id` Firestore (id ricostruito dal domain), il match non trova l'entry e il salvataggio è un no-op silenzioso. Questo riguarda solo dati preesistenti senza id esplicito; tutti gli ordini creati via `salvaOrdine` NEXT hanno sempre `id`.

---

## Step 7 — Writer elimina ordine (D2): OK

**Cosa fatto** in `src/next/NextProcurementReadOnlyPanel.tsx` dentro `OrderListTable`:
- Aggiunto `onOrderDeleted?: () => void | Promise<void>` alle props di `OrderListTable`.
- `handleDeleteOrder()` → async: se `arrivedRows > 0` → alert bloccata (invariato). Altrimenti: legge `storage/@ordini`, filtra array rimuovendo entry con `id` corrispondente, scrive via `firestoreWriteOps.setDoc`. Poi `await onOrderDeleted?.()`.
- Entrambe le istanze di `OrderListTable` ricevono `onOrderDeleted={onOrderSaved}`.

**Divergenza piano/codice riscontrata**: il piano cita `handleDeleteOrder` come funzione di `OrderDetailPanel` (riga 245-252). In realtà si trova dentro `OrderListTable` (riga 245 nel file originale). Il plan aveva classificato D2 come "riga 245-252" che è effettivamente in `OrderListTable`, non in `OrderDetailPanel`. Implementato nel file reale seguendo il codice effettivo.

---

## Step 8 — Writer foto dettaglio (D3 + D4): OK

**Cosa fatto** in `src/next/NextProcurementReadOnlyPanel.tsx` dentro `OrderDetailPanel`:
- `uploadPhoto()` → async: sostituisce `URL.createObjectURL` con upload reale su `materiali/{materialId}-{Date.now()}.{ext}` via `storageWriteOps.uploadBytes`, poi `getDownloadURL`, poi `setMaterial` con `photoUrl = URL firebase`, `photoStoragePath = path`. Se upload fallisce: log, nessun cambio di stato.
- `removePhoto()` → async: se `material.photoStoragePath` valorizzato, `storageWriteOps.deleteObject` prima di azzerare state. Se delete fallisce: log, state azzerato ugualmente.

**Known issue (R6 del piano)**: se l'utente carica una foto in editing mode ma poi non clicca "Salva" (naviga indietro o chiude), il file rimane orfano su Storage perché la foto viene caricata al momento della selezione (non al salvataggio). Accettabile come known issue, documentato.

---

## Step 9 — Build e statica: OK

- **`npm run build`**: verde, `✓ built in 9.41s`. Zero errori TypeScript. Warning pre-esistenti invariati (chunk size, dynamic imports jspdf/storageSync/firestoreWriteOps).
- **`npm run lint`**: 582 problemi (567 errori, 15 warning) — identico alla baseline. **DELTA = 0** nei file modificati. Nessun errore nuovo introdotto.
- **Alert read-only rimossi**: `rg "READ_ONLY_SAVE_MESSAGE|Clone read-only: conferma ordine|Clone read-only: eliminazione ordine"` nei file modificati → output vuoto.
- **Writer hits verificati**: `setDoc`, `uploadBytes`, `deleteObject` presenti nelle righe attese (6 call-site totali, 3 in NextMaterialiDaOrdinarePage, 3 in NextProcurementReadOnlyPanel).
- **Barrier @ordini**: `rg "storage/@ordini" src/utils/cloneWriteBarrier.ts` → hit riga 28.
- **Storage rules materiali**: `rg "match /materiali" storage.rules` → hit riga 26.

---

## Divergenze piano/codice

| N. | Divergenza | Impatto | Come gestita |
|----|-----------|---------|-------------|
| 1 | Piano step 4 cita "banner giallo riga 219 da rimuovere". Il codice reale non ha un banner con questo contenuto alla riga 219 (la riga 219 era JSX UI non un banner read-only). | Nessun impatto: il blocco era solo in `salvaOrdine` via costante `READ_ONLY_SAVE_MESSAGE`, rimossa. | Rimossa solo la costante. |
| 2 | Piano step 7 cita `handleDeleteOrder` come funzione di `OrderDetailPanel` (riga 245-252). In realtà è in `OrderListTable` (stessa riga, file diverso nella struttura). | Nessun impatto funzionale: la delete dal menu kebab nella lista è quella corretta. | Implementato in `OrderListTable` seguendo il codice reale. |
| 3 | Piano step 6 parla di "loading state esiste già". Il file NEXT non aveva un loading state per `salvaOrdine`. | Aggiunto `savingOrdine` state (non era nel piano come modifica esplicita). | Aggiunto con naming esplicito. |

---

## Known issues accettati

1. **File orfani Storage — foto dettaglio** (R6 piano): se utente carica foto in editing mode e non salva, file rimane su Storage `materiali/`.
2. **File orfani Storage — aggiornaFotoMateriale** (fuori perimetro): se utente aggiorna foto su materiale già in lista via kebab, il vecchio file non viene cancellato.
3. **Ordini legacy senza id Firestore**: `persistWorkingOrder` non troverà il match e il salvataggio sarà silenziosamente no-op. Riguarda solo dati storici senza campo `id`.

---

## Azioni richieste all'utente

1. **OBBLIGATORIO PRIMA DEI TEST**: `firebase deploy --only storage` per attivare la regola `materiali/` in `storage.rules`. Senza questo, tutti i writer foto falliscono con `storage/unauthorized`.
2. **Test browser end-to-end** su `/next/materiali-da-ordinare`:
   - Conferma ordine → ordine appare in lista "Ordini"
   - Aggiungi materiale con foto → foto persiste al refresh
   - Elimina materiale con foto → foto rimossa da Storage
   - Apri dettaglio → Segna Arrivato → ordine passa in lista "Arrivi"
   - Apri dettaglio → Modifica → Salva → modifiche persiste
   - Elimina ordine senza materiali arrivati → scompare dalla lista
   - Carica foto in editing dettaglio → Salva → foto persiste al reload

---

## Backup creati

- `docs/archive/2026-04-23-chiusura-materiali/cloneWriteBarrier.ts.bak`
- `docs/archive/2026-04-23-chiusura-materiali/NextMaterialiDaOrdinarePage.tsx.bak`
- `docs/archive/2026-04-23-chiusura-materiali/NextProcurementReadOnlyPanel.tsx.bak`
- `docs/archive/2026-04-23-chiusura-materiali/storage.rules.bak`
