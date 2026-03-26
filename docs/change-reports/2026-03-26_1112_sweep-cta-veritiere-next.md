# Change Report - 2026-03-26 11:12

## Titolo
Sweep CTA veritiere del clone NEXT

## Obiettivo
Chiudere il work-package CTA senza rifarlo da zero: rendere veritiere CTA, bottoni, azioni e punti di ingresso gia presenti nel clone NEXT, lasciando attiva solo la consultazione reale e marcando in modo esplicito cio che e `read-only`, `preview`, `locale clone` o `bloccato`.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextOperativitaGlobalePage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/autisti/next-autisti-clone.css`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/pages/Acquisti.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cosa cambia davvero
- `Gestione Operativa`, `Acquisti`, `Capo Costi`, area autisti e `IA interna` smettono di sembrare business-live quando in realta sono superfici clone-safe di consultazione.
- Il file extra `src/next/NextCentroControlloClonePage.tsx` chiude il gap vero del task: la route runtime `/next/centro-controllo` monta ancora il wrapper clone sulla pagina legacy `CentroControllo`, quindi il lavoro sulle CTA doveva arrivare li.
- Il Centro di Controllo clone-safe espone ora un banner di perimetro, un sottotitolo piu onesto e CTA di refresh/PDF/tab che non promettono piu operativita o workflow madre.

## Impatto
- UI: segnali piu chiari e coerenti con lo stato reale del clone.
- Runtime clone: nessuna logica business riaperta, nessuna scrittura nuova.
- Processo: il Prompt 19 viene chiuso davvero senza allargarsi oltre lo sweep CTA.

## Verifiche
- `npx eslint src/next/NextCentroControlloClonePage.tsx src/next/NextCentroControlloPage.tsx src/next/NextGestioneOperativaPage.tsx src/next/NextOperativitaGlobalePage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/NextInternalAiPage.tsx src/pages/Acquisti.tsx` -> OK
- `npm run build` -> OK
- ricognizione runtime Playwright su `/next/centro-controllo` -> OK come censimento della superficie reale da correggere

## Rischi residui
- Il Centro di Controllo NEXT continua a poggiare sulla pagina legacy wrappata: lo sweep CTA lo rende onesto, ma non sostituisce una futura migrazione completa della superficie.
- Alcune CTA utili restano volutamente attive per consultazione o preview: il task non le blocca, le chiarisce.
