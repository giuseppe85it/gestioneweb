# CHANGE REPORT - Loop `Colleghi` + `Fornitori`

- Timestamp: `2026-03-31 13:17 Europe/Rome`
- Obiettivo: chiudere i moduli `Colleghi` e `Fornitori` come clone fedele read-only della madre.
- File runtime toccati:
  - `src/next/NextColleghiPage.tsx`
  - `src/next/domain/nextColleghiDomain.ts`
  - `src/next/NextFornitoriPage.tsx`
- Effetto applicato:
  - route ufficiali riallineate alla grammatica madre;
  - lettura dati reali senza overlay locali del clone;
  - add/edit/delete bloccati in modo esplicito;
  - PDF mantenuto equivalente alla madre.
