# CHANGE REPORT - Visibilita e accesso ruoli nella shell NEXT

## Data
- 2026-03-08 10:21

## Tipo task
- ui

## Obiettivo
- Predisporre nella shell NEXT una struttura solida di visibilita e accesso per ruolo, senza introdurre auth reale, scritture dati o impatti sulla legacy.

## File modificati
- `src/App.tsx`
- `src/next/NextShell.tsx`
- `src/next/NextAreaPage.tsx`
- `src/next/nextData.ts`
- `src/next/next-shell.css`
- `src/next/nextAccess.ts`
- `src/next/NextRoleGuard.tsx`
- `src/next/NextAccessDeniedPage.tsx`
- `src/next/NextDriverExperiencePage.tsx`
- `src/next/NextRoleLandingRedirect.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Riassunto modifiche
- Introdotta una configurazione centralizzata di ruoli e visibilita per la shell NEXT.
- Aggiunti menu dinamico per ruolo, guardie leggere sulle route `/next/*` e schermata di accesso non consentito.
- Resa esplicita una vista tecnica separata per il ruolo autista, senza confonderlo con un semplice utente gestionale ridotto.
- Aggiornato il tracker NEXT per registrare la nuova predisposizione frontend di visibilita/accesso.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La NEXT puo essere provata in piu viste ruolo simulate senza cambiare auth reale o backend.
- La shell e pronta per una futura matrice permessi per singola utenza, ma resta solo frontend e read-only.

## Rischio modifica
- NORMALE

## Moduli impattati
- Routing frontend NEXT
- Shell NEXT
- Documentazione stato progetto / migrazione NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: `Matrice ruoli/permessi definitiva`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- shell globale
- sistema

## Stato migrazione prima
- SHELL CREATA

## Stato migrazione dopo
- SHELL CREATA

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il gating introdotto e solo frontend e non va scambiato per sicurezza reale.
- Il worktree contiene modifiche pregresse non legate a questo task su documenti `flow-master` e altri file gia sporchi.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
