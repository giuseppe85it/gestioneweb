# Change Report - 2026-04-03 14:12

## Obiettivo
Riallineare nel clone NEXT il calcolo dello stato import dei preventivi alla logica reale della madre `Acquisti`, senza toccare writer, route o runtime madre.

## File toccati
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/NextProcurementConvergedSection.tsx`

## Modifiche
- il read model procurement espone ora le righe complete del preventivo e il `fontePreventivoId` delle voci listino;
- il tab `Prezzi & Preventivi` usa un'analisi riga-per-riga clone-safe che replica il criterio madre su codice articolo, descrizione normalizzata, UDM, valuta e riuso dei match compatibili gia consumati;
- rimosso il conteggio povero che derivava lo stato import solo da `sourceMatches`, `previewMatches` e `materialsPreview`.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextProcurementConvergedSection.tsx src/next/domain/nextProcurementDomain.ts` -> `OK`
- `npm run build` -> `OK`
- verifica runtime locale browser headless:
  - `/acquisti?tab=preventivi` -> `MARIBA / XC/STD/2600119 = IMPORTATO COMPLETO 5/5`, `MARIBA / 534909 = IMPORTATO COMPLETO 7/7`
  - `/next/materiali-da-ordinare?tab=preventivi` -> `MARIBA / XC/STD/2600119 = IMPORTATO COMPLETO 5/5`, `MARIBA / 534909 = IMPORTATO COMPLETO 7/7`
