# Continuity Report - 2026-04-09 16:20:49

## Task
Correzione del `Quadro manutenzioni PDF` in `/next/manutenzioni` affinche il filtro `Compressore` usi `ore` invece di `km`.

## Stato prima
- il pannello risultati del quadro mostrava ancora una metrica fissa `Km`;
- il filtro `Compressore` rischiava quindi di esporre label/valori incoerenti;
- l'export PDF locale non distingueva in modo esplicito l'intestazione misura per soggetto.

## Stato dopo
- `Compressore` usa `Ore attuali`, `Ore intervento`, `Δ ore` se disponibili;
- `Mezzo` continua a usare `km`;
- `Attrezzature` non forza una misura di default e mostra solo quella realmente presente;
- l'export PDF locale allinea la colonna misura a `Km`, `Ore` o `Misura` in base al filtro attivo.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
- `npm run build` -> `OK`

## Rischi residui
- il modulo `Manutenzioni` resta `PARZIALE`;
- la parity completa del `Quadro manutenzioni PDF` con la madre non e dimostrata da questo task;
- il ramo `Attrezzature` resta volutamente prudente: se il record non contiene misura affidabile, il quadro non inventa `km/ore`.
