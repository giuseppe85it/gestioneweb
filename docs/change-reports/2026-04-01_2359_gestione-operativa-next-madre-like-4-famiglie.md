# Change Report - 2026-04-01 23:59

## Oggetto
Riallineamento estetico madre-like della `Gestione Operativa` NEXT, mantenendo la nuova architettura a 4 famiglie.

## File toccati
- `src/next/NextGestioneOperativaPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-04-01_2359_gestione-operativa-next-madre-like-4-famiglie.md`
- `docs/continuity-reports/2026-04-01_2359_continuity_gestione-operativa-next-madre-like-4-famiglie.md`

## Cosa cambia
- la pagina NEXT abbandona i pannelli inline troppo custom e riprende la grammatica visiva della madre:
  - header compatto con badge;
  - blocco centrale a card grandi;
  - sezione finale sintetica;
- le famiglie restano solo quattro:
  - `Magazzino e materiali`
  - `Acquisti e ordini`
  - `Manutenzioni`
  - `Lavori`
- procurement resta coerente con l'audit:
  - CTA principale solo su `/next/materiali-da-ordinare`;
  - nessun link top-level a `/next/acquisti`, `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine`.

## Impatto
- solo layout/UI della pagina `Gestione Operativa` NEXT;
- nessuna modifica a route, dati, writer o logica business;
- madre intoccata.
