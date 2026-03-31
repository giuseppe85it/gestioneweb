# Change Report - Loop `Dossier Rifornimenti` (`2026-03-31 08:20`)

## Obiettivo
Chiudere il modulo `Dossier Rifornimenti` della NEXT sulla route `/next/dossier/:targa/rifornimenti` come clone fedele read-only della madre.

## File letti
- `src/App.tsx`
- `src/next/NextDossierRifornimentiPage.tsx`
- `src/next/NextRifornimentiEconomiaSection.tsx`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/pages/DossierRifornimenti.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_dossier-rifornimenti.md`
- `docs/audit/AUDIT_dossier-rifornimenti_LOOP.md`

## Patch applicate
- `NextDossierRifornimentiPage` mostra il CTA `← Dossier`, coerente con la madre, mantenendo il redirect clone-safe al dossier NEXT.
- `NextRifornimentiEconomiaSection` supporta ora uno scope dati esplicito.
- La route ufficiale `Dossier Rifornimenti` usa lo scope `legacy_parity`, che esclude i record `solo_campo` e riallinea il modulo alla stessa base dati visibile della madre.

## Verifiche eseguite
- `npx eslint src/next/NextRifornimentiEconomiaSection.tsx src/next/NextDossierRifornimentiPage.tsx` -> OK
- `npm run build` -> OK

## Esito operativo
- Il modulo `Dossier Rifornimenti` passa da `NOT_STARTED` a `CLOSED` nel tracker.
- L'audit separato del modulo risulta `PASS`.
- Il prossimo modulo non `CLOSED` del loop diventa `Inventario`.
