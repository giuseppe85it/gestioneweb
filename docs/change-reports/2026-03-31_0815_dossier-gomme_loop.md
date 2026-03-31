# Change Report - Loop `Dossier Gomme` (`2026-03-31 08:15`)

## Obiettivo
Chiudere il modulo `Dossier Gomme` della NEXT sulla route `/next/dossier/:targa/gomme` come clone fedele read-only della madre.

## File letti
- `src/App.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/pages/DossierGomme.tsx`
- `src/pages/GommeEconomiaSection.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_dossier-gomme.md`
- `docs/audit/AUDIT_dossier-gomme_LOOP.md`

## Patch applicate
- `NextDossierGommePage` mostra il CTA `← Dossier`, coerente con la madre, mantenendo il redirect clone-safe al dossier NEXT.
- `NextGommeEconomiaSection` supporta ora uno scope dati esplicito.
- La route ufficiale `Dossier Gomme` usa lo scope `legacy_parity`, che limita la vista ai record `manutenzione_derivata` e riallinea il modulo alla stessa base dati visibile della madre.

## Verifiche eseguite
- `npx eslint src/next/NextGommeEconomiaSection.tsx src/next/NextDossierGommePage.tsx` -> OK
- `npm run build` -> OK

## Esito operativo
- Il modulo `Dossier Gomme` passa da `NOT_STARTED` a `CLOSED` nel tracker.
- L'audit separato del modulo risulta `PASS`.
- Il prossimo modulo non `CLOSED` del loop diventa `Dossier Rifornimenti`.
