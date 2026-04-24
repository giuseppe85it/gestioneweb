# Fix punto 3 FAIL — Materiali da ordinare NEXT

## Scopo
Correzione dei 2 FAIL documentati nel verdetto `docs/verdicts/VERDETTO_CHIUSURA_MATERIALI_DA_ORDINARE_2026-04-24.md`, punto 3.

## Fonte del rimedio
- Verdetto, sezione `PUNTO 3`
- Verdetto, sezione `RIMEDI`

## Handler modificati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
  - prima: `aggiornaFotoMateriale` a riga `1050`
  - dopo: `aggiornaFotoMateriale` a riga `1050`
  - trigger file input:
    - prima: `onChange` a riga `1701`
    - dopo: `onChange` a riga `1724`
  - bottone kebab `Foto`:
    - prima: riga `1756`
    - dopo: riga `1776`
- `src/next/NextProcurementReadOnlyPanel.tsx`
  - prima: `saveNewMaterial` a riga `686`
  - dopo: `saveNewMaterial` a riga `686`
  - bottone `Salva` AddMaterial:
    - prima: riga `1007`
    - dopo: riga `1028`

## Pattern Storage usato
- Pattern confermato: `materiali/{id}-{Date.now()}.{ext}`
- `NextMaterialiDaOrdinarePage.tsx` usa `materialId`
- `NextProcurementReadOnlyPanel.tsx` usa il nuovo `nextMaterialId`
- Estensione coerente col file reale: `file.name.split(".").pop() ?? "jpg"`

## Cosa cambia
- `aggiornaFotoMateriale` e ora `async`
- Sequenza reale implementata:
  1. calcolo `path`
  2. `uploadBytes(...)`
  3. `getDownloadURL(...)`
  4. delete opzionale del vecchio `fotoStoragePath` solo dopo upload riuscito
  5. `setMateriali(...)` con `fotoUrl` persistente e `fotoStoragePath` reale
- `saveNewMaterial` e ora `async`
- Se `newPhotoFile` esiste:
  1. genera `nextMaterialId`
  2. calcola `path`
  3. `uploadBytes(...)`
  4. `getDownloadURL(...)`
  5. costruisce `nextMaterial` con `photoUrl` persistente e `photoStoragePath` reale
  6. solo dopo aggiorna `workingOrder`

## Gestione errori implementata
- Upload fallito:
  - `console.error(...)`
  - `window.alert("Errore durante il caricamento della foto. Riprova.")`
  - nessun update di stato con `blob:` URL errato
- Delete del vecchio file fallito in `aggiornaFotoMateriale`:
  - `console.warn(...)`
  - il nuovo file resta valido
  - il vecchio file puo restare orfano

## Anti double submit
- `NextMaterialiDaOrdinarePage.tsx`
  - riuso `savingOrdine`
  - trigger file input wrappato con `void aggiornaFotoMateriale(...)`
  - bottone kebab `Foto` disabilitato durante upload
  - aggiunto `title="Caricamento foto in corso..."` quando `savingOrdine === true`
- `NextProcurementReadOnlyPanel.tsx`
  - riuso `savingDetail`
  - bottone `Salva` wrappato con `onClick={() => void saveNewMaterial()}`
  - bottone `Salva` disabilitato durante upload

## Verifiche statiche eseguite
- `npm run build` -> `OK`
- `npm run lint` -> `KO` sul baseline globale storico invariato `582 problemi / 567 errori / 15 warning`
- `npx eslint src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementReadOnlyPanel.tsx` -> `OK`
- grep async handlers -> `OK`
- grep wrapper storage aggiuntivi -> `OK`

## Nota grep `URL.createObjectURL`
- Resta una hit fuori scope a `src/next/NextMaterialiDaOrdinarePage.tsx:928`
- La hit residua appartiene al preview locale di `handleFileChange`, non ai 2 handler corretti in questa patch
- Nei 2 handler fixati (`aggiornaFotoMateriale`, `saveNewMaterial`) non resta alcun `URL.createObjectURL`

## Test browser richiesti
1. Aggiungi foto a materiale in bozza, conferma ordine, refresh pagina: la foto deve restare visibile.
2. Modifica foto di un materiale gia in bozza, conferma ordine, refresh pagina: deve restare la nuova foto.
3. Apri dettaglio ordine, aggiungi nuovo materiale con foto, salva dettaglio, refresh pagina: la foto deve restare visibile.
4. Ripeti i due flussi sopra verificando che non compaiano `blob:` URL persistiti nei dati e poi riemetti il verdetto del punto 3.

## Azioni utente richieste
- Eseguire i 4 scenari browser sopra
- Riverificare il punto 3 del verdetto `VERDETTO_CHIUSURA_MATERIALI_DA_ORDINARE_2026-04-24.md`
