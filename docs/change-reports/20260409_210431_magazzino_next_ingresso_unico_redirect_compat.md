# Change Report - 2026-04-09 21:04:31

## Titolo
Magazzino NEXT come ingresso unico pubblico con redirect di compatibilita

## Tipo intervento
- Wiring runtime NEXT
- Routing e navigazione
- Nessuna modifica a business logic, writer o barrier

## Obiettivo
Promuovere `/next/magazzino` come unico ingresso pubblico principale del dominio `Magazzino` nella NEXT, mantenendo attivi i vecchi path `/next/inventario` e `/next/materiali-consegnati` solo come redirect di compatibilita verso il modulo unificato.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/nextData.ts`
- `src/next/NextHomePage.tsx`
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- Aggiunto il path strutturale canonico `/next/magazzino` in `nextStructuralPaths.ts`, con helper per costruire `?tab=inventario|materiali-consegnati|cisterne-adblue`.
- `NextMagazzinoPage.tsx` ora legge `?tab=` e usa l'URL come sorgente di verita per la sezione attiva del modulo.
- `nextData.ts` espone nella sidebar un solo ingresso pubblico `Magazzino`; le voci pubbliche separate `Inventario` e `Mat. consegnati` non restano piu visibili come ingressi principali.
- `NextHomePage.tsx` aggiorna la CTA del widget `Magazzino` da `/next/inventario` a `/next/magazzino`.
- `App.tsx` mantiene i vecchi path attivi solo come redirect `replace`:
  - `/next/inventario` -> `/next/magazzino?tab=inventario`
  - `/next/materiali-consegnati` -> `/next/magazzino?tab=materiali-consegnati`

## Vincoli rispettati
- Nessuna modifica a `NextInventarioPage.tsx`
- Nessuna modifica a `NextMaterialiConsegnatiPage.tsx`
- Nessuna modifica a `cloneWriteBarrier.ts`
- Nessuna modifica a dataset, writer o domain del modulo
- Nessuna cancellazione file

## Verifiche
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/nextData.ts src/next/NextHomePage.tsx src/App.tsx src/next/nextStructuralPaths.ts` -> `OK`
- `npm run build` -> `OK`
- Runtime verificato su preview locale:
  - `/next`
  - `/next/magazzino`
  - `/next/inventario`
  - `/next/materiali-consegnati`

## Esito
- `Magazzino` e ora il punto di ingresso unico pubblico della NEXT per questo dominio.
- I vecchi path restano vivi solo come compatibilita temporanea.
