# CHANGE REPORT - 2026-04-22 14:30 - fix storage rules preventivi

## Tipo intervento

Fix Firebase Storage Rules: aggiunta regola mancante per path `preventivi/{allPaths=**}`.

## File runtime toccati

- `storage.rules`

## Diagnosi

Il path `preventivi/` non era mai stato presente in `storage.rules` in nessuno dei 4 commit di storia del file:
- `52f44eba`: solo `euromecc/relazioni/` + catch-all deny
- `4acda7e9`: aggiunte `documenti_pdf/`, `mezzi_aziendali/`, `libretto/`
- `2afa6264` (precedente): aggiunta `mezzi/`
- nessun commit aveva mai aggiunto `preventivi/`

Conseguenza: qualsiasi upload su `preventivi/` cadeva nella regola catch-all `allow read, write: if false`, generando `storage/unauthorized` lato Firebase SDK.

Il cloneWriteBarrier (`src/utils/cloneWriteBarrier.ts`) era correttamente configurato: `ARCHIVISTA_ALLOWED_STORAGE_PATH_PREFIXES` include `"preventivi/"` e `isAllowedArchivistaCloneWritePath` riconosce `/next/ia/archivista`. Il barrier non era la causa: lasciava passare entrambe le family verso Firebase, che poi rifiutava per assenza di regola.

Entrambi i rami `preventivo_magazzino` e `preventivo_manutenzione` usano il path `preventivi/${archiveId}_${safeName}` via `buildStoragePathForFile()` in `ArchivistaArchiveClient.ts`. Entrambi erano bloccati.

## Fix applicato

Aggiunto il seguente match block a `storage.rules` dopo il blocco `mezzi/`, prima del catch-all:

```
match /preventivi/{allPaths=**} {
  allow read, write: if request.auth != null;
}
```

## Testo esatto nel file (righe 23-25)

```
    match /preventivi/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
```

## Deploy eseguito

```
firebase deploy --only storage
```

Esito: `+ storage: released rules storage.rules to firebase.storage` — **OK**.
Progetto: `gestionemanutenzione-934ef`.

## Impatto

- Ramo `Preventivo -> Manutenzione` (`ArchivistaPreventivoManutenzioneBridge`): sblocco upload su `preventivi/`. Flusso ora completo end-to-end pendente verifica runtime.
- Ramo `Preventivo -> Magazzino` (`ArchivistaPreventivoMagazzinoBridge`): idem. Era anch'esso bloccato, ora effettivamente scrivibile su Storage per la prima volta in questo ambiente.
- Nessun impatto su altri path Storage, Firestore o barrier.

## Verifiche eseguite

- `storage.rules` compilato senza errori da Firebase CLI prima del deploy.
- `npm run build` -> **OK** (20.56s).
- `npm run lint` -> **582 problemi / 567 errori / 15 warning** — delta zero rispetto al baseline pre-fix. Nessuna regressione introdotta.
- Deploy Firebase: **OK**.
