# Change Report - 2026-04-08 12:34:24

## Obiettivo
Riallineare la UI della pagina NEXT `/next/manutenzioni` al mock approvato partendo dal runtime reale gia presente nel repo, senza rifare il modulo da zero.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- compattato l'header del modulo mantenendo `OPERATIVITA` e `Manutenzioni` ma con gerarchia meno pesante;
- rifinita la barra alta con select mezzo e ricerca per allineamento, altezze e spaziatura piu vicini al riferimento;
- alleggerita la strip riepilogo mezzo con 5 blocchi, divisori e gerarchia label/valore piu ordinati;
- resi piu compatti tab, KPI, pulsanti azione e lista `Ultimi interventi` della dashboard;
- armonizzati pannelli, titoli sezione e controlli di `Nuova / Modifica`, `Dettaglio` e `Quadro manutenzioni PDF` con la nuova pelle del modulo;
- accorciata la copy descrittiva della dashboard e rimossi i due heading ridondanti sopra KPI e azioni.

## Non toccato
- logica dati;
- reader/writer;
- domain NEXT;
- routing;
- shape Firestore;
- `pdfEngine`;
- upload foto e hotspot business;
- `src/pages/Manutenzioni.css`.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`

## Esito
Patch UI/CSS completata sul runtime reale esistente. Modulo ancora da considerare `PARZIALE` a livello di stato progetto, perche questo task e di affinamento visivo e non di audit strutturale finale.
