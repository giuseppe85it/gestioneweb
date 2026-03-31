# AUDIT FINALE GLOBALE NEXT POST LOOP V2

- Timestamp audit: `2026-03-31 16:04 Europe/Rome`
- Modalita: audit puro, avversariale e separato
- Scope: riesecuzione del verdetto globale dopo il fix finale separato del modulo `Autisti`
- Verdetto finale: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Fonti lette
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP.md`
- `docs/audit/BACKLOG_autisti.md`
- `docs/audit/AUDIT_autisti_LOOP.md`
- tutti i backlog e audit loop dei moduli oggi marcati `CLOSED`, da `Home` a `Manutenzioni`

## Tracker letto e stato iniziale
- File letto: `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- Stato iniziale rilevato nel file:
  - ultimo aggiornamento `2026-03-31 15:45 Europe/Rome`
  - tutti i moduli del tracker risultano `CLOSED`
  - il tracker dichiara il falso `CLOSED` di `Autisti` come corretto
  - il tracker non registra ancora il nuovo esito globale separato

## Verifica globale su codice reale
- `src/App.tsx` monta route ufficiali NEXT per tutti i moduli del tracker, inclusi:
  - `/next/autisti/*`
  - `/next/autisti-inbox*`
  - `/next/autisti-admin`
- Il blocco precedente su `Autisti` e davvero risolto:
  - nel runtime ufficiale non risultano piu navigazioni residue verso `/autisti/*`
  - il subtree `/next/autisti/*` non riceve piu override `autisti` legacy-shaped da `NextLegacyStorageBoundary`
- La madre risulta intoccata nel worktree:
  - `git status --short -- src/pages src/autisti src/autistiInbox` -> vuoto
  - `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> vuoto
- Il verdetto globale resta comunque `NO` per un nuovo blocco reale, distinto dal precedente:
  - `Autisti Inbox / Admin`, pur marcato `CLOSED`, continua a poter leggere overlay clone-only nel runtime ufficiale.

## Evidenza grave confermata

### Modulo `Autisti Inbox / Admin`
- Route ufficiali NEXT montate in `src/App.tsx`:
  - `src/App.tsx:526` -> `path="autisti-inbox"`
  - `src/App.tsx:534` -> `path="autisti-inbox/cambio-mezzo"`
  - `src/App.tsx:542` -> `path="autisti-inbox/log-accessi"`
  - `src/App.tsx:550` -> `path="autisti-inbox/gomme"`
  - `src/App.tsx:558` -> `path="autisti-inbox/controlli"`
  - `src/App.tsx:566` -> `path="autisti-inbox/segnalazioni"`
  - `src/App.tsx:574` -> `path="autisti-inbox/richiesta-attrezzature"`
  - `src/App.tsx:614` -> `path="autisti-admin"`
- Wrapper ufficiali NEXT effettivamente montati:
  - `src/next/NextAutistiInboxHomePage.tsx:7` -> `<NextLegacyStorageBoundary presets={["autisti"]}>`
  - `src/next/NextAutistiAdminPage.tsx:6` -> `<NextLegacyStorageBoundary presets={["flotta", "autisti", "lavori", "manutenzioni"]}>`
- Hard fact sul boundary:
  - `src/next/NextLegacyStorageBoundary.tsx:209` applica `readNextAutistiLegacyStorageOverrides()` per il preset `autisti` quando il pathname NON e `/next/autisti/*`
  - quindi il preset `autisti` resta attivo su `/next/autisti-inbox*` e `/next/autisti-admin`
- Hard fact sugli overlay clone-only:
  - `src/next/nextLegacyAutistiOverlay.ts:579` fonde `getNextAutistiCloneSegnalazioni()`
  - `src/next/nextLegacyAutistiOverlay.ts:583` fonde `getNextAutistiCloneControlli()`
  - `src/next/nextLegacyAutistiOverlay.ts:587` fonde `getNextAutistiCloneRichiesteAttrezzature()`
  - `src/next/nextLegacyAutistiOverlay.ts:591` fonde `getNextAutistiCloneRifornimenti()`
- Hard fact sul percorso di lettura reale:
  - `src/next/autisti/nextAutistiStorageSync.ts:34-37` considera ufficiali anche `/next/autisti-inbox*` e `/next/autisti-admin`
  - `src/utils/storageSync.ts:141-144` in clone runtime restituisce prima `readNextLegacyStorageOverride(key)` e solo dopo il dato reale
  - i runtime inbox/admin leggono ampiamente via `getItemSync()` di `nextAutistiStorageSync.ts`
- Conseguenza tecnica:
  - le route ufficiali inbox/admin possono ancora vedere dataset alterati da overlay clone-local
  - la parity dati rispetto alla madre non e garantita
  - il claim del loop `Autisti Inbox / Admin = CLOSED` non regge al codice reale

## Rischi incrociati osservati
- Il problema non e una scrittura reale riaperta: le mutation admin restano bloccate nel runtime ufficiale.
- Il problema e un boundary di lettura: un modulo dichiarato chiuso continua a poter mostrare dati clone-only nel percorso ufficiale.
- Questo basta da solo a invalidare il verdetto globale, anche con `Autisti` ormai corretto.

## Moduli che il tracker dichiara `CLOSED` ma che non risultano chiusi davvero
- `Autisti Inbox / Admin`
  - motivo: il runtime ufficiale passa ancora da `NextLegacyStorageBoundary` con preset `autisti` su `/next/autisti-inbox*` e `/next/autisti-admin`, e quel preset inietta overlay clone-only nei dataset letti dal modulo.

## Madre toccata o no
- Madre non toccata.
- Nessuna modifica locale rilevata in `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**`.

## Verdetto finale
- `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Motivazione finale
- Il fix finale di `Autisti` corregge davvero il vecchio blocco, ma non chiude il verdetto globale.
- `Autisti Inbox / Admin` risulta ancora falsato nel codice reale.
- Le route ufficiali NEXT inbox/admin montano wrapper NEXT, ma passano da un boundary che reintroduce overlay clone-local.
- Questo rompe il requisito di lettura degli stessi dati reali della madre.
- Il tracker tutto `CLOSED` non e quindi ancora affidabile come prova finale.
- La madre resta intoccata; il problema e solo nella NEXT.
