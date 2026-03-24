# Change Report - 2026-03-24 16:03

## Titolo
Rifinitura UI console IA e gerarchia report/PDF

## Obiettivo
Ridurre ancora il rumore visivo della pagina `/next/ia/interna` e rendere piu leggibili il report professionale e il PDF, senza toccare il motore unificato.

## File toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx`
- `src/utils/pdfEngine.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_1603_rifinitura-ui-report-pdf-ia-next.md`
- `docs/continuity-reports/2026-03-24_1603_continuity_rifinitura-ui-report-pdf-ia-next.md`

## Cosa e stato fatto
- Ridotta la testata superiore della pagina IA a una forma minima.
- Spostato `Richieste rapide` dentro il composer, insieme a `Targa` e `Output`.
- Rifatti i filtri rapidi con stato neutro da spenti e highlight chiaro da attivi.
- Nascosti dal primo piano il blocco avanzato e le note tecniche secondarie.
- Migliorata la card iniziale del report professionale: identita mezzo a sinistra, foto a destra.
- Resa piu netta la separazione visiva tra le sezioni del report.
- Allineato il PDF alla stessa gerarchia: blocco mezzo prima della sintesi e titoli sezione piu leggibili.

## Cosa non e stato fatto
- Nessun refactor del motore unificato.
- Nessuna modifica ai reader o ai backend.
- Nessuna scrittura business.
- Nessuna modifica alla madre.

## Verifiche
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/InternalAiProfessionalVehicleReportView.tsx` -> OK
- `npx eslint src/utils/pdfEngine.ts` -> NON OK per debito lint storico preesistente nel file condiviso
- `npm run build` -> OK

## Limiti residui
- `src/utils/pdfEngine.ts` continua a portarsi dietro errori lint storici non introdotti da questo task.
- I blocchi avanzati della pagina non sono stati rimossi strutturalmente dal file: sono solo esclusi dal primo piano.
