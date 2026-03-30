# Change Report - 2026-03-29 1825 - Prompt 37 Home e Capo NEXT

## Obiettivo
Applicare il metodo di ricostruzione reale anche oltre `Centro di Controllo`, eliminando il runtime madre dalla `Home` ufficiale del clone e riallineando `Capo` alla parity operativa sopra layer NEXT puliti.

## File toccati
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/nextHomeCloneState.ts`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/nextCapoCloneState.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/REPORT_FINALE_PROMPT_37_RICOSTRUZIONE_NEXT_COMPLETA.md`
- `docs/change-reports/2026-03-29_1825_prompt37_home-capo-next.md`
- `docs/continuity-reports/2026-03-29_1825_continuity_prompt37_home-capo-next.md`

## Sintesi tecnica
- `Home` non monta piu `src/pages/Home.tsx`: la route `/next` usa una pagina NEXT vera che replica UI, alert, modali e PDF della madre.
- `nextHomeCloneState.ts` conserva nel clone gli ack alert e le mutazioni locali di prenotazioni/luoghi mezzo; `nextCentroControlloDomain.ts` le rilegge e le riapplica nel read model.
- `Capo` resta interamente su pagine NEXT ma recupera le funzioni mancanti della madre: approvazioni, PDF preventivi, anteprime documento e preview timbrata.
- `nextCapoCloneState.ts` conserva nel clone gli stati approvazione e `nextCapoDomain.ts` li sovrappone al dataset legacy solo lato clone.

## Verifiche
- `npx eslint src/next/NextHomePage.tsx src/next/NextCentroControlloPage.tsx src/next/domain/nextCentroControlloDomain.ts src/next/nextHomeCloneState.ts src/next/NextCapoMezziPage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/domain/nextCapoDomain.ts src/next/nextCapoCloneState.ts` -> OK
- `npm run build` -> OK

## Impatto
- Chiude davvero `Home`.
- Chiude davvero `Capo`.
- Non tocca la madre.
- Non riapre scritture business reali.

## Rischi residui
- Restano aperti i moduli che continuano a montare `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**`.
- `Acquisti / Preventivi / Listino`, `Dossier Mezzo`, `Analisi Economica`, `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Cisterna`, `Autisti / Inbox` richiedono ancora una ricostruzione completa e non solo overlay locali.
