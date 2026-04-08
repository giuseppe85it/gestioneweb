# Continuity Report - 2026-04-07 22:28

## Stato consegnato
- `/next/manutenzioni` usa ora solo 4 tab UI: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`.
- `Storico` non compare piu.
- Il tab `Dettaglio` riusa la logica esistente ma ha una resa a due card root reali.
- Il tab `Quadro manutenzioni PDF` resta elenco-first e il pulsante `Apri dettaglio` apre il tab `Dettaglio`.
- Il blocco `Tagliando completo` del form e condizionale al tipo intervento `Tagliando`.

## Perimetro rispettato
- Nessun file fuori whitelist toccato.
- Nessuna modifica a:
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/domain/nextMappaStoricoDomain.ts`
  - `src/utils/cloneWriteBarrier.ts`
  - writer business
  - route
  - PDF engine
  - storage logic

## Verifiche da ripetere se serve
- Aprire `http://127.0.0.1:4173/next/manutenzioni`.
- Verificare i 4 tab finali e l'assenza di `Storico`.
- Cercare `TI` nella ricerca rapida e controllare preview risultati.
- In `Nuova / Modifica`, selezionare `Tagliando` e verificare l'apparizione del blocco dedicato.
- In `Quadro manutenzioni PDF`, cliccare `Apri dettaglio` e verificare il focus sul tab `Dettaglio`.
