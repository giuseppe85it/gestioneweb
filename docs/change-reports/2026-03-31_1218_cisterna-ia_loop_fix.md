# Change Report - `Cisterna IA` loop fix

- Timestamp: `2026-03-31 12:18 Europe/Rome`
- Modulo: `Cisterna IA`
- Route: `/next/cisterna/ia`
- Obiettivo: chiudere `Cisterna IA` come clone fedele read-only della madre senza toccare la madre.

## File toccati
- `src/next/NextCisternaIAPage.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_cisterna-ia.md`
- `docs/audit/AUDIT_cisterna-ia_LOOP.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cosa e stato fatto
- rimosso il runtime clone-specifico con scaffold, banner handoff visibile, upload Storage, analisi IA reale e salvataggi clone-only;
- riallineata la superficie pratica alla madre su header, note, upload, preview, pulsanti, risultato estrazione e campi del form;
- mantenute visibili le CTA scriventi, ma bloccate in read-only esplicito;
- chiuso il modulo nel tracker dopo audit separato `PASS`.

## Verifiche
- `npx eslint src/next/NextCisternaIAPage.tsx`
- `npm run build`

## Esito
- `Cisterna IA` chiuso nel loop corrente.
