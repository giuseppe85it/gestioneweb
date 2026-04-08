# Change Report - 2026-04-08 10:19:00

## Task
PROMPT 15 - riallineamento UI di `/next/manutenzioni` al mockup React fornito dall'utente.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- rimossa la dipendenza runtime da `next-manutenzioni.css` nella pagina e spostata la shell UI su `next-mappa-storico.css`;
- rifatta la shell di `NextManutenzioniPage` con header compatto scuro, context bar chiara, tab a pillola e superfici dashboard/form/pdf coerenti col mockup;
- riallineata la dashboard con card rapide, bottoni rapidi e lista ultimi interventi in card chiare;
- riallineato il tab `Nuova / Modifica` con pannello form grande, blocco tagliando condizionale, materiali e foto mantenendo la logica esistente;
- rifatto il tab `Quadro manutenzioni PDF` con header dedicato, bottone `PDF quadro generale`, step filtro e righe larghe con foto, metadati, bottone `PDF` e `Apri dettaglio`;
- rifatto il ramo `embedded` di `NextMappaStoricoPage` come layout a 2 card: sinistra per viste/hotspot/KPI, destra per riepilogo mezzo, ultime manutenzioni e azioni rapide;
- aggiornato il contesto documentale sintetico.

## Non toccato
- domain reader/writer
- shape Firestore
- `src/utils/cloneWriteBarrier.ts`
- `src/pages/Manutenzioni.css`
- `pdfEngine`
- logica upload foto / hotspot / business
