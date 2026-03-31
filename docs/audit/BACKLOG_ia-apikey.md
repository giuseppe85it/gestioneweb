# BACKLOG - `IA API Key`

- Modulo target: `IA API Key`
- Route target:
  - `/next/ia/apikey`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextIAApiKeyPage.tsx` chiamava ancora `saveNextIaConfigSnapshot()` e quindi scriveva davvero su Firestore.
  - `src/next/domain/nextIaConfigDomain.ts` dichiarava e implementava ancora il salvataggio reale della chiave nel clone.
- Path precisi:
  - `src/next/NextIAApiKeyPage.tsx`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/pages/IA/IAApiKey.tsx`
