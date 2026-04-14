# CONTINUITY REPORT - 2026-04-13 16:46:26

## Contesto
Il tab `/next/magazzino?tab=documenti-costi` stava mostrando anche record `costo_mezzo` del layer globale `documenti/costi`, facendo sconfinare la vista oltre il dominio Magazzino.

## Decisione applicata
- nessun cambio ai reader/domain
- nessun cambio a `/next/ia/documenti`
- filtro UI/runtime ristretto ai soli record con `sourceKey = "@documenti_magazzino"` e `sourceType = "documento_magazzino"` nella sezione `Costi materiali e prezzi`
- procurement materiali lasciato visibile come supporto read-only coerente col dominio Magazzino

## Perche e sicuro
- usa campi reali gia esposti dal domain read-only
- non inventa euristiche su testo, targa o fornitore
- non apre scritture nuove
- non tocca writer, backend o `cloneWriteBarrier.ts`

## Come riprendere il lavoro
1. Aprire `src/next/NextMagazzinoPage.tsx`.
2. Cercare `materialiCostItems`.
3. Il criterio attivo corretto e:
   - `item.sourceKey === "@documenti_magazzino"`
   - `item.sourceType === "documento_magazzino"`
4. Verificare in browser:
   - `/next/magazzino?tab=documenti-costi`
   - `/next/ia/documenti`

## Stato finale
- patch runtime: completata
- perimetro Magazzino: corretto sul visibile
- archivio globale IA: invariato
