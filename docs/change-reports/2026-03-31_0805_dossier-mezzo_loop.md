# Change Report - Loop `Dossier Mezzo` (`2026-03-31 08:05`)

## Obiettivo
Chiudere il modulo `Dossier Mezzo` della NEXT sulla route `/next/dossier/:targa` come clone fedele read-only della madre.

## File letti
- `src/App.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/pages/DossierMezzo.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_dossier-mezzo.md`
- `docs/audit/AUDIT_dossier-mezzo_LOOP.md`

## Patch applicate
- Rimossa da `NextDossierMezzoPage` la dipendenza dal clone state che nascondeva localmente i documenti del dossier.
- Il bottone `Elimina` dei preventivi non simula piu una cancellazione locale: ora blocca l'azione con messaggio read-only esplicito.
- Lasciata invariata la superficie madre di documenti, modali e anteprima PDF, sopra il composite dossier NEXT.

## Verifiche eseguite
- `npx eslint src/next/NextDossierListaPage.tsx src/next/NextDossierMezzoPage.tsx` -> OK
- `npm run build` -> OK

## Esito operativo
- Il modulo `Dossier Mezzo` passa da `NOT_STARTED` a `CLOSED` nel tracker.
- L'audit separato del modulo risulta `PASS`.
- Il prossimo modulo non `CLOSED` del loop diventa `Dossier Gomme`.
