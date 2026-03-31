# CHANGE REPORT - `Autisti` final fix after global audit

- Timestamp: `2026-03-31 15:45 Europe/Rome`
- Modulo: `Autisti`
- Obiettivo: correggere il falso `CLOSED` emerso dall'audit finale globale e confinare il runtime ufficiale a `/next/autisti/*`.

## File toccati
- `src/next/autisti/NextLoginAutistaNative.tsx`
- `src/next/autisti/NextSetupMezzoNative.tsx`
- `src/next/autisti/NextHomeAutistaNative.tsx`
- `src/next/NextLegacyStorageBoundary.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_autisti.md`
- `docs/audit/AUDIT_autisti_LOOP.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Sintesi tecnica
- rimossi i redirect runtime ufficiali da `/next/autisti/*` verso `/autisti/*` in login, setup e home;
- lasciata invariata la UI madre-like del modulo;
- reso innocuo il boundary `autisti` legacy-shaped sul solo subtree ufficiale `/next/autisti/*`;
- aggiornato il tracker del loop per registrare la correzione post-audit globale.

## Verifiche
- `npx eslint ...` sui file runtime del modulo `Autisti` -> `OK`
- `npm run build` -> `OK`
- controllo mirato sui redirect -> nessuna navigazione residua del runtime ufficiale verso `/autisti/*`
