# Continuity Report - 2026-04-02 07:00

## Contesto
Prompt 21 richiede di usare la madre come fonte di verita assoluta per il procurement e di convergere la NEXT su `Materiali da ordinare` senza rompere i runtime secondari ancora vivi.

## Stato iniziale
- `/next/materiali-da-ordinare` era funzionante ma ancora appoggiato a una shell clone-specifica con override inline.
- Gli audit procurement confermavano che:
  - nella madre `Materiali da ordinare` non assorbe `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine`;
  - nella NEXT i moduli secondari hanno ancora consumer runtime reali e quindi non sono rimovibili in sicurezza in questo perimetro.

## Decisione esecutiva
- Convergenza solo su `src/next/NextMaterialiDaOrdinarePage.tsx`.
- Pagina riportata alla struttura standalone madre quasi 1:1.
- Nessuna rimozione di route o codice procurement secondario.

## Stato finale
- `Materiali da ordinare` resta l'unico procurement top-level visibile.
- La UI della pagina e di nuovo madre-like su struttura, blocchi e comportamento pratico.
- `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine` restano non top-level ma ancora vivi come runtime secondari.

## Verifiche eseguite
- Build completa `npm run build` superata.

## Se si riprende il lavoro
- Una vera convergenza che assorba o elimini codice procurement secondario richiede almeno anche questi file:
  - `src/next/NextProcurementStandalonePage.tsx`
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/next/nextCloneNavigation.ts`
  - `src/next/nextStructuralPaths.ts`
  - `src/next/internal-ai/internalAiUniversalContracts.ts`
  - `src/App.tsx`
- Senza quel perimetro, il massimo risultato sicuro resta la parity della pagina top-level `Materiali da ordinare`.
