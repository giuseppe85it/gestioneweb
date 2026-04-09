# Change Report - 2026-04-09 16:20:49

## Contesto
- Prompt: `PROMPT35`
- Modulo: `Manutenzioni NEXT`
- Ambito: correzione logica/rendering del `Quadro manutenzioni PDF` per il ramo `Compressore`
- Rischio: `ELEVATO`

## Obiettivo
Correggere il quadro PDF di `/next/manutenzioni` in modo che il filtro `Compressore` usi `ore` invece di `km`, mantenendo intatti i rami `Mezzo` e `Attrezzature`.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- individuato il ramo reale del quadro che mostrava ancora una card metrica hardcoded `Km` anche con filtro `Compressore`;
- introdotto un helper locale che costruisce label/valori metrici in base al soggetto:
  - `Mezzo` -> `Km attuali`, `Km intervento`, `Δ km`
  - `Compressore` -> `Ore attuali`, `Ore intervento`, `Δ ore`
  - `Attrezzature` -> nessuna metrica forzata, solo misura realmente presente
- reso coerente anche l'export PDF locale con intestazione colonna misura filtro-dipendente (`Km`, `Ore`, `Misura`);
- lasciati invariati writer, shape dati e perimetro cross-modulo.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
- `npm run build` -> `OK`

## Esito
- `PATCH COMPLETATA`
- ramo `Compressore` coerente a `ore`
- ramo `Mezzo` invariato su `km`
- ramo `Attrezzature` mantenuto senza default forzato
