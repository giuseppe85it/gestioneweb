# Backlog moduli da classificare

## Moduli ambigui
- `Home / Dashboard` vs `Centro di Controllo`: due ingressi cockpit distinti nel runtime reale.
- `Mezzi` vs `Dossier lista`: parent e hub molto vicini come ingresso utente.
- `Acquisti / Procurement` vs `Materiali da ordinare`: parent e child con naming che puo sembrare duplicato.

## Moduli con naming confuso
- `Autisti Admin` esposto anche come `Centro rettifica dati`.
- `IA hub` con alias legacy `ia-gestionale`.
- `Dettaglio ordine` con doppio pattern route.
- `Dossier mezzo` con doppio pattern route.
- `Dettaglio lavoro` con route legacy query-style e route path-based NEXT.

## Moduli duplicati
- `Home / Dashboard` e `Centro di Controllo` come coppia cockpit.
- `Autisti Gate` e alias `/next/autista`.
- `Gestione Operativa` e alias `/next/operativita-globale`.
- `IA hub` e alias `/next/ia-gestionale`.
- `Mezzi / Dossier` e alias `/next/mezzi-dossier`.

## Moduli da verificare
- `src/next/NextAccessDeniedPage.tsx`: file presente ma non montato in `src/App.tsx`.
- `src/next/NextAreaPage.tsx`: file presente ma non montato in `src/App.tsx`.
- `src/next/NextDriverExperiencePage.tsx`: file presente ma non montato in `src/App.tsx`.
- `src/next/NextMezziDossierPage.tsx`: referenziata da IA interna, ma non route ufficiale.
- `src/next/NextOperativitaGlobalePage.tsx`: referenziata da IA interna, ma non route ufficiale.
- decisione finale di prodotto su `Home` vs `Centro di Controllo`.

## Moduli che sembrano supporto tecnico e non modulo utente
- `src/next/NextShell.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/NextRoleLandingRedirect.tsx`
- `src/next/NextLegacyStructuralRedirects.tsx`
- redirect inline `NextLegacyIaRedirect` in `src/App.tsx`
- alias inline `/next/autista` in `src/App.tsx`
- `src/next/NextMotherPage.tsx` come wrapper storico/tecnico non montato come route finale ufficiale
