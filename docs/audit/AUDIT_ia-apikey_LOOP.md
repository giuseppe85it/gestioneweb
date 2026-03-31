# AUDIT LOOP - `IA API Key`

- Timestamp audit: `2026-03-31 10:30 Europe/Rome`
- Modulo: `IA API Key`
- Route verificata:
  - `/next/ia/apikey`
- Fonti runtime verificate:
  - `src/next/NextIAApiKeyPage.tsx`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/pages/IA/IAApiKey.tsx`

## Verifiche

- Route ufficiale NEXT autonoma:
  - `PASS`
  - `/next/ia/apikey` monta `NextIAApiKeyPage`, non `NextMotherPage` o `src/pages/IA/IAApiKey.tsx`.

- UI pratica madre-like:
  - `PASS`
  - Header, banner, input, toggle visibilita, bottone `Salva chiave`, bottone ritorno e nota finale restano coerenti con la madre.

- Dati reali della madre:
  - `PASS`
  - Il modulo legge lo stesso documento `@impostazioni_app/gemini` tramite `readNextIaConfigSnapshot()`.

- Scritture reali e clone-only:
  - `PASS`
  - `saveNextIaConfigSnapshot()` non scrive piu in Firestore e rilancia un errore read-only esplicito.
  - `NextIAApiKeyPage` mantiene la UI madre ma blocca `Salva chiave` con messaggio read-only esplicito.

- Lint e build:
  - `PASS`
  - `npx eslint src/next/NextIAApiKeyPage.tsx src/next/domain/nextIaConfigDomain.ts`
  - `npm run build`

## Esito audit

- Verdetto: `PASS`
- Stato modulo nel tracker: `CLOSED`
- Gap aperti nel perimetro `IA API Key`: nessuno
- Prossimo modulo del loop: `IA Libretto`
