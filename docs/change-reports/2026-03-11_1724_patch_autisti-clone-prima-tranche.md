# CHANGE REPORT - Prima tranche clone-safe app autisti

## Data
- 2026-03-11 17:24

## Tipo task
- patch

## Obiettivo
- Aprire la prima tranche reale dell'app autisti nel clone su `/next/autisti/*`, mantenendo la madre intatta, senza toccare `src/autisti/**` e senza falsa UX di scrittura riuscita.

## File modificati
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/next-autisti-clone.css`
- `src/next/NextAutistiGatePage.tsx`
- `src/next/NextAutistiLoginPage.tsx`
- `src/next/NextAutistiSetupMezzoPage.tsx`
- `src/next/NextAutistiHomePage.tsx`
- `src/next/NextRoleLandingRedirect.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunte le route clone `/next/autisti`, `/next/autisti/login`, `/next/autisti/setup-mezzo` e `/next/autisti/home` con layout dedicato fuori dalla `NextShell`.
- Creati wrapper clone sottili che riusano `AutistiGate`, `LoginAutista`, `SetupMezzo` e `HomeAutista` senza modificare `src/autisti/**`.
- Introdotto un micro-runtime clone-only che namespacizza i key locali autisti e riscrive i path legacy `/autisti/*` sul subtree `/next/autisti/*`.
- Bloccate con feedback sobrio le azioni fuori tranche (`Controllo`, `Rifornimento`, `Segnalazioni`, `Richiesta attrezzature`, `Cambio mezzo`, `Gomme`, `Sgancia motrice`).
- Riallineati metadata/access NEXT e i registri permanenti del clone.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- L'app autisti ha ora una prima tranche clone realmente navigabile senza uscire verso `/autisti/*`.
- La sessione clone resta locale e namespaced, quindi non sporca i key browser della madre.
- Le letture restano sui dataset reali, ma il clone non finge sincronizzazioni riuscite sulla madre.

## Rischio modifica
- ELEVATO

## Moduli impattati
- App autisti clone NEXT
- Routing applicativo
- Metadata/access NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Stream eventi autisti canonico definitivo

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro: app autisti clone

## Stato migrazione prima
- NON INIZIATO

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- La tranche resta volutamente incompleta: `Controllo`, `Rifornimento`, `Segnalazioni`, `Richiesta attrezzature`, `Cambio mezzo`, `Gomme` e moduli admin/360 restano fuori.
- Il dominio `D03` resta bloccante per importazione piena; questa patch apre solo clone UX/runtime controllato.

## Build/Test eseguiti
- `npm run build` - OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
