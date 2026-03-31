# Change Report - `IA API Key` loop fix

- Timestamp: `2026-03-31 10:30 Europe/Rome`
- Modulo: `IA API Key`
- Route: `/next/ia/apikey`
- Obiettivo: chiudere `IA API Key` come clone read-only fedele della madre, mantenendo la stessa UI ma bloccando il salvataggio reale della chiave.

## File letti
- `src/next/NextIAApiKeyPage.tsx`
- `src/next/domain/nextIaConfigDomain.ts`
- `src/pages/IA/IAApiKey.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`

## Patch applicate
- Aggiornato `src/next/domain/nextIaConfigDomain.ts` per lasciare la lettura reale e bloccare il writer con errore read-only esplicito.
- Aggiornato `src/next/NextIAApiKeyPage.tsx` per mostrare lo stesso modulo della madre, ma restituire il messaggio read-only al submit.

## Verifiche eseguite
- `npx eslint src/next/NextIAApiKeyPage.tsx src/next/domain/nextIaConfigDomain.ts`
- `npm run build`
- Audit separato in `docs/audit/AUDIT_ia-apikey_LOOP.md`

## Esito
- `IA API Key` promosso a `CLOSED` nel tracker del loop.
- Prossimo modulo in ordine: `IA Libretto`.
