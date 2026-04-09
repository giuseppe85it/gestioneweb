# Change Report - 2026-04-08 21:48

## Perimetro
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- documentazione di stato clone/NEXT

## Obiettivo
- Mostrare nel `Dettaglio` di `Manutenzioni` NEXT il delta km dall'ultimo cambio gomme usando il km attuale da ultimo rifornimento valido.
- Rendere `Calibra` autoesplicativo via tooltip/focus senza aggiungere testo fisso nel layout.

## Modifiche applicate
- `NextManutenzioniPage.tsx`
  - Esteso il payload `selectedMaintenance` passato al viewer con:
    - `km`
    - `tipo`
- `NextMappaStoricoPage.tsx`
  - Aggiunta logica locale per riconoscere una manutenzione gomme coerente.
  - Calcolo del delta `km ultimo rifornimento - km cambio` solo se:
    - record aperto coerente con manutenzione gomme;
    - `km` del record presente;
    - `kmAttuali` da parent presenti;
    - delta non negativo.
  - Render compatto di `Km dal cambio gomme` nel pannello info laterale.
  - Rimozione della copy fissa di spiegazione per `Calibra`.
  - Aggiunta di `title` e `aria-label` dinamici al bottone `Calibra` / `Gestisci hotspot`.

## Sorgente km corrente verificata
- Reader canonico: `readNextRifornimentiReadOnlySnapshot()`
- Uso reale nel modulo: `readPageData()` in `src/next/NextManutenzioniPage.tsx`
- Derivazione locale: `kmUltimoByTarga` -> `kmUltimoRifornimento` -> `mezzoInfo.kmAttuali`

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> OK
- `npm run build` -> OK

## Rischi residui
- Il delta km compare solo sui record gomme coerenti secondo i dati oggi presenti nel clone.
- Se il record non ha `km` o il mezzo non ha un ultimo rifornimento valido, il blocco resta assente per scelta conservativa.
