# Change Report - 2026-04-06 12:15

## Titolo
`Lavori` NEXT con UI unificata e deroga chirurgica alla clone write barrier

## Obiettivo
Portare il modulo `Lavori` della NEXT a una dashboard UI unificata, mantenendo la logica reale di aggiunta, modifica, esecuzione ed eliminazione e aprendo solo il minimo write-path necessario su `@lavori`.

## File toccati
- `src/utils/cloneWriteBarrier.ts`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/next-lavori.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- introdotta eccezione stretta in `cloneWriteBarrier.ts` che consente solo `storageSync.setItemSync("@lavori")` sui pathname Lavori/dettaglio NEXT;
- sostituita la UI clone-safe precedente con una dashboard unificata a tab `In attesa` / `Eseguiti` / `Aggiungi`;
- riportata la logica reale di lettura/scrittura del modulo Lavori su `@lavori` e `@mezzi_aziendali` tramite `storageSync`;
- creato un dettaglio lavoro reale condiviso, usabile sia come modale nella dashboard sia come route diretta.

## Verifiche
- `eslint` sui file runtime toccati: `OK`
- `npm run build`: `OK`
- runtime locale:
  - aggiunta reale di un lavoro temporaneo: `OK`
  - modifica reale via dettaglio: `OK`
  - esecuzione reale via dettaglio: `OK`
  - eliminazione reale via dettaglio: `OK`
  - route diretta `/next/dettagliolavori/:lavoroId`: `OK`
  - tentativo di write su `@lavori` da `/next/autisti-inbox` ancora bloccato: `OK`

## Stato modulo
- `Lavori`: `PARZIALE`

## Limiti residui
- manca ancora audit separato post-redesign per promuovere il modulo oltre `PARZIALE`;
- la deroga barriera e limitata a `@lavori`, ma va mantenuta sotto audit per evitare future aperture indirette del clone.
