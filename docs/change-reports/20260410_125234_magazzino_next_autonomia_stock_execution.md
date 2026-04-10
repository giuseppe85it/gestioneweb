# Change Report - 2026-04-10 12:52:34

## Titolo
Magazzino NEXT - autonomia stock lato NEXT

## Tipo intervento
- Runtime NEXT
- Dominio stock e procurement di supporto
- Documentazione di stato

## Obiettivo
Portare il dominio `Magazzino` in modalita `AUTONOMIA NEXT` nel solo perimetro autorizzato, facendo di `/next/magazzino` il writer stock canonico lato NEXT senza riaprire la madre e senza introdurre un nuovo ledger costi.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/nextData.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- `NextMagazzinoPage.tsx` assorbe ora anche il carico stock degli arrivi procurement:
  - le righe arrivate di `@ordini` entrano come candidati `Carichi stock da arrivi procurement`;
  - il consolidamento usa `nextMagazzinoStockContract.ts`, `stockKey`, `stockLoadKeys` e deduplica prudente contro documenti materiali gia caricati;
  - il carico puo consolidare una voce inventario esistente o crearne una nuova senza delegare la scrittura stock al procurement legacy.
- Il procurement NEXT resta supporto/read-only:
  - `nextProcurementDomain.ts` esplicita che ordini/arrivi restano lettura di supporto e che il consolidamento stock degli arrivi passa da `/next/magazzino?tab=documenti-costi`;
  - `NextProcurementReadOnlyPanel.tsx` riallinea subtitle e header al fatto che il writer stock canonico e `Magazzino`.
- `nextData.ts` riallinea la shell:
  - `Magazzino` precede `Materiali da ordinare` nella sezione `MAGAZZINO`;
  - `Operativita Globale` non e piu descritta come `Importato read-only`, ma come `Operativo parziale`;
  - il copy area dichiara `Magazzino` come punto operativo stock canonico del perimetro NEXT.

## Vincoli rispettati
- Madre legacy invariata
- Nessun writer nuovo su costi/documenti/procurement
- Nessun widening del barrier oltre il perimetro gia autorizzato
- Nessuna auto-certificazione del dominio come `CHIUSO`

## Verifiche eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/domain/nextProcurementDomain.ts src/next/nextData.ts src/next/domain/nextMagazzinoStockContract.ts src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts` -> `OK`
- `npm run build` -> `OK`
- Preview locale verificata su:
  - `/next/magazzino`
  - `/next/magazzino?tab=documenti-costi`
  - `/next/magazzino?tab=cisterne-adblue`
  - `/next/inventario`
  - `/next/materiali-consegnati`
  - `/next/materiali-da-ordinare?tab=arrivi`
- Verificati live:
  - pannello `Carichi stock da arrivi procurement`
  - richiamo operativo su arrivi procurement verso `/next/magazzino?tab=documenti-costi`
  - sole UDM `pz`, `lt`, `kg`, `mt`
  - redirect canonici e form AdBlue con `Litri scaricati` / `Articolo AdBlue inventario`
- Nota: nessun submit browser mutante e stato eseguito, per non alterare dataset Firebase reali.

## Esito
- Lato NEXT il dominio stock e ora governato operativamente da `/next/magazzino`.
- Il procurement resta supporto leggibile e non writer canonico del magazzino.
- Il dominio `Magazzino NEXT` resta `PARZIALE` e richiede audit separato di rivalidazione.
