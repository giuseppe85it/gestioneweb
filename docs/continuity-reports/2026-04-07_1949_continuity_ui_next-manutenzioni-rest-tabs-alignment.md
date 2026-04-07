# Continuity Report - 2026-04-07 19:49

## Stato iniziale
- La `Mappa storico` era gia stata riallineata, ma gli altri tab di `/next/manutenzioni` mantenevano ancora una resa troppo vicina al layout legacy beige/generico.
- In particolare mancavano:
  - una dashboard realmente mezzo/compressore-centrica;
  - uno storico con gerarchia visiva piu chiara;
  - un form piu tecnico su tagliando, materiali e 4 viste foto;
  - un vero tab `Quadro manutenzioni PDF` con doppio filtro e lista risultati.

## Stato finale
- I tab `Dashboard`, `Storico`, `Nuova / Modifica` e `Quadro manutenzioni PDF` condividono ora una shell tecnica `.mx-*` coerente con la `Mappa storico`.
- La pagina espone anche una `Ricerca mezzo rapida` con preview reale di targa, modello e autista solito.
- Il `Quadro manutenzioni PDF` resta una vista interna del modulo, senza route nuove e senza modifiche al motore PDF.

## Vincoli preservati
- nessuna modifica a domain business o writer;
- nessuna modifica a `cloneWriteBarrier.ts`;
- nessuna modifica a upload/storage logic, route, PDF engine o madre legacy;
- intervento confinato a `NextManutenzioniPage.tsx`, `next-mappa-storico.css` e documentazione.

## Da ricordare nei prossimi passaggi
1. I tab non-mappa usano ora anche classi `.mx-*` nello stesso file CSS della mappa; mantenere il confine dentro `/next/manutenzioni`.
2. Eventuali affinamenti futuri dei tab non devono reintrodurre testi descrittivi lunghi o layout beige/generici.
3. Il modulo `Manutenzioni` resta `PARZIALE`; questa patch non riapre audit o modifiche business.
