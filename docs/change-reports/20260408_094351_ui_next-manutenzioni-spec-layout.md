# Change Report

- Timestamp: `2026-04-08 09:43:51`
- Task: redesign UI `Manutenzioni NEXT` allineato a `docs/product/SPEC_MANUTENZIONI_UI_NEXT.md`
- Perimetro rispettato:
  - `src/next/next-manutenzioni.css`
  - `src/next/NextManutenzioniPage.tsx`
  - `src/next/NextMappaStoricoPage.tsx`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `CONTEXT_CLAUDE.md`

## Modifiche applicate

- Creato `src/next/next-manutenzioni.css` con classi `man2-*` dalla sezione 10 della spec.
- Riallineato `src/next/NextManutenzioniPage.tsx` alla struttura:
  - `man2-page`
  - `man2-head`
  - `man2-context-bar`
  - `man2-tabs`
  - `Dashboard / Nuova / Modifica / Dettaglio / Quadro PDF`
- Ridisegnata la dashboard con KPI strip, navigazione veloce e lista ultimi interventi.
- Ridisegnato il form su colonna singola mantenendo logica dati, materiali, foto e tagliando.
- Ridisegnato il tab PDF con pannello impostazioni + lista risultati esportabili.
- Aggiunto il ramo `embedded` a `NextMappaStoricoPage.tsx` con layout single-column:
  - `man2-det-head`
  - `man2-viste-tabs`
  - area foto/hotspot full-width
  - `man2-storico-list`
- Aggiornati `docs/STATO_ATTUALE_PROGETTO.md` e `CONTEXT_CLAUDE.md`.

## Non modificato

- Domain `nextManutenzioniDomain.ts`
- Domain `nextMappaStoricoDomain.ts`
- Reader / writer business
- Shape Firestore
- `pdfEngine`
- Logica upload foto / hotspot
- `src/pages/Manutenzioni.css`
