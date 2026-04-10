# Change Report - 2026-04-10 16:45:00

## Titolo
Magazzino NEXT - contratto stock condiviso

## Tipo intervento
- Runtime NEXT
- Dominio dati e matching stock
- Documentazione di stato

## Obiettivo
Rendere coerente e controllato il comportamento di `@inventario` nel perimetro NEXT, senza rifare `Magazzino` da zero, senza toccare la madre e senza introdurre un nuovo ledger costi, allineando i writer principali su carichi, scarichi, unita di misura, deduplica documenti/arrivi e AdBlue come materiale di inventario.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/next-magazzino.css`
- `src/next/domain/nextMagazzinoStockContract.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- Creato `nextMagazzinoStockContract.ts` come helper comune del dominio stock NEXT:
  - UDM canoniche `pz`, `lt`, `kg`, `mt`
  - canonicalizzazione `m -> mt`
  - identita materiale pragmatica su `descrizione + fornitore + unita`
  - `stockKey`, `stockLoadKeys`, compatibilita unita e riconoscimento prudente AdBlue
- `NextMagazzinoPage.tsx` ora:
  - consolida i carichi manuali sull'articolo inventario gia esistente quando la chiave materiale coincide;
  - blocca aggiornamenti automatici se l'unita del movimento non coincide con quella del materiale;
  - non elimina piu le righe a quantita zero, per mantenere tracciabilita e deduplica;
  - scrive `stockKey` su consegne materiali e su eventi AdBlue;
  - registra i cambi cisterna con `quantitaLitri`, `inventarioRefId`, `stockKey` e scarico reale di `@inventario`;
  - espone nella vista `Documenti e costi` il pannello `Carichi stock da documenti`, con carico controllato, unita esplicita, deduplica su arrivi procurement gia coperti e blocco delle righe gia consolidate via `stockLoadKeys`.
- `nextManutenzioniDomain.ts` allinea i materiali manutenzione allo stesso contratto:
  - mismatch unita esplicito;
  - stock insufficiente esplicito;
  - rollback reale se fallisce la persistenza dei side effect su `@inventario` / `@materialiconsegnati`.
- `nextMaterialiMovimentiDomain.ts` canonicalizza le unita legacy ed espone `stockKey` per mantenere compatibilita con dossier e lettori materiali.

## Vincoli rispettati
- Madre legacy non toccata
- Nessun widening del barrier oltre il perimetro gia autorizzato per `Magazzino` e `Manutenzioni`
- Nessun writer nuovo su costi/documenti/procurement
- Nessuna auto-certificazione del dominio come `CHIUSO`

## Verifiche eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts src/next/domain/nextMagazzinoStockContract.ts` -> `OK`
- `npm run build` -> `OK`
- Preview locale verificata su:
  - `/next/magazzino`
  - `/next/magazzino?tab=documenti-costi`
  - `/next/magazzino?tab=cisterne-adblue`
  - `/next/inventario`
  - `/next/materiali-consegnati`
- Verificati live:
  - selettore UDM con sole opzioni `pz`, `lt`, `kg`, `mt`
  - presenza del pannello `Carichi stock da documenti`
  - presenza dei campi `Litri scaricati` e `Articolo AdBlue inventario`
  - redirect canonici verso `/next/magazzino?tab=...`
- Nota: non sono stati eseguiti submit browser mutanti, perche il runtime usa dataset Firebase reali e i form avrebbero prodotto scritture business effettive.

## Esito
- Patch runtime completata nel perimetro autorizzato.
- Il lato NEXT del dominio stock ha ora un contratto condiviso piu esplicito e sicuro.
- Il dominio `Magazzino NEXT` resta `PARZIALE`: il repo-wide stock e ancora multi-writer e richiede audit separato aggiornato.
